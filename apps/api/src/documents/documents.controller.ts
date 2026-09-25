import { Controller, Get, Post, Delete, Body, Query, HttpCode, HttpStatus } from "@nestjs/common";
import { DocumentsService } from "./documents.service";

@Controller("documents")
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  @Get()
  async findAll(
    @Query("projectId") projectId?: string,
    @Query("clientId") clientId?: string,
    @Query("developerId") developerId?: string
  ) {
    return this.documentsService.findAll(projectId, clientId, developerId);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() body: any) {
    return this.documentsService.create(body);
  }

  @Delete()
  async delete(@Query("id") id: string) {
    return this.documentsService.delete(id);
  }
}
