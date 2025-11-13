import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class SupabaseService implements OnModuleInit {
  private supabaseClient!: SupabaseClient;

  constructor(private configService: ConfigService) {}

  onModuleInit() {
    const supabaseUrl = this.configService.get<string>('SUPABASE_URL');
    const supabaseKey = this.configService.get<string>(
      'SUPABASE_SERVICE_ROLE_KEY',
    );

    if (!supabaseUrl || !supabaseKey) {
      throw new Error(
        'Missing Supabase credentials. Check SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env',
      );
    }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    this.supabaseClient = createClient(supabaseUrl, supabaseKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    console.log('Supabase Service Role Client initialized');
  }

  getClient(): SupabaseClient {
    return this.supabaseClient;
  }

  async verifyConnection(): Promise<boolean> {
    try {
      const { error } = await this.supabaseClient
        .from('users')
        .select('id')
        .limit(1);

      if (error) {
        console.error('Supabase connection error:', error.message);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Supabase connection failed:', error);
      return false;
    }
  }
}
