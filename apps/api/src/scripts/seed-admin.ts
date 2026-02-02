import { DataSource } from 'typeorm';
import { User } from '../entities/user.entity';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const dataSource = app.get(DataSource);
  const email = process.argv[2];

  if (!email) {
    console.error('Usage: npm run seed:admin <email>');
    process.exit(1);
  }

  const userRepo = dataSource.getRepository(User);
  const user = await userRepo.findOne({ where: { email } });

  if (!user) {
    console.error(`User with email ${email} not found.`);
    process.exit(1);
  }

  user.role = 'admin';
  await userRepo.save(user);

  console.log(`User ${email} is now an ADMIN.`);
  await app.close();
}

void bootstrap().catch((err) => {
  console.error(err);
  process.exit(1);
});
