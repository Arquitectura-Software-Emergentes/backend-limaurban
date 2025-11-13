import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { HealthService } from './health.service';

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get()
  @ApiOperation({
    summary: 'Health check endpoint',
    description:
      'Verifies backend status and Supabase connection. Returns service information and connection status.',
  })
  @ApiResponse({
    status: 200,
    description: 'Service is healthy',
    schema: {
      example: {
        status: 'ok',
        timestamp: '2025-11-13T18:30:00.000Z',
        service: 'LimaUrban Backend API',
        version: '1.0.0',
        environment: 'development',
        connections: {
          supabase: 'connected',
        },
      },
    },
  })
  @ApiResponse({
    status: 500,
    description: 'Service is unhealthy or Supabase connection failed',
  })
  async check() {
    return this.healthService.check();
  }
}
