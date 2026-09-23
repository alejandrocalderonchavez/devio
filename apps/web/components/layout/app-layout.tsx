"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  Building2,
  Store,
  Settings,
  HelpCircle,
  Plus,
  LogOut,
  ChevronLeft,
  Home,
  Users,
  CreditCard,
  DollarSign,
  FileText,
  Coins,
  Percent,
  Edit3,
  Activity,
  CheckCircle2,
  X,
  ExternalLink,
  Wrench,
  ShieldAlert,
  Bell,
} from "lucide-react";
import { useProject, Currency } from "../../context/project-context";

interface AppLayoutProps {
  children: React.ReactNode;
  activeProjectId?: string;
  projectSubTab?: "dashboard" | "units" | "clients" | "sales" | "payments" | "documents" | "marketplace" | "postventa";
  isAdmin?: boolean;
  adminSubTab?: "overview" | "developers" | "notifications" | "pricing" | "health";
  onAdminTabChange?: (tab: "overview" | "developers" | "notifications" | "pricing" | "health") => void;
  onOpenNewSale?: () => void;
  onOpenEditProject?: () => void;
  onOpenProgress?: () => void;
  onOpenBulkPrice?: () => void;
  onOpenEditInventory?: () => void;
  headerActions?: React.ReactNode;
}

