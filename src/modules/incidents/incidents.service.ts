/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import {
  Injectable,
  BadRequestException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SupabaseService } from '../supabase/supabase.service';
import { YoloService } from '../yolo/yolo.service';
import { StorageService } from '../storage/storage.service';
import { StorageBucket } from '../storage/interfaces/storage.interface';
import { CreateIncidentDto } from './dto/create-incident.dto';
import {
  IncidentCreateResponse,
  DistrictDetectionResult,
} from './interfaces/incident.interface';
import { YOLO_CATEGORY_MAP } from '../yolo/constants/yolo-categories.constant';

@Injectable()
export class IncidentsService {
  private readonly logger = new Logger(IncidentsService.name);

  constructor(
    private readonly supabaseService: SupabaseService,
    private readonly yoloService: YoloService,
    private readonly storageService: StorageService,
    private readonly configService: ConfigService,
  ) {}

  async uploadPhoto(
    file: Express.Multer.File,
    userId: string,
  ): Promise<{
    photo_id: string;
    photo_url: string;
    relative_path: string;
  }> {
    try {
      const timestamp = Date.now();

      const extension = file.mimetype === 'image/png' ? 'png' : 'jpg';
      const relativePath = `${userId}_${timestamp}.${extension}`;

      const fileBuffer: Buffer = file.buffer;

      const mimeType: string = file.mimetype;

      const result = await this.storageService.upload({
        bucket: StorageBucket.YOLO_MODEL,
        filePath: relativePath,
        file: fileBuffer,
        contentType: mimeType,
        upsert: false,
      });

      return {
        photo_id: `${userId}_${timestamp}`,
        photo_url: result.publicUrl,
        relative_path: result.relativePath,
      };
    } catch (error) {
      this.logger.error('Photo upload failed', error);
      throw new BadRequestException(
        `Photo upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  async detectDistrict(
    latitude: number,
    longitude: number,
  ): Promise<DistrictDetectionResult> {
    try {
      this.logger.log(
        `Detecting district for coordinates: (${latitude}, ${longitude})`,
      );

      const { data, error } = await this.supabaseService
        .getClient()
        .rpc('get_district_by_coordinates', {
          lat: latitude,
          lng: longitude,
        });

      if (error) {
        this.logger.warn(`PostGIS district detection failed: ${error.message}`);
        return { district_code: null, district_name: null };
      }

      if (!data) {
        this.logger.warn('No district found for coordinates');
        return { district_code: null, district_name: null };
      }

      this.logger.log(`District detected: ${data}`);

      return { district_code: data, district_name: null };
    } catch (error) {
      this.logger.error('District detection failed', error);
      return { district_code: null, district_name: null };
    }
  }

  async getCategoryIdByCode(code: string): Promise<string> {
    const { data, error } = await this.supabaseService
      .getClient()
      .from('incident_categories')
      .select('category_id')
      .eq('code', code)
      .single();

    if (error || !data) {
      throw new NotFoundException(`Category with code ${code} not found`);
    }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return data.category_id;
  }

  async create(
    dto: CreateIncidentDto,
    userId: string,
  ): Promise<IncidentCreateResponse> {
    this.logger.log(`Creating incident for user: ${userId}`);

    const districtResult = await this.detectDistrict(
      dto.latitude,
      dto.longitude,
    );

    if (!districtResult.district_code) {
      throw new BadRequestException(
        'Unable to detect district for provided coordinates',
      );
    }

    this.logger.log(`Calling YOLO API for detection...`);
    await this.yoloService.detect({
      uuid_consulta: dto.incident_id,
      url_imagen: dto.photo_url,
    });

    await new Promise((resolve) => setTimeout(resolve, 2000));

    const yoloResult = await this.yoloService.getResult(dto.incident_id);

    const categoryCode = YOLO_CATEGORY_MAP[yoloResult.categoria];
    if (!categoryCode) {
      throw new BadRequestException(
        `Unknown YOLO category: ${yoloResult.categoria}`,
      );
    }

    const categoryId = await this.getCategoryIdByCode(categoryCode);

    // Extract relative path from photo_url - store only relative path in DB
    const relativePath =
      this.storageService.extractRelativePath(dto.photo_url) ?? dto.photo_url;

    this.logger.log('Inserting incident into database...');

    const { error: incidentError } = await this.supabaseService
      .getClient()
      .from('incidents')
      .insert({
        incident_id: dto.incident_id,
        reported_by: userId,
        description: dto.description,
        category_id: categoryId,
        ai_detected_category: yoloResult.categoria,
        ai_confidence: yoloResult.confianza,
        photo_url: relativePath,
        latitude: dto.latitude,
        longitude: dto.longitude,
        district_code: districtResult.district_code,
        status: 'pending',
      });

    if (incidentError) {
      this.logger.error('Incident insert failed', incidentError);
      throw new BadRequestException(
        `Incident creation failed: ${incidentError.message}`,
      );
    }

    const { error: yoloDetectionError } = await this.supabaseService
      .getClient()
      .from('yolo_detections')
      .insert({
        incident_id: dto.incident_id,
        category_id: categoryId,
        confidence: yoloResult.confianza,
        bounding_box: yoloResult.detalles,
        model_version: 'yolo-lima-v1.0',
        num_detecciones: yoloResult.num_detecciones,
        url_resultado: yoloResult.url_resultado,
        yolo_response_raw: yoloResult.fullResponse,
      });

    if (yoloDetectionError) {
      this.logger.error('YOLO detection insert failed', yoloDetectionError);
    }

    this.logger.log(`Incident created successfully: ${dto.incident_id}`);

    return {
      success: true,
      incident_id: dto.incident_id,
      // Build full URL from relative path stored in DB
      photo_url: this.storageService.buildPublicUrl(
        StorageBucket.YOLO_MODEL,
        relativePath,
      ),
      detected_category: yoloResult.categoria,
      confidence: yoloResult.confianza,
      category_code: categoryCode,
      district_code: districtResult.district_code,
      message: 'Incident created successfully',
    };
  }
}
