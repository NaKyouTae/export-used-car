import { Module } from "@nestjs/common";
import { SellersController } from "./sellers.controller";
import { SellersService } from "./sellers.service";
import { CarsModule } from "../cars/cars.module";

@Module({
  imports: [CarsModule],
  controllers: [SellersController],
  providers: [SellersService],
  exports: [SellersService],
})
export class SellersModule {}
