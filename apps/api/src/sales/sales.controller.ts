import { Controller, Post, Get, Body, Param, Query, HttpCode, HttpStatus } from "@nestjs/common";
import { SalesService } from "./sales.service";

@Controller("sales")
export class SalesController {
  constructor(private readonly salesService: SalesService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() body: any) {
    return this.salesService.create(body);
  }

  @Get()
  async findAll(@Query("developerId") developerId?: string, @Query("projectId") projectId?: string) {
    return this.salesService.findAll(developerId, projectId);
  }

  @Get(":id")
  async findById(@Param("id") id: string) {
    return this.salesService.findById(id);
  }
}
