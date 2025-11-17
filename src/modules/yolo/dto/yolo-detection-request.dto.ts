import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsUrl, IsUUID } from 'class-validator';

export class YoloDetectionRequestDto {
  @ApiProperty({
    description: 'UUID del incidente (uuid_consulta en YOLO API)',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsUUID()
  uuid_consulta: string;

  @ApiProperty({
    description: 'URL de la imagen a analizar (debe ser pública)',
    example: 'https://i.ibb.co/ycKtjD3N/bache-01.jpg',
  })
  @IsUrl()
  @IsString()
  url_imagen: string;
}
