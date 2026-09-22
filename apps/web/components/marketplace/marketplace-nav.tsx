"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Share2, Check, ExternalLink, LogIn } from "lucide-react";

interface MarketplaceNavProps {
  activePage?: "inicio" | "proyecto";
}

export function MarketplaceNav({ activePage = "inicio" }: MarketplaceNavProps) {
  const [copied, setCopied] = useState(false);

  const handleShare = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  return (
    <header
      style={{
        position: "sticky",
        top: "1rem",
        zIndex: 1000,
        maxWidth: "1280px",
        margin: "1rem auto 1.5rem auto",
        padding: "0 1rem",
      }}
    >
      <div
        style={{
          backgroundColor: "rgba(255, 255, 255, 0.95)",
          backdropFilter: "blur(12px)",
          borderRadius: "9999px",
          padding: "0.6rem 1.75rem",
          boxShadow: "0 4px 20px rgba(0, 0, 0, 0.06), 0 1px 3px rgba(0, 0, 0, 0.03)",
          border: "1px solid rgba(22, 43, 63, 0.08)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        {/* Brand Logo + Nav Link */}
        <div style={{ display: "flex", alignItems: "center", gap: "2rem" }}>
          <Link href="/marketplace" style={{ display: "flex", alignItems: "center", gap: "0.5rem", textDecoration: "none" }}>
            <img
              src="/brand/13.png"
              alt="Devio"
              style={{ height: "26px", width: "auto", objectFit: "contain" }}
            />
          </Link>

          <nav style={{ display: "flex", alignItems: "center", gap: "1.25rem" }}>
            <Link
              href="/marketplace"
              style={{
                fontSize: "0.88rem",
                fontWeight: activePage === "inicio" ? 700 : 500,
                color: activePage === "inicio" ? "#1B3047" : "#64748B",
                textDecoration: "none",
                transition: "color 0.15s ease",
              }}
            >
              Inicio
            </Link>
          </nav>
        </div>

        {/* Right Actions: Inicia Sesión & Share */}
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <Link
            href="/dashboard"
            style={{
              fontSize: "0.85rem",
              fontWeight: 600,
              color: "#1B3047",
              textDecoration: "none",
              display: "flex",
              alignItems: "center",
              gap: "0.4rem",
              padding: "0.4rem 0.8rem",
              borderRadius: "9999px",
              transition: "background 0.15s ease",
            }}
          >
            Inicia Sesión
          </Link>

          {/* Share Button */}
          <button
            type="button"
            onClick={handleShare}
            title="Compartir enlace público del Marketplace"
            style={{
              background: "#F8FAFC",
              border: "1px solid #E2E8F0",
              borderRadius: "50%",
              width: "36px",
              height: "36px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: copied ? "#00C48C" : "#1B3047",
              cursor: "pointer",
              transition: "all 0.15s ease",
            }}
          >
            {copied ? <Check size={16} /> : <Share2 size={16} />}
          </button>
        </div>
      </div>
    </header>
  );
}
