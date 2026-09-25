import { Controller, Get } from "@nestjs/common";
import { FinanceService } from "./finance.service";

@Controller("finance")
export class FinanceController {
  constructor(private readonly financeService: FinanceService) {}

  @Get("exchange-rate")
  async getExchangeRate() {
    return this.financeService.getExchangeRate();
  }
}
