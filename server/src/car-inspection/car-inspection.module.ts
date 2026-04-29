import { Module } from "@nestjs/common";
import { CarInspectionController } from "./car-inspection.controller";
import { CarInspectionService } from "./car-inspection.service";

@Module({
  controllers: [CarInspectionController],
  providers: [CarInspectionService],
  exports: [CarInspectionService],
})
export class CarInspectionModule {}
