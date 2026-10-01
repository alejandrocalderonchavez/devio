import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
} from "@nestjs/common";
import { PostventaService } from "./postventa.service";

@Controller("postventa")
export class PostventaController {
  constructor(private readonly postventaService: PostventaService) {}

  @Get("incidents")
  async findAll(
    @Query("projectId") projectId?: string,
    @Query("developerId") developerId?: string
  ) {
    return this.postventaService.findAll(projectId, developerId);
  }

  @Get("incidents/:id")
  async findOne(@Param("id") id: string) {
    return this.postventaService.findOne(id);
  }

  @Post("incidents")
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() body: any) {
    return this.postventaService.create(body);
  }

  @Post("incidents/:id/comments")
  @HttpCode(HttpStatus.CREATED)
  async addComment(@Param("id") id: string, @Body() body: any) {
    return this.postventaService.addComment(id, body);
  }

  @Patch("incidents/:id/status")
  async updateStatus(
    @Param("id") id: string,
    @Body() body: { status: string; notes?: string }
  ) {
    return this.postventaService.updateStatus(id, body.status, body.notes);
  }
}
