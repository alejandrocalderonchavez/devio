import { Module } from "@nestjs/common";
import { DevelopersService } from "./developers.service";
import { DevelopersController } from "./developers.controller";
import { NotificationsModule } from "../notifications/notifications.module";

@Module({
  imports: [NotificationsModule],
  providers: [DevelopersService],
  controllers: [DevelopersController],
  exports: [DevelopersService],
})
export class DevelopersModule {}
