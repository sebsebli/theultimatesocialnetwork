/**
 * EventBus — Abstraction over job/event dispatch.
 *
 * Backed by Apache Kafka. Designed to be extensible to
 * AWS SQS/SNS, Google Pub/Sub, or any other message broker
 * by implementing this abstract class.
 *
 * Uses an abstract class instead of an interface so TypeScript can
 * emit decorator metadata for NestJS DI (required when
 * isolatedModules + emitDecoratorMetadata are enabled).
 */
export abstract class IEventBus {
  /**
   * Publish a job/event to a named topic.
   * @param topic  Topic name (e.g. 'post-processing')
   * @param event  Event/job type name (e.g. 'process')
   * @param data   Arbitrary JSON-serializable payload
   * @param opts   Optional: priority, delay, deduplication key
   */
  abstract publish<T = any>(
    topic: string,
    event: string,
    data: T,
    opts?: EventPublishOptions,
  ): Promise<void>;

  /**
   * Subscribe to events on a topic.
   * Called once at startup by each worker.
   * @param topic    Topic name
   * @param handler  Async function to process each event
   * @param opts     Optional: concurrency, group
   */
  abstract subscribe<T = any>(
    topic: string,
    handler: (event: string, data: T) => Promise<void>,
    opts?: EventSubscribeOptions,
  ): Promise<void>;

  /**
   * Gracefully shut down all connections.
   */
  abstract shutdown(): Promise<void>;
}

export interface EventPublishOptions {
  /** Job priority (lower = higher priority). Default: 0 */
  priority?: number;
  /** Delay before processing (ms). Default: 0 */
  delay?: number;
  /** Deduplication key. If set, duplicate events with same key within dedup window are dropped. */
  deduplicationKey?: string;
}

export interface EventSubscribeOptions {
  /** Number of concurrent handlers per worker instance. Default: 5 */
  concurrency?: number;
  /** Consumer group name (for Kafka). Defaults to topic name. */
  group?: string;
}

/** Provider token for DI */
export const EVENT_BUS = 'EVENT_BUS';
