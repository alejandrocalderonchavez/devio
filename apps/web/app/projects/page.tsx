"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Building2,
  Home,
  Layers,
  DollarSign,
  Plus,
  Info,
  ChevronRight,
} from "lucide-react";
import AppLayout from "../../components/layout/app-layout";
import { useProject } from "../../context/project-context";

export default function ProjectsPage() {
  const router = useRouter();
  const { projects } = useProject();

  const totalUnitsAll = projects.reduce(
    (acc, p) => acc + (Number(p.totalUnits) || (p.unitsInventory?.length || 0)),
    0
  );
  const soldUnitsAll = projects.reduce(
    (acc, p) => acc + (Number(p.soldUnits) || (p.unitsInventory?.filter((u) => u.status === "VENDIDA").length || 0)),
    0
  );
  const availableUnitsAll = projects.reduce(
    (acc, p) => acc + (Number(p.availableUnits) || (p.unitsInventory?.filter((u) => u.status === "DISPONIBLE").length || 0)),
    0
  );

  return (
    <AppLayout>
      <main style={{ padding: "1.25rem 2rem 2rem 2rem", flex: 1, overflowY: "auto" }}>
        {/* 4 CARDS SUPERIORES DE RESUMEN DE PROYECTOS (Exacto a Screenshot 1) */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "1rem", marginBottom: "1.5rem" }}>
          <div style={{ backgroundColor: "#FFFFFF", borderRadius: "1.1rem", padding: "1.1rem 1.25rem", boxShadow: "0 2px 10px rgba(0,0,0,0.03)" }}>
            <span style={{ fontSize: "0.82rem", fontWeight: 600, color: "#64748B", display: "block", marginBottom: "0.4rem" }}>
              Total de Proyectos
            </span>
            <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
              <Building2 size={20} color="#94A3B8" />
              <h3 style={{ fontSize: "1.45rem", fontWeight: 800, color: "#1F3652", margin: 0 }}>
                {projects.length}
              </h3>
            </div>
          </div>

          <div style={{ backgroundColor: "#FFFFFF", borderRadius: "1.1rem", padding: "1.1rem 1.25rem", boxShadow: "0 2px 10px rgba(0,0,0,0.03)" }}>
            <span style={{ fontSize: "0.82rem", fontWeight: 600, color: "#64748B", display: "block", marginBottom: "0.4rem" }}>
              Total de Unidades
            </span>
            <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
              <Home size={20} color="#94A3B8" />
              <h3 style={{ fontSize: "1.45rem", fontWeight: 800, color: "#1F3652", margin: 0 }}>
                {totalUnitsAll}
              </h3>
            </div>
          </div>

          <div style={{ backgroundColor: "#FFFFFF", borderRadius: "1.1rem", padding: "1.1rem 1.25rem", boxShadow: "0 2px 10px rgba(0,0,0,0.03)" }}>
            <span style={{ fontSize: "0.82rem", fontWeight: 600, color: "#64748B", display: "block", marginBottom: "0.4rem" }}>
              Unidades Disponibles
            </span>
            <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
              <Layers size={20} color="#94A3B8" />
              <h3 style={{ fontSize: "1.45rem", fontWeight: 800, color: "#1F3652", margin: 0 }}>
                {availableUnitsAll}
              </h3>
            </div>
          </div>

          <div style={{ backgroundColor: "#FFFFFF", borderRadius: "1.1rem", padding: "1.1rem 1.25rem", boxShadow: "0 2px 10px rgba(0,0,0,0.03)" }}>
            <span style={{ fontSize: "0.82rem", fontWeight: 600, color: "#64748B", display: "block", marginBottom: "0.4rem" }}>
              Unidades Vendidas
            </span>
            <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
              <DollarSign size={20} color="#00C48C" />
              <h3 style={{ fontSize: "1.45rem", fontWeight: 800, color: "#1F3652", margin: 0 }}>
                {soldUnitsAll}
              </h3>
            </div>
          </div>
        </div>

        {/* SECCIÓN PROYECTOS */}
        <div style={{ marginBottom: "1.25rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h2 style={{ fontSize: "1.35rem", fontWeight: 800, color: "#1F3652", margin: 0 }}>
            Proyectos Activos
          </h2>
          <Link
            href="/onboarding/project"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.4rem",
              backgroundColor: "#1B3047",
              color: "#FFFFFF",
              padding: "0.5rem 1rem",
              borderRadius: "9999px",
              fontSize: "0.82rem",
              fontWeight: 600,
              textDecoration: "none",
            }}
          >
            <Plus size={14} /> Nuevo Proyecto
          </Link>
        </div>

        {/* GRID DE PROYECTOS O EMPTY STATE */}
        {projects.length === 0 ? (
          <div
            style={{
              backgroundColor: "#FFFFFF",
              borderRadius: "1.5rem",
              padding: "4rem 2rem",
              textAlign: "center",
              border: "1px dashed #CBD5E1",
              boxShadow: "0 4px 20px rgba(0,0,0,0.02)",
              maxWidth: "680px",
              margin: "1rem auto 3rem auto",
            }}
          >
            <div
              style={{
                width: "72px",
                height: "72px",
                borderRadius: "50%",
                backgroundColor: "#F1F5F9",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 1.5rem auto",
                color: "#94A3B8",
              }}
            >
              <Building2 size={36} />
            </div>
            <h3 style={{ fontSize: "1.35rem", fontWeight: 800, color: "#1F3652", margin: "0 0 0.5rem 0" }}>
              Aún no tienes proyectos registrados
            </h3>
            <p style={{ fontSize: "0.9rem", color: "#64748B", maxWidth: "480px", margin: "0 auto 1.75rem auto", lineHeight: 1.6 }}>
              Crea tu primer desarrollo inmobiliario para comenzar a gestionar el inventario de unidades, estados de cuenta, cartera de clientes, pagos y postventa desde Devio.
            </p>
            <Link
              href="/onboarding/project"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.5rem",
                backgroundColor: "#1B3047",
                color: "#FFFFFF",
                padding: "0.8rem 1.75rem",
                borderRadius: "9999px",
                fontSize: "0.88rem",
                fontWeight: 700,
                textDecoration: "none",
                boxShadow: "0 4px 14px rgba(27, 48, 71, 0.2)",
              }}
            >
              <Plus size={16} /> Crear tu Primer Proyecto
            </Link>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1.25rem" }}>
            {projects.map((project) => (
              <div
                key={project.id}
                onClick={() => router.push(`/projects/${project.id}`)}
                style={{
                  backgroundColor: "#FFFFFF",
                  borderRadius: "1.25rem",
                  overflow: "hidden",
                  boxShadow: "0 4px 15px rgba(0,0,0,0.04)",
                  border: "1px solid #E2E8F0",
                  display: "flex",
                  flexDirection: "column",
                  cursor: "pointer",
                  transition: "transform 0.2s ease, box-shadow 0.2s ease",
                }}
              >
                {/* Foto de Portada con Logo del Proyecto flotante */}
                <div style={{ width: "100%", height: "150px", position: "relative", overflow: "hidden", backgroundColor: "#E2E8F0" }}>
                  <img
                    src={
                      project.image && (project.image.startsWith("http") || project.image.startsWith("data:") || project.image.startsWith("/"))
                        ? project.image
                        : "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=800&q=80"
                    }
                    alt={project.name}
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=800&q=80";
                    }}
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  />
                  {(project.logoFileName || (project as any).logo || (project as any).logoUrl) && (
                    <div
                      style={{
                        position: "absolute",
                        bottom: "10px",
                        left: "10px",
                        backgroundColor: "#FFFFFF",
                        borderRadius: "8px",
                        padding: "4px 8px",
                        boxShadow: "0 2px 10px rgba(0,0,0,0.18)",
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                        border: "1px solid rgba(226, 232, 240, 0.9)",
                        maxWidth: "80%",
                      }}
                    >
                      <img
                        src={project.logoFileName || (project as any).logo || (project as any).logoUrl}
                        alt={project.name}
                        style={{ height: "24px", width: "auto", maxWidth: "80px", objectFit: "contain" }}
                        onError={(e) => { (e.currentTarget as HTMLElement).style.display = "none"; }}
                      />
                    </div>
                  )}
                </div>

                {/* Cuerpo de la Tarjeta */}
                <div style={{ padding: "1.15rem" }}>
                  <h3 style={{ fontSize: "1.05rem", fontWeight: 700, color: "#1F3652", margin: "0 0 0.25rem 0" }}>
                    {project.name}
                  </h3>

                  {/* Tipo */}
                  <div style={{ display: "flex", alignItems: "center", gap: "0.35rem", fontSize: "0.82rem", color: "#64748B", marginBottom: "0.75rem" }}>
                    <Building2 size={15} color="#2F80ED" />
                    <span><strong>Tipo:</strong> {project.type}</span>
                  </div>

                  {/* Barra de Progreso de Ventas y Porcentaje */}
                  {(() => {
                    const totalU = project.totalUnits || (project.unitsInventory?.length || 1);
                    const soldU = (project.unitsInventory || []).filter((u) => u.status === "VENDIDA").length || (project.soldUnits || 0);
                    const availU = (project.unitsInventory || []).filter((u) => u.status === "DISPONIBLE").length || (project.availableUnits ?? Math.max(0, totalU - soldU));
                    const salesPct = totalU > 0 ? Math.round((soldU / totalU) * 100) : (project.progressPct || 0);

                    return (
                      <>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1rem" }}>
                          <div style={{ width: "16px", height: "16px", borderRadius: "50%", border: "1px solid #CBD5E1", display: "flex", alignItems: "center", justifyContent: "center", color: "#64748B", flexShrink: 0 }}>
                            <Info size={11} />
                          </div>
                          <div style={{ flex: 1, height: "10px", backgroundColor: "#E6E9EF", borderRadius: "5px", overflow: "hidden" }}>
                            <div
                              style={{
                                height: "100%",
                                width: `${salesPct}%`,
                                backgroundColor: "#00C48C",
                                borderRadius: "5px",
                                transition: "width 0.3s ease",
                              }}
                            />
                          </div>
                          <span style={{ fontSize: "0.9rem", fontWeight: 800, color: "#00C48C", width: "36px", textAlign: "right" }}>
                            {salesPct}%
                          </span>
                        </div>

                        {/* 3 Mini Cajas Métricas */}
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "0.45rem" }}>
                          <div style={{ backgroundColor: "#EBF2F7", borderRadius: "0.5rem", padding: "0.45rem 0.5rem", display: "flex", alignItems: "center", gap: "0.35rem" }}>
                            <span style={{ fontSize: "1rem", fontWeight: 800, color: "#1F3652" }}>
                              {totalU}
                            </span>
                            <span style={{ fontSize: "0.65rem", color: "#64748B", lineHeight: 1.1 }}>
                              Unidades Totales
                            </span>
                          </div>

                          <div style={{ backgroundColor: "#E6F8F2", borderRadius: "0.5rem", padding: "0.45rem 0.5rem", display: "flex", alignItems: "center", gap: "0.35rem" }}>
                            <span style={{ fontSize: "1rem", fontWeight: 800, color: "#00C48C" }}>
                              {soldU}
                            </span>
                            <span style={{ fontSize: "0.65rem", color: "#64748B", lineHeight: 1.1 }}>
                              Unidades Vendidas
                            </span>
                          </div>

                          <div style={{ backgroundColor: "#FAF5EC", borderRadius: "0.5rem", padding: "0.45rem 0.5rem", display: "flex", alignItems: "center", gap: "0.35rem" }}>
                            <span style={{ fontSize: "1rem", fontWeight: 800, color: "#C7B28B" }}>
                              {availU}
                            </span>
                            <span style={{ fontSize: "0.65rem", color: "#64748B", lineHeight: 1.1 }}>
                              Unidades Disponibles
                            </span>
                          </div>
                        </div>
                      </>
                    );
                  })()}

                  <div style={{ marginTop: "0.85rem" }}>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "0.35rem",
                        width: "100%",
                        padding: "0.45rem",
                        borderRadius: "0.5rem",
                        backgroundColor: "rgba(31, 54, 82, 0.05)",
                        color: "#1F3652",
                        fontWeight: 600,
                        fontSize: "0.78rem",
                      }}
                    >
                      Entrar al Dashboard de Proyecto <ChevronRight size={14} />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </AppLayout>
  );
}
