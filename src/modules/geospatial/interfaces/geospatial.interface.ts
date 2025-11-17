export interface HeatmapPoint {
  point_id: string;
  analysis_id: string;
  latitude: number;
  longitude: number;
  intensity: number;
  incident_count: number;
  radius: number;
  created_at: Date;
}

export interface GeospatialAnalysis {
  analysis_id: string;
  analysis_type: 'heatmap' | 'cluster' | 'hotspot';
  bounding_box: {
    min_lat: number;
    max_lat: number;
    min_lng: number;
    max_lng: number;
  };
  time_range_start: Date;
  time_range_end: Date;
  district_code?: string;
  requested_by: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  results?: any;
  generated_at?: Date;
  created_at: Date;
}

export interface IncidentLocation {
  incident_id: string;
  latitude: number;
  longitude: number;
}
