import { Module } from '@nestjs/common';
import { GeospatialController } from './geospatial.controller';
import { GeospatialService } from './geospatial.service';
import { SupabaseModule } from '../supabase/supabase.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [SupabaseModule, AuthModule],
  controllers: [GeospatialController],
  providers: [GeospatialService],
  exports: [GeospatialService],
})
export class GeospatialModule {}
