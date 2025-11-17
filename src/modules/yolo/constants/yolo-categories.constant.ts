export const YOLO_CATEGORY_MAP: Record<string, string> = {
  bache: 'POTHOLE',
  grieta: 'CRACK',
  alcantarilla: 'MANHOLE',
  basura: 'GARBAGE',
  iluminacion: 'LIGHTING',
  otro: 'OTHER',
};

export const CATEGORY_CODE_TO_YOLO: Record<string, string> = {
  POTHOLE: 'bache',
  CRACK: 'grieta',
  MANHOLE: 'alcantarilla',
  GARBAGE: 'basura',
  LIGHTING: 'iluminacion',
  OTHER: 'otro',
};

export const calculatePriority = (
  confidence: number,
): 'low' | 'medium' | 'high' | 'critical' => {
  if (confidence >= 0.9) return 'high';
  if (confidence >= 0.7) return 'medium';
  return 'low';
};
