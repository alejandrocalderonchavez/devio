import { Controller, Post, UseInterceptors, UploadedFile, Body, HttpCode, HttpStatus } from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { UploadService } from "./upload.service";

@Controller("upload")
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(FileInterceptor("file"))
  async upload(
    @UploadedFile() file: any,
    @Body("bucket") bucket?: string,
    @Body("folder") folder?: string,
    @Body("fileName") fileName?: string
  ) {
    return this.uploadService.uploadFile(file, bucket, folder, fileName);
  }
}
