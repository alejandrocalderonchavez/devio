"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Building2,
  FolderPlus,
  Users,
  Coins,
  ArrowRight,
  Sparkles,
  Layers,
  FileText,
  BadgeCheck,
  ShieldCheck,
  TrendingUp,
  LayoutDashboard,
} from "lucide-react";

export default function HomePage() {
  const [currency, setCurrency] = useState<"MXN" | "USD">("MXN");

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      {/* Top Navigation */}
      <header
        style={{
          backgroundColor: "var(--devio-blue-dark)",
          color: "var(--devio-white)",
          padding: "1rem 2.5rem",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Link href="/" style={{ textDecoration: "none", display: "flex", alignItems: "center" }}>
          <img
            src="/brand/14.png"
            alt="Devio"
            style={{ height: "32px", width: "auto", objectFit: "contain" }}
          />
        </Link>

        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          {/* Currency switch */}
          <div
            style={{
              display: "inline-flex",
              backgroundColor: "rgba(255, 255, 255, 0.1)",
              borderRadius: "9999px",
              padding: "0.2rem",
            }}
          >
            <button
              onClick={() => setCurrency("MXN")}
              style={{
                background: currency === "MXN" ? "var(--devio-beige)" : "transparent",
                color: currency === "MXN" ? "var(--devio-blue-dark)" : "var(--devio-white)",
                border: "none",
                borderRadius: "9999px",
                padding: "0.3rem 0.75rem",
                fontSize: "0.75rem",
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              MXN
            </button>
            <button
              onClick={() => setCurrency("USD")}
              style={{
                background: currency === "USD" ? "var(--devio-beige)" : "transparent",
                color: currency === "USD" ? "var(--devio-blue-dark)" : "var(--devio-white)",
                border: "none",
                borderRadius: "9999px",
                padding: "0.3rem 0.75rem",
                fontSize: "0.75rem",
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              USD
            </button>
          </div>

          <Link href="/login" style={{ color: "var(--devio-white)", fontSize: "0.85rem", fontWeight: 600, textDecoration: "none", padding: "0.5rem 0.85rem" }}>
            Iniciar Sesión
          </Link>

          <Link href="/register" className="btn btn-secondary" style={{ fontSize: "0.85rem" }}>
            Registrarme Gratis <ArrowRight size={15} />
          </Link>
        </div>
      </header>

      {/* Hero Banner */}
      <main style={{ flex: 1, padding: "3.5rem 2rem", maxWidth: "1180px", margin: "0 auto", width: "100%" }}>
        <div style={{ textAlign: "center", marginBottom: "3.5rem" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", marginBottom: "1.25rem" }}>
            <span className="badge badge-success" style={{ padding: "0.4rem 1rem", fontSize: "0.85rem" }}>
              <BadgeCheck size={16} /> Sistema Operativo Inmobiliario 2026
            </span>
          </div>
          <h1 style={{ fontSize: "3rem", lineHeight: 1.15, marginBottom: "1.25rem", color: "var(--devio-blue-dark)", fontWeight: 800 }}>
            Toda tu desarrolladora en un sólo lugar.
          </h1>
          <p style={{ color: "var(--text-muted)", fontSize: "1.15rem", maxWidth: "720px", margin: "0 auto 2.25rem", lineHeight: 1.6 }}>
            Centraliza proyectos verticales, horizontales, comerciales e industriales, inventario dinámico con plantillas Excel multi-hoja, cotizaciones multidivisa y cobranza automática.
          </p>

          <div style={{ display: "flex", justifyContent: "center", gap: "1rem", flexWrap: "wrap" }}>
            <Link href="/register" className="btn btn-primary" style={{ padding: "0.85rem 1.75rem", fontSize: "1rem" }}>
              Comenzar Registro de Administrador <ArrowRight size={18} />
            </Link>
            <Link href="/dashboard" className="btn btn-secondary" style={{ padding: "0.85rem 1.75rem", fontSize: "1rem" }}>
              <LayoutDashboard size={18} /> Ver Panel / Dashboard
            </Link>
          </div>
        </div>

        {/* FX Live Widget */}
        <div
          style={{
            backgroundColor: "var(--devio-white)",
            border: "1px solid var(--border-subtle)",
            borderRadius: "1rem",
            padding: "1.25rem 2rem",
            marginBottom: "3rem",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            boxShadow: "0 2px 14px rgba(31, 54, 82, 0.05)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
            <div
              style={{
                width: "48px",
                height: "48px",
                borderRadius: "50%",
                backgroundColor: "rgba(199, 178, 139, 0.2)",
                color: "var(--devio-beige-scale2)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Coins size={24} />
            </div>
            <div>
              <h4 style={{ fontSize: "1rem", margin: 0, fontWeight: 700, color: "var(--devio-blue-dark)" }}>Tipo de Cambio Banxico FIX Oficial</h4>
              <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", margin: 0 }}>
                Cotizaciones, estados de cuenta y recibos actualizados automáticamente en MXN y USD.
              </p>
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <span style={{ fontSize: "1.35rem", fontWeight: 800, color: "var(--devio-blue)" }}>
              $18.3500 MXN / USD
            </span>
            <span style={{ display: "block", fontSize: "0.75rem", color: "var(--devio-green)", fontWeight: 600 }}>
              Sincronizado hoy
            </span>
          </div>
        </div>

        {/* Modular Overview */}
        <div style={{ marginBottom: "1.5rem" }}>
          <h3 style={{ fontSize: "1.35rem", fontWeight: 700, color: "var(--devio-blue-dark)", marginBottom: "0.5rem" }}>
            Flujo Operativo de Devio
          </h3>
          <p style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
            Diseñado específicamente para optimizar los ciclos comerciales de empresas desarrolladoras.
          </p>
        </div>

        <div className="grid-cols-3" style={{ gap: "1.5rem" }}>
          <div className="card" style={{ padding: "1.75rem" }}>
            <div style={{ width: "44px", height: "44px", borderRadius: "0.75rem", backgroundColor: "rgba(31, 54, 82, 0.08)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--devio-blue)", marginBottom: "1rem" }}>
              <Building2 size={22} />
            </div>
            <h4 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: "0.5rem", color: "var(--devio-blue-dark)" }}>
              1. Desarrolladora & Equipo
            </h4>
            <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", lineHeight: 1.5, marginBottom: "1.25rem" }}>
              Registro institucional, datos fiscales, logotipo oficial y matriz de permisos granulares por departamento.
            </p>
            <Link href="/onboarding/developer" style={{ fontSize: "0.85rem", color: "var(--devio-blue)", fontWeight: 700, textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "0.35rem" }}>
              Configurar desarrolladora <ArrowRight size={15} />
            </Link>
          </div>

          <div className="card" style={{ padding: "1.75rem" }}>
            <div style={{ width: "44px", height: "44px", borderRadius: "0.75rem", backgroundColor: "rgba(199, 178, 139, 0.15)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--devio-beige-scale2)", marginBottom: "1rem" }}>
              <Layers size={22} />
            </div>
            <h4 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: "0.5rem", color: "var(--devio-blue-dark)" }}>
              2. Proyectos & 5 Tipologías
            </h4>
            <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", lineHeight: 1.5, marginBottom: "1.25rem" }}>
              Carga masiva Excel (.xlsx) con hoja de instrucciones y mapeador inteligente de columnas personalizadas.
            </p>
            <Link href="/onboarding/project" style={{ fontSize: "0.85rem", color: "var(--devio-blue)", fontWeight: 700, textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "0.35rem" }}>
              Crear proyecto <ArrowRight size={15} />
            </Link>
          </div>

          <div className="card" style={{ padding: "1.75rem" }}>
            <div style={{ width: "44px", height: "44px", borderRadius: "0.75rem", backgroundColor: "rgba(111, 172, 156, 0.15)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--devio-green)", marginBottom: "1rem" }}>
              <TrendingUp size={22} />
            </div>
            <h4 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: "0.5rem", color: "var(--devio-blue-dark)" }}>
              3. Dashboard & Cotizador
            </h4>
            <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", lineHeight: 1.5, marginBottom: "1.25rem" }}>
              Supervisión de inventario en tiempo real, esquemas de pago (tradicional y contado) y cotizaciones PDF.
            </p>
            <Link href="/dashboard" style={{ fontSize: "0.85rem", color: "var(--devio-blue)", fontWeight: 700, textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "0.35rem" }}>
              Ir al Dashboard <ArrowRight size={15} />
            </Link>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer
        style={{
          borderTop: "1px solid var(--border-subtle)",
          padding: "1.5rem 2.5rem",
          backgroundColor: "var(--devio-white)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          fontSize: "0.85rem",
          color: "var(--text-muted)",
        }}
      >
        <span>Devio 2026 — Plataforma Operativa para Desarrolladoras Inmobiliarias.</span>
        <span>soporte@devio.mx</span>
      </footer>
    </div>
  );
}
