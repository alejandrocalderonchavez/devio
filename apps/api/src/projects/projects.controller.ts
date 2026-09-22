import { Controller, Post, Get, Body, Param, Query, HttpCode, HttpStatus } from "@nestjs/common";
import { ProjectsService, CreateProjectFullPayloadDto } from "./projects.service";

@Controller("projects")
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() body: CreateProjectFullPayloadDto) {
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
}
