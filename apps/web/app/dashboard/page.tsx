"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  CheckCircle2,
  FileText,
  AlertCircle,
  TrendingUp,
  DollarSign,
  User,
  Plus,
  Building2,
  Package,
} from "lucide-react";
import AppLayout from "../../components/layout/app-layout";
import { useProject } from "../../context/project-context";

export default function DashboardPage() {
  const router = useRouter();
  const { projects, currency, formatMoney, developerName } = useProject();

  const [hoveredCard, setHoveredCard] = useState<string | null>(null);
  const [hoveredMonth, setHoveredMonth] = useState<string | null>(null);
  const [hoveredClient, setHoveredClient] = useState<number | null>(null);

  const hasProjects = projects && projects.length > 0;

  // Global Developer Metrics calculated dynamically from real projects state
  const globalMetrics = useMemo(() => {
    if (!hasProjects) {
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

    const globalOverdueList: Array<{ name: string; amount: number; unit?: string; daysOverdue?: number; projectName: string }> = [];
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    projects.forEach((p) => {
      const soldUnitsMap = new Set(
        (p.unitsInventory || []).filter((u) => u.status === "VENDIDA").map((u) => u.unit)
      );
      const activeSales = (p.sales || []).filter(
        (s) => s.status !== "CANCELADA" && (!s.unit || soldUnitsMap.size === 0 || soldUnitsMap.has(s.unit))
      );

      activeSales.forEach((sale) => {
        (sale.schedule || []).forEach((inst: any) => {
          const sDate = inst.scheduledDate || inst.fechaProgramada || "";
          const pendingAmt = Number(inst.pendingAmount ?? inst.montoPendiente) || 0;
          if (inst.status === "Atrasado" || (pendingAmt > 0 && sDate)) {
            let instDate: Date | null = null;
            if (typeof sDate === "string" && sDate.includes("-")) {
              const parts = sDate.split("-").map(Number);
              if (parts[0]! > 1000) {
                instDate = new Date(parts[0]!, parts[1]! - 1, parts[2]!);
              } else {
                instDate = new Date(parts[2]!, parts[1]! - 1, parts[0]!);
              }
            } else if (typeof sDate === "string" && sDate.includes("/")) {
              const parts = sDate.split("/").map(Number);
              instDate = new Date(parts[2]!, parts[1]! - 1, parts[0]!);
            }
            if (instDate && !isNaN(instDate.getTime()) && instDate < now && pendingAmt > 0) {
              const diffDays = Math.max(1, Math.floor((now.getTime() - instDate.getTime()) / (1000 * 60 * 60 * 24)));
              globalOverdueList.push({
                name: sale.clientName || "Cliente",
                amount: pendingAmt,
                unit: sale.unit || "N/A",
                daysOverdue: diffDays,
                projectName: p.name,
              });
            }
          }
        });
      });
    });

    const totalCobrado = projects.reduce((acc, p) => {
      const activeSales = (p.sales || []).filter((s) => s.status !== "CANCELADA");
      return acc + activeSales.reduce((sAcc, s) => sAcc + (s.paidAmount || 0), 0);
    }, 0);
    const totalMoratoriosCobrados = projects.reduce((acc, p) => {
      const activeSales = (p.sales || []).filter((s) => s.status !== "CANCELADA");
      return (
        acc +
        activeSales.reduce((sAcc, s) => {
          const sMoratorios = (s.payments || []).reduce((pAcc, pay) => pAcc + (pay.moratoryAmount || 0), 0);
          return sAcc + sMoratorios;
        }, 0)
      );
    }, 0);
    const valorComercialVendido = projects.reduce((acc, p) => {
      const sold = (p.unitsInventory || []).filter((u) => u.status === "VENDIDA");
      return acc + sold.reduce((uAcc, u) => uAcc + (u.price || 0), 0);
    }, 0);
    const porCobrar = Math.max(0, valorComercialVendido - totalCobrado);
    const pagosAtrasados = globalOverdueList.reduce((acc, c) => acc + (c.amount || 0), 0);
    const unidadesVendidasCount = projects.reduce((acc, p) => acc + (p.unitsInventory || []).filter((u) => u.status === "VENDIDA").length, 0);
    const unidadesTotalesCount = projects.reduce((acc, p) => acc + (p.totalUnits || (p.unitsInventory?.length || 0)), 0);
    const valorComercialTotal = projects.reduce((acc, p) => acc + (p.unitsInventory || []).reduce((uAcc, u) => uAcc + (u.price || 0), 0), 0);
    const porVenderMonto = Math.max(0, valorComercialTotal - valorComercialVendido);
    const flujoFuturoMonto = totalCobrado + porCobrar;
    const totalFacturado = valorComercialVendido;

    const avanceVentasPct = unidadesTotalesCount > 0 ? Math.round((unidadesVendidasCount / unidadesTotalesCount) * 100) : 0;
    const porVenderUnidades = Math.max(0, unidadesTotalesCount - unidadesVendidasCount);
    const precioPromedio = unidadesTotalesCount > 0 ? Math.round(valorComercialTotal / unidadesTotalesCount) : 0;
    const inventarioMonetarioPct = valorComercialTotal > 0 ? Math.round((valorComercialVendido / valorComercialTotal) * 100) : 0;
    const distribucionPct = valorComercialTotal > 0 ? Math.round((totalFacturado / valorComercialTotal) * 100) : 0;

    return {
      totalCobrado,
      totalMoratoriosCobrados,
      porCobrar,
      pagosAtrasados,
      avanceVentasPct,
      unidadesVendidasCount,
      unidadesTotalesCount,
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
  }, [projects, hasProjects]);

  const globalMonthlyBilling = useMemo(() => {
    if (!hasProjects) return [];
    const MONTH_NAMES = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
    const monthsMap: Record<string, { month: string; cobrado: number; porCobrar: number }> = {};

    MONTH_NAMES.forEach((m) => {
      monthsMap[m] = { month: m, cobrado: 0, porCobrar: 0 };
    });

    const parseMonthKey = (dateStr?: string): string => {
      if (!dateStr) return MONTH_NAMES[new Date().getMonth()] || "Sep";
      const str = String(dateStr).trim();

      for (const mName of MONTH_NAMES) {
        if (str.toLowerCase().includes(mName.toLowerCase())) {
          return mName;
        }
      }

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

    projects.forEach((p) => {
      const soldUnitsMap = new Set(
        (p.unitsInventory || []).filter((u) => u.status === "VENDIDA").map((u) => u.unit)
      );
      const activeSales = (p.sales || []).filter(
        (s) => s.status !== "CANCELADA" && (!s.unit || soldUnitsMap.size === 0 || soldUnitsMap.has(s.unit))
      );

      // Process active sales schedule cuotas & real receipts
      activeSales.forEach((sale) => {
        (sale.schedule || []).forEach((inst: any) => {
          const sDate = inst.scheduledDate || inst.fechaProgramada || "";
          const mKey = parseMonthKey(sDate);
          const entry = monthsMap[mKey];
          if (entry) {
            entry.cobrado += Number(inst.paidAmount ?? inst.montoPagado) || 0;
            entry.porCobrar += Number(inst.pendingAmount ?? inst.montoPendiente) || 0;
          }
        });
      });
    });

    return Object.values(monthsMap);
  }, [projects, hasProjects]);

  // 5 Months Window Billing: current month, 2 previous, 2 upcoming (strictly matching year & month)
  const fiveMonthsBilling = useMemo(() => {
    if (!hasProjects) return [];
    const MONTH_NAMES = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
    const now = new Date();
    const currentMonthIdx = now.getMonth();
    const currentYear = now.getFullYear();

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

      projects.forEach((p) => {
        const soldUnitsMap = new Set(
          (p.unitsInventory || []).filter((u) => u.status === "VENDIDA").map((u) => u.unit)
        );
        const activeSales = (p.sales || []).filter(
          (s) => s.status !== "CANCELADA" && (!s.unit || soldUnitsMap.size === 0 || soldUnitsMap.has(s.unit))
        );

        activeSales.forEach((sale) => {
          (sale.schedule || []).forEach((inst: any) => {
            const sDate = inst.scheduledDate || inst.fechaProgramada || "";
            const parsed = parseDateParts(sDate);
            if (parsed && parsed.year === targetYear && parsed.month === targetMonth) {
              cobrado += Number(inst.paidAmount ?? inst.montoPagado) || 0;
              porCobrar += Number(inst.pendingAmount ?? inst.montoPendiente) || 0;
            }
          });
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
  }, [projects, hasProjects]);

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
    const total = globalMetrics.totalFacturado || (globalMetrics.totalCobrado + globalMetrics.porCobrar + globalMetrics.pagosAtrasados);
    if (total <= 0) {
      return { cobradoPct: 0, porCobrarPct: 0, atrasadosPct: 0, total: 0 };
    }
    const cobradoPct = (globalMetrics.totalCobrado / total) * 100;
    const porCobrarPct = (globalMetrics.porCobrar / total) * 100;
    const atrasadosPct = (globalMetrics.pagosAtrasados / total) * 100;
    return { cobradoPct, porCobrarPct, atrasadosPct, total };
  }, [globalMetrics]);

  const unitStats = useMemo(() => {
    if (!hasProjects) {
      return { vendidas: 0, disponibles: 0, apartadas: 0, bloqueadas: 0, total: 0 };
    }
    const allUnits = projects.flatMap((p) => p.unitsInventory || []);
    if (allUnits.length > 0) {
      const vendidas = allUnits.filter((u) => u.status === "VENDIDA").length;
      const disponibles = allUnits.filter((u) => u.status === "DISPONIBLE").length;
      const apartadas = allUnits.filter((u) => u.status === "APARTADA").length;
      const bloqueadas = allUnits.filter((u) => u.status === "BLOQUEADA").length;
      const total = allUnits.length;
      return { vendidas, disponibles, apartadas, bloqueadas, total };
    }
    const vendidas = globalMetrics.unidadesVendidasCount;
    const total = globalMetrics.unidadesTotalesCount;
    const disponibles = globalMetrics.porVenderUnidades;
    return { vendidas, disponibles, apartadas: 0, bloqueadas: 0, total };
  }, [projects, hasProjects, globalMetrics]);

  const globalOverdueClients = useMemo(() => {
    if (!hasProjects) return [];
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const overdueList: Array<{ name: string; amount: number; unit?: string; daysOverdue?: number; projectName: string }> = [];

    projects.forEach((p) => {
      const soldUnitsMap = new Set(
        (p.unitsInventory || []).filter((u) => u.status === "VENDIDA").map((u) => u.unit)
      );
      const activeSales = (p.sales || []).filter(
        (s) => s.status !== "CANCELADA" && (!s.unit || soldUnitsMap.size === 0 || soldUnitsMap.has(s.unit))
      );

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
                projectName: p.name,
              });
            }
          }
        });
      });
    });

    return overdueList;
  }, [projects, hasProjects]);

  const allSoldUnits = useMemo(() => {
    if (!hasProjects) return [];
    return projects.flatMap((p) =>
      (p.unitsInventory || []).filter((u) => u.status === "VENDIDA").map((u) => ({ ...u, project: p.name }))
    );
  }, [projects, hasProjects]);

  return (
    <AppLayout>
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
        {/* Welcome Empty State Banner when 0 projects */}
        {!hasProjects && (
          <div
            style={{
              backgroundColor: "#FFFFFF",
              borderRadius: "1rem",
              padding: "1rem 1.5rem",
              boxShadow: "0 2px 10px rgba(0,0,0,0.03)",
              border: "1px solid rgba(47, 128, 237, 0.2)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: "1rem",
              flexWrap: "wrap",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
              <div
                style={{
                  width: "44px",
                  height: "44px",
                  borderRadius: "50%",
                  backgroundColor: "rgba(47, 128, 237, 0.12)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#2F80ED",
                  flexShrink: 0,
                }}
              >
                <Building2 size={24} />
              </div>
              <div>
                <h3 style={{ fontSize: "1.05rem", fontWeight: 800, color: "#1F3652", margin: 0 }}>
                  ¡Bienvenido a Devio, {developerName}!
                </h3>
                <p style={{ fontSize: "0.82rem", color: "#64748B", margin: "0.2rem 0 0" }}>
                  Aún no tienes proyectos registrados. Comienza configurando tu primer desarrollo inmobiliario.
                </p>
              </div>
            </div>

            <Link
              href="/onboarding/project"
              className="btn btn-primary"
              style={{
                fontSize: "0.85rem",
                padding: "0.6rem 1.25rem",
                display: "inline-flex",
                alignItems: "center",
                gap: "0.4rem",
              }}
            >
              <Plus size={16} /> Crear tu Primer Proyecto
            </Link>
          </div>
        )}

        {/* 4 CARDS SUPERIORES DE RESUMEN GLOBAL */}
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
              Total Cobrado (Global)
            </span>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <div style={{ width: "22px", height: "22px", borderRadius: "50%", backgroundColor: "rgba(111, 172, 156, 0.15)", display: "flex", alignItems: "center", justifyContent: "center", color: "#00C48C", flexShrink: 0 }}>
                <CheckCircle2 size={15} />
              </div>
              <h3 style={{ fontSize: "1.25rem", fontWeight: 800, color: "#1F3652", margin: 0 }}>
                {formatMoney(globalMetrics.totalCobrado + globalMetrics.totalMoratoriosCobrados)}
              </h3>
            </div>
            {globalMetrics.totalMoratoriosCobrados > 0 && (
              <div style={{ fontSize: "0.7rem", color: "#64748B", fontWeight: 500, marginTop: "0.25rem", display: "flex", alignItems: "center", gap: "0.3rem" }}>
                <span>Cap: {formatMoney(globalMetrics.totalCobrado)}</span>
                <span>•</span>
                <span style={{ color: "#D97706", fontWeight: 600 }}>Int: +{formatMoney(globalMetrics.totalMoratoriosCobrados)}</span>
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
              Por cobrar (Global)
            </span>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <div style={{ width: "22px", height: "22px", borderRadius: "50%", backgroundColor: "rgba(199, 178, 139, 0.2)", display: "flex", alignItems: "center", justifyContent: "center", color: "#C7B28B", flexShrink: 0 }}>
                <FileText size={14} />
              </div>
              <h3 style={{ fontSize: "1.25rem", fontWeight: 800, color: "#1F3652", margin: 0 }}>
                {formatMoney(globalMetrics.porCobrar)}
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
                {formatMoney(globalMetrics.pagosAtrasados)}
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
                <TrendingUp size={12} /> AVANCE DE VENTAS GLOBAL
              </span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "0.3rem" }}>
              <h3 style={{ fontSize: "1.35rem", fontWeight: 800, color: "#2F80ED", margin: 0 }}>
                {globalMetrics.avanceVentasPct}%
              </h3>
              <span style={{ fontSize: "0.72rem", color: "#64748B" }}>
                <strong>{globalMetrics.unidadesVendidasCount}</strong> de <strong>{globalMetrics.unidadesTotalesCount}</strong> unidades
              </span>
            </div>
            <div style={{ height: "5px", width: "100%", backgroundColor: "#E2E8F0", borderRadius: "3px", overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${globalMetrics.avanceVentasPct}%`, backgroundColor: "#2F80ED", transition: "width 0.6s ease" }} />
            </div>
          </div>
        </div>

        {/* GRID PRINCIPAL: 2 COLUMNAS (62% Izquierda + 38% Derecha) */}
        <div style={{ display: "grid", gridTemplateColumns: "1.65fr 1fr", gap: "0.85rem", flex: 1, minHeight: 0 }}>
          
          {/* ============================================================== */}
          {/* COLUMNA IZQUIERDA: 2 FILAS (Fila 1: 2 Cards lado a lado, Fila 2: Tabla) */}
          {/* ============================================================== */}
          <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem", minHeight: 0 }}>
            
            {/* FILA SUPERIOR: Cobranza por Mes + Valor Comercial */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.85rem" }}>
              
              {/* 1. COBRANZA POR MES (5 MESES: 2 ABAJO, ACTUAL, 2 ARRIBA) */}
              <div style={{ backgroundColor: "#FFFFFF", borderRadius: "1rem", padding: "0.95rem 1.15rem", boxShadow: "0 2px 8px rgba(0,0,0,0.02)", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
                  <div>
                    <h3 style={{ fontSize: "0.92rem", fontWeight: 700, color: "#1F3652", margin: 0 }}>
                      Cobranza por Mes (Global)
                    </h3>
                    <p style={{ fontSize: "0.68rem", color: "#64748B", margin: "0.1rem 0 0" }}>
                      Ventana de 5 meses (2 previos, actual, 2 próximos)
                    </p>
                  </div>
                  {hasProjects && (
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
                  )}
                </div>

                {/* Gráfico de Barras de 5 Meses */}
                {hasProjects ? (
                  <>
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
                  </>
                ) : (
                  <div style={{ padding: "2.5rem 1rem", textAlign: "center", color: "#64748B", margin: "auto 0" }}>
                    <TrendingUp size={28} color="#94A3B8" style={{ margin: "0 auto 0.4rem" }} />
                    <p style={{ fontSize: "0.82rem", fontWeight: 600, color: "#1F3652", margin: 0 }}>
                      Sin movimientos de cobranza
                    </p>
                    <span style={{ fontSize: "0.72rem", color: "#94A3B8" }}>
                      Los cobros y cuentas por cobrar aparecerán al registrar ventas.
                    </span>
                  </div>
                )}
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
                      Resumen de ventas global
                    </p>
                  </div>
                </div>

                <div style={{ margin: "0.1rem 0 0.35rem" }}>
                  <div style={{ display: "flex", alignItems: "baseline", gap: "0.4rem" }}>
                    <h2 style={{ fontSize: "1.4rem", fontWeight: 800, color: "#00C48C", margin: 0, lineHeight: 1.1 }}>
                      {formatMoney(globalMetrics.valorComercialVendido)}
                    </h2>
                    <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "#00C48C" }}>vendidos</span>
                  </div>
                  <span style={{ fontSize: "0.7rem", color: "#64748B" }}>
                    de {formatMoney(globalMetrics.valorComercialTotal)} en inventario total
                  </span>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "0.4rem", marginBottom: "0.35rem" }}>
                  <div style={{ padding: "0.3rem 0.4rem", borderRadius: "0.4rem", border: "1px solid rgba(0, 196, 140, 0.3)", backgroundColor: "rgba(0, 196, 140, 0.03)" }}>
                    <span style={{ fontSize: "0.55rem", fontWeight: 700, color: "#64748B", textTransform: "uppercase", display: "block" }}>
                      UNIDADES VENDIDAS
                    </span>
                    <strong style={{ fontSize: "0.75rem", color: "#00C48C" }}>
                      {globalMetrics.unidadesVendidasCount} de {globalMetrics.unidadesTotalesCount}
                    </strong>
                  </div>

                  <div style={{ padding: "0.3rem 0.4rem", borderRadius: "0.4rem", border: "1px solid rgba(59, 130, 246, 0.3)", backgroundColor: "rgba(59, 130, 246, 0.03)" }}>
                    <span style={{ fontSize: "0.55rem", fontWeight: 700, color: "#64748B", textTransform: "uppercase", display: "block" }}>
                      POR VENDER
                    </span>
                    <strong style={{ fontSize: "0.75rem", color: "#3B82F6" }}>
                      {globalMetrics.porVenderUnidades} unidades
                    </strong>
                  </div>

                  <div style={{ padding: "0.3rem 0.4rem", borderRadius: "0.4rem", border: "1px solid #E2E8F0", backgroundColor: "#F8FAFC" }}>
                    <span style={{ fontSize: "0.55rem", fontWeight: 700, color: "#64748B", textTransform: "uppercase", display: "block" }}>
                      PRECIO PROMEDIO
                    </span>
                    <strong style={{ fontSize: "0.75rem", color: "#1F3652" }}>
                      {formatMoney(globalMetrics.precioPromedio)}
                    </strong>
                  </div>
                </div>

                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.15rem" }}>
                    <span style={{ fontSize: "0.68rem", color: "#64748B" }}>
                      % del inventario monetario vendido
                    </span>
                    <span style={{ fontSize: "0.85rem", fontWeight: 800, color: "#00C48C" }}>
                      {globalMetrics.inventarioMonetarioPct}%
                    </span>
                  </div>
                  <div style={{ height: "6px", width: "100%", backgroundColor: "rgba(0, 196, 140, 0.15)", borderRadius: "3px", overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${globalMetrics.inventarioMonetarioPct}%`, backgroundColor: "#00C48C" }} />
                  </div>
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", borderTop: "1px solid #E2E8F0", paddingTop: "0.35rem", marginTop: "0.25rem" }}>
                  <div>
                    <span style={{ fontSize: "0.65rem", color: "#64748B", display: "flex", alignItems: "center", gap: "0.25rem" }}>
                      <span style={{ width: "6px", height: "6px", borderRadius: "50%", backgroundColor: "#3B82F6", display: "inline-block" }} />
                      Por vender
                    </span>
                    <h4 style={{ fontSize: "0.82rem", fontWeight: 800, color: "#1F3652", margin: "0.1rem 0 0" }}>
                      {formatMoney(globalMetrics.porVenderMonto)}
                    </h4>
                  </div>

                  <div>
                    <span style={{ fontSize: "0.65rem", color: "#64748B", display: "flex", alignItems: "center", gap: "0.25rem" }}>
                      <span style={{ width: "6px", height: "6px", borderRadius: "50%", backgroundColor: "#00C48C", display: "inline-block" }} />
                      Flujo futuro
                    </span>
                    <h4 style={{ fontSize: "0.82rem", fontWeight: 800, color: "#1F3652", margin: "0.1rem 0 0" }}>
                      {formatMoney(globalMetrics.flujoFuturoMonto)}
                    </h4>
                  </div>
                </div>
              </div>
            </div>

            {/* FILA INFERIOR: UNIDADES VENDIDAS GLOBAL */}
            <div style={{ backgroundColor: "#FFFFFF", borderRadius: "1rem", padding: "0.95rem 1.15rem", boxShadow: "0 2px 8px rgba(0,0,0,0.02)", flex: 1, display: "flex", flexDirection: "column", minHeight: 0 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.4rem" }}>
                <div>
                  <h3 style={{ fontSize: "0.92rem", fontWeight: 700, color: "#1F3652", margin: 0 }}>
                    Unidades Vendidas Recientes
                  </h3>
                  <p style={{ fontSize: "0.68rem", color: "#64748B", margin: "0.1rem 0 0" }}>
                    Últimas unidades vendidas en todos los desarrollos
                  </p>
                </div>
                <Link
                  href="/projects"
                  style={{ fontSize: "0.72rem", color: "#2F80ED", fontWeight: 600, textDecoration: "none" }}
                >
                  Ver proyectos ({projects.length})
                </Link>
              </div>

              {allSoldUnits.length > 0 ? (
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
                      {allSoldUnits.slice(0, 5).map((u: any, i: number) => (
                        <tr
                          key={i}
                          style={{
                            borderBottom: "1px solid rgba(22, 43, 63, 0.04)",
                            transition: "background-color 0.15s ease",
                          }}
                        >
                          <td style={{ padding: "0.4rem 0.4rem", fontWeight: 700, color: "#1F3652" }}>{u.unit}</td>
                          <td style={{ padding: "0.4rem 0.4rem", color: "#475569" }}>{u.type}</td>
                          <td style={{ padding: "0.4rem 0.4rem", fontWeight: 600, color: "#1F3652" }}>{formatMoney(u.price)}</td>
                          <td style={{ padding: "0.4rem 0.4rem", color: "#475569" }}>{u.areaM2}</td>
                          <td style={{ padding: "0.4rem 0.4rem", color: "#475569" }}>{u.project || "Desarrollo"}</td>
                          <td style={{ padding: "0.4rem 0.4rem", color: "#1F3652", fontWeight: 500 }}>{u.client}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div style={{ padding: "2rem 1rem", textAlign: "center", color: "#64748B", margin: "auto 0" }}>
                  <Package size={28} color="#94A3B8" style={{ margin: "0 auto 0.4rem" }} />
                  <p style={{ fontSize: "0.82rem", fontWeight: 600, color: "#1F3652", margin: 0 }}>
                    Aún no hay unidades vendidas registradas
                  </p>
                  <span style={{ fontSize: "0.72rem", color: "#94A3B8" }}>
                    Al concretar ventas o apartados en tus proyectos, se listarán automáticamente aquí.
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* ============================================================== */}
          {/* COLUMNA DERECHA: 3 CARDS (Distribución Dinero, Carteras, Estado Unidades) */}
          {/* ============================================================== */}
          <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem", minHeight: 0 }}>
            
            {/* 1. DISTRIBUCIÓN DEL DINERO (BARRA SEGMENTADA) */}
            <div style={{ backgroundColor: "#FFFFFF", borderRadius: "1rem", padding: "0.95rem 1.15rem", boxShadow: "0 2px 8px rgba(0,0,0,0.02)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "0.6rem" }}>
                <div>
                  <h3 style={{ fontSize: "0.92rem", fontWeight: 700, color: "#1F3652", margin: 0 }}>
                    Distribución del Dinero
                  </h3>
                  <p style={{ fontSize: "0.68rem", color: "#64748B", margin: "0.1rem 0 0" }}>
                    Estado financiero global
                  </p>
                </div>
                <div style={{ textAlign: "right" }}>
                  <span style={{ fontSize: "0.62rem", fontWeight: 700, color: "#64748B", textTransform: "uppercase", display: "block" }}>
                    Total Facturado
                  </span>
                  <strong style={{ fontSize: "0.9rem", fontWeight: 800, color: "#1F3652" }}>
                    {formatMoney(globalMetrics.totalFacturado)}
                  </strong>
                </div>
              </div>

              {/* Barra Segmentada Horizontal */}
              <div style={{ height: "12px", width: "100%", backgroundColor: "#F1F5F9", borderRadius: "6px", overflow: "hidden", display: "flex", margin: "0.6rem 0 0.85rem" }}>
                {globalMetrics.totalFacturado > 0 ? (
                  <>
                    {globalMetrics.totalCobrado > 0 && (
                      <div
                        title={`Cobrado: ${formatMoney(globalMetrics.totalCobrado)} (${moneyDist.cobradoPct.toFixed(1)}%)`}
                        style={{
                          width: `${moneyDist.cobradoPct}%`,
                          backgroundColor: "#00C48C",
                          transition: "width 0.4s ease",
                        }}
                      />
                    )}
                    {globalMetrics.porCobrar > 0 && (
                      <div
                        title={`Por cobrar: ${formatMoney(globalMetrics.porCobrar)} (${moneyDist.porCobrarPct.toFixed(1)}%)`}
                        style={{
                          width: `${moneyDist.porCobrarPct}%`,
                          backgroundColor: "#2F80ED",
                          transition: "width 0.4s ease",
                        }}
                      />
                    )}
                    {globalMetrics.pagosAtrasados > 0 && (
                      <div
                        title={`Atrasado: ${formatMoney(globalMetrics.pagosAtrasados)} (${moneyDist.atrasadosPct.toFixed(1)}%)`}
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
                    <span style={{ fontWeight: 700, color: "#1F3652" }}>{formatMoney(globalMetrics.totalCobrado)}</span>
                    <span style={{ fontSize: "0.7rem", fontWeight: 600, color: "#00C48C", minWidth: "38px", textAlign: "right" }}>
                      {globalMetrics.totalFacturado > 0 ? `${moneyDist.cobradoPct.toFixed(1)}%` : "0%"}
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
                    <span style={{ fontWeight: 700, color: "#1F3652" }}>{formatMoney(globalMetrics.porCobrar)}</span>
                    <span style={{ fontSize: "0.7rem", fontWeight: 600, color: "#2F80ED", minWidth: "38px", textAlign: "right" }}>
                      {globalMetrics.totalFacturado > 0 ? `${moneyDist.porCobrarPct.toFixed(1)}%` : "0%"}
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
                    <span style={{ fontWeight: 700, color: "#1F3652" }}>{formatMoney(globalMetrics.pagosAtrasados)}</span>
                    <span style={{ fontSize: "0.7rem", fontWeight: 600, color: "#F03D30", minWidth: "38px", textAlign: "right" }}>
                      {globalMetrics.totalFacturado > 0 ? `${moneyDist.atrasadosPct.toFixed(1)}%` : "0%"}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* 2. CARTERAS VENCIDAS */}
            <div style={{ backgroundColor: "#FFFFFF", borderRadius: "1rem", padding: "0.85rem 1.15rem", boxShadow: "0 2px 8px rgba(0,0,0,0.02)" }}>
              <h3 style={{ fontSize: "0.92rem", fontWeight: 700, color: "#1F3652", margin: "0 0 0.5rem" }}>
                Carteras vencidas (Global)
              </h3>

              {globalOverdueClients.length > 0 ? (
                <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                  {globalOverdueClients.map((client: any, idx: number) => (
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
                        <span style={{ fontSize: "0.74rem", fontWeight: 600, color: "#475569", maxWidth: "145px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                          {client.name}
                        </span>
                      </div>
                      <span style={{ fontSize: "0.8rem", fontWeight: 800, color: "#F03D30" }}>
                        {formatMoney(client.amount)}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ padding: "1.25rem 0.5rem", textAlign: "center", color: "#64748B" }}>
                  <CheckCircle2 size={22} color="#00C48C" style={{ margin: "0 auto 0.3rem" }} />
                  <p style={{ fontSize: "0.8rem", fontWeight: 600, color: "#1F3652", margin: 0 }}>
                    Sin carteras vencidas
                  </p>
                  <span style={{ fontSize: "0.7rem", color: "#94A3B8" }}>
                    Todos los pagos están al corriente.
                  </span>
                </div>
              )}
            </div>

            {/* 3. ESTADO DE UNIDADES (BARRA SEGMENTADA) */}
            <div style={{ backgroundColor: "#FFFFFF", borderRadius: "1rem", padding: "0.95rem 1.15rem", boxShadow: "0 2px 8px rgba(0,0,0,0.02)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "0.6rem" }}>
                <div>
                  <h3 style={{ fontSize: "0.92rem", fontWeight: 700, color: "#1F3652", margin: 0 }}>
                    Estado de Unidades (Global)
                  </h3>
                  <p style={{ fontSize: "0.68rem", color: "#64748B", margin: "0.1rem 0 0" }}>
                    Distribución total por status
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
    </AppLayout>
  );
}
