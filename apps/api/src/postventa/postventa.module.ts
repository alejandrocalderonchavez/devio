import { Module } from "@nestjs/common";
import { PrismaModule } from "../prisma/prisma.module";
import { PostventaController } from "./postventa.controller";
import { PostventaService } from "./postventa.service";

@Module({
  imports: [PrismaModule],
  controllers: [PostventaController],
  providers: [PostventaService],
  exports: [PostventaService],
})
export class PostventaModule {}
