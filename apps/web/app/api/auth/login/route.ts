import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email) {
      return NextResponse.json(
        { error: "El correo electrónico es requerido." },
        { status: 400 }
      );
    }

    const cleanEmail = email.trim().toLowerCase();

    // Check SUPERADMIN_EMAILS environment variable
    const rawSuperAdminEnv = process.env.SUPERADMIN_EMAILS || "acalderoncha@gmail.com";
    const superAdminList = rawSuperAdminEnv
      .split(/[,;\s]+/)
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean);

    if (!superAdminList.includes("acalderoncha@gmail.com")) {
      superAdminList.push("acalderoncha@gmail.com");
    }

    const isSuperAdmin = superAdminList.includes(cleanEmail);

    // Read migrated developers list
    let developersList: any[] = [];
    try {
      const devsPath = path.join(process.cwd(), "data/migrated-developers.json");
      if (fs.existsSync(devsPath)) {
        developersList = JSON.parse(fs.readFileSync(devsPath, "utf-8"));
      }
    } catch (e) {
      console.warn("Could not read migrated-developers.json:", e);
    }

    // Match user to developer and projects
    let matchedDev: any = null;
    let matchedMembership: any = null;

    for (const dev of developersList) {
      const mem = (dev.memberships || []).find(
        (m: any) => m.user?.email?.toLowerCase().trim() === cleanEmail
      );
      if (mem) {
        matchedDev = dev;
        matchedMembership = mem;
        break;
      }
      if (dev.email?.toLowerCase().trim() === cleanEmail) {
        matchedDev = dev;
        break;
      }
    }

    // Super Admin login
    if (isSuperAdmin) {
      const user = {
        id: `sa-${Date.now()}`,
        fullName: cleanEmail === "acalderoncha@gmail.com" ? "Alejandro Calderón" : "Super Administrador",
        email: cleanEmail,
        phone: "+52 (33) 0000 0000",
        role: "Super Admin",
        roleTitle: "Super Administrador Devio",
        permissions: ["all"],
        isSuperAdmin: true,
        activeDeveloper: matchedDev ? matchedDev.name : "Devio Global",
      };

      const token = `devio_token_sa_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

      const devObj = matchedDev
        ? {
            id: matchedDev.id,
            name: matchedDev.name,
            commercialName: matchedDev.name,
            legalName: matchedDev.legalName || matchedDev.name,
            rfc: matchedDev.taxId || "RFC-PENDIENTE",
            city: matchedDev.city || matchedDev.neighborhood || "Guadalajara",
            email: matchedDev.email || cleanEmail,
            phone: matchedDev.phone || "",
            logoPath: matchedDev.logoPath || matchedDev.logoUrl || matchedDev.logo || null,
          }
        : {
            id: "dev-global",
            name: "Devio Global",
            commercialName: "Devio Global",
            legalName: "Devio Global Inc.",
            rfc: "DEV-GLOBAL-01",
            city: "Guadalajara",
            email: cleanEmail,
            phone: "+52 (33) 0000 0000",
            logoPath: null,
          };

      const projects = matchedDev ? (matchedDev.projects || []) : [];

      return NextResponse.json({
        success: true,
        user,
        token,
        developer: devObj,
        activeDeveloper: devObj,
        projects,
      });
    }

    // If regular user and not matched to any developer or membership
    if (!matchedDev) {
      return NextResponse.json(
        { error: "Credenciales inválidas. Verifica tu correo y contraseña o regístrate si no tienes cuenta." },
        { status: 401 }
      );
    }

    const devName = matchedDev?.name || "Desarrolladora Devio";
    const devLegal = matchedDev?.legalName || devName;
    const devRfc = matchedDev?.taxId || "RFC-PENDIENTE";
    const devCity = matchedDev?.city || matchedDev?.neighborhood || "Guadalajara";
    const devEmail = matchedDev?.email || cleanEmail;
    const devPhone = matchedDev?.phone || "";

    const userFullName =
      matchedMembership?.user?.fullName ||
      (matchedDev ? `${matchedDev.name} Admin` : "Usuario Devio");

    const userRole = isSuperAdmin
      ? "Super Admin"
      : matchedMembership?.role || "Director Comercial";

    const userRoleTitle = isSuperAdmin
      ? "Super Administrador"
      : matchedMembership?.role || "Director Comercial";

    const mappedProjects = (matchedDev?.projects || []).map((p: any) => {
      // If already formatted with unitsInventory
      if (Array.isArray(p.unitsInventory) && p.unitsInventory.length > 0) {
        return p;
      }

      const mappedUnits = (p.units || []).map((u: any, idx: number) => ({
        id: u.id,
        unit: u.unitNumber || `U-${idx + 1}`,
        type: u.category === "HOUSE" ? "Casa" : "Departamento",
        price: parseFloat(u.basePrice) || 3500000,
        areaM2: parseFloat(u.totalAreaM2) || 85,
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

      return {
        id: p.id,
        name: p.name,
        type: (p.projectType || "VERTICAL").toUpperCase(),
        status: p.status || "ACTIVE",
        image: p.coverImagePath || p.image || matchedDev?.logoPath || "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=800&q=80",
        coverFileName: p.coverImagePath || p.image || null,
        logoFileName: p.logoFileName || p.logoUrl || p.logo || null,
        logoUrl: p.logoFileName || p.logoUrl || p.logo || null,
        logo: p.logoFileName || p.logoUrl || p.logo || null,
        totalUnits,
        soldUnits,
        availableUnits,
        blockedUnits: Math.max(0, totalUnits - soldUnits - availableUnits),
        metrics: p.metrics || {
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
        documents: [],
        additionals: [],
      };
    });

    const developerObj = {
      id: matchedDev?.id || `dev-${Date.now()}`,
      name: devName,
      commercialName: devName,
      legalName: devLegal,
      rfc: devRfc,
      city: devCity,
      email: devEmail,
      phone: devPhone,
      logoPath: matchedDev?.logoPath || matchedDev?.logoUrl || matchedDev?.logo || null,
      logoUrl: matchedDev?.logoPath || matchedDev?.logoUrl || matchedDev?.logo || null,
      logo: matchedDev?.logoPath || matchedDev?.logoUrl || matchedDev?.logo || null,
    };

    const userObj = {
      id: matchedMembership?.user?.id || `usr-${Date.now()}`,
      fullName: userFullName,
      email: cleanEmail,
      phone: matchedMembership?.user?.phone || devPhone,
      role: userRole,
      roleTitle: userRoleTitle,
      permissions: ["all"],
      isSuperAdmin: isSuperAdmin,
      activeDeveloper: devName,
    };

    const token = `devio_token_usr_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

    return NextResponse.json({
      success: true,
      user: userObj,
      developer: developerObj,
      activeDeveloper: developerObj,
      projects: mappedProjects,
      token,
    });
  } catch (error: any) {
    console.error("Error in /api/auth/login:", error);
    return NextResponse.json(
      { error: error.message || "Error al autenticar usuario" },
      { status: 500 }
    );
  }
}
