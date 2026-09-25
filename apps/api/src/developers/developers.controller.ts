import { Controller, Post, Get, Put, Body, Param, Query, HttpCode, HttpStatus } from "@nestjs/common";
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
  async findByQuery(@Query("email") email?: string, @Query("id") id?: string) {
    if (email || id) {
      return this.developersService.findByQuery(email, id);
    }
    return this.developersService.findAll();
  }

  @Put()
  async updateDeveloper(@Body() body: any) {
    return this.developersService.updateDeveloper(body);
  }

  @Post("members")
  @HttpCode(HttpStatus.CREATED)
  async addMember(@Body() body: any) {
    return this.developersService.addMember(body);
  }

  @Get(":id")
  async findById(@Param("id") id: string) {
    return this.developersService.findById(id);
  }
}
