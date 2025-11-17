export enum StorageBucket {
  YOLO_MODEL = 'yolo_model',
  INCIDENTS = 'incidents',
  AVATARS = 'avatars',
}

export interface StorageUploadOptions {
  bucket: StorageBucket;
  filePath: string;
  file: Buffer;
  contentType: string;
  upsert?: boolean;
}

export interface StorageUploadResult {
  relativePath: string;
  publicUrl: string;
  bucket: StorageBucket;
}
