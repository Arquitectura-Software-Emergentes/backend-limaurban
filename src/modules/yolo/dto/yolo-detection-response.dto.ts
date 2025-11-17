import { ApiProperty } from '@nestjs/swagger';

export class YoloDetectionResponseDto {
  @ApiProperty({
    description: 'Estado del análisis',
    example: 'completado',
  })
  estado: string;

  @ApiProperty({
    description: 'UUID de la consulta',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  uuid_consulta: string;

  @ApiProperty({
    description: 'Mensaje de respuesta',
    example: 'Análisis procesado exitosamente',
    required: false,
  })
  message?: string;

  @ApiProperty({
    description: 'Indica si la operación fue exitosa',
    example: true,
    required: false,
  })
  success?: boolean;

  @ApiProperty({
    description: 'Timestamp de creación',
    example: '2025-11-09T04:47:48.253398',
    required: false,
  })
  created_at?: string;
}
