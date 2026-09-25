import { Controller, Post, Get, Put, Delete, Body, Param, Query, HttpCode, HttpStatus } from "@nestjs/common";
import { ProjectsService } from "./projects.service";

@Controller("projects")
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() body: any) {
    return this.projectsService.create(body);
  }

  @Get()
  async findAll(@Query("developerId") developerId?: string) {
    return this.projectsService.findAll(developerId);
  }

  @Get(":id")
  async findById(@Param("id") id: string) {
    return this.projectsService.findById(id);
  }

  @Put(":id")
  async update(@Param("id") id: string, @Body() body: any) {
    return this.projectsService.update(id, body);
  }

  @Delete(":id")
  async delete(@Param("id") id: string) {
    return this.projectsService.delete(id);
  }
}
