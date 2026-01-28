import { QueueOptions } from 'bullmq';

export const defaultQueueConfig: Omit<QueueOptions, 'connection'> = {
  defaultJobOptions: {
    attempts: 5,
    backoff: {
      type: 'exponential',
      delay: 1000, // 1s, 2s, 4s, 8s, 16s
    },
    removeOnComplete: 1000, // Keep last 1000 completed jobs
    removeOnFail: {
      age: 7 * 24 * 3600, // Keep failed jobs for 7 days
    },
  },
};
