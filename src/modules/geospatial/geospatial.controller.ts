import {
  Controller,
  Post,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
} from '@nestjs/swagger';
import { GeospatialService } from './geospatial.service';
import { CreateHeatmapDto } from './dto/create-heatmap.dto';
import { HeatmapResponseDto } from './dto/heatmap-response.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('geospatial')
@Controller('geospatial')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class GeospatialController {
  constructor(private readonly geospatialService: GeospatialService) {}

  @Post('heatmap')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Generate heatmap from incidents',
    description:
      'Generates a heatmap by clustering incidents into a 500m x 500m grid. ' +
      'Calculates intensity (0.0 - 1.0) based on incident density. ' +
      'Creates records in geospatial_analyses and heatmap_points tables. ' +
      'Requires MUNICIPALITY_STAFF role (enforced by RLS).',
  })
  @ApiBody({
    description: 'Heatmap generation parameters',
    type: CreateHeatmapDto,
    examples: {
      'Full Lima': {
        value: {
          time_range_start: '2025-01-01T00:00:00Z',
          time_range_end: '2025-11-15T23:59:59Z',
        },
      },
      'Single District': {
        value: {
          time_range_start: '2025-01-01T00:00:00Z',
          time_range_end: '2025-11-15T23:59:59Z',
          district_code: 'SJLUR',
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Heatmap generated successfully',
    type: HeatmapResponseDto,
    schema: {
      example: {
        success: true,
        data: {
          analysis_id: 'df6de24f-f307-4580-95a5-5efbad46f86b',
          total_points: 150,
          max_intensity: 1.0,
          generated_at: '2025-11-15T19:51:13Z',
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid request data or no incidents found',
    schema: {
      example: {
        success: false,
        error: 'No incidents found for heatmap generation',
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - JWT missing or invalid',
    schema: {
      example: {
        success: false,
        error: 'Unauthorized',
      },
    },
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
    schema: {
      example: {
        success: false,
        error: 'Failed to generate heatmap',
      },
    },
  })
  async generateHeatmap(
    @Body() createHeatmapDto: CreateHeatmapDto,
    @CurrentUser() user: { userId: string; email: string },
  ): Promise<HeatmapResponseDto> {
    const result = await this.geospatialService.generateHeatmap(
      createHeatmapDto,
      user.userId,
    );

    return {
      success: true,
      data: result,
    };
  }
}
