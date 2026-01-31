# Neo4j Data Sync - Update

## Current Status

**Yes, data is available in Neo4j!** But it's incomplete.

### What's Currently in Neo4j:
- ✅ **155 Posts** - Synced when created via API
- ✅ **42 Users** - Some synced
- ✅ **6 Topics** - Some synced
- ✅ **Relationships**:
  - 155 AUTHORED (User -> Post)
  - 17 QUOTES (Post -> Post)
  - 12 FOLLOWS (User -> User)
  - 8 IN_TOPIC (Post -> Topic)
  - 4 LINKS_TO (Post -> Post)

### What's Missing:
- ❌ Users created by seeding script
- ❌ Topics created by seeding script
- ❌ Posts created by seeding script
- ❌ Post edges (QUOTE, LINK) created by seeding script
- ❌ Follow relationships created by seeding script
- ❌ Post-Topic relationships created by seeding script

## The Problem

Data created through the **API** (users, posts, topics, etc.) automatically syncs to Neo4j.

## The Solution

I've updated the seeding script to also sync data to Neo4j:

1. **Users** → Creates User nodes in Neo4j
2. **Topics** → Creates Topic nodes in Neo4j
3. **Posts** → Creates Post nodes and AUTHORED relationships
4. **Post-Topic** → Creates IN_TOPIC relationships
5. **Post Edges** → Creates QUOTES and LINKS_TO relationships
6. **Follows** → Creates FOLLOWS relationships

## How to Apply

Re-run the seeding script and it will now sync everything to Neo4j:

```bash
cd apps/api
DATABASE_URL="postgres://postgres:postgres@localhost:5433/postgres" \
NEO4J_URI="bolt://localhost:7687" \
NEO4J_USER="neo4j" \
NEO4J_PASSWORD="password" \
# ... other env vars ...
pnpm seed:comprehensive
```

Or from Docker:

```bash
docker compose -f infra/docker/docker-compose.yml exec api pnpm seed:comprehensive
```

## Verify Neo4j Data

After re-seeding, check Neo4j:

```bash
# Count all nodes
docker compose -f infra/docker/docker-compose.yml exec neo4j cypher-shell -u neo4j -p password "MATCH (n) RETURN labels(n) as labels, count(n) as count;"

# Check relationships
docker compose -f infra/docker/docker-compose.yml exec neo4j cypher-shell -u neo4j -p password "MATCH (n)-[r]->(m) RETURN type(r) as rel_type, count(r) as count ORDER BY count DESC;"

# Check post relationships
docker compose -f infra/docker/docker-compose.yml exec neo4j cypher-shell -u neo4j -p password "MATCH (p:Post)-[r]->(q:Post) RETURN type(r), count(r);"
```

## Expected Results After Re-seeding

- **50 Users** (all synced to Neo4j)
- **20 Topics** (all synced to Neo4j)
- **200 Posts** (all synced to Neo4j)
- **~60 Post Edges** (QUOTES + LINKS_TO synced)
- **~100 Follows** (all synced to Neo4j)
- **~100 Post-Topic relationships** (IN_TOPIC synced)

## Neo4j Browser

You can also view the data visually:

1. Open http://localhost:7474
2. Login: `neo4j` / `password`
3. Run queries like:
   ```cypher
   MATCH (u:User)-[:AUTHORED]->(p:Post)
   RETURN u, p
   LIMIT 10
   ```

   ```cypher
   MATCH (p1:Post)-[:QUOTES]->(p2:Post)
   RETURN p1, p2
   LIMIT 10
   ```

   ```cypher
   MATCH (u1:User)-[:FOLLOWS]->(u2:User)
   RETURN u1, u2
   LIMIT 10
   ```

## Summary

✅ **Data exists in Neo4j** (from API-created posts)
✅ **Seeding script updated** to sync to Neo4j
⏳ **Re-run seeding** to populate Neo4j with all test data

After re-seeding, you'll have complete graph data in Neo4j for all algorithms (deep dives, link chains, etc.)!
