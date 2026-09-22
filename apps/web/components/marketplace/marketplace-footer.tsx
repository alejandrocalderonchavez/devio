"use client";

import React from "react";
import Link from "next/link";
import { Mail, ShieldCheck, Globe } from "lucide-react";

export function MarketplaceFooter() {
  return (
    <footer
      style={{
        backgroundColor: "#162B3F",
        color: "#FFFFFF",
        padding: "3.5rem 2rem 2.5rem 2rem",
        marginTop: "4rem",
        borderTop: "1px solid rgba(255, 255, 255, 0.08)",
      }}
    >
      <div
        style={{
          maxWidth: "1280px",
          margin: "0 auto",
          display: "grid",
          gridTemplateColumns: "1.5fr 1fr 1fr 1.2fr",
          gap: "3rem",
          marginBottom: "3rem",
        }}
      >
        {/* Col 1: Brand info */}
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1rem" }}>
            <img
              src="/brand/13.png"
              alt="Devio"
              style={{ height: "30px", width: "auto", filter: "brightness(0) invert(1)" }}
            />
          </div>
          <p
            style={{
              fontSize: "0.82rem",
              color: "#94A3B8",
              lineHeight: 1.6,
              maxWidth: "300px",
              margin: 0,
            }}
          >
            La plataforma SaaS que centraliza la operación de desarrolladoras inmobiliarias en México.
          </p>
        </div>

        {/* Col 2: Producto */}
        <div>
          <h4
            style={{
              fontSize: "0.75rem",
              fontWeight: 800,
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              color: "#CBD5E1",
              marginBottom: "1rem",
            }}
          >
            PRODUCTO
          </h4>
          <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "0.6rem", fontSize: "0.82rem" }}>
            <li>
              <Link href="/dashboard" style={{ color: "#94A3B8", textDecoration: "none" }}>
                Funcionalidades
              </Link>
            </li>
            <li>
              <Link href="/dashboard" style={{ color: "#94A3B8", textDecoration: "none" }}>
                Cómo funciona
              </Link>
            </li>
            <li>
              <Link href="/dashboard" style={{ color: "#94A3B8", textDecoration: "none" }}>
                App clientes
              </Link>
            </li>
            <li>
              <Link href="/dashboard" style={{ color: "#94A3B8", textDecoration: "none" }}>
                Solicitar demo
              </Link>
            </li>
          </ul>
        </div>

        {/* Col 3: Empresa */}
        <div>
          <h4
            style={{
              fontSize: "0.75rem",
              fontWeight: 800,
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              color: "#CBD5E1",
              marginBottom: "1rem",
            }}
          >
            EMPRESA
          </h4>
          <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "0.6rem", fontSize: "0.82rem" }}>
            <li>
              <Link href="/dashboard" style={{ color: "#94A3B8", textDecoration: "none" }}>
                Contacto
              </Link>
            </li>
            <li>
              <Link href="/dashboard" style={{ color: "#94A3B8", textDecoration: "none" }}>
                Privacidad
              </Link>
            </li>
          </ul>
        </div>

        {/* Col 4: Síguenos & Pagos Seguros */}
        <div>
          <h4
            style={{
              fontSize: "0.75rem",
              fontWeight: 800,
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              color: "#CBD5E1",
              marginBottom: "1rem",
            }}
          >
            SÍGUENOS
          </h4>
          
          <div style={{ display: "flex", gap: "0.75rem", marginBottom: "1.5rem" }}>
            <a
              href="https://instagram.com"
              target="_blank"
              rel="noopener noreferrer"
              title="Instagram"
              style={{
                width: "32px",
                height: "32px",
                borderRadius: "50%",
                backgroundColor: "rgba(255, 255, 255, 0.08)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#CBD5E1",
                textDecoration: "none",
              }}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect width="20" height="20" x="2" y="2" rx="5" ry="5"/>
                <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
                <line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/>
              </svg>
            </a>
            <a
              href="https://facebook.com"
              target="_blank"
              rel="noopener noreferrer"
              title="Facebook"
              style={{
                width: "32px",
                height: "32px",
                borderRadius: "50%",
                backgroundColor: "rgba(255, 255, 255, 0.08)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#CBD5E1",
                textDecoration: "none",
              }}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>
              </svg>
            </a>
          </div>

          <span style={{ fontSize: "0.72rem", color: "#94A3B8", display: "block", marginBottom: "0.5rem", fontWeight: 700, textTransform: "uppercase" }}>
            PAGOS SEGUROS
          </span>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap", marginBottom: "1rem" }}>
            {["stripe", "VISA", "MC", "AMEX"].map((badge) => (
              <span
                key={badge}
                style={{
                  fontSize: "0.68rem",
                  fontWeight: 800,
                  backgroundColor: "rgba(255, 255, 255, 0.1)",
                  color: "#CBD5E1",
                  padding: "0.2rem 0.5rem",
                  borderRadius: "4px",
                  letterSpacing: "0.05em",
                }}
              >
                {badge}
              </span>
            ))}
          </div>

          <span style={{ fontSize: "0.75rem", color: "#64748B" }}>
            contacto@deviomx.com
          </span>
        </div>
      </div>

      {/* Bottom copyright line */}
      <div
        style={{
          maxWidth: "1280px",
          margin: "0 auto",
          paddingTop: "1.5rem",
          borderTop: "1px solid rgba(255, 255, 255, 0.05)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          fontSize: "0.75rem",
          color: "#64748B",
        }}
      >
        <span>© 2026 Devio MX. Todos los derechos reservados.</span>
        <span>Plataforma Inmobiliaria Institucional</span>
      </div>
    </footer>
  );
}
