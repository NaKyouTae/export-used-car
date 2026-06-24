import { Module } from "@nestjs/common";
import { NotificationsController } from "./notifications.controller";
import { DeviceTokenController } from "./device-token.controller";
import { NotificationsService } from "./notifications.service";
import { FcmService } from "./push/fcm.service";

@Module({
  controllers: [NotificationsController, DeviceTokenController],
  providers: [NotificationsService, FcmService],
  exports: [NotificationsService],
})
export class NotificationsModule {}
