import { DataSource } from 'typeorm';
import { config } from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

const envPath = path.join(__dirname, '../../../.env');
if (fs.existsSync(envPath)) {
  config({ path: envPath });
}

export default new DataSource({
  type: 'postgres',
  url:
    process.env.DATABASE_URL ||
    'postgresql://postgres:postgres@localhost:5433/postgres',
  entities: [path.join(__dirname, '../**/*.entity{.ts,.js}')],
  migrations: [path.join(__dirname, '../migrations/*{.ts,.js}')],
  synchronize: false,
  logging: true,
});
