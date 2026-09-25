"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  X,
  Building2,
  Home,
  Store,
  Factory,
  Layers,
  Upload,
  User,
  Users,
  Check,
  CheckCircle2,
  Save,
  Plus,
  Trash2,
  Mail,
  Shield,
  Briefcase
} from "lucide-react";
import { DevioDatePicker } from "../ui/devio-date-picker";
import { ProjectItem } from "../../data/projects-data";
import { useProject } from "../../context/project-context";

export type ProjectType = "VERTICAL" | "HORIZONTAL" | "COMMERCIAL" | "INDUSTRIAL" | "MIXED";
export type Currency = "MXN" | "USD";

export interface EditProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  project?: ProjectItem | null;
  onSave?: (updatedProject: any) => void;
}

interface TeamMember {
  id: string;
  name: string;
  role: string;
  email: string;
  assigned: boolean;
}

export default function EditProjectModal({
  isOpen,
  onClose,
  project,
  onSave,
}: EditProjectModalProps) {
  const { updateProject, getProject } = useProject();
  const [activeTab, setActiveTab] = useState<"general" | "team">("general");
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Active project from context
  const activeProject = project?.id ? getProject(project.id) || project : project;

  // 1. DATOS GENERALES
  const [projectType, setProjectType] = useState<ProjectType>("VERTICAL");
  const [baseCurrency, setBaseCurrency] = useState<Currency>("MXN");
  const [projectGeneralData, setProjectGeneralData] = useState({
    name: "",
    legalName: "",
    googleMapsUrl: "",
    description: "",
    websiteUrl: "",
    totalSurfaceM2: "",
    estimatedDeliveryDate: "",
  });

  const [logoFileName, setLogoFileName] = useState<string | null>(null);
  const [coverFileName, setCoverFileName] = useState<string | null>(null);
  const [coverImageUrl, setCoverImageUrl] = useState<string>("");

  const coverInputRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);

  // 2. ASIGNACIÓN DEL EQUIPO
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);

  const [showAddMember, setShowAddMember] = useState(false);
  const [newMemberName, setNewMemberName] = useState("");
  const [newMemberEmail, setNewMemberEmail] = useState("");
  const [newMemberRole, setNewMemberRole] = useState("Asesor de Ventas");

  // Sync initial project data
  useEffect(() => {
    if (activeProject) {
      setProjectGeneralData({
        name: activeProject.name || "",
        legalName: activeProject.legalName || "",
        googleMapsUrl: activeProject.googleMapsUrl || "",
        description: activeProject.description || "",
        websiteUrl: activeProject.websiteUrl || "",
        totalSurfaceM2: activeProject.totalSurfaceM2 ? String(activeProject.totalSurfaceM2) : "",
        estimatedDeliveryDate: activeProject.estimatedDeliveryDate || "",
      });

      if (activeProject.type) {
        const mapped = activeProject.type.toUpperCase() as ProjectType;
        if (["VERTICAL", "HORIZONTAL", "COMMERCIAL", "INDUSTRIAL", "MIXED"].includes(mapped)) {
          setProjectType(mapped);
        }
      }

      if (activeProject.currency) {
        setBaseCurrency(activeProject.currency);
      }

      if (activeProject.image) {
        setCoverImageUrl(activeProject.image);
      }

      if (activeProject.logoFileName) {
        setLogoFileName(activeProject.logoFileName);
      } else if (activeProject.logo || activeProject.logoUrl) {
        setLogoFileName("logo.png");
      } else {
        setLogoFileName(null);
      }

      if (activeProject.coverFileName) {
        setCoverFileName(activeProject.coverFileName);
      } else if (activeProject.image) {
        setCoverFileName("portada.jpg");
      } else {
        setCoverFileName(null);
      }

      // Load real system users from storage to merge with project assigned team
      let registeredUsers: Array<{ id: string; name: string; email: string; role: string }> = [];
      if (typeof window !== "undefined") {
        const storedUsers = localStorage.getItem("devio_system_users") || sessionStorage.getItem("devio_system_users");
        if (storedUsers) {
          try {
            registeredUsers = JSON.parse(storedUsers);
          } catch (e) {
            registeredUsers = [];
          }
        }
      }

      const assignedTeam = activeProject.team || [];
      const assignedIdsOrEmails = new Set(
        assignedTeam.filter((t) => t.assigned !== false).map((t) => (t.email ? t.email.toLowerCase() : t.id))
      );

      if (registeredUsers.length > 0) {
        const merged: TeamMember[] = registeredUsers.map((u) => ({
          id: u.id,
          name: u.name,
          email: u.email,
          role: u.role,
          assigned: assignedIdsOrEmails.size > 0 ? assignedIdsOrEmails.has(u.email.toLowerCase()) || assignedIdsOrEmails.has(u.id) : false,
        }));

        // Also add any assigned team member from project not present in system users
        assignedTeam.forEach((t) => {
          if (!merged.some((m) => m.email.toLowerCase() === (t.email || "").toLowerCase() || m.id === t.id)) {
            merged.push({
              id: t.id,
              name: t.name,
              email: t.email,
              role: t.role,
              assigned: t.assigned !== false,
            });
          }
        });

        setTeamMembers(merged);
      } else if (assignedTeam.length > 0) {
        setTeamMembers(assignedTeam);
      } else {
        setTeamMembers([]);
      }
    }
  }, [activeProject]);

  if (!isOpen) return null;

  const projectTypesList = [
    { id: "VERTICAL", title: "Vertical", subtitle: "Torres y depas", icon: Building2 },
    { id: "HORIZONTAL", title: "Horizontal", subtitle: "Casas y privadas", icon: Home },
    { id: "COMMERCIAL", title: "Comercial", subtitle: "Plazas y locales", icon: Store },
    { id: "INDUSTRIAL", title: "Industrial", subtitle: "Parques y naves", icon: Factory },
    { id: "MIXED", title: "Mixto", subtitle: "Usos mixtos", icon: Layers },
  ];

  const isSuperAdminRole = (role?: string) => {
    if (!role) return false;
    const r = role.toLowerCase().trim();
    return (
      r === "super admin" ||
      r === "superadmin" ||
      r === "super administrador" ||
      r === "super_admin" ||
      r === "super-admin"
    );
  };

  const handleToggleMember = (id: string) => {
    setTeamMembers((prev) =>
      prev.map((m) => {
        if (m.id === id) {
          if (isSuperAdminRole(m.role)) {
            // El Super Admin siempre debe estar asignado
            return { ...m, assigned: true };
          }
          return { ...m, assigned: !m.assigned };
        }
        return m;
      })
    );
  };

  const handleAddNewMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMemberName.trim() || !newMemberEmail.trim()) return;
    const newMember: TeamMember = {
      id: `tm-${Date.now()}`,
      name: newMemberName.trim(),
      email: newMemberEmail.trim(),
      role: newMemberRole,
      assigned: true,
    };
    setTeamMembers([...teamMembers, newMember]);

    // Persist to devio_system_users so user is available across the app
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem("devio_system_users") || sessionStorage.getItem("devio_system_users");
        let list: any[] = [];
        if (stored) list = JSON.parse(stored);
        if (!list.some((u) => u.email.toLowerCase() === newMember.email.toLowerCase())) {
          list.push({
            id: newMember.id,
            name: newMember.name,
            email: newMember.email,
            role: newMember.role,
            status: "ACTIVO",
            permissions: ["all"],
          });
          localStorage.setItem("devio_system_users", JSON.stringify(list));
          sessionStorage.setItem("devio_system_users", JSON.stringify(list));
        }
      } catch (e) {}
    }

    setNewMemberName("");
    setNewMemberEmail("");
    setShowAddMember(false);
  };

  const handleCoverFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCoverFileName(file.name);
    const reader = new FileReader();
    reader.onload = (ev) => {
      if (ev.target?.result) {
        setCoverImageUrl(ev.target.result as string);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleLogoFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLogoFileName(file.name);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectGeneralData.name.trim()) {
      alert("Por favor ingresa un nombre para el proyecto.");
      return;
    }

    setIsSaving(true);

    const projectId = activeProject?.id || "p-1";
    const updatedPayload = {
      name: projectGeneralData.name.trim(),
      legalName: projectGeneralData.legalName.trim(),
      googleMapsUrl: projectGeneralData.googleMapsUrl.trim(),
      description: projectGeneralData.description.trim(),
      websiteUrl: projectGeneralData.websiteUrl.trim(),
      totalSurfaceM2: projectGeneralData.totalSurfaceM2 ? Number(projectGeneralData.totalSurfaceM2) : undefined,
      estimatedDeliveryDate: projectGeneralData.estimatedDeliveryDate,
      type: projectType,
      currency: baseCurrency,
      image: coverImageUrl || activeProject?.image || "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=800&q=80",
      logoFileName: logoFileName || undefined,
      coverFileName: coverFileName || undefined,
      team: teamMembers,
    };

    // Save to central Project Context
    updateProject(projectId, updatedPayload);

    setTimeout(() => {
      setIsSaving(false);
      setSaveSuccess(true);
      if (onSave) {
        onSave(updatedPayload);
      }
      setTimeout(() => {
        setSaveSuccess(false);
        onClose();
      }, 500);
    }, 400);
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(10, 25, 47, 0.72)",
        backdropFilter: "blur(6px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 9999,
        padding: "1rem",
      }}
    >
      <div
        style={{
          backgroundColor: "var(--devio-white)",
          borderRadius: "1.25rem",
          width: "100%",
          maxWidth: "820px",
          maxHeight: "92vh",
          display: "flex",
          flexDirection: "column",
          boxShadow: "0 25px 70px rgba(0, 0, 0, 0.28)",
          border: "1px solid var(--devio-neutral-1)",
          overflow: "hidden",
          animation: "fadeIn 0.2s ease-out",
        }}
      >
        {/* ================================================================== */}
        {/* HEADER */}
        {/* ================================================================== */}
        <div
          style={{
            padding: "1.25rem 1.75rem",
            borderBottom: "1px solid var(--devio-neutral-1)",
            backgroundColor: "#FAFBFD",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <div
              style={{
                width: "38px",
                height: "38px",
                borderRadius: "10px",
                backgroundColor: "rgba(31, 54, 82, 0.08)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "var(--devio-blue)",
              }}
            >
              <Building2 size={22} />
            </div>
            <div>
              <h3 style={{ fontSize: "1.3rem", fontWeight: 800, color: "var(--devio-blue-dark)", margin: 0, letterSpacing: "-0.02em" }}>
                Editar Información del Proyecto
              </h3>
              <span style={{ fontSize: "0.78rem", color: "var(--devio-neutral-3)" }}>
                {activeProject?.name || "Proyecto"} • Configuración general y equipo de ventas
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{
              background: "transparent",
              border: "none",
              cursor: "pointer",
              padding: "0.4rem",
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "var(--devio-neutral-3)",
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* ================================================================== */}
        {/* TAB SELECTOR */}
        {/* ================================================================== */}
        <div
          style={{
            display: "flex",
            borderBottom: "1px solid var(--devio-neutral-1)",
            backgroundColor: "var(--devio-white)",
            padding: "0 1.5rem",
            gap: "1.5rem",
          }}
        >
          <button
            type="button"
            onClick={() => setActiveTab("general")}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.5rem",
              padding: "0.85rem 1rem",
              border: "none",
              borderBottom: activeTab === "general" ? "3px solid var(--devio-blue)" : "3px solid transparent",
              backgroundColor: "transparent",
              color: activeTab === "general" ? "var(--devio-blue-dark)" : "var(--devio-neutral-3)",
              fontWeight: activeTab === "general" ? 800 : 600,
              fontSize: "0.88rem",
              cursor: "pointer",
              transition: "all 0.15s ease",
            }}
          >
            <Building2 size={16} />
            Datos Generales del Proyecto
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("team")}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.5rem",
              padding: "0.85rem 1rem",
              border: "none",
              borderBottom: activeTab === "team" ? "3px solid var(--devio-blue)" : "3px solid transparent",
              backgroundColor: "transparent",
              color: activeTab === "team" ? "var(--devio-blue-dark)" : "var(--devio-neutral-3)",
              fontWeight: activeTab === "team" ? 800 : 600,
              fontSize: "0.88rem",
              cursor: "pointer",
              transition: "all 0.15s ease",
            }}
          >
            <Users size={16} />
            Asignación del Equipo ({teamMembers.filter((m) => m.assigned).length} asignados)
          </button>
        </div>

        {/* Hidden File Inputs */}
        <input
          type="file"
          ref={coverInputRef}
          accept="image/*"
          onChange={handleCoverFileSelected}
          style={{ display: "none" }}
        />
        <input
          type="file"
          ref={logoInputRef}
          accept="image/png"
          onChange={handleLogoFileSelected}
          style={{ display: "none" }}
        />

        {/* ================================================================== */}
        {/* FORM BODY */}
        {/* ================================================================== */}
        <form onSubmit={handleSave} style={{ flex: 1, overflowY: "auto", padding: "1.75rem", display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          {/* TAB 1: DATOS GENERALES */}
          {activeTab === "general" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
              {/* Selector de Tipología */}
              <div>
                <label style={{ fontSize: "0.82rem", fontWeight: 700, color: "var(--devio-blue-dark)", display: "block", marginBottom: "0.5rem" }}>
                  Tipología del Desarrollo *
                </label>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "0.6rem" }}>
                  {projectTypesList.map((t) => {
                    const Icon = t.icon;
                    const isSelected = projectType === t.id;
                    return (
                      <div
                        key={t.id}
                        onClick={() => setProjectType(t.id as ProjectType)}
                        style={{
                          textAlign: "center",
                          padding: "0.85rem 0.4rem",
                          borderRadius: "0.75rem",
                          border: isSelected ? "2px solid var(--devio-blue)" : "1px solid var(--devio-neutral-1)",
                          backgroundColor: isSelected ? "rgba(31, 54, 82, 0.05)" : "var(--devio-white)",
                          cursor: "pointer",
                          transition: "all 0.15s ease",
                        }}
                      >
                        <div
                          style={{
                            width: "36px",
                            height: "36px",
                            borderRadius: "50%",
                            backgroundColor: isSelected ? "var(--devio-blue)" : "var(--devio-neutral-1)",
                            color: isSelected ? "var(--devio-white)" : "var(--devio-neutral-3)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            margin: "0 auto 0.4rem",
                          }}
                        >
                          <Icon size={18} />
                        </div>
                        <h4 style={{ fontSize: "0.82rem", fontWeight: 700, color: "var(--devio-blue-dark)", margin: 0 }}>{t.title}</h4>
                        <span style={{ fontSize: "0.68rem", color: "var(--devio-neutral-3)", display: "block", marginTop: "2px" }}>{t.subtitle}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Logo del Proyecto & Portada del desarrollo */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                <div>
                  <label style={{ fontSize: "0.82rem", fontWeight: 700, color: "var(--devio-blue-dark)", display: "block", marginBottom: "0.35rem" }}>
                    Logo del Proyecto (PNG)
                  </label>
                  <div
                    onClick={() => logoInputRef.current?.click()}
                    style={{
                      border: "2px dashed var(--devio-neutral-2)",
                      borderRadius: "0.6rem",
                      padding: "0.85rem",
                      textAlign: "center",
                      backgroundColor: "#F8FAFC",
                      cursor: "pointer",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      gap: "0.25rem",
                    }}
                  >
                    <Upload size={18} style={{ color: "var(--devio-blue-matte)" }} />
                    <p style={{ fontSize: "0.8rem", color: "var(--devio-neutral-4)", fontWeight: 700, margin: 0 }}>
                      {logoFileName || "Click para subir logo (.PNG)"}
                    </p>
                    <span style={{ fontSize: "0.7rem", color: "var(--devio-neutral-3)" }}>
                      Dimensiones: 400x400 px o proporción horizontal
                    </span>
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: "0.82rem", fontWeight: 700, color: "var(--devio-blue-dark)", display: "block", marginBottom: "0.35rem" }}>
                    Portada del Desarrollo *
                  </label>
                  <div
                    onClick={() => coverInputRef.current?.click()}
                    style={{
                      border: "2px dashed var(--devio-neutral-2)",
                      borderRadius: "0.6rem",
                      padding: "0.85rem",
                      textAlign: "center",
                      backgroundColor: "#F8FAFC",
                      cursor: "pointer",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      gap: "0.25rem",
                      position: "relative",
                      overflow: "hidden",
                    }}
                  >
                    {coverImageUrl ? (
                      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                        <img src={coverImageUrl} alt="portada" style={{ width: "45px", height: "30px", objectFit: "cover", borderRadius: "4px" }} />
                        <span style={{ fontSize: "0.8rem", fontWeight: 700, color: "var(--devio-blue-dark)" }}>
                          {coverFileName || "Cambiar imagen de portada"}
                        </span>
                      </div>
                    ) : (
                      <>
                        <Upload size={18} style={{ color: "var(--devio-blue-matte)" }} />
                        <p style={{ fontSize: "0.8rem", color: "var(--devio-neutral-4)", fontWeight: 700, margin: 0 }}>
                          Click para subir imagen del proyecto
                        </p>
                        <span style={{ fontSize: "0.7rem", color: "var(--devio-neutral-3)" }}>JPG o PNG en alta resolución</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Nombre y Razón Social */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                <div>
                  <label style={{ fontSize: "0.82rem", fontWeight: 700, color: "var(--devio-blue-dark)", display: "block", marginBottom: "0.35rem" }}>
                    Nombre del Proyecto *
                  </label>
                  <input
                    type="text"
                    value={projectGeneralData.name}
                    onChange={(e) => setProjectGeneralData({ ...projectGeneralData, name: e.target.value })}
                    placeholder="Escribe el Nombre del proyecto"
                    style={{
                      width: "100%",
                      padding: "0.7rem 0.9rem",
                      borderRadius: "0.6rem",
                      border: "1.5px solid var(--devio-neutral-2)",
                      fontSize: "0.9rem",
                      fontWeight: 600,
                      color: "var(--devio-blue-dark)",
                    }}
                    required
                  />
                </div>

                <div>
                  <label style={{ fontSize: "0.82rem", fontWeight: 700, color: "var(--devio-blue-dark)", display: "block", marginBottom: "0.35rem" }}>
                    Razón Social del Proyecto *
                  </label>
                  <input
                    type="text"
                    value={projectGeneralData.legalName}
                    onChange={(e) => setProjectGeneralData({ ...projectGeneralData, legalName: e.target.value })}
                    placeholder="Escribe la Razón Social del proyecto"
                    style={{
                      width: "100%",
                      padding: "0.7rem 0.9rem",
                      borderRadius: "0.6rem",
                      border: "1.5px solid var(--devio-neutral-2)",
                      fontSize: "0.9rem",
                      color: "var(--devio-blue-dark)",
                    }}
                    required
                  />
                </div>
              </div>

              {/* Google Maps & Página Web */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                <div>
                  <label style={{ fontSize: "0.82rem", fontWeight: 700, color: "var(--devio-blue-dark)", display: "block", marginBottom: "0.35rem" }}>
                    Ubicación (Google Maps) *
                  </label>
                  <input
                    type="url"
                    value={projectGeneralData.googleMapsUrl}
                    onChange={(e) => setProjectGeneralData({ ...projectGeneralData, googleMapsUrl: e.target.value })}
                    placeholder="https://maps.google.com/..."
                    style={{
                      width: "100%",
                      padding: "0.7rem 0.9rem",
                      borderRadius: "0.6rem",
                      border: "1.5px solid var(--devio-neutral-2)",
                      fontSize: "0.88rem",
                      color: "var(--devio-blue-dark)",
                    }}
                    required
                  />
                </div>

                <div>
                  <label style={{ fontSize: "0.82rem", fontWeight: 700, color: "var(--devio-blue-dark)", display: "block", marginBottom: "0.35rem" }}>
                    Página Web del Proyecto
                  </label>
                  <input
                    type="url"
                    value={projectGeneralData.websiteUrl}
                    onChange={(e) => setProjectGeneralData({ ...projectGeneralData, websiteUrl: e.target.value })}
                    placeholder="https://tudesarrollo.com"
                    style={{
                      width: "100%",
                      padding: "0.7rem 0.9rem",
                      borderRadius: "0.6rem",
                      border: "1.5px solid var(--devio-neutral-2)",
                      fontSize: "0.88rem",
                      color: "var(--devio-blue-dark)",
                    }}
                  />
                </div>
              </div>

              {/* Descripción */}
              <div>
                <label style={{ fontSize: "0.82rem", fontWeight: 700, color: "var(--devio-blue-dark)", display: "block", marginBottom: "0.35rem" }}>
                  Descripción del Desarrollo *
                </label>
                <textarea
                  value={projectGeneralData.description}
                  onChange={(e) => setProjectGeneralData({ ...projectGeneralData, description: e.target.value })}
                  placeholder="Detalles sobre el concepto, amenidades y ubicación del proyecto..."
                  style={{
                    width: "100%",
                    padding: "0.7rem 0.9rem",
                    borderRadius: "0.6rem",
                    border: "1.5px solid var(--devio-neutral-2)",
                    fontSize: "0.88rem",
                    color: "var(--devio-blue-dark)",
                    resize: "vertical",
                  }}
                  rows={3}
                  required
                />
              </div>

              {/* Superficie, Fecha de Entrega, Moneda Base */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "1rem" }}>
                <div>
                  <label style={{ fontSize: "0.82rem", fontWeight: 700, color: "var(--devio-blue-dark)", display: "block", marginBottom: "0.35rem" }}>
                    Superficie Total (m²) *
                  </label>
                  <input
                    type="number"
                    value={projectGeneralData.totalSurfaceM2}
                    onChange={(e) => setProjectGeneralData({ ...projectGeneralData, totalSurfaceM2: e.target.value })}
                    placeholder="Ej. 12500"
                    style={{
                      width: "100%",
                      padding: "0.7rem 0.9rem",
                      borderRadius: "0.6rem",
                      border: "1.5px solid var(--devio-neutral-2)",
                      fontSize: "0.88rem",
                      fontWeight: 700,
                      color: "var(--devio-blue-dark)",
                    }}
                    required
                  />
                </div>

                <div>
                  <DevioDatePicker
                    label="Fecha de Entrega Estimada"
                    value={projectGeneralData.estimatedDeliveryDate}
                    onChange={(val) => setProjectGeneralData({ ...projectGeneralData, estimatedDeliveryDate: val })}
                    placeholder="Seleccionar fecha"
                    required
                  />
                </div>

                <div>
                  <label style={{ fontSize: "0.82rem", fontWeight: 700, color: "var(--devio-blue-dark)", display: "block", marginBottom: "0.35rem" }}>
                    Moneda Base
                  </label>
                  <select
                    value={baseCurrency}
                    onChange={(e) => setBaseCurrency(e.target.value as Currency)}
                    style={{
                      width: "100%",
                      padding: "0.7rem 0.9rem",
                      borderRadius: "0.6rem",
                      border: "1.5px solid var(--devio-neutral-2)",
                      fontSize: "0.88rem",
                      fontWeight: 700,
                      color: "var(--devio-blue-dark)",
                      backgroundColor: "var(--devio-white)",
                    }}
                  >
                    <option value="MXN">Pesos Mexicanos (MXN)</option>
                    <option value="USD">Dólares Americanos (USD)</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: ASIGNACIÓN DEL EQUIPO */}
          {activeTab === "team" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <h4 style={{ fontSize: "1.1rem", fontWeight: 800, color: "var(--devio-blue-dark)", margin: 0 }}>
                    Asignación de Equipo al Proyecto
                  </h4>
                  <p style={{ fontSize: "0.82rem", color: "var(--devio-neutral-3)", marginTop: "2px" }}>
                    Selecciona a los asesores y gerentes que tendrán acceso operativo a este proyecto.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setShowAddMember(!showAddMember)}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "0.35rem",
                    padding: "0.5rem 0.9rem",
                    borderRadius: "9999px",
                    backgroundColor: "var(--devio-blue)",
                    color: "var(--devio-white)",
                    fontSize: "0.8rem",
                    fontWeight: 700,
                    border: "none",
                    cursor: "pointer",
                  }}
                >
                  <Plus size={14} /> Invitar Integrante
                </button>
              </div>

              {/* Add Member Form Drawer */}
              {showAddMember && (
                <div
                  style={{
                    backgroundColor: "#F8FAFC",
                    border: "1px solid var(--devio-neutral-1)",
                    borderRadius: "0.75rem",
                    padding: "1rem",
                    display: "grid",
                    gridTemplateColumns: "1.2fr 1.2fr 1fr auto",
                    gap: "0.75rem",
                    alignItems: "flex-end",
                  }}
                >
                  <div>
                    <label style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--devio-blue-dark)", display: "block", marginBottom: "0.2rem" }}>
                      Nombre Completo
                    </label>
                    <input
                      type="text"
                      placeholder="Ej. Sofia Villarreal"
                      value={newMemberName}
                      onChange={(e) => setNewMemberName(e.target.value)}
                      style={{ width: "100%", padding: "0.5rem 0.75rem", borderRadius: "0.4rem", border: "1px solid var(--devio-neutral-2)", fontSize: "0.82rem" }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--devio-blue-dark)", display: "block", marginBottom: "0.2rem" }}>
                      Correo Electrónico
                    </label>
                    <input
                      type="email"
                      placeholder="s.villarreal@devio.com"
                      value={newMemberEmail}
                      onChange={(e) => setNewMemberEmail(e.target.value)}
                      style={{ width: "100%", padding: "0.5rem 0.75rem", borderRadius: "0.4rem", border: "1px solid var(--devio-neutral-2)", fontSize: "0.82rem" }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--devio-blue-dark)", display: "block", marginBottom: "0.2rem" }}>
                      Rol
                    </label>
                    <select
                      value={newMemberRole}
                      onChange={(e) => setNewMemberRole(e.target.value)}
                      style={{ width: "100%", padding: "0.5rem 0.75rem", borderRadius: "0.4rem", border: "1px solid var(--devio-neutral-2)", fontSize: "0.82rem", backgroundColor: "#FFF" }}
                    >
                      <option value="Director Comercial">Director Comercial</option>
                      <option value="Asesor de Ventas">Asesor de Ventas</option>
                      <option value="Finanzas / Cobranza">Finanzas / Cobranza</option>
                      <option value="Residente de Obra">Residente de Obra</option>
                      <option value="Coordinador de Postventa">Coordinador de Postventa</option>
                      <option value="Legal / Notaría">Legal / Notaría</option>
                      <option value="Super Admin">Super Admin</option>
                    </select>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddNewMember}
                    style={{
                      padding: "0.5rem 1rem",
                      borderRadius: "0.4rem",
                      backgroundColor: "var(--devio-green)",
                      color: "#FFF",
                      border: "none",
                      fontWeight: 700,
                      fontSize: "0.82rem",
                      cursor: "pointer",
                      height: "35px",
                    }}
                  >
                    Agregar
                  </button>
                </div>
              )}

              {/* Members List with Checkboxes */}
              <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
                {teamMembers.map((member) => {
                  const isSuperAdmin = isSuperAdminRole(member.role);
                  const isAssigned = isSuperAdmin ? true : member.assigned;

                  return (
                    <label
                      key={member.id}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "0.85rem 1.25rem",
                        backgroundColor: isAssigned ? "rgba(31, 54, 82, 0.04)" : "#F8FAFC",
                        borderRadius: "0.6rem",
                        cursor: isSuperAdmin ? "default" : "pointer",
                        border: isAssigned ? "1.5px solid var(--devio-blue)" : "1px solid var(--devio-neutral-1)",
                        transition: "all 0.15s ease",
                      }}
                      title={isSuperAdmin ? "El Super Admin tiene acceso global obligatorio a todos los proyectos." : undefined}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                        <input
                          type="checkbox"
                          checked={isAssigned}
                          disabled={isSuperAdmin}
                          onChange={() => {
                            if (!isSuperAdmin) {
                              handleToggleMember(member.id);
                            }
                          }}
                          style={{ width: "18px", height: "18px", accentColor: "var(--devio-blue)", cursor: isSuperAdmin ? "not-allowed" : "pointer" }}
                        />
                        <div>
                          <strong style={{ fontSize: "0.88rem", color: "var(--devio-blue-dark)", display: "block" }}>
                            {member.name}
                          </strong>
                          <span style={{ fontSize: "0.75rem", color: "var(--devio-neutral-3)" }}>
                            {member.email} • <span style={{ fontWeight: 600, color: isSuperAdmin ? "var(--devio-blue-dark)" : "var(--devio-blue)" }}>{member.role}</span>
                          </span>
                        </div>
                      </div>
                      <span
                        style={{
                          fontSize: "0.72rem",
                          fontWeight: 700,
                          padding: "0.2rem 0.5rem",
                          borderRadius: "0.35rem",
                          backgroundColor: isSuperAdmin ? "rgba(31, 54, 82, 0.12)" : (isAssigned ? "rgba(111, 172, 156, 0.15)" : "#E2E8F0"),
                          color: isSuperAdmin ? "var(--devio-blue-dark)" : (isAssigned ? "var(--devio-green)" : "#64748B"),
                        }}
                      >
                        {isSuperAdmin ? "Acceso Global Permanente" : (isAssigned ? "Asignado" : "No asignado")}
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>
          )}

          {/* ================================================================ */}
          {/* FOOTER ACTIONS */}
          {/* ================================================================ */}
          <div
            style={{
              paddingTop: "1rem",
              borderTop: "1px solid var(--devio-neutral-1)",
              display: "flex",
              justifyContent: "flex-end",
              gap: "0.75rem",
              alignItems: "center",
            }}
          >
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: "0.65rem 1.4rem",
                borderRadius: "9999px",
                border: "1px solid var(--devio-neutral-2)",
                backgroundColor: "transparent",
                color: "var(--devio-blue-dark)",
                fontSize: "0.875rem",
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={isSaving}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.45rem",
                padding: "0.65rem 1.75rem",
                borderRadius: "9999px",
                backgroundColor: "var(--devio-blue-dark)",
                color: "var(--devio-white)",
                fontSize: "0.875rem",
                fontWeight: 800,
                border: "none",
                cursor: isSaving ? "not-allowed" : "pointer",
                boxShadow: "0 4px 14px rgba(22, 43, 63, 0.35)",
              }}
            >
              {isSaving ? (
                "Guardando Cambios..."
              ) : saveSuccess ? (
                <>
                  <Check size={16} /> ¡Guardado!
                </>
              ) : (
                <>
                  <Save size={16} /> Guardar Información
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
