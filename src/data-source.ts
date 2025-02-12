import { DataSource } from 'typeorm';
import { config } from 'dotenv';
config({ path: './env/.env.production' });

const databasePath = process.env.DATABASE_PATH;
if (!databasePath) {
  throw new Error("DATABASE_PATH not found in env vars, please ensure it's set.");
}

const AppDataSource = new DataSource({
  type: 'sqlite',
  database: databasePath,
  synchronize: false,
  entities: ['src/models/*.ts'],
  migrations: ['database/migrations/*.ts'],
  migrationsRun: false,
});

export default AppDataSource;