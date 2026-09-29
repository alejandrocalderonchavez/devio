import { Controller, Post, Get, Put, Delete, Body, Param, Query, HttpCode, HttpStatus } from "@nestjs/common";
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

  @Put(":id")
  async update(@Param("id") id: string, @Body() body: any) {
    return this.paymentsService.update(id, body);
  }

  @Delete(":id")
  async remove(@Param("id") id: string) {
    return this.paymentsService.remove(id);
  }
}
