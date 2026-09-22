import { Module } from "@nestjs/common";
import { DevelopersService } from "./developers.service";
import { DevelopersController } from "./developers.controller";

@Module({
  providers: [DevelopersService],
  controllers: [DevelopersController],
  exports: [DevelopersService],
})
export class DevelopersModule {}
