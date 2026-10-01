"use client";

import React, { useState, useMemo } from "react";
import {
  FileSpreadsheet,
  Calendar,
  Search,
  Filter,
  ArrowRight,
  Info,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ExternalLink,
  DollarSign,
  X,
  CreditCard,
  Mail,
  User,
  Building2,
  ShieldAlert,
  ChevronLeft,
  ChevronRight,
  Plus
} from "lucide-react";
import * as XLSX from "xlsx";
import { ProjectItem, SaleRecord, PaymentScheduleItem } from "@/data/projects-data";

export interface PaymentsMatrixViewProps {
  project: ProjectItem;
  currency?: "MXN" | "USD";
  formatMoney: (val: number) => string;
  onRecordPayment?: (paymentItem: PaymentScheduleItem) => void;
  onSendReminder?: (paymentItem: PaymentScheduleItem) => void;
  onSendOverdueNotice?: (paymentItem: PaymentScheduleItem) => void;
  onOpenSaleDetails?: (sale: SaleRecord) => void;
}

export type Granularity = "WEEKS" | "MONTHS" | "YEARS";

interface CellData {
  periodKey: string;
  periodLabel: string;
  scheduledAmount: number;
  paidAmount: number;
  pendingAmount: number;
  status: "NO_OBLIGATION" | "PAID" | "PARTIAL" | "OVERDUE" | "UPCOMING";
  obligations: any[];
  receipts: any[];
  oldestDueDate?: Date;
  daysOverdue: number;
  moratoryInterest: number;
}

interface RowData {
  unit: string;
  clientName: string;
  clientEmail?: string;
  clientPhone?: string;
  saleFolio?: string;
  saleRecord: SaleRecord;
  totalSalePrice: number;
  totalSalePaid: number;
  totalSalePending: number;
  cells: Record<string, CellData>;
  rowScheduledSum: number;
  rowPaidSum: number;
  rowPendingSum: number;
  rowOverdueSum: number;
}

const MONTH_NAMES = [
  "ENERO",
  "FEBRERO",
  "MARZO",
  "ABRIL",
  "MAYO",
  "JUNIO",
  "JULIO",
  "AGOSTO",
  "SEPTIEMBRE",
  "OCTUBRE",
  "NOVIEMBRE",
  "DICIEMBRE",
];

function parseDateFlexible(dStr?: string): Date | null {
  if (!dStr || dStr === "-" || dStr === "Pendiente" || dStr === "Liquidado" || dStr === "Parcial")
    return null;
  const str = String(dStr).trim();
  if (str.includes("-")) {
    const parts = str.split("-");
    if (parts.length === 3 && parts[0] && parts[1] && parts[2]) {
      if (parts[0].length === 4) {
        return new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
      } else {
        return new Date(parseInt(parts[2], 10), parseInt(parts[1], 10) - 1, parseInt(parts[0], 10));
      }
    }
  }
  if (str.includes("/")) {
    const parts = str.split("/");
    if (parts.length === 3 && parts[0] && parts[1] && parts[2]) {
      return new Date(parseInt(parts[2], 10), parseInt(parts[1], 10) - 1, parseInt(parts[0], 10));
    }
  }
  const parsed = new Date(str);
  return isNaN(parsed.getTime()) ? null : parsed;
}

