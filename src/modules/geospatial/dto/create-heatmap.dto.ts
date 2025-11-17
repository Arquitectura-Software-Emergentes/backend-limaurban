import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsOptional, IsString } from 'class-validator';

export class CreateHeatmapDto {
  @ApiProperty({
    description: 'Start date for incident analysis',
    example: '2025-01-01T00:00:00Z',
    type: String,
  })
  @IsDateString()
  time_range_start: string;

  @ApiProperty({
    description: 'End date for incident analysis',
    example: '2025-11-15T23:59:59Z',
    type: String,
  })
  @IsDateString()
  time_range_end: string;

  @ApiPropertyOptional({
    description: 'Optional district code filter',
    example: 'SJLUR',
    type: String,
  })
  @IsOptional()
  @IsString()
  district_code?: string;
}
