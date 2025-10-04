import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { AuthRbacModule } from './modules/auth-rbac/auth-rbac.module.js';
import { CrmModule } from './modules/crm/crm.module.js';
import { RateLimitMiddleware } from './common/middleware/rate-limit.middleware.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      envFilePath: ['.env'],
    }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get('DATABASE_HOST'),
        port: Number(config.get('DATABASE_PORT')),
        username: config.get('DATABASE_USER'),
        password: config.get('DATABASE_PASSWORD'),
        database: config.get('DATABASE_NAME'),
        autoLoadEntities: true,
        synchronize: false,
        migrations: [join(__dirname, 'database', 'migrations', '*.{ts,js}')],
        ssl: config.get<boolean>('DATABASE_SSL')
          ? { rejectUnauthorized: config.get<boolean>('DATABASE_SSL_REJECT_UNAUTHORIZED') }
          : false,
        }),
    }),
    AuthRbacModule,
    CrmModule,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RateLimitMiddleware).forRoutes('*');
  }
}