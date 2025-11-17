export interface IncidentCreateResponse {
  success: boolean;
  incident_id: string;
  photo_url: string;
  detected_category: string;
  confidence: number;
  category_code: string;
  district_code: string;
  url_resultado: string;
  message: string;
}

export interface DistrictDetectionResult {
  district_code: string | null;
  district_name: string | null;
}
