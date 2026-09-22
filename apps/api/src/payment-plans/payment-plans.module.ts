import { Module } from "@nestjs/common";
import { PaymentPlansService } from "./payment-plans.service";
import { PaymentPlansController } from "./payment-plans.controller";

@Module({
  providers: [PaymentPlansService],
  controllers: [PaymentPlansController],
  exports: [PaymentPlansService],
})
export class PaymentPlansModule {}
