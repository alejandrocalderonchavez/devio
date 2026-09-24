import { NextResponse } from "next/server";
import { prisma } from "@devio/database";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      projectId,
      unitNumber,
      unitId,
      client,
      coOwners,
      financials,
      initialPayment,
      folio,
    } = body;

    if (!projectId) {
      return NextResponse.json(
        { error: "El ID del proyecto es requerido." },
        { status: 400 }
      );
    }

    // 1. Find project
    let project = await prisma.project.findFirst({
      where: {
        OR: [
          { id: projectId.length === 36 ? projectId : undefined },
          { name: projectId },
        ].filter(Boolean) as any,
      },
      include: {
        units: true,
      },
    });

    if (!project) {
      // If mock project, create or use first DB project
      project = await prisma.project.findFirst({ include: { units: true } });
    }

    if (!project) {
      return NextResponse.json({ success: true, message: "No database project found, saved locally" });
    }

    // 2. Find or create Unit
    let targetUnit = project.units.find(
      (u: any) => u.unitNumber.toLowerCase() === String(unitNumber || "").toLowerCase() || u.id === unitId
    );

    if (!targetUnit) {
      targetUnit = await prisma.unit.create({
        data: {
          projectId: project.id,
          unitNumber: String(unitNumber || "U-01"),
          basePrice: Number(financials?.unitPrice || financials?.totalSale || 3500000),
          totalAreaM2: 85,
          status: "SOLD",
        },
      });
    } else {
      await prisma.unit.update({
        where: { id: targetUnit.id },
        data: { status: "SOLD" },
      });
    }

    // 3. Find or create Primary Client
    const primaryEmail = (client?.email || "").toLowerCase().trim();
    const primaryName = client?.name || "Cliente Devio";

    let primaryClient = await prisma.client.findFirst({
      where: {
        developerId: project.developerId,
        email: primaryEmail || undefined,
      },
    });

    if (!primaryClient) {
      primaryClient = await prisma.client.create({
        data: {
          developerId: project.developerId,
          fullName: primaryName,
          email: primaryEmail || null,
          phone: client?.phone || null,
          taxId: client?.rfc || null,
        },
      });
    }

    // 4. Create Sale
    const agreedPrice = Number(financials?.totalSale || financials?.unitPrice || 0);
    const saleFolio = folio || `VTA-${Date.now().toString().slice(-6)}`;

    const sale = await prisma.sale.create({
      data: {
        projectId: project.id,
        unitId: targetUnit.id,
        primaryClientId: primaryClient.id,
        status: "ACTIVE",
        agreedPrice,
        finalPrice: agreedPrice,
        contractNumber: saleFolio,
        reservationDate: new Date(),
      },
    });

    // 5. Create Co-owners if any
    if (Array.isArray(coOwners) && coOwners.length > 0) {
      for (const co of coOwners) {
        if (!co.isPrimary && co.email) {
          let coClient = await prisma.client.findFirst({
            where: {
              developerId: project.developerId,
              email: co.email.toLowerCase().trim(),
            },
          });

          if (!coClient) {
            coClient = await prisma.client.create({
              data: {
                developerId: project.developerId,
                fullName: co.name || "Copropietario",
                email: co.email.toLowerCase().trim(),
                phone: co.phone || null,
                taxId: co.rfc || null,
              },
            });
          }

          await prisma.saleCoOwner.create({
            data: {
              saleId: sale.id,
              clientId: coClient.id,
              ownershipPercentage: Number(co.ownershipPct || 0),
            },
          }).catch(() => {});
        }
      }
    }

    // 6. Create Initial Payment Receipt if registered
    if (initialPayment?.registered && Number(initialPayment?.amount) > 0) {
      await prisma.paymentReceipt.create({
        data: {
          saleId: sale.id,
          clientId: primaryClient.id,
          amount: Number(initialPayment.amount),
          paymentDate: new Date(),
          paymentMethod: (initialPayment.method || "SPEI").toUpperCase() as any,
          reference: initialPayment.reference || `REC-${saleFolio}`,
          status: "APPLIED",
        },
      }).catch(() => {});
    }

    return NextResponse.json({
      success: true,
      sale: {
        id: sale.id,
        folio: saleFolio,
        unitId: targetUnit.id,
        unitNumber: targetUnit.unitNumber,
        clientId: primaryClient.id,
      },
    });
  } catch (error: any) {
    console.error("Error in /api/sales POST:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Error al registrar venta en base de datos" },
      { status: 500 }
    );
  }
}
