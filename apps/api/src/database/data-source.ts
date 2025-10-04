import 'reflect-metadata';
import 'dotenv/config'; // o usa tsx --env-file; cualquiera de las dos
import { DataSource } from 'typeorm';
import { envSchema } from '../config/env.validation.js'; // en ESM apunta a .js
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// __dirname / __filename para ESM:
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Valida variables de entorno
const env = envSchema.parse(process.env);

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: env.DATABASE_HOST,
  port: Number(env.DATABASE_PORT),
  username: env.DATABASE_USER,
  password: env.DATABASE_PASSWORD,
  database: env.DATABASE_NAME,
  schema: undefined,
  synchronize: false,
  logging: false,
  entities: [
    join(__dirname, '..', 'modules', '**', '*.entity.{ts,js}'),
    join(__dirname, '..', 'modules', '**', '*.orm-entity.{ts,js}'),
  ],
  migrations: [join(__dirname, 'migrations', '*.{ts,js}')],
  ssl: env.DATABASE_SSL
    ? { rejectUnauthorized: env.DATABASE_SSL_REJECT_UNAUTHORIZED }
    : false,
});