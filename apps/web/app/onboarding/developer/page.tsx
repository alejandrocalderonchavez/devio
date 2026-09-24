"use client";

import React, { useState, useRef } from "react";
import Link from "next/link";
import PhoneInput from "../../../components/ui/phone-input";
import {
  Building2,
  FileText,
  Phone,
  Mail,
  Globe,
  AtSign,
  MapPin,
  Users,
  Plus,
  Trash2,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Upload,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  X,
  UserCheck,
  AlertCircle,
  Image as ImageIcon,
  BarChart3,
  ShoppingBag,
  CreditCard,
  HardHat,
  Home,
  Building,
  Settings,
} from "lucide-react";
import {
  UserRole,
  PermissionKey,
  PERMISSIONS_CATALOG,
  DEFAULT_ROLE_PERMISSIONS,
  ALL_PERMISSION_KEYS,
  togglePermissionWithCascade,
  toggleModuleAllPermissions,
  getRolePermissionsMap,
} from "../../../lib/permissions";

interface TeamMember {
  id?: string;
  fullName: string;
  email: string;
  role: UserRole;
  permissions: string[];
}

export default function DeveloperOnboardingPage() {
  const [step, setStep] = useState<number>(1);
  const [errorMsg, setErrorMsg] = useState<string>("");
  const logoInputRef = useRef<HTMLInputElement>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [logoFileName, setLogoFileName] = useState<string>("");
  const [logoFileSize, setLogoFileSize] = useState<string>("");

  const [formData, setFormData] = useState({
    name: "",
    legalName: "",
    taxId: "", // Optional RFC
    phoneCountryCode: "+52",
    phoneNumber: "",
    email: "",
    website: "",
    instagram: "",
    addressLine1: "",
    addressLine2: "",
    neighborhood: "",
    city: "",
    state: "",
    postalCode: "",
    country: "MEX",
    description: "",
    logoUrl: "",
  });

  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);

  // Handle Logo File Picker
  const handleLogoFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    setErrorMsg("");
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.includes("png")) {
      setErrorMsg("El logo de la desarrolladora debe ser en formato PNG.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setErrorMsg("El archivo excede el tamaño máximo permitido de 5MB.");
      return;
    }

    setLogoFileName(file.name);
    setLogoFileSize((file.size / (1024 * 1024)).toFixed(2) + " MB");

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      setLogoPreview(result);
      setFormData((prev) => ({ ...prev, logoUrl: result }));
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveLogo = (e: React.MouseEvent) => {
    e.stopPropagation();
    setLogoPreview(null);
    setLogoFileName("");
    setLogoFileSize("");
    setFormData((prev) => ({ ...prev, logoUrl: "" }));
    if (logoInputRef.current) {
      logoInputRef.current.value = "";
    }
  };

  // Trigger Smooth Scroll and Focus to Missing Field
  const triggerFieldError = (fieldId: string, error: string, targetStep: number) => {
    setErrorMsg(error);
    if (step !== targetStep) {
      setStep(targetStep);
    }
    setTimeout(() => {
      const el = document.getElementById(fieldId);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
        el.focus();
        el.classList.add("devio-field-error-highlight");
        setTimeout(() => {
          el.classList.remove("devio-field-error-highlight");
        }, 3000);
      }
    }, 120);
  };

  // Step Validation Functions with Target Field IDs
  const validateStep = (stepNumber: number): { error: string; fieldId: string } | null => {
    if (stepNumber === 1) {
      if (!formData.name.trim()) {
        return { error: "Por favor ingresa el Nombre Comercial de la Desarrolladora.", fieldId: "dev_input_name" };
      }
      if (!logoPreview && !formData.logoUrl) {
        return { error: "Por favor sube el Logo oficial de la Desarrolladora (Solo PNG).", fieldId: "dev_input_logo_box" };
      }
    } else if (stepNumber === 2) {
      if (!formData.legalName.trim()) {
        return { error: "Por favor ingresa la Razón Social de la empresa.", fieldId: "dev_input_legalName" };
      }
      if (!formData.addressLine1.trim()) {
        return { error: "Por favor ingresa la Calle y Número.", fieldId: "dev_input_addressLine1" };
      }
      if (!formData.neighborhood.trim()) {
        return { error: "Por favor ingresa la Colonia.", fieldId: "dev_input_neighborhood" };
      }
      if (!formData.city.trim()) {
        return { error: "Por favor ingresa la Ciudad / Municipio.", fieldId: "dev_input_city" };
      }
      if (!formData.state.trim()) {
        return { error: "Por favor ingresa el Estado.", fieldId: "dev_input_state" };
      }
      if (!formData.postalCode.trim()) {
        return { error: "Por favor ingresa el Código Postal.", fieldId: "dev_input_postalCode" };
      }
    } else if (stepNumber === 3) {
      if (!formData.phoneNumber.trim()) {
        return { error: "Por favor ingresa el Teléfono de Contacto Oficial.", fieldId: "dev_input_phoneNumber" };
      }
      if (!formData.email.trim()) {
        return { error: "Por favor ingresa el Correo Electrónico Oficial.", fieldId: "dev_input_email" };
      }
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        return { error: "Por favor ingresa un correo electrónico válido.", fieldId: "dev_input_email" };
      }
    } else if (stepNumber === 4) {
      if (teamMembers.length === 0) {
        return { error: "Debes tener al menos un usuario registrado en el equipo.", fieldId: "dev_btn_add_user" };
      }
    }
    return null;
  };

  const goToStep = (targetStep: number) => {
    if (targetStep > step) {
      // Validate all intermediate steps
      for (let s = step; s < targetStep; s++) {
        const result = validateStep(s);
        if (result) {
          triggerFieldError(result.fieldId, result.error, s);
          return;
        }
      }
    }
    setErrorMsg("");
    setStep(targetStep);
  };

  // Modal State for adding user
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [modalUserData, setModalUserData] = useState<{
    fullName: string;
    email: string;
    role: UserRole;
    showAdvanced: boolean;
    permissionsState: Record<string, boolean>;
  }>({
    fullName: "",
    email: "",
    role: "Asesor de Ventas",
    showAdvanced: true,
    permissionsState: getRolePermissionsMap("Asesor de Ventas"),
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setErrorMsg("");
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleOpenUserModal = () => {
    setModalUserData({
      fullName: "",
      email: "",
      role: "Asesor de Ventas",
      showAdvanced: true,
      permissionsState: getRolePermissionsMap("Asesor de Ventas"),
    });
    setIsUserModalOpen(true);
  };

  const handleModalRoleChange = (role: UserRole) => {
    setModalUserData((prev) => ({
      ...prev,
      role,
      permissionsState: getRolePermissionsMap(role),
    }));
  };

  const handlePermissionToggle = (key: PermissionKey) => {
    setModalUserData((prev) => ({
      ...prev,
      permissionsState: togglePermissionWithCascade(prev.permissionsState, key),
    }));
  };

  const handleToggleCategory = (catId: string, selectAll: boolean) => {
    setModalUserData((prev) => ({
      ...prev,
      permissionsState: toggleModuleAllPermissions(prev.permissionsState, catId, selectAll),
    }));
  };

  const handleSaveUserFromModal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!modalUserData.fullName.trim() || !modalUserData.email.trim()) return;

    const isSuperAdmin = modalUserData.role === "Super Admin";
    const activePerms = isSuperAdmin
      ? ["all"]
      : (Object.keys(modalUserData.permissionsState).filter(
          (k) => modalUserData.permissionsState[k]
        ) as PermissionKey[]);

    setTeamMembers((prev) => [
      ...prev,
      {
        id: `usr-onb-${Date.now()}`,
        fullName: modalUserData.fullName.trim(),
        email: modalUserData.email.trim(),
        role: modalUserData.role,
        permissions: activePerms,
      },
    ]);
    setIsUserModalOpen(false);
  };

  const removeTeamMember = (index: number) => {
    const target = teamMembers[index];
    if (target && (target.role === "Super Admin" || target.role?.toLowerCase().includes("super admin"))) {
      alert("El Super Admin es el usuario principal de la desarrolladora y no puede ser eliminado.");
      return;
    }
    setTeamMembers((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    for (let s = 1; s <= 4; s++) {
      const result = validateStep(s);
      if (result) {
        triggerFieldError(result.fieldId, result.error, s);
        return;
      }
    }

    setIsSubmitting(true);

    if (typeof window !== "undefined") {
      const fullDeveloperData = {
        ...formData,
        logoName: logoFileName || (formData.logoUrl ? "logo-desarrolladora.png" : ""),
        teamMembers: teamMembers,
      };
      localStorage.setItem("devio_developer_onboarding", JSON.stringify(fullDeveloperData));
      sessionStorage.setItem("devio_developer_onboarding", JSON.stringify(fullDeveloperData));
      localStorage.setItem("devio_team_members", JSON.stringify(teamMembers));
      sessionStorage.setItem("devio_team_members", JSON.stringify(teamMembers));
      localStorage.setItem("devio_is_new_user", "true");
      sessionStorage.setItem("devio_is_new_user", "true");
      localStorage.setItem("devio_projects_state", JSON.stringify([]));
      sessionStorage.setItem("devio_projects_state", JSON.stringify([]));

      // Persist to devio_system_users
      const systemUsersToSave = [
        {
          id: "usr-admin",
          name: formData.name ? `${formData.name} Admin` : "Administrador Principal",
          email: formData.email,
          role: "Super Admin" as UserRole,
          status: "ACTIVO" as const,
          permissions: ["all"],
        },
        ...teamMembers.map((m, idx) => ({
          id: m.id || `usr-onb-${idx + 1}`,
          name: m.fullName,
          email: m.email,
          role: m.role,
          status: "INVITADO" as const,
          permissions: m.permissions,
        })),
      ];
      localStorage.setItem("devio_system_users", JSON.stringify(systemUsersToSave));
      sessionStorage.setItem("devio_system_users", JSON.stringify(systemUsersToSave));

      // Also persist user profile if not set
      const existingUser = localStorage.getItem("devio_user_session") || sessionStorage.getItem("devio_user_session");
      if (!existingUser) {
        const initialUser = {
          fullName: formData.name ? `${formData.name} Admin` : "Administrador",
          email: formData.email,
          role: "Super Admin",
        };
        localStorage.setItem("devio_user_session", JSON.stringify(initialUser));
        sessionStorage.setItem("devio_user_session", JSON.stringify(initialUser));
      }

      let existingDevId = "";
      let userEmail = "";
      try {
        const parsedU = existingUser ? JSON.parse(existingUser) : null;
        userEmail = parsedU?.email || "";
        existingDevId = parsedU?.developer?.id || "";
      } catch (e) {}

      if (!existingDevId) {
        try {
          const rawDev = localStorage.getItem("devio_developer_onboarding");
          if (rawDev) existingDevId = JSON.parse(rawDev)?.id || "";
        } catch (e) {}
      }

      // Persistir inmediatamente en Supabase (Prisma)
      fetch("/api/developers", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: existingDevId || undefined,
          userEmail: userEmail || undefined,
          tradeName: formData.name,
          legalName: formData.legalName,
          rfc: formData.taxId,
          addressStreet: formData.addressLine1,
          addressCol: formData.neighborhood,
          city: formData.city,
          state: formData.state,
          zipCode: formData.postalCode,
          phone: formData.phoneNumber,
          contactEmail: formData.email,
          logoUrl: formData.logoUrl,
          teamMembers: teamMembers,
        }),
      }).catch((err) => console.warn("Could not persist onboarding developer:", err));
    }

    setTimeout(() => {
      setIsSubmitting(false);
      setIsSuccess(true);
    }, 900);
  };

  if (isSuccess) {
    return (
      <div style={{ maxWidth: "720px", margin: "4rem auto", padding: "0 1.5rem" }}>
        <div className="card" style={{ textAlign: "center", padding: "3.5rem 2.5rem" }}>
          <div
            style={{
              width: "70px",
              height: "70px",
              borderRadius: "50%",
              backgroundColor: "rgba(111, 172, 156, 0.15)",
              color: "var(--devio-green)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 1.5rem",
            }}
          >
            <CheckCircle2 size={40} />
          </div>
          <h1 style={{ fontSize: "2rem", marginBottom: "1rem", color: "var(--devio-blue-dark)" }}>
            ¡Bienvenido a Devio!
          </h1>
          <p style={{ fontSize: "1.05rem", color: "var(--devio-neutral-4)", fontWeight: 500, marginBottom: "0.75rem", lineHeight: 1.6 }}>
            Has dado el primer paso para transformar la manera en que gestionas tus desarrollos inmobiliarios.
          </p>
          <p style={{ color: "var(--text-muted)", marginBottom: "2.5rem", fontSize: "0.95rem", lineHeight: 1.6 }}>
            Desde aquí podrás centralizar tu información, automatizar tu cobranza y dar transparencia a tus clientes.
          </p>

          <div style={{ display: "flex", gap: "1rem", justifyContent: "center", flexWrap: "wrap" }}>
            <Link href="/dashboard" className="btn btn-primary" style={{ padding: "0.85rem 1.85rem", fontSize: "0.95rem" }}>
              Ir al Dashboard Principal <ArrowRight size={16} />
            </Link>
            <Link href="/onboarding/project" className="btn btn-secondary" style={{ padding: "0.85rem 1.75rem", fontSize: "0.95rem" }}>
              Crear tu Primer Proyecto
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: "880px", margin: "2.5rem auto", padding: "0 1.5rem" }}>
      {/* Header */}
      <div style={{ marginBottom: "2rem", textAlign: "center" }}>
        <div style={{ display: "flex", justifyContent: "center", marginBottom: "1.25rem" }}>
          <Link href="/dashboard">
            <img
              src="/brand/13.png"
              alt="Devio"
              style={{ height: "36px", width: "auto", objectFit: "contain" }}
            />
          </Link>
        </div>
        <div style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.75rem" }}>
          <span className="badge badge-info">Onboarding de Desarrolladora</span>
        </div>
        <h1 style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>Registro de Desarrolladora</h1>
        <p style={{ color: "var(--text-muted)", fontSize: "0.95rem" }}>
          Configura los datos de tu empresa y el equipo inicial con sus permisos.
        </p>
      </div>

      {/* Steps Indicator */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginBottom: "1.5rem",
        }}
      >
        {[
          { num: 1, label: "1. Identidad", icon: Building2 },
          { num: 2, label: "2. Fiscal y Dirección", icon: FileText },
          { num: 3, label: "3. Contacto & Redes", icon: Globe },
          { num: 4, label: "4. Equipo & Permisos", icon: Users },
        ].map((item) => {
          const Icon = item.icon;
          const isActive = step === item.num;
          const isCompleted = step > item.num;

          return (
            <div
              key={item.num}
              onClick={() => goToStep(item.num)}
              style={{
                flex: 1,
                textAlign: "center",
                cursor: "pointer",
                paddingBottom: "0.75rem",
                borderBottom: `3px solid ${
                  isActive ? "var(--devio-blue)" : isCompleted ? "var(--devio-green)" : "var(--devio-neutral-1)"
                }`,
              }}
            >
              <span
                style={{
                  fontSize: "0.8125rem",
                  fontWeight: isActive ? 700 : 500,
                  color: isActive ? "var(--devio-blue)" : isCompleted ? "var(--devio-green)" : "var(--devio-neutral-3)",
                }}
              >
                {item.label}
              </span>
            </div>
          );
        })}
      </div>

      {/* Error Alert Banner */}
      {errorMsg && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.75rem",
            padding: "0.85rem 1.25rem",
            backgroundColor: "#FEF2F2",
            border: "1px solid #F87171",
            borderRadius: "0.5rem",
            color: "#B91C1C",
            marginBottom: "1.5rem",
            fontSize: "0.875rem",
            fontWeight: 500,
          }}
        >
          <AlertCircle size={20} style={{ flexShrink: 0 }} />
          <span>{errorMsg}</span>
          <button
            type="button"
            onClick={() => setErrorMsg("")}
            style={{
              marginLeft: "auto",
              background: "none",
              border: "none",
              color: "#B91C1C",
              cursor: "pointer",
              padding: "0.2rem",
            }}
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Form Card */}
      <div className="card">
        <form onSubmit={handleSubmit}>
          {/* STEP 1: IDENTIDAD */}
          {step === 1 && (
            <div>
              <h2 style={{ fontSize: "1.25rem", marginBottom: "1.5rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <Building2 size={20} color="var(--devio-blue)" /> Identidad Corporativa
              </h2>

              <div className="grid-cols-2">
                <div className="form-group">
                  <label className="form-label">Nombre Comercial de la Desarrolladora *</label>
                  <input
                    id="dev_input_name"
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="Ej. Grupo Inmobiliario Altum"
                    className="form-input"
                    required
                  />
                  <span className="form-hint">Nombre de marca visible para los clientes.</span>
                </div>

                <div className="form-group">
                  <label className="form-label">Logo de la Desarrolladora (Solo PNG) *</label>
                  <input
                    type="file"
                    ref={logoInputRef}
                    onChange={handleLogoFileSelect}
                    accept="image/png"
                    style={{ display: "none" }}
                  />

                  {logoPreview ? (
                    <div
                      id="dev_input_logo_box"
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "0.75rem 1rem",
                        border: "1px solid var(--border-subtle)",
                        borderRadius: "0.5rem",
                        backgroundColor: "var(--bg-page)",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "0.85rem" }}>
                        <div
                          style={{
                            width: "48px",
                            height: "48px",
                            borderRadius: "0.4rem",
                            border: "1px solid var(--border-subtle)",
                            backgroundColor: "#ffffff",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            overflow: "hidden",
                          }}
                        >
                          <img
                            src={logoPreview}
                            alt="Logo preview"
                            style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }}
                          />
                        </div>
                        <div>
                          <p style={{ fontSize: "0.8125rem", fontWeight: 600, color: "var(--devio-blue-dark)", margin: 0 }}>
                            {logoFileName || "logo-desarrolladora.png"}
                          </p>
                          <span style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>
                            {logoFileSize || "PNG"} • <button type="button" onClick={() => logoInputRef.current?.click()} style={{ background: "none", border: "none", color: "var(--devio-blue)", cursor: "pointer", padding: 0, textDecoration: "underline", fontSize: "0.72rem" }}>Cambiar archivo</button>
                          </span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={handleRemoveLogo}
                        style={{
                          background: "none",
                          border: "none",
                          color: "var(--devio-red)",
                          cursor: "pointer",
                          padding: "0.4rem",
                          borderRadius: "0.3rem",
                        }}
                        title="Eliminar logo"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ) : (
                    <div
                      id="dev_input_logo_box"
                      tabIndex={0}
                      onClick={() => logoInputRef.current?.click()}
                      style={{
                        border: "2px dashed var(--devio-neutral-2)",
                        borderRadius: "0.5rem",
                        padding: "1rem",
                        textAlign: "center",
                        backgroundColor: "var(--bg-page)",
                        cursor: "pointer",
                        transition: "all 0.2s ease",
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.borderColor = "var(--devio-blue)")}
                      onMouseLeave={(e) => (e.currentTarget.style.borderColor = "var(--devio-neutral-2)")}
                    >
                      <Upload size={22} color="var(--devio-blue-matte)" style={{ margin: "0 auto 0.4rem" }} />
                      <p style={{ fontSize: "0.8125rem", color: "var(--devio-neutral-4)", fontWeight: 600, margin: 0 }}>
                        Click para seleccionar archivo PNG
                      </p>
                      <span style={{ fontSize: "0.75rem", color: "var(--devio-neutral-3)", display: "block", marginTop: "0.2rem" }}>
                        Solo .PNG (fondo transparente recomendado, máx 5MB)
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Descripción de la Empresa</label>
                <textarea
                  id="dev_input_description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Breve reseña o lema de la empresa desarrolladora..."
                  className="form-textarea"
                  rows={3}
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "1.5rem" }}>
                <button type="button" onClick={() => goToStep(2)} className="btn btn-primary">
                  Continuar a Fiscal y Dirección <ArrowRight size={16} />
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: FISCAL Y DIRECCIÓN */}
          {step === 2 && (
            <div>
              <h2 style={{ fontSize: "1.25rem", marginBottom: "1.5rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <FileText size={20} color="var(--devio-blue)" /> Información Fiscal y Domicilio
              </h2>

              <div className="grid-cols-2">
                <div className="form-group">
                  <label className="form-label">Razón Social *</label>
                  <input
                    id="dev_input_legalName"
                    type="text"
                    name="legalName"
                    value={formData.legalName}
                    onChange={handleInputChange}
                    placeholder="Ej. Desarrollos Inmobiliarios Altum S.A. de C.V."
                    className="form-input"
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">RFC (Registro Federal de Contribuyentes) — Opcional</label>
                  <input
                    id="dev_input_taxId"
                    type="text"
                    name="taxId"
                    value={formData.taxId}
                    onChange={handleInputChange}
                    placeholder="Ej. DAL190520AB3 (opcional)"
                    className="form-input"
                  />
                  <span className="form-hint">Puedes completarlo o editarlo más adelante.</span>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Calle y Número Exterior / Interior *</label>
                <input
                  id="dev_input_addressLine1"
                  type="text"
                  name="addressLine1"
                  value={formData.addressLine1}
                  onChange={handleInputChange}
                  placeholder="Av. Paseo de los Virreyes 120, Piso 4"
                  className="form-input"
                  required
                />
              </div>

              <div className="grid-cols-3">
                <div className="form-group">
                  <label className="form-label">Colonia *</label>
                  <input
                    id="dev_input_neighborhood"
                    type="text"
                    name="neighborhood"
                    value={formData.neighborhood}
                    onChange={handleInputChange}
                    placeholder="Puerta de Hierro"
                    className="form-input"
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Ciudad / Municipio *</label>
                  <input
                    id="dev_input_city"
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleInputChange}
                    placeholder="Zapopan"
                    className="form-input"
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Estado *</label>
                  <input
                    id="dev_input_state"
                    type="text"
                    name="state"
                    value={formData.state}
                    onChange={handleInputChange}
                    placeholder="Jalisco"
                    className="form-input"
                    required
                  />
                </div>
              </div>

              <div className="grid-cols-2">
                <div className="form-group">
                  <label className="form-label">Código Postal *</label>
                  <input
                    id="dev_input_postalCode"
                    type="text"
                    name="postalCode"
                    value={formData.postalCode}
                    onChange={handleInputChange}
                    placeholder="45116"
                    className="form-input"
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">País</label>
                  <input
                    type="text"
                    name="country"
                    value="México"
                    disabled
                    className="form-input"
                    style={{ backgroundColor: "var(--devio-neutral-1)" }}
                  />
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", marginTop: "1.5rem" }}>
                <button type="button" onClick={() => goToStep(1)} className="btn btn-outline">
                  <ArrowLeft size={16} /> Anterior
                </button>
                <button type="button" onClick={() => goToStep(3)} className="btn btn-primary">
                  Continuar a Contacto <ArrowRight size={16} />
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: CONTACTO Y REDES */}
          {step === 3 && (
            <div>
              <h2 style={{ fontSize: "1.25rem", marginBottom: "1.5rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <Globe size={20} color="var(--devio-blue)" /> Contacto y Presencia Digital
              </h2>

              <div className="grid-cols-2">
                <div className="form-group">
                  <label className="form-label">Teléfono de Contacto Oficial *</label>
                  <PhoneInput
                    id="dev_input_phoneNumber"
                    name="phoneNumber"
                    countryCode={formData.phoneCountryCode}
                    phoneNumber={formData.phoneNumber}
                    onChange={(_full, code, num) => {
                      setFormData((prev) => ({
                        ...prev,
                        phoneCountryCode: code,
                        phoneNumber: num,
                      }));
                    }}
                    required
                  />
                  <span className="form-hint">Formato a 10 dígitos.</span>
                </div>

                <div className="form-group">
                  <label className="form-label">Correo Electrónico Oficial *</label>
                  <input
                    id="dev_input_email"
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="contacto@altum.mx"
                    className="form-input"
                    required
                  />
                </div>
              </div>

              <div className="grid-cols-2">
                <div className="form-group">
                  <label className="form-label">Página Web</label>
                  <input
                    id="dev_input_website"
                    type="url"
                    name="website"
                    value={formData.website}
                    onChange={handleInputChange}
                    placeholder="https://altum.mx"
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Instagram</label>
                  <input
                    id="dev_input_instagram"
                    type="text"
                    name="instagram"
                    value={formData.instagram}
                    onChange={handleInputChange}
                    placeholder="@altuminmobiliaria"
                    className="form-input"
                  />
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", marginTop: "1.5rem" }}>
                <button type="button" onClick={() => goToStep(2)} className="btn btn-outline">
                  <ArrowLeft size={16} /> Anterior
                </button>
                <button type="button" onClick={() => goToStep(4)} className="btn btn-primary">
                  Continuar a Equipo & Permisos <ArrowRight size={16} />
                </button>
              </div>
            </div>
          )}

          {/* STEP 4: EQUIPO Y MODAL DE PERMISOS DETALLADOS */}
          {step === 4 && (
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.5rem" }}>
                <div>
                  <h2 style={{ fontSize: "1.25rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <Users size={20} color="var(--devio-blue)" /> Equipo de la Desarrolladora
                  </h2>
                  <p style={{ fontSize: "0.8125rem", color: "var(--text-muted)", marginTop: "0.25rem" }}>
                    Añade usuarios para que tengan acceso a la plataforma con permisos granulares.
                  </p>
                </div>
                <button
                  id="dev_btn_add_user"
                  type="button"
                  onClick={handleOpenUserModal}
                  className="btn btn-secondary"
                  style={{ fontSize: "0.8125rem", padding: "0.5rem 1rem" }}
                >
                  <Plus size={16} /> Añadir Usuario
                </button>
              </div>

              {/* Users List */}
              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", marginBottom: "1.5rem" }}>
                {teamMembers.map((member, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "1rem 1.25rem",
                      backgroundColor: "var(--bg-page)",
                      border: "1px solid var(--border-subtle)",
                      borderRadius: "0.75rem",
                    }}
                  >
                    <div>
                      <h4 style={{ fontSize: "0.95rem", color: "var(--devio-blue-dark)", margin: 0 }}>
                        {member.fullName}
                      </h4>
                      <p style={{ fontSize: "0.8125rem", color: "var(--text-muted)", margin: "0.2rem 0 0" }}>
                        {member.email} • <span className="badge badge-info" style={{ fontSize: "0.7rem" }}>{member.role}</span>
                      </p>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                      <span style={{ fontSize: "0.75rem", color: "var(--devio-green)", fontWeight: 600 }}>
                        Acceso listo para despacho
                      </span>
                      {teamMembers.length > 1 && !(member.role === "Super Admin" || member.role?.toLowerCase().includes("super admin")) && (
                        <button
                          type="button"
                          onClick={() => removeTeamMember(idx)}
                          style={{
                            background: "none",
                            border: "none",
                            color: "var(--devio-red)",
                            cursor: "pointer",
                          }}
                          title="Eliminar colaborador"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div
                style={{
                  display: "flex",
                  gap: "0.75rem",
                  alignItems: "center",
                  padding: "0.85rem 1.25rem",
                  backgroundColor: "rgba(31, 54, 82, 0.04)",
                  borderRadius: "0.5rem",
                  border: "1px solid rgba(31, 54, 82, 0.1)",
                  marginBottom: "1.5rem",
                }}
              >
                <ShieldCheck size={20} color="var(--devio-blue)" />
                <span style={{ fontSize: "0.8125rem", color: "var(--devio-neutral-4)" }}>
                  Al completar el registro, los usuarios recibirán su correo oficial con credenciales de acceso.
                </span>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", marginTop: "1.5rem" }}>
                <button type="button" onClick={() => goToStep(3)} className="btn btn-outline">
                  <ArrowLeft size={16} /> Anterior
                </button>
                <button type="submit" disabled={isSubmitting} className="btn btn-primary">
                  {isSubmitting ? "Finalizando..." : "Completar Registro de Desarrolladora"} <CheckCircle2 size={16} />
                </button>
              </div>
            </div>
          )}
        </form>
      </div>

      {/* MODAL: AÑADE USUARIOS (FOTO 1) */}
      {isUserModalOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(22, 43, 63, 0.6)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: "1rem",
          }}
        >
          <div
            style={{
              backgroundColor: "var(--devio-white)",
              borderRadius: "1rem",
              width: "100%",
              maxWidth: "760px",
              maxHeight: "90vh",
              overflowY: "auto",
              padding: "2rem",
              boxShadow: "0 20px 60px rgba(0, 0, 0, 0.2)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1rem" }}>
              <div>
                <h2 style={{ fontSize: "1.5rem", color: "var(--devio-blue-dark)" }}>Añade Usuarios</h2>
                <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginTop: "0.25rem" }}>
                  Añade usuarios para que tengan acceso a la plataforma, más adelante podrás agregar más según tus necesidades.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsUserModalOpen(false)}
                style={{ background: "none", border: "none", cursor: "pointer", color: "var(--devio-neutral-3)" }}
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSaveUserFromModal}>
              <div className="grid-cols-2" style={{ marginBottom: "1rem" }}>
                <div className="form-group">
                  <label className="form-label">Nombre Completo *</label>
                  <input
                    type="text"
                    value={modalUserData.fullName}
                    onChange={(e) => setModalUserData({ ...modalUserData, fullName: e.target.value })}
                    placeholder="Nombre Completo"
                    className="form-input"
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Correo electrónico *</label>
                  <input
                    type="email"
                    value={modalUserData.email}
                    onChange={(e) => setModalUserData({ ...modalUserData, email: e.target.value })}
                    placeholder="Correo"
                    className="form-input"
                    required
                  />
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: "1.5rem" }}>
                <label className="form-label">Rol de Usuario *</label>
                <select
                  value={modalUserData.role}
                  onChange={(e) => handleModalRoleChange(e.target.value as UserRole)}
                  className="form-select"
                >
                  <option value="Director Comercial">Director Comercial</option>
                  <option value="Asesor de Ventas">Asesor de Ventas</option>
                  <option value="Finanzas / Cobranza">Finanzas / Cobranza</option>
                  <option value="Residente de Obra">Residente de Obra</option>
                  <option value="Coordinador de Postventa">Coordinador de Postventa</option>
                  <option value="Legal / Notaría">Legal / Notaría</option>
                  <option value="Super Admin">Super Admin (Control Total)</option>
                </select>
              </div>

              {/* Botón Acordeón Configuración Avanzada */}
              <div
                onClick={() =>
                  setModalUserData((prev) => ({ ...prev, showAdvanced: !prev.showAdvanced }))
                }
                style={{
                  backgroundColor: "var(--devio-blue-dark)",
                  color: "var(--devio-white)",
                  padding: "0.75rem 1.25rem",
                  borderRadius: "9999px",
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  gap: "0.5rem",
                  cursor: "pointer",
                  fontWeight: 600,
                  fontSize: "0.875rem",
                  marginBottom: "1.5rem",
                }}
              >
                Matriz de Permisos por Módulo {modalUserData.showAdvanced ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
              </div>

              {/* Grid de Permisos Avanzados Estructurados */}
              {modalUserData.showAdvanced && (
                <div style={{ display: "flex", flexDirection: "column", gap: "1rem", marginBottom: "1.5rem", maxHeight: "420px", overflowY: "auto", paddingRight: "0.4rem" }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                    {PERMISSIONS_CATALOG.map((cat) => {
                      const isSuperAdmin = modalUserData.role === "Super Admin";
                      const parentPerm = cat.permissions.find((p) => p.isParent);
                      const isParentActive = isSuperAdmin || (parentPerm ? Boolean(modalUserData.permissionsState[parentPerm.key]) : true);
                      const activeCount = isSuperAdmin
                        ? cat.permissions.length
                        : cat.permissions.filter((p) => modalUserData.permissionsState[p.key]).length;

                      return (
                        <div
                          key={cat.id}
                          style={{
                            backgroundColor: "#F8FAFC",
                            borderRadius: "0.85rem",
                            border: "1px solid #E2E8F0",
                            padding: "0.85rem",
                            display: "flex",
                            flexDirection: "column",
                            gap: "0.5rem",
                          }}
                        >
                          {/* Category Header */}
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #E2E8F0", paddingBottom: "0.4rem" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                              <span style={{ fontSize: "0.82rem", fontWeight: 800, color: "#1F3652" }}>
                                {cat.name}
                              </span>
                              <span style={{ fontSize: "0.68rem", backgroundColor: activeCount > 0 ? "rgba(0, 196, 140, 0.15)" : "#E2E8F0", color: activeCount > 0 ? "#009E70" : "#64748B", fontWeight: 700, padding: "0.1rem 0.4rem", borderRadius: "9999px" }}>
                                {activeCount}/{cat.permissions.length}
                              </span>
                            </div>

                            {!isSuperAdmin && (
                              <div style={{ display: "flex", gap: "0.25rem" }}>
                                <button
                                  type="button"
                                  onClick={() => handleToggleCategory(cat.id, true)}
                                  style={{ background: "none", border: "none", color: "#00C48C", fontSize: "0.68rem", fontWeight: 700, cursor: "pointer", padding: "0.1rem 0.25rem" }}
                                >
                                  [Todos]
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleToggleCategory(cat.id, false)}
                                  style={{ background: "none", border: "none", color: "#94A3B8", fontSize: "0.68rem", fontWeight: 600, cursor: "pointer", padding: "0.1rem 0.25rem" }}
                                >
                                  [Ninguno]
                                </button>
                              </div>
                            )}
                          </div>

                          {/* Permissions in Category */}
                          <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
                            {cat.permissions.map((perm) => {
                              const isChecked = isSuperAdmin || Boolean(modalUserData.permissionsState[perm.key]);
                              const isChild = Boolean(perm.parentKey && !perm.isParent);
                              const isDisabled = isSuperAdmin || (isChild && !isParentActive);

                              return (
                                <label
                                  key={perm.key}
                                  style={{
                                    display: "flex",
                                    alignItems: "flex-start",
                                    gap: "0.45rem",
                                    cursor: isDisabled ? "not-allowed" : "pointer",
                                    opacity: isChild && !isParentActive ? 0.45 : 1,
                                    padding: "0.25rem 0.35rem",
                                    borderRadius: "0.35rem",
                                    backgroundColor: perm.isParent && isChecked ? "rgba(0, 196, 140, 0.05)" : "transparent",
                                  }}
                                >
                                  <input
                                    type="checkbox"
                                    checked={isChecked}
                                    disabled={isDisabled}
                                    onChange={() => handlePermissionToggle(perm.key)}
                                    style={{ marginTop: "2px", width: "15px", height: "15px", accentColor: "#00C48C" }}
                                  />
                                  <div style={{ flex: 1 }}>
                                    <span style={{ fontSize: "0.78rem", fontWeight: perm.isParent ? 800 : 600, color: "#1F3652", display: "block", lineHeight: 1.2 }}>
                                      {perm.label}
                                    </span>
                                    <span style={{ fontSize: "0.68rem", color: "#64748B", display: "block", lineHeight: 1.2, marginTop: "1px" }}>
                                      {perm.description}
                                    </span>
                                  </div>
                                </label>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              <div style={{ display: "flex", justifyContent: "center" }}>
                <button type="submit" className="btn btn-primary" style={{ padding: "0.75rem 2rem" }}>
                  <UserCheck size={18} /> Guardar Usuario y Permisos
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
