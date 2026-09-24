import { NextResponse } from "next/server";
import { prisma } from "@devio/database";
import crypto from "crypto";

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
      schedule,
      initialPayment,
      folio,
    } = body;

    if (!projectId) {
      return NextResponse.json(
        { error: "El ID del proyecto es requerido." },
        { status: 400 }
      );
    }

    // 1. Find project and its developer
    let project = await prisma.project.findFirst({
      where: {
        OR: [
          { id: projectId.length === 36 ? projectId : undefined },
          { name: projectId },
        ].filter(Boolean) as any,
      },
      include: {
        developer: true,
        units: true,
      },
    });

    if (!project) {
      project = await prisma.project.findFirst({
        include: {
          developer: true,
          units: true,
        },
      });
    }

    if (!project) {
      return NextResponse.json(
        { success: false, error: "No se encontró ningún proyecto registrado en la base de datos." },
        { status: 404 }
      );
    }

    // 2. Find or create Unit
    let targetUnit = project.units.find(
      (u: any) => u.unitNumber.toLowerCase() === String(unitNumber || "").toLowerCase() || u.id === unitId
    );

    const agreedPrice = Number(financials?.totalSale || financials?.netTotalSale || financials?.unitPrice || 3500000);

    if (!targetUnit) {
      targetUnit = await prisma.unit.create({
        data: {
          projectId: project.id,
          unitNumber: String(unitNumber || "U-01"),
          basePrice: agreedPrice,
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

    // 3. Find or create User in `users` table for Primary Client
    const primaryEmail = (client?.email || "").toLowerCase().trim();
    const primaryName = (client?.name || "Cliente Devio").trim();
    const primaryPhone = client?.phone ? String(client.phone).trim() : null;
    const primaryRfc = client?.rfc ? String(client.rfc).trim() : null;

    let primaryUser = null;
    if (primaryEmail) {
      primaryUser = await prisma.user.findUnique({
        where: { email: primaryEmail },
      });

      if (!primaryUser) {
        primaryUser = await prisma.user.create({
          data: {
            authUserId: crypto.randomUUID(),
            email: primaryEmail,
            fullName: primaryName,
            phone: primaryPhone,
            preferredLanguage: "ES",
            preferredCurrency: "MXN",
          },
        });
      } else if (!primaryUser.fullName || primaryUser.fullName === "Usuario Devio") {
        primaryUser = await prisma.user.update({
          where: { id: primaryUser.id },
          data: {
            fullName: primaryName,
            phone: primaryPhone || primaryUser.phone,
          },
        });
      }

      // Ensure Membership as CLIENT for the primary user
      await prisma.membership.upsert({
        where: {
          userId_developerId: {
            userId: primaryUser.id,
            developerId: project.developerId,
          },
        },
        create: {
          userId: primaryUser.id,
          developerId: project.developerId,
          role: "CLIENT",
        },
        update: {},
      });
    }

    // 4. Find or create Client in `clients` table
    let primaryClient = null;
    if (primaryEmail) {
      primaryClient = await prisma.client.findFirst({
        where: {
          developerId: project.developerId,
          email: primaryEmail,
        },
      });
    }

    if (!primaryClient) {
      primaryClient = await prisma.client.create({
        data: {
          developerId: project.developerId,
          userId: primaryUser?.id || null,
          fullName: primaryName,
          email: primaryEmail || null,
          phone: primaryPhone,
          taxId: primaryRfc,
        },
      });
    } else {
      primaryClient = await prisma.client.update({
        where: { id: primaryClient.id },
        data: {
          userId: primaryUser?.id || primaryClient.userId,
          fullName: primaryName,
          phone: primaryPhone || primaryClient.phone,
          taxId: primaryRfc || primaryClient.taxId,
        },
      });
    }

    // 5. Create Sale Record
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

    // 6. Create Co-owners if any
    if (Array.isArray(coOwners) && coOwners.length > 0) {
      for (const co of coOwners) {
        if (!co.isPrimary && co.email) {
          const coEmail = co.email.toLowerCase().trim();
          const coName = (co.name || "Copropietario").trim();
          const coPhone = co.phone ? String(co.phone).trim() : null;
          const coRfc = co.rfc ? String(co.rfc).trim() : null;

          // User for co-owner
          let coUser = await prisma.user.findUnique({
            where: { email: coEmail },
          });

          if (!coUser) {
            coUser = await prisma.user.create({
              data: {
                authUserId: crypto.randomUUID(),
                email: coEmail,
                fullName: coName,
                phone: coPhone,
                preferredLanguage: "ES",
                preferredCurrency: "MXN",
              },
            });
          }

          // Membership for co-owner
          await prisma.membership.upsert({
            where: {
              userId_developerId: {
                userId: coUser.id,
                developerId: project.developerId,
              },
            },
            create: {
              userId: coUser.id,
              developerId: project.developerId,
              role: "CLIENT",
            },
            update: {},
          });

          // Client record for co-owner
          let coClient = await prisma.client.findFirst({
            where: {
              developerId: project.developerId,
              email: coEmail,
            },
          });

          if (!coClient) {
            coClient = await prisma.client.create({
              data: {
                developerId: project.developerId,
                userId: coUser.id,
                fullName: coName,
                email: coEmail,
                phone: coPhone,
                taxId: coRfc,
              },
            });
          }

          await prisma.saleCoOwner.upsert({
            where: {
              saleId_clientId: {
                saleId: sale.id,
                clientId: coClient.id,
              },
            },
            create: {
              saleId: sale.id,
              clientId: coClient.id,
              ownershipPercentage: Number(co.ownershipPct || 0),
            },
            update: {
              ownershipPercentage: Number(co.ownershipPct || 0),
            },
          }).catch(() => {});
        }
      }
    }

    // 7. Create Payment Plan
    const downPaymentAmount = Number(financials?.downPaymentAmount || initialPayment?.amount || 0);
    const installmentsCount = Number(financials?.installmentsCount || (schedule && schedule.length > 0 ? schedule.length : 1));
    const installmentsTotalAmount = Number(financials?.installmentsTotalAmount || Math.max(0, agreedPrice - downPaymentAmount));

    await prisma.paymentPlan.create({
      data: {
        saleId: sale.id,
        downPaymentPercentage: Number(financials?.downPaymentPct || 20),
        downPaymentAmount,
        installmentsCount,
        installmentsTotalAmount,
        settlementAmount: Number(financials?.balloonLiquidationPct ? (agreedPrice * Number(financials.balloonLiquidationPct) / 100) : 0),
        notes: financials?.planName || "Plan Tradicional",
      },
    }).catch((err: any) => console.warn("Could not create payment plan:", err));

    // 8. Create Scheduled Obligations
    if (Array.isArray(schedule) && schedule.length > 0) {
      for (let idx = 0; idx < schedule.length; idx++) {
        const item = schedule[idx];
        const scheduledAmount = Number(item.scheduledAmount ?? item.amount ?? 0);
        const paidAmount = Number(item.paidAmount ?? 0);
        const pendingAmount = Math.max(0, scheduledAmount - paidAmount);
        const dueDate = item.scheduledDate || item.date ? new Date(item.scheduledDate || item.date) : new Date();

        await prisma.scheduledObligation.create({
          data: {
            saleId: sale.id,
            obligationNumber: idx + 1,
            title: item.concept || (idx === 0 ? "Enganche" : `Mensualidad ${idx}`),
            type: idx === 0 ? "DOWN_PAYMENT" : idx === schedule.length - 1 ? "SETTLEMENT" : "INSTALLMENT",
            dueDate,
            originalAmount: scheduledAmount,
            pendingAmount,
            paidAmount,
            currency: "MXN",
            status: pendingAmount === 0 ? "PAID" : paidAmount > 0 ? "PARTIALLY_PAID" : "PENDING",
          },
        }).catch((err: any) => console.warn("Could not create scheduled obligation:", err));
      }
    }

    // 9. Create Initial Payment Receipt if registered
    if (initialPayment?.registered && Number(initialPayment?.amount) > 0) {
      const pMethod = String(initialPayment.method || "TRANSFER").toUpperCase();
      const validMethod = ["TRANSFER", "CARD", "CASH", "CHECK", "OTHER"].includes(pMethod)
        ? (pMethod as any)
        : "TRANSFER";

      await prisma.paymentReceipt.create({
        data: {
          saleId: sale.id,
          payerClientId: primaryClient.id,
          receiptFolio: initialPayment.reference || `REC-${saleFolio}`,
          paymentDate: new Date(),
          paymentMethod: validMethod,
          amount: Number(initialPayment.amount),
          currency: "MXN",
          transactionReference: initialPayment.reference || `REF-${saleFolio}`,
          notes: "Pago de enganche / apartado inicial al formalizar venta",
        },
      }).catch((err: any) => console.warn("Could not create payment receipt:", err));
    }

    // 10. Send Credentials / Welcome Email to Client via Postmark (if email provided)
    if (primaryEmail) {
      const postmarkToken = process.env.POSTMARK_SERVER_TOKEN || "ec9d2701-f4ec-4433-8135-a0e64a59244d";
      fetch("https://api.postmarkapp.com/email/withTemplate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Postmark-Server-Token": postmarkToken,
        },
        body: JSON.stringify({
          From: `${project.developer?.name || "DEVIO"} <noreply@deviomx.com>`,
          To: primaryEmail,
          TemplateAlias: "confirmacion-venta",
          TemplateModel: {
            nombre: primaryName,
            proyecto: project.name,
            unidad: targetUnit.unitNumber,
            monto: `$${agreedPrice.toLocaleString("es-MX")} MXN`,
            folio: saleFolio,
            desarrolladora: project.developer?.name || "Desarrollador",
            login_link: "https://deviomx.com/login",
            email: primaryEmail,
          },
        }),
      }).catch((emailErr) => console.warn("Postmark welcome email non-blocking notice:", emailErr));
    }

    return NextResponse.json({
      success: true,
      sale: {
        id: sale.id,
        folio: saleFolio,
        unitId: targetUnit.id,
        unitNumber: targetUnit.unitNumber,
        clientId: primaryClient.id,
        clientName: primaryName,
        clientEmail: primaryEmail,
        userId: primaryUser?.id || null,
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
