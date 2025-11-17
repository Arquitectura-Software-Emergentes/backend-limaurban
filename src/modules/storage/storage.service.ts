import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SupabaseService } from '../supabase/supabase.service';
import {
  StorageBucket,
  StorageUploadOptions,
  StorageUploadResult,
} from './interfaces/storage.interface';

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private readonly storageBaseUrl: string;

  constructor(
    private readonly supabaseService: SupabaseService,
    private readonly configService: ConfigService,
  ) {
    // Use STORAGE_BASE_URL if provided, otherwise build from SUPABASE_URL
    const customStorageUrl = this.configService.get<string>('STORAGE_BASE_URL');

    if (customStorageUrl) {
      // Custom storage URL (Azure, AWS, etc.)
      this.storageBaseUrl = customStorageUrl;
      this.logger.log(`Using custom storage URL: ${customStorageUrl}`);
    } else {
      // Default to Supabase
      const supabaseUrl = this.configService.get<string>('SUPABASE_URL');
      this.storageBaseUrl = `${supabaseUrl}/storage/v1/object/public`;
      this.logger.log(`Using Supabase storage: ${this.storageBaseUrl}`);
    }
  }

  async upload(options: StorageUploadOptions): Promise<StorageUploadResult> {
    try {
      this.logger.log(
        `Uploading file to bucket: ${options.bucket}, path: ${options.filePath}`,
      );

      const { error: uploadError } = await this.supabaseService
        .getClient()
        .storage.from(options.bucket)
        .upload(options.filePath, options.file, {
          contentType: options.contentType,
          upsert: options.upsert ?? false,
        });

      if (uploadError) {
        this.logger.error('Storage upload failed', uploadError);
        throw new BadRequestException(
          `File upload failed: ${uploadError.message}`,
        );
      }

      const publicUrl = this.buildPublicUrl(options.bucket, options.filePath);

      this.logger.log(`File uploaded successfully: ${publicUrl}`);

      return {
        relativePath: options.filePath,
        publicUrl,
        bucket: options.bucket,
      };
    } catch (error) {
      this.logger.error('Storage upload failed', error);
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException(
        `File upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  buildPublicUrl(bucket: StorageBucket | string, relativePath: string): string {
    return `${this.storageBaseUrl}/${bucket}/${relativePath}`;
  }

  extractRelativePath(publicUrl: string): string | null {
    try {
      const url = new URL(publicUrl);
      const pathParts = url.pathname.split('/');
      const publicIndex = pathParts.indexOf('public');

      if (publicIndex === -1 || publicIndex + 2 >= pathParts.length) {
        return null;
      }

      return pathParts.slice(publicIndex + 2).join('/');
    } catch {
      return null;
    }
  }

  async delete(bucket: StorageBucket, relativePath: string): Promise<void> {
    try {
      this.logger.log(
        `Deleting file from bucket: ${bucket}, path: ${relativePath}`,
      );

      const { error } = await this.supabaseService
        .getClient()
        .storage.from(bucket)
        .remove([relativePath]);

      if (error) {
        this.logger.error('Storage delete failed', error);
        throw new BadRequestException(`File deletion failed: ${error.message}`);
      }

      this.logger.log('File deleted successfully');
    } catch (error) {
      this.logger.error('Storage delete failed', error);
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException(
        `File deletion failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  getStorageBaseUrl(): string {
    return this.storageBaseUrl;
  }
}
