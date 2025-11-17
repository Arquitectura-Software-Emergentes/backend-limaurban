import { ApiProperty } from '@nestjs/swagger';

export class UploadPhotoResponseDto {
  @ApiProperty({
    description: 'Indica si el upload fue exitoso',
    example: true,
  })
  success: boolean;

  @ApiProperty({
    description: 'UUID generado para la foto',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  photo_id: string;

  @ApiProperty({
    description: 'URL pública de la foto en Supabase Storage',
    example:
      'https://vnahrflmnhhrixhkrgad.supabase.co/storage/v1/object/public/incidents/550e8400.jpg',
  })
  photo_url: string;

  @ApiProperty({
    description: 'Mensaje informativo',
    example: 'Photo uploaded successfully',
  })
  message: string;
}
