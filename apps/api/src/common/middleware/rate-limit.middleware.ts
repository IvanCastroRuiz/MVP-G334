import { Injectable, NestMiddleware } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request, Response, NextFunction } from 'express';
import { RateLimiterMemory } from 'rate-limiter-flexible';

@Injectable()
export class RateLimitMiddleware implements NestMiddleware {
  private readonly limiter: RateLimiterMemory;

  constructor(private readonly configService: ConfigService) {
    this.limiter = new RateLimiterMemory({
      points: Number(this.configService.get<string>('RATE_LIMIT_POINTS', '100')),
      duration: Number(this.configService.get<string>('RATE_LIMIT_DURATION', '60')),
    });
  }

  async use(req: Request, res: Response, next: NextFunction) {
    try {
      await this.limiter.consume(req.ip);
      next();
    } catch (error) {
      res.setHeader('Retry-After', String(error.msBeforeNext / 1000));
      res.status(429).json({
        statusCode: 429,
        message: 'Too many requests',
      });
    }
  }
}
