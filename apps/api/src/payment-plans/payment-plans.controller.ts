import { Controller, Get, Param } from "@nestjs/common";
import { PaymentPlansService } from "./payment-plans.service";

@Controller("projects/:projectId/payment-plans")
export class PaymentPlansController {
  constructor(private readonly paymentPlansService: PaymentPlansService) {}

  @Get()
  async getPlans(@Param("projectId") projectId: string) {
    return this.paymentPlansService.getPlansByProject(projectId);
  }
}
