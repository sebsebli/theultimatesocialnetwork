import { Counter, Histogram, Gauge } from 'prom-client';

// Ensure we don't re-register on hot reload (singleton pattern)
// In production node, this file loads once. In dev, might reload.
// prom-client throws if you register same name twice.
// A simple check or try-catch or 'register' lookup is needed.
// However, simplest is to let it throw in dev or use global.

// We will rely on node module caching.

// ── HTTP Request Metrics ──
export const httpRequestDuration = new Histogram({
  name: 'cite_http_request_duration_seconds',
  help: 'HTTP request duration in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.01, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
});

export const httpRequestTotal = new Counter({
  name: 'cite_http_requests_total',
  help: 'Total HTTP requests',
  labelNames: ['method', 'route', 'status_code'],
});

export const httpErrorTotal = new Counter({
  name: 'cite_http_errors_total',
  help: 'Total HTTP error responses (4xx, 5xx)',
  labelNames: ['method', 'route', 'status_code'],
});

// ── WebSocket Metrics ──
export const wsConnectionsActive = new Gauge({
  name: 'cite_ws_connections_active',
  help: 'Currently active WebSocket connections',
});

export const wsConnectionsTotal = new Counter({
  name: 'cite_ws_connections_total',
  help: 'Total WebSocket connections',
  labelNames: ['status'], // 'connected', 'rejected', 'disconnected'
});

// ── Circuit Breaker Metrics ──
export const circuitBreakerState = new Gauge({
  name: 'cite_circuit_breaker_state',
  help: 'Circuit breaker state (0=closed, 1=half_open, 2=open)',
  labelNames: ['name'],
});

export const circuitBreakerTrips = new Counter({
  name: 'cite_circuit_breaker_trips_total',
  help: 'Number of times circuit breaker opened',
  labelNames: ['name'],
});

// ── Database Pool Metrics ──
export const dbPoolActive = new Gauge({
  name: 'cite_db_pool_active_connections',
  help: 'Active database connections in pool',
});

export const dbPoolIdle = new Gauge({
  name: 'cite_db_pool_idle_connections',
  help: 'Idle database connections in pool',
});

// ── Worker & Job Metrics ──
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

export const feedDuration = new Histogram({
  name: 'cite_feed_duration_seconds',
  help: 'Feed generation duration',
  labelNames: ['type'], // 'home', 'explore'
});