export default function PaymentsMatrixView({
  project,
  currency = "MXN",
  formatMoney,
  onRecordPayment,
  onSendReminder,
  onSendOverdueNotice,
  onOpenSaleDetails,
}: PaymentsMatrixViewProps) {
  // Granularity & Period Navigation
  const currentYear = new Date().getFullYear();
  const [granularity, setGranularity] = useState<Granularity>("MONTHS");
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth());

  // Reference Date (Día de referencia / Fecha de corte para cálculo de mora)
  const todayIso = new Date().toISOString().split("T")[0] || "2026-09-30";
  const [referenceDateStr, setReferenceDateStr] = useState<string>(todayIso);

  // Filters
  const [conceptFilter, setConceptFilter] = useState<string>("ALL");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Modal / Drawer state for Cell Breakdown
  const [selectedCellBreakdown, setSelectedCellBreakdown] = useState<{
    row: RowData;
    cell: CellData;
  } | null>(null);

  const referenceDate = useMemo(() => {
    const d = parseDateFlexible(referenceDateStr);
    if (!d) return new Date();
    d.setHours(23, 59, 59, 999);
    return d;
  }, [referenceDateStr]);

  // Available Years extracted from project sales
  const availableYears = useMemo(() => {
    const yearsSet = new Set<number>([currentYear - 1, currentYear, currentYear + 1, currentYear + 2]);
    (project.sales || []).forEach((sale) => {
      if (sale.saleDate) {
        const d = parseDateFlexible(sale.saleDate);
        if (d) yearsSet.add(d.getFullYear());
      }
      (sale.schedule || []).forEach((inst) => {
        const d = parseDateFlexible(inst.scheduledDate);
        if (d) yearsSet.add(d.getFullYear());
      });
    });
    return Array.from(yearsSet).sort((a, b) => a - b);
  }, [project, currentYear]);

  // Column Headers based on Granularity
  const columns = useMemo(() => {
    if (granularity === "MONTHS") {
      return MONTH_NAMES.map((name, idx) => ({
        key: `m-${selectedYear}-${idx}`,
        title: name,
        subtitle: String(selectedYear),
        monthIndex: idx,
        year: selectedYear,
      }));
    }

    if (granularity === "WEEKS") {
      const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();
      const monthName = MONTH_NAMES[selectedMonth] || "MES";
      const weeks = [
        { key: `w-${selectedYear}-${selectedMonth}-1`, title: "SEM 1", subtitle: `1 - 7 ${monthName.slice(0, 3)}`, startDay: 1, endDay: 7 },
        { key: `w-${selectedYear}-${selectedMonth}-2`, title: "SEM 2", subtitle: `8 - 14 ${monthName.slice(0, 3)}`, startDay: 8, endDay: 14 },
        { key: `w-${selectedYear}-${selectedMonth}-3`, title: "SEM 3", subtitle: `15 - 21 ${monthName.slice(0, 3)}`, startDay: 15, endDay: 21 },
        { key: `w-${selectedYear}-${selectedMonth}-4`, title: "SEM 4", subtitle: `22 - 28 ${monthName.slice(0, 3)}`, startDay: 22, endDay: 28 },
      ];
      if (daysInMonth > 28) {
        weeks.push({
          key: `w-${selectedYear}-${selectedMonth}-5`,
          title: "SEM 5",
          subtitle: `29 - ${daysInMonth} ${monthName.slice(0, 3)}`,
          startDay: 29,
          endDay: daysInMonth,
        });
      }
      return weeks;
    }

    // YEARS Granularity
    return availableYears.map((yr) => ({
      key: `y-${yr}`,
      title: String(yr),
      subtitle: "AÑO",
      year: yr,
    }));
  }, [granularity, selectedYear, selectedMonth, availableYears]);

  // Process Rows and Matrix Calculation
  const rowsData = useMemo<RowData[]>(() => {
    const activeSales = (project.sales || []).filter((s) => s.status !== "CANCELADA");

    const rows: RowData[] = [];

    activeSales.forEach((sale) => {
      const rawUnitStr =
        typeof sale.unit === "object" && sale.unit !== null
          ? (sale.unit as any).unitNumber
          : sale.unit;
      const unitNum = String(rawUnitStr || "").trim();
      const clientName =
        sale.clientName || (sale as any).primaryClient?.fullName || "Cliente Inversionista";

      // Filter obligations by concept if selected
      let rawSchedule = Array.isArray(sale.schedule) ? sale.schedule : [];
      if (conceptFilter !== "ALL") {
        rawSchedule = rawSchedule.filter((inst) => {
          const c = (inst.concept || "").toLowerCase();
          if (conceptFilter === "DOWNPAYMENT")
            return c.includes("enganche") || c.includes("inicial") || c.includes("anticipo");
          if (conceptFilter === "INSTALLMENT")
            return c.includes("mensualidad") || c.includes("cuota") || c.includes("amortizaci");
          if (conceptFilter === "MAINTENANCE")
            return c.includes("mantenimiento") || c.includes("mtto") || c.includes("cuota mtto");
          if (conceptFilter === "LIQUIDATION")
            return c.includes("liquidacion") || c.includes("finiquito") || c.includes("escritura") || c.includes("contra entrega");
          return true;
        });
      }

      const cells: Record<string, CellData> = {};
      let rowScheduledSum = 0;
      let rowPaidSum = 0;
      let rowPendingSum = 0;
      let rowOverdueSum = 0;

      columns.forEach((col) => {
        let matchingObligations: any[] = [];

        if (granularity === "MONTHS") {
          const colMonth = (col as any).monthIndex;
          const colYear = (col as any).year;
          matchingObligations = rawSchedule.filter((inst) => {
            const d = parseDateFlexible(inst.scheduledDate);
            if (!d) return false;
            return d.getFullYear() === colYear && d.getMonth() === colMonth;
          });
        } else if (granularity === "WEEKS") {
          const colStartDay = (col as any).startDay;
          const colEndDay = (col as any).endDay;
          matchingObligations = rawSchedule.filter((inst) => {
            const d = parseDateFlexible(inst.scheduledDate);
            if (!d) return false;
            if (d.getFullYear() !== selectedYear || d.getMonth() !== selectedMonth) return false;
            const day = d.getDate();
            return day >= colStartDay && day <= colEndDay;
          });
        } else if (granularity === "YEARS") {
          const colYear = (col as any).year;
          matchingObligations = rawSchedule.filter((inst) => {
            const d = parseDateFlexible(inst.scheduledDate);
            if (!d) return false;
            return d.getFullYear() === colYear;
          });
        }

        const scheduledAmt = matchingObligations.reduce(
          (sum, ob) => sum + (Number(ob.scheduledAmount || ob.amount) || 0),
          0
        );
        const paidAmt = matchingObligations.reduce(
          (sum, ob) => sum + (Number(ob.paidAmount) || 0),
          0
        );
        const pendingAmt = Math.max(0, scheduledAmt - paidAmt);

        // Evaluate overdue status relative to referenceDate
        let isOverdue = false;
        let oldestDueDate: Date | undefined;
        let maxDaysOverdue = 0;

        matchingObligations.forEach((ob) => {
          const due = parseDateFlexible(ob.scheduledDate);
          const obPending =
            ob.pendingAmount !== undefined
              ? Number(ob.pendingAmount)
              : Math.max(0, (Number(ob.scheduledAmount) || 0) - (Number(ob.paidAmount) || 0));

          if (due && obPending > 0 && due < referenceDate) {
            isOverdue = true;
            if (!oldestDueDate || due < oldestDueDate) {
              oldestDueDate = due;
            }
            const diffDays = Math.floor((referenceDate.getTime() - due.getTime()) / (1000 * 60 * 60 * 24));
            if (diffDays > maxDaysOverdue) maxDaysOverdue = diffDays;
          }
        });

        // Moratory Interest Calculation: (Pending * 3% monthly rate / 30 * days)
        const monthlyMoratoryRate = 0.03;
        const moratoryInterest =
          isOverdue && pendingAmt > 0 && maxDaysOverdue > 0
            ? Math.round((pendingAmt * monthlyMoratoryRate * maxDaysOverdue) / 30)
            : 0;

        let status: CellData["status"] = "NO_OBLIGATION";
        if (scheduledAmt > 0) {
          if (pendingAmt === 0) {
            status = "PAID";
          } else if (paidAmt > 0) {
            status = "PARTIAL";
          } else if (isOverdue) {
            status = "OVERDUE";
          } else {
            status = "UPCOMING";
          }
        }

        // Receipts matching these obligations
        const receipts = (sale.payments || []).filter((p: any) => {
          const pDate = parseDateFlexible(p.paymentDate || p.fechaPago);
          if (!pDate) return false;
          if (granularity === "MONTHS") {
            return pDate.getFullYear() === (col as any).year && pDate.getMonth() === (col as any).monthIndex;
          }
          if (granularity === "WEEKS") {
            return (
              pDate.getFullYear() === selectedYear &&
              pDate.getMonth() === selectedMonth &&
              pDate.getDate() >= (col as any).startDay &&
              pDate.getDate() <= (col as any).endDay
            );
          }
          return pDate.getFullYear() === (col as any).year;
        });

        cells[col.key] = {
          periodKey: col.key,
          periodLabel: `${col.title} ${col.subtitle}`,
          scheduledAmount: scheduledAmt,
          paidAmount: paidAmt,
          pendingAmount: pendingAmt,
          status,
          obligations: matchingObligations,
          receipts,
          oldestDueDate,
          daysOverdue: maxDaysOverdue,
          moratoryInterest,
        };

        rowScheduledSum += scheduledAmt;
        rowPaidSum += paidAmt;
        rowPendingSum += pendingAmt;
        if (isOverdue) rowOverdueSum += pendingAmt;
      });

      rows.push({
        unit: unitNum,
        clientName,
        clientEmail: sale.clientEmail,
        clientPhone: sale.clientPhone,
        saleFolio: sale.folio || (sale as any).contractNumber || `VTA-${unitNum}`,
        saleRecord: sale,
        totalSalePrice: Number(sale.totalPrice || (sale as any).finalPrice) || 0,
        totalSalePaid: Number(sale.paidAmount) || 0,
        totalSalePending: Number(sale.pendingAmount) || 0,
        cells,
        rowScheduledSum,
        rowPaidSum,
        rowPendingSum,
        rowOverdueSum,
      });
    });

    // Natural sort by Unit (e.g. 1, 2, 3, 9-A, 10, 11)
    return rows.sort((a, b) => {
      return a.unit.localeCompare(b.unit, undefined, { numeric: true, sensitivity: "base" });
    });
  }, [
    project,
    columns,
    granularity,
    selectedYear,
    selectedMonth,
    conceptFilter,
    referenceDate,
  ]);

  // Filtered rows by search & status
  const filteredRows = useMemo(() => {
    return rowsData.filter((r) => {
      // Search
      const search = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !search ||
        r.unit.toLowerCase().includes(search) ||
        r.clientName.toLowerCase().includes(search) ||
        (r.saleFolio && r.saleFolio.toLowerCase().includes(search));

      if (!matchesSearch) return false;

      // Status filter
      if (statusFilter === "ALL") return true;
      if (statusFilter === "OVERDUE") return r.rowOverdueSum > 0;
      if (statusFilter === "PAID") return r.rowPaidSum > 0 && r.rowPendingSum === 0;
      if (statusFilter === "PARTIAL") return r.rowPaidSum > 0 && r.rowPendingSum > 0;
      if (statusFilter === "UPCOMING") return r.rowPendingSum > 0 && r.rowOverdueSum === 0;

      return true;
    });
  }, [rowsData, searchQuery, statusFilter]);

  // Column Totals
  const columnTotals = useMemo(() => {
    const totals: Record<
      string,
      { scheduled: number; paid: number; pending: number; overdue: number }
    > = {};

    columns.forEach((col) => {
      let scheduled = 0;
      let paid = 0;
      let pending = 0;
      let overdue = 0;

      filteredRows.forEach((r) => {
        const cell = r.cells[col.key];
        if (cell) {
          scheduled += cell.scheduledAmount;
          paid += cell.paidAmount;
          pending += cell.pendingAmount;
          if (cell.status === "OVERDUE") {
            overdue += cell.pendingAmount;
          }
        }
      });

      totals[col.key] = { scheduled, paid, pending, overdue };
    });

    return totals;
  }, [columns, filteredRows]);

  // Overall Global Summary
  const globalSummary = useMemo(() => {
    let totalScheduled = 0;
    let totalPaid = 0;
    let totalPending = 0;
    let totalOverdue = 0;

    filteredRows.forEach((r) => {
      totalScheduled += r.rowScheduledSum;
      totalPaid += r.rowPaidSum;
      totalPending += r.rowPendingSum;
      totalOverdue += r.rowOverdueSum;
    });

    const efficiency = totalScheduled > 0 ? Math.round((totalPaid / totalScheduled) * 100) : 0;

    return { totalScheduled, totalPaid, totalPending, totalOverdue, efficiency };
  }, [filteredRows]);

  // Excel Matrix Export
  const handleExportExcelMatrix = () => {
    const wb = XLSX.utils.book_new();

    const headers = ["# Unidad", "Cliente", "Total Programado", "Total Pagado", "Saldo Pendiente"];
    columns.forEach((col) => {
      headers.push(`${col.title} ${col.subtitle}`);
    });

    const rows: any[][] = [headers];

    filteredRows.forEach((r) => {
      const rowArr: any[] = [
        r.unit,
        r.clientName,
        r.rowScheduledSum,
        r.rowPaidSum,
        r.rowPendingSum,
      ];
      columns.forEach((col) => {
        const cell = r.cells[col.key];
        if (!cell || cell.status === "NO_OBLIGATION") {
          rowArr.push("-");
        } else if (cell.status === "PAID") {
          rowArr.push(cell.paidAmount);
        } else if (cell.status === "OVERDUE") {
          rowArr.push(-cell.pendingAmount);
        } else if (cell.status === "PARTIAL") {
          rowArr.push(`Parcial (${cell.paidAmount} / ${cell.scheduledAmount})`);
        } else {
          rowArr.push(cell.scheduledAmount);
        }
      });
      rows.push(rowArr);
    });

    // Totals row
    const totalsRow: any[] = ["TOTALES", "-", globalSummary.totalScheduled, globalSummary.totalPaid, globalSummary.totalPending];
    columns.forEach((col) => {
      const tot = columnTotals[col.key];
      totalsRow.push(tot ? tot.paid : 0);
    });
    rows.push(totalsRow);

    const ws = XLSX.utils.aoa_to_sheet(rows);
    XLSX.utils.book_append_sheet(wb, ws, "Tabla de Cobranza");
    XLSX.writeFile(wb, `Tabla_Cobranza_${project.name.replace(/\s+/g, "_")}_${selectedYear}.xlsx`);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
      {/* 1. FILTER & CONTROLS TOOLBAR (Matching user's screenshot) */}
      <div
        style={{
          backgroundColor: "#FFFFFF",
          borderRadius: "1.1rem",
          padding: "1rem 1.25rem",
          boxShadow: "0 2px 10px rgba(0,0,0,0.03)",
          border: "1px solid rgba(22, 43, 63, 0.05)",
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "1rem",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}>
          {/* Excel Export Button */}
          <button
            type="button"
            onClick={handleExportExcelMatrix}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.4rem",
              padding: "0.55rem 1rem",
              borderRadius: "8px",
              backgroundColor: "#107C41",
              color: "#FFFFFF",
              fontSize: "0.82rem",
              fontWeight: 700,
              border: "none",
              cursor: "pointer",
              boxShadow: "0 2px 6px rgba(16, 124, 65, 0.2)",
            }}
            title="Descargar matriz en Excel (.xlsx)"
          >
            <FileSpreadsheet size={16} /> XLS
          </button>

          {/* Granularity Switcher Pills: Semanas / Meses / Años */}
          <div
            style={{
              display: "inline-flex",
              backgroundColor: "#F1F5F9",
              borderRadius: "9999px",
              padding: "3px",
              gap: "2px",
            }}
          >
            {[
              { id: "WEEKS" as Granularity, label: "Semanas" },
              { id: "MONTHS" as Granularity, label: "Meses" },
              { id: "YEARS" as Granularity, label: "Años" },
            ].map((tab) => {
              const isSelected = granularity === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setGranularity(tab.id)}
                  style={{
                    padding: "0.4rem 0.85rem",
                    borderRadius: "9999px",
                    fontSize: "0.78rem",
                    fontWeight: isSelected ? 700 : 500,
                    backgroundColor: isSelected ? "var(--devio-blue-dark)" : "transparent",
                    color: isSelected ? "#FFFFFF" : "var(--devio-neutral-4)",
                    border: "none",
                    cursor: "pointer",
                    transition: "all 0.15s ease",
                  }}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Concept Filter */}
          <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
            <span style={{ fontSize: "0.78rem", color: "var(--devio-neutral-3)", fontWeight: 600 }}>
              Mostrar:
            </span>
            <select
              value={conceptFilter}
              onChange={(e) => setConceptFilter(e.target.value)}
              style={{
                padding: "0.45rem 0.75rem",
                borderRadius: "8px",
                border: "1px solid #E2E8F0",
                backgroundColor: "#FFFFFF",
                fontSize: "0.82rem",
                fontWeight: 600,
                color: "var(--devio-blue-dark)",
                cursor: "pointer",
                outline: "none",
              }}
            >
              <option value="ALL">Todas las cuotas</option>
              <option value="DOWNPAYMENT">Enganches</option>
              <option value="INSTALLMENT">Mensualidades</option>
              <option value="MAINTENANCE">Mantenimiento</option>
              <option value="LIQUIDATION">Liquidaciones</option>
            </select>
          </div>

          {/* Year Selector (when Months or Weeks) */}
          {granularity !== "YEARS" && (
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              style={{
                padding: "0.45rem 0.75rem",
                borderRadius: "8px",
                border: "1px solid #E2E8F0",
                backgroundColor: "#FFFFFF",
                fontSize: "0.82rem",
                fontWeight: 700,
                color: "var(--devio-blue-dark)",
                cursor: "pointer",
                outline: "none",
              }}
            >
              {availableYears.map((yr) => (
                <option key={yr} value={yr}>
                  {yr}
                </option>
              ))}
            </select>
          )}

          {/* Month Selector (when Weeks) */}
          {granularity === "WEEKS" && (
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(Number(e.target.value))}
              style={{
                padding: "0.45rem 0.75rem",
                borderRadius: "8px",
                border: "1px solid #E2E8F0",
                backgroundColor: "#FFFFFF",
                fontSize: "0.82rem",
                fontWeight: 700,
                color: "var(--devio-blue-dark)",
                cursor: "pointer",
                outline: "none",
              }}
            >
              {MONTH_NAMES.map((name, idx) => (
                <option key={idx} value={idx}>
                  {name}
                </option>
              ))}
            </select>
          )}

          {/* Día de Referencia (Fecha de corte) */}
          <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
            <span
              style={{ fontSize: "0.78rem", color: "var(--devio-neutral-3)", fontWeight: 600 }}
              title="Fecha límite contra la cual se evalúan los días de mora y cuotas vencidas"
            >
              Día de referencia:
            </span>
            <input
              type="date"
              value={referenceDateStr}
              onChange={(e) => setReferenceDateStr(e.target.value)}
              style={{
                padding: "0.4rem 0.6rem",
                borderRadius: "8px",
                border: "1px solid #E2E8F0",
                backgroundColor: "#FFFFFF",
                fontSize: "0.8rem",
                fontWeight: 600,
                color: "var(--devio-blue-dark)",
                outline: "none",
                cursor: "pointer",
              }}
            />
          </div>

          {/* Status Filter */}
          <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
            <span style={{ fontSize: "0.78rem", color: "var(--devio-neutral-3)", fontWeight: 600 }}>
              Filtrar:
            </span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{
                padding: "0.45rem 0.75rem",
                borderRadius: "8px",
                border: "1px solid #E2E8F0",
                backgroundColor: "#FFFFFF",
                fontSize: "0.82rem",
                fontWeight: 600,
                color: "var(--devio-blue-dark)",
                cursor: "pointer",
                outline: "none",
              }}
            >
              <option value="ALL">Cuotas y Pagos</option>
              <option value="PAID">Solo Pagadas (Verde)</option>
              <option value="OVERDUE">Solo Vencidas (Rojo)</option>
              <option value="PARTIAL">Solo Parciales (Amarillo)</option>
              <option value="UPCOMING">Solo Por Vencer</option>
            </select>
          </div>
        </div>

        {/* Search Input */}
        <div style={{ position: "relative", minWidth: "220px" }}>
          <Search
            size={15}
            style={{
              position: "absolute",
              left: "10px",
              top: "50%",
              transform: "translateY(-50%)",
              color: "var(--devio-neutral-3)",
            }}
          />
          <input
            type="text"
            placeholder="Buscar unidad o cliente..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: "100%",
              padding: "0.45rem 0.75rem 0.45rem 2rem",
              borderRadius: "9999px",
              border: "1px solid #E2E8F0",
              fontSize: "0.8rem",
              outline: "none",
            }}
          />
        </div>
      </div>

      {/* 2. SUMMARY STATS BANNER */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(5, 1fr)",
          gap: "0.75rem",
        }}
      >
        <div
          style={{
            backgroundColor: "#FFFFFF",
            borderRadius: "0.85rem",
            padding: "0.75rem 1rem",
            border: "1px solid rgba(22, 43, 63, 0.05)",
            boxShadow: "0 1px 4px rgba(0,0,0,0.02)",
          }}
        >
          <span style={{ fontSize: "0.72rem", color: "var(--devio-neutral-3)", display: "block" }}>
            Unidades en Cobranza
          </span>
          <strong style={{ fontSize: "1.15rem", color: "var(--devio-blue-dark)" }}>
            {filteredRows.length} unidades
          </strong>
        </div>

        <div
          style={{
            backgroundColor: "#FFFFFF",
            borderRadius: "0.85rem",
            padding: "0.75rem 1rem",
            border: "1px solid rgba(22, 43, 63, 0.05)",
            boxShadow: "0 1px 4px rgba(0,0,0,0.02)",
          }}
        >
          <span style={{ fontSize: "0.72rem", color: "var(--devio-neutral-3)", display: "block" }}>
            Total Programado ({selectedYear})
          </span>
          <strong style={{ fontSize: "1.15rem", color: "var(--devio-blue-dark)" }}>
            {formatMoney(globalSummary.totalScheduled)}
          </strong>
        </div>

        <div
          style={{
            backgroundColor: "#FFFFFF",
            borderRadius: "0.85rem",
            padding: "0.75rem 1rem",
            border: "1px solid rgba(22, 43, 63, 0.05)",
            boxShadow: "0 1px 4px rgba(0,0,0,0.02)",
          }}
        >
          <span style={{ fontSize: "0.72rem", color: "#065F46", display: "block", fontWeight: 600 }}>
            Total Cobrado / Pagado
          </span>
          <strong style={{ fontSize: "1.15rem", color: "#059669" }}>
            {formatMoney(globalSummary.totalPaid)}
          </strong>
        </div>

        <div
          style={{
            backgroundColor: "#FFFFFF",
            borderRadius: "0.85rem",
            padding: "0.75rem 1rem",
            border: "1px solid rgba(22, 43, 63, 0.05)",
            boxShadow: "0 1px 4px rgba(0,0,0,0.02)",
          }}
        >
          <span style={{ fontSize: "0.72rem", color: "#991B1B", display: "block", fontWeight: 600 }}>
            Saldo Vencido (Atrasado)
          </span>
          <strong style={{ fontSize: "1.15rem", color: "#DC2626" }}>
            {formatMoney(globalSummary.totalOverdue)}
          </strong>
        </div>

        <div
          style={{
            backgroundColor: "#FFFFFF",
            borderRadius: "0.85rem",
            padding: "0.75rem 1rem",
            border: "1px solid rgba(22, 43, 63, 0.05)",
            boxShadow: "0 1px 4px rgba(0,0,0,0.02)",
          }}
        >
          <span style={{ fontSize: "0.72rem", color: "var(--devio-neutral-3)", display: "block" }}>
            Efectividad de Cobro
          </span>
          <strong
            style={{
              fontSize: "1.15rem",
              color: globalSummary.efficiency >= 80 ? "#059669" : "#D97706",
            }}
          >
            {globalSummary.efficiency}%
          </strong>
        </div>
      </div>

      {/* 3. MATRIX TABLE (Identical to screenshot layout) */}
      <div
        style={{
          backgroundColor: "#FFFFFF",
          borderRadius: "1.1rem",
          boxShadow: "0 2px 10px rgba(0,0,0,0.03)",
          border: "1px solid rgba(22, 43, 63, 0.05)",
          overflow: "hidden",
        }}
      >
        <div style={{ overflowX: "auto", maxHeight: "72vh" }}>
          <table
            style={{
              width: "100%",
              borderCollapse: "separate",
              borderSpacing: 0,
              fontSize: "0.8rem",
              textAlign: "right",
            }}
          >
            {/* Table Header */}
            <thead>
              <tr
                style={{
                  backgroundColor: "#F8FAFC",
                  position: "sticky",
                  top: 0,
                  zIndex: 20,
                  borderBottom: "2px solid #E2E8F0",
                }}
              >
                {/* Left Fixed Unit Column */}
                <th
                  style={{
                    position: "sticky",
                    left: 0,
                    zIndex: 25,
                    backgroundColor: "#F8FAFC",
                    padding: "0.75rem 0.6rem",
                    textAlign: "center",
                    width: "70px",
                    fontWeight: 800,
                    color: "var(--devio-blue-dark)",
                    borderRight: "1.5px solid #E2E8F0",
                    borderBottom: "2px solid #E2E8F0",
                  }}
                >
                  Unidad
                </th>

                {/* Left Fixed Client Column */}
                <th
                  style={{
                    position: "sticky",
                    left: 70,
                    zIndex: 25,
                    backgroundColor: "#F8FAFC",
                    padding: "0.75rem 0.85rem",
                    textAlign: "left",
                    minWidth: "170px",
                    fontWeight: 800,
                    color: "var(--devio-blue-dark)",
                    borderRight: "2px solid #CBD5E1",
                    borderBottom: "2px solid #E2E8F0",
                  }}
                >
                  Cliente Comprador
                </th>

                {/* Dynamic Period Columns */}
                {columns.map((col) => (
                  <th
                    key={col.key}
                    style={{
                      padding: "0.75rem 0.65rem",
                      minWidth: "110px",
                      textAlign: "center",
                      fontWeight: 800,
                      color: "var(--devio-blue-dark)",
                      borderRight: "1px solid #E2E8F0",
                      borderBottom: "2px solid #E2E8F0",
                      whiteSpace: "nowrap",
                    }}
                  >
                    <div style={{ fontSize: "0.75rem", letterSpacing: "0.02em" }}>{col.title}</div>
                    <div style={{ fontSize: "0.68rem", color: "var(--devio-neutral-3)", fontWeight: 600 }}>
                      {col.subtitle}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>

            {/* Table Body */}
            <tbody>
              {filteredRows.length === 0 ? (
                <tr>
                  <td
                    colSpan={columns.length + 2}
                    style={{ textAlign: "center", padding: "3rem", color: "var(--devio-neutral-3)" }}
                  >
                    No se encontraron unidades o cuotas con los filtros seleccionados.
                  </td>
                </tr>
              ) : (
                filteredRows.map((r, rowIdx) => {
                  return (
                    <tr
                      key={r.unit || rowIdx}
                      style={{
                        borderBottom: "1px solid #E2E8F0",
                        backgroundColor: rowIdx % 2 === 0 ? "#FFFFFF" : "#FAFBFD",
                      }}
                    >
                      {/* Left Unit Column */}
                      <td
                        style={{
                          position: "sticky",
                          left: 0,
                          zIndex: 10,
                          backgroundColor: rowIdx % 2 === 0 ? "#FFFFFF" : "#FAFBFD",
                          padding: "0.55rem 0.5rem",
                          textAlign: "center",
                          fontWeight: 800,
                          color: "var(--devio-blue-dark)",
                          borderRight: "1.5px solid #E2E8F0",
                          borderBottom: "1px solid #E2E8F0",
                        }}
                      >
                        <span
                          style={{
                            display: "inline-block",
                            padding: "0.15rem 0.45rem",
                            borderRadius: "6px",
                            backgroundColor: "rgba(31, 54, 82, 0.08)",
                            fontSize: "0.78rem",
                            fontWeight: 800,
                          }}
                        >
                          {r.unit}
                        </span>
                      </td>

                      {/* Left Client Column */}
                      <td
                        style={{
                          position: "sticky",
                          left: 70,
                          zIndex: 10,
                          backgroundColor: rowIdx % 2 === 0 ? "#FFFFFF" : "#FAFBFD",
                          padding: "0.55rem 0.85rem",
                          textAlign: "left",
                          borderRight: "2px solid #CBD5E1",
                          borderBottom: "1px solid #E2E8F0",
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          maxWidth: "180px",
                        }}
                        title={`${r.clientName} (Folio: ${r.saleFolio || "-"})`}
                      >
                        <span style={{ fontWeight: 700, color: "var(--devio-blue-dark)" }}>
                          {r.clientName}
                        </span>
                        {r.saleFolio && (
                          <span
                            style={{
                              display: "block",
                              fontSize: "0.68rem",
                              color: "var(--devio-neutral-3)",
                              fontWeight: 500,
                            }}
                          >
                            {r.saleFolio}
                          </span>
                        )}
                      </td>

                      {/* Period Cells with Dynamic Background Colors */}
                      {columns.map((col) => {
                        const cell = r.cells[col.key];
                        if (!cell || cell.status === "NO_OBLIGATION") {
                          return (
                            <td
                              key={col.key}
                              style={{
                                padding: "0.55rem 0.65rem",
                                textAlign: "center",
                                color: "#CBD5E1",
                                borderRight: "1px solid #F1F5F9",
                                borderBottom: "1px solid #E2E8F0",
                              }}
                            >
                              -
                            </td>
                          );
                        }

                        // Status Color Mapping (Exact screenshot styling)
                        let bg = "#F8FAFC";
                        let textColor = "#64748B";
                        let displayText = "";

                        if (cell.status === "PAID") {
                          // Green
                          bg = "#D1FAE5";
                          textColor = "#065F46";
                          displayText = cell.paidAmount.toLocaleString("es-MX", {
                            minimumFractionDigits: 0,
                            maximumFractionDigits: 2,
                          });
                        } else if (cell.status === "OVERDUE") {
                          // Red / Salmon
                          bg = "#FEE2E2";
                          textColor = "#991B1B";
                          displayText = `-${cell.pendingAmount.toLocaleString("es-MX", {
                            minimumFractionDigits: 0,
                            maximumFractionDigits: 2,
                          })}`;
                        } else if (cell.status === "PARTIAL") {
                          // Amber / Yellow
                          bg = "#FEF3C7";
                          textColor = "#92400E";
                          displayText = `-${cell.pendingAmount.toLocaleString("es-MX", {
                            minimumFractionDigits: 0,
                            maximumFractionDigits: 2,
                          })}`;
                        } else {
                          // Upcoming / Gray
                          bg = "#F1F5F9";
                          textColor = "#64748B";
                          displayText = cell.scheduledAmount.toLocaleString("es-MX", {
                            minimumFractionDigits: 0,
                            maximumFractionDigits: 2,
                          });
                        }

                        return (
                          <td
                            key={col.key}
                            onClick={() => setSelectedCellBreakdown({ row: r, cell })}
                            style={{
                              padding: "0.55rem 0.65rem",
                              backgroundColor: bg,
                              color: textColor,
                              fontWeight: 700,
                              textAlign: "right",
                              borderRight: "1px solid rgba(0,0,0,0.04)",
                              borderBottom: "1px solid #E2E8F0",
                              cursor: "pointer",
                              transition: "transform 0.1s ease, filter 0.1s ease",
                            }}
                            title={`Hacer clic para ver desglose de pago (${r.unit} - ${col.title})`}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.filter = "brightness(0.95)";
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.filter = "none";
                            }}
                          >
                            <span style={{ fontSize: "0.78rem" }}>{displayText}</span>
                          </td>
                        );
                      })}
                    </tr>
                  );
                })
              )}
            </tbody>

            {/* Sticky Totals Footer */}
            <tfoot>
              <tr
                style={{
                  backgroundColor: "#F8FAFC",
                  fontWeight: 800,
                  borderTop: "2px solid #CBD5E1",
                  position: "sticky",
                  bottom: 0,
                  zIndex: 20,
                }}
              >
                <td
                  style={{
                    position: "sticky",
                    left: 0,
                    zIndex: 25,
                    backgroundColor: "#F8FAFC",
                    padding: "0.75rem 0.5rem",
                    textAlign: "center",
                    borderRight: "1.5px solid #E2E8F0",
                    color: "var(--devio-blue-dark)",
                  }}
                >
                  Σ
                </td>
                <td
                  style={{
                    position: "sticky",
                    left: 70,
                    zIndex: 25,
                    backgroundColor: "#F8FAFC",
                    padding: "0.75rem 0.85rem",
                    textAlign: "left",
                    borderRight: "2px solid #CBD5E1",
                    color: "var(--devio-blue-dark)",
                  }}
                >
                  TOTAL GENERAL
                </td>

                {columns.map((col) => {
                  const tot = columnTotals[col.key];
                  const hasValues = tot && (tot.scheduled > 0 || tot.paid > 0);
                  return (
                    <td
                      key={col.key}
                      style={{
                        padding: "0.75rem 0.65rem",
                        textAlign: "right",
                        borderRight: "1px solid #E2E8F0",
                        color: "var(--devio-blue-dark)",
                      }}
                    >
                      {hasValues ? (
                        <div>
                          <div style={{ fontSize: "0.78rem", color: "#059669" }}>
                            +{formatMoney(tot.paid)}
                          </div>
                          {tot.overdue > 0 && (
                            <div style={{ fontSize: "0.7rem", color: "#DC2626" }}>
                              -{formatMoney(tot.overdue)}
                            </div>
                          )}
                        </div>
                      ) : (
                        <span style={{ color: "#94A3B8" }}>-</span>
                      )}
                    </td>
                  );
                })}
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* 4. MODAL DESGLOSE DE PAGO / CUOTA (Al hacer clic en una celda) */}
      {selectedCellBreakdown && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(10, 25, 47, 0.75)",
            backdropFilter: "blur(6px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
            padding: "1rem",
          }}
        >
          <div
            style={{
              backgroundColor: "#FFFFFF",
              borderRadius: "1.25rem",
              width: "100%",
              maxWidth: "580px",
              maxHeight: "90vh",
              display: "flex",
              flexDirection: "column",
              boxShadow: "0 25px 70px rgba(0, 0, 0, 0.35)",
              border: "1px solid var(--devio-neutral-1)",
              overflow: "hidden",
              animation: "fadeIn 0.2s ease-out",
            }}
          >
            {/* Header */}
            <div
              style={{
                padding: "1.25rem 1.75rem",
                borderBottom: "1px solid #E2E8F0",
                backgroundColor: "#FAFBFD",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <span
                    style={{
                      padding: "0.2rem 0.55rem",
                      borderRadius: "6px",
                      backgroundColor: "var(--devio-blue-dark)",
                      color: "#FFFFFF",
                      fontSize: "0.75rem",
                      fontWeight: 800,
                    }}
                  >
                    Unidad {selectedCellBreakdown.row.unit}
                  </span>
                  <h3
                    style={{
                      fontSize: "1.15rem",
                      fontWeight: 800,
                      color: "var(--devio-blue-dark)",
                      margin: 0,
                    }}
                  >
                    {selectedCellBreakdown.row.clientName}
                  </h3>
                </div>
                <p style={{ fontSize: "0.78rem", color: "var(--devio-neutral-3)", margin: "3px 0 0 0" }}>
                  Periodo: <strong>{selectedCellBreakdown.cell.periodLabel}</strong> • Folio:{" "}
                  {selectedCellBreakdown.row.saleFolio || "-"}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setSelectedCellBreakdown(null)}
                style={{
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  color: "var(--devio-neutral-3)",
                  padding: "0.4rem",
                  borderRadius: "50%",
                }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Content */}
            <div style={{ padding: "1.5rem 1.75rem", overflowY: "auto", display: "flex", flexDirection: "column", gap: "1.25rem" }}>
              {/* Status Banner */}
              <div
                style={{
                  padding: "0.85rem 1.1rem",
                  borderRadius: "0.75rem",
                  backgroundColor:
                    selectedCellBreakdown.cell.status === "PAID"
                      ? "#D1FAE5"
                      : selectedCellBreakdown.cell.status === "OVERDUE"
                      ? "#FEE2E2"
                      : selectedCellBreakdown.cell.status === "PARTIAL"
                      ? "#FEF3C7"
                      : "#F1F5F9",
                  color:
                    selectedCellBreakdown.cell.status === "PAID"
                      ? "#065F46"
                      : selectedCellBreakdown.cell.status === "OVERDUE"
                      ? "#991B1B"
                      : selectedCellBreakdown.cell.status === "PARTIAL"
                      ? "#92400E"
                      : "#475569",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  {selectedCellBreakdown.cell.status === "PAID" ? (
                    <CheckCircle2 size={18} />
                  ) : selectedCellBreakdown.cell.status === "OVERDUE" ? (
                    <AlertTriangle size={18} />
                  ) : (
                    <Clock size={18} />
                  )}
                  <div>
                    <strong style={{ fontSize: "0.88rem", display: "block" }}>
                      {selectedCellBreakdown.cell.status === "PAID"
                        ? "Cuota Liquidada al 100%"
                        : selectedCellBreakdown.cell.status === "OVERDUE"
                        ? `Cuota Vencida (${selectedCellBreakdown.cell.daysOverdue} días de mora)`
                        : selectedCellBreakdown.cell.status === "PARTIAL"
                        ? "Pago Parcial Registrado"
                        : "Cuota Programada por Vencer"}
                    </strong>
                    {selectedCellBreakdown.cell.oldestDueDate && (
                      <span style={{ fontSize: "0.75rem" }}>
                        Fecha límite:{" "}
                        {selectedCellBreakdown.cell.oldestDueDate.toLocaleDateString("es-MX", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
                      </span>
                    )}
                  </div>
                </div>

                <span
                  style={{
                    fontSize: "0.75rem",
                    fontWeight: 800,
                    textTransform: "uppercase",
                    padding: "0.2rem 0.5rem",
                    borderRadius: "4px",
                    backgroundColor: "rgba(255,255,255,0.6)",
                  }}
                >
                  {selectedCellBreakdown.cell.status}
                </span>
              </div>

              {/* Amount Breakdown Stats */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(3, 1fr)",
                  gap: "0.75rem",
                  padding: "0.85rem 1rem",
                  borderRadius: "0.75rem",
                  backgroundColor: "#FAFBFD",
                  border: "1px solid #E2E8F0",
                }}
              >
                <div>
                  <span style={{ fontSize: "0.72rem", color: "var(--devio-neutral-3)", display: "block" }}>
                    Monto Programado
                  </span>
                  <strong style={{ fontSize: "1.05rem", color: "var(--devio-blue-dark)" }}>
                    {formatMoney(selectedCellBreakdown.cell.scheduledAmount)}
                  </strong>
                </div>

                <div>
                  <span style={{ fontSize: "0.72rem", color: "#059669", display: "block", fontWeight: 600 }}>
                    Monto Pagado
                  </span>
                  <strong style={{ fontSize: "1.05rem", color: "#059669" }}>
                    {formatMoney(selectedCellBreakdown.cell.paidAmount)}
                  </strong>
                </div>

                <div>
                  <span style={{ fontSize: "0.72rem", color: "#DC2626", display: "block", fontWeight: 600 }}>
                    Saldo Pendiente
                  </span>
                  <strong style={{ fontSize: "1.05rem", color: "#DC2626" }}>
                    {formatMoney(selectedCellBreakdown.cell.pendingAmount)}
                  </strong>
                </div>
              </div>

              {/* Moratory Interest Calculation (If Overdue) */}
              {selectedCellBreakdown.cell.status === "OVERDUE" && (
                <div
                  style={{
                    padding: "0.85rem 1rem",
                    borderRadius: "0.75rem",
                    backgroundColor: "#FFF1F2",
                    border: "1px solid #FECDD3",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", marginBottom: "0.4rem" }}>
                    <ShieldAlert size={16} color="#E11D48" />
                    <strong style={{ fontSize: "0.82rem", color: "#9F1239" }}>
                      Intereses Moratorios Generados
                    </strong>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.78rem", color: "#4C0519" }}>
                    <span>Días de retraso: <strong>{selectedCellBreakdown.cell.daysOverdue} días</strong></span>
                    <span>Tasa mensual: <strong>3.0%</strong></span>
                    <span>Interés generado: <strong style={{ color: "#BE123C" }}>+{formatMoney(selectedCellBreakdown.cell.moratoryInterest)}</strong></span>
                  </div>
                  <div style={{ marginTop: "0.5rem", paddingTop: "0.5rem", borderTop: "1px dashed #FECDD3", display: "flex", justifyContent: "space-between", fontWeight: 800, fontSize: "0.85rem", color: "#9F1239" }}>
                    <span>Total Exigible con Moratorios:</span>
                    <span>{formatMoney(selectedCellBreakdown.cell.pendingAmount + selectedCellBreakdown.cell.moratoryInterest)}</span>
                  </div>
                </div>
              )}

              {/* Obligations / Installments in this period */}
              <div>
                <h4 style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--devio-blue-dark)", margin: "0 0 0.5rem 0" }}>
                  Cuotas Programadas en este Periodo ({selectedCellBreakdown.cell.obligations.length})
                </h4>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                  {selectedCellBreakdown.cell.obligations.map((ob: any, idx: number) => {
                    const obPend =
                      ob.pendingAmount !== undefined
                        ? Number(ob.pendingAmount)
                        : Math.max(0, (Number(ob.scheduledAmount) || 0) - (Number(ob.paidAmount) || 0));
                    return (
                      <div
                        key={ob.id || idx}
                        style={{
                          padding: "0.6rem 0.85rem",
                          borderRadius: "0.5rem",
                          backgroundColor: "#F8FAFC",
                          border: "1px solid #E2E8F0",
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          fontSize: "0.8rem",
                        }}
                      >
                        <div>
                          <strong style={{ color: "var(--devio-blue-dark)", display: "block" }}>
                            {ob.concept || `Cuota ${idx + 1}`}
                          </strong>
                          <span style={{ fontSize: "0.72rem", color: "var(--devio-neutral-3)" }}>
                            Vence: {ob.scheduledDate}
                          </span>
                        </div>
                        <div style={{ textAlign: "right" }}>
                          <strong style={{ display: "block", color: "var(--devio-blue-dark)" }}>
                            {formatMoney(Number(ob.scheduledAmount || ob.amount) || 0)}
                          </strong>
                          <span
                            style={{
                              fontSize: "0.72rem",
                              color: obPend === 0 ? "#059669" : "#DC2626",
                              fontWeight: 600,
                            }}
                          >
                            {obPend === 0 ? "Pagado" : `Pendiente: ${formatMoney(obPend)}`}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Receipts applied */}
              {selectedCellBreakdown.cell.receipts.length > 0 && (
                <div>
                  <h4 style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--devio-blue-dark)", margin: "0 0 0.5rem 0" }}>
                    Abonos / Recibos Registrados ({selectedCellBreakdown.cell.receipts.length})
                  </h4>
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                    {selectedCellBreakdown.cell.receipts.map((rec: any, idx: number) => (
                      <div
                        key={rec.id || idx}
                        style={{
                          padding: "0.55rem 0.85rem",
                          borderRadius: "0.5rem",
                          backgroundColor: "#F0FDF4",
                          border: "1px solid #BBF7D0",
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          fontSize: "0.8rem",
                        }}
                      >
                        <div>
                          <strong style={{ color: "#166534", display: "block" }}>
                            {rec.reciboFolio || `REC-${idx + 1}`} • {rec.metodoPago || "Transferencia SPEI"}
                          </strong>
                          <span style={{ fontSize: "0.72rem", color: "#15803D" }}>
                            Fecha: {rec.fechaPago || "-"}
                          </span>
                        </div>
                        <strong style={{ color: "#15803D" }}>+{formatMoney(Number(rec.monto) || 0)}</strong>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Footer Action Buttons */}
            <div
              style={{
                padding: "1rem 1.75rem",
                borderTop: "1px solid #E2E8F0",
                backgroundColor: "#FAFBFD",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: "0.75rem",
                flexWrap: "wrap",
              }}
            >
              <div style={{ display: "flex", gap: "0.5rem" }}>
                {selectedCellBreakdown.cell.status === "OVERDUE" && onSendOverdueNotice && (
                  <button
                    type="button"
                    onClick={() => {
                      const firstOb = selectedCellBreakdown.cell.obligations[0];
                      if (firstOb) {
                        onSendOverdueNotice({
                          id: firstOb.id,
                          clientName: selectedCellBreakdown.row.clientName,
                          clientEmail: selectedCellBreakdown.row.clientEmail,
                          unit: selectedCellBreakdown.row.unit,
                          paymentPlan: selectedCellBreakdown.row.saleRecord.paymentPlan || "Plan de Pago",
                          scheduledDate: firstOb.scheduledDate,
                          scheduledAmount: firstOb.scheduledAmount,
                          paidAmount: firstOb.paidAmount,
                          paymentDate: firstOb.paymentDate,
                          paymentMethod: (firstOb.paymentMethod as any) || "Transferencia",
                          status: "ATRASADO",
                        });
                      }
                    }}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "0.35rem",
                      padding: "0.5rem 0.9rem",
                      borderRadius: "9999px",
                      backgroundColor: "#FEE2E2",
                      color: "#991B1B",
                      border: "1px solid #FECDD3",
                      fontSize: "0.78rem",
                      fontWeight: 700,
                      cursor: "pointer",
                    }}
                  >
                    <Mail size={13} /> Enviar Aviso de Mora
                  </button>
                )}

                {selectedCellBreakdown.cell.status === "UPCOMING" && onSendReminder && (
                  <button
                    type="button"
                    onClick={() => {
                      const firstOb = selectedCellBreakdown.cell.obligations[0];
                      if (firstOb) {
                        onSendReminder({
                          id: firstOb.id,
                          clientName: selectedCellBreakdown.row.clientName,
                          clientEmail: selectedCellBreakdown.row.clientEmail,
                          unit: selectedCellBreakdown.row.unit,
                          paymentPlan: selectedCellBreakdown.row.saleRecord.paymentPlan || "Plan de Pago",
                          scheduledDate: firstOb.scheduledDate,
                          scheduledAmount: firstOb.scheduledAmount,
                          paidAmount: firstOb.paidAmount,
                          paymentDate: firstOb.paymentDate,
                          paymentMethod: (firstOb.paymentMethod as any) || "Transferencia",
                          status: "PENDIENTE",
                        });
                      }
                    }}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "0.35rem",
                      padding: "0.5rem 0.9rem",
                      borderRadius: "9999px",
                      backgroundColor: "#F1F5F9",
                      color: "var(--devio-blue-dark)",
                      border: "1px solid #E2E8F0",
                      fontSize: "0.78rem",
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    <Mail size={13} /> Recordatorio
                  </button>
                )}
              </div>

              <div style={{ display: "flex", gap: "0.5rem" }}>
                <button
                  type="button"
                  onClick={() => setSelectedCellBreakdown(null)}
                  style={{
                    padding: "0.55rem 1.2rem",
                    borderRadius: "9999px",
                    border: "1px solid #CBD5E1",
                    backgroundColor: "transparent",
                    color: "var(--devio-neutral-4)",
                    fontSize: "0.82rem",
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  Cerrar
                </button>

                {selectedCellBreakdown.cell.pendingAmount > 0 && onRecordPayment && (
                  <button
                    type="button"
                    onClick={() => {
                      const firstOb = selectedCellBreakdown.cell.obligations[0] || ({} as any);
                      onRecordPayment({
                        id: firstOb.id || `pay-${selectedCellBreakdown.row.unit}-${Date.now()}`,
                        clientName: selectedCellBreakdown.row.clientName,
                        clientEmail: selectedCellBreakdown.row.clientEmail,
                        unit: selectedCellBreakdown.row.unit,
                        paymentPlan: selectedCellBreakdown.row.saleRecord.paymentPlan || "Plan de Pago",
                        scheduledDate: firstOb.scheduledDate || selectedCellBreakdown.cell.periodLabel,
                        scheduledAmount: selectedCellBreakdown.cell.scheduledAmount,
                        paidAmount: selectedCellBreakdown.cell.paidAmount,
                        paymentDate: todayIso,
                        paymentMethod: "Transferencia",
                        status: selectedCellBreakdown.cell.status === "OVERDUE" ? "ATRASADO" : "PENDIENTE",
                      });
                      setSelectedCellBreakdown(null);
                    }}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "0.4rem",
                      padding: "0.55rem 1.4rem",
                      borderRadius: "9999px",
                      backgroundColor: "var(--devio-blue)",
                      color: "#FFFFFF",
                      fontSize: "0.82rem",
                      fontWeight: 700,
                      border: "none",
                      cursor: "pointer",
                    }}
                  >
                    <DollarSign size={15} /> Registrar Pago / Abono
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
