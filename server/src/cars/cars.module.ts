import { Module } from "@nestjs/common";
import { CarsController } from "./cars.controller";
import { CarsService } from "./cars.service";
import { KeywordAlertsModule } from "../keyword-alerts/keyword-alerts.module";

@Module({
  imports: [KeywordAlertsModule],
  controllers: [CarsController],
  providers: [CarsService],
  exports: [CarsService],
})
export class CarsModule {}
