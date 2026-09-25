import { Controller, Get, Post, Patch, Delete, Body, Query, HttpCode, HttpStatus } from "@nestjs/common";
import { UnitsService } from "./units.service";

@Controller("units")
export class UnitsController {
  constructor(private readonly unitsService: UnitsService) {}

  @Get()
  async findAll(@Query("projectId") projectId?: string) {
    return this.unitsService.findAll(projectId);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() body: any) {
    return this.unitsService.create(body);
  }

  @Patch()
  async update(@Body() body: any) {
    return this.unitsService.update(body);
  }

  @Delete()
  async delete(
    @Query("id") id?: string,
    @Query("unitNumber") unitNumber?: string,
    @Query("projectId") projectId?: string
  ) {
    return this.unitsService.delete(id, unitNumber, projectId);
  }
}
