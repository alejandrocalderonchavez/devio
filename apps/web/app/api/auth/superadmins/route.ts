import { NextResponse } from "next/server";

export async function GET() {
  try {
    const rawSuperAdminEnv = process.env.SUPERADMIN_EMAILS || "acalderoncha@gmail.com";
    const superAdminList = rawSuperAdminEnv
      .split(/[,;\s]+/)
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean);

    if (!superAdminList.includes("acalderoncha@gmail.com")) {
      superAdminList.push("acalderoncha@gmail.com");
    }

    return NextResponse.json({
      superAdminEmails: superAdminList,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Error al consultar superadmins" },
      { status: 500 }
    );
  }
}