export default function AppLayout({
  children,
  activeProjectId,
  projectSubTab,
  isAdmin,
  adminSubTab,
  onAdminTabChange,
  onOpenNewSale,
  onOpenEditProject,
  onOpenProgress,
  onOpenBulkPrice,
  onOpenEditInventory,
  headerActions,
}: AppLayoutProps) {
  const pathname = usePathname();
  const { projects, currency, setCurrency, userName, userEmail, developerName, developerLogo, toast, hideToast, showToast, logout, hasPermission } = useProject();

  const [impersonation, setImpersonation] = React.useState<{
    active: boolean;
    developerName: string;
    userName: string;
  } | null>(null);

  React.useEffect(() => {
    if (typeof window !== "undefined") {
      const raw = localStorage.getItem("devio_impersonation") || sessionStorage.getItem("devio_impersonation");
      if (raw) {
        try {
          const parsed = JSON.parse(raw);
          if (parsed?.active) setImpersonation(parsed);
        } catch (e) {}
      } else {
        setImpersonation(null);
      }
    }
  }, [pathname]);

  const handleStopImpersonation = () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("devio_impersonation");
      sessionStorage.removeItem("devio_impersonation");
    }
    setImpersonation(null);
    showToast("Sesión Restaurada", "Has salido del modo impersonación.");
    try {
      window.close();
    } catch (e) {}
    window.location.href = "/super-admin";
  };

  const activeProject = activeProjectId
    ? projects.find((p) => p.id === activeProjectId) || projects[0]
    : undefined;

  const currentTab = projectSubTab || (
    pathname.includes("/units") ? "units" :
    pathname.includes("/clients") ? "clients" :
    pathname.includes("/sales") ? "sales" :
    pathname.includes("/payments") ? "payments" :
    pathname.includes("/documents") ? "documents" :
    pathname.includes("/postventa") ? "postventa" :
    "dashboard"
  );

  const isAdminMode = Boolean(isAdmin || pathname.startsWith("/super-admin"));
  const currentAdminTab = adminSubTab || "overview";

  const banxicoRate = 18.35;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        minHeight: "100vh",
        maxHeight: "100vh",
        overflow: "hidden",
        backgroundColor: "#EEF3F8",
      }}
    >
      <div
        style={{
          display: "flex",
          flex: 1,
          minHeight: 0,
          overflow: "hidden",
        }}
      >
      {/* Toast Notification */}
      {toast && (
        <div
          style={{
            position: "fixed",
            bottom: "1.5rem",
            right: "1.5rem",
            zIndex: 99999,
            backgroundColor: "#1B3047",
            color: "#FFFFFF",
            padding: "0.85rem 1.25rem",
            borderRadius: "0.85rem",
            boxShadow: "0 10px 30px rgba(0,0,0,0.2)",
            display: "flex",
            alignItems: "center",
            gap: "0.75rem",
            maxWidth: "400px",
          }}
        >
          <CheckCircle2 size={20} style={{ color: "#00C48C", flexShrink: 0 }} />
          <div style={{ flex: 1 }}>
            <strong style={{ fontSize: "0.85rem", display: "block" }}>{toast.title}</strong>
            <span style={{ fontSize: "0.75rem", color: "#94A3B8" }}>{toast.desc}</span>
          </div>
          <button
            type="button"
            onClick={hideToast}
            style={{ background: "none", border: "none", color: "#94A3B8", cursor: "pointer" }}
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* ---------------------------------------------------------------------- */}
      {/* SIDEBAR DE NAVEGACIÓN IZQUIERDO */}
      {/* ---------------------------------------------------------------------- */}
      <aside
        style={{
          width: "220px",
          backgroundColor: "#FFFFFF",
          borderRight: "1px solid rgba(22, 43, 63, 0.08)",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "1.25rem 1rem",
          position: "sticky",
          top: 0,
          height: "100vh",
          flexShrink: 0,
        }}
      >
        <div>
          {/* Logo Devio Oficial + Badge de Modo Admin */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem", paddingLeft: "0.25rem" }}>
            <Link
              href={isAdminMode ? "/super-admin" : "/dashboard"}
              style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: "0.6rem" }}
            >
              <img
                src="/brand/13.png"
                alt="Devio"
                style={{ height: "28px", width: "auto", objectFit: "contain" }}
              />
            </Link>
            {isAdminMode && (
              <span
                style={{
                  fontSize: "0.65rem",
                  fontWeight: 800,
                  color: "#00C48C",
                  backgroundColor: "rgba(0, 196, 140, 0.12)",
                  padding: "0.2rem 0.5rem",
                  borderRadius: "9999px",
                  letterSpacing: "0.04em",
                }}
              >
                ADMIN
              </span>
            )}
          </div>

          {/* Insignia Oficial de la Desarrolladora Activa con su Logotipo */}
          {!isAdminMode && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.6rem",
                padding: "0.5rem 0.65rem",
                marginBottom: "1.25rem",
                backgroundColor: "#F8FAFC",
                borderRadius: "0.75rem",
                border: "1px solid #E2E8F0",
                boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
              }}
            >
              {developerLogo ? (
                <img
                  src={developerLogo}
                  alt={developerName}
                  style={{
                    height: "26px",
                    width: "26px",
                    objectFit: "contain",
                    borderRadius: "6px",
                    backgroundColor: "#FFFFFF",
                    padding: "2px",
                    border: "1px solid #E2E8F0",
                    flexShrink: 0,
                  }}
                  onError={(e) => { (e.currentTarget as HTMLElement).style.display = "none"; }}
                />
              ) : (
                <div
                  style={{
                    width: "26px",
                    height: "26px",
                    borderRadius: "6px",
                    backgroundColor: "rgba(47, 128, 237, 0.08)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#2F80ED",
                    flexShrink: 0,
                  }}
                >
                  <Building2 size={14} />
                </div>
              )}
              <div style={{ display: "flex", flexDirection: "column", minWidth: 0, overflow: "hidden" }}>
                <span style={{ fontSize: "0.62rem", fontWeight: 700, color: "#94A3B8", textTransform: "uppercase", letterSpacing: "0.04em", lineHeight: 1 }}>
                  Desarrolladora
                </span>
                <span style={{ fontSize: "0.82rem", fontWeight: 700, color: "#1F3652", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", marginTop: "2px" }}>
                  {developerName}
                </span>
              </div>
            </div>
          )}

          {/* Menú: Modo Super Admin Exclusivo vs Modo Proyecto vs Modo General */}
          {isAdminMode ? (
            <div>
              <div style={{ fontSize: "0.7rem", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.06em", color: "#94A3B8", padding: "0 0.5rem 0.5rem 0.5rem" }}>
                Consola Maestra
              </div>
              <nav style={{ display: "flex", flexDirection: "column", gap: "0.3rem" }}>
                <button
                  type="button"
                  onClick={() => onAdminTabChange ? onAdminTabChange("overview") : (window.location.href = "/super-admin?tab=overview")}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.65rem",
                    padding: "0.6rem 0.75rem",
                    borderRadius: "0.5rem",
                    border: "none",
                    backgroundColor: currentAdminTab === "overview" ? "rgba(31, 54, 82, 0.08)" : "transparent",
                    color: currentAdminTab === "overview" ? "#1F3652" : "#64748B",
                    fontWeight: currentAdminTab === "overview" ? 700 : 500,
                    fontSize: "0.85rem",
                    width: "100%",
                    textAlign: "left",
                    cursor: "pointer",
                    transition: "all 0.15s ease",
                  }}
                >
                  <BarChart3 size={17} color={currentAdminTab === "overview" ? "#2F80ED" : "currentColor"} />
                  Resumen
                </button>

                <button
                  type="button"
                  onClick={() => onAdminTabChange ? onAdminTabChange("developers") : (window.location.href = "/super-admin?tab=developers")}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.65rem",
                    padding: "0.6rem 0.75rem",
                    borderRadius: "0.5rem",
                    border: "none",
                    backgroundColor: currentAdminTab === "developers" ? "rgba(31, 54, 82, 0.08)" : "transparent",
                    color: currentAdminTab === "developers" ? "#1F3652" : "#64748B",
                    fontWeight: currentAdminTab === "developers" ? 700 : 500,
                    fontSize: "0.85rem",
                    width: "100%",
                    textAlign: "left",
                    cursor: "pointer",
                    transition: "all 0.15s ease",
                  }}
                >
                  <Building2 size={17} color={currentAdminTab === "developers" ? "#2F80ED" : "currentColor"} />
                  Desarrolladoras
                </button>

                <button
                  type="button"
                  onClick={() => onAdminTabChange ? onAdminTabChange("notifications") : (window.location.href = "/super-admin?tab=notifications")}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.65rem",
                    padding: "0.6rem 0.75rem",
                    borderRadius: "0.5rem",
                    border: "none",
                    backgroundColor: currentAdminTab === "notifications" ? "rgba(31, 54, 82, 0.08)" : "transparent",
                    color: currentAdminTab === "notifications" ? "#1F3652" : "#64748B",
                    fontWeight: currentAdminTab === "notifications" ? 700 : 500,
                    fontSize: "0.85rem",
                    width: "100%",
                    textAlign: "left",
                    cursor: "pointer",
                    transition: "all 0.15s ease",
                  }}
                >
                  <Bell size={17} color={currentAdminTab === "notifications" ? "#2F80ED" : "currentColor"} />
                  Notificaciones
                </button>

                <button
                  type="button"
                  onClick={() => onAdminTabChange ? onAdminTabChange("pricing") : (window.location.href = "/super-admin?tab=pricing")}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.65rem",
                    padding: "0.6rem 0.75rem",
                    borderRadius: "0.5rem",
                    border: "none",
                    backgroundColor: currentAdminTab === "pricing" ? "rgba(31, 54, 82, 0.08)" : "transparent",
                    color: currentAdminTab === "pricing" ? "#1F3652" : "#64748B",
                    fontWeight: currentAdminTab === "pricing" ? 700 : 500,
                    fontSize: "0.85rem",
                    width: "100%",
                    textAlign: "left",
                    cursor: "pointer",
                    transition: "all 0.15s ease",
                  }}
                >
                  <DollarSign size={17} color={currentAdminTab === "pricing" ? "#2F80ED" : "currentColor"} />
                  Pricing & Planes
                </button>

                <button
                  type="button"
                  onClick={() => onAdminTabChange ? onAdminTabChange("health") : (window.location.href = "/super-admin?tab=health")}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.65rem",
                    padding: "0.6rem 0.75rem",
                    borderRadius: "0.5rem",
                    border: "none",
                    backgroundColor: currentAdminTab === "health" ? "rgba(31, 54, 82, 0.08)" : "transparent",
                    color: currentAdminTab === "health" ? "#1F3652" : "#64748B",
                    fontWeight: currentAdminTab === "health" ? 700 : 500,
                    fontSize: "0.85rem",
                    width: "100%",
                    textAlign: "left",
                    cursor: "pointer",
                    transition: "all 0.15s ease",
                  }}
                >
                  <Activity size={17} color={currentAdminTab === "health" ? "#2F80ED" : "currentColor"} />
                  Salud & Auditoría
                </button>
              </nav>
            </div>
          ) : activeProject ? (
            <div>
              {/* Botón Volver a Todos los Proyectos */}
              <Link
                href="/projects"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.4rem",
                  padding: "0.4rem 0.6rem",
                  marginBottom: "0.75rem",
                  borderRadius: "0.5rem",
                  border: "none",
                  backgroundColor: "rgba(31, 54, 82, 0.04)",
                  color: "#1F3652",
                  fontSize: "0.78rem",
                  fontWeight: 600,
                  width: "100%",
                  textDecoration: "none",
                }}
              >
                <ChevronLeft size={14} /> Proyectos
              </Link>

              {/* Nombre y Logotipo del Proyecto Activo */}
              <div style={{ display: "flex", alignItems: "center", gap: "0.55rem", padding: "0.5rem 0.65rem", marginBottom: "0.75rem", backgroundColor: "rgba(47, 128, 237, 0.08)", borderRadius: "0.6rem", color: "#2F80ED" }}>
                {(activeProject.logoFileName || (activeProject as any).logo || (activeProject as any).logoUrl) ? (
                  <img
                    src={activeProject.logoFileName || (activeProject as any).logo || (activeProject as any).logoUrl}
                    alt={activeProject.name}
                    style={{
                      height: "26px",
                      width: "26px",
                      objectFit: "contain",
                      borderRadius: "5px",
                      backgroundColor: "#FFFFFF",
                      padding: "2px",
                      border: "1px solid rgba(47, 128, 237, 0.2)",
                      flexShrink: 0,
                    }}
                    onError={(e) => { (e.currentTarget as HTMLElement).style.display = "none"; }}
                  />
                ) : (
                  <BarChart3 size={18} style={{ flexShrink: 0 }} />
                )}
                <span style={{ fontSize: "0.82rem", fontWeight: 700, lineHeight: 1.2, color: "#1F3652", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {activeProject.name}
                </span>
              </div>

              {/* Sub-Navegación del Proyecto */}
              <nav style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                {hasPermission("dashboard.view_general") && (
                  <Link
                    href={`/projects/${activeProject.id}`}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.65rem",
                      padding: "0.55rem 0.75rem",
                      borderRadius: "0.5rem",
                      backgroundColor: currentTab === "dashboard" ? "rgba(31, 54, 82, 0.08)" : "transparent",
                      color: currentTab === "dashboard" ? "#1F3652" : "#64748B",
                      fontWeight: currentTab === "dashboard" ? 700 : 500,
                      fontSize: "0.85rem",
                      width: "100%",
                      textAlign: "left",
                      textDecoration: "none",
                    }}
                  >
                    <BarChart3 size={16} /> Dashboard
                  </Link>
                )}

                {hasPermission("units.view") && (
                  <Link
                    href={`/projects/${activeProject.id}/units`}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.65rem",
                      padding: "0.55rem 0.75rem",
                      borderRadius: "0.5rem",
                      backgroundColor: currentTab === "units" ? "rgba(31, 54, 82, 0.08)" : "transparent",
                      color: currentTab === "units" ? "#1F3652" : "#64748B",
                      fontWeight: currentTab === "units" ? 700 : 500,
                      fontSize: "0.85rem",
                      width: "100%",
                      textAlign: "left",
                      textDecoration: "none",
                    }}
                  >
                    <Home size={16} /> Unidades
                  </Link>
                )}

                {hasPermission("clients.view") && (
                  <Link
                    href={`/projects/${activeProject.id}/clients`}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.65rem",
                      padding: "0.55rem 0.75rem",
                      borderRadius: "0.5rem",
                      backgroundColor: currentTab === "clients" ? "rgba(31, 54, 82, 0.08)" : "transparent",
                      color: currentTab === "clients" ? "#1F3652" : "#64748B",
                      fontWeight: currentTab === "clients" ? 700 : 500,
                      fontSize: "0.85rem",
                      width: "100%",
                      textAlign: "left",
                      textDecoration: "none",
                    }}
                  >
                    <Users size={16} /> Clientes
                  </Link>
                )}

                {hasPermission("sales.view") && (
                  <Link
                    href={`/projects/${activeProject.id}/sales`}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.65rem",
                      padding: "0.55rem 0.75rem",
                      borderRadius: "0.5rem",
                      backgroundColor: currentTab === "sales" ? "rgba(31, 54, 82, 0.08)" : "transparent",
                      color: currentTab === "sales" ? "#1F3652" : "#64748B",
                      fontWeight: currentTab === "sales" ? 700 : 500,
                      fontSize: "0.85rem",
                      width: "100%",
                      textAlign: "left",
                      textDecoration: "none",
                    }}
                  >
                    <CreditCard size={16} /> Ventas
                  </Link>
                )}

                {hasPermission("payments.view") && (
                  <Link
                    href={`/projects/${activeProject.id}/payments`}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.65rem",
                      padding: "0.55rem 0.75rem",
                      borderRadius: "0.5rem",
                      backgroundColor: currentTab === "payments" ? "rgba(31, 54, 82, 0.08)" : "transparent",
                      color: currentTab === "payments" ? "#1F3652" : "#64748B",
                      fontWeight: currentTab === "payments" ? 700 : 500,
                      fontSize: "0.85rem",
                      width: "100%",
                      textAlign: "left",
                      textDecoration: "none",
                    }}
                  >
                    <DollarSign size={16} /> Pagos
                  </Link>
                )}

                {hasPermission("documents.view") && (
                  <Link
                    href={`/projects/${activeProject.id}/documents`}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.65rem",
                      padding: "0.55rem 0.75rem",
                      borderRadius: "0.5rem",
                      backgroundColor: currentTab === "documents" ? "rgba(31, 54, 82, 0.08)" : "transparent",
                      color: currentTab === "documents" ? "#1F3652" : "#64748B",
                      fontWeight: currentTab === "documents" ? 700 : 500,
                      fontSize: "0.85rem",
                      width: "100%",
                      textAlign: "left",
                      textDecoration: "none",
                    }}
                  >
                    <FileText size={16} /> Documentos
                  </Link>
                )}

                {hasPermission("postventa.view") && (
                  <Link
                    href={`/projects/${activeProject.id}/postventa`}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.65rem",
                      padding: "0.55rem 0.75rem",
                      borderRadius: "0.5rem",
                      backgroundColor: currentTab === "postventa" ? "rgba(31, 54, 82, 0.08)" : "transparent",
                      color: currentTab === "postventa" ? "#1F3652" : "#64748B",
                      fontWeight: currentTab === "postventa" ? 700 : 500,
                      fontSize: "0.85rem",
                      width: "100%",
                      textAlign: "left",
                      textDecoration: "none",
                    }}
                  >
                    <Wrench size={16} /> Postventa
                  </Link>
                )}

                <Link
                  href="/marketplace"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "0.55rem 0.75rem",
                    borderRadius: "0.5rem",
                    backgroundColor: "transparent",
                    color: "#64748B",
                    fontWeight: 500,
                    fontSize: "0.85rem",
                    width: "100%",
                    textAlign: "left",
                    textDecoration: "none",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "0.65rem" }}>
                    <Store size={16} /> Marketplace
                  </div>
                  <ExternalLink size={12} color="#94A3B8" />
                </Link>
              </nav>
            </div>
          ) : (
            /* Menú Principal General */
            <nav style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
              <Link
                href="/dashboard"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.75rem",
                  padding: "0.65rem 0.85rem",
                  borderRadius: "0.65rem",
                  backgroundColor: pathname === "/dashboard" ? "rgba(31, 54, 82, 0.08)" : "transparent",
                  color: pathname === "/dashboard" ? "#1F3652" : "#64748B",
                  fontWeight: pathname === "/dashboard" ? 700 : 500,
                  fontSize: "0.9rem",
                  width: "100%",
                  textAlign: "left",
                  textDecoration: "none",
                  transition: "all 0.15s ease",
                }}
              >
                <BarChart3 size={18} color={pathname === "/dashboard" ? "#2F80ED" : "currentColor"} />
                Dashboard
              </Link>

              <Link
                href="/projects"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.75rem",
                  padding: "0.65rem 0.85rem",
                  borderRadius: "0.65rem",
                  backgroundColor: pathname.startsWith("/projects") ? "rgba(31, 54, 82, 0.08)" : "transparent",
                  color: pathname.startsWith("/projects") ? "#1F3652" : "#64748B",
                  fontWeight: pathname.startsWith("/projects") ? 700 : 500,
                  fontSize: "0.9rem",
                  width: "100%",
                  textAlign: "left",
                  textDecoration: "none",
                  transition: "all 0.15s ease",
                }}
              >
                <Building2 size={18} color={pathname.startsWith("/projects") ? "#2F80ED" : "currentColor"} />
                Proyectos
              </Link>

              <Link
                href="/marketplace"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "0.65rem 0.85rem",
                  borderRadius: "0.65rem",
                  backgroundColor: "transparent",
                  color: "#64748B",
                  fontWeight: 500,
                  fontSize: "0.9rem",
                  width: "100%",
                  textAlign: "left",
                  textDecoration: "none",
                  transition: "all 0.15s ease",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                  <Store size={18} color="currentColor" />
                  Marketplace
                </div>
                <ExternalLink size={13} color="#94A3B8" />
              </Link>
            </nav>
          )}
        </div>

        {/* Menú Inferior (Super Admin / Volver a la App, Configuración y Ayuda) */}
        <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem", borderTop: "1px solid #E2E8F0", paddingTop: "1rem" }}>
          {isAdminMode ? (
            <Link
              href="/dashboard"
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.6rem",
                padding: "0.55rem 0.85rem",
                borderRadius: "0.5rem",
                backgroundColor: "rgba(31, 54, 82, 0.04)",
                color: "#1F3652",
                fontSize: "0.82rem",
                fontWeight: 700,
                width: "100%",
                textAlign: "left",
                textDecoration: "none",
                transition: "all 0.15s ease",
              }}
            >
              <ChevronLeft size={16} color="#2F80ED" /> Volver a la App
            </Link>
          ) : (
            /* Exclusivo para acalderoncha@gmail.com */
            (userEmail || "").toLowerCase().trim() === "acalderoncha@gmail.com" && (
              <Link
                href="/super-admin"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.75rem",
                  padding: "0.55rem 0.85rem",
                  borderRadius: "0.5rem",
                  backgroundColor: "rgba(31, 54, 82, 0.04)",
                  color: "var(--devio-blue-dark)",
                  fontSize: "0.85rem",
                  fontWeight: 700,
                  width: "100%",
                  textAlign: "left",
                  textDecoration: "none",
                  transition: "all 0.15s ease",
                }}
              >
                <ShieldAlert size={16} color="var(--devio-blue)" /> Devio Super Admin
              </Link>
            )
          )}

          {!isAdminMode && (
            <>
              <Link
                href="/settings"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.75rem",
                  padding: "0.55rem 0.85rem",
                  borderRadius: "0.5rem",
                  backgroundColor: pathname === "/settings" ? "rgba(31, 54, 82, 0.08)" : "transparent",
                  color: pathname === "/settings" ? "#1F3652" : "#64748B",
                  fontSize: "0.85rem",
                  fontWeight: pathname === "/settings" ? 700 : 500,
                  width: "100%",
                  textAlign: "left",
                  textDecoration: "none",
                }}
              >
                <Settings size={16} /> Configuración
              </Link>

              <Link
                href="/settings"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.75rem",
                  padding: "0.55rem 0.85rem",
                  borderRadius: "0.5rem",
                  backgroundColor: "transparent",
                  color: "#64748B",
                  fontSize: "0.85rem",
                  width: "100%",
                  textAlign: "left",
                  textDecoration: "none",
                }}
              >
                <HelpCircle size={16} /> Ayuda
              </Link>
            </>
          )}
        </div>
      </aside>

      {/* ---------------------------------------------------------------------- */}
      {/* ÁREA DE CONTENIDO PRINCIPAL */}
      {/* ---------------------------------------------------------------------- */}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          minWidth: 0,
          height: "100vh",
          overflowY: "hidden",
        }}
      >
        {/* TOP BAR SUPERIOR */}
        <header
          style={{
            padding: "0.85rem 1.5rem 0.5rem 1.5rem",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexShrink: 0,
          }}
        >
          {/* Botones de Acción */}
          <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
            {activeProject ? (
              currentTab === "units" ? (
                <>
                  {hasPermission("units.bulk_price") && (
                    <button
                      type="button"
                      onClick={onOpenBulkPrice}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "0.45rem",
                        backgroundColor: "#1B3047",
                        color: "#FFFFFF",
                        padding: "0.55rem 1.15rem",
                        borderRadius: "9999px",
                        fontSize: "0.82rem",
                        fontWeight: 600,
                        border: "none",
                        cursor: "pointer",
                        boxShadow: "0 2px 6px rgba(27, 48, 71, 0.15)",
                      }}
                    >
                      <Percent size={15} /> Cambiar precios
                    </button>
                  )}

                  {hasPermission("units.edit_specs") && (
                    <button
                      type="button"
                      onClick={onOpenEditInventory}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "0.45rem",
                        backgroundColor: "#1B3047",
                        color: "#FFFFFF",
                        padding: "0.55rem 1.15rem",
                        borderRadius: "9999px",
                        fontSize: "0.82rem",
                        fontWeight: 600,
                        border: "none",
                        cursor: "pointer",
                        boxShadow: "0 2px 6px rgba(27, 48, 71, 0.15)",
                      }}
                    >
                      <Edit3 size={15} /> Editar Inventario
                    </button>
                  )}
                </>
              ) : currentTab === "dashboard" ? (
                <>
                  {hasPermission("sales.create") && (
                    <button
                      type="button"
                      onClick={onOpenNewSale}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "0.45rem",
                        backgroundColor: "#1B3047",
                        color: "#FFFFFF",
                        padding: "0.55rem 1.15rem",
                        borderRadius: "9999px",
                        fontSize: "0.82rem",
                        fontWeight: 600,
                        border: "none",
                        cursor: "pointer",
                        boxShadow: "0 2px 6px rgba(27, 48, 71, 0.15)",
                      }}
                    >
                      <Plus size={15} /> Nueva Venta
                    </button>
                  )}

                  {hasPermission("projects.edit") && (
                    <button
                      type="button"
                      onClick={onOpenEditProject}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "0.45rem",
                        backgroundColor: "#1B3047",
                        color: "#FFFFFF",
                        padding: "0.55rem 1.15rem",
                        borderRadius: "9999px",
                        fontSize: "0.82rem",
                        fontWeight: 600,
                        border: "none",
                        cursor: "pointer",
                        boxShadow: "0 2px 6px rgba(27, 48, 71, 0.15)",
                      }}
                    >
                      <Edit3 size={15} /> Editar Proyecto
                    </button>
                  )}

                  {hasPermission("obra.register_progress") && (
                    <button
                      type="button"
                      onClick={onOpenProgress}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "0.45rem",
                        backgroundColor: "#1B3047",
                        color: "#FFFFFF",
                        padding: "0.55rem 1.15rem",
                        borderRadius: "9999px",
                        fontSize: "0.82rem",
                        fontWeight: 600,
                        border: "none",
                        cursor: "pointer",
                        boxShadow: "0 2px 6px rgba(27, 48, 71, 0.15)",
                      }}
                    >
                      <Activity size={15} /> Registrar avance
                    </button>
                  )}
                </>
              ) : null
            ) : null}
            {headerActions}
          </div>

          {/* Saludo al Usuario, Selector MXN/USD y Salir */}
          <div style={{ display: "flex", alignItems: "center", gap: "1.25rem" }}>
            {/* Tasa Banxico Switcher */}
            <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", backgroundColor: "#FFFFFF", padding: "0.25rem 0.65rem", borderRadius: "9999px", border: "1px solid #E2E8F0", boxShadow: "0 1px 4px rgba(0,0,0,0.03)" }}>
              <Coins size={14} style={{ color: "#00C48C" }} />
              <span style={{ fontSize: "0.72rem", fontWeight: 600, color: "#1F3652" }}>
                ${banxicoRate.toFixed(2)} MXN
              </span>
              <div style={{ display: "flex", gap: "0.2rem", marginLeft: "0.25rem" }}>
                <button
                  type="button"
                  onClick={() => setCurrency("MXN")}
                  style={{
                    padding: "0.15rem 0.45rem",
                    borderRadius: "9999px",
                    border: "none",
                    fontSize: "0.68rem",
                    fontWeight: 700,
                    cursor: "pointer",
                    backgroundColor: currency === "MXN" ? "#1F3652" : "transparent",
                    color: currency === "MXN" ? "#FFFFFF" : "#64748B",
                  }}
                >
                  MXN
                </button>
                <button
                  type="button"
                  onClick={() => setCurrency("USD")}
                  style={{
                    padding: "0.15rem 0.45rem",
                    borderRadius: "9999px",
                    border: "none",
                    fontSize: "0.68rem",
                    fontWeight: 700,
                    cursor: "pointer",
                    backgroundColor: currency === "USD" ? "#1F3652" : "transparent",
                    color: currency === "USD" ? "#FFFFFF" : "#64748B",
                  }}
                >
                  USD
                </button>
              </div>
            </div>

            {/* Saludo al Usuario con Avatar */}
            <div style={{ display: "flex", alignItems: "center", gap: "0.55rem" }}>
              <div
                style={{
                  width: "32px",
                  height: "32px",
                  borderRadius: "50%",
                  border: "1.5px solid #2F80ED",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#2F80ED",
                  backgroundColor: "#FFFFFF",
                }}
              >
                <Users size={16} />
              </div>
              <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "#1F3652" }}>
                {userName}
              </span>
              <button
                type="button"
                onClick={logout}
                title="Cerrar sesión"
                style={{
                  marginLeft: "0.25rem",
                  color: "#E05345",
                  display: "flex",
                  alignItems: "center",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  padding: "0.2rem",
                }}
              >
                <LogOut size={16} />
              </button>
            </div>
          </div>
        </header>

        {/* Page Content Body */}
        {children}
      </div>
    </div>

    {/* Floating Sleek Non-Intrusive Impersonation Badge */}
    {impersonation?.active && (
      <div
        style={{
          position: "fixed",
          bottom: "1.25rem",
          right: "1.25rem",
          zIndex: 99999,
          display: "flex",
          alignItems: "center",
          gap: "0.75rem",
          backgroundColor: "rgba(27, 48, 71, 0.95)",
          backdropFilter: "blur(12px)",
          border: "1px solid rgba(0, 196, 140, 0.4)",
          borderRadius: "9999px",
          padding: "0.45rem 0.85rem 0.45rem 0.95rem",
          boxShadow: "0 12px 28px rgba(0, 0, 0, 0.35), 0 0 16px rgba(0, 196, 140, 0.2)",
          color: "#FFFFFF",
          fontSize: "0.78rem",
          animation: "fadeIn 0.2s ease-in-out",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.45rem" }}>
          <span
            style={{
              width: "8px",
              height: "8px",
              borderRadius: "50%",
              backgroundColor: "#00C48C",
              boxShadow: "0 0 8px #00C48C",
            }}
          />
          <span style={{ color: "#8DA4BF" }}>Impersonando:</span>
          <strong style={{ color: "#00C48C", fontWeight: 700 }}>{impersonation.userName}</strong>
          <span style={{ color: "#CBD5E1", fontSize: "0.72rem" }}>({impersonation.developerName})</span>
        </div>
        <button
          type="button"
          onClick={handleStopImpersonation}
          style={{
            backgroundColor: "rgba(224, 83, 69, 0.2)",
            color: "#FF8A80",
            border: "1px solid rgba(224, 83, 69, 0.4)",
            borderRadius: "9999px",
            padding: "0.2rem 0.65rem",
            fontSize: "0.7rem",
            fontWeight: 700,
            cursor: "pointer",
            transition: "all 0.15s ease",
          }}
          onMouseOver={(e) => (e.currentTarget.style.backgroundColor = "rgba(224, 83, 69, 0.4)")}
          onMouseOut={(e) => (e.currentTarget.style.backgroundColor = "rgba(224, 83, 69, 0.2)")}
        >
          Salir
        </button>
      </div>
    )}
  </div>
  );
}
