import { ApiProperty } from '@nestjs/swagger';

export class HeatmapResponseDto {
  @ApiProperty({
    description: 'Whether the request was successful',
    example: true,
  })
  success: boolean;

  @ApiProperty({
    description: 'Response data',
    example: {
      analysis_id: 'uuid-del-analisis',
      total_points: 150,
      max_intensity: 1.0,
      generated_at: '2025-11-15T19:51:13Z',
    },
  })
  data: {
    analysis_id: string;
    total_points: number;
    max_intensity: number;
    generated_at: string;
  };
}
