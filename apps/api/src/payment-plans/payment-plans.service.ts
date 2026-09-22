import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class PaymentPlansService {
  constructor(private readonly prisma: PrismaService) {}

  async getPlansByProject(projectId: string) {
    return this.prisma.paymentPlan.findMany({
      where: {
        sale: { projectId },
      },
      orderBy: { createdAt: "asc" },
    });
  }
}
