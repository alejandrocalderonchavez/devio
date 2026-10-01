"use client";

import React, { useState } from "react";
import { X, CheckCircle2, Clock, FileText, Calendar, Building, User, ShieldCheck } from "lucide-react";
import { getMexicoDateISO } from "../../lib/date-utils";
import { DevioDatePicker } from "../ui/devio-date-picker";

export interface DeliveryUnitData {
  projectId: string;
  projectName: string;
  unitNumber: string;
  unitType?: string;
  clientName: string;
  isDelivered: boolean;
  deliveredAt?: string;
  deliveryActUrl?: string;
  warrantyExpiresAt?: string;
}

interface UnitDeliveryModalProps {
  unitData: DeliveryUnitData | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (
    isDelivered: boolean,
    deliveredAt?: string,
    deliveryActUrl?: string,
    warrantyExpiresAt?: string
  ) => void;
}

export function UnitDeliveryModal({
  unitData,
  isOpen,
  onClose,
  onConfirm,
}: UnitDeliveryModalProps) {
  if (!isOpen || !unitData) return null;

  const todayIso = getMexicoDateISO();
  const [isDelivered, setIsDelivered] = useState<boolean>(
    unitData.isDelivered ?? true
  );
  const [deliveryDate, setDeliveryDate] = useState<string>(
    unitData.deliveredAt || todayIso
  );
  const [deliveryAct, setDeliveryAct] = useState<string>(
    unitData.deliveryActUrl || ""
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Default 1 year warranty from delivery date
    let warrantyDate = "";
    if (isDelivered && deliveryDate) {
      const d = new Date(deliveryDate);
      d.setFullYear(d.getFullYear() + 1);
      warrantyDate = d.toISOString().split("T")[0] || "";
    }
    onConfirm(
      isDelivered,
      isDelivered ? deliveryDate : undefined,
      isDelivered ? (deliveryAct.trim() || undefined) : undefined,
      isDelivered ? warrantyDate : undefined
    );
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(15, 23, 42, 0.65)",
        backdropFilter: "blur(4px)",
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "1rem",
      }}
    >
      <div
        style={{
          backgroundColor: "#FFFFFF",
          borderRadius: "1rem",
          width: "100%",
          maxWidth: "520px",
          boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.2)",
          border: "1px solid #E2E8F0",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: "1.25rem 1.5rem",
            borderBottom: "1px solid #E2E8F0",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            backgroundColor: "#F8FAFC",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
            <div
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "8px",
                backgroundColor: isDelivered ? "#D1FAE5" : "#FEF3C7",
                color: isDelivered ? "#065F46" : "#92400E",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {isDelivered ? <CheckCircle2 size={20} /> : <Clock size={20} />}
            </div>
            <div>
              <h3 style={{ fontSize: "1.05rem", fontWeight: 800, color: "#1F3652", margin: 0 }}>
                Control de Entrega de Unidad
              </h3>
              <p style={{ fontSize: "0.78rem", color: "#64748B", margin: 0 }}>
                {unitData.projectName} • Unidad {unitData.unitNumber}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              border: "none",
              backgroundColor: "transparent",
              color: "#94A3B8",
              cursor: "pointer",
              padding: "0.3rem",
              borderRadius: "0.4rem",
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} style={{ padding: "1.5rem", display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          
          {/* Unit & Client Summary Box */}
          <div
            style={{
              backgroundColor: "#F1F5F9",
              borderRadius: "0.75rem",
              padding: "0.85rem 1rem",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div>
              <span style={{ fontSize: "0.7rem", color: "#64748B", fontWeight: 700, textTransform: "uppercase" }}>
                Propietario / Cliente
              </span>
              <div style={{ fontSize: "0.9rem", fontWeight: 700, color: "#1E293B", marginTop: "2px" }}>
                {unitData.clientName}
              </div>
            </div>
            <div style={{ textAlign: "right" }}>
              <span style={{ fontSize: "0.7rem", color: "#64748B", fontWeight: 700, textTransform: "uppercase" }}>
                Unidad
              </span>
              <div style={{ fontSize: "0.95rem", fontWeight: 800, color: "#2563EB", marginTop: "2px" }}>
                {unitData.unitNumber} {unitData.unitType ? `(${unitData.unitType})` : ""}
              </div>
            </div>
          </div>

          {/* Delivery Status Selector */}
          <div>
            <label style={{ fontSize: "0.8rem", fontWeight: 700, color: "#334155", display: "block", marginBottom: "0.5rem" }}>
              Estado de la Unidad *
            </label>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
              <button
                type="button"
                onClick={() => setIsDelivered(true)}
                style={{
                  padding: "0.85rem",
                  borderRadius: "0.6rem",
                  border: isDelivered ? "2px solid #10B981" : "1px solid #CBD5E1",
                  backgroundColor: isDelivered ? "#ECFDF5" : "#FFFFFF",
                  color: isDelivered ? "#065F46" : "#64748B",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: "0.35rem",
                  cursor: "pointer",
                  fontWeight: 700,
                  fontSize: "0.82rem",
                }}
              >
                <CheckCircle2 size={20} color={isDelivered ? "#10B981" : "#94A3B8"} />
                <span>✓ Unidad Entregada</span>
                <span style={{ fontSize: "0.68rem", fontWeight: 500, color: isDelivered ? "#047857" : "#94A3B8" }}>
                  Habilita postventa y garantías en app
                </span>
              </button>

              <button
                type="button"
                onClick={() => setIsDelivered(false)}
                style={{
                  padding: "0.85rem",
                  borderRadius: "0.6rem",
                  border: !isDelivered ? "2px solid #F59E0B" : "1px solid #CBD5E1",
                  backgroundColor: !isDelivered ? "#FFFBEB" : "#FFFFFF",
                  color: !isDelivered ? "#92400E" : "#64748B",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: "0.35rem",
                  cursor: "pointer",
                  fontWeight: 700,
                  fontSize: "0.82rem",
                }}
              >
                <Clock size={20} color={!isDelivered ? "#F59E0B" : "#94A3B8"} />
                <span>Pendiente de Entrega</span>
                <span style={{ fontSize: "0.68rem", fontWeight: 500, color: !isDelivered ? "#B45309" : "#94A3B8" }}>
                  En obra / entrega programada
                </span>
              </button>
            </div>
          </div>

          {/* Conditional Delivery Date & Act */}
          {isDelivered ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem", backgroundColor: "#F8FAFC", padding: "1rem", borderRadius: "0.75rem", border: "1px solid #E2E8F0" }}>
              <div>
                <label style={{ fontSize: "0.8rem", fontWeight: 600, color: "#334155", display: "block", marginBottom: "0.35rem" }}>
                  Fecha Oficial de Entrega / Recepción de Llaves *
                </label>
                <DevioDatePicker
                  value={deliveryDate}
                  onChange={(val) => setDeliveryDate(val)}
                  placeholder="Seleccionar fecha de entrega"
                  required
                />
              </div>

              <div>
                <label style={{ fontSize: "0.8rem", fontWeight: 600, color: "#334155", display: "block", marginBottom: "0.35rem" }}>
                  Folio o Referencia del Acta de Entrega (Opcional)
                </label>
                <input
                  type="text"
                  value={deliveryAct}
                  onChange={(e) => setDeliveryAct(e.target.value)}
                  placeholder="Ej. ACTA-ENTR-2026-008"
                  style={{
                    width: "100%",
                    padding: "0.55rem 0.75rem",
                    borderRadius: "0.5rem",
                    border: "1px solid #CBD5E1",
                    fontSize: "0.85rem",
                    color: "#1E293B",
                    backgroundColor: "#FFFFFF",
                    outline: "none",
                  }}
                />
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", color: "#065F46", fontSize: "0.75rem", fontWeight: 600 }}>
                <ShieldCheck size={16} />
                <span>La póliza de garantía legal por vicios ocultos iniciará a partir de esta fecha (12 meses).</span>
              </div>
            </div>
          ) : (
            <div style={{ padding: "0.85rem", borderRadius: "0.5rem", backgroundColor: "#FEF2F2", border: "1px solid #FECACA", color: "#991B1B", fontSize: "0.78rem" }}>
              ⚠️ Al marcar la unidad como pendiente, en la app del cliente no estará habilitado el botón de reportar nuevas incidencias hasta que se entregue la unidad.
            </div>
          )}

          {/* Footer Actions */}
          <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem", marginTop: "0.5rem" }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: "0.55rem 1.15rem",
                borderRadius: "0.5rem",
                border: "1px solid #CBD5E1",
                backgroundColor: "#FFFFFF",
                color: "#475569",
                fontSize: "0.82rem",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Cancelar
            </button>
            <button
              type="submit"
              style={{
                padding: "0.55rem 1.4rem",
                borderRadius: "0.5rem",
                border: "none",
                backgroundColor: "#1F3652",
                color: "#FFFFFF",
                fontSize: "0.82rem",
                fontWeight: 700,
                cursor: "pointer",
                boxShadow: "0 2px 6px rgba(31, 54, 82, 0.25)",
              }}
            >
              Guardar Estado de Entrega
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
