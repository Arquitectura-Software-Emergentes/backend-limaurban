import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { validate } from './config/env.validation';
import { HealthModule } from './modules/health/health.module';
import { SupabaseModule } from './modules/supabase/supabase.module';
import { AuthModule } from './modules/auth/auth.module';
import { YoloModule } from './modules/yolo/yolo.module';
import { IncidentsModule } from './modules/incidents/incidents.module';
import { AttachmentsModule } from './modules/attachments/attachments.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate,
    }),
    SupabaseModule,
    AuthModule,
    YoloModule,
    IncidentsModule,
    AttachmentsModule,
    HealthModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
