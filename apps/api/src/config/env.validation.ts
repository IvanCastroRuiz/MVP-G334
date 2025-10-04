import { z } from 'zod';

export const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  API_PORT: z.string().default('3000'),
  API_GLOBAL_PREFIX: z.string().default('/api/v1'),
  DATABASE_HOST: z.string().default('127.0.0.1'),
  DATABASE_PORT: z.string().default('5432'),
  DATABASE_NAME: z.string(),
  DATABASE_USER: z.string(),
  DATABASE_PASSWORD: z.string(),
  JWT_ACCESS_SECRET: z.string(),
  JWT_REFRESH_SECRET: z.string(),
  JWT_ACCESS_TTL: z.string().default('900s'),
  JWT_REFRESH_TTL: z.string().default('30d'),
  RATE_LIMIT_POINTS: z.string().default('100'),
  RATE_LIMIT_DURATION: z.string().default('60'),
  CORS_ORIGINS: z.string().default('http://localhost:5173'),
});

export type EnvConfig = z.infer<typeof envSchema>;
