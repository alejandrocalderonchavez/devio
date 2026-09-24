import { NextResponse } from "next/server";
import { prisma } from "@devio/database";
import migratedDevelopers from "@/data/migrated-developers.json";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get("email");
    const id = searchParams.get("id");

    // 1. If looking up by email or id from DB
    if (email || id) {
      try {
        const whereClause: any = {};
        if (id) whereClause.id = id;
        if (email) whereClause.email = email.toLowerCase().trim();

        const dev = await prisma.developer.findFirst({
          where: whereClause,
          include: {
            projects: {
              include: {
                units: true,
                sales: true,
                documents: true,
                additionals: true,
              },
            },
            memberships: {
              include: {
                user: true,
              },
            },
          },
        });

        if (dev) {
          return NextResponse.json({ success: true, developer: dev });
        }
      } catch (dbErr) {
        console.warn("DB lookup error in /api/developers:", dbErr);
      }
    }

    // 2. Fetch all developers from DB
    try {
      const dbDevs = await prisma.developer.findMany({
        include: {
          projects: true,
          memberships: {
            include: {
              user: true,
            },
          },
        },
      });

      if (dbDevs && dbDevs.length > 0) {
        return NextResponse.json({ success: true, developers: dbDevs });
      }
    } catch (dbErr) {
      console.warn("Prisma findMany error, falling back to JSON:", dbErr);
    }

    // Fallback to bundled migrated data
    return NextResponse.json({ success: true, developers: migratedDevelopers });
  } catch (error: any) {
    console.error("Error in /api/developers GET:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Error al obtener desarrolladoras" },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const {
      id,
      email,
      name,
      tradeName,
      businessName,
      legalName,
      rfc,
      taxId,
      addressStreet,
      addressLine1,
      addressCol,
      neighborhood,
      city,
      state,
      zipCode,
      postalCode,
      phone,
      billingEmail,
      contactEmail,
      logoUrl,
      logoPath,
      bankName,
      bankAccountName,
      clabe,
      taxRegime,
    } = body;

    const devName = tradeName || name || businessName || "Mi Desarrolladora";
    const devLegal = legalName || businessName || devName;
    const devRfc = rfc || taxId || "";
    const devEmail = contactEmail || billingEmail || email || "";
    const devLogo = logoUrl || logoPath || null;
    const devStreet = addressStreet || addressLine1 || "";
    const devCol = addressCol || neighborhood || "";
    const devCity = city || "Guadalajara";
    const devState = state || "Jalisco";
    const devZip = zipCode || postalCode || "";

    // 1. Try to find by id or email
    let devRecord: any = null;
    if (id && id.length > 10 && !id.startsWith("dev-")) {
      devRecord = await prisma.developer.findUnique({ where: { id } }).catch(() => null);
    }

    if (!devRecord && devEmail) {
      devRecord = await prisma.developer.findFirst({
        where: { email: devEmail.toLowerCase().trim() },
      }).catch(() => null);
    }

    if (devRecord) {
      // Update existing
      const updated = await prisma.developer.update({
        where: { id: devRecord.id },
        data: {
          name: devName,
          legalName: devLegal,
          taxId: devRfc || null,
          email: devEmail || null,
          phone: phone || null,
          addressLine1: devStreet || null,
          neighborhood: devCol || null,
          city: devCity || null,
          state: devState || null,
          postalCode: devZip || null,
          logoPath: devLogo,
        },
      });

      return NextResponse.json({ success: true, developer: updated });
    } else {
      // Create new
      const created = await prisma.developer.create({
        data: {
          name: devName,
          legalName: devLegal,
          taxId: devRfc || null,
          email: devEmail || null,
          phone: phone || null,
          addressLine1: devStreet || null,
          neighborhood: devCol || null,
          city: devCity || null,
          state: devState || null,
          postalCode: devZip || null,
          logoPath: devLogo,
        },
      });

      return NextResponse.json({ success: true, developer: created });
    }
  } catch (error: any) {
    console.error("Error in /api/developers PUT:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Error al actualizar desarrolladora" },
      { status: 500 }
    );
  }
}
