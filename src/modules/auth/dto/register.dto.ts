import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsString,
  MinLength,
  IsOptional,
  Matches,
} from 'class-validator';

export class RegisterDto {
  @ApiProperty({
    description: 'User email address',
    example: 'juan.perez@example.com',
  })
  @IsEmail({}, { message: 'Invalid email format' })
  email: string;

  @ApiProperty({
    description: 'User password (min 6 characters)',
    example: 'SecurePassword123!',
    minLength: 6,
  })
  @IsString()
  @MinLength(6, { message: 'Password must be at least 6 characters' })
  password: string;

  @ApiProperty({
    description: 'User full name',
    example: 'Juan Pérez García',
  })
  @IsString()
  @MinLength(2, { message: 'Full name must be at least 2 characters' })
  full_name: string;

  @ApiProperty({
    description: 'Phone number (optional, Peruvian format)',
    example: '+51987654321',
    required: false,
  })
  @IsOptional()
  @IsString()
  @Matches(/^\+51\d{9}$/, {
    message: 'Phone must be in format +51XXXXXXXXX',
  })
  phone?: string;
}
