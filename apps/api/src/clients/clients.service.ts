import { Injectable, BadRequestException, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { randomUUID } from "crypto";

@Injectable()
export class ClientsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(developerId?: string, email?: string, id?: string) {
    const whereClause: any = {};
    if (id) whereClause.id = id;
    if (developerId) whereClause.developerId = developerId;
    if (email) whereClause.email = email.toLowerCase().trim();

    const clients = await this.prisma.client.findMany({
      where: whereClause,
      include: {
        developer: true,
        primarySales: {
          include: {
            unit: true,
            project: true,
            paymentPlan: true,
            paymentReceipts: true,
            scheduledObligations: true,
          },
        },
        documents: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return {
      success: true,
      clients,
    };
  }

  async create(body: any) {
    const {
      developerId,
      fullName,
      email,
      phone,
      taxId,
      curp,
      maritalStatus,
      occupation,
      addressLine1,
      city,
      state,
      notes,
    } = body;

    let targetDevId = developerId;
    if (!targetDevId || targetDevId.startsWith("dev-")) {
      const firstDev = await this.prisma.developer.findFirst({ select: { id: true } });
      targetDevId = firstDev?.id;
    }

    if (!targetDevId) {
      throw new BadRequestException("developerId es requerido para registrar el cliente");
    }

    const cleanEmail = (email || "").toLowerCase().trim();
    const cleanName = (fullName || "Cliente Devio").trim();

    let userRecord = null;
    if (cleanEmail) {
      userRecord = await this.prisma.user.findUnique({ where: { email: cleanEmail } });
      if (!userRecord) {
        userRecord = await this.prisma.user.create({
          data: {
            id: randomUUID(),
            authUserId: randomUUID(),
            email: cleanEmail,
            fullName: cleanName,
            phone: phone || null,
          },
        }).catch(() => null);
      }
    }

    const client = await this.prisma.client.create({
      data: {
        developerId: targetDevId,
        userId: userRecord?.id || null,
        fullName: cleanName,
        email: cleanEmail || null,
        phone: phone || null,
        taxId: taxId || null,
        curp: curp || null,
        maritalStatus: maritalStatus || null,
        occupation: occupation || null,
        addressLine1: addressLine1 || null,
        city: city || null,
        state: state || null,
        notes: notes || null,
      },
    });

    return {
      success: true,
      client,
    };
  }

  async update(body: any) {
    const {
      id,
      email,
      fullName,
      phone,
      taxId,
      curp,
      maritalStatus,
      occupation,
      addressLine1,
      city,
      state,
      notes,
    } = body;

    let targetClient = null;
    if (id && !id.startsWith("cli-") && id.length > 10) {
      targetClient = await this.prisma.client.findUnique({ where: { id } });
    }

    if (!targetClient && email) {
      targetClient = await this.prisma.client.findFirst({
        where: { email: email.toLowerCase().trim() },
      });
    }

    if (!targetClient) {
      throw new NotFoundException("Cliente no encontrado");
    }

    const updateData: any = {};
    if (fullName) updateData.fullName = fullName.trim();
    if (phone !== undefined) updateData.phone = phone ? String(phone).trim() : null;
    if (taxId !== undefined) updateData.taxId = taxId ? String(taxId).trim() : null;
    if (curp !== undefined) updateData.curp = curp ? String(curp).trim() : null;
    if (maritalStatus !== undefined) updateData.maritalStatus = maritalStatus;
    if (occupation !== undefined) updateData.occupation = occupation;
    if (addressLine1 !== undefined) updateData.addressLine1 = addressLine1;
    if (city !== undefined) updateData.city = city;
    if (state !== undefined) updateData.state = state;
    if (notes !== undefined) updateData.notes = notes;

    const updated = await this.prisma.client.update({
      where: { id: targetClient.id },
      data: updateData,
    });

    return {
      success: true,
      client: updated,
    };
  }

  async findById(id: string) {
    const client = await this.prisma.client.findUnique({
      where: { id },
      include: {
        developer: true,
        primarySales: {
          include: {
            unit: true,
            project: true,
            paymentReceipts: true,
            scheduledObligations: true,
          },
        },
      },
    });

    if (!client) {
      throw new NotFoundException(`Cliente con ID ${id} no encontrado.`);
    }

    return client;
  }
}
