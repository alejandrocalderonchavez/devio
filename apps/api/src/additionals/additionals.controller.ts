import { Controller, Get, Post, Delete, Body, Query, HttpCode, HttpStatus } from "@nestjs/common";
import { AdditionalsService } from "./additionals.service";

@Controller("additionals")
export class AdditionalsController {
  constructor(private readonly additionalsService: AdditionalsService) {}

  @Get()
  async findAll(@Query("projectId") projectId?: string) {
    return this.additionalsService.findAll(projectId);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() body: any) {
    return this.additionalsService.create(body);
  }

  @Delete()
  async delete(@Query("id") id: string) {
    return this.additionalsService.delete(id);
  }
}
