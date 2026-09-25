import { Module } from "@nestjs/common";
import { PrismaModule } from "./prisma/prisma.module";
import { AuthModule } from "./auth/auth.module";
import { DevelopersModule } from "./developers/developers.module";
import { ProjectsModule } from "./projects/projects.module";
import { InventoryModule } from "./inventory/inventory.module";
import { PaymentPlansModule } from "./payment-plans/payment-plans.module";
import { SalesModule } from "./sales/sales.module";
import { PaymentsModule } from "./payments/payments.module";
import { ClientsModule } from "./clients/clients.module";
import { UnitsModule } from "./units/units.module";
import { ClientPortalModule } from "./client-portal/client-portal.module";
import { DocumentsModule } from "./documents/documents.module";
import { ProgressModule } from "./progress/progress.module";
import { AdditionalsModule } from "./additionals/additionals.module";
import { FinanceModule } from "./finance/finance.module";
import { UploadModule } from "./upload/upload.module";
import { CronModule } from "./cron/cron.module";
import { NotificationsModule } from "./notifications/notifications.module";
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
    SalesModule,
    PaymentsModule,
    ClientsModule,
    UnitsModule,
    ClientPortalModule,
    DocumentsModule,
    ProgressModule,
    AdditionalsModule,
    FinanceModule,
    UploadModule,
    CronModule,
    NotificationsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
