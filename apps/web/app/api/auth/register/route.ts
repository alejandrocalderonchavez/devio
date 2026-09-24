import { NextResponse } from "next/server";
import { prisma } from "@devio/database";
import crypto from "crypto";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { fullName, email, phone, roleTitle, password, developerName, inviteToken } = body;

    if (!email) {
      return NextResponse.json(
        { error: "El correo electrónico es requerido." },
        { status: 400 }
      );
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanName = (fullName || "Usuario Devio").trim();
    const cleanPhone = (phone || "").trim();
    const cleanRoleTitle = (roleTitle || "Administrador").trim();
    const cleanDevName = (developerName || `${cleanName} Desarrollos`).trim();

    // 1. Check if user already exists
    let user = await prisma.user.findUnique({
      where: { email: cleanEmail },
      include: {
        memberships: {
          include: {
            developer: true,
          },
        },
      },
    });

    let developer: any = null;

    if (!user) {
      const generatedAuthUserId = crypto.randomUUID();
      user = await prisma.user.create({
        data: {
          authUserId: generatedAuthUserId,
          email: cleanEmail,
          fullName: cleanName,
          phone: cleanPhone || null,
          preferredLanguage: "ES",
          preferredCurrency: "MXN",
        },
        include: {
          memberships: {
            include: {
              developer: true,
            },
          },
        },
      });
    }

    // 2. Check or create Developer & Membership
    if (user.memberships && user.memberships.length > 0) {
      developer = user.memberships[0].developer;
    } else {
      developer = await prisma.developer.create({
        data: {
          name: cleanDevName,
          legalName: cleanDevName,
          email: cleanEmail,
          phone: cleanPhone || null,
        },
      });

      await prisma.membership.create({
        data: {
          userId: user.id,
          developerId: developer.id,
          role: "SUPER_ADMIN",
        },
      });
    }

    const token = `devio_token_${user.id}_${Date.now()}`;

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        fullName: user.fullName || cleanName,
        email: user.email || cleanEmail,
        phone: user.phone || cleanPhone,
        role: "Super Admin",
        roleTitle: cleanRoleTitle,
        permissions: ["all"],
        isSuperAdmin: true,
        activeDeveloper: developer?.name || cleanDevName,
      },
      developer: {
        id: developer?.id,
        name: developer?.name,
        commercialName: developer?.name,
        legalName: developer?.legalName || developer?.name,
        rfc: developer?.taxId || "",
        email: developer?.email || cleanEmail,
        phone: developer?.phone || cleanPhone,
        logoPath: developer?.logoPath || null,
        logoUrl: developer?.logoPath || null,
      },
      token,
    });
  } catch (error: any) {
    console.error("Error in /api/auth/register:", error);
    return NextResponse.json(
      { error: error.message || "Error al registrar usuario en la base de datos." },
      { status: 500 }
    );
  }
}
