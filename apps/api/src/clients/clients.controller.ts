import { Controller, Get, Post, Patch, Body, Query, Param, HttpCode, HttpStatus } from "@nestjs/common";
import { ClientsService } from "./clients.service";

@Controller("clients")
export class ClientsController {
  constructor(private readonly clientsService: ClientsService) {}

  @Get()
  async findAll(
    @Query("developerId") developerId?: string,
    @Query("email") email?: string,
    @Query("id") id?: string
  ) {
    return this.clientsService.findAll(developerId, email, id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() body: any) {
    return this.clientsService.create(body);
  }

  @Patch()
  async update(@Body() body: any) {
    return this.clientsService.update(body);
  }

  @Get(":id")
  async findById(@Param("id") id: string) {
    return this.clientsService.findById(id);
  }
}
