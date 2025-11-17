import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { YoloService } from './yolo.service';

@Module({
  imports: [HttpModule],
  providers: [YoloService],
  exports: [YoloService],
})
export class YoloModule {}
