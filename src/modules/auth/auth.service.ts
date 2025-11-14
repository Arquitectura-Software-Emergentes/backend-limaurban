/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(private readonly supabaseService: SupabaseService) {}

  async login(loginDto: LoginDto) {
    try {
      const { data, error } = await this.supabaseService
        .getClient()
        .auth.signInWithPassword({
          email: loginDto.email,
          password: loginDto.password,
        });

      if (error) {
        this.logger.error('Login failed', error);
        throw new UnauthorizedException('Invalid email or password');
      }

      if (!data.session || !data.user) {
        throw new UnauthorizedException('Login failed');
      }

      // Get user profile with role
      const { data: userProfile } = await this.supabaseService
        .getClient()
        .from('users')
        .select('*, roles(code)')
        .eq('id', data.user.id)
        .single();

      return {
        success: true,
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
        user: {
          id: data.user.id,
          email: data.user.email,
          role: userProfile?.roles?.code || 'CITIZEN',
          full_name: userProfile?.full_name,
        },
        expires_in: data.session.expires_in,
      };
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      this.logger.error('Login error', error);
      throw new BadRequestException('Login failed');
    }
  }

  async register(registerDto: RegisterDto) {
    try {
      // Create auth user
      const { data: authData, error: authError } = await this.supabaseService
        .getClient()
        .auth.signUp({
          email: registerDto.email,
          password: registerDto.password,
          options: {
            data: {
              full_name: registerDto.full_name,
              phone: registerDto.phone,
            },
          },
        });

      if (authError) {
        this.logger.error('Registration failed', authError);
        if (authError.message.includes('already registered')) {
          throw new BadRequestException('Email already exists');
        }
        throw new BadRequestException(authError.message);
      }

      if (!authData.user) {
        throw new BadRequestException('Registration failed');
      }

      // Get CITIZEN role_id
      const { data: citizenRole } = await this.supabaseService
        .getClient()
        .from('roles')
        .select('role_id')
        .eq('code', 'CITIZEN')
        .single();

      if (!citizenRole) {
        throw new BadRequestException('CITIZEN role not found in database');
      }

      // Create user profile
      const { error: profileError } = await this.supabaseService
        .getClient()
        .from('users')
        .insert({
          id: authData.user.id,
          full_name: registerDto.full_name,
          phone: registerDto.phone,
          role_id: citizenRole.role_id,
        });

      if (profileError) {
        this.logger.error('Profile creation failed', profileError);
        throw new BadRequestException('Failed to create user profile');
      }

      return {
        success: true,
        message:
          'User registered successfully. Please check your email to confirm your account.',
        user: {
          id: authData.user.id,
          email: authData.user.email,
        },
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      this.logger.error('Registration error', error);
      throw new BadRequestException('Registration failed');
    }
  }

  async getUserProfile(userId: string) {
    try {
      const { data, error } = await this.supabaseService
        .getClient()
        .from('users')
        .select('*, roles(code, description)')
        .eq('id', userId)
        .single();

      if (error || !data) {
        throw new UnauthorizedException('User not found');
      }

      return {
        success: true,
        user: {
          id: data.id,
          email: data.email,
          full_name: data.full_name,
          phone: data.phone,
          avatar_url: data.avatar_url,
          role: data.roles?.code,
          role_description: data.roles?.description,
          is_active: data.is_active,
          created_at: data.created_at,
        },
      };
    } catch (error) {
      this.logger.error('Get profile error', error);
      throw new UnauthorizedException('Failed to get user profile');
    }
  }

  async refreshToken(refreshToken: string) {
    try {
      const { data, error } = await this.supabaseService
        .getClient()
        .auth.refreshSession({ refresh_token: refreshToken });

      if (error || !data.session) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      return {
        success: true,
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
        expires_in: data.session.expires_in,
      };
    } catch (error) {
      this.logger.error('Refresh token error', error);
      throw new UnauthorizedException('Failed to refresh token');
    }
  }
}
