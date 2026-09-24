"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Building2,
  User,
  Mail,
  Phone,
  Briefcase,
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
  ShieldCheck,
  ArrowRight,
  Sparkles,
  TrendingUp,
  FileSpreadsheet,
  Gift,
  Tag,
  BadgePercent,
} from "lucide-react";
import { INITIAL_CUSTOM_INVITES, CustomPricingInvite } from "../../data/super-admin-data";
import PhoneInput from "../../components/ui/phone-input";

function RegisterContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const inviteToken = searchParams.get("invite");

  const [activeInvite, setActiveInvite] = useState<CustomPricingInvite | null>(null);

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phoneCountry, setPhoneCountry] = useState("+52");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [roleTitle, setRoleTitle] = useState("Director General / Dueño");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // Inspect invite token
  useEffect(() => {
    if (inviteToken) {
      const found = INITIAL_CUSTOM_INVITES.find((inv) => inv.token === inviteToken);
      if (found) {
        setActiveInvite(found);
        setEmail(found.developerEmail);
      } else {
        setActiveInvite({
          id: "custom-token",
          token: inviteToken,
          developerName: "Desarrolladora VIP",
          developerEmail: "",
          pricePerUnitMonthly: 150,
          discountPercentage: 15,
          freeTrialMonths: 2,
          status: "PENDING",
          expiresAt: "Próxima expiración",
          createdAt: new Date().toLocaleDateString("es-MX"),
          linkUrl: typeof window !== "undefined" ? window.location.href : "",
        });
      }
    }
  }, [inviteToken]);

  // Validación de fuerza de contraseña
  const hasMinLength = password.length >= 8;
  const hasNumber = /\d/.test(password);
  const hasUpper = /[A-Z]/.test(password);
  const hasSpecial = /[^A-Za-z0-9]/.test(password);
  const passwordScore = [hasMinLength, hasNumber, hasUpper, hasSpecial].filter(Boolean).length;
  const passwordsMatch = password && confirmPassword && password === confirmPassword;

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, "").slice(0, 10);
    let formatted = raw;
    if (raw.length > 6) {
      formatted = `(${raw.slice(0, 3)}) ${raw.slice(3, 6)}-${raw.slice(6)}`;
    } else if (raw.length > 3) {
      formatted = `(${raw.slice(0, 3)}) ${raw.slice(3)}`;
    } else if (raw.length > 0) {
      formatted = `(${raw}`;
    }
    setPhoneNumber(formatted);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    if (!fullName || !email || !phoneNumber || !password) {
      setErrorMessage("Por favor completa todos los campos requeridos.");
      return;
    }

    if (passwordScore < 3) {
      setErrorMessage("La contraseña debe ser más segura (mínimo 8 caracteres, números y mayúsculas).");
      return;
    }

    if (!passwordsMatch) {
      setErrorMessage("Las contraseñas no coinciden.");
      return;
    }

    if (!acceptTerms) {
      setErrorMessage("Debes aceptar los Términos de Servicio y el Aviso de Privacidad.");
      return;
    }

    setIsSubmitting(true);

    const cleanEmail = email.trim().toLowerCase();
    const phoneFull = `${phoneCountry} ${phoneNumber}`;

    // 1. Enviar registro a /api/auth/register para persistir en Supabase (Prisma)
    try {
      await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName,
          email: cleanEmail,
          phone: phoneFull,
          roleTitle,
          password,
          developerName: `${fullName} Desarrollos`,
          inviteToken: activeInvite?.token,
        }),
      });
    } catch (e) {
      console.warn("Could not register in database API:", e);
    }

    // 2. Guardar información del usuario superadmin en sesión local para el flujo de onboarding
    const userSession = {
      fullName,
      email: cleanEmail,
      phone: phoneFull,
      roleTitle,
      password,
      registeredAt: new Date().toISOString(),
      inviteToken: activeInvite?.token,
    };

    if (typeof window !== "undefined") {
      localStorage.setItem("devio_user_session", JSON.stringify(userSession));
      sessionStorage.setItem("devio_user_session", JSON.stringify(userSession));
      localStorage.setItem("devio_is_new_user", "true");
      sessionStorage.setItem("devio_is_new_user", "true");
      localStorage.removeItem("devio_projects_state");
      sessionStorage.removeItem("devio_projects_state");
      localStorage.removeItem("devio_developer_onboarding");
      sessionStorage.removeItem("devio_developer_onboarding");
      
      // Guardar en catálogo de usuarios registrados
      try {
        const rawRegistered = localStorage.getItem("devio_registered_users");
        let list = rawRegistered ? JSON.parse(rawRegistered) : [];
        if (!list.some((u: any) => u.email === cleanEmail)) {
          list.push(userSession);
          localStorage.setItem("devio_registered_users", JSON.stringify(list));
        }
      } catch (e) {}

      // Cookie de autenticación para Middleware
      document.cookie = `devio_auth_token=devio_session_${Date.now()}; path=/; max-age=604800; SameSite=Lax`;

      if (activeInvite) {
        localStorage.setItem("devio_custom_pricing", JSON.stringify(activeInvite));
        sessionStorage.setItem("devio_custom_pricing", JSON.stringify(activeInvite));
      }
    }

    setTimeout(() => {
      setIsSubmitting(false);
      // Redirigir al Onboarding de Desarrolladora
      router.push("/onboarding/developer");
    }, 500);
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
        {/* Marca Devio */}
        <div>
          <Link href="/" style={{ textDecoration: "none", display: "inline-block", marginBottom: "3rem" }}>
            <img
              src="/brand/14.png"
              alt="Devio"
              style={{ height: "38px", width: "auto", objectFit: "contain" }}
            />
          </Link>

          <div style={{ maxWidth: "440px" }}>
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
              <Sparkles size={14} /> Plataforma Inmobiliaria 2026
            </span>

            <h1 style={{ fontSize: "2.25rem", fontWeight: 800, lineHeight: 1.2, color: "var(--devio-white)", marginBottom: "1.25rem" }}>
              Transforma la gestión de tus desarrollos inmobiliarios.
            </h1>

            <p style={{ color: "var(--devio-neutral-2)", fontSize: "1rem", lineHeight: 1.6, marginBottom: "2.5rem" }}>
              Crea tu cuenta de Administrador para centralizar inventarios, automatizar cobranza multi-moneda (MXN/USD) y conectar a todo tu equipo en tiempo real.
            </p>

            {/* Beneficios clave */}
            <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
              <div style={{ display: "flex", alignItems: "flex-start", gap: "0.85rem" }}>
                <div style={{ width: "32px", height: "32px", borderRadius: "0.5rem", backgroundColor: "rgba(111, 172, 156, 0.2)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--devio-green)", flexShrink: 0 }}>
                  <TrendingUp size={18} />
                </div>
                <div>
                  <h4 style={{ fontSize: "0.95rem", fontWeight: 600, color: "var(--devio-white)" }}>Cobranza Inteligente</h4>
                  <p style={{ fontSize: "0.85rem", color: "var(--devio-neutral-2)" }}>Tipo de cambio oficial Banxico al día y pasarelas SPEI automáticas.</p>
                </div>
              </div>

              <div style={{ display: "flex", alignItems: "flex-start", gap: "0.85rem" }}>
                <div style={{ width: "32px", height: "32px", borderRadius: "0.5rem", backgroundColor: "rgba(199, 178, 139, 0.2)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--devio-beige)", flexShrink: 0 }}>
                  <FileSpreadsheet size={18} />
                </div>
                <div>
                  <h4 style={{ fontSize: "0.95rem", fontWeight: 600, color: "var(--devio-white)" }}>Carga Masiva Excel</h4>
                  <p style={{ fontSize: "0.85rem", color: "var(--devio-neutral-2)" }}>Plantillas inteligentes con mapeo dinámico de columnas personalizadas.</p>
                </div>
              </div>

              <div style={{ display: "flex", alignItems: "flex-start", gap: "0.85rem" }}>
                <div style={{ width: "32px", height: "32px", borderRadius: "0.5rem", backgroundColor: "rgba(87, 122, 139, 0.2)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--devio-blue-matte)", flexShrink: 0 }}>
                  <ShieldCheck size={18} />
                </div>
                <div>
                  <h4 style={{ fontSize: "0.95rem", fontWeight: 600, color: "var(--devio-white)" }}>Permisos Granulares</h4>
                  <p style={{ fontSize: "0.85rem", color: "var(--devio-neutral-2)" }}>Control total de acceso para ventas, cobranza, legal y dirección.</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer lateral */}
        <div style={{ borderTop: "1px solid rgba(255, 255, 255, 0.1)", paddingTop: "1.5rem", display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.8rem", color: "var(--devio-neutral-3)" }}>
          <span>© 2026 Devio Inc.</span>
          <span>Soporte: soporte@devio.mx</span>
        </div>
      </div>

      {/* PANEL DERECHO CON FORMULARIO */}
      <div
        style={{
          flex: 1.2,
          padding: "3rem 2rem",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          overflowY: "auto",
        }}
      >
        <div style={{ width: "100%", maxWidth: "520px" }}>
          {/* Header Superior Móvil & Enlace a Login */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" }}>
            <Link href="/" style={{ textDecoration: "none", display: "flex", alignItems: "center" }}>
              <img
                src="/brand/13.png"
                alt="Devio"
                style={{ height: "32px", width: "auto", objectFit: "contain" }}
              />
            </Link>

            <div style={{ fontSize: "0.85rem", color: "var(--devio-neutral-3)" }}>
              ¿Ya tienes cuenta?{" "}
              <Link href="/login" style={{ color: "var(--devio-blue)", fontWeight: 600, textDecoration: "none" }}>
                Iniciar Sesión
              </Link>
            </div>
          </div>

          <div style={{ backgroundColor: "var(--devio-white)", padding: "2.5rem", borderRadius: "1.25rem", boxShadow: "0 10px 40px rgba(0, 0, 0, 0.04)", border: "1px solid var(--devio-border)" }}>
            
            {/* VIP INVITATION BANNER */}
            {activeInvite && (
              <div
                style={{
                  backgroundColor: "rgba(0, 196, 140, 0.08)",
                  border: "1.5px solid #00C48C",
                  borderRadius: "0.85rem",
                  padding: "1rem 1.15rem",
                  marginBottom: "1.5rem",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.4rem" }}>
                  <Gift size={18} color="#00C48C" />
                  <strong style={{ fontSize: "0.88rem", color: "#1B3047" }}>
                    Invitación VIP Activada &bull; {activeInvite.developerName}
                  </strong>
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem", fontSize: "0.78rem", color: "#475569" }}>
                  <span style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
                    <Tag size={13} color="#2F80ED" />
                    Tarifa Especial: <strong>${activeInvite.pricePerUnitMonthly} MXN</strong> / unidad / mes
                  </span>
                  <span style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
                    <BadgePercent size={13} color="#00C48C" />
                    <strong>{activeInvite.freeTrialMonths} Meses</strong> de prueba gratis
                  </span>
                </div>
              </div>
            )}

            <h2 style={{ fontSize: "1.5rem", fontWeight: 700, color: "var(--devio-blue-dark)", marginBottom: "0.35rem" }}>
              Registro de Administrador
            </h2>
            <p style={{ fontSize: "0.875rem", color: "var(--devio-neutral-3)", marginBottom: "1.75rem" }}>
              Ingresa tus datos personales para activar la cuenta de tu desarrolladora.
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
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                }}
              >
                <span>{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleSubmit}>
              {/* Nombre Completo */}
              <div className="form-group" style={{ marginBottom: "1.1rem" }}>
                <label className="form-label" style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                  <User size={15} className="text-devio-blue" /> Nombre Completo *
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Ej. Alejandro Martínez Garza"
                  className="form-input"
                  required
                />
              </div>

              {/* Correo Electrónico */}
              <div className="form-group" style={{ marginBottom: "1.1rem" }}>
                <label className="form-label" style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                  <Mail size={15} className="text-devio-blue" /> Correo Electrónico Corporativo *
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="alejandro@desarrollos.com"
                  className="form-input"
                  required
                />
              </div>

              {/* Teléfono & Cargo */}
              <div className="grid-cols-2" style={{ gap: "1rem", marginBottom: "1.1rem" }}>
                <div className="form-group">
                  <label className="form-label" style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                    <Phone size={15} className="text-devio-blue" /> Teléfono Móvil *
                  </label>
                  <PhoneInput
                    countryCode={phoneCountry}
                    phoneNumber={phoneNumber}
                    onChange={(_full, code, num) => {
                      setPhoneCountry(code);
                      setPhoneNumber(num);
                    }}
                    placeholder="(81) 1234-5678"
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                    <Briefcase size={15} className="text-devio-blue" /> Cargo en la Empresa *
                  </label>
                  <select
                    value={roleTitle}
                    onChange={(e) => setRoleTitle(e.target.value)}
                    className="form-select"
                  >
                    <option value="Director General / Dueño">Director General / Dueño</option>
                    <option value="Director Comercial">Director Comercial</option>
                    <option value="Gerente de Ventas">Gerente de Ventas</option>
                    <option value="Administrador Financiero">Administrador Financiero</option>
                    <option value="Director de Operaciones">Director de Operaciones</option>
                    <option value="Asesor Legal">Asesor Legal</option>
                  </select>
                </div>
              </div>

              {/* Contraseña */}
              <div className="form-group" style={{ marginBottom: "1.1rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.35rem" }}>
                  <label className="form-label" style={{ margin: 0, display: "flex", alignItems: "center", gap: "0.4rem" }}>
                    <Lock size={15} className="text-devio-blue" /> Contraseña Segura *
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{ background: "none", border: "none", cursor: "pointer", fontSize: "0.75rem", color: "var(--devio-neutral-3)", display: "flex", alignItems: "center", gap: "0.25rem" }}
                  >
                    {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                    {showPassword ? "Ocultar" : "Mostrar"}
                  </button>
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Mínimo 8 caracteres"
                  className="form-input"
                  required
                />

                {/* Medidor de Fuerza de Contraseña */}
                {password.length > 0 && (
                  <div style={{ marginTop: "0.5rem" }}>
                    <div style={{ display: "flex", gap: "0.25rem", height: "4px", marginBottom: "0.35rem" }}>
                      <div style={{ flex: 1, borderRadius: "2px", backgroundColor: passwordScore >= 1 ? "var(--devio-red)" : "var(--devio-neutral-1)" }} />
                      <div style={{ flex: 1, borderRadius: "2px", backgroundColor: passwordScore >= 2 ? "var(--devio-yellow)" : "var(--devio-neutral-1)" }} />
                      <div style={{ flex: 1, borderRadius: "2px", backgroundColor: passwordScore >= 3 ? "var(--devio-green)" : "var(--devio-neutral-1)" }} />
                      <div style={{ flex: 1, borderRadius: "2px", backgroundColor: passwordScore >= 4 ? "var(--devio-blue)" : "var(--devio-neutral-1)" }} />
                    </div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem", fontSize: "0.75rem", color: "var(--devio-neutral-3)" }}>
                      <span style={{ color: hasMinLength ? "var(--devio-green)" : "var(--devio-neutral-3)" }}>
                        {hasMinLength ? "✓" : "•"} 8+ carácteres
                      </span>
                      <span style={{ color: hasNumber ? "var(--devio-green)" : "var(--devio-neutral-3)" }}>
                        {hasNumber ? "✓" : "•"} Número
                      </span>
                      <span style={{ color: hasUpper ? "var(--devio-green)" : "var(--devio-neutral-3)" }}>
                        {hasUpper ? "✓" : "•"} Mayúscula
                      </span>
                      <span style={{ color: hasSpecial ? "var(--devio-green)" : "var(--devio-neutral-3)" }}>
                        {hasSpecial ? "✓" : "•"} Símbolo
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Confirmar Contraseña */}
              <div className="form-group" style={{ marginBottom: "1.5rem" }}>
                <label className="form-label" style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                  <Lock size={15} className="text-devio-blue" /> Confirmar Contraseña *
                </label>
                <input
                  type={showPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repite tu contraseña"
                  className="form-input"
                  required
                />
                {confirmPassword.length > 0 && (
                  <div style={{ marginTop: "0.35rem", fontSize: "0.75rem", color: passwordsMatch ? "var(--devio-green)" : "var(--devio-red)" }}>
                    {passwordsMatch ? "✓ Las contraseñas coinciden" : "✕ Las contraseñas no coinciden"}
                  </div>
                )}
              </div>

              {/* Aceptación de Términos */}
              <div style={{ display: "flex", alignItems: "flex-start", gap: "0.6rem", marginBottom: "1.75rem" }}>
                <input
                  type="checkbox"
                  id="terms"
                  checked={acceptTerms}
                  onChange={(e) => setAcceptTerms(e.target.checked)}
                  style={{ marginTop: "0.2rem", accentColor: "var(--devio-blue)", cursor: "pointer" }}
                />
                <label htmlFor="terms" style={{ fontSize: "0.8rem", color: "var(--devio-neutral-4)", cursor: "pointer", lineHeight: 1.4 }}>
                  Acepto los <a href="#" style={{ color: "var(--devio-blue)", fontWeight: 600 }}>Términos de Servicio</a> y el <a href="#" style={{ color: "var(--devio-blue)", fontWeight: 600 }}>Aviso de Privacidad</a> de Devio.
                </label>
              </div>

              {/* Botón de Registro */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="btn btn-primary"
                style={{ width: "100%", padding: "0.85rem", fontSize: "0.95rem", display: "flex", justifyContent: "center", gap: "0.5rem" }}
              >
                {isSubmitting ? "Creando cuenta..." : "Crear cuenta y configurar desarrolladora"}
                {!isSubmitting && <ArrowRight size={18} />}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<div style={{ padding: "3rem", textAlign: "center", color: "#64748B" }}>Cargando portal de registro...</div>}>
      <RegisterContent />
    </Suspense>
  );
}
