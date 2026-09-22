import { NextResponse } from "next/server";

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

    // Check SUPERADMIN_EMAILS environment variable (comma/semicolon/space separated)
    const rawSuperAdminEnv = process.env.SUPERADMIN_EMAILS || "acalderoncha@gmail.com";
    const superAdminList = rawSuperAdminEnv
      .split(/[,;\s]+/)
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean);

    // Fallback default superadmin email
    if (!superAdminList.includes("acalderoncha@gmail.com")) {
      superAdminList.push("acalderoncha@gmail.com");
    }

    const isSuperAdmin = superAdminList.includes(cleanEmail);

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
        activeDeveloper: "Devio Global",
      };

      const token = `devio_token_sa_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

      return NextResponse.json({
        success: true,
        user,
        token,
        activeDeveloper: {
          id: "dev-global",
          name: "Devio Global",
        },
      });
    }

    // Generic staff or client user login
    const user = {
      id: `usr-${Date.now()}`,
      fullName: "Usuario Devio",
      email: cleanEmail,
      phone: "",
      role: "Director Comercial",
      roleTitle: "Director / Administrador",
      permissions: ["all"],
      isSuperAdmin: false,
      activeDeveloper: "Mi Desarrolladora",
    };

    const token = `devio_token_usr_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

    return NextResponse.json({
      success: true,
      user,
      token,
      activeDeveloper: {
        id: "dev-default",
        name: "Mi Desarrolladora",
      },
    });
  } catch (error: any) {
    console.error("Error in /api/auth/login:", error);
    return NextResponse.json(
      { error: error.message || "Error al autenticar usuario" },
      { status: 500 }
    );
  }
}
