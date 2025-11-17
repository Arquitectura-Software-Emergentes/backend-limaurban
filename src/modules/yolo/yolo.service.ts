import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { YoloDetectionRequestDto } from './dto/yolo-detection-request.dto';
import { YoloDetectionResponseDto } from './dto/yolo-detection-response.dto';
import {
  YoloDetectionResult,
  YoloFullResponse,
} from './interfaces/yolo-result.interface';

@Injectable()
export class YoloService {
  private readonly logger = new Logger(YoloService.name);
  private readonly yoloBaseUrl: string;
  private readonly yoloApiKey: string;
  private readonly yoloClientId: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
  ) {
    this.yoloBaseUrl = this.configService.get<string>('YOLO_API_URL')!;
    this.yoloApiKey = this.configService.get<string>('YOLO_API_KEY')!;
    this.yoloClientId = this.configService.get<string>('YOLO_API_CLIENT')!;

    if (!this.yoloBaseUrl || !this.yoloApiKey || !this.yoloClientId) {
      throw new Error(
        'Missing YOLO credentials. Check YOLO_API_URL, YOLO_API_KEY, YOLO_API_CLIENT in .env',
      );
    }
  }

  async detect(
    dto: YoloDetectionRequestDto,
  ): Promise<YoloDetectionResponseDto> {
    try {
      this.logger.log(
        `Calling YOLO API - POST /api/v1/detecciones - UUID: ${dto.uuid_consulta}`,
      );

      const response = await firstValueFrom(
        this.httpService.post<YoloDetectionResponseDto>(
          `${this.yoloBaseUrl}/api/v1/detecciones`,
          dto,
          {
            headers: {
              'X-API-Key': this.yoloApiKey,
              'Content-Type': 'application/json',
            },
          },
        ),
      );

      const responseData = response.data;

      this.logger.log(
        `YOLO detection created - Estado: ${responseData.estado}`,
      );

      return responseData;
    } catch (error) {
      this.logger.error('YOLO API detection failed', error);
      throw new BadRequestException(
        `YOLO detection failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  async getResult(uuid: string): Promise<YoloDetectionResult> {
    try {
      this.logger.log(`Fetching YOLO result - GET /api/v1/detecciones/${uuid}`);

      const response = await firstValueFrom(
        this.httpService.get<YoloFullResponse>(
          `${this.yoloBaseUrl}/api/v1/detecciones/${uuid}`,
          {
            headers: {
              'X-API-Key': this.yoloApiKey,
            },
          },
        ),
      );

      const fullResponse = response.data;

      if (!fullResponse.resultado) {
        throw new BadRequestException(
          'YOLO result not ready or processing failed',
        );
      }

      this.logger.log(
        `YOLO result retrieved - Categoria: ${fullResponse.resultado.categoria}, Confianza: ${fullResponse.resultado.confianza}`,
      );

      return {
        categoria: fullResponse.resultado.categoria,
        confianza: fullResponse.resultado.confianza,
        num_detecciones: fullResponse.resultado.num_detecciones,
        url_resultado: fullResponse.resultado.url_resultado,
        detalles: fullResponse.resultado.detalles,
        fullResponse,
      };
    } catch (error) {
      this.logger.error(`YOLO API get result failed for UUID: ${uuid}`, error);
      throw new BadRequestException(
        `YOLO get result failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  async verifyCredentials(): Promise<{
    success: boolean;
    client_id: string;
    is_active: boolean;
  }> {
    try {
      this.logger.log('Verifying YOLO API credentials');

      type VerifyResponse = {
        success: boolean;
        client: { client_id: string; is_active: boolean; name: string };
      };

      const response = await firstValueFrom(
        this.httpService.get<VerifyResponse>(
          `${this.yoloBaseUrl}/api/v1/clients/verify`,
          {
            headers: {
              'X-API-Key': this.yoloApiKey,
            },
          },
        ),
      );

      const verifyData = response.data;

      this.logger.log(
        `YOLO credentials verified - Client: ${verifyData.client.client_id}`,
      );

      return {
        success: verifyData.success,
        client_id: verifyData.client.client_id,
        is_active: verifyData.client.is_active,
      };
    } catch (error) {
      this.logger.error('YOLO API credentials verification failed', error);
      throw new BadRequestException(
        `YOLO credentials verification failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }
}
