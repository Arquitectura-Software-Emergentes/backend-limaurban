import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNumber,
  IsUrl,
  IsUUID,
  IsLatitude,
  IsLongitude,
  MinLength,
  MaxLength,
} from 'class-validator';

export class CreateIncidentDto {
  @ApiProperty({
    description: 'UUID del incidente (generado en Flutter)',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsUUID()
  incident_id: string;

  @ApiProperty({
    description: 'URL de la foto subida a Supabase Storage',
    example:
      'https://vnahrflmnhhrixhkrgad.supabase.co/storage/v1/object/public/incidents/550e8400.jpg',
  })
  @IsUrl()
  photo_url: string;

  @ApiProperty({
    description: 'Latitud de la ubicación del incidente',
    example: -12.0464,
    minimum: -90,
    maximum: 90,
  })
  @IsNumber()
  @IsLatitude()
  latitude: number;

  @ApiProperty({
    description: 'Longitud de la ubicación del incidente',
    example: -77.0428,
    minimum: -180,
    maximum: 180,
  })
  @IsNumber()
  @IsLongitude()
  longitude: number;

  @ApiProperty({
    description: 'Descripción del incidente',
    example: 'Bache grande en Av. Próceres de la Independencia',
    minLength: 10,
    maxLength: 500,
  })
  @IsString()
  @MinLength(10)
  @MaxLength(500)
  description: string;
}
