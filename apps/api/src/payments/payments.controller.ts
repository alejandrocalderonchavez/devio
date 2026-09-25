import { Controller, Post, Get, Body, Query, HttpCode, HttpStatus } from "@nestjs/common";
import { PaymentsService } from "./payments.service";

@Controller("payments")
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() body: any) {
    return this.paymentsService.create(body);
  }

  @Get()
  async findAll(@Query("saleId") saleId?: string) {
    return this.paymentsService.findAll(saleId);
  }
}
