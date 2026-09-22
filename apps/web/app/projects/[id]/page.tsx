"use client";

import React, { useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  CheckCircle2,
  FileText,
  AlertCircle,
  TrendingUp,
  DollarSign,
  User,
  Building2,
} from "lucide-react";
import AppLayout from "../../../components/layout/app-layout";
import { useProject } from "../../../context/project-context";
import { UnitItem } from "../../../data/projects-data";
import CreateSaleWizardModal from "../../../components/sales/create-sale-wizard-modal";
import EditProjectModal from "../../../components/projects/edit-project-modal";
import RegisterProgressWizardModal from "../../../components/projects/register-progress-wizard-modal";

export default function ProjectDashboardPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = (params?.id as string) || "p-1";
  const { projects, currency, getProject, formatMoney, addSale, updateProjectProgress } = useProject();

  const project = getProject(projectId);

  const [hoveredCard, setHoveredCard] = useState<string | null>(null);
  const [hoveredMonth, setHoveredMonth] = useState<string | null>(null);
  const [hoveredClient, setHoveredClient] = useState<number | null>(null);

  // Modales
  const [showNewSaleModal, setShowNewSaleModal] = useState(false);
  const [showEditProjectModal, setShowEditProjectModal] = useState(false);
  const [showProgressModal, setShowProgressModal] = useState(false);

  const currentMonthlyBilling = useMemo(() => {
    if (!project) return [];
    const MONTH_NAMES = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
    const monthsMap: Record<string, { month: string; cobrado: number; porCobrar: number }> = {};

    MONTH_NAMES.forEach((m) => {
      monthsMap[m] = { month: m, cobrado: 0, porCobrar: 0 };
    });

    const parseMonthKey = (dateStr?: string): string => {
      if (!dateStr) return MONTH_NAMES[new Date().getMonth()] || "Sep";
      const str = String(dateStr).trim();

      // Named months
      for (const mName of MONTH_NAMES) {
        if (str.toLowerCase().includes(mName.toLowerCase())) {
          return mName;
        }
      }

      // Check YYYY-MM-DD or DD-MM-YYYY
      if (str.includes("-")) {
        const parts = str.split("-");
        if (parts.length === 3) {
          if (parts[0]!.length === 4) {
            const m = parseInt(parts[1]!, 10);
            if (m >= 1 && m <= 12) return MONTH_NAMES[m - 1]!;
          } else if (parts[2]!.length === 4) {
            const m = parseInt(parts[1]!, 10);
            if (m >= 1 && m <= 12) return MONTH_NAMES[m - 1]!;
          }
        }
      }

      // Check DD/MM/YYYY or YYYY/MM/DD
      if (str.includes("/")) {
        const parts = str.split("/");
        if (parts.length === 3) {
          if (parts[0]!.length === 4) {
            const m = parseInt(parts[1]!, 10);
            if (m >= 1 && m <= 12) return MONTH_NAMES[m - 1]!;
          } else {
            const m = parseInt(parts[1]!, 10);
            if (m >= 1 && m <= 12) return MONTH_NAMES[m - 1]!;
          }
        }
      }

      const d = new Date(str);
      if (!isNaN(d.getTime())) {
        return MONTH_NAMES[d.getMonth()]!;
      }

      return MONTH_NAMES[new Date().getMonth()] || "Sep";
    };

    const soldUnitsMap = new Map<string, UnitItem>();
    (project.unitsInventory || []).forEach((u) => {
      if (u.status === "VENDIDA") soldUnitsMap.set(u.unit, u);
    });

    const activeSales = (project.sales || []).filter(
      (s) => s.status !== "CANCELADA" && soldUnitsMap.has(s.unit)
    );

    activeSales.forEach((sale) => {
      (sale.schedule || []).forEach((inst) => {
        const mKey = parseMonthKey(inst.scheduledDate);
        const entry = monthsMap[mKey];
        if (entry) {
          entry.cobrado += Number(inst.paidAmount) || 0;
          entry.porCobrar += Number(inst.pendingAmount) || 0;
        }
      });
    });

    return Object.values(monthsMap);
  }, [project]);

  const currentOverdueClients = useMemo(() => {
    if (!project) return [];
    const soldUnitsMap = new Map<string, UnitItem>();
    (project.unitsInventory || []).forEach((u) => {
      if (u.status === "VENDIDA") soldUnitsMap.set(u.unit, u);
    });

    const activeSales = (project.sales || []).filter(
      (s) => s.status !== "CANCELADA" && soldUnitsMap.has(s.unit)
    );

    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const overdueList: Array<{ name: string; amount: number; unit?: string; daysOverdue?: number }> = [];

    activeSales.forEach((sale) => {
      (sale.schedule || []).forEach((inst) => {
        if (inst.status === "Atrasado" || (inst.pendingAmount > 0 && inst.scheduledDate)) {
          let instDate: Date | null = null;
          if (inst.scheduledDate.includes("-")) {
            const parts = inst.scheduledDate.split("-").map(Number);
            if (parts[0]! > 1000) {
              instDate = new Date(parts[0]!, parts[1]! - 1, parts[2]!);
            } else {
              instDate = new Date(parts[2]!, parts[1]! - 1, parts[0]!);
            }
          } else if (inst.scheduledDate.includes("/")) {
            const parts = inst.scheduledDate.split("/").map(Number);
            instDate = new Date(parts[2]!, parts[1]! - 1, parts[0]!);
          }
          if (instDate && instDate < now && inst.pendingAmount > 0) {
            const diffDays = Math.max(1, Math.floor((now.getTime() - instDate.getTime()) / (1000 * 60 * 60 * 24)));
            overdueList.push({
              name: sale.clientName,
              amount: inst.pendingAmount,
              unit: sale.unit,
              daysOverdue: diffDays,
            });
          }
        }
      });
    });

    return overdueList;
  }, [project]);

  const currentSoldUnits = useMemo(
    () => (project?.unitsInventory || []).filter((u) => u.status === "VENDIDA"),
    [project?.unitsInventory]
  );

  // Dynamic Metrics calculation based on real units and sales
  const currentMetrics = useMemo(() => {
    if (!project) {
      return {
        totalCobrado: 0,
        totalMoratoriosCobrados: 0,
        porCobrar: 0,
        pagosAtrasados: 0,
        avanceVentasPct: 0,
        unidadesVendidasCount: 0,
        unidadesTotalesCount: 0,
        porVenderUnidades: 0,
        valorComercialVendido: 0,
        valorComercialTotal: 0,
        porVenderMonto: 0,
        flujoFuturoMonto: 0,
        precioPromedio: 0,
        inventarioMonetarioPct: 0,
        totalFacturado: 0,
        distribucionPct: 0,
      };
    }

    const units = project.unitsInventory || [];
    const soldUnits = units.filter((u) => u.status === "VENDIDA");

    const totalUnitsCount = project.totalUnits || (units.length > 0 ? units.length : 0);
    const soldUnitsCount = soldUnits.length;
    const porVenderUnidades = Math.max(0, totalUnitsCount - soldUnitsCount);

    const valorComercialTotal = units.length > 0
      ? units.reduce((acc, u) => acc + (u.price || 0), 0)
      : (project.metrics?.valorComercialTotal || 0);

    const valorComercialVendido = soldUnits.reduce((acc, u) => acc + (u.price || 0), 0);
    const porVenderMonto = Math.max(0, valorComercialTotal - valorComercialVendido);

    const soldUnitsMap = new Set(soldUnits.map((u) => u.unit));
    const activeSales = (project.sales || []).filter((s) => s.status !== "CANCELADA" && soldUnitsMap.has(s.unit));
    const totalCobrado = activeSales.reduce((acc, s) => acc + (s.paidAmount || 0), 0);
    const totalMoratoriosCobrados = activeSales.reduce((acc, s) => {
      const sMoratorios = (s.payments || []).reduce((pAcc, p) => pAcc + (p.moratoryAmount || 0), 0);
      return acc + sMoratorios;
    }, 0);
    const porCobrar = Math.max(0, valorComercialVendido - totalCobrado);
    const pagosAtrasados = currentOverdueClients.reduce((acc, c) => acc + (c.amount || 0), 0);
    const totalFacturado = valorComercialVendido;
    const flujoFuturoMonto = totalCobrado + porCobrar;

    const avanceVentasPct = totalUnitsCount > 0 ? Math.round((soldUnitsCount / totalUnitsCount) * 100) : 0;
    const inventarioMonetarioPct = valorComercialTotal > 0 ? Math.round((valorComercialVendido / valorComercialTotal) * 100) : 0;
    const distribucionPct = valorComercialTotal > 0 ? Math.round((totalFacturado / valorComercialTotal) * 100) : 0;
    const precioPromedio = totalUnitsCount > 0 ? Math.round(valorComercialTotal / totalUnitsCount) : 0;

    return {
      totalCobrado,
      totalMoratoriosCobrados,
      porCobrar,
      pagosAtrasados,
      avanceVentasPct,
      unidadesVendidasCount: soldUnitsCount,
      unidadesTotalesCount: totalUnitsCount,
      porVenderUnidades,
      valorComercialVendido,
      valorComercialTotal,
      porVenderMonto,
      flujoFuturoMonto,
      precioPromedio,
      inventarioMonetarioPct,
      totalFacturado,
      distribucionPct,
    };
  }, [project, currentOverdueClients]);

  // 5 Months Window Billing for the project: current month, 2 previous, 2 upcoming (strictly matching year & month)
  const fiveMonthsBilling = useMemo(() => {
    if (!project) return [];
    const MONTH_NAMES = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
    const now = new Date();
    const currentMonthIdx = now.getMonth();
    const currentYear = now.getFullYear();

    const soldUnitsMap = new Map<string, UnitItem>();
    (project.unitsInventory || []).forEach((u) => {
      if (u.status === "VENDIDA") soldUnitsMap.set(u.unit, u);
    });

    const activeSales = (project.sales || []).filter(
      (s) => s.status !== "CANCELADA" && soldUnitsMap.has(s.unit)
    );

    const parseDateParts = (dateStr?: string): { year: number; month: number } | null => {
      if (!dateStr) return null;
      const str = String(dateStr).trim();
      if (str.includes("-")) {
        const parts = str.split("-").map(Number);
        if (parts.length === 3 && parts[0] && parts[1] && parts[2]) {
          if (parts[0] > 1000) {
            return { year: parts[0], month: parts[1] - 1 };
          } else {
            return { year: parts[2], month: parts[1] - 1 };
          }
        }
      }
      if (str.includes("/")) {
        const parts = str.split("/").map(Number);
        if (parts.length === 3 && parts[0] && parts[1] && parts[2]) {
          if (parts[0] > 1000) {
            return { year: parts[0], month: parts[1] - 1 };
          } else {
            return { year: parts[2], month: parts[1] - 1 };
          }
        }
      }
      const d = new Date(str);
      if (!isNaN(d.getTime())) {
        return { year: d.getFullYear(), month: d.getMonth() };
      }
      return null;
    };

    return [-2, -1, 0, 1, 2].map((offset) => {
      const targetDate = new Date(currentYear, currentMonthIdx + offset, 1);
      const targetMonth = targetDate.getMonth();
      const targetYear = targetDate.getFullYear();
      const mName = MONTH_NAMES[targetMonth] ?? "Mes";
      const isCurrent = offset === 0;

      let cobrado = 0;
      let porCobrar = 0;

      activeSales.forEach((sale) => {
        (sale.schedule || []).forEach((inst) => {
          const parsed = parseDateParts(inst.scheduledDate);
          if (parsed && parsed.year === targetYear && parsed.month === targetMonth) {
            cobrado += Number(inst.paidAmount) || 0;
            porCobrar += Number(inst.pendingAmount) || 0;
          }
        });
      });

      return {
        month: mName,
        year: targetYear,
        isCurrent,
        offset,
        cobrado,
        porCobrar,
        total: cobrado + porCobrar,
      };
    });
  }, [project]);

  const maxBillingVal = useMemo(() => {
    const maxItem = Math.max(...fiveMonthsBilling.map((item) => item.cobrado + item.porCobrar), 0);
    return maxItem > 0 ? maxItem : 1.0;
  }, [fiveMonthsBilling]);

  const formatBillingAmount = (val: number) => {
    if (val === 0) return "$0";
    if (val >= 1000000) {
      const millions = val / 1000000;
      return `$${millions.toLocaleString("es-MX", { maximumFractionDigits: 1 })}M`;
    }
    if (val >= 1000) {
      const thousands = val / 1000;
      return `$${thousands.toLocaleString("es-MX", { maximumFractionDigits: 0 })}k`;
    }
    return formatMoney(val);
  };

  const moneyDist = useMemo(() => {
    const total = currentMetrics.totalFacturado || (currentMetrics.totalCobrado + currentMetrics.porCobrar + currentMetrics.pagosAtrasados);
    if (total <= 0) {
      return { cobradoPct: 0, porCobrarPct: 0, atrasadosPct: 0, total: 0 };
    }
    const cobradoPct = (currentMetrics.totalCobrado / total) * 100;
    const porCobrarPct = (currentMetrics.porCobrar / total) * 100;
    const atrasadosPct = (currentMetrics.pagosAtrasados / total) * 100;
    return { cobradoPct, porCobrarPct, atrasadosPct, total };
  }, [currentMetrics]);

  const unitStats = useMemo(() => {
    if (!project) {
      return { vendidas: 0, disponibles: 0, apartadas: 0, bloqueadas: 0, total: 0 };
    }
    const unitsList = project.unitsInventory || [];
    if (unitsList.length > 0) {
      const vendidas = unitsList.filter((u) => u.status === "VENDIDA").length;
      const disponibles = unitsList.filter((u) => u.status === "DISPONIBLE").length;
      const apartadas = unitsList.filter((u) => u.status === "APARTADA").length;
      const bloqueadas = unitsList.filter((u) => u.status === "BLOQUEADA").length;
      const total = unitsList.length;
      return { vendidas, disponibles, apartadas, bloqueadas, total };
    }
    const vendidas = currentMetrics.unidadesVendidasCount || project.soldUnits || 0;
    const disponibles = currentMetrics.porVenderUnidades || project.availableUnits || 0;
    const apartadas = 0;
    const bloqueadas = project.blockedUnits || 0;
    const total = project.totalUnits || (vendidas + disponibles + apartadas + bloqueadas);
    return { vendidas, disponibles, apartadas, bloqueadas, total };
  }, [project, currentMetrics]);

  if (!project) {
    return (
      <AppLayout>
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "2rem" }}>
          <div style={{ backgroundColor: "#FFFFFF", borderRadius: "1.5rem", padding: "3.5rem 2rem", textAlign: "center", border: "1px dashed #CBD5E1", maxWidth: "560px" }}>
            <Building2 size={42} color="#94A3B8" style={{ margin: "0 auto 1rem auto" }} />
            <h2 style={{ fontSize: "1.35rem", fontWeight: 800, color: "#1F3652", margin: "0 0 0.5rem 0" }}>Proyecto no encontrado</h2>
            <p style={{ fontSize: "0.88rem", color: "#64748B", margin: "0 0 1.5rem 0" }}>El proyecto solicitado no existe o no tienes permisos para acceder a él.</p>
            <Link href="/projects" style={{ backgroundColor: "#1B3047", color: "#FFFFFF", padding: "0.75rem 1.5rem", borderRadius: "9999px", fontSize: "0.85rem", fontWeight: 700, textDecoration: "none" }}>
              Ver todos los proyectos
            </Link>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout
      activeProjectId={projectId}
      projectSubTab="dashboard"
      onOpenNewSale={() => setShowNewSaleModal(true)}
      onOpenEditProject={() => setShowEditProjectModal(true)}
      onOpenProgress={() => setShowProgressModal(true)}
    >
      <main
        style={{
          padding: "0 1.5rem 1rem 1.5rem",
          flex: 1,
          display: "flex",
          flexDirection: "column",
          gap: "0.75rem",
          justifyContent: "space-between",
          minHeight: 0,
        }}
      >
        {/* 4 CARDS SUPERIORES DE RESUMEN */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "0.85rem" }}>
          {/* Card 1: Total Cobrado */}
          <div
            onMouseEnter={() => setHoveredCard("cobrado")}
            onMouseLeave={() => setHoveredCard(null)}
            style={{
              backgroundColor: "#FFFFFF",
              borderRadius: "0.95rem",
              padding: "0.85rem 1.15rem",
              boxShadow: hoveredCard === "cobrado" ? "0 6px 20px rgba(0, 196, 140, 0.12)" : "0 2px 8px rgba(0,0,0,0.02)",
              transform: hoveredCard === "cobrado" ? "translateY(-2px)" : "none",
              transition: "all 0.2s ease",
              border: hoveredCard === "cobrado" ? "1px solid rgba(0, 196, 140, 0.3)" : "1px solid transparent",
              cursor: "default",
            }}
          >
            <span style={{ fontSize: "0.78rem", fontWeight: 600, color: "#64748B", display: "block", marginBottom: "0.35rem" }}>
              Total Cobrado
            </span>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <div style={{ width: "22px", height: "22px", borderRadius: "50%", backgroundColor: "rgba(111, 172, 156, 0.15)", display: "flex", alignItems: "center", justifyContent: "center", color: "#00C48C", flexShrink: 0 }}>
                <CheckCircle2 size={15} />
              </div>
              <h3 style={{ fontSize: "1.25rem", fontWeight: 800, color: "#1F3652", margin: 0 }}>
                {formatMoney(currentMetrics.totalCobrado + currentMetrics.totalMoratoriosCobrados)}
              </h3>
            </div>
            {currentMetrics.totalMoratoriosCobrados > 0 && (
              <div style={{ fontSize: "0.7rem", color: "#64748B", fontWeight: 500, marginTop: "0.25rem", display: "flex", alignItems: "center", gap: "0.3rem" }}>
                <span>Cap: {formatMoney(currentMetrics.totalCobrado)}</span>
                <span>•</span>
                <span style={{ color: "#D97706", fontWeight: 600 }}>Int: +{formatMoney(currentMetrics.totalMoratoriosCobrados)}</span>
              </div>
            )}
          </div>

          {/* Card 2: Por cobrar */}
          <div
            onMouseEnter={() => setHoveredCard("porCobrar")}
            onMouseLeave={() => setHoveredCard(null)}
            style={{
              backgroundColor: "#FFFFFF",
              borderRadius: "0.95rem",
              padding: "0.85rem 1.15rem",
              boxShadow: hoveredCard === "porCobrar" ? "0 6px 20px rgba(59, 130, 246, 0.12)" : "0 2px 8px rgba(0,0,0,0.02)",
              transform: hoveredCard === "porCobrar" ? "translateY(-2px)" : "none",
              transition: "all 0.2s ease",
              border: hoveredCard === "porCobrar" ? "1px solid rgba(59, 130, 246, 0.3)" : "1px solid transparent",
              cursor: "default",
            }}
          >
            <span style={{ fontSize: "0.78rem", fontWeight: 600, color: "#64748B", display: "block", marginBottom: "0.35rem" }}>
              Por cobrar
            </span>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <div style={{ width: "22px", height: "22px", borderRadius: "50%", backgroundColor: "rgba(199, 178, 139, 0.2)", display: "flex", alignItems: "center", justifyContent: "center", color: "#C7B28B", flexShrink: 0 }}>
                <FileText size={14} />
              </div>
              <h3 style={{ fontSize: "1.25rem", fontWeight: 800, color: "#1F3652", margin: 0 }}>
                {formatMoney(currentMetrics.porCobrar)}
              </h3>
            </div>
          </div>

          {/* Card 3: Pagos atrasados */}
          <div
            onMouseEnter={() => setHoveredCard("atrasados")}
            onMouseLeave={() => setHoveredCard(null)}
            style={{
              backgroundColor: "#FFFFFF",
              borderRadius: "0.95rem",
              padding: "0.85rem 1.15rem",
              boxShadow: hoveredCard === "atrasados" ? "0 6px 20px rgba(240, 61, 48, 0.12)" : "0 2px 8px rgba(0,0,0,0.02)",
              transform: hoveredCard === "atrasados" ? "translateY(-2px)" : "none",
              transition: "all 0.2s ease",
              border: hoveredCard === "atrasados" ? "1px solid rgba(240, 61, 48, 0.3)" : "1px solid transparent",
              cursor: "default",
            }}
          >
            <span style={{ fontSize: "0.78rem", fontWeight: 600, color: "#64748B", display: "block", marginBottom: "0.35rem" }}>
              Pagos atrasados
            </span>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <div style={{ width: "22px", height: "22px", borderRadius: "50%", backgroundColor: "rgba(240, 61, 48, 0.1)", display: "flex", alignItems: "center", justifyContent: "center", color: "#E05345", flexShrink: 0 }}>
                <AlertCircle size={15} />
              </div>
              <h3 style={{ fontSize: "1.25rem", fontWeight: 800, color: "#1F3652", margin: 0 }}>
                {formatMoney(currentMetrics.pagosAtrasados)}
              </h3>
            </div>
          </div>

          {/* Card 4: Avance de Ventas */}
          <div
            onMouseEnter={() => setHoveredCard("avance")}
            onMouseLeave={() => setHoveredCard(null)}
            style={{
              backgroundColor: "#FFFFFF",
              borderRadius: "0.95rem",
              padding: "0.85rem 1.15rem",
              boxShadow: hoveredCard === "avance" ? "0 6px 20px rgba(47, 128, 237, 0.12)" : "0 2px 8px rgba(0,0,0,0.02)",
              transform: hoveredCard === "avance" ? "translateY(-2px)" : "none",
              transition: "all 0.2s ease",
              border: hoveredCard === "avance" ? "1px solid rgba(47, 128, 237, 0.3)" : "1px solid transparent",
              cursor: "default",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.2rem" }}>
              <span style={{ fontSize: "0.7rem", fontWeight: 700, color: "#00C48C", letterSpacing: "0.03em", textTransform: "uppercase", display: "flex", alignItems: "center", gap: "0.25rem" }}>
                <TrendingUp size={12} /> AVANCE DE VENTAS
              </span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "0.3rem" }}>
              <h3 style={{ fontSize: "1.35rem", fontWeight: 800, color: "#2F80ED", margin: 0 }}>
                {currentMetrics.avanceVentasPct}%
              </h3>
              <span style={{ fontSize: "0.72rem", color: "#64748B" }}>
                <strong>{currentMetrics.unidadesVendidasCount}</strong> de <strong>{currentMetrics.unidadesTotalesCount}</strong> unidades
              </span>
            </div>
            <div style={{ height: "5px", width: "100%", backgroundColor: "#E2E8F0", borderRadius: "3px", overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${currentMetrics.avanceVentasPct}%`, backgroundColor: "#2F80ED", transition: "width 0.6s ease" }} />
            </div>
          </div>
        </div>

        {/* GRID PRINCIPAL: 2 COLUMNAS (62% Izquierda + 38% Derecha) */}
        <div style={{ display: "grid", gridTemplateColumns: "1.65fr 1fr", gap: "0.85rem", flex: 1, minHeight: 0 }}>
          {/* COLUMNA IZQUIERDA */}
          <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem", minHeight: 0 }}>
            {/* FILA SUPERIOR: Cobranza por Mes + Valor Comercial */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.85rem" }}>
              {/* 1. COBRANZA POR MES (5 MESES: 2 ABAJO, ACTUAL, 2 ARRIBA) */}
              <div style={{ backgroundColor: "#FFFFFF", borderRadius: "1rem", padding: "0.95rem 1.15rem", boxShadow: "0 2px 8px rgba(0,0,0,0.02)", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
                  <div>
                    <h3 style={{ fontSize: "0.92rem", fontWeight: 700, color: "#1F3652", margin: 0 }}>
                      Cobranza por Mes
                    </h3>
                    <p style={{ fontSize: "0.68rem", color: "#64748B", margin: "0.1rem 0 0" }}>
                      Ventana de 5 meses (2 previos, actual, 2 próximos)
                    </p>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", fontSize: "0.72rem", fontWeight: 600 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}>
                      <div style={{ width: "10px", height: "6px", borderRadius: "3px", backgroundColor: "#00C48C" }} />
                      <span style={{ color: "#64748B" }}>Cobrado</span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}>
                      <div style={{ width: "10px", height: "6px", borderRadius: "3px", backgroundColor: "#2F80ED" }} />
                      <span style={{ color: "#64748B" }}>Por Cobrar</span>
                    </div>
                  </div>
                </div>

                {/* Gráfico de Barras de 5 Meses */}
                <div style={{ display: "flex", flexDirection: "column", gap: "0.45rem", margin: "0.2rem 0" }}>
                  {fiveMonthsBilling.map((item) => {
                    const cobradoPct = (item.cobrado / maxBillingVal) * 100;
                    const porCobrarPct = (item.porCobrar / maxBillingVal) * 100;
                    const isHovered = hoveredMonth === item.month;

                    return (
                      <div
                        key={item.month}
                        onMouseEnter={() => setHoveredMonth(item.month)}
                        onMouseLeave={() => setHoveredMonth(null)}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "0.5rem",
                          position: "relative",
                          cursor: "pointer",
                          padding: "0.2rem 0.35rem",
                          borderRadius: "0.4rem",
                          backgroundColor: isHovered
                            ? "rgba(47, 128, 237, 0.05)"
                            : item.isCurrent
                            ? "rgba(47, 128, 237, 0.02)"
                            : "transparent",
                          border: item.isCurrent ? "1px dashed rgba(47, 128, 237, 0.3)" : "1px solid transparent",
                          transition: "all 0.15s ease",
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: "0.25rem", width: "62px", flexShrink: 0 }}>
                          <span style={{ fontSize: "0.75rem", fontWeight: item.isCurrent ? 800 : 600, color: item.isCurrent ? "#2F80ED" : "#1F3652" }}>
                            {item.month}
                          </span>
                          {item.isCurrent && (
                            <span style={{ fontSize: "0.52rem", fontWeight: 800, backgroundColor: "#2F80ED", color: "#FFFFFF", padding: "0.05rem 0.3rem", borderRadius: "3px", textTransform: "uppercase" }}>
                              Hoy
                            </span>
                          )}
                        </div>

                        <div style={{ flex: 1, height: "18px", display: "flex", borderRadius: "5px", overflow: "hidden", backgroundColor: "#F1F5F9" }}>
                          {item.cobrado > 0 && (
                            <div
                              style={{
                                width: `${cobradoPct}%`,
                                backgroundColor: "#00C48C",
                                borderRadius: item.porCobrar > 0 ? "5px 0 0 5px" : "5px",
                                transition: "all 0.3s ease",
                                filter: isHovered ? "brightness(1.08)" : "none",
                              }}
                            />
                          )}
                          {item.porCobrar > 0 && (
                            <div
                              style={{
                                width: `${porCobrarPct}%`,
                                backgroundColor: "#2F80ED",
                                borderRadius: item.cobrado > 0 ? "0 5px 5px 0" : "5px",
                                transition: "all 0.3s ease",
                                filter: isHovered ? "brightness(1.08)" : "none",
                              }}
                            />
                          )}
                        </div>

                        {/* Floating Tooltip en Hover */}
                        {isHovered && (
                          <div
                            style={{
                              position: "absolute",
                              right: 8,
                              top: "-28px",
                              backgroundColor: "#1F3652",
                              color: "#FFFFFF",
                              padding: "0.25rem 0.65rem",
                              borderRadius: "0.4rem",
                              fontSize: "0.72rem",
                              fontWeight: 600,
                              zIndex: 20,
                              boxShadow: "0 4px 12px rgba(0,0,0,0.18)",
                              display: "flex",
                              alignItems: "center",
                              gap: "0.45rem",
                              pointerEvents: "none",
                              whiteSpace: "nowrap",
                            }}
                          >
                            <span style={{ color: "#00C48C" }}>Cobrado: {formatBillingAmount(item.cobrado)}</span>
                            <span style={{ opacity: 0.5 }}>•</span>
                            <span style={{ color: "#60A5FA" }}>Por cobrar: {formatBillingAmount(item.porCobrar)}</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Eje X Dinámico */}
                <div style={{ display: "flex", justifyContent: "space-between", paddingLeft: "68px", marginTop: "0.35rem", borderTop: "1px solid #E2E8F0", paddingTop: "0.3rem", fontSize: "0.68rem", color: "#64748B" }}>
                  <span>$0</span>
                  <span>{formatBillingAmount(maxBillingVal * 0.33)}</span>
                  <span>{formatBillingAmount(maxBillingVal * 0.66)}</span>
                  <span>{formatBillingAmount(maxBillingVal)}</span>
                </div>
              </div>

              {/* 2. VALOR COMERCIAL */}
              <div style={{ backgroundColor: "#FFFFFF", borderRadius: "1rem", padding: "0.95rem 1.15rem", boxShadow: "0 2px 8px rgba(0,0,0,0.02)", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.3rem" }}>
                  <div style={{ width: "26px", height: "26px", borderRadius: "50%", backgroundColor: "rgba(0, 196, 140, 0.12)", display: "flex", alignItems: "center", justifyContent: "center", color: "#00C48C", flexShrink: 0 }}>
                    <DollarSign size={15} />
                  </div>
                  <div>
                    <h3 style={{ fontSize: "0.92rem", fontWeight: 700, color: "#1F3652", margin: 0 }}>
                      Valor comercial
                    </h3>
                    <p style={{ fontSize: "0.68rem", color: "#64748B", margin: 0 }}>
                      Resumen de ventas (montos)
                    </p>
                  </div>
                </div>

                {/* Monto principal vendido */}
                <div style={{ margin: "0.1rem 0 0.35rem" }}>
                  <div style={{ display: "flex", alignItems: "baseline", gap: "0.4rem" }}>
                    <h2 style={{ fontSize: "1.4rem", fontWeight: 800, color: "#00C48C", margin: 0, lineHeight: 1.1 }}>
                      {formatMoney(currentMetrics.valorComercialVendido)}
                    </h2>
                    <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "#00C48C" }}>vendidos</span>
                  </div>
                  <span style={{ fontSize: "0.7rem", color: "#64748B" }}>
                    de {formatMoney(currentMetrics.valorComercialTotal)} en inventario total
                  </span>
                </div>

                {/* 3 Badges de métricas */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "0.4rem", marginBottom: "0.35rem" }}>
                  <div style={{ padding: "0.3rem 0.4rem", borderRadius: "0.4rem", border: "1px solid rgba(0, 196, 140, 0.3)", backgroundColor: "rgba(0, 196, 140, 0.03)" }}>
                    <span style={{ fontSize: "0.55rem", fontWeight: 700, color: "#64748B", textTransform: "uppercase", display: "block" }}>
                      UNIDADES VENDIDAS
                    </span>
                    <strong style={{ fontSize: "0.75rem", color: "#00C48C" }}>
                      {currentMetrics.unidadesVendidasCount} de {currentMetrics.unidadesTotalesCount}
                    </strong>
                  </div>

                  <div style={{ padding: "0.3rem 0.4rem", borderRadius: "0.4rem", border: "1px solid rgba(59, 130, 246, 0.3)", backgroundColor: "rgba(59, 130, 246, 0.03)" }}>
                    <span style={{ fontSize: "0.55rem", fontWeight: 700, color: "#64748B", textTransform: "uppercase", display: "block" }}>
                      POR VENDER
                    </span>
                    <strong style={{ fontSize: "0.75rem", color: "#3B82F6" }}>
                      {currentMetrics.porVenderUnidades} unidades
                    </strong>
                  </div>

                  <div style={{ padding: "0.3rem 0.4rem", borderRadius: "0.4rem", border: "1px solid #E2E8F0", backgroundColor: "#F8FAFC" }}>
                    <span style={{ fontSize: "0.55rem", fontWeight: 700, color: "#64748B", textTransform: "uppercase", display: "block" }}>
                      PRECIO PROMEDIO
                    </span>
                    <strong style={{ fontSize: "0.75rem", color: "#1F3652" }}>
                      {formatMoney(currentMetrics.precioPromedio)}
                    </strong>
                  </div>
                </div>

                {/* Barra de progreso */}
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.15rem" }}>
                    <span style={{ fontSize: "0.68rem", color: "#64748B" }}>
                      % del inventario monetario vendido
                    </span>
                    <span style={{ fontSize: "0.85rem", fontWeight: 800, color: "#00C48C" }}>
                      {currentMetrics.inventarioMonetarioPct}%
                    </span>
                  </div>
                  <div style={{ height: "6px", width: "100%", backgroundColor: "rgba(0, 196, 140, 0.15)", borderRadius: "3px", overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${currentMetrics.inventarioMonetarioPct}%`, backgroundColor: "#00C48C" }} />
                  </div>
                </div>

                {/* Footer */}
                <div style={{ display: "flex", justifyContent: "space-between", borderTop: "1px solid #E2E8F0", paddingTop: "0.35rem", marginTop: "0.25rem" }}>
                  <div>
                    <span style={{ fontSize: "0.65rem", color: "#64748B", display: "flex", alignItems: "center", gap: "0.25rem" }}>
                      <span style={{ width: "6px", height: "6px", borderRadius: "50%", backgroundColor: "#3B82F6", display: "inline-block" }} />
                      Por vender
                    </span>
                    <h4 style={{ fontSize: "0.82rem", fontWeight: 800, color: "#1F3652", margin: "0.1rem 0 0" }}>
                      {formatMoney(currentMetrics.porVenderMonto)}
                    </h4>
                  </div>

                  <div>
                    <span style={{ fontSize: "0.65rem", color: "#64748B", display: "flex", alignItems: "center", gap: "0.25rem" }}>
                      <span style={{ width: "6px", height: "6px", borderRadius: "50%", backgroundColor: "#00C48C", display: "inline-block" }} />
                      Flujo futuro
                    </span>
                    <h4 style={{ fontSize: "0.82rem", fontWeight: 800, color: "#1F3652", margin: "0.1rem 0 0" }}>
                      {formatMoney(currentMetrics.flujoFuturoMonto)}
                    </h4>
                  </div>
                </div>
              </div>
            </div>

            {/* FILA INFERIOR: UNIDADES VENDIDAS */}
            <div style={{ backgroundColor: "#FFFFFF", borderRadius: "1rem", padding: "0.95rem 1.15rem", boxShadow: "0 2px 8px rgba(0,0,0,0.02)", flex: 1, display: "flex", flexDirection: "column", minHeight: 0 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.4rem" }}>
                <div>
                  <h3 style={{ fontSize: "0.92rem", fontWeight: 700, color: "#1F3652", margin: 0 }}>
                    Unidades Vendidas
                  </h3>
                  <p style={{ fontSize: "0.68rem", color: "#64748B", margin: "0.1rem 0 0" }}>
                    Ventas de {project.name}
                  </p>
                </div>
                <Link
                  href={`/projects/${project.id}/units`}
                  style={{ fontSize: "0.72rem", color: "#2F80ED", fontWeight: 600, textDecoration: "none" }}
                >
                  Ver inventario completo
                </Link>
              </div>

              <div style={{ overflowX: "auto", flex: 1 }}>
                <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "0.76rem" }}>
                  <thead>
                    <tr style={{ color: "#64748B", borderBottom: "1px solid #E2E8F0" }}>
                      <th style={{ padding: "0.3rem 0.4rem", fontWeight: 600 }}>Unidad</th>
                      <th style={{ padding: "0.3rem 0.4rem", fontWeight: 600 }}>Tipo</th>
                      <th style={{ padding: "0.3rem 0.4rem", fontWeight: 600 }}>Precio</th>
                      <th style={{ padding: "0.3rem 0.4rem", fontWeight: 600 }}>Superficie m2</th>
                      <th style={{ padding: "0.3rem 0.4rem", fontWeight: 600 }}>Proyecto</th>
                      <th style={{ padding: "0.3rem 0.4rem", fontWeight: 600 }}>Cliente</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentSoldUnits.length === 0 ? (
                      <tr>
                        <td colSpan={6} style={{ textAlign: "center", padding: "1.5rem", color: "#94A3B8" }}>
                          No hay unidades vendidas registradas aún en este proyecto.
                        </td>
                      </tr>
                    ) : (
                      currentSoldUnits.map((u: any, i: number) => (
                        <tr
                          key={i}
                          style={{
                            borderBottom: "1px solid rgba(22, 43, 63, 0.04)",
                            transition: "background-color 0.15s ease",
                          }}
                        >
                          <td style={{ padding: "0.4rem 0.4rem", fontWeight: 700, color: "#1F3652" }}>{u.unit}</td>
                          <td style={{ padding: "0.4rem 0.4rem", color: "#64748B" }}>{u.type}</td>
                          <td style={{ padding: "0.4rem 0.4rem", fontWeight: 600, color: "#1F3652" }}>{formatMoney(u.price)}</td>
                          <td style={{ padding: "0.4rem 0.4rem", color: "#64748B" }}>{u.areaM2}</td>
                          <td style={{ padding: "0.4rem 0.4rem", color: "#64748B" }}>{project.name}</td>
                          <td style={{ padding: "0.4rem 0.4rem", color: "#1F3652", fontWeight: 500 }}>{u.client}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* COLUMNA DERECHA: 3 CARDS */}
          <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem", minHeight: 0 }}>
            {/* 1. DISTRIBUCIÓN DEL DINERO (BARRA SEGMENTADA) */}
            <div style={{ backgroundColor: "#FFFFFF", borderRadius: "1rem", padding: "0.95rem 1.15rem", boxShadow: "0 2px 8px rgba(0,0,0,0.02)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "0.6rem" }}>
                <div>
                  <h3 style={{ fontSize: "0.92rem", fontWeight: 700, color: "#1F3652", margin: 0 }}>
                    Distribución del Dinero
                  </h3>
                  <p style={{ fontSize: "0.68rem", color: "#64748B", margin: "0.1rem 0 0" }}>
                    Estado financiero actual
                  </p>
                </div>
                <div style={{ textAlign: "right" }}>
                  <span style={{ fontSize: "0.62rem", fontWeight: 700, color: "#64748B", textTransform: "uppercase", display: "block" }}>
                    Total Facturado
                  </span>
                  <strong style={{ fontSize: "0.9rem", fontWeight: 800, color: "#1F3652" }}>
                    {formatMoney(currentMetrics.totalFacturado)}
                  </strong>
                </div>
              </div>

              {/* Barra Segmentada Horizontal */}
              <div style={{ height: "12px", width: "100%", backgroundColor: "#F1F5F9", borderRadius: "6px", overflow: "hidden", display: "flex", margin: "0.6rem 0 0.85rem" }}>
                {currentMetrics.totalFacturado > 0 ? (
                  <>
                    {currentMetrics.totalCobrado > 0 && (
                      <div
                        title={`Cobrado: ${formatMoney(currentMetrics.totalCobrado)} (${moneyDist.cobradoPct.toFixed(1)}%)`}
                        style={{
                          width: `${moneyDist.cobradoPct}%`,
                          backgroundColor: "#00C48C",
                          transition: "width 0.4s ease",
                        }}
                      />
                    )}
                    {currentMetrics.porCobrar > 0 && (
                      <div
                        title={`Por cobrar: ${formatMoney(currentMetrics.porCobrar)} (${moneyDist.porCobrarPct.toFixed(1)}%)`}
                        style={{
                          width: `${moneyDist.porCobrarPct}%`,
                          backgroundColor: "#2F80ED",
                          transition: "width 0.4s ease",
                        }}
                      />
                    )}
                    {currentMetrics.pagosAtrasados > 0 && (
                      <div
                        title={`Atrasado: ${formatMoney(currentMetrics.pagosAtrasados)} (${moneyDist.atrasadosPct.toFixed(1)}%)`}
                        style={{
                          width: `${moneyDist.atrasadosPct}%`,
                          backgroundColor: "#F03D30",
                          transition: "width 0.4s ease",
                        }}
                      />
                    )}
                  </>
                ) : (
                  <div style={{ width: "100%", height: "100%", backgroundColor: "#E2E8F0" }} />
                )}
              </div>

              {/* Lista de desglose con montos y porcentajes reales */}
              <div style={{ display: "flex", flexDirection: "column", gap: "0.45rem" }}>
                {/* Cobrado */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.76rem" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.45rem" }}>
                    <span style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: "#00C48C", flexShrink: 0 }} />
                    <span style={{ color: "#475569", fontWeight: 500 }}>Cobrado</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                    <span style={{ fontWeight: 700, color: "#1F3652" }}>{formatMoney(currentMetrics.totalCobrado)}</span>
                    <span style={{ fontSize: "0.7rem", fontWeight: 600, color: "#00C48C", minWidth: "38px", textAlign: "right" }}>
                      {currentMetrics.totalFacturado > 0 ? `${moneyDist.cobradoPct.toFixed(1)}%` : "0%"}
                    </span>
                  </div>
                </div>

                {/* Por cobrar */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.76rem" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.45rem" }}>
                    <span style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: "#2F80ED", flexShrink: 0 }} />
                    <span style={{ color: "#475569", fontWeight: 500 }}>Por cobrar</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                    <span style={{ fontWeight: 700, color: "#1F3652" }}>{formatMoney(currentMetrics.porCobrar)}</span>
                    <span style={{ fontSize: "0.7rem", fontWeight: 600, color: "#2F80ED", minWidth: "38px", textAlign: "right" }}>
                      {currentMetrics.totalFacturado > 0 ? `${moneyDist.porCobrarPct.toFixed(1)}%` : "0%"}
                    </span>
                  </div>
                </div>

                {/* Atrasados */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.76rem" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.45rem" }}>
                    <span style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: "#F03D30", flexShrink: 0 }} />
                    <span style={{ color: "#475569", fontWeight: 500 }}>Pagos atrasados</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                    <span style={{ fontWeight: 700, color: "#1F3652" }}>{formatMoney(currentMetrics.pagosAtrasados)}</span>
                    <span style={{ fontSize: "0.7rem", fontWeight: 600, color: "#F03D30", minWidth: "38px", textAlign: "right" }}>
                      {currentMetrics.totalFacturado > 0 ? `${moneyDist.atrasadosPct.toFixed(1)}%` : "0%"}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* 2. CARTERAS VENCIDAS */}
            <div style={{ backgroundColor: "#FFFFFF", borderRadius: "1rem", padding: "0.85rem 1.15rem", boxShadow: "0 2px 8px rgba(0,0,0,0.02)" }}>
              <h3 style={{ fontSize: "0.92rem", fontWeight: 700, color: "#1F3652", margin: "0 0 0.5rem" }}>
                Carteras vencidas
              </h3>

              <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                {currentOverdueClients.length === 0 ? (
                  <div style={{ padding: "0.75rem", textAlign: "center", color: "#64748B", fontSize: "0.75rem" }}>
                    Sin clientes con pagos vencidos. Cartera al corriente.
                  </div>
                ) : (
                  currentOverdueClients.map((client: any, idx: number) => (
                    <div
                      key={idx}
                      onMouseEnter={() => setHoveredClient(idx)}
                      onMouseLeave={() => setHoveredClient(null)}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        padding: "0.2rem 0.35rem",
                        borderRadius: "0.35rem",
                        backgroundColor: hoveredClient === idx ? "rgba(240, 61, 48, 0.04)" : "transparent",
                        transition: "background-color 0.15s ease",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "0.45rem" }}>
                        <div style={{ width: "24px", height: "24px", borderRadius: "50%", border: "1.5px solid #CBD5E1", display: "flex", alignItems: "center", justifyContent: "center", color: "#64748B", flexShrink: 0 }}>
                          <User size={13} />
                        </div>
                        <span style={{ fontSize: "0.74rem", fontWeight: 600, color: "#64748B", maxWidth: "145px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                          {client.name}
                        </span>
                      </div>
                      <span style={{ fontSize: "0.8rem", fontWeight: 800, color: "#F03D30" }}>
                        {formatMoney(client.amount)}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* 3. ESTADO DE UNIDADES (BARRA SEGMENTADA) */}
            <div style={{ backgroundColor: "#FFFFFF", borderRadius: "1rem", padding: "0.95rem 1.15rem", boxShadow: "0 2px 8px rgba(0,0,0,0.02)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "0.6rem" }}>
                <div>
                  <h3 style={{ fontSize: "0.92rem", fontWeight: 700, color: "#1F3652", margin: 0 }}>
                    Estado de Unidades
                  </h3>
                  <p style={{ fontSize: "0.68rem", color: "#64748B", margin: "0.1rem 0 0" }}>
                    Distribución por status
                  </p>
                </div>
                <div style={{ textAlign: "right" }}>
                  <span style={{ fontSize: "0.62rem", fontWeight: 700, color: "#64748B", textTransform: "uppercase", display: "block" }}>
                    Inventario Total
                  </span>
                  <strong style={{ fontSize: "0.9rem", fontWeight: 800, color: "#1F3652" }}>
                    {unitStats.total} Unidades
                  </strong>
                </div>
              </div>

              {/* Barra Segmentada Horizontal */}
              <div style={{ height: "12px", width: "100%", backgroundColor: "#F1F5F9", borderRadius: "6px", overflow: "hidden", display: "flex", margin: "0.6rem 0 0.85rem" }}>
                {unitStats.total > 0 ? (
                  <>
                    {unitStats.vendidas > 0 && (
                      <div
                        title={`Vendidas: ${unitStats.vendidas} (${((unitStats.vendidas / unitStats.total) * 100).toFixed(0)}%)`}
                        style={{
                          width: `${(unitStats.vendidas / unitStats.total) * 100}%`,
                          backgroundColor: "#00C48C",
                          transition: "width 0.4s ease",
                        }}
                      />
                    )}
                    {unitStats.disponibles > 0 && (
                      <div
                        title={`Disponibles: ${unitStats.disponibles} (${((unitStats.disponibles / unitStats.total) * 100).toFixed(0)}%)`}
                        style={{
                          width: `${(unitStats.disponibles / unitStats.total) * 100}%`,
                          backgroundColor: "#2F80ED",
                          transition: "width 0.4s ease",
                        }}
                      />
                    )}
                    {unitStats.apartadas > 0 && (
                      <div
                        title={`Apartadas: ${unitStats.apartadas} (${((unitStats.apartadas / unitStats.total) * 100).toFixed(0)}%)`}
                        style={{
                          width: `${(unitStats.apartadas / unitStats.total) * 100}%`,
                          backgroundColor: "#F59E0B",
                          transition: "width 0.4s ease",
                        }}
                      />
                    )}
                    {unitStats.bloqueadas > 0 && (
                      <div
                        title={`Bloqueadas: ${unitStats.bloqueadas} (${((unitStats.bloqueadas / unitStats.total) * 100).toFixed(0)}%)`}
                        style={{
                          width: `${(unitStats.bloqueadas / unitStats.total) * 100}%`,
                          backgroundColor: "#94A3B8",
                          transition: "width 0.4s ease",
                        }}
                      />
                    )}
                  </>
                ) : (
                  <div style={{ width: "100%", height: "100%", backgroundColor: "#E2E8F0" }} />
                )}
              </div>

              {/* Lista de desglose */}
              <div style={{ display: "flex", flexDirection: "column", gap: "0.45rem" }}>
                {/* Vendidas */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.76rem" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.45rem" }}>
                    <span style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: "#00C48C", flexShrink: 0 }} />
                    <span style={{ color: "#475569", fontWeight: 500 }}>Vendidas</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                    <span style={{ fontWeight: 700, color: "#1F3652" }}>{unitStats.vendidas} unid.</span>
                    <span style={{ fontSize: "0.7rem", fontWeight: 600, color: "#00C48C", minWidth: "36px", textAlign: "right" }}>
                      {unitStats.total > 0 ? `${Math.round((unitStats.vendidas / unitStats.total) * 100)}%` : "0%"}
                    </span>
                  </div>
                </div>

                {/* Disponibles */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.76rem" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.45rem" }}>
                    <span style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: "#2F80ED", flexShrink: 0 }} />
                    <span style={{ color: "#475569", fontWeight: 500 }}>Disponibles</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                    <span style={{ fontWeight: 700, color: "#1F3652" }}>{unitStats.disponibles} unid.</span>
                    <span style={{ fontSize: "0.7rem", fontWeight: 600, color: "#2F80ED", minWidth: "36px", textAlign: "right" }}>
                      {unitStats.total > 0 ? `${Math.round((unitStats.disponibles / unitStats.total) * 100)}%` : "0%"}
                    </span>
                  </div>
                </div>

                {/* Apartadas */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.76rem" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.45rem" }}>
                    <span style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: "#F59E0B", flexShrink: 0 }} />
                    <span style={{ color: "#475569", fontWeight: 500 }}>Apartadas</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                    <span style={{ fontWeight: 700, color: "#1F3652" }}>{unitStats.apartadas} unid.</span>
                    <span style={{ fontSize: "0.7rem", fontWeight: 600, color: "#F59E0B", minWidth: "36px", textAlign: "right" }}>
                      {unitStats.total > 0 ? `${Math.round((unitStats.apartadas / unitStats.total) * 100)}%` : "0%"}
                    </span>
                  </div>
                </div>

                {/* Bloqueadas */}
                {unitStats.bloqueadas > 0 && (
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.76rem" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.45rem" }}>
                      <span style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: "#94A3B8", flexShrink: 0 }} />
                      <span style={{ color: "#475569", fontWeight: 500 }}>Bloqueadas</span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                      <span style={{ fontWeight: 700, color: "#1F3652" }}>{unitStats.bloqueadas} unid.</span>
                      <span style={{ fontSize: "0.7rem", fontWeight: 600, color: "#64748B", minWidth: "36px", textAlign: "right" }}>
                        {unitStats.total > 0 ? `${Math.round((unitStats.bloqueadas / unitStats.total) * 100)}%` : "0%"}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Modales Proyecto */}
      {showNewSaleModal && (
        <CreateSaleWizardModal
          isOpen={showNewSaleModal}
          onClose={() => setShowNewSaleModal(false)}
          currency={currency}
          initialProjectId={project.id}
          projects={projects}
          onSaleCreated={(saleData) => {
            setShowNewSaleModal(false);
          }}
        />
      )}

      {showEditProjectModal && (
        <EditProjectModal
          isOpen={showEditProjectModal}
          onClose={() => setShowEditProjectModal(false)}
          project={project}
          onSave={() => {
            setShowEditProjectModal(false);
          }}
        />
      )}

      {showProgressModal && (
        <RegisterProgressWizardModal
          isOpen={showProgressModal}
          onClose={() => setShowProgressModal(false)}
          project={project}
          projectName={project.name}
          currentProgressPct={project.progressPct}
          onProgressSaved={() => {
            setShowProgressModal(false);
          }}
        />
      )}
    </AppLayout>
  );
}
