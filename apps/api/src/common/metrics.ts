import { Counter, Histogram } from 'prom-client';

// Ensure we don't re-register on hot reload (singleton pattern)
// In production node, this file loads once. In dev, might reload.
// prom-client throws if you register same name twice.
// A simple check or try-catch or 'register' lookup is needed.
// However, simplest is to let it throw in dev or use global.

// We will rely on node module caching.

export const workerJobCounter = new Counter({
  name: 'cite_worker_jobs_total',
  help: 'Total jobs processed by workers',
  labelNames: ['worker', 'status'],
});

export const workerJobDuration = new Histogram({
  name: 'cite_worker_duration_seconds',
  help: 'Job processing duration',
  labelNames: ['worker'],
});

export const moderationStageCounter = new Counter({
  name: 'cite_moderation_stage_total',
  help: 'Content moderation decisions by stage',
  labelNames: ['stage'],
});

export const moderationDuration = new Histogram({
  name: 'cite_moderation_duration_seconds',
  help: 'Content moderation check duration',
  labelNames: ['stage'],
});
