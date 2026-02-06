/**
 * Re-extract sources (posts, topics, external URLs, mentions) from all post bodies.
 * Run after fixing markdown/wikilink parsing so existing posts get correct tags.
 *
 * Usage: npm run script:re-extract-sources
 * Or: npx ts-node -r tsconfig-paths/register src/scripts/re-extract-post-sources.ts
 */
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { PostsService } from '../posts/posts.service';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['log', 'warn', 'error'],
  });
  const postsService = app.get(PostsService);
  console.log('Re-extracting sources for all posts...');
  const { processed, errors } = await postsService.reExtractAllPostsSources();
  console.log(`Done. Processed: ${processed}, Errors: ${errors}`);
  await app.close();
  process.exit(errors > 0 ? 1 : 0);
}

void bootstrap().catch((err) => {
  console.error(err);
  process.exit(1);
});
