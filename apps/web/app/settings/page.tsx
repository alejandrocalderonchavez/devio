"use client";

import React, { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  User,
  Building2,
  CreditCard,
  LogOut,
  ChevronRight,
  Shield,
  HelpCircle,
  Users,
  Plus,
  Search,
  X,
  Check,
  ChevronUp,
  ChevronDown,
  Mail,
  Phone,
  UploadCloud,
  FileText,
  Lock,
  ExternalLink,
  Edit3,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Database,
  RotateCcw,
  Sparkles,
  Coins,
  Percent,
  BarChart3,
  ShoppingBag,
  HardHat,
  ShieldCheck,
  Building,
  Home,
  Settings,
} from "lucide-react";
import AppLayout from "../../components/layout/app-layout";
import { useProject, DeveloperPaymentPlan } from "../../context/project-context";
import PhoneInput from "../../components/ui/phone-input";
import PaymentPlanModal from "../../components/plans/payment-plan-modal";
import {
  UserRole,
  PermissionKey,
  PERMISSIONS_CATALOG,
  DEFAULT_ROLE_PERMISSIONS,
  ALL_PERMISSION_KEYS,
  togglePermissionWithCascade,
  toggleModuleAllPermissions,
  getRolePermissionsMap,
} from "../../lib/permissions";

interface SystemUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: "ACTIVO" | "INVITADO" | "INACTIVO";
  permissions: string[];
}

