import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { config } from 'dotenv';
import { envSchema } from '../config/env.validation.js';
import { join } from 'path';

config({ path: process.env.NODE_ENV === 'test' ? '.env.test' : '.env' });

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
    join(__dirname, '../modules/**/*.entity.{ts,js}'),
    join(__dirname, '../modules/**/*.orm-entity.{ts,js}'),
  ],
  migrations: [join(__dirname, './migrations/*.{ts,js}')],
});
