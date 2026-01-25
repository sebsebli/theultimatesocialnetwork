# Known Issues & Solutions

## Issues Found During Deployment Setup

### 1. ✅ Fixed: ts-node Not Available in Production

**Issue**: The seeder script (`seed-comprehensive.ts`) uses `ts-node` which is a dev dependency, but the production Dockerfile only installed production dependencies.

**Solution**: Updated Dockerfile to install `ts-node`, `typescript`, and `@types/node` as dev dependencies in the production stage. This is acceptable since seeding is a necessary operational task.

**Status**: ✅ Fixed

### 2. ⚠️ Potential: No Database Migrations

**Issue**: The migration path references `../migrations/*{.ts,.js}` but no migrations directory exists in the codebase.

**Impact**: 
- If you're using `synchronize: true` in development, this is fine
- For production, you should create migrations before deploying

**Solution**: 
- The deployment script handles this gracefully (warns but continues)
- For production, create migrations: `pnpm migration:generate -n InitialSchema`
- Or ensure `synchronize: false` and create migrations manually

**Status**: ⚠️ Expected behavior (no migrations exist yet)

### 3. ℹ️ Note: Volume Mounts in docker-compose.yml

**Issue**: The docker-compose.yml includes volume mounts for development (`../../apps/api:/app/apps/api`).

**Impact**: 
- Fine for development/testing
- Not ideal for true production (should use built images only)

**Solution**: 
- For development: Keep as is
- For production: Remove volume mounts and rely on built images only

**Status**: ℹ️ By design (works for development)

### 4. ⚠️ Potential: Authentication Token in Tests

**Issue**: The test script (`test-all-endpoints.sh`) requires authentication for many endpoints but may not have a valid token.

**Impact**: 
- Some tests will fail if `DEV_TOKEN` is not set
- Tests that don't require auth will still pass

**Solution**: 
- Set `DEV_TOKEN` environment variable before running tests
- Or use the magic link flow to get a real token
- The script handles missing tokens gracefully (warns and continues)

**Status**: ⚠️ Expected behavior (tests will warn about missing auth)

### 5. ℹ️ Note: Database Connection in Seeder

**Issue**: The seeder uses `NestFactory.createApplicationContext` which requires all services to be available.

**Impact**: 
- Seeder must run after database is ready
- All dependencies (Neo4j, Redis, etc.) should be available

**Solution**: 
- Deployment script waits for services to be healthy
- Seeder runs after migrations
- This is the correct order

**Status**: ℹ️ By design (correct order)

## Testing Recommendations

Before deploying to production:

1. **Test locally first**:
   ```bash
   ./scripts/deploy-production.sh
   ```

2. **Verify all services are healthy**:
   ```bash
   docker compose ps
   curl http://localhost:3000/health
   ```

3. **Check test results**:
   ```bash
   ./scripts/test-all-endpoints.sh
   ```

4. **Verify seeded data**:
   ```bash
   curl http://localhost:3000/users/suggested
   curl http://localhost:3000/feed
   ```

## Production Deployment Checklist

- [ ] Create database migrations (if not using synchronize)
- [ ] Set all environment variables
- [ ] Remove volume mounts from docker-compose.yml (for true production)
- [ ] Set up SSL/TLS (Caddy or nginx)
- [ ] Configure backups
- [ ] Set up monitoring
- [ ] Test authentication flow
- [ ] Verify all endpoints work
- [ ] Load test critical endpoints
- [ ] Set up error tracking

## Quick Fixes

If you encounter issues:

1. **Seeder fails**: Check database connection and ensure all services are running
2. **Tests fail**: Set `DEV_TOKEN` or check API is accessible
3. **Build fails**: Check Docker has enough resources (4GB+ RAM recommended)
4. **Services won't start**: Check port conflicts and Docker logs

## Support

For issues:
- Check logs: `docker compose logs -f api`
- Check service status: `docker compose ps`
- Review test output: `./scripts/test-all-endpoints.sh`
