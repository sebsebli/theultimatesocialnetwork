# Production Readiness Improvements

The following improvements have been identified to make the system production-ready.

## High Priority (Security & Config)

- [x] **Environment Variable Validation**: implemented using `Joi` in `AppModule`.
- [ ] **CORS Configuration**: Restrict `origin` in `main.ts` and `RealtimeGateway` to production domains only (currently `'*'` or default).
- [ ] **SSL/TLS**: Ensure Database SSL uses `rejectUnauthorized: true` in production with proper CA certificates.

## Medium Priority (Resilience)

- [ ] **Neo4j Reconnection**: Implement retry logic in `Neo4jService` to handle temporary database outages.
- [ ] **Queue Dead Letter Queues**: Configure BullMQ to move failed jobs to a specific queue for manual inspection.
- [ ] **Rate Limiting**: Verify Throttler limits are appropriate for production traffic.

## Low Priority (Performance & Maintainability)

- [ ] **Performance Audit**: Check for N+1 queries in `RecommendationService` and `PostsService`.
- [ ] **E2E Tests**: Expand test coverage in `test/` directory.
