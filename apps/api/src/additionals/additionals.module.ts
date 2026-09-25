import { Module } from "@nestjs/common";
import { PrismaModule } from "../prisma/prisma.module";
import { AdditionalsController } from "./additionals.controller";
import { AdditionalsService } from "./additionals.service";

@Module({
  imports: [PrismaModule],
  controllers: [AdditionalsController],
  providers: [AdditionalsService],
  exports: [AdditionalsService],
})
export class AdditionalsModule {}
