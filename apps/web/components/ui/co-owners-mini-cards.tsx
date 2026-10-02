"use client";

import React, { useState, useRef, useEffect } from "react";
import { Users, ChevronDown, CheckCircle2, Mail, Phone, X, ExternalLink } from "lucide-react";

export interface CoOwnerItem {
  id?: string;
  name: string;
  email?: string;
  phone?: string;
  ownershipPct?: number;
  percentage?: number;
  isPrimary?: boolean;
  rfc?: string;
}

interface CoOwnersMiniCardsProps {
  clientName?: string;
  clientEmail?: string;
  clientPhone?: string;
  coOwners?: CoOwnerItem[] | null;
  onCoOwnerClick?: (coOwner: CoOwnerItem, e: React.MouseEvent) => void;
  maxVisible?: number;
}

export function CoOwnersMiniCards({
  clientName,
  clientEmail,
  clientPhone,
  coOwners,
  onCoOwnerClick,
}: CoOwnersMiniCardsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const validCoOwners = (coOwners || []).filter((co) => co && co.name && co.name.trim() !== "");

  // Close on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleOutsideClick);
    }
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, [isOpen]);

  // Si hay más de un copropietario: SOLO mostrar la card/badge de Copropiedad
  if (validCoOwners.length > 1) {
    const showPopup = isOpen || isHovered;

    return (
      <div
        ref={containerRef}
        style={{ position: "relative", display: "inline-block" }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Card / Badge interactivo de Copropiedad */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setIsOpen(!isOpen);
          }}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.35rem",
            fontSize: "0.78rem",
            fontWeight: 700,
            backgroundColor: showPopup ? "rgba(47, 128, 237, 0.16)" : "rgba(47, 128, 237, 0.08)",
            color: "#2F80ED",
            padding: "0.28rem 0.65rem",
            borderRadius: "9999px",
            border: "1px solid rgba(47, 128, 237, 0.28)",
            cursor: "pointer",
            transition: "all 0.15s ease",
            boxShadow: showPopup ? "0 2px 6px rgba(47, 128, 237, 0.15)" : "none",
          }}
          title="Ver lista de copropietarios"
        >
          <Users size={13} color="#2F80ED" />
          <span>Copropiedad ({validCoOwners.length})</span>
          <ChevronDown
            size={12}
            style={{
              transform: showPopup ? "rotate(180deg)" : "none",
              transition: "transform 0.15s ease",
            }}
          />
        </button>

        {/* Pop-up Flotante (Hover & Click) */}
        {showPopup && (
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              position: "absolute",
              top: "100%",
              left: 0,
              marginTop: "0.4rem",
              zIndex: 9999,
              backgroundColor: "#FFFFFF",
              borderRadius: "0.85rem",
              padding: "0.85rem",
              boxShadow: "0 14px 40px -4px rgba(15, 41, 66, 0.25), 0 4px 12px rgba(0, 0, 0, 0.08)",
              border: "1px solid #E2E8F0",
              minWidth: "260px",
              maxWidth: "320px",
            }}
          >
            {/* Pop-up Header */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                paddingBottom: "0.5rem",
                marginBottom: "0.5rem",
                borderBottom: "1px solid #F1F5F9",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
                <Users size={13} color="#2F80ED" />
                <span style={{ fontSize: "0.78rem", fontWeight: 800, color: "#1F3652" }}>
                  Copropietarios ({validCoOwners.length})
                </span>
              </div>
              <span
                style={{
                  fontSize: "0.68rem",
                  fontWeight: 700,
                  color: "#64748B",
                  backgroundColor: "#F8FAFC",
                  padding: "0.1rem 0.4rem",
                  borderRadius: "4px",
                  border: "1px solid #E2E8F0",
                }}
              >
                Total: 100%
              </span>
            </div>

            {/* Lista de Copropietarios */}
            <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem", maxHeight: "220px", overflowY: "auto" }}>
              {validCoOwners.map((co, idx) => {
                const pct = co.ownershipPct ?? co.percentage ?? Math.round(100 / validCoOwners.length);
                const isPrimary = co.isPrimary || idx === 0;

                return (
                  <div
                    key={co.id || `${co.name}-${idx}`}
                    onClick={(e) => {
                      if (onCoOwnerClick) {
                        onCoOwnerClick(co, e);
                        setIsOpen(false);
                      }
                    }}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: "0.5rem",
                      backgroundColor: isPrimary ? "rgba(47, 128, 237, 0.04)" : "#F8FAFC",
                      border: isPrimary ? "1px solid rgba(47, 128, 237, 0.25)" : "1px solid #E2E8F0",
                      borderRadius: "0.5rem",
                      padding: "0.4rem 0.6rem",
                      cursor: onCoOwnerClick ? "pointer" : "default",
                      transition: "all 0.15s ease",
                    }}
                    onMouseEnter={(e) => {
                      if (onCoOwnerClick) {
                        e.currentTarget.style.backgroundColor = "rgba(47, 128, 237, 0.1)";
                        e.currentTarget.style.borderColor = "#2F80ED";
                      }
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = isPrimary ? "rgba(47, 128, 237, 0.04)" : "#F8FAFC";
                      e.currentTarget.style.borderColor = isPrimary ? "rgba(47, 128, 237, 0.25)" : "#E2E8F0";
                    }}
                    title={onCoOwnerClick ? `Ir al estado de cuenta de ${co.name}` : co.name}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", minWidth: 0, flex: 1 }}>
                      {/* Avatar Initials */}
                      <div
                        style={{
                          width: "24px",
                          height: "24px",
                          borderRadius: "50%",
                          backgroundColor: isPrimary ? "#2F80ED" : "#E2E8F0",
                          color: isPrimary ? "#FFFFFF" : "#1F3652",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: "0.68rem",
                          fontWeight: 800,
                          flexShrink: 0,
                        }}
                      >
                        {co.name.charAt(0).toUpperCase()}
                      </div>

                      <div style={{ minWidth: 0, flex: 1 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}>
                          <span
                            style={{
                              fontSize: "0.78rem",
                              fontWeight: 700,
                              color: "#1F3652",
                              whiteSpace: "nowrap",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                            }}
                          >
                            {co.name}
                          </span>
                          {isPrimary && (
                            <span
                              style={{
                                fontSize: "0.58rem",
                                fontWeight: 800,
                                color: "#00A877",
                                backgroundColor: "rgba(0, 196, 140, 0.1)",
                                padding: "0.05rem 0.25rem",
                                borderRadius: "3px",
                                flexShrink: 0,
                              }}
                            >
                              Titular
                            </span>
                          )}
                        </div>

                        {co.email && co.email !== "-" && (
                          <span
                            style={{
                              fontSize: "0.68rem",
                              color: "#64748B",
                              display: "block",
                              whiteSpace: "nowrap",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                            }}
                          >
                            {co.email}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Percentage Pill */}
                    <div style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
                      <span
                        style={{
                          fontSize: "0.72rem",
                          fontWeight: 800,
                          color: "#2F80ED",
                          backgroundColor: "rgba(47, 128, 237, 0.08)",
                          padding: "0.15rem 0.45rem",
                          borderRadius: "4px",
                          flexShrink: 0,
                          border: "1px solid rgba(47, 128, 237, 0.2)",
                        }}
                      >
                        {pct}%
                      </span>
                      {onCoOwnerClick && <ExternalLink size={11} color="#64748B" />}
                    </div>
                  </div>
                );
              })}
            </div>

            {onCoOwnerClick && (
              <p style={{ fontSize: "0.68rem", color: "#94A3B8", fontStyle: "italic", margin: "0.5rem 0 0 0", textAlign: "center" }}>
                Haz clic en un copropietario para ver su estado de cuenta
              </p>
            )}
          </div>
        )}
      </div>
    );
  }

  // Single client fallback: Cuando NO es copropiedad, mostrar el nombre del cliente normal
  const displayName =
    (validCoOwners.length === 1 ? validCoOwners[0]?.name : null) ||
    clientName ||
    "Sin asignar";

  const displayEmail =
    (validCoOwners.length === 1 ? validCoOwners[0]?.email : null) ||
    clientEmail;

  if (!displayName || displayName === "-" || displayName === "Sin asignar") {
    return <span style={{ color: "#94A3B8", fontSize: "0.85rem" }}>Sin asignar</span>;
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.15rem" }}>
      <span style={{ fontWeight: 700, color: "#1F3652", fontSize: "0.85rem" }}>
        {displayName}
      </span>
      {displayEmail && displayEmail !== "-" && (
        <span style={{ fontSize: "0.72rem", color: "#64748B" }}>
          {displayEmail}
        </span>
      )}
    </div>
  );
}
