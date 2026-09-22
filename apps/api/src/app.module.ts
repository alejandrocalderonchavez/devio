import { Module } from "@nestjs/common";
import { PrismaModule } from "./prisma/prisma.module";
import { AuthModule } from "./auth/auth.module";
import { DevelopersModule } from "./developers/developers.module";
import { ProjectsModule } from "./projects/projects.module";
import { InventoryModule } from "./inventory/inventory.module";
import { PaymentPlansModule } from "./payment-plans/payment-plans.module";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    DevelopersModule,
    ProjectsModule,
    InventoryModule,
    PaymentPlansModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
