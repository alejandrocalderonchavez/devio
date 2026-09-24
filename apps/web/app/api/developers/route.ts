import { NextResponse } from "next/server";
import { prisma } from "@devio/database";
import migratedDevelopers from "@/data/migrated-developers.json";
import crypto from "crypto";

const DEFAULT_COVER_IMAGE =
  "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=800&q=80";

function mapProjectFromDb(p: any, devLogo?: string | null) {
  const mappedUnits = (p.units || []).map((u: any, idx: number) => ({
    id: u.id,
    unit: u.unitNumber || `U-${idx + 1}`,
    type: u.category === "HOUSE" ? "Casa" : "Departamento",
    price: Number(u.basePrice) || 3500000,
    areaM2: Number(u.totalAreaM2) || 85,
    floor: u.level || 1,
    status:
      u.status === "SOLD"
        ? "VENDIDA"
        : u.status === "AVAILABLE"
        ? "DISPONIBLE"
        : "BLOQUEADA",
    client: "-",
  }));

  const totalUnits = mappedUnits.length;
  const soldUnits = mappedUnits.filter((u: any) => u.status === "VENDIDA").length;
  const availableUnits = mappedUnits.filter((u: any) => u.status === "DISPONIBLE").length;
  const blockedUnits = Math.max(0, totalUnits - soldUnits - availableUnits);

  const rawImage = p.coverImagePath || p.image;
  const validImage =
    rawImage && (rawImage.startsWith("http") || rawImage.startsWith("data:") || rawImage.startsWith("/"))
      ? rawImage
      : DEFAULT_COVER_IMAGE;

  return {
    id: p.id,
    name: p.name,
    type: (p.projectType || "VERTICAL").toUpperCase(),
    status: p.status || "ACTIVE",
    image: validImage,
    coverFileName: p.coverImagePath || null,
    logoFileName: devLogo || null,
    logoUrl: devLogo || null,
    logo: devLogo || null,
    totalUnits,
    soldUnits,
    availableUnits,
    blockedUnits,
    metrics: {
      totalCobrado: 0,
      porCobrar: 0,
      pagosAtrasados: 0,
      avanceVentasPct: totalUnits > 0 ? Math.round((soldUnits / totalUnits) * 100) : 0,
      unidadesVendidasCount: soldUnits,
      unidadesTotalesCount: totalUnits,
      porVenderUnidades: availableUnits,
      valorComercialVendido: 0,
      valorComercialTotal: mappedUnits.reduce((acc: number, u: any) => acc + (u.price || 0), 0),
      porVenderMonto: 0,
      flujoFuturoMonto: 0,
      precioPromedio: totalUnits > 0 ? Math.round(mappedUnits.reduce((acc: number, u: any) => acc + (u.price || 0), 0) / totalUnits) : 0,
      inventarioMonetarioPct: 0,
      totalFacturado: 0,
      distribucionPct: 0,
    },
    unitsInventory: mappedUnits,
    sales: p.sales || [],
    monthlyBilling: [],
    overdueClients: [],
    paymentPlans: [],
    documents: p.documents || [],
    additionals: p.additionals || [],
  };
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get("email");
    const id = searchParams.get("id");

    // 1. If looking up by email or id from DB
    if (email || id) {
      try {
        const whereClause: any = {};
        if (id && id.length > 10 && !id.startsWith("dev-")) whereClause.id = id;
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
          const formattedProjects = (dev.projects || []).map((p: any) => mapProjectFromDb(p, dev.logoPath));
          return NextResponse.json({
            success: true,
            developer: {
              ...dev,
              projects: formattedProjects,
            },
          });
        }
      } catch (dbErr) {
        console.warn("DB lookup error in /api/developers:", dbErr);
      }
    }

    // 2. Fetch all developers from DB
    try {
      const dbDevs = await prisma.developer.findMany({
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

      if (dbDevs && dbDevs.length > 0) {
        const formattedDevs = dbDevs.map((dev: any) => ({
          ...dev,
          projects: (dev.projects || []).map((p: any) => mapProjectFromDb(p, dev.logoPath)),
        }));
        return NextResponse.json({ success: true, developers: formattedDevs });
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
      userEmail,
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
      teamMembers,
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
    const primaryUserEmail = (userEmail || devEmail || "").toLowerCase().trim();

    // 1. Try to find existing developer to UPDATE (never duplicate)
    let devRecord: any = null;

    // A. Find by ID
    if (id && id.length > 10 && !id.startsWith("dev-")) {
      devRecord = await prisma.developer.findUnique({ where: { id } }).catch(() => null);
    }

    // B. Find by primary user's existing membership
    if (!devRecord && primaryUserEmail) {
      const user = await prisma.user.findUnique({
        where: { email: primaryUserEmail },
        include: {
          memberships: {
            include: { developer: true },
          },
        },
      }).catch(() => null);

      if (user?.memberships && user.memberships.length > 0) {
        devRecord = user.memberships[0].developer;
      }
    }

    // C. Find by email
    if (!devRecord && devEmail) {
      devRecord = await prisma.developer.findFirst({
        where: { email: devEmail.toLowerCase().trim() },
      }).catch(() => null);
    }

    if (!devRecord) {
      // Create new developer ONLY if none exists for this user
      devRecord = await prisma.developer.create({
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
    } else {
      // Update existing developer
      devRecord = await prisma.developer.update({
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
    }

    // 2. Link primary user if membership doesn't exist
    if (primaryUserEmail) {
      let user = await prisma.user.findUnique({ where: { email: primaryUserEmail } }).catch(() => null);
      if (!user) {
        user = await prisma.user.create({
          data: {
            authUserId: crypto.randomUUID(),
            email: primaryUserEmail,
            fullName: devName,
            phone: phone || null,
          },
        }).catch(() => null);
      }

      if (user) {
        await prisma.membership.upsert({
          where: {
            userId_developerId: {
              userId: user.id,
              developerId: devRecord.id,
            },
          },
          update: { role: "SUPER_ADMIN" },
          create: {
            userId: user.id,
            developerId: devRecord.id,
            role: "SUPER_ADMIN",
          },
        }).catch(() => {});
      }
    }

    // 3. Persist team members
    if (Array.isArray(teamMembers) && teamMembers.length > 0) {
      for (const tm of teamMembers) {
        if (tm.email) {
          const tmEmail = tm.email.toLowerCase().trim();
          let user = await prisma.user.findUnique({ where: { email: tmEmail } }).catch(() => null);
          if (!user) {
            user = await prisma.user.create({
              data: {
                authUserId: crypto.randomUUID(),
                email: tmEmail,
                fullName: tm.fullName || tm.name || "Miembro del Equipo",
                phone: tm.phone || null,
              },
            }).catch(() => null);
          }

          if (user) {
            const roleEnum = tm.role?.toLowerCase().includes("super")
              ? "SUPER_ADMIN"
              : tm.role?.toLowerCase().includes("director") || tm.role?.toLowerCase().includes("admin")
              ? "ADMIN"
              : "COMMERCIAL";

            await prisma.membership.upsert({
              where: {
                userId_developerId: {
                  userId: user.id,
                  developerId: devRecord.id,
                },
              },
              update: { role: roleEnum as any },
              create: {
                userId: user.id,
                developerId: devRecord.id,
                role: roleEnum as any,
              },
            }).catch(() => {});
          }
        }
      }
    }

    return NextResponse.json({ success: true, developer: devRecord });
  } catch (error: any) {
    console.error("Error in /api/developers PUT:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Error al actualizar desarrolladora" },
      { status: 500 }
    );
  }
}
