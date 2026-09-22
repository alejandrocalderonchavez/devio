import { Injectable, BadRequestException, UnauthorizedException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { randomUUID } from "crypto";

export interface RegisterDto {
  fullName: string;
  email: string;
  phone: string;
  roleTitle?: string;
  password?: string;
}

export interface LoginDto {
  email: string;
  password?: string;
}

@Injectable()
export class AuthService {
  constructor(private readonly prisma: PrismaService) {}

  async register(dto: RegisterDto) {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase().trim() },
    });

    if (existing) {
      return {
        user: existing,
        message: "Usuario ya registrado en la plataforma.",
      };
    }

    const newUser = await this.prisma.user.create({
      data: {
        id: randomUUID(),
        authUserId: randomUUID(),
        email: dto.email.toLowerCase().trim(),
        phone: dto.phone,
        fullName: dto.fullName,
        preferredLanguage: "ES",
        preferredCurrency: "MXN",
      },
    });

    return {
      user: newUser,
      message: "Usuario administrador registrado exitosamente.",
    };
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase().trim() },
      include: {
        memberships: {
          include: {
            developer: true,
          },
        },
      },
    });

    if (!user) {
      throw new UnauthorizedException("Credenciales no válidas o usuario no registrado.");
    }

    return {
      user,
      token: `devio_session_${user.id}_${Date.now()}`,
      activeDeveloper: user.memberships[0]?.developer || null,
    };
  }
}
