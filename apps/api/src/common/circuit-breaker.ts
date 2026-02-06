/**
 * Simple circuit breaker implementation for external service calls.
 * States: CLOSED (normal), OPEN (failing, reject calls), HALF_OPEN (testing recovery).
 *
 * When consecutive failures reach the threshold, the circuit opens.
 * After a cooldown period, it enters half-open state and allows one test call.
 * If the test call succeeds, the circuit closes. If it fails, the circuit reopens.
 */

import { circuitBreakerState, circuitBreakerTrips } from './metrics';

export enum CircuitState {
  CLOSED = 'CLOSED',
  OPEN = 'OPEN',
  HALF_OPEN = 'HALF_OPEN',
}

const STATE_VALUES: Record<CircuitState, number> = {
  [CircuitState.CLOSED]: 0,
  [CircuitState.HALF_OPEN]: 1,
  [CircuitState.OPEN]: 2,
};

export interface CircuitBreakerOptions {
  /** Number of consecutive failures before opening the circuit. Default: 5 */
  failureThreshold?: number;
  /** Time in ms to wait before transitioning from OPEN to HALF_OPEN. Default: 30000 (30s) */
  cooldownMs?: number;
  /** Name for logging purposes. */
  name?: string;
  /** Optional logger (e.g. NestJS Logger instance). Falls back to console. */
  logger?: {
    warn: (...args: unknown[]) => void;
    log: (...args: unknown[]) => void;
  };
}

export class CircuitBreaker {
  private state: CircuitState = CircuitState.CLOSED;
  private failureCount = 0;
  private lastFailureTime = 0;
  private readonly failureThreshold: number;
  private readonly cooldownMs: number;
  private readonly name: string;
  private readonly logger: {
    warn: (...args: unknown[]) => void;
    log: (...args: unknown[]) => void;
  };

  constructor(options: CircuitBreakerOptions = {}) {
    this.failureThreshold = options.failureThreshold ?? 5;
    this.cooldownMs = options.cooldownMs ?? 30000;
    this.name = options.name ?? 'CircuitBreaker';
    this.logger = options.logger ?? console;
    // Initialize metric
    circuitBreakerState.set({ name: this.name }, STATE_VALUES[this.state]);
  }

  /** Execute an async function through the circuit breaker. Throws CircuitOpenError if circuit is open. */
  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === CircuitState.OPEN) {
      const elapsed = Date.now() - this.lastFailureTime;
      if (elapsed >= this.cooldownMs) {
        // Transition to half-open
        this.transitionTo(CircuitState.HALF_OPEN);
      } else {
        throw new CircuitOpenError(
          `${this.name}: Circuit is OPEN. Retry after ${Math.ceil((this.cooldownMs - elapsed) / 1000)}s`,
        );
      }
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  /** Execute with fallback: if circuit is open or call fails, return fallback value. */
  async executeWithFallback<T>(fn: () => Promise<T>, fallback: T): Promise<T> {
    try {
      return await this.execute(fn);
    } catch {
      return fallback;
    }
  }

  private transitionTo(newState: CircuitState): void {
    if (this.state === newState) return;
    const oldState = this.state;
    this.state = newState;
    circuitBreakerState.set({ name: this.name }, STATE_VALUES[newState]);
    this.logger.log(
      `[${this.name}] Circuit transition: ${oldState} → ${newState}`,
    );
    if (newState === CircuitState.OPEN) {
      circuitBreakerTrips.inc({ name: this.name });
      this.logger.warn(
        `[${this.name}] Circuit OPENED after ${this.failureCount} consecutive failures`,
      );
    }
  }

  private onSuccess(): void {
    if (this.state === CircuitState.HALF_OPEN) {
      this.logger.log(
        `[${this.name}] Half-open test succeeded, closing circuit`,
      );
    }
    this.failureCount = 0;
    this.transitionTo(CircuitState.CLOSED);
  }

  private onFailure(): void {
    this.failureCount++;
    this.lastFailureTime = Date.now();
    if (this.failureCount >= this.failureThreshold) {
      this.transitionTo(CircuitState.OPEN);
    }
  }

  getState(): CircuitState {
    return this.state;
  }

  /** Manually reset the circuit breaker. */
  reset(): void {
    this.transitionTo(CircuitState.CLOSED);
    this.failureCount = 0;
    this.lastFailureTime = 0;
  }
}

export class CircuitOpenError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CircuitOpenError';
  }
}
