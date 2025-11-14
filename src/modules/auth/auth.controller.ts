import { Controller, Post, Body, Get, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { CurrentUser } from './decorators/current-user.decorator';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @ApiOperation({
    summary: 'Login with email and password',
    description:
      'Authenticate user with Supabase Auth and return JWT access token.',
  })
  @ApiResponse({
    status: 200,
    description: 'Login successful',
    schema: {
      example: {
        success: true,
        access_token: 'eyJhbGci...',
        refresh_token: 'eyJhbGci...',
        user: {
          id: 'uuid',
          email: 'user@example.com',
          role: 'CITIZEN',
        },
        expires_in: 3600,
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Post('register')
  @ApiOperation({
    summary: 'Register new user',
    description:
      'Create new user account in Supabase Auth. User is automatically assigned CITIZEN role.',
  })
  @ApiResponse({
    status: 201,
    description: 'User registered successfully',
    schema: {
      example: {
        success: true,
        message: 'User registered successfully',
        user: {
          id: 'uuid',
          email: 'user@example.com',
        },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Email already exists' })
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Get current user profile',
    description:
      'Retrieve authenticated user profile information including role.',
  })
  @ApiResponse({
    status: 200,
    description: 'User profile retrieved',
    schema: {
      example: {
        success: true,
        user: {
          id: 'uuid',
          email: 'user@example.com',
          full_name: 'Juan Pérez',
          role: 'CITIZEN',
          phone: '+51987654321',
          avatar_url: 'https://...',
          created_at: '2025-01-01T00:00:00Z',
        },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getProfile(@CurrentUser() user: { userId: string; email: string }) {
    return this.authService.getUserProfile(user.userId);
  }

  @Post('refresh')
  @ApiOperation({
    summary: 'Refresh access token',
    description:
      'Get new access token using refresh token when current token expires.',
  })
  @ApiResponse({
    status: 200,
    description: 'Token refreshed successfully',
    schema: {
      example: {
        success: true,
        access_token: 'eyJhbGci...',
        refresh_token: 'eyJhbGci...',
        expires_in: 3600,
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Invalid refresh token' })
  async refreshToken(@Body() body: { refresh_token: string }) {
    return this.authService.refreshToken(body.refresh_token);
  }
}