export default function SettingsPage() {
  const router = useRouter();
  const {
    developerName,
    setDeveloperName,
    developerLogo,
    setDeveloperLogo,
    showToast,
    projects,
    resetToCleanState,
    loadDemoData,
    userName,
    setUserName,
    paymentPlans,
    addPaymentPlan,
    updatePaymentPlan,
    deletePaymentPlan,
  } = useProject();
  const devLogoFileInputRef = React.useRef<HTMLInputElement>(null);

  // Current Logged In User state
  const [currentUser, setCurrentUser] = useState({
    name: userName || "Administrador",
    email: "admin@devio.com",
    role: "Super Admin" as SystemUser["role"],
  });

  // Modals state
  const [showUsersModal, setShowUsersModal] = useState(false);
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [showDeveloperModal, setShowDeveloperModal] = useState(false);
  const [showPaymentPlansModal, setShowPaymentPlansModal] = useState(false);
  const [showAddEditPlanModal, setShowAddEditPlanModal] = useState(false);
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const [showPersonalInfoModal, setShowPersonalInfoModal] = useState(false);
  const [showLegalModal, setShowLegalModal] = useState(false);
  const [showSupportModal, setShowSupportModal] = useState(false);

  // Payment Plans State
  const [editingPlanId, setEditingPlanId] = useState<string | null>(null);
  const [planSearchQuery, setPlanSearchQuery] = useState("");

  const filteredPaymentPlans = useMemo(() => {
    return paymentPlans.filter((p) =>
      p.name.toLowerCase().includes(planSearchQuery.toLowerCase()) ||
      (p.description || "").toLowerCase().includes(planSearchQuery.toLowerCase())
    );
  }, [paymentPlans, planSearchQuery]);

  const handleOpenAddPlan = () => {
    setEditingPlanId(null);
    setShowAddEditPlanModal(true);
  };

  const handleOpenEditPlan = (plan: DeveloperPaymentPlan) => {
    setEditingPlanId(plan.id);
    setShowAddEditPlanModal(true);
  };


  // Users List State
  const [systemUsers, setSystemUsers] = useState<SystemUser[]>([
    {
      id: "usr-admin",
      name: userName || "Administrador",
      email: "admin@devio.com",
      role: "Super Admin",
      status: "ACTIVO",
      permissions: ["all"],
    },
  ]);

  const [userSearchQuery, setUserSearchQuery] = useState("");
  const [editingUserId, setEditingUserId] = useState<string | null>(null);

  // New / Edit User Form State
  const [newUserForm, setNewUserForm] = useState<{
    name: string;
    email: string;
    role: UserRole;
  }>({
    name: "",
    email: "",
    role: "Asesor de Ventas",
  });

  // Advanced Permissions Accordion & Checkboxes with cascade
  const [showAdvancedPerms, setShowAdvancedPerms] = useState(true);
  const [permissionsState, setPermissionsState] = useState<Record<string, boolean>>(() =>
    getRolePermissionsMap("Asesor de Ventas")
  );

  const togglePermission = (key: PermissionKey) => {
    setPermissionsState((prev) => togglePermissionWithCascade(prev, key));
  };

  const handleToggleModule = (catId: string, enableAll: boolean) => {
    setPermissionsState((prev) => toggleModuleAllPermissions(prev, catId, enableAll));
  };

  const handleRoleChange = (role: UserRole) => {
    setNewUserForm((prev) => ({ ...prev, role }));
    setPermissionsState(getRolePermissionsMap(role));
  };

  // Developer Onboarding Data State with Logo
  const [devData, setDevData] = useState({
    businessName: "",
    tradeName: developerName || "",
    rfc: "",
    taxRegime: "",
    addressStreet: "",
    addressCol: "",
    city: "",
    state: "",
    zipCode: "",
    phone: "",
    billingEmail: "",
    contactEmail: "",
    legalRepresentative: "",
    repRfc: "",
    bankName: "",
    bankAccountName: "",
    clabe: "",
    logoName: "",
    logoUrl: "",
  });

  // Personal Info Form State
  const [personalInfo, setPersonalInfo] = useState({
    name: "Administrador",
    email: "admin@devio.com",
    phone: "3312345678",
    currentPassword: "",
    newPassword: "",
  });

  // Load dynamic data on mount from localStorage / sessionStorage
  React.useEffect(() => {
    if (typeof window !== "undefined") {
      const storedDev = localStorage.getItem("devio_developer_onboarding") || sessionStorage.getItem("devio_developer_onboarding");
      const storedLogo = localStorage.getItem("devio_developer_logo") || sessionStorage.getItem("devio_developer_logo");
      const storedUser = localStorage.getItem("devio_user_session") || sessionStorage.getItem("devio_user_session");
      const storedSystemUsers = localStorage.getItem("devio_system_users") || sessionStorage.getItem("devio_system_users");
      const storedTeam = localStorage.getItem("devio_team_members") || sessionStorage.getItem("devio_team_members");

      let currentAdminName = userName || "Administrador";
      let currentAdminEmail = "admin@devio.com";
      let currentAdminRole: SystemUser["role"] = "Super Admin";

      if (storedUser) {
        try {
          const u = JSON.parse(storedUser);
          if (u.fullName) currentAdminName = u.fullName;
          if (u.email) currentAdminEmail = u.email;
          if (u.role) currentAdminRole = u.role;
        } catch (e) {}
      }

      const activeLogo = storedLogo || developerLogo || "";

      if (storedDev) {
        try {
          const d = JSON.parse(storedDev);
          const tName = d.name || d.commercialName || d.tradeName || developerName || "";
          const dLogo = d.logoPath || d.logoUrl || d.logo || activeLogo;
          setDevData((prev) => ({
            ...prev,
            businessName: d.legalName || d.businessName || prev.businessName,
            tradeName: tName || prev.tradeName,
            rfc: d.taxId || d.rfc || prev.rfc,
            taxRegime: d.taxRegime || prev.taxRegime,
            addressStreet: d.addressLine1 || d.addressStreet || prev.addressStreet,
            addressCol: d.neighborhood || d.addressCol || prev.addressCol,
            city: d.city || prev.city,
            state: d.state || prev.state,
            zipCode: d.postalCode || d.zipCode || prev.zipCode,
            phone: d.phoneNumber || d.phone || prev.phone,
            billingEmail: d.email || d.billingEmail || prev.billingEmail,
            contactEmail: d.email || d.contactEmail || prev.contactEmail,
            legalRepresentative: d.legalRepresentative || prev.legalRepresentative,
            repRfc: d.repRfc || prev.repRfc,
            bankName: d.bankName || prev.bankName,
            bankAccountName: d.bankAccountName || prev.bankAccountName,
            clabe: d.clabe || prev.clabe,
            logoUrl: dLogo || prev.logoUrl,
            logoName: d.logoName || (dLogo ? "logo-desarrolladora.png" : prev.logoName),
          }));

          if (d.email && (!storedUser || !currentAdminEmail)) {
            currentAdminEmail = d.email;
          }
          if (tName) {
            setDeveloperName(tName);
          }
          if (dLogo && !developerLogo) {
            setDeveloperLogo(dLogo);
          }
        } catch (e) {}
      } else if (activeLogo) {
        setDevData((prev) => ({
          ...prev,
          logoUrl: activeLogo,
          logoName: "logo-desarrolladora.png",
        }));
      }

      setCurrentUser({
        name: currentAdminName,
        email: currentAdminEmail,
        role: currentAdminRole,
      });

      setPersonalInfo((prev) => ({
        ...prev,
        name: currentAdminName,
        email: currentAdminEmail,
      }));

      // Load System Users
      let teamSource: any[] | null = null;
      if (storedDev) {
        try {
          const d = JSON.parse(storedDev);
          if (Array.isArray(d.teamMembers) && d.teamMembers.length > 0) {
            teamSource = d.teamMembers;
          }
        } catch (e) {}
      }

      if (!teamSource && storedTeam) {
        try {
          const t = JSON.parse(storedTeam);
          if (Array.isArray(t) && t.length > 0) teamSource = t;
        } catch (e) {}
      }

      if (storedSystemUsers) {
        try {
          const parsed = JSON.parse(storedSystemUsers);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setSystemUsers(parsed);
            return;
          }
        } catch (e) {}
      }

      if (Array.isArray(teamSource) && teamSource.length > 0) {
        const usersList: SystemUser[] = teamSource.map((m: any, idx: number) => ({
          id: m.id || `usr-team-${idx + 1}`,
          name: m.fullName || m.name || `Usuario ${idx + 1}`,
          email: m.email || `usuario${idx + 1}@desarrolladora.mx`,
          role: (m.role || "Asesor de Ventas") as SystemUser["role"],
          status: (m.status || "ACTIVO") as "ACTIVO" | "INVITADO" | "INACTIVO",
          permissions: m.permissions || (m.role === "Super Admin" ? ["all"] : ["units.view", "clients.view", "sales.view"]),
        }));
        setSystemUsers(usersList);
      } else {
        setSystemUsers([
          {
            id: "usr-admin",
            name: currentAdminName,
            email: currentAdminEmail,
            role: currentAdminRole,
            status: "ACTIVO",
            permissions: ["all"],
          },
        ]);
      }
    }
  }, [userName]);

  const handleDevLogoFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.includes("png") && !file.type.startsWith("image/")) {
      alert("El logo debe ser un archivo de imagen válido (PNG recomendado).");
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      setDevData((prev) => ({
        ...prev,
        logoUrl: result,
        logoName: file.name,
      }));
      showToast("Logo Seleccionado", `Se cargó el archivo ${file.name}`);
    };
    reader.readAsDataURL(file);
  };

  const persistSystemUsers = (newUsers: SystemUser[]) => {
    setSystemUsers(newUsers);
    if (typeof window !== "undefined") {
      localStorage.setItem("devio_system_users", JSON.stringify(newUsers));
      sessionStorage.setItem("devio_system_users", JSON.stringify(newUsers));
      const teamOnly = newUsers.filter((u) => u.role !== "Super Admin");
      localStorage.setItem("devio_team_members", JSON.stringify(teamOnly));
      sessionStorage.setItem("devio_team_members", JSON.stringify(teamOnly));

      const storedDev = localStorage.getItem("devio_developer_onboarding") || sessionStorage.getItem("devio_developer_onboarding");
      if (storedDev) {
        try {
          const parsedDev = JSON.parse(storedDev);
          parsedDev.teamMembers = newUsers;
          localStorage.setItem("devio_developer_onboarding", JSON.stringify(parsedDev));
          sessionStorage.setItem("devio_developer_onboarding", JSON.stringify(parsedDev));
        } catch (e) {}
      }
    }
  };

  // Filtered Users
  const filteredUsers = useMemo(() => {
    return systemUsers.filter(
      (u) =>
        u.name.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
        u.email.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
        u.role.toLowerCase().includes(userSearchQuery.toLowerCase())
    );
  }, [systemUsers, userSearchQuery]);

  // Open Add User
  const handleOpenAddUser = () => {
    setEditingUserId(null);
    const defaultRole: UserRole = "Asesor de Ventas";
    setNewUserForm({ name: "", email: "", role: defaultRole });
    setPermissionsState(getRolePermissionsMap(defaultRole));
    setShowAddUserModal(true);
  };

  // Open Edit User
  const handleOpenEditUser = (user: SystemUser) => {
    setEditingUserId(user.id);
    setNewUserForm({ name: user.name, email: user.email, role: user.role });
    const hasAll = user.permissions.includes("all") || user.role === "Super Admin";
    if (hasAll) {
      setPermissionsState(getRolePermissionsMap("Super Admin"));
    } else {
      const permsMap: Record<string, boolean> = {};
      ALL_PERMISSION_KEYS.forEach((k) => {
        permsMap[k] = user.permissions.includes(k);
      });
      setPermissionsState(permsMap);
    }
    setShowAddUserModal(true);
  };

  // Delete User
  const handleDeleteUser = (userId: string, userName: string) => {
    if (userId === "usr-admin" || userName === currentUser.name) {
      alert("No es posible eliminar la cuenta del Administrador principal en sesión.");
      return;
    }
    if (confirm(`¿Estás seguro de que deseas eliminar permanentemente al usuario ${userName}?`)) {
      const updated = systemUsers.filter((u) => u.id !== userId);
      persistSystemUsers(updated);
      showToast("Usuario Eliminado", `El usuario ${userName} ha sido eliminado del sistema.`);
    }
  };

  // Handle Create or Update User Submit
  const handleCreateOrUpdateUser = (e: React.FormEvent) => {
    e.preventDefault();
    const isSuperAdmin = newUserForm.role === "Super Admin";
    const activePerms = isSuperAdmin
      ? ["all"]
      : (Object.keys(permissionsState).filter((k) => permissionsState[k]) as PermissionKey[]);

    if (editingUserId) {
      const updated = systemUsers.map((u) =>
        u.id === editingUserId
          ? { ...u, name: newUserForm.name, email: newUserForm.email, role: newUserForm.role, permissions: activePerms }
          : u
      );
      persistSystemUsers(updated);
      showToast(
        "Usuario Actualizado",
        `Los datos y permisos de ${newUserForm.name} fueron actualizados exitosamente.`
      );
    } else {
      const created: SystemUser = {
        id: `usr-${Date.now()}`,
        name: newUserForm.name,
        email: newUserForm.email,
        role: newUserForm.role,
        status: "INVITADO",
        permissions: activePerms,
      };
      const updated = [...systemUsers, created];
      persistSystemUsers(updated);
      showToast(
        "Usuario Creado",
        `Se envió invitación y accesos a ${created.name} (${created.email}) con rol ${created.role}.`
      );
    }

    // Persistir en Supabase y enviar invitación por Postmark
    try {
      let devId: string | undefined = undefined;
      let devName: string | undefined = undefined;
      let currentUserEmail: string | undefined = undefined;
      const storedDev = localStorage.getItem("devio_developer_onboarding") || sessionStorage.getItem("devio_developer_onboarding");
      if (storedDev) {
        const p = JSON.parse(storedDev);
        devId = p.id;
        devName = p.name || p.commercialName;
      }
      const storedUser = localStorage.getItem("devio_user_session") || sessionStorage.getItem("devio_user_session");
      if (storedUser) {
        const pu = JSON.parse(storedUser);
        currentUserEmail = pu.email;
        if (!devName) devName = pu.activeDeveloper;
      }

      fetch("/api/developers/members", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          developerId: devId,
          developerName: devName || developerName,
          userEmail: currentUserEmail,
          member: {
            name: newUserForm.name,
            fullName: newUserForm.name,
            email: newUserForm.email,
            role: newUserForm.role,
            permissions: activePerms,
          },
        }),
      })
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data?.emailSent) {
            showToast(
              "Accesos Enviados",
              `Se enviaron las credenciales de acceso por correo a ${newUserForm.email} vía Postmark.`
            );
          }
        })
        .catch((err) => console.warn("Error creating member in Supabase / Postmark:", err));
    } catch (_) {}

    setShowAddUserModal(false);
    setEditingUserId(null);
    setNewUserForm({ name: "", email: "", role: "Asesor de Ventas" });
  };

  // Handle Save Developer Data Submit
  const handleSaveDeveloperData = (e: React.FormEvent) => {
    e.preventDefault();
    setDeveloperName(devData.tradeName);
    if (devData.logoUrl) {
      setDeveloperLogo(devData.logoUrl);
    }
    if (typeof window !== "undefined") {
      const storedDev = localStorage.getItem("devio_developer_onboarding") || sessionStorage.getItem("devio_developer_onboarding");
      let baseData = {};
      if (storedDev) {
        try { baseData = JSON.parse(storedDev); } catch (e) {}
      }
      const updated = {
        ...baseData,
        name: devData.tradeName,
        commercialName: devData.tradeName,
        legalName: devData.businessName,
        taxId: devData.rfc,
        rfc: devData.rfc,
        taxRegime: devData.taxRegime,
        addressLine1: devData.addressStreet,
        neighborhood: devData.addressCol,
        city: devData.city,
        state: devData.state,
        postalCode: devData.zipCode,
        phoneNumber: devData.phone,
        phone: devData.phone,
        email: devData.contactEmail || devData.billingEmail,
        billingEmail: devData.billingEmail,
        contactEmail: devData.contactEmail,
        bankName: devData.bankName,
        bankAccountName: devData.bankAccountName,
        clabe: devData.clabe,
        logoPath: devData.logoUrl,
        logoUrl: devData.logoUrl,
        logo: devData.logoUrl,
        logoName: devData.logoName,
      };
      localStorage.setItem("devio_developer_onboarding", JSON.stringify(updated));
      sessionStorage.setItem("devio_developer_onboarding", JSON.stringify(updated));
      if (devData.logoUrl) {
        localStorage.setItem("devio_developer_logo", devData.logoUrl);
        sessionStorage.setItem("devio_developer_logo", devData.logoUrl);
      }
      window.dispatchEvent(new Event("devio_developer_updated"));
      window.dispatchEvent(new Event("storage"));

      // Persistir en Supabase (Prisma)
      fetch("/api/developers", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updated),
      }).catch((err) => console.warn("Could not save developer to API:", err));
    }
    showToast("Datos de Desarrolladora Guardados", "Se actualizaron los datos corporativos, fiscales y el logotipo oficial de la empresa.");
    setShowDeveloperModal(false);
  };

  // Handle Save Personal Info Submit
  const handleSavePersonalInfo = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentUser((prev) => ({ ...prev, name: personalInfo.name, email: personalInfo.email }));
    setUserName(personalInfo.name);
    if (typeof window !== "undefined") {
      const userSession = {
        fullName: personalInfo.name,
        email: personalInfo.email,
        role: currentUser.role,
      };
      localStorage.setItem("devio_user_session", JSON.stringify(userSession));
      sessionStorage.setItem("devio_user_session", JSON.stringify(userSession));
    }
    showToast("Perfil Actualizado", "Tus datos personales fueron guardados con éxito.");
    setShowPersonalInfoModal(false);
  };

  // Logout Handler
  const handleLogout = () => {
    if (confirm("¿Estás seguro de que deseas cerrar sesión en Devio?")) {
      showToast("Sesión Finalizada", "Has salido del sistema de forma segura.");
      router.push("/dashboard");
    }
  };

  return (
    <AppLayout>
      <main style={{ padding: "1.25rem 2rem 3rem 2rem", flex: 1, overflowY: "auto", maxWidth: "1280px", margin: "0 auto", width: "100%" }}>
        
        {/* TOP HEADER: TITLE */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 800, color: "#1F3652", margin: 0 }}>
            Settings
          </h1>
        </div>

        {/* 1. TOP PROFILE & ACTION BUTTONS CARD (Exacto a Screenshot 1) */}
        <div
          style={{
            backgroundColor: "#FFFFFF",
            borderRadius: "1.25rem",
            padding: "2.5rem 2rem",
            boxShadow: "0 2px 10px rgba(0,0,0,0.03)",
            border: "1px solid rgba(22, 43, 63, 0.05)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            textAlign: "center",
            marginBottom: "1.5rem",
          }}
        >
          {/* Big User Avatar */}
          <div
            style={{
              width: "78px",
              height: "78px",
              borderRadius: "50%",
              border: "2px solid #CBD5E1",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#64748B",
              backgroundColor: "#F8FAFC",
              marginBottom: "1rem",
            }}
          >
            <User size={38} />
          </div>

          {/* Developer Brand Logo & Name */}
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.6rem", padding: "0.35rem 0.85rem", backgroundColor: "#F8FAFC", borderRadius: "9999px", border: "1px solid #E2E8F0" }}>
            {devData.logoUrl && (
              <img src={devData.logoUrl} alt="Logo Desarrolladora" style={{ height: "20px", width: "auto", objectFit: "contain" }} />
            )}
            <span style={{ fontSize: "0.78rem", fontWeight: 700, color: "#1F3652" }}>
              {devData.tradeName || developerName || "Mi Desarrolladora"}
            </span>
          </div>

          {/* User Name & Info */}
          <h2 style={{ fontSize: "1.25rem", fontWeight: 800, color: "#1F3652", margin: "0 0 0.25rem 0" }}>
            {currentUser.name}
          </h2>
          <span style={{ fontSize: "0.82rem", color: "#64748B", display: "block", marginBottom: "0.4rem" }}>
            {currentUser.email}
          </span>
          <span style={{ fontSize: "0.82rem", fontWeight: 700, color: "#1F3652", display: "block", marginBottom: "1.75rem" }}>
            {currentUser.role}
          </span>

          {/* 3 Green Outlined Action Buttons (Exacto a Screenshot 1) */}
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", width: "100%", maxWidth: "420px" }}>
            
            {/* 1. Añadir/Editar Usuarios del Sistema */}
            <button
              type="button"
              onClick={() => setShowUsersModal(true)}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "0.5rem",
                padding: "0.65rem 1.25rem",
                borderRadius: "9999px",
                border: "1.5px solid #00C48C",
                backgroundColor: "#FFFFFF",
                color: "#00C48C",
                fontSize: "0.82rem",
                fontWeight: 700,
                cursor: "pointer",
                transition: "all 0.15s ease",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "rgba(0, 196, 140, 0.05)")}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#FFFFFF")}
            >
              <Users size={16} /> Añadir/Editar Usuarios del Sistema
            </button>

            {/* 2. Editar Datos de la Desarrolladora */}
            <button
              type="button"
              onClick={() => setShowDeveloperModal(true)}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "0.5rem",
                padding: "0.65rem 1.25rem",
                borderRadius: "9999px",
                border: "1.5px solid #00C48C",
                backgroundColor: "#FFFFFF",
                color: "#00C48C",
                fontSize: "0.82rem",
                fontWeight: 700,
                cursor: "pointer",
                transition: "all 0.15s ease",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "rgba(0, 196, 140, 0.05)")}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#FFFFFF")}
            >
              <Building2 size={16} /> Editar Datos de la Desarrolladora
            </button>

            {/* 3. Administrar Planes de Pago de la Desarrolladora */}
            <button
              type="button"
              onClick={() => setShowPaymentPlansModal(true)}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "0.5rem",
                padding: "0.65rem 1.25rem",
                borderRadius: "9999px",
                border: "1.5px solid #00C48C",
                backgroundColor: "#FFFFFF",
                color: "#00C48C",
                fontSize: "0.82rem",
                fontWeight: 700,
                cursor: "pointer",
                transition: "all 0.15s ease",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "rgba(0, 196, 140, 0.05)")}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#FFFFFF")}
            >
              <Coins size={16} /> Administrar Planes de Pago de la Desarrolladora
            </button>

            {/* 4. Portal de pagos / Gestiona tu suscripción */}
            <button
              type="button"
              onClick={() => setShowSubscriptionModal(true)}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "0.5rem",
                padding: "0.65rem 1.25rem",
                borderRadius: "9999px",
                border: "1.5px solid #00C48C",
                backgroundColor: "#FFFFFF",
                color: "#00C48C",
                fontSize: "0.82rem",
                fontWeight: 700,
                cursor: "pointer",
                transition: "all 0.15s ease",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "rgba(0, 196, 140, 0.05)")}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#FFFFFF")}
            >
              <CreditCard size={16} /> Portal de pagos / Gestiona tu suscripción
            </button>
          </div>
        </div>

        {/* 2. BOTTOM CARD: SECCIÓN "AJUSTES" (Exacto a Screenshot 1) */}
        <div
          style={{
            backgroundColor: "#FFFFFF",
            borderRadius: "1.25rem",
            padding: "1.75rem 2rem",
            boxShadow: "0 2px 10px rgba(0,0,0,0.03)",
            border: "1px solid rgba(22, 43, 63, 0.05)",
          }}
        >
          <h3 style={{ fontSize: "1.15rem", fontWeight: 800, color: "#1F3652", margin: "0 0 1.25rem 0" }}>
            Ajustes
          </h3>

          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            
            {/* 0. Usuarios, Roles y Permisos */}
            <div
              onClick={() => setShowUsersModal(true)}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "1rem 1.25rem",
                borderRadius: "0.85rem",
                cursor: "pointer",
                transition: "background-color 0.15s ease",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#F8FAFC")}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                <div style={{ width: "36px", height: "36px", borderRadius: "50%", backgroundColor: "rgba(0, 196, 140, 0.12)", color: "#00C48C", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Users size={18} />
                </div>
                <div>
                  <span style={{ fontSize: "0.9rem", fontWeight: 700, color: "#1F3652", display: "block" }}>
                    Usuarios, Roles y Matriz de Permisos
                  </span>
                  <span style={{ fontSize: "0.75rem", color: "#64748B" }}>
                    Administra colaboradores, roles y permisos granulares por módulo con cascada inteligente
                  </span>
                </div>
              </div>
              <ChevronRight size={18} color="#94A3B8" />
            </div>

            {/* 1. Información personal */}
            <div
              onClick={() => setShowPersonalInfoModal(true)}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "1rem 1.25rem",
                borderRadius: "0.85rem",
                cursor: "pointer",
                transition: "background-color 0.15s ease",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#F8FAFC")}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                <div style={{ width: "36px", height: "36px", borderRadius: "50%", backgroundColor: "rgba(47, 128, 237, 0.08)", color: "#2F80ED", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <User size={18} />
                </div>
                <span style={{ fontSize: "0.9rem", fontWeight: 600, color: "#1F3652" }}>
                  Información personal
                </span>
              </div>
              <ChevronRight size={18} color="#94A3B8" />
            </div>

            {/* 2. Planes de Pago de la Desarrolladora */}
            <div
              onClick={() => setShowPaymentPlansModal(true)}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "1rem 1.25rem",
                borderRadius: "0.85rem",
                cursor: "pointer",
                transition: "background-color 0.15s ease",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#F8FAFC")}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                <div style={{ width: "36px", height: "36px", borderRadius: "50%", backgroundColor: "rgba(0, 196, 140, 0.1)", color: "#00C48C", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Coins size={18} />
                </div>
                <div>
                  <span style={{ fontSize: "0.9rem", fontWeight: 600, color: "#1F3652", display: "block" }}>
                    Planes de Pago de la Desarrolladora
                  </span>
                  <span style={{ fontSize: "0.75rem", color: "#64748B" }}>
                    {paymentPlans.length} esquemas globales disponibles para cotizar y vender
                  </span>
                </div>
              </div>
              <ChevronRight size={18} color="#94A3B8" />
            </div>

            {/* 2. Legal */}
            <div
              onClick={() => setShowLegalModal(true)}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "1rem 1.25rem",
                borderRadius: "0.85rem",
                cursor: "pointer",
                transition: "background-color 0.15s ease",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#F8FAFC")}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                <div style={{ width: "36px", height: "36px", borderRadius: "50%", backgroundColor: "rgba(47, 128, 237, 0.08)", color: "#2F80ED", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Shield size={18} />
                </div>
                <span style={{ fontSize: "0.9rem", fontWeight: 600, color: "#1F3652" }}>
                  Legal
                </span>
              </div>
              <ChevronRight size={18} color="#94A3B8" />
            </div>

            {/* 3. Soporte y Ayuda */}
            <div
              onClick={() => setShowSupportModal(true)}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "1rem 1.25rem",
                borderRadius: "0.85rem",
                cursor: "pointer",
                transition: "background-color 0.15s ease",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#F8FAFC")}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                <div style={{ width: "36px", height: "36px", borderRadius: "50%", backgroundColor: "rgba(47, 128, 237, 0.08)", color: "#2F80ED", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <HelpCircle size={18} />
                </div>
                <span style={{ fontSize: "0.9rem", fontWeight: 600, color: "#1F3652" }}>
                  Soporte y Ayuda
                </span>
              </div>
              <ChevronRight size={18} color="#94A3B8" />
            </div>

            {/* 4. Cerrar Sesión */}
            <div
              onClick={handleLogout}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "1rem 1.25rem",
                borderRadius: "0.85rem",
                cursor: "pointer",
                transition: "background-color 0.15s ease",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "rgba(224, 83, 69, 0.04)")}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                <div style={{ width: "36px", height: "36px", borderRadius: "50%", backgroundColor: "rgba(224, 83, 69, 0.08)", color: "#E05345", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <LogOut size={18} />
                </div>
                <span style={{ fontSize: "0.9rem", fontWeight: 700, color: "#E05345" }}>
                  Cerrar Sesión
                </span>
              </div>
              <ChevronRight size={18} color="#E05345" />
            </div>

          </div>
        </div>

        {/* ============================================================== */}
        {/* MODAL 1: USUARIOS (Exacto a Screenshot 2)                      */}
        {/* ============================================================== */}
        {showUsersModal && (
          <div
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: "rgba(15, 23, 42, 0.65)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 9999,
              padding: "1rem",
              backdropFilter: "blur(4px)",
            }}
          >
            <div
              style={{
                backgroundColor: "#FFFFFF",
                borderRadius: "1.25rem",
                width: "100%",
                maxWidth: "520px",
                maxHeight: "90vh",
                overflowY: "auto",
                boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
                padding: "2rem",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
                <h2 style={{ fontSize: "1.5rem", fontWeight: 800, color: "#1F3652", margin: 0 }}>
                  Usuarios
                </h2>
                <button
                  type="button"
                  onClick={() => setShowUsersModal(false)}
                  style={{ background: "#F1F5F9", border: "none", color: "#64748B", cursor: "pointer", width: "32px", height: "32px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}
                >
                  <X size={18} />
                </button>
              </div>

              {/* Botón Añadir Nuevo Usuario */}
              <div style={{ display: "flex", justifyContent: "center", marginBottom: "1.25rem" }}>
                <button
                  type="button"
                  onClick={handleOpenAddUser}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "0.45rem",
                    backgroundColor: "#1B3047",
                    color: "#FFFFFF",
                    padding: "0.6rem 1.5rem",
                    borderRadius: "9999px",
                    fontSize: "0.82rem",
                    fontWeight: 700,
                    border: "none",
                    cursor: "pointer",
                    boxShadow: "0 2px 6px rgba(27, 48, 71, 0.15)",
                  }}
                >
                  <Plus size={15} /> Añadir Nuevo Usuario
                </button>
              </div>

              {/* Input Buscar por Nombre */}
              <div style={{ marginBottom: "1.25rem" }}>
                <input
                  type="text"
                  placeholder="Buscar por Nombre"
                  value={userSearchQuery}
                  onChange={(e) => setUserSearchQuery(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "0.65rem 1rem",
                    borderRadius: "0.6rem",
                    border: "1px solid #CBD5E1",
                    fontSize: "0.85rem",
                    color: "#1F3652",
                    outline: "none",
                  }}
                />
              </div>

              {/* User List Cards */}
              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                {filteredUsers.map((user) => (
                  <div
                    key={user.id}
                    style={{
                      backgroundColor: "#F8FAFC",
                      borderRadius: "0.85rem",
                      padding: "0.85rem 1.15rem",
                      border: "1px solid #E2E8F0",
                      display: "flex",
                      alignItems: "center",
                      gap: "0.85rem",
                    }}
                  >
                    <div style={{ width: "40px", height: "40px", borderRadius: "50%", border: "1.5px solid #CBD5E1", display: "flex", alignItems: "center", justifyContent: "center", color: "#64748B", backgroundColor: "#FFFFFF", flexShrink: 0 }}>
                      <User size={18} />
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                        <strong style={{ fontSize: "0.88rem", color: "#1F3652", display: "block" }}>
                          {user.name}
                        </strong>
                        <span style={{ fontSize: "0.68rem", backgroundColor: user.role === "Super Admin" ? "rgba(47, 128, 237, 0.12)" : "#E2E8F0", color: user.role === "Super Admin" ? "#2F80ED" : "#475569", fontWeight: 700, padding: "0.15rem 0.45rem", borderRadius: "9999px" }}>
                          {user.role}
                        </span>
                      </div>
                      <span style={{ fontSize: "0.75rem", color: "#64748B", display: "block", marginTop: "1px" }}>
                        {user.email}
                      </span>
                      <span style={{ fontSize: "0.72rem", color: "#10B981", fontWeight: 600, display: "block", marginTop: "2px" }}>
                        {user.permissions?.includes("all") ? "✓ Acceso Total (Super Admin)" : `✓ ${user.permissions?.length || 0} permisos asignados`}
                      </span>
                    </div>

                    {/* Botones Editar y Borrar Usuario */}
                    <div style={{ display: "flex", alignItems: "center", gap: "0.35rem", flexShrink: 0 }}>
                      <button
                        type="button"
                        onClick={() => handleOpenEditUser(user)}
                        title="Editar Usuario y Permisos"
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          justifyContent: "center",
                          width: "32px",
                          height: "32px",
                          borderRadius: "0.5rem",
                          border: "1px solid #CBD5E1",
                          backgroundColor: "#FFFFFF",
                          color: "#1B3047",
                          cursor: "pointer",
                          transition: "background-color 0.15s ease",
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#F1F5F9")}
                        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#FFFFFF")}
                      >
                        <Edit3 size={14} />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDeleteUser(user.id, user.name)}
                        title="Eliminar Usuario"
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          justifyContent: "center",
                          width: "32px",
                          height: "32px",
                          borderRadius: "0.5rem",
                          border: "1px solid #FECACA",
                          backgroundColor: "#FEF2F2",
                          color: "#DC2626",
                          cursor: "pointer",
                          transition: "background-color 0.15s ease",
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#FEE2E2")}
                        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#FEF2F2")}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* MODAL 2: AÑADE / EDITA USUARIOS Y PERMISOS                    */}
        {/* ============================================================== */}
        {showAddUserModal && (
          <div
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: "rgba(15, 23, 42, 0.7)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 10000,
              padding: "1.5rem",
              backdropFilter: "blur(5px)",
            }}
          >
            <div
              style={{
                backgroundColor: "#FFFFFF",
                borderRadius: "1.5rem",
                width: "100%",
                maxWidth: "760px",
                maxHeight: "92vh",
                overflowY: "auto",
                boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
                padding: "2.25rem",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.5rem" }}>
                <div>
                  <h2 style={{ fontSize: "1.6rem", fontWeight: 800, color: "#1F3652", margin: 0 }}>
                    {editingUserId ? "Editar Usuario" : "Añade Usuarios"}
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAddUserModal(false)}
                  style={{ background: "#F1F5F9", border: "none", color: "#64748B", cursor: "pointer", width: "32px", height: "32px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}
                >
                  <X size={18} />
                </button>
              </div>

              <p style={{ fontSize: "0.82rem", color: "#64748B", margin: "0 0 1.5rem 0" }}>
                {editingUserId
                  ? "Modifica los datos generales y la matriz granular de permisos para este usuario."
                  : "Añade usuarios para que tengan acceso a la plataforma, mas adelante podrás agregar mas según tus necesidades"}
              </p>

              <form onSubmit={handleCreateOrUpdateUser}>
                {/* Inputs: Nombre y Correo */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1.25rem" }}>
                  <div>
                    <label style={{ fontSize: "0.78rem", fontWeight: 700, color: "#1F3652", display: "block", marginBottom: "0.35rem" }}>
                      Nombre Completo <span style={{ color: "#EF4444" }}>*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="Nombre Completo"
                      value={newUserForm.name}
                      onChange={(e) => setNewUserForm({ ...newUserForm, name: e.target.value })}
                      style={{
                        width: "100%",
                        padding: "0.65rem 0.85rem",
                        borderRadius: "0.6rem",
                        border: "1px solid #CBD5E1",
                        fontSize: "0.85rem",
                        color: "#1F3652",
                      }}
                      required
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: "0.78rem", fontWeight: 700, color: "#1F3652", display: "block", marginBottom: "0.35rem" }}>
                      Correo electrónico <span style={{ color: "#EF4444" }}>*</span>
                    </label>
                    <input
                      type="email"
                      placeholder="Correo"
                      value={newUserForm.email}
                      onChange={(e) => setNewUserForm({ ...newUserForm, email: e.target.value })}
                      style={{
                        width: "100%",
                        padding: "0.65rem 0.85rem",
                        borderRadius: "0.6rem",
                        border: "1px solid #CBD5E1",
                        fontSize: "0.85rem",
                        color: "#1F3652",
                      }}
                      required
                    />
                  </div>
                </div>

                {/* Rol de Usuario */}
                <div style={{ marginBottom: "1.5rem" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.35rem" }}>
                    <label style={{ fontSize: "0.78rem", fontWeight: 700, color: "#1F3652" }}>
                      Rol de Usuario <span style={{ color: "#EF4444" }}>*</span>
                    </label>
                    <span style={{ fontSize: "0.72rem", color: "#64748B" }}>
                      Selecciona un rol para aplicar su plantilla de permisos
                    </span>
                  </div>
                  <select
                    value={newUserForm.role}
                    onChange={(e) => handleRoleChange(e.target.value as UserRole)}
                    style={{
                      width: "100%",
                      padding: "0.65rem 0.85rem",
                      borderRadius: "0.6rem",
                      border: "1px solid #CBD5E1",
                      fontSize: "0.85rem",
                      fontWeight: 600,
                      color: "#1F3652",
                      backgroundColor: "#FFFFFF",
                    }}
                  >
                    <option value="Super Admin">Super Admin (Acceso Total)</option>
                    <option value="Director Comercial">Director Comercial</option>
                    <option value="Asesor de Ventas">Asesor de Ventas</option>
                    <option value="Finanzas / Cobranza">Finanzas / Cobranza</option>
                    <option value="Residente de Obra">Residente de Obra</option>
                    <option value="Coordinador de Postventa">Coordinador de Postventa</option>
                    <option value="Legal / Notaría">Legal / Notaría</option>
                  </select>

                  {newUserForm.role === "Super Admin" && (
                    <div style={{ marginTop: "0.6rem", padding: "0.55rem 0.85rem", backgroundColor: "rgba(0, 196, 140, 0.08)", borderRadius: "0.5rem", border: "1px solid rgba(0, 196, 140, 0.2)", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <CheckCircle2 size={15} color="#00C48C" style={{ flexShrink: 0 }} />
                      <span style={{ fontSize: "0.75rem", color: "#1F3652", fontWeight: 600 }}>
                        El rol <strong>Super Admin</strong> cuenta con acceso total e ilimitado a todos los módulos y herramientas del sistema.
                      </span>
                    </div>
                  )}
                </div>

                {/* Accordion: Configuración Avanzada de Permisos con Cascada Inteligente */}
                <div style={{ marginBottom: "2rem" }}>
                  <button
                    type="button"
                    onClick={() => setShowAdvancedPerms(!showAdvancedPerms)}
                    style={{
                      width: "100%",
                      backgroundColor: "#1B3047",
                      color: "#FFFFFF",
                      padding: "0.75rem 1.25rem",
                      borderRadius: "0.75rem",
                      border: "none",
                      fontSize: "0.85rem",
                      fontWeight: 700,
                      cursor: "pointer",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: "1.25rem",
                      boxShadow: "0 2px 6px rgba(27, 48, 71, 0.15)",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <Shield size={16} />
                      <span>Matriz Inteligente de Permisos ({Object.values(permissionsState).filter(Boolean).length} activos)</span>
                    </div>
                    {showAdvancedPerms ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </button>

                  {showAdvancedPerms && (
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "1rem" }}>
                      {PERMISSIONS_CATALOG.map((cat) => {
                        const isCatParentActive = cat.parentKey ? Boolean(permissionsState[cat.parentKey]) : true;
                        const activeCount = cat.permissions.filter((p) => Boolean(permissionsState[p.key])).length;

                        return (
                          <div
                            key={cat.id}
                            style={{
                              backgroundColor: "#F8FAFC",
                              borderRadius: "0.85rem",
                              border: "1px solid #E2E8F0",
                              padding: "1rem",
                              display: "flex",
                              flexDirection: "column",
                              gap: "0.75rem",
                            }}
                          >
                            {/* Header Categoría */}
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid #E2E8F0", paddingBottom: "0.5rem" }}>
                              <div style={{ display: "flex", alignItems: "center", gap: "0.45rem" }}>
                                <div style={{ color: "#2F80ED" }}>
                                  {cat.iconName === "BarChart3" && <BarChart3 size={16} />}
                                  {cat.iconName === "Building" && <Building size={16} />}
                                  {cat.iconName === "Home" && <Home size={16} />}
                                  {cat.iconName === "ShoppingBag" && <ShoppingBag size={16} />}
                                  {cat.iconName === "CreditCard" && <CreditCard size={16} />}
                                  {cat.iconName === "Users" && <Users size={16} />}
                                  {cat.iconName === "FileText" && <FileText size={16} />}
                                  {cat.iconName === "HardHat" && <HardHat size={16} />}
                                  {cat.iconName === "ShieldCheck" && <ShieldCheck size={16} />}
                                  {cat.iconName === "Settings" && <Settings size={16} />}
                                </div>
                                <span style={{ fontSize: "0.82rem", fontWeight: 800, color: "#1F3652" }}>
                                  {cat.name}
                                </span>
                                <span style={{ fontSize: "0.68rem", backgroundColor: activeCount > 0 ? "rgba(0, 196, 140, 0.15)" : "#E2E8F0", color: activeCount > 0 ? "#009E70" : "#64748B", fontWeight: 700, padding: "0.1rem 0.4rem", borderRadius: "9999px" }}>
                                  {activeCount}/{cat.permissions.length}
                                </span>
                              </div>

                              <div style={{ display: "flex", gap: "0.25rem" }}>
                                <button
                                  type="button"
                                  onClick={() => handleToggleModule(cat.id, true)}
                                  style={{
                                    fontSize: "0.68rem",
                                    padding: "0.15rem 0.45rem",
                                    borderRadius: "0.35rem",
                                    border: "1px solid #CBD5E1",
                                    backgroundColor: "#FFFFFF",
                                    color: "#1F3652",
                                    fontWeight: 600,
                                    cursor: "pointer",
                                  }}
                                >
                                  Todos
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleToggleModule(cat.id, false)}
                                  style={{
                                    fontSize: "0.68rem",
                                    padding: "0.15rem 0.45rem",
                                    borderRadius: "0.35rem",
                                    border: "1px solid #CBD5E1",
                                    backgroundColor: "#FFFFFF",
                                    color: "#64748B",
                                    fontWeight: 600,
                                    cursor: "pointer",
                                  }}
                                >
                                  Ninguno
                                </button>
                              </div>
                            </div>

                            {/* Lista de Permisos con Cascada */}
                            <div style={{ display: "flex", flexDirection: "column", gap: "0.45rem" }}>
                              {cat.permissions.map((p) => {
                                const isChecked = Boolean(permissionsState[p.key]);
                                const isDisabled = Boolean(p.parentKey && !permissionsState[p.parentKey]);

                                return (
                                  <label
                                    key={p.key}
                                    style={{
                                      display: "flex",
                                      alignItems: "flex-start",
                                      gap: "0.45rem",
                                      cursor: isDisabled ? "not-allowed" : "pointer",
                                      opacity: isDisabled ? 0.45 : 1,
                                      backgroundColor: p.isParent
                                        ? isChecked ? "rgba(47, 128, 237, 0.08)" : "#FFFFFF"
                                        : "transparent",
                                      padding: p.isParent ? "0.35rem 0.5rem" : "0.2rem 0.35rem",
                                      borderRadius: "0.45rem",
                                      border: p.isParent ? "1px solid rgba(47, 128, 237, 0.2)" : "none",
                                      transition: "all 0.15s ease",
                                    }}
                                  >
                                    <input
                                      type="checkbox"
                                      checked={isChecked}
                                      disabled={isDisabled}
                                      onChange={() => togglePermission(p.key)}
                                      style={{ marginTop: "2px", accentColor: "#2F80ED", cursor: isDisabled ? "not-allowed" : "pointer" }}
                                    />
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                      <div style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
                                        <span style={{ fontSize: "0.76rem", fontWeight: p.isParent ? 800 : 600, color: p.isParent ? "#1F3652" : "#334155" }}>
                                          {p.label}
                                        </span>
                                        {p.isParent && (
                                          <span style={{ fontSize: "0.62rem", color: "#2F80ED", fontWeight: 700, backgroundColor: "rgba(47, 128, 237, 0.1)", padding: "0.05rem 0.3rem", borderRadius: "4px" }}>
                                            Principal
                                          </span>
                                        )}
                                        {isDisabled && (
                                          <span style={{ fontSize: "0.62rem", color: "#94A3B8", fontStyle: "italic" }}>
                                            (Requiere módulo)
                                          </span>
                                        )}
                                      </div>
                                      <span style={{ fontSize: "0.68rem", color: "#64748B", display: "block", marginTop: "1px", lineHeight: 1.25 }}>
                                        {p.description}
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
                  )}
                </div>

                {/* Botón Submit: Crear o Guardar usuario */}
                <div style={{ display: "flex", justifyContent: "center" }}>
                  <button
                    type="submit"
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "0.5rem",
                      backgroundColor: "#1B3047",
                      color: "#FFFFFF",
                      padding: "0.75rem 2.5rem",
                      borderRadius: "9999px",
                      fontSize: "0.9rem",
                      fontWeight: 700,
                      border: "none",
                      cursor: "pointer",
                      boxShadow: "0 4px 15px rgba(27, 48, 71, 0.2)",
                    }}
                  >
                    {editingUserId ? <Check size={17} /> : <Users size={17} />}{" "}
                    {editingUserId ? "Guardar Cambios de Usuario" : "Crear usuario y enviar accesos"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* MODAL 3: EDITAR DATOS DE LA DESARROLLADORA (ONBOARDING DATA)   */}
        {/* ============================================================== */}
        {showDeveloperModal && (
          <div
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: "rgba(15, 23, 42, 0.7)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 9999,
              padding: "1.5rem",
              backdropFilter: "blur(5px)",
            }}
          >
            <div
              style={{
                backgroundColor: "#FFFFFF",
                borderRadius: "1.5rem",
                width: "100%",
                maxWidth: "760px",
                maxHeight: "92vh",
                overflowY: "auto",
                boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
                padding: "2.25rem",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.5rem" }}>
                <div>
                  <span style={{ fontSize: "0.75rem", fontWeight: 800, color: "#00C48C", textTransform: "uppercase" }}>
                    Perfil Institucional
                  </span>
                  <h2 style={{ fontSize: "1.5rem", fontWeight: 800, color: "#1F3652", margin: "0.2rem 0 0" }}>
                    Editar Datos de la Desarrolladora
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={() => setShowDeveloperModal(false)}
                  style={{ background: "#F1F5F9", border: "none", color: "#64748B", cursor: "pointer", width: "32px", height: "32px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}
                >
                  <X size={18} />
                </button>
              </div>

              <p style={{ fontSize: "0.82rem", color: "#64748B", margin: "0 0 1.5rem 0" }}>
                Información legal, fiscal y bancaria guardada durante el onboarding de tu empresa. Se refleja en los contratos, recibos y facturas de la plataforma.
              </p>

              <form onSubmit={handleSaveDeveloperData}>
                
                {/* Bloque 1: Identidad Corporativa & Logo */}
                <div style={{ backgroundColor: "#F8FAFC", borderRadius: "1rem", padding: "1.25rem", border: "1px solid #E2E8F0", marginBottom: "1.25rem" }}>
                  <h4 style={{ fontSize: "0.85rem", fontWeight: 800, color: "#1F3652", margin: "0 0 0.85rem 0" }}>
                    1. Identidad de la Empresa & Logo
                  </h4>

                  {/* Logo de la Empresa */}
                  <div style={{ marginBottom: "1.25rem", padding: "1rem", backgroundColor: "#FFFFFF", borderRadius: "0.75rem", border: "1px solid #E2E8F0" }}>
                    <label style={{ fontSize: "0.78rem", fontWeight: 700, color: "#1F3652", display: "block", marginBottom: "0.5rem" }}>
                      Logo Oficial de la Desarrolladora
                    </label>
                    <div style={{ display: "flex", alignItems: "center", gap: "1.25rem", flexWrap: "wrap" }}>
                      <input
                        type="file"
                        ref={devLogoFileInputRef}
                        onChange={handleDevLogoFileSelect}
                        accept="image/png,image/*"
                        style={{ display: "none" }}
                      />
                      <div style={{ width: "90px", height: "55px", borderRadius: "0.5rem", border: "1px solid #CBD5E1", backgroundColor: "#F8FAFC", display: "flex", alignItems: "center", justifyContent: "center", padding: "0.25rem" }}>
                        {devData.logoUrl ? (
                          <img src={devData.logoUrl} alt="Logo" style={{ maxHeight: "100%", maxWidth: "100%", objectFit: "contain" }} />
                        ) : (
                          <span style={{ fontSize: "0.65rem", color: "#94A3B8" }}>Sin Logo</span>
                        )}
                      </div>
                      <div style={{ flex: 1, minWidth: "220px" }}>
                        <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                          <button
                            type="button"
                            onClick={() => devLogoFileInputRef.current?.click()}
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "0.35rem",
                              backgroundColor: "#1B3047",
                              color: "#FFFFFF",
                              border: "none",
                              padding: "0.45rem 0.85rem",
                              borderRadius: "9999px",
                              fontSize: "0.75rem",
                              fontWeight: 600,
                              cursor: "pointer",
                            }}
                          >
                            <UploadCloud size={14} /> Subir / Cambiar Logo (PNG)
                          </button>
                        </div>
                        <span style={{ fontSize: "0.7rem", color: "#64748B", display: "block", marginTop: "0.35rem" }}>
                          Archivo: <strong>{devData.logoName || (devData.logoUrl ? "logo-desarrolladora.png" : "Ninguno")}</strong> (Recomendado: PNG fondo transparente)
                        </span>
                      </div>
                    </div>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1rem" }}>
                    <div>
                      <label style={{ fontSize: "0.78rem", fontWeight: 700, color: "#1F3652", display: "block", marginBottom: "0.35rem" }}>
                        Razón Social Legal
                      </label>
                      <input
                        type="text"
                        value={devData.businessName}
                        onChange={(e) => setDevData({ ...devData, businessName: e.target.value })}
                        style={{ width: "100%", padding: "0.65rem 0.85rem", borderRadius: "0.6rem", border: "1px solid #CBD5E1", fontSize: "0.85rem", color: "#1F3652" }}
                        required
                      />
                    </div>

                    <div>
                      <label style={{ fontSize: "0.78rem", fontWeight: 700, color: "#1F3652", display: "block", marginBottom: "0.35rem" }}>
                        Nombre Comercial
                      </label>
                      <input
                        type="text"
                        value={devData.tradeName}
                        onChange={(e) => setDevData({ ...devData, tradeName: e.target.value })}
                        style={{ width: "100%", padding: "0.65rem 0.85rem", borderRadius: "0.6rem", border: "1px solid #CBD5E1", fontSize: "0.85rem", color: "#1F3652", fontWeight: 600 }}
                        required
                      />
                    </div>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1.5fr", gap: "1rem" }}>
                    <div>
                      <label style={{ fontSize: "0.78rem", fontWeight: 700, color: "#1F3652", display: "block", marginBottom: "0.35rem" }}>
                        RFC de la Empresa
                      </label>
                      <input
                        type="text"
                        value={devData.rfc}
                        onChange={(e) => setDevData({ ...devData, rfc: e.target.value.toUpperCase() })}
                        style={{ width: "100%", padding: "0.65rem 0.85rem", borderRadius: "0.6rem", border: "1px solid #CBD5E1", fontSize: "0.85rem", color: "#1F3652", fontWeight: 700, textTransform: "uppercase" }}
                        required
                      />
                    </div>

                    <div>
                      <label style={{ fontSize: "0.78rem", fontWeight: 700, color: "#1F3652", display: "block", marginBottom: "0.35rem" }}>
                        Régimen Fiscal
                      </label>
                      <input
                        type="text"
                        value={devData.taxRegime}
                        onChange={(e) => setDevData({ ...devData, taxRegime: e.target.value })}
                        style={{ width: "100%", padding: "0.65rem 0.85rem", borderRadius: "0.6rem", border: "1px solid #CBD5E1", fontSize: "0.85rem", color: "#1F3652" }}
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* Bloque 2: Domicilio Fiscal y Contacto */}
                <div style={{ backgroundColor: "#F8FAFC", borderRadius: "1rem", padding: "1.25rem", border: "1px solid #E2E8F0", marginBottom: "1.25rem" }}>
                  <h4 style={{ fontSize: "0.85rem", fontWeight: 800, color: "#1F3652", margin: "0 0 0.85rem 0" }}>
                    2. Domicilio Fiscal & Contacto
                  </h4>

                  <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: "1rem", marginBottom: "0.85rem" }}>
                    <div>
                      <label style={{ fontSize: "0.78rem", fontWeight: 700, color: "#1F3652", display: "block", marginBottom: "0.35rem" }}>
                        Calle y Número
                      </label>
                      <input
                        type="text"
                        value={devData.addressStreet}
                        onChange={(e) => setDevData({ ...devData, addressStreet: e.target.value })}
                        style={{ width: "100%", padding: "0.65rem 0.85rem", borderRadius: "0.6rem", border: "1px solid #CBD5E1", fontSize: "0.85rem", color: "#1F3652" }}
                        required
                      />
                    </div>

                    <div>
                      <label style={{ fontSize: "0.78rem", fontWeight: 700, color: "#1F3652", display: "block", marginBottom: "0.35rem" }}>
                        Colonia
                      </label>
                      <input
                        type="text"
                        value={devData.addressCol}
                        onChange={(e) => setDevData({ ...devData, addressCol: e.target.value })}
                        style={{ width: "100%", padding: "0.65rem 0.85rem", borderRadius: "0.6rem", border: "1px solid #CBD5E1", fontSize: "0.85rem", color: "#1F3652" }}
                      />
                    </div>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.75rem", marginBottom: "0.85rem" }}>
                    <div>
                      <label style={{ fontSize: "0.78rem", fontWeight: 700, color: "#1F3652", display: "block", marginBottom: "0.35rem" }}>
                        Ciudad
                      </label>
                      <input
                        type="text"
                        value={devData.city}
                        onChange={(e) => setDevData({ ...devData, city: e.target.value })}
                        style={{ width: "100%", padding: "0.65rem 0.85rem", borderRadius: "0.6rem", border: "1px solid #CBD5E1", fontSize: "0.85rem", color: "#1F3652" }}
                      />
                    </div>

                    <div>
                      <label style={{ fontSize: "0.78rem", fontWeight: 700, color: "#1F3652", display: "block", marginBottom: "0.35rem" }}>
                        Estado
                      </label>
                      <input
                        type="text"
                        value={devData.state}
                        onChange={(e) => setDevData({ ...devData, state: e.target.value })}
                        style={{ width: "100%", padding: "0.65rem 0.85rem", borderRadius: "0.6rem", border: "1px solid #CBD5E1", fontSize: "0.85rem", color: "#1F3652" }}
                      />
                    </div>

                    <div>
                      <label style={{ fontSize: "0.78rem", fontWeight: 700, color: "#1F3652", display: "block", marginBottom: "0.35rem" }}>
                        C.P.
                      </label>
                      <input
                        type="text"
                        value={devData.zipCode}
                        onChange={(e) => setDevData({ ...devData, zipCode: e.target.value })}
                        style={{ width: "100%", padding: "0.65rem 0.85rem", borderRadius: "0.6rem", border: "1px solid #CBD5E1", fontSize: "0.85rem", color: "#1F3652" }}
                      />
                    </div>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                    <div>
                      <label style={{ fontSize: "0.78rem", fontWeight: 700, color: "#1F3652", display: "block", marginBottom: "0.35rem" }}>
                        Teléfono Oficial / WhatsApp
                      </label>
                      <PhoneInput
                        value={devData.phone}
                        onChange={(fullVal) => setDevData({ ...devData, phone: fullVal })}
                      />
                    </div>

                    <div>
                      <label style={{ fontSize: "0.78rem", fontWeight: 700, color: "#1F3652", display: "block", marginBottom: "0.35rem" }}>
                        Correo de Facturación
                      </label>
                      <input
                        type="email"
                        value={devData.billingEmail}
                        onChange={(e) => setDevData({ ...devData, billingEmail: e.target.value })}
                        style={{ width: "100%", padding: "0.65rem 0.85rem", borderRadius: "0.6rem", border: "1px solid #CBD5E1", fontSize: "0.85rem", color: "#1F3652" }}
                      />
                    </div>
                  </div>
                </div>

                {/* Bloque 3: Cuenta Bancaria SPEI para Cobranza */}
                <div style={{ backgroundColor: "#F8FAFC", borderRadius: "1rem", padding: "1.25rem", border: "1px solid #E2E8F0", marginBottom: "1.75rem" }}>
                  <h4 style={{ fontSize: "0.85rem", fontWeight: 800, color: "#1F3652", margin: "0 0 0.85rem 0" }}>
                    3. Cuenta Bancaria para Cobranza SPEI
                  </h4>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1.5fr", gap: "1rem", marginBottom: "0.85rem" }}>
                    <div>
                      <label style={{ fontSize: "0.78rem", fontWeight: 700, color: "#1F3652", display: "block", marginBottom: "0.35rem" }}>
                        Banco Receptor
                      </label>
                      <input
                        type="text"
                        value={devData.bankName}
                        onChange={(e) => setDevData({ ...devData, bankName: e.target.value })}
                        style={{ width: "100%", padding: "0.65rem 0.85rem", borderRadius: "0.6rem", border: "1px solid #CBD5E1", fontSize: "0.85rem", color: "#1F3652" }}
                      />
                    </div>

                    <div>
                      <label style={{ fontSize: "0.78rem", fontWeight: 700, color: "#1F3652", display: "block", marginBottom: "0.35rem" }}>
                        CLABE Interbancaria (18 dígitos)
                      </label>
                      <input
                        type="text"
                        value={devData.clabe}
                        onChange={(e) => setDevData({ ...devData, clabe: e.target.value })}
                        style={{ width: "100%", padding: "0.65rem 0.85rem", borderRadius: "0.6rem", border: "1px solid #CBD5E1", fontSize: "0.85rem", color: "#1F3652", fontWeight: 700, letterSpacing: "0.05em" }}
                      />
                    </div>
                  </div>
                </div>

                <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem" }}>
                  <button
                    type="button"
                    onClick={() => setShowDeveloperModal(false)}
                    style={{
                      padding: "0.65rem 1.4rem",
                      borderRadius: "9999px",
                      border: "1px solid #CBD5E1",
                      backgroundColor: "#FFFFFF",
                      color: "#64748B",
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
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "0.45rem",
                      backgroundColor: "#1B3047",
                      color: "#FFFFFF",
                      padding: "0.65rem 2rem",
                      borderRadius: "9999px",
                      fontSize: "0.85rem",
                      fontWeight: 700,
                      border: "none",
                      cursor: "pointer",
                      boxShadow: "0 4px 12px rgba(27, 48, 71, 0.2)",
                    }}
                  >
                    <Check size={16} /> Guardar Datos
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* MODAL 4: PORTAL DE PAGOS / SUSCRIPCIÓN                         */}
        {/* ============================================================== */}
        {showSubscriptionModal && (
          <div
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: "rgba(15, 23, 42, 0.65)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 9999,
              padding: "1.5rem",
              backdropFilter: "blur(4px)",
            }}
          >
            <div
              style={{
                backgroundColor: "#FFFFFF",
                borderRadius: "1.5rem",
                width: "100%",
                maxWidth: "580px",
                boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
                padding: "2rem",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.25rem" }}>
                <div>
                  <span style={{ fontSize: "0.75rem", fontWeight: 800, color: "#2F80ED", textTransform: "uppercase" }}>
                    Facturación Devio SaaS
                  </span>
                  <h2 style={{ fontSize: "1.35rem", fontWeight: 800, color: "#1F3652", margin: "0.2rem 0 0" }}>
                    Plan & Suscripción
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={() => setShowSubscriptionModal(false)}
                  style={{ background: "#F1F5F9", border: "none", color: "#64748B", cursor: "pointer", width: "32px", height: "32px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}
                >
                  <X size={18} />
                </button>
              </div>

              {/* Plan Activo Card */}
              <div style={{ backgroundColor: "#F0FDF4", border: "1.5px solid #BBF7D0", borderRadius: "1rem", padding: "1.25rem", marginBottom: "1.25rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
                  <strong style={{ fontSize: "1.05rem", color: "#166534" }}>Plan Enterprise Developer</strong>
                  <span style={{ backgroundColor: "#00C48C", color: "#FFFFFF", fontSize: "0.72rem", fontWeight: 800, padding: "0.2rem 0.6rem", borderRadius: "9999px" }}>
                    ACTIVO
                  </span>
                </div>
                <p style={{ fontSize: "0.82rem", color: "#166534", margin: 0 }}>
                  Proyectos ilimitados, módulos de cotización, cobranza SPEI, clientes, contratos y bóveda documental activa.
                </p>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem" }}>
                <button
                  type="button"
                  onClick={() => {
                    showToast("Portal de Pagos", "Redirigiendo a Stripe Customer Portal...");
                    setShowSubscriptionModal(false);
                  }}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "0.45rem",
                    backgroundColor: "#1B3047",
                    color: "#FFFFFF",
                    padding: "0.65rem 1.5rem",
                    borderRadius: "9999px",
                    fontSize: "0.85rem",
                    fontWeight: 700,
                    border: "none",
                    cursor: "pointer",
                  }}
                >
                  <CreditCard size={16} /> Gestionar Tarjeta & Facturas (Stripe)
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* MODAL 5: INFORMACIÓN PERSONAL                                  */}
        {/* ============================================================== */}
        {showPersonalInfoModal && (
          <div
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: "rgba(15, 23, 42, 0.65)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 9999,
              padding: "1.5rem",
              backdropFilter: "blur(4px)",
            }}
          >
            <div
              style={{
                backgroundColor: "#FFFFFF",
                borderRadius: "1.5rem",
                width: "100%",
                maxWidth: "520px",
                boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
                padding: "2rem",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.25rem" }}>
                <h2 style={{ fontSize: "1.35rem", fontWeight: 800, color: "#1F3652", margin: 0 }}>
                  Información Personal
                </h2>
                <button
                  type="button"
                  onClick={() => setShowPersonalInfoModal(false)}
                  style={{ background: "#F1F5F9", border: "none", color: "#64748B", cursor: "pointer", width: "32px", height: "32px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleSavePersonalInfo}>
                <div style={{ display: "flex", flexDirection: "column", gap: "1rem", marginBottom: "1.5rem" }}>
                  <div>
                    <label style={{ fontSize: "0.78rem", fontWeight: 700, color: "#1F3652", display: "block", marginBottom: "0.35rem" }}>
                      Nombre de Usuario
                    </label>
                    <input
                      type="text"
                      value={personalInfo.name}
                      onChange={(e) => setPersonalInfo({ ...personalInfo, name: e.target.value })}
                      style={{ width: "100%", padding: "0.65rem 0.85rem", borderRadius: "0.6rem", border: "1px solid #CBD5E1", fontSize: "0.85rem", color: "#1F3652" }}
                      required
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: "0.78rem", fontWeight: 700, color: "#1F3652", display: "block", marginBottom: "0.35rem" }}>
                      Correo Electrónico
                    </label>
                    <input
                      type="email"
                      value={personalInfo.email}
                      onChange={(e) => setPersonalInfo({ ...personalInfo, email: e.target.value })}
                      style={{ width: "100%", padding: "0.65rem 0.85rem", borderRadius: "0.6rem", border: "1px solid #CBD5E1", fontSize: "0.85rem", color: "#1F3652" }}
                      required
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: "0.78rem", fontWeight: 700, color: "#1F3652", display: "block", marginBottom: "0.35rem" }}>
                      Teléfono
                    </label>
                    <PhoneInput
                      value={personalInfo.phone}
                      onChange={(fullVal) => setPersonalInfo({ ...personalInfo, phone: fullVal })}
                    />
                  </div>
                </div>

                <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem" }}>
                  <button
                    type="button"
                    onClick={() => setShowPersonalInfoModal(false)}
                    style={{ padding: "0.65rem 1.4rem", borderRadius: "9999px", border: "1px solid #CBD5E1", backgroundColor: "#FFFFFF", color: "#64748B", fontSize: "0.82rem", fontWeight: 600, cursor: "pointer" }}
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    style={{ display: "inline-flex", alignItems: "center", gap: "0.45rem", backgroundColor: "#1B3047", color: "#FFFFFF", padding: "0.65rem 1.75rem", borderRadius: "9999px", fontSize: "0.85rem", fontWeight: 700, border: "none", cursor: "pointer" }}
                  >
                    <Check size={16} /> Guardar
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* MODAL 6: LEGAL                                                 */}
        {/* ============================================================== */}
        {showLegalModal && (
          <div
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: "rgba(15, 23, 42, 0.65)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 9999,
              padding: "1.5rem",
              backdropFilter: "blur(4px)",
            }}
          >
            <div
              style={{
                backgroundColor: "#FFFFFF",
                borderRadius: "1.5rem",
                width: "100%",
                maxWidth: "600px",
                maxHeight: "85vh",
                overflowY: "auto",
                boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
                padding: "2rem",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.25rem" }}>
                <h2 style={{ fontSize: "1.35rem", fontWeight: 800, color: "#1F3652", margin: 0 }}>
                  Información Legal & Privacidad
                </h2>
                <button
                  type="button"
                  onClick={() => setShowLegalModal(false)}
                  style={{ background: "#F1F5F9", border: "none", color: "#64748B", cursor: "pointer", width: "32px", height: "32px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}
                >
                  <X size={18} />
                </button>
              </div>

              <div style={{ fontSize: "0.82rem", color: "#475569", lineHeight: 1.6, display: "flex", flexDirection: "column", gap: "1rem" }}>
                <p><strong>Aviso de Privacidad:</strong> Devio MX protege la información de las desarrolladoras inmobiliarias y sus clientes conforme a la Ley Federal de Protección de Datos Personales en Posesión de los Particulares (LFPDPPP).</p>
                <p><strong>Seguridad Bancaria:</strong> Toda la información de pagos, recibos y cuentas CLABE se transmite mediante cifrado TLS 1.3 y almacenamiento bancario segregado.</p>
                <p><strong>Propiedad Intelectual:</strong> Los expedientes, planos, contratos y cotizaciones generados en esta plataforma pertenecen exclusivamente a la desarrolladora titular.</p>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "1.5rem" }}>
                <button
                  type="button"
                  onClick={() => setShowLegalModal(false)}
                  style={{ backgroundColor: "#1B3047", color: "#FFFFFF", padding: "0.6rem 1.5rem", borderRadius: "9999px", fontSize: "0.82rem", fontWeight: 700, border: "none", cursor: "pointer" }}
                >
                  Entendido
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* MODAL 7: SOPORTE Y AYUDA                                       */}
        {/* ============================================================== */}
        {showSupportModal && (
          <div
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: "rgba(15, 23, 42, 0.65)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 9999,
              padding: "1.5rem",
              backdropFilter: "blur(4px)",
            }}
          >
            <div
              style={{
                backgroundColor: "#FFFFFF",
                borderRadius: "1.5rem",
                width: "100%",
                maxWidth: "520px",
                boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
                padding: "2rem",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.25rem" }}>
                <h2 style={{ fontSize: "1.35rem", fontWeight: 800, color: "#1F3652", margin: 0 }}>
                  Soporte y Ayuda Devio
                </h2>
                <button
                  type="button"
                  onClick={() => setShowSupportModal(false)}
                  style={{ background: "#F1F5F9", border: "none", color: "#64748B", cursor: "pointer", width: "32px", height: "32px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}
                >
                  <X size={18} />
                </button>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "1rem", marginBottom: "1.5rem" }}>
                <div style={{ backgroundColor: "#F8FAFC", padding: "1rem", borderRadius: "0.85rem", border: "1px solid #E2E8F0" }}>
                  <strong style={{ fontSize: "0.88rem", color: "#1F3652", display: "block", marginBottom: "0.25rem" }}>
                    Atención por WhatsApp 24/7
                  </strong>
                  <span style={{ fontSize: "0.8rem", color: "#64748B", display: "block", marginBottom: "0.75rem" }}>
                    Soporte directo con tu asesor técnico asignado de Devio.
                  </span>
                  <a
                    href="https://wa.me/523318497489"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "0.4rem",
                      backgroundColor: "#25D366",
                      color: "#FFFFFF",
                      padding: "0.5rem 1.25rem",
                      borderRadius: "9999px",
                      fontSize: "0.82rem",
                      fontWeight: 700,
                      textDecoration: "none",
                    }}
                  >
                    <Phone size={14} /> Abrir WhatsApp
                  </a>
                </div>

                <div style={{ backgroundColor: "#F8FAFC", padding: "1rem", borderRadius: "0.85rem", border: "1px solid #E2E8F0" }}>
                  <strong style={{ fontSize: "0.88rem", color: "#1F3652", display: "block", marginBottom: "0.25rem" }}>
                    Correo Electrónico de Mesa de Ayuda
                  </strong>
                  <span style={{ fontSize: "0.8rem", color: "#64748B", display: "block" }}>
                    soporte@deviomx.com
                  </span>
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end" }}>
                <button
                  type="button"
                  onClick={() => setShowSupportModal(false)}
                  style={{ backgroundColor: "#1B3047", color: "#FFFFFF", padding: "0.6rem 1.5rem", borderRadius: "9999px", fontSize: "0.82rem", fontWeight: 700, border: "none", cursor: "pointer" }}
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* MODAL 8: ADMINISTRAR PLANES DE PAGO DE LA DESARROLLADORA       */}
        {/* ============================================================== */}
        {showPaymentPlansModal && (
          <div
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: "rgba(15, 23, 42, 0.65)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 9999,
              padding: "1.5rem",
              backdropFilter: "blur(4px)",
            }}
          >
            <div
              style={{
                backgroundColor: "#FFFFFF",
                borderRadius: "1.5rem",
                width: "100%",
                maxWidth: "880px",
                maxHeight: "90vh",
                display: "flex",
                flexDirection: "column",
                boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
                overflow: "hidden",
              }}
            >
              {/* Header */}
              <div
                style={{
                  padding: "1.5rem 2rem",
                  borderBottom: "1px solid #E2E8F0",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  backgroundColor: "#FAFBFD",
                }}
              >
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.25rem" }}>
                    <div style={{ width: "28px", height: "28px", borderRadius: "6px", backgroundColor: "rgba(0, 196, 140, 0.15)", color: "#00C48C", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <Coins size={16} />
                    </div>
                    <h2 style={{ fontSize: "1.3rem", fontWeight: 800, color: "#1F3652", margin: 0 }}>
                      Planes de Pago de la Desarrolladora
                    </h2>
                  </div>
                  <p style={{ fontSize: "0.82rem", color: "#64748B", margin: 0 }}>
                    Configura los esquemas globales de financiamiento disponibles para ventas y cotizaciones de tus proyectos.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowPaymentPlansModal(false)}
                  style={{ background: "#F1F5F9", border: "none", color: "#64748B", cursor: "pointer", width: "32px", height: "32px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}
                >
                  <X size={18} />
                </button>
              </div>

              {/* Action Toolbar */}
              <div
                style={{
                  padding: "1rem 2rem",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: "1rem",
                  borderBottom: "1px solid #F1F5F9",
                }}
              >
                <div style={{ position: "relative", flex: 1, maxWidth: "340px" }}>
                  <Search size={15} style={{ position: "absolute", left: "0.85rem", top: "50%", transform: "translateY(-50%)", color: "#94A3B8" }} />
                  <input
                    type="text"
                    value={planSearchQuery}
                    onChange={(e) => setPlanSearchQuery(e.target.value)}
                    placeholder="Buscar planes de pago..."
                    style={{
                      width: "100%",
                      padding: "0.5rem 0.85rem 0.5rem 2.25rem",
                      borderRadius: "0.5rem",
                      border: "1px solid #E2E8F0",
                      fontSize: "0.82rem",
                      outline: "none",
                    }}
                  />
                </div>

                <button
                  type="button"
                  onClick={handleOpenAddPlan}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "0.4rem",
                    padding: "0.55rem 1.25rem",
                    borderRadius: "9999px",
                    backgroundColor: "#00C48C",
                    color: "#FFFFFF",
                    fontSize: "0.82rem",
                    fontWeight: 700,
                    border: "none",
                    cursor: "pointer",
                  }}
                >
                  <Plus size={16} /> Nuevo Plan de Pago
                </button>
              </div>

              {/* Body: Plans Table */}
              <div style={{ flex: 1, overflowY: "auto", padding: "1.5rem 2rem" }}>
                {filteredPaymentPlans.length === 0 ? (
                  <div style={{ textAlign: "center", padding: "3rem 1rem", color: "#64748B" }}>
                    <Coins size={36} color="#CBD5E1" style={{ margin: "0 auto 0.75rem auto", display: "block" }} />
                    <strong style={{ fontSize: "0.95rem", color: "#1F3652", display: "block", marginBottom: "0.25rem" }}>
                      No se encontraron planes de pago
                    </strong>
                    <span style={{ fontSize: "0.82rem" }}>Crea un nuevo esquema con el botón superior.</span>
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                    {filteredPaymentPlans.map((plan) => {
                      const monthlyPct = Math.max(0, 100 - plan.downPaymentPct - plan.balloonLiquidationPct);
                      return (
                        <div
                          key={plan.id}
                          style={{
                            backgroundColor: plan.isActive ? "#FFFFFF" : "#F8FAFC",
                            border: plan.isActive ? "1px solid #E2E8F0" : "1px dashed #CBD5E1",
                            borderRadius: "0.85rem",
                            padding: "1.1rem 1.25rem",
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            gap: "1rem",
                            opacity: plan.isActive ? 1 : 0.65,
                            transition: "all 0.15s ease",
                          }}
                        >
                          <div style={{ flex: 1 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginBottom: "0.35rem" }}>
                              <strong style={{ fontSize: "0.95rem", color: "#1F3652" }}>
                                {plan.name}
                              </strong>
                              <span
                                style={{
                                  fontSize: "0.7rem",
                                  fontWeight: 800,
                                  padding: "0.15rem 0.5rem",
                                  borderRadius: "9999px",
                                  backgroundColor: plan.isActive ? "rgba(0, 196, 140, 0.12)" : "#E2E8F0",
                                  color: plan.isActive ? "#00C48C" : "#64748B",
                                }}
                              >
                                {plan.isActive ? "ACTIVO" : "INACTIVO"}
                              </span>
                              {plan.discountPct > 0 && (
                                <span
                                  style={{
                                    fontSize: "0.7rem",
                                    fontWeight: 800,
                                    padding: "0.15rem 0.5rem",
                                    borderRadius: "9999px",
                                    backgroundColor: "rgba(47, 128, 237, 0.1)",
                                    color: "#2F80ED",
                                  }}
                                >
                                  {plan.discountPct}% Descuento
                                </span>
                              )}
                            </div>

                            {plan.description && (
                              <p style={{ fontSize: "0.78rem", color: "#64748B", margin: "0 0 0.5rem 0" }}>
                                {plan.description}
                              </p>
                            )}

                            {/* Schema Breakdown Badges */}
                            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
                              <span style={{ fontSize: "0.75rem", backgroundColor: "#F1F5F9", padding: "0.25rem 0.6rem", borderRadius: "0.4rem", color: "#1F3652", fontWeight: 600 }}>
                                <strong>{plan.downPaymentPct}%</strong> Enganche
                              </span>
                              <span style={{ fontSize: "0.75rem", backgroundColor: "#F1F5F9", padding: "0.25rem 0.6rem", borderRadius: "0.4rem", color: "#1F3652", fontWeight: 600 }}>
                                <strong>{plan.installmentsCount}</strong> Plazos ({monthlyPct}%)
                              </span>
                              <span style={{ fontSize: "0.75rem", backgroundColor: "#F1F5F9", padding: "0.25rem 0.6rem", borderRadius: "0.4rem", color: "#1F3652", fontWeight: 600 }}>
                                <strong>{plan.balloonLiquidationPct}%</strong> Liquidación
                              </span>
                              <span style={{ fontSize: "0.75rem", backgroundColor: "#FEF3C7", padding: "0.25rem 0.6rem", borderRadius: "0.4rem", color: "#92400E", fontWeight: 600 }}>
                                <strong>{plan.moratoryRatePct ?? 3}%</strong> Interés Moratorio/mes
                              </span>
                            </div>
                          </div>

                          {/* Action buttons */}
                          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                            <button
                              type="button"
                              onClick={() => updatePaymentPlan(plan.id, { isActive: !plan.isActive })}
                              title={plan.isActive ? "Desactivar plan" : "Activar plan"}
                              style={{
                                padding: "0.4rem 0.75rem",
                                borderRadius: "0.4rem",
                                border: "1px solid #CBD5E1",
                                backgroundColor: "#FFFFFF",
                                fontSize: "0.75rem",
                                fontWeight: 700,
                                color: plan.isActive ? "#64748B" : "#00C48C",
                                cursor: "pointer",
                              }}
                            >
                              {plan.isActive ? "Desactivar" : "Activar"}
                            </button>
                            <button
                              type="button"
                              onClick={() => handleOpenEditPlan(plan)}
                              title="Editar plan"
                              style={{
                                width: "32px",
                                height: "32px",
                                borderRadius: "0.4rem",
                                border: "1px solid #E2E8F0",
                                backgroundColor: "#FFFFFF",
                                color: "#2F80ED",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                cursor: "pointer",
                              }}
                            >
                              <Edit3 size={15} />
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                if (confirm(`¿Estás seguro de eliminar el plan "${plan.name}"?`)) {
                                  deletePaymentPlan(plan.id);
                                }
                              }}
                              title="Eliminar plan"
                              style={{
                                width: "32px",
                                height: "32px",
                                borderRadius: "0.4rem",
                                border: "1px solid #FEE2E2",
                                backgroundColor: "#FFF5F5",
                                color: "#EF4444",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                cursor: "pointer",
                              }}
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Footer */}
              <div
                style={{
                  padding: "1rem 2rem",
                  borderTop: "1px solid #E2E8F0",
                  backgroundColor: "#FAFBFD",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <span style={{ fontSize: "0.8rem", color: "#64748B" }}>
                  {filteredPaymentPlans.length} planes registrados
                </span>
                <button
                  type="button"
                  onClick={() => setShowPaymentPlansModal(false)}
                  style={{
                    backgroundColor: "#1B3047",
                    color: "#FFFFFF",
                    padding: "0.55rem 1.5rem",
                    borderRadius: "9999px",
                    fontSize: "0.82rem",
                    fontWeight: 700,
                    border: "none",
                    cursor: "pointer",
                  }}
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* MODAL 9: CREAR / EDITAR PLAN DE PAGO (UNIFICADO)               */}
        {/* ============================================================== */}
        <PaymentPlanModal
          isOpen={showAddEditPlanModal}
          onClose={() => {
            setShowAddEditPlanModal(false);
            setEditingPlanId(null);
          }}
          initialPlan={editingPlanId ? paymentPlans.find((p) => p.id === editingPlanId) : null}
          onSave={(savedPlan) => {
            const planToSave: Omit<DeveloperPaymentPlan, "id"> & { id?: string } = {
              name: savedPlan.name,
              downPaymentPct: savedPlan.downPaymentPercentage,
              installmentsCount: savedPlan.installmentsCount,
              balloonLiquidationPct: savedPlan.settlementPercentage,
              discountPct: savedPlan.discountPercentage,
              moratoryRatePct: savedPlan.interestPercentage || 3.0,
              isActive: savedPlan.isActive !== false,
              description: savedPlan.internalNotes || savedPlan.description || "",
            };
            if (editingPlanId) {
              updatePaymentPlan(editingPlanId, planToSave);
            } else {
              addPaymentPlan(planToSave);
            }
            setShowAddEditPlanModal(false);
            setEditingPlanId(null);
          }}
        />


      </main>
    </AppLayout>
  );
}
