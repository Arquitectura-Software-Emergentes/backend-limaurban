import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';

@Injectable()
export class HealthService {
  constructor(private readonly supabaseService: SupabaseService) {}

  async check() {
    const supabaseConnected = await this.supabaseService.verifyConnection();

    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'backend-limaurban',
      version: '1.0.0',
      environment: process.env.NODE_ENV,
      connections: {
        supabase: supabaseConnected ? 'connected' : 'disconnected',
      },
    };
  }
}
