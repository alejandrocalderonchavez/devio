import { Controller, Post, Get, Body, HttpCode, HttpStatus } from "@nestjs/common";
import { AuthService, RegisterDto, LoginDto } from "./auth.service";

@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post("register")
  @HttpCode(HttpStatus.CREATED)
  async register(@Body() body: RegisterDto) {
    return this.authService.register(body);
  }

  @Post("login")
  @HttpCode(HttpStatus.OK)
  async login(@Body() body: LoginDto) {
    return this.authService.login(body);
  }

  @Get("superadmins")
  async getSuperAdmins() {
    return this.authService.getSuperAdmins();
  }
}
