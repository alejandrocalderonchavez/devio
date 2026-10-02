"use client";

import React from "react";
import { Users } from "lucide-react";

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
  maxVisible = 5,
}: CoOwnersMiniCardsProps) {
  const validCoOwners = (coOwners || []).filter((co) => co && co.name && co.name.trim() !== "");

  if (validCoOwners.length > 1) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem", minWidth: "190px", maxWidth: "340px" }}>
        {/* Header Badge */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.25rem",
              fontSize: "0.68rem",
              fontWeight: 800,
              backgroundColor: "rgba(47, 128, 237, 0.08)",
              color: "#2F80ED",
              padding: "0.15rem 0.45rem",
              borderRadius: "4px",
              border: "1px solid rgba(47, 128, 237, 0.2)",
              letterSpacing: "0.2px",
            }}
          >
            <Users size={11} />
            Copropiedad ({validCoOwners.length})
          </span>
        </div>

        {/* Mini Cards */}
        <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
          {validCoOwners.slice(0, maxVisible).map((co, idx) => {
            const pct = co.ownershipPct ?? co.percentage ?? Math.round(100 / validCoOwners.length);
            const isPrimary = co.isPrimary || idx === 0;

            return (
              <div
                key={co.id || `${co.name}-${idx}`}
                onClick={(e) => onCoOwnerClick && onCoOwnerClick(co, e)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: "0.4rem",
                  backgroundColor: "#FFFFFF",
                  border: isPrimary ? "1px solid rgba(47, 128, 237, 0.3)" : "1px solid #E2E8F0",
                  borderRadius: "0.45rem",
                  padding: "0.3rem 0.5rem",
                  boxShadow: "0 1px 2px rgba(0,0,0,0.02)",
                  cursor: onCoOwnerClick ? "pointer" : "default",
                  transition: "all 0.15s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "#2F80ED";
                  e.currentTarget.style.backgroundColor = "#F8FAFC";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = isPrimary ? "rgba(47, 128, 237, 0.3)" : "#E2E8F0";
                  e.currentTarget.style.backgroundColor = "#FFFFFF";
                }}
                title={`${co.name} • ${pct}% de copropiedad${co.email && co.email !== "-" ? ` • ${co.email}` : ""}`}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "0.35rem", minWidth: 0, flex: 1 }}>
                  {/* Avatar Initials */}
                  <div
                    style={{
                      width: "20px",
                      height: "20px",
                      borderRadius: "50%",
                      backgroundColor: isPrimary ? "rgba(47, 128, 237, 0.12)" : "rgba(31, 54, 82, 0.08)",
                      color: isPrimary ? "#2F80ED" : "#1F3652",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "0.62rem",
                      fontWeight: 800,
                      flexShrink: 0,
                    }}
                  >
                    {co.name.charAt(0).toUpperCase()}
                  </div>

                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
                      <span
                        style={{
                          fontSize: "0.78rem",
                          fontWeight: 700,
                          color: "#1F3652",
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          display: "inline-block",
                          maxWidth: "140px",
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
                  </div>
                </div>

                {/* Percentage Pill */}
                <span
                  style={{
                    fontSize: "0.72rem",
                    fontWeight: 800,
                    color: "#2F80ED",
                    backgroundColor: "rgba(47, 128, 237, 0.08)",
                    padding: "0.1rem 0.4rem",
                    borderRadius: "4px",
                    flexShrink: 0,
                    border: "1px solid rgba(47, 128, 237, 0.15)",
                  }}
                >
                  {pct}%
                </span>
              </div>
            );
          })}

          {validCoOwners.length > maxVisible && (
            <span style={{ fontSize: "0.7rem", color: "#64748B", fontWeight: 600 }}>
              +{validCoOwners.length - maxVisible} copropietarios más
            </span>
          )}
        </div>
      </div>
    );
  }

  // Single client fallback
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
