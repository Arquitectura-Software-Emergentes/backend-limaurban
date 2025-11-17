import {
  Controller,
  Post,
  Body,
  UseGuards,
  UploadedFile,
  UseInterceptors,
  BadRequestException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { IncidentsService } from './incidents.service';
import { CreateIncidentDto } from './dto/create-incident.dto';
import { UploadPhotoResponseDto } from './dto/upload-photo.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('incidents')
@Controller('incidents')
export class IncidentsController {
  constructor(private readonly incidentsService: IncidentsService) {}

  @Post('upload-photo')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @UseInterceptors(FileInterceptor('photo'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary: '[TESTING] Upload photo to Supabase Storage',
    description:
      'Endpoint de prueba para subir foto a Supabase Storage y obtener URL pública. Requiere JWT de Supabase Auth.',
  })
  @ApiBody({
    description: 'Foto del incidente',
    schema: {
      type: 'object',
      properties: {
        photo: {
          type: 'string',
          format: 'binary',
          description: 'Archivo de imagen (JPG/PNG, max 5MB)',
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Photo uploaded successfully',
    type: UploadPhotoResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid file or upload failed' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async uploadPhoto(
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser() user: { userId: string },
  ): Promise<UploadPhotoResponseDto> {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    if (file.size > 5 * 1024 * 1024) {
      throw new BadRequestException('File too large (max 5MB)');
    }

    if (!['image/jpeg', 'image/png'].includes(file.mimetype)) {
      throw new BadRequestException('Only JPG/PNG files allowed');
    }

    const { photo_id, photo_url } = await this.incidentsService.uploadPhoto(
      file,
      user.userId,
    );

    return {
      success: true,
      photo_id,
      photo_url,
      message: 'Photo uploaded successfully',
    };
  }

  @Post('create')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: '[PRODUCTION] Create incident with YOLO detection',
    description:
      'Endpoint REAL para Flutter. Recibe photo_url (ya subida a Storage), coordenadas y descripción. Llama YOLO API, detecta distrito con PostGIS, y crea incidente completo.',
  })
  @ApiBody({
    description: 'Datos del incidente',
    type: CreateIncidentDto,
  })
  @ApiResponse({
    status: 201,
    description: 'Incident created successfully',
    schema: {
      example: {
        success: true,
        incident_id: '550e8400-e29b-41d4-a716-446655440000',
        photo_url:
          'https://vnahrflmnhhrixhkrgad.supabase.co/storage/v1/object/public/yolo_model/user123_1699999999.jpg',
        detected_category: 'bache',
        confidence: 0.93,
        category_code: 'POTHOLE',
        district_code: 'SJLUR',
        url_resultado:
          'https://res.cloudinary.com/xxx/yolo_annotated_550e8400.jpg',
        message: 'Incident created successfully',
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Invalid request data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async create(
    @Body() dto: CreateIncidentDto,
    @CurrentUser() user: { userId: string },
  ) {
    return this.incidentsService.create(dto, user.userId);
  }
}
