import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DataSource } from 'typeorm';
import { User } from './entities/user.entity';
import { MeilisearchService } from './search/meilisearch.service';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const dataSource = app.get(DataSource);
  const userRepo = dataSource.getRepository(User);

  const existing = await userRepo.findOne({ where: { handle: 'devuser' } });
  let user: User;
  if (!existing) {
    user = userRepo.create({
      id: '550e8400-e29b-41d4-a716-446655440000', // Known UUID
      handle: 'devuser',
      displayName: 'Developer',
      bio: 'I build things.',
    });
    await userRepo.save(user);
    console.log('Seeded User:', user.id);
  } else {
    user = existing;
    console.log('User already exists:', existing.id);
  }

  try {
    const meilisearch = app.get(MeilisearchService);
    await meilisearch.indexUser({
      id: user.id,
      handle: user.handle,
      displayName: user.displayName,
      bio: user.bio ?? '',
    });
    console.log('Meilisearch: indexed user', user.handle);
  } catch (e) {
    console.warn('Meilisearch index (user) skipped:', (e as Error).message);
  }

  await app.close();
}
bootstrap();
