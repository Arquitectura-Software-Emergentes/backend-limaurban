import { plainToInstance } from 'class-transformer';
import {
  IsEnum,
  IsNumber,
  IsString,
  IsOptional,
  validateSync,
  ValidationError,
} from 'class-validator';

enum Environment {
  Development = 'development',
  Production = 'production',
  Test = 'test',
}

class EnvironmentVariables {
  @IsEnum(Environment)
  NODE_ENV!: Environment;

  @IsNumber()
  PORT!: number;

  @IsString()
  FRONTEND_URL!: string;

  @IsString()
  FRONTEND_URL_PRODUCTION!: string;

  @IsString()
  SUPABASE_URL!: string;

  @IsString()
  SUPABASE_ANON_KEY!: string;

  @IsString()
  SUPABASE_SERVICE_ROLE_KEY!: string;

  @IsString()
  SUPABASE_JWT_SECRET!: string;

  // Storage Configuration (optional - defaults to Supabase)
  @IsOptional()
  @IsString()
  STORAGE_BASE_URL?: string;

  @IsOptional()
  @IsEnum(['supabase', 'azure', 'aws', 's3'])
  STORAGE_PROVIDER?: string;

  @IsString()
  YOLO_API_URL!: string;

  @IsString()
  YOLO_API_CLIENT!: string;

  @IsString()
  YOLO_API_KEY!: string;
}

export function validate(
  config: Record<string, unknown>,
): EnvironmentVariables {
  const validatedConfig = plainToInstance(EnvironmentVariables, config, {
    enableImplicitConversion: true,
  });

  const errors: ValidationError[] = validateSync(validatedConfig, {
    skipMissingProperties: false,
  });

  if (errors.length > 0) {
    const errorMessages = errors
      .map((error) => Object.values(error.constraints || {}).join(', '))
      .join('; ');
    throw new Error(`Environment validation failed: ${errorMessages}`);
  }

  return validatedConfig;
}
