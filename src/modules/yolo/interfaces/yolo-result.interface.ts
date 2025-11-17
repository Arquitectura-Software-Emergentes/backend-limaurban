export interface YoloResultado {
  categoria:
    | 'bache'
    | 'grieta'
    | 'alcantarilla'
    | 'basura'
    | 'iluminacion'
    | 'otro';
  confianza: number;
  detalles: Record<string, unknown>;
  num_detecciones: number;
  timestamp: string;
  url_resultado: string;
}

export interface YoloFullResponse {
  client_id: string;
  created_at: string;
  estado: string;
  resultado: YoloResultado;
  updated_at: string;
  url_imagen: string;
  uuid_consulta: string;
}

export interface YoloDetectionResult {
  categoria: string;
  confianza: number;
  num_detecciones: number;
  url_resultado: string;
  detalles: Record<string, unknown>;
  fullResponse: YoloFullResponse;
}
