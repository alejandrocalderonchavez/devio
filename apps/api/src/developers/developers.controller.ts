import { Controller, Post, Get, Body, Param, HttpCode, HttpStatus } from "@nestjs/common";
import { DevelopersService, CreateDeveloperDto } from "./developers.service";

@Controller("developers")
export class DevelopersController {
  constructor(private readonly developersService: DevelopersService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() body: CreateDeveloperDto) {
    return this.developersService.create(body);
  }

  @Get()
  async findAll() {
    return this.developersService.findAll();
  }

  @Get(":id")
  async findById(@Param("id") id: string) {
    return this.developersService.findById(id);
  }
}
