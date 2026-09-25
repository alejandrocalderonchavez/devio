import { NextResponse } from "next/server";
import { prisma } from "@devio/database";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const developerId = searchParams.get("developerId");
    const email = searchParams.get("email");
    const id = searchParams.get("id");

    const whereClause: any = {};
    if (id) whereClause.id = id;
    if (developerId) whereClause.developerId = developerId;
    if (email) whereClause.email = email.toLowerCase().trim();

    const clients = await prisma.client.findMany({
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

    return NextResponse.json({
      success: true,
      clients,
    });
  } catch (error: any) {
    console.error("Error in /api/clients GET:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Error al obtener clientes" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
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
      const firstDev = await prisma.developer.findFirst({ select: { id: true } });
      targetDevId = firstDev?.id;
    }

    if (!targetDevId) {
      return NextResponse.json(
        { success: false, error: "developerId es requerido para registrar el cliente" },
        { status: 400 }
      );
    }

    const cleanEmail = (email || "").toLowerCase().trim();
    const cleanName = (fullName || "Cliente Devio").trim();

    // Check if user exists in `users`
    let userRecord = null;
    if (cleanEmail) {
      userRecord = await prisma.user.findUnique({ where: { email: cleanEmail } });
      if (!userRecord) {
        userRecord = await prisma.user.create({
          data: {
            authUserId: crypto.randomUUID(),
            email: cleanEmail,
            fullName: cleanName,
            phone: phone || null,
          },
        }).catch(() => null);
      }
    }

    const client = await prisma.client.create({
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

    return NextResponse.json({
      success: true,
      client,
    });
  } catch (error: any) {
    console.error("Error in /api/clients POST:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Error al registrar cliente en base de datos" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
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
      targetClient = await prisma.client.findUnique({ where: { id } });
    }

    if (!targetClient && email) {
      targetClient = await prisma.client.findFirst({
        where: { email: email.toLowerCase().trim() },
      });
    }

    if (!targetClient) {
      return NextResponse.json(
        { success: false, error: "Cliente no encontrado" },
        { status: 404 }
      );
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

    const updated = await prisma.client.update({
      where: { id: targetClient.id },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      client: updated,
    });
  } catch (error: any) {
    console.error("Error in /api/clients PATCH:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Error al actualizar cliente" },
      { status: 500 }
    );
  }
}
