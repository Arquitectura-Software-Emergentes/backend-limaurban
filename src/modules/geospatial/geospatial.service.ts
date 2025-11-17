import { Injectable, Logger } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { CreateHeatmapDto } from './dto/create-heatmap.dto';
import {
  HeatmapPoint,
  IncidentLocation,
} from './interfaces/geospatial.interface';

@Injectable()
export class GeospatialService {
  private readonly logger = new Logger(GeospatialService.name);
  private readonly GRID_SIZE_KM = 0.0045; // 500m grid cells (~0.0045 degrees at equator)
  private readonly DEFAULT_RADIUS = 500; // meters

  constructor(private readonly supabaseService: SupabaseService) {}

  async generateHeatmap(
    dto: CreateHeatmapDto,
    userId: string,
  ): Promise<{
    analysis_id: string;
    total_points: number;
    max_intensity: number;
    generated_at: string;
  }> {
    this.logger.log(
      `Generating heatmap for user ${userId} with filters: ${JSON.stringify(dto)}`,
    );

    const supabase = this.supabaseService.getClient();

    // 1. Fetch incidents within time range and optional district
    let query = supabase
      .from('incidents')
      .select('incident_id, latitude, longitude')
      .gte('created_at', dto.time_range_start)
      .lte('created_at', dto.time_range_end);

    if (dto.district_code) {
      query = query.eq('district_code', dto.district_code);
    }

    const { data: incidents, error: incidentsError } = await query;

    if (incidentsError) {
      this.logger.error('Error fetching incidents:', incidentsError);
      throw new Error('Failed to fetch incidents');
    }

    if (!incidents || incidents.length === 0) {
      this.logger.warn('No incidents found for the given filters');
      throw new Error('No incidents found for heatmap generation');
    }

    this.logger.log(`Found ${incidents.length} incidents`);

    // 2. Calculate bounding box
    const lats = incidents.map((i) => Number(i.latitude));
    const lngs = incidents.map((i) => Number(i.longitude));
    const boundingBox = {
      min_lat: Math.min(...lats),
      max_lat: Math.max(...lats),
      min_lng: Math.min(...lngs),
      max_lng: Math.max(...lngs),
    };

    // 3. Create geospatial_analysis record
    const { data: analysis, error: analysisError } = await supabase
      .from('geospatial_analyses')
      .insert({
        analysis_type: 'heatmap',
        bounding_box: boundingBox,
        time_range_start: dto.time_range_start,
        time_range_end: dto.time_range_end,
        district_code: dto.district_code || null,
        requested_by: userId,
        status: 'processing',
      })
      .select('analysis_id')
      .single();

    if (analysisError || !analysis) {
      this.logger.error('Error creating analysis:', analysisError);
      throw new Error('Failed to create geospatial analysis');
    }

    const analysisId = analysis.analysis_id as string;
    this.logger.log(`Created analysis with ID: ${analysisId}`);

    // 4. Generate heatmap points using grid algorithm
    const heatmapPoints = this.calculateHeatmapPoints(
      incidents as IncidentLocation[],
      analysisId,
    );

    this.logger.log(`Generated ${heatmapPoints.length} heatmap points`);

    // 5. Insert heatmap points in batch
    const { error: pointsError } = await supabase
      .from('heatmap_points')
      .insert(heatmapPoints);

    if (pointsError) {
      this.logger.error('Error inserting heatmap points:', pointsError);
      throw new Error('Failed to insert heatmap points');
    }

    // 6. Update analysis status to completed
    const generatedAt = new Date().toISOString();
    const { error: updateError } = await supabase
      .from('geospatial_analyses')
      .update({
        status: 'completed',
        generated_at: generatedAt,
        results: {
          total_points: heatmapPoints.length,
          max_intensity: Math.max(...heatmapPoints.map((p) => p.intensity)),
        },
      })
      .eq('analysis_id', analysisId);

    if (updateError) {
      this.logger.error('Error updating analysis:', updateError);
      throw new Error('Failed to update analysis status');
    }

    this.logger.log('Heatmap generation completed successfully');

    return {
      analysis_id: analysisId,
      total_points: heatmapPoints.length,
      max_intensity: Math.max(...heatmapPoints.map((p) => p.intensity)),
      generated_at: generatedAt,
    };
  }

  private calculateHeatmapPoints(
    incidents: IncidentLocation[],
    analysisId: string,
  ): Omit<HeatmapPoint, 'point_id' | 'created_at'>[] {
    // Grid-based clustering algorithm
    const gridMap = new Map<string, IncidentLocation[]>();

    // Group incidents by grid cell
    incidents.forEach((incident) => {
      const cellKey = this.getGridCellKey(
        Number(incident.latitude),
        Number(incident.longitude),
      );
      if (!gridMap.has(cellKey)) {
        gridMap.set(cellKey, []);
      }
      gridMap.get(cellKey)!.push(incident);
    });

    // Calculate intensity for each cell
    const counts = Array.from(gridMap.values()).map((cell) => cell.length);
    const minCount = Math.min(...counts);
    const maxCount = Math.max(...counts);

    const heatmapPoints: Omit<HeatmapPoint, 'point_id' | 'created_at'>[] = [];

    gridMap.forEach((cellIncidents, cellKey) => {
      const [lat, lng] = this.getCellCenter(cellKey);
      const count = cellIncidents.length;

      // Normalize intensity between 0 and 1
      const intensity =
        maxCount === minCount
          ? 1.0
          : (count - minCount) / (maxCount - minCount);

      heatmapPoints.push({
        analysis_id: analysisId,
        latitude: lat,
        longitude: lng,
        intensity: Math.round(intensity * 100) / 100, // Round to 2 decimals
        incident_count: count,
        radius: this.DEFAULT_RADIUS,
      });
    });

    return heatmapPoints;
  }

  private getGridCellKey(lat: number, lng: number): string {
    // Round to grid cell (500m = ~0.0045 degrees)
    const gridLat = Math.floor(lat / this.GRID_SIZE_KM) * this.GRID_SIZE_KM;
    const gridLng = Math.floor(lng / this.GRID_SIZE_KM) * this.GRID_SIZE_KM;
    return `${gridLat.toFixed(4)},${gridLng.toFixed(4)}`;
  }

  private getCellCenter(cellKey: string): [number, number] {
    const [lat, lng] = cellKey.split(',').map(Number);
    return [lat + this.GRID_SIZE_KM / 2, lng + this.GRID_SIZE_KM / 2];
  }
}
