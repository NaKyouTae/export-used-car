import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { PrismaModule } from "./prisma/prisma.module";
import { StorageModule } from "./storage/storage.module";
import { AuthModule } from "./auth/auth.module";
import { CategoriesModule } from "./categories/categories.module";
import { MakesModule } from "./makes/makes.module";
import { OptionsModule } from "./options/options.module";
import { TagsModule } from "./tags/tags.module";
import { ImagesModule } from "./images/images.module";
import { CarsModule } from "./cars/cars.module";
import { CarInspectionModule } from "./car-inspection/car-inspection.module";
import { SellersModule } from "./sellers/sellers.module";
import { AdminModule } from "./admin/admin.module";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    StorageModule,
    AuthModule,
    CategoriesModule,
    MakesModule,
    OptionsModule,
    TagsModule,
    ImagesModule,
    CarsModule,
    CarInspectionModule,
    SellersModule,
    AdminModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
