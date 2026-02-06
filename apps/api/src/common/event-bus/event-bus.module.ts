import { Module, Global } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { EVENT_BUS } from './event-bus.interface';
import { KafkaEventBus } from './kafka-event-bus';

/**
 * EventBusModule — Provides the EVENT_BUS token globally.
 *
 * Uses Apache Kafka as the sole event streaming backbone.
 * Configure via KAFKA_BROKERS env var (default: kafka:9092).
 *
 * All services inject EVENT_BUS and are driver-agnostic.
 */
@Global()
@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: EVENT_BUS,
      useFactory: (config: ConfigService) => {
        const brokers = config
          .get<string>('KAFKA_BROKERS')
          ?.split(',')
          .map((b) => b.trim())
          .filter(Boolean) || ['kafka:9092'];
        return new KafkaEventBus(brokers);
      },
      inject: [ConfigService],
    },
  ],
  exports: [EVENT_BUS],
})
export class EventBusModule {}
