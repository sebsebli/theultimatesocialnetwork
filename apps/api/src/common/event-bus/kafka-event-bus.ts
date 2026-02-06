import { Logger } from '@nestjs/common';
import {
  Kafka,
  Producer,
  Consumer,
  Admin,
  logLevel,
  CompressionTypes,
} from 'kafkajs';
import type {
  EventPublishOptions,
  EventSubscribeOptions,
} from './event-bus.interface';
import { IEventBus } from './event-bus.interface';

/**
 * Kafka implementation of the EventBus.
 *
 * Each queue/topic maps to a Kafka topic. A single shared producer publishes
 * all events; each subscribe() call creates a dedicated Consumer in a
 * consumer-group (group = queue name by default, configurable via opts.group).
 *
 * Messages are JSON-encoded with { event, data, timestamp }. Kafka handles
 * partitioning, offset management, and consumer rebalancing natively.
 *
 * Topics are auto-created via the Admin client on first subscribe/publish.
 */
export class KafkaEventBus extends IEventBus {
  private readonly logger = new Logger(KafkaEventBus.name);
  private readonly kafka: Kafka;
  private producer: Producer | null = null;
  private admin: Admin | null = null;
  private readonly consumers: Consumer[] = [];
  private producerReady = false;
  private readonly ensuredTopics = new Set<string>();
  private readonly numPartitions: number;

  constructor(brokers: string[], clientId = 'citewalk-api', numPartitions = 6) {
    super();
    this.numPartitions = numPartitions;
    this.kafka = new Kafka({
      clientId,
      brokers,
      logLevel: logLevel.WARN,
      retry: {
        initialRetryTime: 500,
        retries: 10,
      },
    });
    this.logger.log(
      `EventBus initialized with Kafka driver (brokers: ${brokers.join(', ')}).`,
    );
  }

  /**
   * Ensure a topic exists before producing or consuming.
   * Uses the Admin client to create topics idempotently.
   */
  private async ensureTopic(topic: string): Promise<void> {
    if (this.ensuredTopics.has(topic)) return;

    if (!this.admin) {
      this.admin = this.kafka.admin();
      await this.admin.connect();
    }

    try {
      await this.admin.createTopics({
        waitForLeaders: true,
        topics: [
          {
            topic,
            numPartitions: this.numPartitions,
            replicationFactor: 1,
          },
        ],
      });
      this.logger.log(
        `Topic '${topic}' ensured (${this.numPartitions} partitions).`,
      );
    } catch (err) {
      // Topic may already exist — that's fine
      if (
        !(err as Error).message?.includes('already exists') &&
        !(err as Error).message?.includes('TOPIC_ALREADY_EXISTS')
      ) {
        this.logger.warn(
          `Failed to create topic '${topic}' (may already exist): ${(err as Error).message}`,
        );
      }
    }

    this.ensuredTopics.add(topic);
  }

  private async getProducer(): Promise<Producer> {
    if (!this.producer) {
      this.producer = this.kafka.producer({
        allowAutoTopicCreation: true,
        idempotent: false,
      });
    }
    if (!this.producerReady) {
      await this.producer.connect();
      this.producerReady = true;
      this.logger.log('Kafka producer connected.');
    }
    return this.producer;
  }

  async publish<T = any>(
    topic: string,
    event: string,
    data: T,
    opts?: EventPublishOptions,
  ): Promise<void> {
    await this.ensureTopic(topic);
    const producer = await this.getProducer();
    const value = JSON.stringify({ event, data, timestamp: Date.now() });

    await producer.send({
      topic,
      compression: CompressionTypes.GZIP,
      messages: [
        {
          key: opts?.deduplicationKey ?? null,
          value,
          headers: {
            event,
            ...(opts?.priority != null
              ? { priority: String(opts.priority) }
              : {}),
          },
        },
      ],
    });
  }

  async subscribe<T = any>(
    topic: string,
    handler: (event: string, data: T) => Promise<void>,
    opts?: EventSubscribeOptions,
  ): Promise<void> {
    // Ensure topic exists before subscribing
    await this.ensureTopic(topic);

    const groupId = opts?.group ?? topic;
    const consumer = this.kafka.consumer({
      groupId,
      sessionTimeout: 30000,
      heartbeatInterval: 3000,
      retry: {
        initialRetryTime: 1000,
        retries: 10,
      },
    });

    await consumer.connect();
    await consumer.subscribe({ topic, fromBeginning: false });

    await consumer.run({
      eachMessage: async ({ message, partition }) => {
        try {
          const parsed = JSON.parse(message.value?.toString() ?? '{}') as {
            event: string;
            data: unknown;
          };
          await handler(parsed.event ?? 'unknown', parsed.data as T);
        } catch (err) {
          this.logger.error(
            `Error processing message on ${topic}[${partition}]: ${(err as Error).message}`,
          );
          // Don't rethrow — offset is committed. DLQ can be added later.
        }
      },
    });

    this.consumers.push(consumer);
    this.logger.log(`Subscribed to '${topic}' (Kafka, group=${groupId}).`);
  }

  async shutdown(): Promise<void> {
    this.logger.log('Shutting down Kafka EventBus...');
    const tasks: Promise<void>[] = [];

    for (const consumer of this.consumers) {
      tasks.push(consumer.disconnect());
    }
    if (this.producer) {
      tasks.push(this.producer.disconnect());
    }
    if (this.admin) {
      tasks.push(this.admin.disconnect());
    }

    await Promise.allSettled(tasks);
    this.producerReady = false;
    this.logger.log('Kafka EventBus shut down.');
  }
}
