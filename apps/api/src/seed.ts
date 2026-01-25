import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DataSource } from 'typeorm';
import { User } from './entities/user.entity';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const dataSource = app.get(DataSource);
  const userRepo = dataSource.getRepository(User);

  const existing = await userRepo.findOne({ where: { handle: 'devuser' } });
  if (!existing) {
    const user = userRepo.create({
      id: '550e8400-e29b-41d4-a716-446655440000', // Known UUID
      handle: 'devuser',
      displayName: 'Developer',
      bio: 'I build things.',
    });
    await userRepo.save(user);
    console.log('Seeded User:', user.id);
  } else {
    console.log('User already exists:', existing.id);
  }

  await app.close();
}
bootstrap();
