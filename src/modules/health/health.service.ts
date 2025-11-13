import { Injectable } from '@nestjs/common';

@Injectable()
export class HealthService {
  check() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'backend-limaurban',
      version: '1.0.0',
      environment: process.env.NODE_ENV,
    };
  }
}
