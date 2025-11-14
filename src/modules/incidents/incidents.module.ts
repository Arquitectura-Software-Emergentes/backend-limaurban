import { Module } from '@nestjs/common';
import { IncidentsController } from './incidents.controller';
import { IncidentsService } from './incidents.service';
import { SupabaseModule } from '../supabase/supabase.module';
import { YoloModule } from '../yolo/yolo.module';
import { StorageModule } from '../storage/storage.module';

@Module({
  imports: [SupabaseModule, YoloModule, StorageModule],
  controllers: [IncidentsController],
  providers: [IncidentsService],
  exports: [IncidentsService],
})
export class IncidentsModule {}
