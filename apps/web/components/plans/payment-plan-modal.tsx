"use client";

import React, { useState, useEffect, useMemo } from "react";
import { X, Save, AlertCircle, Sparkles, Check, Layers, DollarSign } from "lucide-react";

export interface PaymentPlanFormData {
  id: string;
  name: string;
  paymentType: "ESQUEMA" | "CONTADO";
  downPaymentPercentage: number;
  installmentsCount: number;
  periodicity: string;
  settlementPercentage: number;
  interestPercentage: number;
  discountPercentage: number;
  internalNotes: string;
  isActive?: boolean;
}

export interface PaymentPlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (plan: any) => void;
  initialPlan?: any | null;
  title?: string;
}

export default function PaymentPlanModal({
  isOpen,
  onClose,
  onSave,
  initialPlan,
  title,
}: PaymentPlanModalProps) {
  const [formData, setFormData] = useState<PaymentPlanFormData>({
    id: "",
    name: "",
    paymentType: "ESQUEMA",
    downPaymentPercentage: 20,
    installmentsCount: 12,
    periodicity: "Mensual",
    settlementPercentage: 60,
    interestPercentage: 0,
    discountPercentage: 0,
    internalNotes: "",
    isActive: true,
  });

  // Sync state whenever initialPlan changes or modal opens
  useEffect(() => {
    if (isOpen) {
      if (initialPlan) {
        const isContado =
          initialPlan.paymentType === "CONTADO" ||
          (initialPlan.installmentsCount === 0 && (initialPlan.downPaymentPercentage === 100 || initialPlan.downPaymentPct === 100));

        setFormData({
          id: initialPlan.id || `pp-${Date.now()}`,
          name: initialPlan.name || "",
          paymentType: isContado ? "CONTADO" : "ESQUEMA",
          downPaymentPercentage: isContado
            ? 100
            : initialPlan.downPaymentPercentage ?? initialPlan.downPaymentPct ?? 20,
          installmentsCount: isContado
            ? 0
            : initialPlan.installmentsCount ?? 12,
          periodicity: initialPlan.periodicity || "Mensual",
          settlementPercentage: isContado
            ? 0
            : initialPlan.settlementPercentage ?? initialPlan.balloonLiquidationPct ?? 20,
          interestPercentage:
            initialPlan.interestPercentage ?? initialPlan.moratoryRatePct ?? 0,
          discountPercentage:
            initialPlan.discountPercentage ?? initialPlan.discountPct ?? 0,
          internalNotes: initialPlan.internalNotes || initialPlan.description || "",
          isActive: initialPlan.isActive !== false,
        });
      } else {
        setFormData({
          id: `pp-${Date.now()}`,
          name: "",
          paymentType: "ESQUEMA",
          downPaymentPercentage: 20,
          installmentsCount: 12,
          periodicity: "Mensual",
          settlementPercentage: 60,
          interestPercentage: 0,
          discountPercentage: 0,
          internalNotes: "",
          isActive: true,
        });
      }
    }
  }, [isOpen, initialPlan]);

  // Validation calculations and 1-click fixes
  const planValidation = useMemo(() => {
    if (formData.paymentType === "CONTADO") {
      if (!formData.name.trim()) {
        return {
          isValid: false,
          errorTitle: "Nombre requerido",
          errorMessage: "Ingresa un nombre para identificar este plan de pago de contado.",
          fixes: [] as { label: string; action: () => void }[],
          downPct: 100,
          installmentsPct: 0,
          settlementPct: 0,
          totalPct: 100,
        };
      }
      return {
        isValid: true,
        errorTitle: null,
        errorMessage: null,
        fixes: [] as { label: string; action: () => void }[],
        downPct: 100,
        installmentsPct: 0,
        settlementPct: 0,
        totalPct: 100,
      };
    }

    const down = Number(formData.downPaymentPercentage) || 0;
    const settlement = Number(formData.settlementPercentage) || 0;
    const plazos = Number(formData.installmentsCount) || 0;
    const sumDownSettlement = down + settlement;
    const remainingPct = 100 - sumDownSettlement;
    const installmentsPct = plazos > 0 ? Math.max(0, remainingPct) : 0;
    const totalPct = down + installmentsPct + settlement;

    if (!formData.name.trim()) {
      return {
        isValid: false,
        errorTitle: "Nombre requerido",
        errorMessage: "Ingresa un nombre para identificar este plan de pago.",
        fixes: [] as { label: string; action: () => void }[],
        downPct: down,
        installmentsPct,
        settlementPct: settlement,
        totalPct,
      };
    }

    if (down <= 0) {
      return {
        isValid: false,
        errorTitle: "Enganche requerido",
        errorMessage:
          "El enganche debe ser mayor a 0% para un esquema de pagos. Si es liquidación total en una sola exhibición, selecciona 'Pago de contado'.",
        fixes: [
          {
            label: "Asignar 20% de Enganche",
            action: () =>
              setFormData((prev) => ({
                ...prev,
                downPaymentPercentage: 20,
                settlementPercentage: Math.min(prev.settlementPercentage, 80),
              })),
          },
          {
            label: "Cambiar a Pago de Contado (100%)",
            action: () =>
              setFormData((prev) => ({
                ...prev,
                paymentType: "CONTADO",
                downPaymentPercentage: 100,
                settlementPercentage: 0,
                installmentsCount: 0,
              })),
          },
        ],
        downPct: down,
        installmentsPct,
        settlementPct: settlement,
        totalPct,
      };
    }

    if (sumDownSettlement > 100) {
      const excess = sumDownSettlement - 100;
      return {
        isValid: false,
        errorTitle: "Porcentajes excedidos (>100%)",
        errorMessage: `El Enganche (${down}%) y la Liquidación (${settlement}%) suman ${sumDownSettlement}%, excediendo el 100% total por ${excess}%. Las parcialidades quedarían en porcentaje negativo.`,
        fixes: [
          {
            label: `Ajustar Liquidación a ${Math.max(0, 100 - down)}%`,
            action: () =>
              setFormData((prev) => ({
                ...prev,
                settlementPercentage: Math.max(0, 100 - down),
              })),
          },
          {
            label: `Ajustar Enganche a ${Math.max(0, 100 - settlement)}%`,
            action: () =>
              setFormData((prev) => ({
                ...prev,
                downPaymentPercentage: Math.max(0, 100 - settlement),
              })),
          },
        ],
        downPct: down,
        installmentsPct: 0,
        settlementPct: settlement,
        totalPct: sumDownSettlement,
      };
    }

    if (sumDownSettlement === 100 && plazos > 0) {
      return {
        isValid: false,
        errorTitle: "Plazos sin porcentaje asignado (0%)",
        errorMessage: `Definiste ${plazos} plazos, pero el Enganche (${down}%) y la Liquidación (${settlement}%) ya suman el 100%. No queda porcentaje para las parcialidades (quedarían en 0%).`,
        fixes: [
          {
            label: `Dejar 40% en ${plazos} mensualidades (Liquidación ${Math.max(0, 100 - down - 40)}%)`,
            action: () =>
              setFormData((prev) => ({
                ...prev,
                settlementPercentage: Math.max(0, 100 - down - 40),
              })),
          },
          {
            label: "Cambiar Plazos a 0 (Solo Enganche y Liquidación)",
            action: () =>
              setFormData((prev) => ({
                ...prev,
                installmentsCount: 0,
              })),
          },
        ],
        downPct: down,
        installmentsPct: 0,
        settlementPct: settlement,
        totalPct: 100,
      };
    }

    if (sumDownSettlement < 100 && plazos === 0) {
      return {
        isValid: false,
        errorTitle: "Porcentaje flotante sin plazos",
        errorMessage: `Queda un ${remainingPct}% pendiente de asignar porque el número de plazos es 0. Debes asignar mensualidades o sumar el ${remainingPct}% a la liquidación.`,
        fixes: [
          {
            label: `Sumar ${remainingPct}% a la Liquidación (Total: ${settlement + remainingPct}%)`,
            action: () =>
              setFormData((prev) => ({
                ...prev,
                settlementPercentage: 100 - down,
              })),
          },
          {
            label: `Asignar 12 plazos para cubrir el ${remainingPct}% (${(remainingPct / 12).toFixed(1)}% c/u)`,
            action: () =>
              setFormData((prev) => ({
                ...prev,
                installmentsCount: 12,
              })),
          },
        ],
        downPct: down,
        installmentsPct: 0,
        settlementPct: settlement,
        totalPct: sumDownSettlement,
      };
    }

    return {
      isValid: true,
      errorTitle: null,
      errorMessage: null,
      fixes: [] as { label: string; action: () => void }[],
      downPct: down,
      installmentsPct,
      settlementPct: settlement,
      totalPct: 100,
    };
  }, [formData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!planValidation.isValid) return;
    if (!formData.name.trim()) return;

    const isContado = formData.paymentType === "CONTADO";

    const downPct = isContado ? 100 : Number(formData.downPaymentPercentage) || 0;
    const installments = isContado ? 0 : Number(formData.installmentsCount) || 0;
    const settlementPct = isContado ? 0 : Number(formData.settlementPercentage) || 0;
    const monthlyPct = Math.max(0, 100 - downPct - settlementPct);
    const periodicity = isContado ? "Pago único" : formData.periodicity || "Mensual";
    const discount = Number(formData.discountPercentage) || 0;
    const interest = isContado ? 0 : Number(formData.interestPercentage) || 0;

    const description =
      formData.internalNotes.trim() ||
      (isContado
        ? "Pago de contado (100% en una sola exhibición)"
        : `${downPct}% Enganche, ${installments} ${periodicity}es (${monthlyPct}%), ${settlementPct}% Liquidación`);

    const finalPlan = {
      id: formData.id || `pp-${Date.now()}`,
      name: formData.name.trim(),
      paymentType: formData.paymentType,
      // Compatibility fields for both formats
      downPaymentPercentage: downPct,
      downPaymentPct: downPct,
      installmentsCount: installments,
      periodicity,
      settlementPercentage: settlementPct,
      balloonLiquidationPct: settlementPct,
      discountPercentage: discount,
      discountPct: discount,
      interestPercentage: interest,
      moratoryRatePct: interest || 3.0,
      internalNotes: formData.internalNotes.trim(),
      description,
      isActive: formData.isActive !== false,
    };

    onSave(finalPlan);
    onClose();
  };

  if (!isOpen) return null;

  const isPlanSumValid = planValidation.isValid;
  const installmentsTotalPercentage = planValidation.installmentsPct;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(22, 43, 63, 0.65)",
        backdropFilter: "blur(4px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 10000,
        padding: "1rem",
      }}
    >
      <div
        style={{
          backgroundColor: "#FFFFFF",
          borderRadius: "1.25rem",
          width: "100%",
          maxWidth: "680px",
          maxHeight: "92vh",
          overflowY: "auto",
          padding: "2rem",
          boxShadow: "0 20px 60px rgba(0, 0, 0, 0.25)",
        }}
      >
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.25rem" }}>
          <div>
            <h2 style={{ fontSize: "1.4rem", fontWeight: 800, color: "#1F3652", margin: 0 }}>
              {title || (initialPlan?.id ? "Editar Plan de Pago" : "Nuevo Plan de Pago")}
            </h2>
            <p style={{ fontSize: "0.82rem", color: "#64748B", marginTop: "0.25rem", margin: 0 }}>
              Define los porcentajes de enganche, mensualidades y condiciones de liquidación.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: "#F1F5F9",
              border: "none",
              cursor: "pointer",
              color: "#64748B",
              width: "32px",
              height: "32px",
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Nombre del Plan */}
          <div style={{ marginBottom: "1.25rem" }}>
            <label style={{ fontSize: "0.82rem", fontWeight: 700, color: "#1F3652", display: "block", marginBottom: "0.35rem" }}>
              Nombre del Plan *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Ej. Plan Tradicional 20/80 o Plan Preventa"
              required
              style={{
                width: "100%",
                padding: "0.65rem 0.85rem",
                borderRadius: "0.5rem",
                border: "1px solid #CBD5E1",
                fontSize: "0.88rem",
                outline: "none",
              }}
            />
          </div>

          {/* ¿Cómo se pagará este plan? */}
          <div style={{ marginBottom: "1.25rem" }}>
            <label style={{ fontSize: "0.85rem", fontWeight: 700, color: "#1F3652", marginBottom: "0.6rem", display: "block", textAlign: "center" }}>
              ¿Cómo se pagará este plan?
            </label>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
              {/* Opción 1: Esquema de pago */}
              <div
                onClick={() =>
                  setFormData((prev) => ({
                    ...prev,
                    paymentType: "ESQUEMA",
                    downPaymentPercentage: prev.downPaymentPercentage === 100 ? 20 : prev.downPaymentPercentage,
                    installmentsCount: prev.installmentsCount === 0 ? 12 : prev.installmentsCount,
                    settlementPercentage: prev.settlementPercentage === 0 ? 60 : prev.settlementPercentage,
                  }))
                }
                style={{
                  padding: "1rem",
                  borderRadius: "0.75rem",
                  border: formData.paymentType === "ESQUEMA" ? "2px solid #2F80ED" : "1px solid #E2E8F0",
                  backgroundColor: formData.paymentType === "ESQUEMA" ? "rgba(47, 128, 237, 0.04)" : "#FFFFFF",
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.3rem" }}>
                  <div
                    style={{
                      width: "18px",
                      height: "18px",
                      borderRadius: "50%",
                      border: formData.paymentType === "ESQUEMA" ? "5px solid #2F80ED" : "2px solid #CBD5E1",
                      backgroundColor: "#FFFFFF",
                    }}
                  />
                  <strong style={{ fontSize: "0.88rem", color: "#1F3652" }}>Esquema de pago</strong>
                </div>
                <p style={{ fontSize: "0.75rem", color: "#64748B", margin: 0, lineHeight: 1.4 }}>
                  El cliente pagará mediante enganche, parcialidades y liquidación final.
                </p>
              </div>

              {/* Opción 2: Pago de contado */}
              <div
                onClick={() =>
                  setFormData((prev) => ({
                    ...prev,
                    paymentType: "CONTADO",
                    downPaymentPercentage: 100,
                    installmentsCount: 0,
                    settlementPercentage: 0,
                  }))
                }
                style={{
                  padding: "1rem",
                  borderRadius: "0.75rem",
                  border: formData.paymentType === "CONTADO" ? "2px solid #00C48C" : "1px solid #E2E8F0",
                  backgroundColor: formData.paymentType === "CONTADO" ? "rgba(0, 196, 140, 0.04)" : "#FFFFFF",
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.3rem" }}>
                  <div
                    style={{
                      width: "18px",
                      height: "18px",
                      borderRadius: "50%",
                      border: formData.paymentType === "CONTADO" ? "5px solid #00C48C" : "2px solid #CBD5E1",
                      backgroundColor: "#FFFFFF",
                    }}
                  />
                  <strong style={{ fontSize: "0.88rem", color: "#1F3652" }}>Pago de contado</strong>
                </div>
                <p style={{ fontSize: "0.75rem", color: "#64748B", margin: 0, lineHeight: 1.4 }}>
                  El cliente liquidará el 100% del valor en una sola exhibición.
                </p>
              </div>
            </div>
          </div>

          {/* CAMPOS CONDICIONALES: Esquema de Pago */}
          {formData.paymentType === "ESQUEMA" && (
            <>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "0.75rem", marginBottom: "1rem" }}>
                <div>
                  <label style={{ fontSize: "0.78rem", fontWeight: 700, color: "#1F3652", display: "block", marginBottom: "0.3rem" }}>
                    Enganche *
                  </label>
                  <div style={{ position: "relative" }}>
                    <input
                      type="number"
                      min={1}
                      max={99}
                      value={formData.downPaymentPercentage}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          downPaymentPercentage: parseFloat(e.target.value) || 0,
                        })
                      }
                      style={{
                        width: "100%",
                        padding: "0.6rem 1.5rem 0.6rem 0.75rem",
                        borderRadius: "0.5rem",
                        border: "1px solid #CBD5E1",
                        fontSize: "0.88rem",
                        fontWeight: 700,
                      }}
                      required
                    />
                    <span style={{ position: "absolute", right: "8px", top: "50%", transform: "translateY(-50%)", fontSize: "0.75rem", color: "#64748B" }}>
                      %
                    </span>
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: "0.78rem", fontWeight: 700, color: "#1F3652", display: "block", marginBottom: "0.3rem" }}>
                    Plazos
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={72}
                    value={formData.installmentsCount}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        installmentsCount: parseInt(e.target.value) || 0,
                      })
                    }
                    style={{
                      width: "100%",
                      padding: "0.6rem 0.75rem",
                      borderRadius: "0.5rem",
                      border: "1px solid #CBD5E1",
                      fontSize: "0.88rem",
                      fontWeight: 700,
                    }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: "0.78rem", fontWeight: 700, color: "#1F3652", display: "block", marginBottom: "0.3rem" }}>
                    Periodicidad
                  </label>
                  <select
                    value={formData.periodicity}
                    onChange={(e) => setFormData({ ...formData, periodicity: e.target.value })}
                    style={{
                      width: "100%",
                      padding: "0.6rem 0.75rem",
                      borderRadius: "0.5rem",
                      border: "1px solid #CBD5E1",
                      fontSize: "0.82rem",
                      backgroundColor: "#FFFFFF",
                    }}
                  >
                    <option value="Semanal">Semanal</option>
                    <option value="Quincenal">Quincenal</option>
                    <option value="Mensual">Mensual</option>
                    <option value="Bimestral">Bimestral</option>
                    <option value="Trimestral">Trimestral</option>
                    <option value="Semestral">Semestral</option>
                    <option value="Anual">Anual</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: "0.78rem", fontWeight: 700, color: "#1F3652", display: "block", marginBottom: "0.3rem" }}>
                    Liquidación *
                  </label>
                  <div style={{ position: "relative" }}>
                    <input
                      type="number"
                      min={0}
                      max={99}
                      value={formData.settlementPercentage}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          settlementPercentage: parseFloat(e.target.value) || 0,
                        })
                      }
                      style={{
                        width: "100%",
                        padding: "0.6rem 1.5rem 0.6rem 0.75rem",
                        borderRadius: "0.5rem",
                        border: "1px solid #CBD5E1",
                        fontSize: "0.88rem",
                        fontWeight: 700,
                      }}
                      required
                    />
                    <span style={{ position: "absolute", right: "8px", top: "50%", transform: "translateY(-50%)", fontSize: "0.75rem", color: "#64748B" }}>
                      %
                    </span>
                  </div>
                </div>
              </div>

              {/* Barra Visual de Distribución Financiera 100% */}
              <div
                style={{
                  backgroundColor: "#F8FAFC",
                  padding: "0.85rem 1rem",
                  borderRadius: "0.65rem",
                  border: isPlanSumValid ? "1px solid #E2E8F0" : "1px solid #FCA5A5",
                  marginBottom: "1rem",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.78rem", marginBottom: "0.4rem" }}>
                  <span style={{ fontWeight: 600, color: "#1F3652" }}>
                    Distribución: Enganche ({formData.downPaymentPercentage}%) +{" "}
                    {formData.installmentsCount > 0
                      ? `${formData.installmentsCount} ${formData.periodicity}es (${installmentsTotalPercentage}%)`
                      : "Sin parcialidades"}{" "}
                    + Liquidación ({formData.settlementPercentage}%)
                  </span>
                  <strong style={{ color: isPlanSumValid ? "#00C48C" : "#EF4444", display: "flex", alignItems: "center", gap: "0.3rem" }}>
                    {isPlanSumValid
                      ? "✓ Total: 100%"
                      : `⚠ Total: ${formData.downPaymentPercentage + installmentsTotalPercentage + formData.settlementPercentage}%`}
                  </strong>
                </div>
                <div style={{ height: "8px", backgroundColor: "#E2E8F0", borderRadius: "4px", display: "flex", overflow: "hidden" }}>
                  <div
                    style={{
                      width: `${Math.max(0, Math.min(100, formData.downPaymentPercentage))}%`,
                      backgroundColor: "#2F80ED",
                    }}
                    title={`Enganche: ${formData.downPaymentPercentage}%`}
                  />
                  <div
                    style={{
                      width: `${Math.max(0, Math.min(100, installmentsTotalPercentage))}%`,
                      backgroundColor: "#F2C94C",
                    }}
                    title={`Parcialidades: ${installmentsTotalPercentage}%`}
                  />
                  <div
                    style={{
                      width: `${Math.max(0, Math.min(100, formData.settlementPercentage))}%`,
                      backgroundColor: "#00C48C",
                    }}
                    title={`Liquidación: ${formData.settlementPercentage}%`}
                  />
                </div>
                {isPlanSumValid && formData.installmentsCount > 0 && installmentsTotalPercentage > 0 && (
                  <p style={{ margin: "0.35rem 0 0", fontSize: "0.72rem", color: "#64748B" }}>
                    Cada cuota será del {(installmentsTotalPercentage / formData.installmentsCount).toFixed(2)}% del valor total.
                  </p>
                )}
              </div>

              {/* ALERTA DE ERROR Y SUGERENCIAS DE CORRECCIÓN RÁPIDA (1-CLIC) */}
              {!planValidation.isValid && planValidation.errorMessage && (
                <div
                  style={{
                    backgroundColor: "#FEF2F2",
                    border: "1px solid #F87171",
                    borderRadius: "0.65rem",
                    padding: "0.85rem 1rem",
                    marginBottom: "1.2rem",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "flex-start", gap: "0.6rem" }}>
                    <AlertCircle size={18} color="#DC2626" style={{ flexShrink: 0, marginTop: "2px" }} />
                    <div style={{ flex: 1 }}>
                      <h5 style={{ margin: "0 0 0.2rem", fontSize: "0.84rem", fontWeight: 700, color: "#991B1B" }}>
                        {planValidation.errorTitle}
                      </h5>
                      <p style={{ margin: 0, fontSize: "0.78rem", color: "#B91C1C", lineHeight: 1.4 }}>
                        {planValidation.errorMessage}
                      </p>

                      {planValidation.fixes.length > 0 && (
                        <div style={{ marginTop: "0.6rem" }}>
                          <span style={{ fontSize: "0.73rem", fontWeight: 700, color: "#7F1D1D", display: "block", marginBottom: "0.35rem" }}>
                            💡 Sugerencias de corrección rápida (1-clic):
                          </span>
                          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem" }}>
                            {planValidation.fixes.map((fix, idx) => (
                              <button
                                key={idx}
                                type="button"
                                onClick={fix.action}
                                style={{
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: "0.35rem",
                                  backgroundColor: "#FFFFFF",
                                  border: "1px solid #FCA5A5",
                                  color: "#991B1B",
                                  borderRadius: "6px",
                                  padding: "0.35rem 0.65rem",
                                  fontSize: "0.74rem",
                                  fontWeight: 600,
                                  cursor: "pointer",
                                  boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
                                }}
                              >
                                <Sparkles size={13} color="#DC2626" />
                                {fix.label}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Interés moratorio y Descuento */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.85rem", marginBottom: "1rem" }}>
                <div>
                  <label style={{ fontSize: "0.78rem", fontWeight: 700, color: "#1F3652", display: "block", marginBottom: "0.3rem" }}>
                    % Interés Moratorio Mensual
                  </label>
                  <div style={{ position: "relative" }}>
                    <input
                      type="number"
                      step="0.1"
                      min={0}
                      max={50}
                      value={formData.interestPercentage}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          interestPercentage: parseFloat(e.target.value) || 0,
                        })
                      }
                      style={{
                        width: "100%",
                        padding: "0.6rem 1.5rem 0.6rem 0.75rem",
                        borderRadius: "0.5rem",
                        border: "1px solid #CBD5E1",
                        fontSize: "0.88rem",
                      }}
                    />
                    <span style={{ position: "absolute", right: "8px", top: "50%", transform: "translateY(-50%)", fontSize: "0.75rem", color: "#64748B" }}>
                      %
                    </span>
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: "0.78rem", fontWeight: 700, color: "#1F3652", display: "block", marginBottom: "0.3rem" }}>
                    % Descuento por Defecto
                  </label>
                  <div style={{ position: "relative" }}>
                    <input
                      type="number"
                      min={0}
                      max={50}
                      value={formData.discountPercentage}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          discountPercentage: parseFloat(e.target.value) || 0,
                        })
                      }
                      style={{
                        width: "100%",
                        padding: "0.6rem 1.5rem 0.6rem 0.75rem",
                        borderRadius: "0.5rem",
                        border: "1px solid #CBD5E1",
                        fontSize: "0.88rem",
                      }}
                    />
                    <span style={{ position: "absolute", right: "8px", top: "50%", transform: "translateY(-50%)", fontSize: "0.75rem", color: "#64748B" }}>
                      %
                    </span>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* CAMPOS SI ES PAGO DE CONTADO */}
          {formData.paymentType === "CONTADO" && (
            <div style={{ marginBottom: "1rem" }}>
              <label style={{ fontSize: "0.78rem", fontWeight: 700, color: "#1F3652", display: "block", marginBottom: "0.3rem" }}>
                % Descuento por Pago de Contado
              </label>
              <div style={{ position: "relative", maxWidth: "240px" }}>
                <input
                  type="number"
                  min={0}
                  max={50}
                  value={formData.discountPercentage}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      discountPercentage: parseFloat(e.target.value) || 0,
                    })
                  }
                  placeholder="Ej. 10"
                  style={{
                    width: "100%",
                    padding: "0.6rem 1.5rem 0.6rem 0.75rem",
                    borderRadius: "0.5rem",
                    border: "1px solid #CBD5E1",
                    fontSize: "0.88rem",
                    fontWeight: 700,
                  }}
                />
                <span style={{ position: "absolute", right: "8px", top: "50%", transform: "translateY(-50%)", fontSize: "0.75rem", color: "#64748B" }}>
                  %
                </span>
              </div>
              <span style={{ fontSize: "0.75rem", color: "#64748B", display: "block", marginTop: "0.35rem" }}>
                El comprador liquidará el 100% en una sola exhibición aplicando este descuento.
              </span>
            </div>
          )}

          {/* Notas Internas */}
          <div style={{ marginBottom: "1.5rem" }}>
            <label style={{ fontSize: "0.78rem", fontWeight: 700, color: "#1F3652", display: "block", marginBottom: "0.3rem" }}>
              Notas Internas / Condiciones Comerciales
            </label>
            <textarea
              value={formData.internalNotes}
              onChange={(e) => setFormData({ ...formData, internalNotes: e.target.value })}
              placeholder="Detalles sobre restricciones, condiciones o aplicación de este plan..."
              rows={2}
              style={{
                width: "100%",
                padding: "0.6rem 0.85rem",
                borderRadius: "0.5rem",
                border: "1px solid #CBD5E1",
                fontSize: "0.82rem",
                resize: "vertical",
                outline: "none",
              }}
            />
          </div>

          {/* Botones de Acción */}
          <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem" }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: "0.6rem 1.25rem",
                borderRadius: "9999px",
                border: "1px solid #CBD5E1",
                backgroundColor: "#FFFFFF",
                color: "#475569",
                fontSize: "0.82rem",
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={!planValidation.isValid}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.4rem",
                padding: "0.6rem 1.5rem",
                borderRadius: "9999px",
                backgroundColor: planValidation.isValid ? "#1B3047" : "#94A3B8",
                color: "#FFFFFF",
                fontSize: "0.82rem",
                fontWeight: 700,
                border: "none",
                cursor: planValidation.isValid ? "pointer" : "not-allowed",
                opacity: planValidation.isValid ? 1 : 0.6,
                boxShadow: planValidation.isValid ? "0 2px 6px rgba(27, 48, 71, 0.2)" : "none",
              }}
            >
              <Save size={16} /> Guardar Plan de Pago
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
