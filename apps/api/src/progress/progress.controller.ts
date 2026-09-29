import { Controller, Get, Post, Delete, Param, Body, Query, HttpCode, HttpStatus } from "@nestjs/common";
import { ProgressService } from "./progress.service";

@Controller("progress")
export class ProgressController {
  constructor(private readonly progressService: ProgressService) {}

  @Get()
  async findAll(@Query("projectId") projectId?: string) {
    return this.progressService.findAll(projectId);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() body: any) {
    return this.progressService.create(body);
  }

  @Delete(":id")
  async remove(@Param("id") id: string) {
    return this.progressService.remove(id);
  }
}
