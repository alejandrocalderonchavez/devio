"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  Sparkles,
  Building2,
} from "lucide-react";

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTarget = searchParams.get("redirect") || "/dashboard";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !password) {
      setErrorMessage("Por favor ingresa tu correo y contraseña.");
      return;
    }

    setIsSubmitting(true);

    try {
      let loggedUser: any = null;
      let sessionToken = "";

      // 1. Verificar contra /api/auth/login (Multi-tenant y Super Admin)
      try {
        const response = await fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: cleanEmail, password }),
        });

        if (response.ok) {
          const data = await response.json();
          if (data.user) {
            loggedUser = data.user;
            sessionToken = data.token || `devio_session_${Date.now()}`;

            if (typeof window !== "undefined") {
              // Limpiar estado previo de otra sesión o desarrolladora
              localStorage.removeItem("devio_user_session");
              sessionStorage.removeItem("devio_user_session");
              localStorage.removeItem("devio_developer_onboarding");
              sessionStorage.removeItem("devio_developer_onboarding");
              localStorage.removeItem("devio_developer_logo");
              sessionStorage.removeItem("devio_developer_logo");
              localStorage.removeItem("devio_projects_state");
              sessionStorage.removeItem("devio_projects_state");
              localStorage.removeItem("devio_impersonation");
              sessionStorage.removeItem("devio_impersonation");
              localStorage.removeItem("devio_is_new_user");
              sessionStorage.removeItem("devio_is_new_user");

              if (data.developer) {
                localStorage.setItem("devio_developer_onboarding", JSON.stringify(data.developer));
                sessionStorage.setItem("devio_developer_onboarding", JSON.stringify(data.developer));
                if (data.developer.logoPath || data.developer.logoUrl || data.developer.logo) {
                  const devLogo = data.developer.logoPath || data.developer.logoUrl || data.developer.logo;
                  localStorage.setItem("devio_developer_logo", devLogo);
                  sessionStorage.setItem("devio_developer_logo", devLogo);
                }
              }
            }
          }
        } else {
          const errData = await response.json().catch(() => ({}));
          setIsSubmitting(false);
          setErrorMessage(errData.error || "Credenciales inválidas. Verifica tu correo y contraseña.");
          return;
        }
      } catch (apiErr: any) {
        console.error("Login request error:", apiErr);
        setIsSubmitting(false);
        setErrorMessage(apiErr.message || "Error de conexión con el servidor. Intenta de nuevo.");
        return;
      }

      // 3. Si se encontró usuario válido:
      if (loggedUser) {
        if (typeof window !== "undefined") {
          localStorage.setItem("devio_user_session", JSON.stringify(loggedUser));
          sessionStorage.setItem("devio_user_session", JSON.stringify(loggedUser));
          
          // Guardar cookie para el Middleware de Next.js
          const maxAge = rememberMe ? 604800 : 86400; // 7 días o 1 día
          document.cookie = `devio_auth_token=${sessionToken || "auth_valid"}; path=/; max-age=${maxAge}; SameSite=Lax`;
        }

        setTimeout(() => {
          setIsSubmitting(false);
          let destination = redirectTarget;
          if (loggedUser.isSuperAdmin && redirectTarget === "/dashboard") {
            destination = "/super-admin";
          } else if (
            loggedUser.role === "Cliente" ||
            loggedUser.isClient === true ||
            cleanEmail === "0242573@up.edu.mx"
          ) {
            destination = "/portal";
          }
          window.location.href = destination;
        }, 300);
        return;
      }

      // 4. Si no se encontró usuario
      setIsSubmitting(false);
      setErrorMessage("Credenciales no válidas. Verifica tu correo y contraseña o regístrate si aún no tienes cuenta.");
    } catch (err: any) {
      setIsSubmitting(false);
      setErrorMessage("Ocurrió un error al intentar iniciar sesión. Intenta nuevamente.");
    }
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", backgroundColor: "var(--bg-page)" }}>
      {/* PANEL IZQUIERDO INSTITUCIONAL */}
      <div
        style={{
          flex: 1,
          backgroundColor: "var(--devio-blue-dark)",
          color: "var(--devio-white)",
          padding: "3.5rem 3rem",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          position: "relative",
          overflow: "hidden",
        }}
        className="hidden-mobile"
      >
        <div>
          <Link href="/" style={{ textDecoration: "none", display: "inline-block", marginBottom: "4rem" }}>
            <img
              src="/brand/logo-white.png"
              alt="Devio"
              style={{ height: "48px", width: "auto", objectFit: "contain" }}
            />
          </Link>

          <div style={{ maxWidth: "420px" }}>
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.5rem",
                padding: "0.35rem 0.85rem",
                borderRadius: "9999px",
                backgroundColor: "rgba(199, 178, 139, 0.15)",
                color: "var(--devio-beige)",
                fontSize: "0.8rem",
                fontWeight: 600,
                marginBottom: "1.5rem",
              }}
            >
              <Sparkles size={14} /> Acceso a Plataforma
            </span>

            <h1 style={{ fontSize: "2.25rem", fontWeight: 800, lineHeight: 1.2, color: "var(--devio-white)", marginBottom: "1.25rem" }}>
              Bienvenido de nuevo a Devio.
            </h1>

            <p style={{ color: "var(--devio-neutral-2)", fontSize: "1rem", lineHeight: 1.6 }}>
              Ingresa tus credenciales para acceder a tus desarrollos, cotizaciones y estados de cuenta en tiempo real.
            </p>
          </div>
        </div>

        <div style={{ borderTop: "1px solid rgba(255, 255, 255, 0.1)", paddingTop: "1.5rem", display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.8rem", color: "var(--devio-neutral-3)" }}>
          <span>© 2026 Devio Inc.</span>
          <span>soporte@devio.mx</span>
        </div>
      </div>

      {/* PANEL DERECHO CON FORMULARIO DE LOGIN */}
      <div
        style={{
          flex: 1.2,
          padding: "3rem 2rem",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <div style={{ width: "100%", maxWidth: "460px" }}>
          {/* Header Superior Móvil & Enlace a Registro */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2.5rem" }}>
            <Link href="/" style={{ textDecoration: "none", display: "flex", alignItems: "center" }}>
              <img
                src="/brand/logo-horizontal-dark.png"
                alt="Devio"
                style={{ height: "38px", width: "auto", objectFit: "contain" }}
              />
            </Link>

            <div style={{ fontSize: "0.85rem", color: "var(--devio-neutral-3)" }}>
              ¿No tienes cuenta?{" "}
              <Link href="/register" style={{ color: "var(--devio-blue)", fontWeight: 600, textDecoration: "none" }}>
                Regístrate aquí
              </Link>
            </div>
          </div>

          <div style={{ backgroundColor: "var(--devio-white)", padding: "2.5rem", borderRadius: "1.25rem", boxShadow: "0 10px 40px rgba(0, 0, 0, 0.04)", border: "1px solid var(--devio-border)" }}>
            <h2 style={{ fontSize: "1.5rem", fontWeight: 700, color: "var(--devio-blue-dark)", marginBottom: "0.35rem" }}>
              Iniciar Sesión
            </h2>
            <p style={{ fontSize: "0.875rem", color: "var(--devio-neutral-3)", marginBottom: "1.75rem" }}>
              Ingresa tu correo y contraseña corporativa.
            </p>

            {errorMessage && (
              <div
                style={{
                  padding: "0.75rem 1rem",
                  borderRadius: "0.5rem",
                  backgroundColor: "rgba(240, 61, 48, 0.08)",
                  border: "1px solid rgba(240, 61, 48, 0.2)",
                  color: "var(--devio-red)",
                  fontSize: "0.85rem",
                  marginBottom: "1.25rem",
                }}
              >
                {errorMessage}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="form-group" style={{ marginBottom: "1.25rem" }}>
                <label className="form-label" style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                  <Mail size={15} className="text-devio-blue" /> Correo Electrónico
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ejemplo@desarrollos.com"
                  className="form-input"
                  required
                />
              </div>

              <div className="form-group" style={{ marginBottom: "1.25rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.35rem" }}>
                  <label className="form-label" style={{ margin: 0, display: "flex", alignItems: "center", gap: "0.4rem" }}>
                    <Lock size={15} className="text-devio-blue" /> Contraseña
                  </label>
                  <a href="#" style={{ fontSize: "0.75rem", color: "var(--devio-blue)", textDecoration: "none" }}>
                    ¿Olvidaste tu contraseña?
                  </a>
                </div>
                <div style={{ position: "relative" }}>
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="form-input"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      position: "absolute",
                      right: "12px",
                      top: "50%",
                      transform: "translateY(-50%)",
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      color: "var(--devio-neutral-3)",
                    }}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1.75rem" }}>
                <input
                  type="checkbox"
                  id="remember"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  style={{ accentColor: "var(--devio-blue)", cursor: "pointer" }}
                />
                <label htmlFor="remember" style={{ fontSize: "0.85rem", color: "var(--devio-neutral-4)", cursor: "pointer" }}>
                  Mantener sesión iniciada
                </label>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="btn btn-primary"
                style={{ width: "100%", padding: "0.85rem", fontSize: "0.95rem", display: "flex", justifyContent: "center", gap: "0.5rem" }}
              >
                {isSubmitting ? "Accediendo..." : "Entrar a Devio"}
                {!isSubmitting && <ArrowRight size={18} />}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>Cargando...</div>}>
      <LoginContent />
    </Suspense>
  );
}
