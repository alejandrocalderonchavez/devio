"use client";

import React, { useState, useRef, useEffect, useMemo } from "react";
import Link from "next/link";
import * as XLSX from "xlsx";
import {
  generateUnitsExcelTemplate,
  generateAdditionalsExcelTemplate,
  parseUnitsExcelFile,
  normalizeHeader,
  UnmappedColumnInfo,
} from "@/lib/excel-utils";
import {
  Building2,
  Home,
  Store,
  Factory,
  Layers,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  Plus,
  Trash2,
  Upload,
  Download,
  FileSpreadsheet,
  Coins,
  MapPin,
  Calendar,
  FileText,
  X,
  Edit2,
  Columns,
  Sparkles,
  Save,
  Package,
  Search,
  TrendingUp,
  Percent,
  Check,
  Users,
  Info,
  Sliders,
  CheckSquare,
  Square,
} from "lucide-react";
import { DevioDatePicker } from "@/components/ui/devio-date-picker";
import { ProjectItem, UnitItem, ProjectAdditional, ProjectFloorPlan } from "@/data/projects-data";
import { UserRole, ROLE_PRESETS } from "@/lib/permissions";

type ProjectType = "VERTICAL" | "HORIZONTAL" | "COMMERCIAL" | "INDUSTRIAL" | "MIXED";
type Currency = "MXN" | "USD";
type Language = "ES" | "EN";

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: string;
  assigned: boolean;
}

interface CustomColumn {
  id: string;
  title: string;
  type: "number" | "text" | "file" | "image" | "boolean";
}

interface ColumnMappingDecision {
  headerName: string;
  action: "create" | "map" | "ignore";
  targetColId: string;
  newColTitle: string;
  newColType: "number" | "text" | "boolean";
}

interface DynamicUnitRow {
  id: string;
  unitNumber: string;
  surfaceM2: number;
  price: number;
  status: "Disponible" | "Apartada" | "Vendida" | "Bloqueada";
  deliveryDate: string;
  type: string;
  floorPlan?: string;
  extraFields: Record<string, any>;
}

interface AdditionalItem {
  id: string;
  name: string;
  type: "Estacionamiento" | "Bodega" | "Otro";
  price: number;
  status: "Disponible" | "Asignado" | "Vendido";
  notes: string;
}

interface PaymentPlanItem {
  id: string;
  name: string;
  paymentType: "ESQUEMA" | "CONTADO";
  downPaymentPercentage: number;
  installmentsCount: number;
  periodicity: string;
  settlementPercentage: number;
  interestPercentage: number;
  discountPercentage: number;
  internalNotes: string;
}

interface ProjectDocumentItem {
  id: string;
  title: string;
  category?: string;
  fileName: string;
  fileSize: string;
  internalNotes: string;
}

const STORAGE_KEY_GLOBAL_PLANS = "devio_payment_plans_library";

export default function ProjectOnboardingPage() {
  const [step, setStep] = useState<number>(1);
  const [errorMsg, setErrorMsg] = useState<string>("");
  const [projectType, setProjectType] = useState<ProjectType>("VERTICAL");
  const [baseCurrency, setBaseCurrency] = useState<Currency>("MXN");
  const [defaultLanguage, setDefaultLanguage] = useState<Language>("ES");

  // File Input Refs for bulk upload
  const unitsFileInputRef = useRef<HTMLInputElement>(null);
  const additionalsFileInputRef = useRef<HTMLInputElement>(null);

  // File Input Refs for Step 1 Media
  const logoInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const brochureInputRef = useRef<HTMLInputElement>(null);

  // Modal Doc File Input Ref
  const modalDocFileInputRef = useRef<HTMLInputElement>(null);

  const [projectLogoPreview, setProjectLogoPreview] = useState<string | null>(null);
  const [projectLogoName, setProjectLogoName] = useState<string>("");
  const [projectLogoSize, setProjectLogoSize] = useState<string>("");

  const [projectCoverPreview, setProjectCoverPreview] = useState<string | null>(null);
  const [projectCoverName, setProjectCoverName] = useState<string>("");
  const [projectCoverSize, setProjectCoverSize] = useState<string>("");

  const [galleryPreviews, setGalleryPreviews] = useState<Array<{ id: string; url: string; name: string; size: string }>>([]);
  const [brochureFile, setBrochureFile] = useState<{ name: string; size: string } | null>(null);

  // ETAPA 1: DATOS GENERALES DEL PROYECTO
  const [projectGeneralData, setProjectGeneralData] = useState({
    name: "",
    legalName: "",
    googleMapsUrl: "",
    description: "",
    websiteUrl: "",
    totalSurfaceM2: "",
    estimatedDeliveryDate: "",
  });

  // ETAPA 5: ASIGNACIÓN DE EQUIPO
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [newMemberName, setNewMemberName] = useState("");
  const [newMemberEmail, setNewMemberEmail] = useState("");
  const [newMemberRole, setNewMemberRole] = useState<UserRole>("Asesor de Ventas");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("devio_system_users") || sessionStorage.getItem("devio_system_users");
      if (stored) {
        try {
          const sysUsers: Array<{ id: string; name: string; email: string; role: string }> = JSON.parse(stored);
          if (sysUsers && sysUsers.length > 0) {
            setTeamMembers(
              sysUsers.map((u) => ({
                id: u.id,
                name: u.name,
                email: u.email,
                role: u.role,
                assigned: true,
              }))
            );
          }
        } catch (e) {}
      }
    }
  }, []);

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

  const handleToggleAssignMember = (id: string) => {
    setTeamMembers((prev) =>
      prev.map((m) => {
        if (m.id === id) {
          if (isSuperAdminRole(m.role)) {
            // El Super Admin siempre debe estar asignado a todos los proyectos de la desarrolladora
            return { ...m, assigned: true };
          }
          return { ...m, assigned: !m.assigned };
        }
        return m;
      })
    );
  };

  const handleSelectAllMembers = (assigned: boolean) => {
    setTeamMembers((prev) =>
      prev.map((m) => ({
        ...m,
        assigned: isSuperAdminRole(m.role) ? true : assigned,
      }))
    );
  };

  const handleAddNewTeamMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMemberName.trim() || !newMemberEmail.trim()) return;

    const newMember: TeamMember = {
      id: `usr-${Date.now()}`,
      name: newMemberName.trim(),
      email: newMemberEmail.trim(),
      role: newMemberRole,
      assigned: true,
    };

    setTeamMembers((prev) => [...prev, newMember]);

    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem("devio_system_users") || sessionStorage.getItem("devio_system_users");
        let sysUsers: any[] = stored ? JSON.parse(stored) : [];
        if (!sysUsers.some((u) => u.email.toLowerCase() === newMember.email.toLowerCase())) {
          sysUsers.push({
            id: newMember.id,
            name: newMember.name,
            email: newMember.email,
            role: newMember.role,
            status: "Activo",
            avatarUrl: "",
            permissions: ROLE_PRESETS[newMemberRole as UserRole] || [],
          });
          localStorage.setItem("devio_system_users", JSON.stringify(sysUsers));
          sessionStorage.setItem("devio_system_users", JSON.stringify(sysUsers));
        }
      } catch (err) {}
    }

    setNewMemberName("");
    setNewMemberEmail("");
    setNewMemberRole("Asesor de Ventas");
    setShowAddMemberModal(false);
  };

  // Media Handlers
  const handleLogoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    setErrorMsg("");
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.includes("png")) {
      setErrorMsg("El logo del proyecto debe ser en formato PNG.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setErrorMsg("El archivo excede el tamaño máximo permitido de 5MB.");
      return;
    }
    setProjectLogoName(file.name);
    setProjectLogoSize((file.size / (1024 * 1024)).toFixed(2) + " MB");
    const reader = new FileReader();
    reader.onload = (event) => {
      setProjectLogoPreview(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveLogo = (e: React.MouseEvent) => {
    e.stopPropagation();
    setProjectLogoPreview(null);
    setProjectLogoName("");
    setProjectLogoSize("");
    if (logoInputRef.current) logoInputRef.current.value = "";
  };

  const handleCoverSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    setErrorMsg("");
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setErrorMsg("La portada debe ser una imagen válida (JPG o PNG).");
      return;
    }
    setProjectCoverName(file.name);
    setProjectCoverSize((file.size / (1024 * 1024)).toFixed(2) + " MB");
    const reader = new FileReader();
    reader.onload = (event) => {
      setProjectCoverPreview(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveCover = (e: React.MouseEvent) => {
    e.stopPropagation();
    setProjectCoverPreview(null);
    setProjectCoverName("");
    setProjectCoverSize("");
    if (coverInputRef.current) coverInputRef.current.value = "";
  };

  const handleGallerySelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    setErrorMsg("");
    const files = e.target.files;
    if (!files || files.length === 0) return;
    Array.from(files).forEach((file) => {
      if (!file.type.startsWith("image/")) return;
      const reader = new FileReader();
      reader.onload = (event) => {
        setGalleryPreviews((prev) => [
          ...prev,
          {
            id: `img-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
            url: event.target?.result as string,
            name: file.name,
            size: (file.size / (1024 * 1024)).toFixed(2) + " MB",
          },
        ]);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleRemoveGalleryItem = (id: string) => {
    setGalleryPreviews((prev) => prev.filter((item) => item.id !== id));
  };

  const handleBrochureSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    setErrorMsg("");
    const file = e.target.files?.[0];
    if (!file) return;
    setBrochureFile({
      name: file.name,
      size: (file.size / (1024 * 1024)).toFixed(2) + " MB",
    });
  };

  const handleRemoveBrochure = (e: React.MouseEvent) => {
    e.stopPropagation();
    setBrochureFile(null);
    if (brochureInputRef.current) brochureInputRef.current.value = "";
  };

  // ETAPA 2: PLANTAS DE CONJUNTO
  const [onboardingFloorPlans, setOnboardingFloorPlans] = useState<ProjectFloorPlan[]>([]);
  const [isFloorPlanModalOpen, setIsFloorPlanModalOpen] = useState(false);
  const [editingFloorPlanForm, setEditingFloorPlanForm] = useState<{
    id?: string;
    name: string;
    imageUrl: string;
    assignedUnits: string[];
  }>({
    name: "",
    imageUrl: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1400&q=80",
    assignedUnits: [],
  });
  const floorPlanImageInputRef = useRef<HTMLInputElement>(null);

  const handleAutoGenerateFloorPlans = () => {
    if (units.length === 0) return;
    const defaultPlans: ProjectFloorPlan[] = [
      {
        id: `fp-onb-1`,
        name: "Planta Tipo A (2 Recámaras)",
        imageUrl: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1400&q=80",
      },
      {
        id: `fp-onb-2`,
        name: "Planta Tipo B (3 Recámaras)",
        imageUrl: "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1400&q=80",
      },
    ];

    setOnboardingFloorPlans(defaultPlans);
    // Assign first half to Tipo A, second half to Tipo B
    setUnits((prev) =>
      prev.map((u, idx) => ({
        ...u,
        floorPlan: idx % 2 === 0 ? "Planta Tipo A (2 Recámaras)" : "Planta Tipo B (3 Recámaras)",
      }))
    );
  };

  const handleOpenAddFloorPlan = () => {
    setEditingFloorPlanForm({
      name: `Planta Tipo ${String.fromCharCode(65 + onboardingFloorPlans.length)}`,
      imageUrl: "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1400&q=80",
      assignedUnits: [],
    });
    setIsFloorPlanModalOpen(true);
  };

  const handleOpenEditFloorPlan = (plan: ProjectFloorPlan) => {
    const assigned = units.filter((u) => u.floorPlan === plan.name).map((u) => u.unitNumber);
    setEditingFloorPlanForm({
      id: plan.id,
      name: plan.name,
      imageUrl: plan.imageUrl || "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1400&q=80",
      assignedUnits: assigned,
    });
    setIsFloorPlanModalOpen(true);
  };

  const handleSaveFloorPlan = () => {
    if (!editingFloorPlanForm.name.trim()) return;
    const planName = editingFloorPlanForm.name.trim();

    if (editingFloorPlanForm.id) {
      const oldPlan = onboardingFloorPlans.find((p) => p.id === editingFloorPlanForm.id);
      setOnboardingFloorPlans((prev) =>
        prev.map((p) =>
          p.id === editingFloorPlanForm.id
            ? {
                ...p,
                name: planName,
                imageUrl: editingFloorPlanForm.imageUrl,
              }
            : p
        )
      );

      // Update unit assignments
      setUnits((prev) =>
        prev.map((u) => {
          const wasSelectedForThis = editingFloorPlanForm.assignedUnits.includes(u.unitNumber);
          if (wasSelectedForThis) {
            return { ...u, floorPlan: planName };
          } else if (oldPlan && u.floorPlan === oldPlan.name) {
            return { ...u, floorPlan: undefined };
          }
          return u;
        })
      );
    } else {
      const newFp: ProjectFloorPlan = {
        id: `fp-onb-${Date.now()}`,
        name: planName,
        imageUrl: editingFloorPlanForm.imageUrl,
      };
      setOnboardingFloorPlans((prev) => [...prev, newFp]);

      // Assign to selected units
      if (editingFloorPlanForm.assignedUnits.length > 0) {
        setUnits((prev) =>
          prev.map((u) =>
            editingFloorPlanForm.assignedUnits.includes(u.unitNumber)
              ? { ...u, floorPlan: planName }
              : u
          )
        );
      }
    }
    setIsFloorPlanModalOpen(false);
  };

  const handleDeleteFloorPlan = (id: string) => {
    const planToDelete = onboardingFloorPlans.find((p) => p.id === id);
    setOnboardingFloorPlans((prev) => prev.filter((p) => p.id !== id));
    if (planToDelete) {
      setUnits((prev) =>
        prev.map((u) => (u.floorPlan === planToDelete.name ? { ...u, floorPlan: undefined } : u))
      );
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

  // Validation functions with target field IDs
  const validateStep = (stepNumber: number): { error: string; fieldId: string } | null => {
    if (stepNumber === 1) {
      if (!projectGeneralData.name.trim()) {
        return { error: "Por favor ingresa el Nombre del Proyecto.", fieldId: "proj_input_name" };
      }
      if (!projectGeneralData.legalName.trim()) {
        return { error: "Por favor ingresa la Razón Social del Proyecto.", fieldId: "proj_input_legalName" };
      }
      if (!projectLogoPreview) {
        return { error: "Por favor sube el Logo del Proyecto (Solo PNG).", fieldId: "proj_input_logo_box" };
      }
      if (!projectCoverPreview) {
        return { error: "Por favor sube la Portada del desarrollo.", fieldId: "proj_input_cover_box" };
      }
      if (!projectGeneralData.googleMapsUrl.trim()) {
        return { error: "Por favor ingresa el enlace de Ubicación (Google Maps).", fieldId: "proj_input_googleMaps" };
      }
      if (!projectGeneralData.description.trim()) {
        return { error: "Por favor ingresa la Descripción del proyecto.", fieldId: "proj_input_description" };
      }
      if (!projectGeneralData.totalSurfaceM2 || Number(projectGeneralData.totalSurfaceM2) <= 0) {
        return { error: "Por favor ingresa una Superficie total válida en m².", fieldId: "proj_input_totalSurface" };
      }
      if (!projectGeneralData.estimatedDeliveryDate.trim()) {
        return { error: "Por favor selecciona la Fecha de Entrega Estimada.", fieldId: "proj_input_deliveryDate" };
      }
    }
    return null;
  };

  const goToStep = (targetStep: number) => {
    if (targetStep > step) {
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

  // ETAPA 2: INVENTARIO DE UNIDADES
  const availableColumnPresets = [
    { id: "level", title: "Piso / Nivel", type: "text" as const },
    { id: "bedrooms", title: "Número de recámaras", type: "number" as const },
    { id: "bathrooms", title: "Número de baños", type: "number" as const },
    { id: "parkingSpaces", title: "Cajones de estacionamiento", type: "number" as const },
    { id: "terraceM2", title: "M² de terraza/balcón", type: "number" as const },
    { id: "view", title: "Vista", type: "text" as const },
    { id: "frontDepth", title: "(frente x fondo)", type: "text" as const },
    { id: "constructionArea", title: "Área total de construcción", type: "number" as const },
    { id: "garden", title: "Jardín (sí/no o m²)", type: "text" as const },
    { id: "usageType", title: "Tipo de uso", type: "text" as const },
    { id: "streetFront", title: "Frente a calle", type: "text" as const },
    { id: "roofedArea", title: "Área techada", type: "number" as const },
    { id: "clearHeight", title: "Altura libre (m)", type: "number" as const },
    { id: "floorLoadCapacity", title: "Capacidad de carga de piso (tons/m²)", type: "number" as const },
    { id: "loadingDocks", title: "Andenes de carga (#)", type: "number" as const },
    { id: "electricalKVA", title: "Energía eléctrica (kVA disponibles)", type: "number" as const },
    { id: "notes", title: "Notas / descripción corta", type: "text" as const },
  ];

  const [columnSearchQuery, setColumnSearchQuery] = useState("");
  const [activeColumns, setActiveColumns] = useState<CustomColumn[]>([
    { id: "level", title: "Piso / Nivel", type: "text" },
    { id: "bedrooms", title: "Recámaras", type: "number" },
  ]);

  const [isColumnDropdownOpen, setIsColumnDropdownOpen] = useState(false);
  const [isCustomColModalOpen, setIsCustomColModalOpen] = useState(false);
  const [newColTitle, setNewColTitle] = useState("");
  const [newColType, setNewColType] = useState<"number" | "text" | "file" | "image" | "boolean">("text");

  // Estado para Mapeador Inteligente de Columnas de Excel
  const [isColumnMapperModalOpen, setIsColumnMapperModalOpen] = useState(false);
  const [unmappedColumnsFound, setUnmappedColumnsFound] = useState<UnmappedColumnInfo[]>([]);
  const [columnDecisions, setColumnDecisions] = useState<Record<string, ColumnMappingDecision>>({});
  const [pendingParsedUnits, setPendingParsedUnits] = useState<any[]>([]);
  const [rawExcelRows, setRawExcelRows] = useState<any[][]>([]);
  const [rawExcelHeaders, setRawExcelHeaders] = useState<string[]>([]);

  // Unidades iniciales vacías
  const [units, setUnits] = useState<DynamicUnitRow[]>([]);

  // ETAPA 3: ADICIONALES (ADD-ONS) - Inicialmente vacío
  const [additionals, setAdditionals] = useState<AdditionalItem[]>([]);

  // ETAPA 4: PLANES DE PAGO & BIBLIOTECA GLOBAL
  const [globalPlanLibrary, setGlobalPlanLibrary] = useState<PaymentPlanItem[]>([]);
  const [selectedPlanIds, setSelectedPlanIds] = useState<string[]>([]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem(STORAGE_KEY_GLOBAL_PLANS);
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed)) {
            setGlobalPlanLibrary(parsed);
          }
        } catch (e) {}
      }
    }
  }, []);

  const saveGlobalLibrary = (newLibrary: PaymentPlanItem[]) => {
    setGlobalPlanLibrary(newLibrary);
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY_GLOBAL_PLANS, JSON.stringify(newLibrary));
    }
  };

  const [isPaymentPlanModalOpen, setIsPaymentPlanModalOpen] = useState(false);
  const [editingPlanId, setEditingPlanId] = useState<string | null>(null);
  const [modalPlanData, setModalPlanData] = useState<PaymentPlanItem>({
    id: "",
    name: "",
    paymentType: "ESQUEMA",
    downPaymentPercentage: 20,
    installmentsCount: 12,
    periodicity: "Mensual",
    settlementPercentage: 60,
    interestPercentage: 0,
    discountPercentage: 0,
    internalNotes: "",
  });

  // ETAPA 6: DOCUMENTOS - Inicialmente vacío
  const [documents, setDocuments] = useState<ProjectDocumentItem[]>([]);
  const [isDocModalOpen, setIsDocModalOpen] = useState(false);
  const [modalDocData, setModalDocData] = useState<ProjectDocumentItem>({
    id: "",
    title: "",
    category: "Legal",
    fileName: "",
    fileSize: "",
    internalNotes: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [createdProjectId, setCreatedProjectId] = useState<string>("");

  // Tipologías
  const projectTypesList = [
    { id: "VERTICAL", title: "Vertical", subtitle: "Torres y departamentos", icon: Building2 },
    { id: "HORIZONTAL", title: "Horizontal", subtitle: "Casas y privadas", icon: Home },
    { id: "COMMERCIAL", title: "Comercial", subtitle: "Plazas y locales", icon: Store },
    { id: "INDUSTRIAL", title: "Industrial", subtitle: "Parques y naves", icon: Factory },
    { id: "MIXED", title: "Mixto", subtitle: "Usos mixtos", icon: Layers },
  ];

  // Cálculos de validación en tiempo real y sugerencias de corrección para el plan de pagos
  const planValidation = useMemo(() => {
    if (modalPlanData.paymentType === "CONTADO") {
      if (!modalPlanData.name.trim()) {
        return {
          isValid: false,
          errorTitle: "Nombre requerido",
          errorMessage: "Ingresa un nombre para identificar este plan de pago de contado.",
          fixes: [] as { label: string; action: () => void }[],
          downPct: 100,
          installmentsPct: 0,
          settlementPct: 0,
          totalPct: 100,
        };
      }
      return {
        isValid: true,
        errorTitle: null,
        errorMessage: null,
        fixes: [] as { label: string; action: () => void }[],
        downPct: 100,
        installmentsPct: 0,
        settlementPct: 0,
        totalPct: 100,
      };
    }

    const down = Number(modalPlanData.downPaymentPercentage) || 0;
    const settlement = Number(modalPlanData.settlementPercentage) || 0;
    const plazos = Number(modalPlanData.installmentsCount) || 0;
    const sumDownSettlement = down + settlement;
    const remainingPct = 100 - sumDownSettlement;
    const totalPct = down + (plazos > 0 ? Math.max(0, remainingPct) : 0) + settlement;

    if (!modalPlanData.name.trim()) {
      return {
        isValid: false,
        errorTitle: "Nombre requerido",
        errorMessage: "Ingresa un nombre para identificar este plan de pago.",
        fixes: [] as { label: string; action: () => void }[],
        downPct: down,
        installmentsPct: Math.max(0, remainingPct),
        settlementPct: settlement,
        totalPct,
      };
    }

    if (down <= 0) {
      return {
        isValid: false,
        errorTitle: "Enganche requerido",
        errorMessage: "El enganche debe ser mayor a 0% para un esquema de pagos. Si es liquidación total en una sola exhibición, selecciona 'Pago de contado'.",
        fixes: [
          {
            label: "Asignar 15% de Enganche",
            action: () => setModalPlanData((prev) => ({
              ...prev,
              downPaymentPercentage: 15,
              settlementPercentage: Math.min(prev.settlementPercentage, 85),
            })),
          },
          {
            label: "Cambiar a Pago de Contado (100%)",
            action: () => setModalPlanData((prev) => ({
              ...prev,
              paymentType: "CONTADO",
              downPaymentPercentage: 100,
              settlementPercentage: 0,
              installmentsCount: 0,
            })),
          },
        ],
        downPct: down,
        installmentsPct: Math.max(0, remainingPct),
        settlementPct: settlement,
        totalPct,
      };
    }

    if (sumDownSettlement > 100) {
      const excess = sumDownSettlement - 100;
      return {
        isValid: false,
        errorTitle: "Porcentajes excedidos (>100%)",
        errorMessage: `El Enganche (${down}%) y la Liquidación (${settlement}%) suman ${sumDownSettlement}%, excediendo el 100% total por ${excess}%. Las parcialidades quedarían en ${remainingPct}%, lo cual no es válido.`,
        fixes: [
          {
            label: `Ajustar Liquidación a ${Math.max(0, 100 - down)}%`,
            action: () => setModalPlanData((prev) => ({
              ...prev,
              settlementPercentage: Math.max(0, 100 - down),
            })),
          },
          {
            label: `Ajustar Enganche a ${Math.max(0, 100 - settlement)}%`,
            action: () => setModalPlanData((prev) => ({
              ...prev,
              downPaymentPercentage: Math.max(0, 100 - settlement),
            })),
          },
          {
            label: `Distribuir: ${down}% Enganche / ${Math.floor((100 - down) / 2)}% Mensualidades / ${100 - down - Math.floor((100 - down) / 2)}% Liquidación`,
            action: () => {
              const half = Math.floor((100 - down) / 2);
              setModalPlanData((prev) => ({
                ...prev,
                settlementPercentage: 100 - down - half,
                installmentsCount: plazos > 0 ? plazos : 12,
              }));
            },
          },
        ],
        downPct: down,
        installmentsPct: remainingPct,
        settlementPct: settlement,
        totalPct: sumDownSettlement,
      };
    }

    if (sumDownSettlement === 100 && plazos > 0) {
      return {
        isValid: false,
        errorTitle: "Plazos sin porcentaje asignado (0%)",
        errorMessage: `Definiste ${plazos} plazos, pero el Enganche (${down}%) y la Liquidación (${settlement}%) ya suman el 100%. No queda porcentaje para las parcialidades (quedarían en 0%).`,
        fixes: [
          {
            label: `Reducir Liquidación para dejar 40% en ${plazos} plazos (${(40 / plazos).toFixed(1)}% c/u)`,
            action: () => setModalPlanData((prev) => ({
              ...prev,
              settlementPercentage: Math.max(0, 100 - down - 40),
            })),
          },
          {
            label: "Cambiar Plazos a 0 (Solo Enganche y Liquidación)",
            action: () => setModalPlanData((prev) => ({
              ...prev,
              installmentsCount: 0,
            })),
          },
        ],
        downPct: down,
        installmentsPct: 0,
        settlementPct: settlement,
        totalPct: 100,
      };
    }

    if (sumDownSettlement < 100 && plazos === 0) {
      return {
        isValid: false,
        errorTitle: "Porcentaje flotante sin plazos",
        errorMessage: `Queda un ${remainingPct}% pendiente de asignar porque el número de plazos es 0. Debes asignar mensualidades o sumar el ${remainingPct}% a la liquidación.`,
        fixes: [
          {
            label: `Sumar ${remainingPct}% a la Liquidación (Total: ${settlement + remainingPct}%)`,
            action: () => setModalPlanData((prev) => ({
              ...prev,
              settlementPercentage: 100 - down,
            })),
          },
          {
            label: `Asignar 12 plazos para cubrir el ${remainingPct}% (${(remainingPct / 12).toFixed(1)}% c/u)`,
            action: () => setModalPlanData((prev) => ({
              ...prev,
              installmentsCount: 12,
            })),
          },
          {
            label: `Asignar 24 plazos para cubrir el ${remainingPct}% (${(remainingPct / 24).toFixed(1)}% c/u)`,
            action: () => setModalPlanData((prev) => ({
              ...prev,
              installmentsCount: 24,
            })),
          },
        ],
        downPct: down,
        installmentsPct: remainingPct,
        settlementPct: settlement,
        totalPct: sumDownSettlement,
      };
    }

    return {
      isValid: true,
      errorTitle: null,
      errorMessage: null,
      fixes: [] as { label: string; action: () => void }[],
      downPct: down,
      installmentsPct: remainingPct,
      settlementPct: settlement,
      totalPct: 100,
    };
  }, [modalPlanData]);

  const installmentsTotalPercentage = planValidation.installmentsPct;
  const isPlanSumValid = planValidation.isValid;

  // ---------------------------------------------------------------------------
  // PLANTILLAS Y SUBIDA MASIVA EXCEL
  // ---------------------------------------------------------------------------
  const downloadUnitsTemplate = () => {
    generateUnitsExcelTemplate({
      projectType,
      activeColumns,
      projectName: projectGeneralData.name || "Proyecto Devio",
    });
  };

  const downloadAdditionalsTemplate = () => {
    generateAdditionalsExcelTemplate();
  };

  const handleBulkUploadUnits = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const buffer = event.target?.result as ArrayBuffer;
      if (!buffer) return;

      const result = parseUnitsExcelFile(buffer, activeColumns);
      if (!result.success) {
        alert(result.error || "Error al procesar el archivo Excel.");
        return;
      }

      const workbook = XLSX.read(new Uint8Array(buffer), { type: "array" });
      const sheetName = workbook.SheetNames.find(
        (n) => normalizeHeader(n) === "unidades" || normalizeHeader(n).includes("inventario")
      ) || workbook.SheetNames[0];
      const worksheet = sheetName ? workbook.Sheets[sheetName] : null;
      const rawRows = worksheet ? XLSX.utils.sheet_to_json<any[]>(worksheet, { header: 1, defval: "" }) : [];
      const headers = (rawRows[0] || []).map((h) => String(h || "").trim());

      setRawExcelRows(rawRows);
      setRawExcelHeaders(headers);

      if (result.unmappedColumns.length === 0) {
        setUnits((prev) => [...prev, ...result.parsedRows]);
      } else {
        const initialDecisions: Record<string, ColumnMappingDecision> = {};
        result.unmappedColumns.forEach((col: UnmappedColumnInfo) => {
          initialDecisions[col.headerName] = {
            headerName: col.headerName,
            action: "create",
            targetColId: "",
            newColTitle: col.headerName,
            newColType: col.inferredType,
          };
        });

        setColumnDecisions(initialDecisions);
        setUnmappedColumnsFound(result.unmappedColumns);
        setPendingParsedUnits(result.parsedRows);
        setIsColumnMapperModalOpen(true);
      }
    };
    reader.readAsArrayBuffer(file);
    if (unitsFileInputRef.current) unitsFileInputRef.current.value = "";
  };

  const handleConfirmColumnMapping = () => {
    const newActiveCols: CustomColumn[] = [...activeColumns];
    const createdColsMap: Record<string, string> = {};

    Object.values(columnDecisions).forEach((decision, idx) => {
      if (decision.action === "create") {
        const colId = `custom_${Date.now()}_${idx}`;
        const newCol: CustomColumn = {
          id: colId,
          title: decision.newColTitle || decision.headerName,
          type: decision.newColType || "text",
        };
        newActiveCols.push(newCol);
        createdColsMap[decision.headerName] = colId;
      } else if (decision.action === "map" && decision.targetColId) {
        createdColsMap[decision.headerName] = decision.targetColId;
      }
    });

    const updatedUnits: DynamicUnitRow[] = pendingParsedUnits.map((unit, uIdx) => {
      const rawRow = rawExcelRows[uIdx + 1];
      if (!rawRow) return unit;

      const extraFields = { ...unit.extraFields };

      rawExcelHeaders.forEach((header, colIdx) => {
        const targetColId = createdColsMap[header];
        if (targetColId) {
          const cellVal = rawRow[colIdx];
          if (cellVal !== undefined && cellVal !== null && cellVal !== "") {
            extraFields[targetColId] = cellVal;
          }
        }
      });

      return {
        ...unit,
        extraFields,
      };
    });

    setActiveColumns(newActiveCols);
    setUnits((prev) => [...prev, ...updatedUnits]);
    setIsColumnMapperModalOpen(false);
    setPendingParsedUnits([]);
    setUnmappedColumnsFound([]);
    setColumnDecisions({});
  };

  const handleBulkUploadAdditionals = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const data = new Uint8Array(event.target?.result as ArrayBuffer);
      const workbook = XLSX.read(data, { type: "array" });
      const firstSheetName = workbook.SheetNames[0];
      if (!firstSheetName) return;

      const worksheet = workbook.Sheets[firstSheetName];
      if (!worksheet) return;

      const jsonData = XLSX.utils.sheet_to_json<any[]>(worksheet, { header: 1 });
      if (jsonData.length < 2) return;

      const newAdditions: AdditionalItem[] = [];
      for (let i = 1; i < jsonData.length; i++) {
        const row = jsonData[i];
        if (row && row.length >= 2) {
          newAdditions.push({
            id: `add-bulk-${Date.now()}-${i}`,
            name: String(row[0] || `Adicional ${i}`),
            type: (String(row[1]) as any) || "Estacionamiento",
            price: parseFloat(String(row[2])) || 150000,
            status: (String(row[3]) as any) || "Disponible",
            notes: String(row[4] || ""),
          });
        }
      }
      if (newAdditions.length > 0) {
        setAdditionals((prev) => [...prev, ...newAdditions]);
      }
    };
    reader.readAsArrayBuffer(file);
    if (additionalsFileInputRef.current) additionalsFileInputRef.current.value = "";
  };

  // Column management
  const handleTogglePresetColumn = (col: { id: string; title: string; type: any }) => {
    if (activeColumns.some((c) => c.id === col.id)) {
      setActiveColumns((prev) => prev.filter((c) => c.id !== col.id));
    } else {
      setActiveColumns((prev) => [...prev, col]);
    }
  };

  const handleAddCustomColumn = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newColTitle) return;
    const colId = `custom_${Date.now()}`;
    setActiveColumns((prev) => [...prev, { id: colId, title: newColTitle, type: newColType }]);
    setNewColTitle("");
    setIsCustomColModalOpen(false);
  };

  // Units management
  const handleAddUnit = () => {
    const nextNum = units.length + 1;
    setUnits((prev) => [
      ...prev,
      {
        id: `u-${Date.now()}`,
        unitNumber: `${nextNum}`,
        surfaceM2: 100,
        price: 3500000,
        status: "Disponible",
        deliveryDate: projectGeneralData.estimatedDeliveryDate || "2028-09-17",
        type: projectType === "VERTICAL" ? "Departamento" : projectType === "HORIZONTAL" ? "Casa" : projectType === "COMMERCIAL" ? "Local" : "Nave",
        extraFields: {},
      },
    ]);
  };

  const handleRemoveUnit = (id: string) => {
    setUnits((prev) => prev.filter((u) => u.id !== id));
  };

  const handleUnitChange = (id: string, field: keyof DynamicUnitRow, value: any) => {
    setUnits((prev) =>
      prev.map((u) => (u.id === id ? { ...u, [field]: value } : u))
    );
  };

  const handleUnitExtraChange = (id: string, colId: string, value: any) => {
    setUnits((prev) =>
      prev.map((u) =>
        u.id === id ? { ...u, extraFields: { ...u.extraFields, [colId]: value } } : u
      )
    );
  };

  // Adicionales (Add-ons) Table Handlers
  const handleAddAdditionalRow = () => {
    const nextIdx = additionals.length + 1;
    setAdditionals((prev) => [
      ...prev,
      {
        id: `add-${Date.now()}`,
        name: `Adicional ${nextIdx}`,
        type: "Estacionamiento",
        price: 150000,
        status: "Disponible",
        notes: "",
      },
    ]);
  };

  const handleAdditionalChange = (id: string, field: keyof AdditionalItem, value: any) => {
    setAdditionals((prev) =>
      prev.map((a) => (a.id === id ? { ...a, [field]: value } : a))
    );
  };

  const handleRemoveAdditional = (id: string) => {
    setAdditionals((prev) => prev.filter((a) => a.id !== id));
  };

  // Payment Plans Library & Selection Handlers
  const handleTogglePlanForProject = (planId: string) => {
    setSelectedPlanIds((prev) =>
      prev.includes(planId) ? prev.filter((id) => id !== planId) : [...prev, planId]
    );
  };

  const handleOpenPaymentPlanModal = (plan?: PaymentPlanItem) => {
    if (plan) {
      setEditingPlanId(plan.id);
      setModalPlanData({ ...plan });
    } else {
      setEditingPlanId(null);
      setModalPlanData({
        id: `pp-${Date.now()}`,
        name: "",
        paymentType: "ESQUEMA",
        downPaymentPercentage: 20,
        installmentsCount: 12,
        periodicity: "Mensual",
        settlementPercentage: 60,
        interestPercentage: 0,
        discountPercentage: 0,
        internalNotes: "",
      });
    }
    setIsPaymentPlanModalOpen(true);
  };

  const handleSavePaymentPlan = (e: React.FormEvent) => {
    e.preventDefault();
    if (!planValidation.isValid) return;
    if (!modalPlanData.name.trim()) return;

    let updatedLibrary: PaymentPlanItem[];
    if (editingPlanId) {
      updatedLibrary = globalPlanLibrary.map((p) =>
        p.id === editingPlanId ? modalPlanData : p
      );
    } else {
      updatedLibrary = [...globalPlanLibrary, modalPlanData];
      if (!selectedPlanIds.includes(modalPlanData.id)) {
        setSelectedPlanIds((prev) => [...prev, modalPlanData.id]);
      }
    }

    saveGlobalLibrary(updatedLibrary);
    setIsPaymentPlanModalOpen(false);
  };

  const handleDeletePlanFromLibrary = (planId: string) => {
    const updated = globalPlanLibrary.filter((p) => p.id !== planId);
    saveGlobalLibrary(updated);
    setSelectedPlanIds((prev) => prev.filter((id) => id !== planId));
  };

  // Documents Handlers (with real file upload)
  const handleOpenDocModal = (doc?: ProjectDocumentItem) => {
    if (doc) {
      setModalDocData(doc);
    } else {
      setModalDocData({
        id: `doc-${Date.now()}`,
        title: "",
        category: "Legal",
        fileName: "",
        fileSize: "",
        internalNotes: "",
      });
    }
    setIsDocModalOpen(true);
  };

  const handleDocFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const sizeStr =
      file.size > 1024 * 1024
        ? (file.size / (1024 * 1024)).toFixed(2) + " MB"
        : (file.size / 1024).toFixed(1) + " KB";

    setModalDocData((prev) => ({
      ...prev,
      fileName: file.name,
      fileSize: sizeStr,
      title: prev.title || file.name.replace(/\.[^/.]+$/, ""),
    }));
  };

  const handleAddSuggestedDoc = (title: string) => {
    const category = title.includes("Contrato") || title.includes("Régimen") ? "Legal" : title.includes("Plano") || title.includes("Licencia") ? "Técnico" : "Comercial";
    setDocuments((prev) => [
      ...prev,
      {
        id: `doc-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        title,
        category,
        fileName: `${title.toLowerCase().replace(/\s+/g, "_")}.pdf`,
        fileSize: "Documento oficial",
        internalNotes: "Documento base registrado para comercialización.",
      },
    ]);
  };

  const handleSaveDocument = (e: React.FormEvent) => {
    e.preventDefault();
    if (!modalDocData.title.trim()) return;

    const finalDoc = {
      ...modalDocData,
      fileName: modalDocData.fileName || `${modalDocData.title.toLowerCase().replace(/\s+/g, "_")}.pdf`,
      fileSize: modalDocData.fileSize || "Adjunto",
    };

    if (documents.some((d) => d.id === finalDoc.id)) {
      setDocuments((prev) =>
        prev.map((d) => (d.id === finalDoc.id ? finalDoc : d))
      );
    } else {
      setDocuments((prev) => [...prev, finalDoc]);
    }
    setIsDocModalOpen(false);
  };

  const handleDeleteDocument = (id: string) => {
    setDocuments((prev) => prev.filter((d) => d.id !== id));
  };

  // Submit Handler
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const generalResult = validateStep(1);
    if (generalResult) {
      triggerFieldError(generalResult.fieldId, generalResult.error, 1);
      return;
    }

    setIsSubmitting(true);

    const newProjectId = `proj-${Date.now()}`;
    const mappedUnits: UnitItem[] = units.map((u, idx) => ({
      id: u.id || `u-${idx + 1}`,
      unit: u.unitNumber,
      type: u.type || "Tipo A",
      price: u.price || 3500000,
      areaM2: u.surfaceM2 || 85,
      floor: parseInt(u.unitNumber.replace(/\D/g, "") || "1", 10) || 1,
      status: (u.status === "Disponible" ? "DISPONIBLE" : u.status === "Vendida" ? "VENDIDA" : u.status === "Apartada" ? "APARTADA" : "BLOQUEADA") as any,
      client: u.status === "Vendida" ? "Cliente Propietario" : "-",
      deliveryDate: u.deliveryDate || projectGeneralData.estimatedDeliveryDate,
      floorPlan: u.floorPlan,
      bedrooms: u.extraFields?.bedrooms || 2,
      bathrooms: u.extraFields?.bathrooms || 2,
      parkingSpots: u.extraFields?.parkingSpaces || 1,
      storageUnits: u.extraFields?.storageUnits || 0,
      priceHistory: [
        {
          date: new Date().toLocaleDateString("es-MX"),
          previousPrice: u.price,
          newPrice: u.price,
          pctChange: 0,
          reason: "Precio inicial de lista",
          user: "Administrador",
        },
      ],
    }));

    const totalVal = mappedUnits.reduce((acc, u) => acc + (u.price || 0), 0);

    const mappedAdditionals: ProjectAdditional[] = additionals.map((a, i) => {
      const cat = ((a as any).category || a.type || "bodega").toLowerCase();
      let normalizedCat: ProjectAdditional["category"] = "bodega";
      if (cat.includes("estacionamiento") || cat.includes("cajon") || cat.includes("auto")) normalizedCat = "estacionamiento";
      else if (cat.includes("acabado") || cat.includes("paquete")) normalizedCat = "acabados";
      else if (cat.includes("terraza") || cat.includes("roof")) normalizedCat = "terraza";
      else if (cat.includes("otro")) normalizedCat = "otro";
      else normalizedCat = "bodega";

      return {
        id: a.id || `add-${Date.now()}-${i}`,
        name: a.name || `Adicional ${i + 1}`,
        category: normalizedCat,
        price: Number(a.price) || 0,
        areaM2: Number((a as any).surfaceM2 || (a as any).areaM2) || 0,
        status: (a.status?.toUpperCase() === "VENDIDO" ? "VENDIDO" : a.status?.toUpperCase() === "ASIGNADO" ? "ASIGNADO" : "DISPONIBLE"),
        notes: a.notes || "",
      };
    });

    const newProject: ProjectItem = {
      id: newProjectId,
      name: projectGeneralData.name || "Nuevo Desarrollo",
      type: projectType || "VERTICAL",
      image: projectCoverPreview || "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1200&q=80",
      progressPct: 0,
      totalUnits: mappedUnits.length,
      soldUnits: mappedUnits.filter((u) => u.status === "VENDIDA").length,
      availableUnits: mappedUnits.filter((u) => u.status === "DISPONIBLE").length,
      blockedUnits: mappedUnits.filter((u) => u.status === "BLOQUEADA").length,
      metrics: {
        totalCobrado: 0,
        porCobrar: 0,
        pagosAtrasados: 0,
        avanceVentasPct: 0,
        unidadesVendidasCount: 0,
        unidadesTotalesCount: mappedUnits.length,
        porVenderUnidades: mappedUnits.length,
        valorComercialVendido: 0,
        valorComercialTotal: totalVal,
        porVenderMonto: totalVal,
        flujoFuturoMonto: 0,
        precioPromedio: mappedUnits.length > 0 ? Math.round(totalVal / mappedUnits.length) : 0,
        inventarioMonetarioPct: 0,
        totalFacturado: 0,
        distribucionPct: 0,
      },
      monthlyBilling: [],
      overdueClients: [],
      unitsInventory: mappedUnits,
      additionals: mappedAdditionals,
      team: teamMembers.filter((m) => m.assigned),
      floorPlans: onboardingFloorPlans.length > 0 ? onboardingFloorPlans : undefined,
    };

    if (typeof window !== "undefined") {
      const isNewUser = localStorage.getItem("devio_is_new_user") || sessionStorage.getItem("devio_is_new_user");
      let currentProjects: ProjectItem[] = [];
      const stored = localStorage.getItem("devio_projects_state") || sessionStorage.getItem("devio_projects_state");
      if (stored && isNewUser !== "true") {
        try {
          currentProjects = JSON.parse(stored);
        } catch (e) {}
      }
      const updatedList = [newProject, ...currentProjects];
      localStorage.setItem("devio_projects_state", JSON.stringify(updatedList));
      sessionStorage.setItem("devio_projects_state", JSON.stringify(updatedList));
      localStorage.removeItem("devio_is_new_user");
      sessionStorage.removeItem("devio_is_new_user");
      window.dispatchEvent(new Event("devio_projects_updated"));
    }

    setCreatedProjectId(newProjectId);

    setTimeout(() => {
      setIsSubmitting(false);
      setIsSuccess(true);
    }, 600);
  };

  const filteredColumnPresets = availableColumnPresets.filter((col) =>
    col.title.toLowerCase().includes(columnSearchQuery.toLowerCase())
  );

  const activeProjectPaymentPlans = globalPlanLibrary.filter((p) =>
    selectedPlanIds.includes(p.id)
  );

  if (isSuccess) {
    const projectDashboardUrl = createdProjectId ? `/projects/${createdProjectId}` : "/dashboard";
    const projectUnitsUrl = createdProjectId ? `/projects/${createdProjectId}/units` : "/dashboard";

    return (
      <div style={{ maxWidth: "700px", margin: "4rem auto", padding: "0 1.5rem" }}>
        <div className="card modal-content" style={{ textAlign: "center", padding: "3.5rem 2.5rem" }}>
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
            ¡Proyecto Creado Exitosamente!
          </h1>
          <p style={{ fontSize: "1.05rem", color: "var(--devio-neutral-4)", marginBottom: "0.5rem" }}>
            El desarrollo <strong>{projectGeneralData.name || "Nuevo Proyecto"}</strong> ha quedado registrado.
          </p>

          <p style={{ color: "var(--text-muted)", marginBottom: "1.5rem", fontSize: "0.95rem" }}>
            Se configuraron {units.length} unidades, {additionals.length} adicionales, {activeProjectPaymentPlans.length} plan(es) de pago activos y {documents.length} documento(s).
          </p>

          {units.length === 0 && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.75rem",
                padding: "0.85rem 1rem",
                backgroundColor: "rgba(199, 178, 139, 0.15)",
                border: "1px solid var(--devio-beige)",
                borderRadius: "0.5rem",
                color: "var(--devio-neutral-4)",
                textAlign: "left",
                fontSize: "0.875rem",
                marginBottom: "2rem",
              }}
            >
              <Info size={20} color="var(--devio-blue)" style={{ flexShrink: 0 }} />
              <span>
                <strong>Aviso de inventario:</strong> Tu proyecto fue creado sin unidades iniciales. Podrás cargarlas individualmente o mediante plantilla Excel en cualquier momento desde la sección de <strong>Inventario</strong> del proyecto.
              </span>
            </div>
          )}

          <div style={{ display: "flex", gap: "0.75rem", justifyContent: "center", flexWrap: "wrap" }}>
            <Link href={projectDashboardUrl} className="btn btn-primary" style={{ padding: "0.85rem 1.5rem", fontSize: "0.95rem" }}>
              Ir al Dashboard del Proyecto <ArrowRight size={16} />
            </Link>
            <Link href={projectUnitsUrl} className="btn btn-secondary" style={{ padding: "0.85rem 1.5rem", fontSize: "0.95rem" }}>
              <Building2 size={16} /> Ver Unidades
            </Link>
            <Link href="/dashboard" className="btn btn-outline" style={{ padding: "0.85rem 1.5rem", fontSize: "0.95rem" }}>
              Todos los Proyectos
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: "1140px", margin: "2.5rem auto", padding: "0 1.5rem" }}>
      {/* Hidden File Inputs for Bulk Upload */}
      <input
        type="file"
        ref={unitsFileInputRef}
        onChange={handleBulkUploadUnits}
        accept=".xlsx,.xls,.csv"
        style={{ display: "none" }}
      />
      <input
        type="file"
        ref={additionalsFileInputRef}
        onChange={handleBulkUploadAdditionals}
        accept=".xlsx,.xls,.csv"
        style={{ display: "none" }}
      />

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
          <span className="badge badge-info">Onboarding de Proyecto (6 Etapas)</span>
        </div>
        <h1 style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>Configuración de Nuevo Proyecto</h1>
        <p style={{ color: "var(--text-muted)", fontSize: "0.95rem" }}>
          Define la identidad, inventario, adicionales, planes de pago y documentación.
        </p>
      </div>

      {/* Steps Navigation (6 Etapas) */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginBottom: "1.5rem",
          gap: "0.25rem",
        }}
      >
        {[
          { num: 1, label: "1. Datos Generales" },
          { num: 2, label: "2. Inventario de Unidades" },
          { num: 3, label: "3. Adicionales (Add-ons)" },
          { num: 4, label: "4. Planes de Pago" },
          { num: 5, label: "5. Asignación de Equipo" },
          { num: 6, label: "6. Documentos" },
        ].map((item) => {
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
                transition: "border-color 0.2s ease",
              }}
            >
              <span
                style={{
                  fontSize: "0.75rem",
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

      <div className="card modal-content">
        <form onSubmit={handleSubmit}>
          {/* ETAPA 1: DATOS GENERALES DEL PROYECTO */}
          {step === 1 && (
            <div>
              <h2 style={{ fontSize: "1.25rem", marginBottom: "1.5rem" }}>
                1. Datos Generales del Proyecto
              </h2>

              {/* Selector de Tipología */}
              <div style={{ marginBottom: "1.5rem" }}>
                <label className="form-label" style={{ marginBottom: "0.5rem", display: "block" }}>
                  Tipología del Desarrollo *
                </label>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "0.75rem" }}>
                  {projectTypesList.map((t) => {
                    const Icon = t.icon;
                    const isSelected = projectType === t.id;
                    return (
                      <div
                        key={t.id}
                        onClick={() => setProjectType(t.id as ProjectType)}
                        className={`radio-card ${isSelected ? "active" : ""}`}
                        style={{ textAlign: "center", padding: "1rem 0.5rem" }}
                      >
                        <div
                          style={{
                            width: "38px",
                            height: "38px",
                            borderRadius: "50%",
                            backgroundColor: isSelected ? "var(--devio-blue)" : "var(--devio-neutral-1)",
                            color: isSelected ? "var(--devio-white)" : "var(--devio-neutral-3)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            margin: "0 auto 0.5rem",
                            transition: "all 0.2s ease",
                          }}
                        >
                          <Icon size={20} />
                        </div>
                        <h4 style={{ fontSize: "0.875rem", margin: 0 }}>{t.title}</h4>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Logo del Proyecto y Portada del Desarrollo */}
              <div className="grid-cols-2" style={{ marginBottom: "1rem" }}>
                {/* Logo Uploader */}
                <div className="form-group">
                  <label className="form-label">Logo del Proyecto (Solo PNG) *</label>
                  <input
                    type="file"
                    ref={logoInputRef}
                    onChange={handleLogoSelect}
                    accept="image/png"
                    style={{ display: "none" }}
                  />

                  {projectLogoPreview ? (
                    <div
                      id="proj_input_logo_box"
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
                            src={projectLogoPreview}
                            alt="Logo proyecto preview"
                            style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }}
                          />
                        </div>
                        <div>
                          <p style={{ fontSize: "0.8125rem", fontWeight: 600, color: "var(--devio-blue-dark)", margin: 0 }}>
                            {projectLogoName || "logo-proyecto.png"}
                          </p>
                          <span style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>
                            {projectLogoSize || "PNG"} • <button type="button" onClick={() => logoInputRef.current?.click()} style={{ background: "none", border: "none", color: "var(--devio-blue)", cursor: "pointer", padding: 0, textDecoration: "underline", fontSize: "0.72rem" }}>Cambiar</button>
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
                        }}
                        title="Eliminar logo"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ) : (
                    <div
                      id="proj_input_logo_box"
                      tabIndex={0}
                      onClick={() => logoInputRef.current?.click()}
                      style={{
                        border: "2px dashed var(--devio-neutral-2)",
                        borderRadius: "0.5rem",
                        padding: "1rem",
                        textAlign: "center",
                        backgroundColor: "var(--bg-page)",
                        cursor: "pointer",
                        transition: "border-color 0.2s ease",
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.borderColor = "var(--devio-blue)")}
                      onMouseLeave={(e) => (e.currentTarget.style.borderColor = "var(--devio-neutral-2)")}
                    >
                      <Upload size={22} color="var(--devio-blue-matte)" style={{ margin: "0 auto 0.3rem" }} />
                      <p style={{ fontSize: "0.8125rem", color: "var(--devio-neutral-4)", fontWeight: 600, margin: 0 }}>
                        Click para subir logo del proyecto (Solo .PNG)
                      </p>
                      <span style={{ fontSize: "0.75rem", color: "var(--devio-neutral-3)" }}>
                        Dimensiones: 400x400 px o proporción horizontal (máx 5MB)
                      </span>
                    </div>
                  )}
                </div>

                {/* Portada Uploader */}
                <div className="form-group">
                  <label className="form-label">Portada del desarrollo *</label>
                  <input
                    type="file"
                    ref={coverInputRef}
                    onChange={handleCoverSelect}
                    accept="image/*"
                    style={{ display: "none" }}
                  />

                  {projectCoverPreview ? (
                    <div
                      id="proj_input_cover_box"
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
                            src={projectCoverPreview}
                            alt="Portada preview"
                            style={{ width: "100%", height: "100%", objectFit: "cover" }}
                          />
                        </div>
                        <div>
                          <p style={{ fontSize: "0.8125rem", fontWeight: 600, color: "var(--devio-blue-dark)", margin: 0 }}>
                            {projectCoverName || "portada-desarrollo.jpg"}
                          </p>
                          <span style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>
                            {projectCoverSize || "Imagen"} • <button type="button" onClick={() => coverInputRef.current?.click()} style={{ background: "none", border: "none", color: "var(--devio-blue)", cursor: "pointer", padding: 0, textDecoration: "underline", fontSize: "0.72rem" }}>Cambiar</button>
                          </span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={handleRemoveCover}
                        style={{
                          background: "none",
                          border: "none",
                          color: "var(--devio-red)",
                          cursor: "pointer",
                          padding: "0.4rem",
                        }}
                        title="Eliminar portada"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ) : (
                    <div
                      id="proj_input_cover_box"
                      tabIndex={0}
                      onClick={() => coverInputRef.current?.click()}
                      style={{
                        border: "2px dashed var(--devio-neutral-2)",
                        borderRadius: "0.5rem",
                        padding: "1rem",
                        textAlign: "center",
                        backgroundColor: "var(--bg-page)",
                        cursor: "pointer",
                        transition: "border-color 0.2s ease",
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.borderColor = "var(--devio-blue)")}
                      onMouseLeave={(e) => (e.currentTarget.style.borderColor = "var(--devio-neutral-2)")}
                    >
                      <Upload size={22} color="var(--devio-blue-matte)" style={{ margin: "0 auto 0.3rem" }} />
                      <p style={{ fontSize: "0.8125rem", color: "var(--devio-neutral-4)", fontWeight: 600, margin: 0 }}>
                        Click para subir portada del proyecto
                      </p>
                      <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>JPG o PNG en alta resolución (máx 5MB)</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="grid-cols-2">
                <div className="form-group">
                  <label className="form-label">Nombre del Proyecto *</label>
                  <input
                    id="proj_input_name"
                    type="text"
                    value={projectGeneralData.name}
                    onChange={(e) => {
                      setErrorMsg("");
                      setProjectGeneralData({ ...projectGeneralData, name: e.target.value });
                    }}
                    placeholder="Escribe el Nombre del proyecto"
                    className="form-input"
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Razón Social del Proyecto *</label>
                  <input
                    id="proj_input_legalName"
                    type="text"
                    value={projectGeneralData.legalName}
                    onChange={(e) => {
                      setErrorMsg("");
                      setProjectGeneralData({ ...projectGeneralData, legalName: e.target.value });
                    }}
                    placeholder="Escribe la Razón Social del proyecto"
                    className="form-input"
                    required
                  />
                </div>
              </div>

              <div className="grid-cols-2">
                <div className="form-group">
                  <label className="form-label">Ubicación (Google Maps) *</label>
                  <input
                    id="proj_input_googleMaps"
                    type="url"
                    value={projectGeneralData.googleMapsUrl}
                    onChange={(e) => {
                      setErrorMsg("");
                      setProjectGeneralData({ ...projectGeneralData, googleMapsUrl: e.target.value });
                    }}
                    placeholder="https://maps.google.com/..."
                    className="form-input"
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Página Web del proyecto</label>
                  <input
                    id="proj_input_websiteUrl"
                    type="url"
                    value={projectGeneralData.websiteUrl}
                    onChange={(e) => setProjectGeneralData({ ...projectGeneralData, websiteUrl: e.target.value })}
                    placeholder="URL pagina web"
                    className="form-input"
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Descripción *</label>
                <textarea
                  id="proj_input_description"
                  value={projectGeneralData.description}
                  onChange={(e) => {
                    setErrorMsg("");
                    setProjectGeneralData({ ...projectGeneralData, description: e.target.value });
                  }}
                  placeholder="Detalles sobre el concepto, amenidades y ubicación del proyecto..."
                  className="form-textarea"
                  rows={3}
                  required
                />
              </div>

              <div className="grid-cols-3">
                <div className="form-group">
                  <label className="form-label">Superficie total del Proyecto en metros cuadrados (m²) *</label>
                  <input
                    id="proj_input_totalSurface"
                    type="number"
                    value={projectGeneralData.totalSurfaceM2}
                    onChange={(e) => {
                      setErrorMsg("");
                      setProjectGeneralData({ ...projectGeneralData, totalSurfaceM2: e.target.value });
                    }}
                    placeholder="Superficie Total m²"
                    className="form-input"
                    required
                  />
                </div>

                <div className="form-group">
                  <DevioDatePicker
                    id="proj_input_deliveryDate"
                    label="Fecha de Entrega Estimada"
                    value={projectGeneralData.estimatedDeliveryDate}
                    onChange={(val) => {
                      setErrorMsg("");
                      setProjectGeneralData({ ...projectGeneralData, estimatedDeliveryDate: val });
                    }}
                    placeholder="Seleccionar fecha de entrega"
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Moneda Base (Banxico FX)</label>
                  <select
                    value={baseCurrency}
                    onChange={(e) => setBaseCurrency(e.target.value as Currency)}
                    className="form-select"
                  >
                    <option value="MXN">MXN — Pesos Mexicanos</option>
                    <option value="USD">USD — Dólares Americanos</option>
                  </select>
                </div>
              </div>

              {/* Documentos & Imágenes iniciales */}
              <div className="grid-cols-2" style={{ marginTop: "0.5rem" }}>
                {/* Galería de Imágenes */}
                <div className="form-group">
                  <label className="form-label">Imágenes del proyecto ({galleryPreviews.length})</label>
                  <input
                    type="file"
                    ref={galleryInputRef}
                    onChange={handleGallerySelect}
                    accept="image/*"
                    multiple
                    style={{ display: "none" }}
                  />

                  {galleryPreviews.length > 0 ? (
                    <div>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", marginBottom: "0.5rem" }}>
                        {galleryPreviews.map((img) => (
                          <div
                            key={img.id}
                            style={{
                              position: "relative",
                              width: "60px",
                              height: "60px",
                              borderRadius: "0.4rem",
                              overflow: "hidden",
                              border: "1px solid var(--border-subtle)",
                            }}
                          >
                            <img src={img.url} alt={img.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                            <button
                              type="button"
                              onClick={() => handleRemoveGalleryItem(img.id)}
                              style={{
                                position: "absolute",
                                top: "2px",
                                right: "2px",
                                backgroundColor: "rgba(0,0,0,0.6)",
                                color: "#ffffff",
                                border: "none",
                                borderRadius: "50%",
                                width: "18px",
                                height: "18px",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                cursor: "pointer",
                                padding: 0,
                              }}
                            >
                              <X size={12} />
                            </button>
                          </div>
                        ))}
                      </div>
                      <button
                        type="button"
                        onClick={() => galleryInputRef.current?.click()}
                        className="btn btn-outline"
                        style={{ fontSize: "0.75rem", padding: "0.3rem 0.6rem" }}
                      >
                        <Plus size={12} /> Subir más imágenes
                      </button>
                    </div>
                  ) : (
                    <div
                      onClick={() => galleryInputRef.current?.click()}
                      style={{
                        border: "2px dashed var(--devio-neutral-2)",
                        borderRadius: "0.5rem",
                        padding: "1rem",
                        textAlign: "center",
                        backgroundColor: "var(--bg-page)",
                        cursor: "pointer",
                        transition: "border-color 0.2s ease",
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.borderColor = "var(--devio-blue)")}
                      onMouseLeave={(e) => (e.currentTarget.style.borderColor = "var(--devio-neutral-2)")}
                    >
                      <Upload size={20} color="var(--devio-blue-matte)" style={{ margin: "0 auto 0.2rem" }} />
                      <p style={{ fontSize: "0.8125rem", color: "var(--devio-neutral-4)", fontWeight: 500, margin: 0 }}>
                        Click para subir imágenes del proyecto
                      </p>
                    </div>
                  )}
                </div>

                {/* Brochure Uploader */}
                <div className="form-group">
                  <label className="form-label">Brochure del proyecto (PDF)</label>
                  <input
                    type="file"
                    ref={brochureInputRef}
                    onChange={handleBrochureSelect}
                    accept=".pdf,application/pdf"
                    style={{ display: "none" }}
                  />

                  {brochureFile ? (
                    <div
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
                      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                        <FileText size={20} color="var(--devio-blue)" />
                        <div>
                          <p style={{ fontSize: "0.8125rem", fontWeight: 600, color: "var(--devio-blue-dark)", margin: 0 }}>
                            {brochureFile.name}
                          </p>
                          <span style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>
                            {brochureFile.size} • <button type="button" onClick={() => brochureInputRef.current?.click()} style={{ background: "none", border: "none", color: "var(--devio-blue)", cursor: "pointer", padding: 0, textDecoration: "underline", fontSize: "0.72rem" }}>Cambiar</button>
                          </span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={handleRemoveBrochure}
                        style={{
                          background: "none",
                          border: "none",
                          color: "var(--devio-red)",
                          cursor: "pointer",
                          padding: "0.4rem",
                        }}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ) : (
                    <div
                      onClick={() => brochureInputRef.current?.click()}
                      style={{
                        border: "2px dashed var(--devio-neutral-2)",
                        borderRadius: "0.5rem",
                        padding: "1rem",
                        textAlign: "center",
                        backgroundColor: "var(--bg-page)",
                        cursor: "pointer",
                        transition: "border-color 0.2s ease",
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.borderColor = "var(--devio-blue)")}
                      onMouseLeave={(e) => (e.currentTarget.style.borderColor = "var(--devio-neutral-2)")}
                    >
                      <Upload size={20} color="var(--devio-blue-matte)" style={{ margin: "0 auto 0.2rem" }} />
                      <p style={{ fontSize: "0.8125rem", color: "var(--devio-neutral-4)", fontWeight: 500, margin: 0 }}>
                        Click para subir brochure de proyecto (PDF)
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "1.5rem" }}>
                <button type="button" onClick={() => goToStep(2)} className="btn btn-primary">
                  Continuar a Inventario de Unidades <ArrowRight size={16} />
                </button>
              </div>
            </div>
          )}

          {/* ETAPA 2: INVENTARIO DE UNIDADES */}
          {step === 2 && (
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.5rem" }}>
                <div>
                  <h2 style={{ fontSize: "1.25rem", color: "var(--devio-blue-dark)" }}>2. Inventario de Unidades</h2>
                  <p style={{ fontSize: "0.8125rem", color: "var(--text-muted)", marginTop: "0.25rem" }}>
                    Carga las unidades de tu proyecto o impórtalas masivamente con la plantilla Excel. Puedes subir al menos 1 unidad o continuar sin unidades para subirlas más tarde.
                  </p>
                </div>

                <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", justifyContent: "flex-end" }}>
                  <button
                    type="button"
                    onClick={downloadUnitsTemplate}
                    className="btn btn-outline"
                    style={{ fontSize: "0.75rem", padding: "0.45rem 0.85rem" }}
                  >
                    <Download size={14} /> Descargar Plantilla Excel (.xlsx)
                  </button>

                  <button
                    type="button"
                    onClick={() => unitsFileInputRef.current?.click()}
                    className="btn btn-outline"
                    style={{ fontSize: "0.75rem", padding: "0.45rem 0.85rem" }}
                  >
                    <FileSpreadsheet size={14} /> Subir Excel Unidades (.xlsx)
                  </button>

                  <button
                    id="proj_btn_add_unit"
                    type="button"
                    onClick={handleAddUnit}
                    className="btn btn-primary"
                    style={{ fontSize: "0.75rem", padding: "0.45rem 0.85rem" }}
                  >
                    <Plus size={14} /> Agregar Unidad
                  </button>

                  {/* Dropdown de Columnas con Buscador */}
                  <div style={{ position: "relative" }}>
                    <button
                      type="button"
                      onClick={() => setIsColumnDropdownOpen(!isColumnDropdownOpen)}
                      className="btn btn-secondary"
                      style={{ fontSize: "0.75rem", padding: "0.45rem 0.85rem" }}
                    >
                      <Columns size={14} /> Columnas ({activeColumns.length})
                    </button>

                    {isColumnDropdownOpen && (
                      <div
                        className="modal-content"
                        style={{
                          position: "absolute",
                          right: 0,
                          top: "100%",
                          marginTop: "0.5rem",
                          backgroundColor: "var(--devio-white)",
                          border: "1px solid var(--border-subtle)",
                          borderRadius: "0.75rem",
                          boxShadow: "0 10px 30px rgba(0,0,0,0.15)",
                          width: "300px",
                          maxHeight: "400px",
                          overflowY: "auto",
                          zIndex: 100,
                          padding: "0.5rem 0",
                        }}
                      >
                        <div style={{ padding: "0.5rem 0.75rem", borderBottom: "1px solid var(--border-subtle)" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", backgroundColor: "var(--bg-page)", padding: "0.35rem 0.6rem", borderRadius: "0.4rem" }}>
                            <Search size={14} color="var(--text-muted)" />
                            <input
                              type="text"
                              value={columnSearchQuery}
                              onChange={(e) => setColumnSearchQuery(e.target.value)}
                              placeholder="Buscar columna..."
                              style={{ border: "none", background: "transparent", fontSize: "0.75rem", width: "100%", outline: "none" }}
                            />
                          </div>
                        </div>

                        <div style={{ padding: "0.4rem 1rem", fontSize: "0.7rem", fontWeight: 700, color: "var(--devio-neutral-3)" }}>
                          COLUMNAS DISPONIBLES
                        </div>

                        {filteredColumnPresets.map((preset) => {
                          const isChecked = activeColumns.some((c) => c.id === preset.id);
                          return (
                            <div
                              key={preset.id}
                              onClick={() => handleTogglePresetColumn(preset)}
                              style={{
                                padding: "0.45rem 1rem",
                                fontSize: "0.8125rem",
                                cursor: "pointer",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                                backgroundColor: isChecked ? "rgba(31, 54, 82, 0.05)" : "transparent",
                                transition: "background-color 0.15s ease",
                              }}
                            >
                              <span>{preset.title}</span>
                              {isChecked ? (
                                <div style={{ width: "16px", height: "16px", borderRadius: "50%", backgroundColor: "var(--devio-green)", color: "white", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                  <Check size={10} />
                                </div>
                              ) : (
                                <Plus size={14} color="var(--devio-neutral-3)" />
                              )}
                            </div>
                          );
                        })}

                        <div style={{ borderTop: "1px solid var(--border-subtle)", padding: "0.5rem 0.75rem", marginTop: "0.3rem" }}>
                          <button
                            type="button"
                            onClick={() => {
                              setIsColumnDropdownOpen(false);
                              setIsCustomColModalOpen(true);
                            }}
                            className="btn btn-outline"
                            style={{ width: "100%", fontSize: "0.75rem", padding: "0.4rem" }}
                          >
                            <Plus size={14} /> Nueva Columna Personalizada
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Dynamic Units Table or Empty State */}
              {units.length > 0 ? (
                <div style={{ overflowX: "auto", border: "1px solid var(--border-subtle)", borderRadius: "0.75rem", marginBottom: "1.5rem" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.8125rem" }}>
                    <thead>
                      <tr style={{ backgroundColor: "var(--bg-page)", borderBottom: "2px solid var(--border-subtle)", textAlign: "left" }}>
                        <th style={{ padding: "0.75rem 0.5rem", width: "40px" }}></th>
                        <th style={{ padding: "0.75rem" }}>Unidad</th>
                        <th style={{ padding: "0.75rem" }}>Superficie (m²)</th>
                        <th style={{ padding: "0.75rem" }}>Precio ({baseCurrency})</th>
                        <th style={{ padding: "0.75rem" }}>Estado</th>
                        <th style={{ padding: "0.75rem" }}>Fecha de entrega</th>
                        <th style={{ padding: "0.75rem" }}>Tipo</th>

                        {activeColumns.map((col) => (
                          <th key={col.id} style={{ padding: "0.75rem", color: "var(--devio-blue)", position: "relative" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}>
                              <span>{col.title}</span>
                              <button
                                type="button"
                                onClick={() => setActiveColumns((prev) => prev.filter((c) => c.id !== col.id))}
                                style={{ background: "none", border: "none", cursor: "pointer", color: "var(--devio-neutral-3)" }}
                                title="Remover columna de la vista"
                              >
                                <X size={12} />
                              </button>
                            </div>
                          </th>
                        ))}

                        <th style={{ padding: "0.75rem", width: "40px" }}></th>
                      </tr>
                    </thead>
                    <tbody>
                      {units.map((u, idx) => (
                        <tr key={u.id} style={{ borderBottom: "1px solid var(--border-subtle)" }}>
                          <td style={{ padding: "0.5rem", textAlign: "center", color: "var(--text-muted)" }}>
                            {idx + 1}
                          </td>
                          <td style={{ padding: "0.5rem" }}>
                            <input
                              type="text"
                              value={u.unitNumber}
                              onChange={(e) => handleUnitChange(u.id, "unitNumber", e.target.value)}
                              className="form-input"
                              style={{ padding: "0.4rem", fontSize: "0.8125rem", width: "80px" }}
                            />
                          </td>
                          <td style={{ padding: "0.5rem" }}>
                            <input
                              type="number"
                              value={u.surfaceM2}
                              onChange={(e) => handleUnitChange(u.id, "surfaceM2", parseFloat(e.target.value) || 0)}
                              className="form-input"
                              style={{ padding: "0.4rem", fontSize: "0.8125rem", width: "90px" }}
                            />
                          </td>
                          <td style={{ padding: "0.5rem" }}>
                            <input
                              type="number"
                              value={u.price}
                              onChange={(e) => handleUnitChange(u.id, "price", parseFloat(e.target.value) || 0)}
                              className="form-input"
                              style={{ padding: "0.4rem", fontSize: "0.8125rem", width: "120px", fontWeight: 600 }}
                            />
                          </td>
                          <td style={{ padding: "0.5rem" }}>
                            <select
                              value={u.status}
                              onChange={(e) => handleUnitChange(u.id, "status", e.target.value as any)}
                              className="form-select"
                              style={{ padding: "0.4rem", fontSize: "0.8125rem", width: "120px" }}
                            >
                              <option value="Disponible">Disponible</option>
                              <option value="Apartada">Apartada</option>
                              <option value="Vendida">Vendida</option>
                              <option value="Bloqueada">Bloqueada</option>
                            </select>
                          </td>
                          <td style={{ padding: "0.5rem" }}>
                            <input
                              type="text"
                              value={u.deliveryDate}
                              onChange={(e) => handleUnitChange(u.id, "deliveryDate", e.target.value)}
                              className="form-input"
                              style={{ padding: "0.4rem", fontSize: "0.8125rem", width: "100px" }}
                            />
                          </td>
                          <td style={{ padding: "0.5rem" }}>
                            <input
                              type="text"
                              value={u.type}
                              onChange={(e) => handleUnitChange(u.id, "type", e.target.value)}
                              className="form-input"
                              style={{ padding: "0.4rem", fontSize: "0.8125rem", width: "120px" }}
                            />
                          </td>

                          {activeColumns.map((col) => (
                            <td key={col.id} style={{ padding: "0.5rem" }}>
                              <input
                                type={col.type === "number" ? "number" : "text"}
                                value={u.extraFields[col.id] || ""}
                                onChange={(e) => handleUnitExtraChange(u.id, col.id, e.target.value)}
                                placeholder={col.title}
                                className="form-input"
                                style={{ padding: "0.4rem", fontSize: "0.8125rem", minWidth: "90px" }}
                              />
                            </td>
                          ))}

                          <td style={{ padding: "0.5rem", textAlign: "center" }}>
                            <button
                              type="button"
                              onClick={() => handleRemoveUnit(u.id)}
                              style={{ background: "none", border: "none", color: "var(--devio-red)", cursor: "pointer" }}
                              title="Eliminar fila"
                            >
                              <Trash2 size={16} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div
                  style={{
                    padding: "3rem 1.5rem",
                    textAlign: "center",
                    backgroundColor: "var(--bg-page)",
                    border: "2px dashed var(--border-subtle)",
                    borderRadius: "0.75rem",
                    marginBottom: "1.5rem",
                  }}
                >
                  <Building2 size={36} color="var(--devio-neutral-3)" style={{ margin: "0 auto 0.75rem" }} />
                  <h4 style={{ fontSize: "1rem", color: "var(--devio-blue-dark)", marginBottom: "0.4rem" }}>
                    Aún no hay unidades agregadas
                  </h4>
                  <p style={{ fontSize: "0.8125rem", color: "var(--text-muted)", maxWidth: "460px", margin: "0 auto 1.25rem" }}>
                    Puedes agregar tu primera unidad manualmente o importar un archivo Excel. Si lo prefieres, puedes continuar sin unidades y cargarlas después en el módulo de inventario.
                  </p>
                  <div style={{ display: "flex", gap: "0.75rem", justifyContent: "center", flexWrap: "wrap" }}>
                    <button
                      type="button"
                      onClick={handleAddUnit}
                      className="btn btn-primary"
                      style={{ fontSize: "0.8125rem", padding: "0.5rem 1rem" }}
                    >
                      <Plus size={15} /> Agregar Primera Unidad
                    </button>
                    <button
                      type="button"
                      onClick={() => unitsFileInputRef.current?.click()}
                      className="btn btn-outline"
                      style={{ fontSize: "0.8125rem", padding: "0.5rem 1rem" }}
                    >
                      <FileSpreadsheet size={15} /> Importar desde Excel
                    </button>
                  </div>
                </div>
              )}

              {/* PLANTAS DE CONJUNTO SECTION */}
              {units.length > 0 && (
                <div
                  style={{
                    marginTop: "2rem",
                    padding: "1.25rem",
                    backgroundColor: "#F8FAFC",
                    borderRadius: "0.85rem",
                    border: "1px solid #E2E8F0",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem", flexWrap: "wrap", gap: "0.5rem" }}>
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.45rem" }}>
                        <Layers size={18} color="var(--devio-blue)" />
                        <h3 style={{ fontSize: "1rem", fontWeight: 700, color: "var(--devio-blue-dark)", margin: 0 }}>
                          Plantas de Conjunto & Planos Arquitectónicos ({onboardingFloorPlans.length})
                        </h3>
                      </div>
                      <p style={{ fontSize: "0.78rem", color: "var(--text-muted)", margin: 0, marginTop: "0.15rem" }}>
                        Asocia planos arquitectónicos y blueprints a los niveles o agrupaciones de unidades de tu proyecto.
                      </p>
                    </div>

                    <div style={{ display: "flex", gap: "0.5rem" }}>
                      <button
                        type="button"
                        onClick={handleAutoGenerateFloorPlans}
                        className="btn btn-outline"
                        style={{ fontSize: "0.75rem", padding: "0.35rem 0.75rem" }}
                      >
                        <Sparkles size={13} /> Auto-agrupar por Nivel
                      </button>
                      <button
                        type="button"
                        onClick={handleOpenAddFloorPlan}
                        className="btn btn-primary"
                        style={{ fontSize: "0.75rem", padding: "0.35rem 0.75rem" }}
                      >
                        <Plus size={13} /> Agregar Planta
                      </button>
                    </div>
                  </div>

                  {onboardingFloorPlans.length === 0 ? (
                    <div
                      style={{
                        padding: "1.75rem 1rem",
                        textAlign: "center",
                        backgroundColor: "#FFFFFF",
                        borderRadius: "0.65rem",
                        border: "1.5px dashed #CBD5E1",
                        color: "#64748B",
                      }}
                    >
                      <Layers size={32} color="#CBD5E1" style={{ margin: "0 auto 0.5rem" }} />
                      <p style={{ fontSize: "0.8125rem", fontWeight: 600, margin: "0 0 0.5rem" }}>
                        Aún no has configurado plantas de conjunto para este proyecto.
                      </p>
                      <p style={{ fontSize: "0.75rem", color: "#94A3B8", margin: "0 0 1rem" }}>
                        Puedes autogenerarlas según los niveles de tus unidades o cargarlas manualmente.
                      </p>
                      <div style={{ display: "flex", gap: "0.5rem", justifyContent: "center" }}>
                        <button
                          type="button"
                          onClick={handleAutoGenerateFloorPlans}
                          className="btn btn-outline"
                          style={{ fontSize: "0.75rem", padding: "0.4rem 0.85rem" }}
                        >
                          <Sparkles size={14} /> Generar Plantas Automáticas
                        </button>
                        <button
                          type="button"
                          onClick={handleOpenAddFloorPlan}
                          className="btn btn-primary"
                          style={{ fontSize: "0.75rem", padding: "0.4rem 0.85rem" }}
                        >
                          <Plus size={14} /> Crear Planta Manual
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
                        gap: "0.75rem",
                      }}
                    >
                      {onboardingFloorPlans.map((fp) => {
                        const assignedUnits = units.filter((u) => u.floorPlan === fp.name);
                        return (
                          <div
                            key={fp.id}
                            style={{
                              backgroundColor: "#FFFFFF",
                              borderRadius: "0.75rem",
                              border: "1px solid #E2E8F0",
                              overflow: "hidden",
                              display: "flex",
                              flexDirection: "column",
                              justifyContent: "space-between",
                            }}
                          >
                            {fp.imageUrl && (
                              <div style={{ height: "110px", backgroundColor: "#0F172A", position: "relative", overflow: "hidden" }}>
                                <img
                                  src={fp.imageUrl}
                                  alt={fp.name}
                                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                                />
                              </div>
                            )}
                            <div style={{ padding: "0.75rem" }}>
                              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.35rem" }}>
                                <strong style={{ fontSize: "0.85rem", color: "#1F3652" }}>
                                  {fp.name}
                                </strong>
                                <div style={{ display: "flex", gap: "0.25rem" }}>
                                  <button
                                    type="button"
                                    onClick={() => handleOpenEditFloorPlan(fp)}
                                    style={{ background: "none", border: "none", cursor: "pointer", color: "#64748B", padding: "0.15rem" }}
                                    title="Editar"
                                  >
                                    <Edit2 size={13} />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteFloorPlan(fp.id)}
                                    style={{ background: "none", border: "none", cursor: "pointer", color: "#EF4444", padding: "0.15rem" }}
                                    title="Eliminar"
                                  >
                                    <Trash2 size={13} />
                                  </button>
                                </div>
                              </div>
                              <div style={{ fontSize: "0.72rem", color: "#64748B" }}>
                                <strong>{assignedUnits.length} unidades asignadas</strong>
                              </div>
                              <div
                                style={{
                                  fontSize: "0.68rem",
                                  color: "#94A3B8",
                                  marginTop: "0.3rem",
                                  overflow: "hidden",
                                  textOverflow: "ellipsis",
                                  whiteSpace: "nowrap",
                                }}
                              >
                                {assignedUnits.length > 0
                                  ? assignedUnits.map((u) => u.unitNumber).slice(0, 8).join(", ") +
                                    (assignedUnits.length > 8 ? ` +${assignedUnits.length - 8} más` : "")
                                  : "Sin unidades asignadas"}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* Informative Note when 0 units */}
              {units.length === 0 && (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.75rem",
                    padding: "0.75rem 1rem",
                    backgroundColor: "rgba(31, 54, 82, 0.04)",
                    border: "1px solid var(--border-subtle)",
                    borderRadius: "0.5rem",
                    marginBottom: "1.5rem",
                    fontSize: "0.8125rem",
                    color: "var(--devio-neutral-4)",
                  }}
                >
                  <Info size={18} color="var(--devio-blue)" style={{ flexShrink: 0 }} />
                  <span>
                    <strong>¿Deseas continuar sin unidades?</strong> Puedes avanzar ahora. El sistema creará el proyecto y te recordará subir el inventario posteriormente.
                  </span>
                </div>
              )}

              <div style={{ display: "flex", justifyContent: "space-between", marginTop: "1.5rem" }}>
                <button type="button" onClick={() => goToStep(1)} className="btn btn-outline">
                  <ArrowLeft size={16} /> Anterior
                </button>
                <button type="button" onClick={() => goToStep(3)} className="btn btn-primary">
                  {units.length === 0 ? "Continuar sin unidades" : "Continuar a Adicionales"} <ArrowRight size={16} />
                </button>
              </div>
            </div>
          )}

          {/* ETAPA 3: ADICIONALES (ADD-ONS) - TABLA INLINE INDEPENDIENTE */}
          {step === 3 && (
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.5rem" }}>
                <div>
                  <h2 style={{ fontSize: "1.25rem", color: "var(--devio-blue-dark)" }}>3. Adicionales (Add-ons)</h2>
                  <p style={{ fontSize: "0.8125rem", color: "var(--text-muted)", marginTop: "0.25rem" }}>
                    Registra bodegas, cajones de estacionamiento u otros elementos complementarios. Los adicionales son opcionales.
                  </p>
                </div>

                <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                  <button
                    type="button"
                    onClick={downloadAdditionalsTemplate}
                    className="btn btn-outline"
                    style={{ fontSize: "0.75rem", padding: "0.45rem 0.85rem" }}
                  >
                    <Download size={14} /> Plantilla Excel (.xlsx)
                  </button>
                  <button
                    type="button"
                    onClick={() => additionalsFileInputRef.current?.click()}
                    className="btn btn-outline"
                    style={{ fontSize: "0.75rem", padding: "0.45rem 0.85rem" }}
                  >
                    <FileSpreadsheet size={14} /> Subir Excel Adicionales
                  </button>
                  <button
                    type="button"
                    onClick={handleAddAdditionalRow}
                    className="btn btn-primary"
                    style={{ fontSize: "0.75rem", padding: "0.45rem 0.85rem" }}
                  >
                    <Plus size={14} /> Agregar Adicional
                  </button>
                </div>
              </div>

              {/* Additionals Table */}
              {additionals.length > 0 ? (
                <div style={{ overflowX: "auto", border: "1px solid var(--border-subtle)", borderRadius: "0.75rem", marginBottom: "1.5rem" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.8125rem" }}>
                    <thead>
                      <tr style={{ backgroundColor: "var(--bg-page)", borderBottom: "2px solid var(--border-subtle)", textAlign: "left" }}>
                        <th style={{ padding: "0.75rem 0.5rem", width: "40px" }}></th>
                        <th style={{ padding: "0.75rem" }}>Nombre / Identificador *</th>
                        <th style={{ padding: "0.75rem" }}>Tipo *</th>
                        <th style={{ padding: "0.75rem" }}>Precio ({baseCurrency}) *</th>
                        <th style={{ padding: "0.75rem" }}>Estado</th>
                        <th style={{ padding: "0.75rem" }}>Notas</th>
                        <th style={{ padding: "0.75rem", width: "40px" }}></th>
                      </tr>
                    </thead>
                    <tbody>
                      {additionals.map((add, idx) => (
                        <tr key={add.id} style={{ borderBottom: "1px solid var(--border-subtle)" }}>
                          <td style={{ padding: "0.5rem", textAlign: "center", color: "var(--text-muted)" }}>
                            {idx + 1}
                          </td>
                          <td style={{ padding: "0.5rem" }}>
                            <input
                              type="text"
                              value={add.name}
                              onChange={(e) => handleAdditionalChange(add.id, "name", e.target.value)}
                              placeholder="Ej. Cajón E-12 / Bodega B-04"
                              className="form-input"
                              style={{ padding: "0.4rem", fontSize: "0.8125rem", minWidth: "180px" }}
                            />
                          </td>
                          <td style={{ padding: "0.5rem" }}>
                            <select
                              value={add.type}
                              onChange={(e) => handleAdditionalChange(add.id, "type", e.target.value as any)}
                              className="form-select"
                              style={{ padding: "0.4rem", fontSize: "0.8125rem", minWidth: "150px" }}
                            >
                              <option value="Estacionamiento">Estacionamiento</option>
                              <option value="Bodega">Bodega</option>
                              <option value="Otro">Otro Adicional</option>
                            </select>
                          </td>
                          <td style={{ padding: "0.5rem" }}>
                            <input
                              type="number"
                              value={add.price}
                              onChange={(e) => handleAdditionalChange(add.id, "price", parseFloat(e.target.value) || 0)}
                              className="form-input"
                              style={{ padding: "0.4rem", fontSize: "0.8125rem", width: "120px", fontWeight: 600 }}
                            />
                          </td>
                          <td style={{ padding: "0.5rem" }}>
                            <select
                              value={add.status}
                              onChange={(e) => handleAdditionalChange(add.id, "status", e.target.value as any)}
                              className="form-select"
                              style={{ padding: "0.4rem", fontSize: "0.8125rem", width: "130px" }}
                            >
                              <option value="Disponible">Disponible</option>
                              <option value="Asignado">Asignado</option>
                              <option value="Vendido">Vendido</option>
                            </select>
                          </td>
                          <td style={{ padding: "0.5rem" }}>
                            <input
                              type="text"
                              value={add.notes}
                              onChange={(e) => handleAdditionalChange(add.id, "notes", e.target.value)}
                              placeholder="Detalles opcionales..."
                              className="form-input"
                              style={{ padding: "0.4rem", fontSize: "0.8125rem", minWidth: "160px" }}
                            />
                          </td>
                          <td style={{ padding: "0.5rem", textAlign: "center" }}>
                            <button
                              type="button"
                              onClick={() => handleRemoveAdditional(add.id)}
                              style={{ background: "none", border: "none", color: "var(--devio-red)", cursor: "pointer" }}
                              title="Eliminar adicional"
                            >
                              <Trash2 size={16} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div
                  style={{
                    padding: "3rem 1.5rem",
                    textAlign: "center",
                    backgroundColor: "var(--bg-page)",
                    border: "2px dashed var(--border-subtle)",
                    borderRadius: "0.75rem",
                    marginBottom: "1.5rem",
                  }}
                >
                  <Package size={36} color="var(--devio-neutral-3)" style={{ margin: "0 auto 0.75rem" }} />
                  <h4 style={{ fontSize: "1rem", color: "var(--devio-blue-dark)", marginBottom: "0.4rem" }}>
                    Sin adicionales registrados
                  </h4>
                  <p style={{ fontSize: "0.8125rem", color: "var(--text-muted)", maxWidth: "440px", margin: "0 auto 1.25rem" }}>
                    Los adicionales son opcionales. Puedes agregar cajones de estacionamiento o bodegas ahora o gestionarlos más adelante.
                  </p>
                  <div style={{ display: "flex", gap: "0.75rem", justifyContent: "center", flexWrap: "wrap" }}>
                    <button
                      type="button"
                      onClick={handleAddAdditionalRow}
                      className="btn btn-primary"
                      style={{ fontSize: "0.8125rem", padding: "0.5rem 1rem" }}
                    >
                      <Plus size={15} /> Agregar Adicional
                    </button>
                    <button
                      type="button"
                      onClick={() => additionalsFileInputRef.current?.click()}
                      className="btn btn-outline"
                      style={{ fontSize: "0.8125rem", padding: "0.5rem 1rem" }}
                    >
                      <FileSpreadsheet size={15} /> Importar Excel Adicionales
                    </button>
                  </div>
                </div>
              )}

              <div style={{ display: "flex", justifyContent: "space-between", marginTop: "1.5rem" }}>
                <button type="button" onClick={() => goToStep(2)} className="btn btn-outline">
                  <ArrowLeft size={16} /> Anterior
                </button>
                <button type="button" onClick={() => goToStep(4)} className="btn btn-primary">
                  Continuar a Planes de Pago <ArrowRight size={16} />
                </button>
              </div>
            </div>
          )}

          {/* ETAPA 4: PLANES DE PAGO & BIBLIOTECA GLOBAL */}
          {step === 4 && (
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.5rem" }}>
                <div>
                  <h2 style={{ fontSize: "1.25rem", color: "var(--devio-blue-dark)" }}>4. Planes de Pago del Proyecto</h2>
                  <p style={{ fontSize: "0.8125rem", color: "var(--text-muted)", marginTop: "0.25rem" }}>
                    Activa los planes de pago aplicables a este desarrollo desde tu biblioteca global o crea nuevos esquemas de financiamiento.
                  </p>
                </div>
                <button
                  id="proj_btn_add_plan"
                  type="button"
                  onClick={() => handleOpenPaymentPlanModal()}
                  className="btn btn-primary"
                  style={{ fontSize: "0.8125rem", padding: "0.5rem 1rem" }}
                >
                  <Plus size={16} /> Crear Nuevo Plan
                </button>
              </div>

              {/* Informative Box */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.75rem",
                  padding: "0.75rem 1rem",
                  backgroundColor: "rgba(31, 54, 82, 0.04)",
                  border: "1px solid var(--border-subtle)",
                  borderRadius: "0.5rem",
                  marginBottom: "1.5rem",
                  fontSize: "0.8125rem",
                  color: "var(--devio-neutral-4)",
                }}
              >
                <Sliders size={18} color="var(--devio-blue)" style={{ flexShrink: 0 }} />
                <span>
                  <strong>Biblioteca de Planes:</strong> Los planes creados se guardan en tu catálogo general para ser reutilizados en otros desarrollos. También puedes administrarlos globalmente desde <strong>Ajustes &gt; Planes de Pago</strong>.
                </span>
              </div>

              {/* Plans Library List */}
              {globalPlanLibrary.length > 0 ? (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "1rem", marginBottom: "1.5rem" }}>
                  {globalPlanLibrary.map((plan) => {
                    const isSelected = selectedPlanIds.includes(plan.id);

                    return (
                      <div
                        key={plan.id}
                        style={{
                          backgroundColor: isSelected ? "var(--devio-white)" : "var(--bg-page)",
                          border: `2px solid ${isSelected ? "var(--devio-blue)" : "var(--border-subtle)"}`,
                          borderRadius: "0.75rem",
                          padding: "1.25rem",
                          position: "relative",
                          transition: "all 0.2s ease",
                        }}
                      >
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.75rem" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                            <button
                              type="button"
                              onClick={() => handleTogglePlanForProject(plan.id)}
                              style={{
                                background: "none",
                                border: "none",
                                cursor: "pointer",
                                padding: 0,
                                color: isSelected ? "var(--devio-blue)" : "var(--devio-neutral-3)",
                                display: "flex",
                                alignItems: "center",
                              }}
                              title={isSelected ? "Desactivar en este proyecto" : "Activar en este proyecto"}
                            >
                              {isSelected ? <CheckSquare size={20} /> : <Square size={20} />}
                            </button>
                            <div>
                              <h4 style={{ fontSize: "1rem", color: "var(--devio-blue-dark)", margin: 0 }}>
                                {plan.name}
                              </h4>
                              <span className="badge badge-info" style={{ fontSize: "0.7rem", marginTop: "0.2rem" }}>
                                {plan.paymentType === "CONTADO" ? "Pago de Contado" : "Esquema de Pago"}
                              </span>
                            </div>
                          </div>

                          <div style={{ display: "flex", gap: "0.3rem" }}>
                            <button
                              type="button"
                              onClick={() => handleOpenPaymentPlanModal(plan)}
                              style={{ background: "none", border: "none", cursor: "pointer", color: "var(--devio-blue)" }}
                              title="Editar plan"
                            >
                              <Edit2 size={15} />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeletePlanFromLibrary(plan.id)}
                              style={{ background: "none", border: "none", cursor: "pointer", color: "var(--devio-red)" }}
                              title="Eliminar de la biblioteca"
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </div>

                        {plan.paymentType === "ESQUEMA" ? (
                          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "0.5rem", fontSize: "0.8125rem", marginBottom: "0.75rem" }}>
                            <div>
                              <span style={{ color: "var(--text-muted)" }}>Enganche:</span>
                              <p style={{ fontWeight: 700, margin: "0.1rem 0 0" }}>{plan.downPaymentPercentage}%</p>
                            </div>
                            <div>
                              <span style={{ color: "var(--text-muted)" }}>Plazos:</span>
                              <p style={{ fontWeight: 700, margin: "0.1rem 0 0" }}>{plan.installmentsCount} ({plan.periodicity})</p>
                            </div>
                            <div>
                              <span style={{ color: "var(--text-muted)" }}>Liquidación:</span>
                              <p style={{ fontWeight: 700, margin: "0.1rem 0 0" }}>{plan.settlementPercentage}%</p>
                            </div>
                          </div>
                        ) : (
                          <div style={{ fontSize: "0.8125rem", marginBottom: "0.75rem" }}>
                            <span style={{ color: "var(--text-muted)" }}>Descuento por Contado:</span>
                            <p style={{ fontWeight: 700, color: "var(--devio-green)", margin: "0.1rem 0 0" }}>{plan.discountPercentage}%</p>
                          </div>
                        )}

                        {plan.internalNotes && (
                          <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontStyle: "italic", margin: "0 0 0.75rem" }}>
                            {plan.internalNotes}
                          </p>
                        )}

                        <div style={{ borderTop: "1px solid var(--border-subtle)", paddingTop: "0.6rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <span style={{ fontSize: "0.75rem", color: isSelected ? "var(--devio-green)" : "var(--text-muted)", fontWeight: 600 }}>
                            {isSelected ? "Activo en este proyecto" : "Inactivo para este proyecto"}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleTogglePlanForProject(plan.id)}
                            className={isSelected ? "btn btn-outline" : "btn btn-primary"}
                            style={{ fontSize: "0.72rem", padding: "0.25rem 0.6rem" }}
                          >
                            {isSelected ? "Desactivar" : "Activar"}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div
                  style={{
                    padding: "3rem 1.5rem",
                    textAlign: "center",
                    backgroundColor: "var(--bg-page)",
                    border: "2px dashed var(--border-subtle)",
                    borderRadius: "0.75rem",
                    marginBottom: "1.5rem",
                  }}
                >
                  <Coins size={36} color="var(--devio-neutral-3)" style={{ margin: "0 auto 0.75rem" }} />
                  <h4 style={{ fontSize: "1rem", color: "var(--devio-blue-dark)", marginBottom: "0.4rem" }}>
                    No hay planes de pago en tu biblioteca
                  </h4>
                  <p style={{ fontSize: "0.8125rem", color: "var(--text-muted)", maxWidth: "440px", margin: "0 auto 1.25rem" }}>
                    Crea esquemas de financiamiento (enganche, plazos o pago de contado) que quedarán guardados en tu catálogo global.
                  </p>
                  <button
                    type="button"
                    onClick={() => handleOpenPaymentPlanModal()}
                    className="btn btn-primary"
                    style={{ fontSize: "0.8125rem", padding: "0.5rem 1.2rem" }}
                  >
                    <Plus size={15} /> Crear Primer Plan de Pago
                  </button>
                </div>
              )}

              <div style={{ display: "flex", justifyContent: "space-between", marginTop: "1.5rem" }}>
                <button type="button" onClick={() => goToStep(3)} className="btn btn-outline">
                  <ArrowLeft size={16} /> Anterior
                </button>
                <button type="button" onClick={() => goToStep(5)} className="btn btn-primary">
                  Continuar a Asignación de Equipo <ArrowRight size={16} />
                </button>
              </div>
            </div>
          )}

          {/* ETAPA 5: ASIGNACIÓN DE EQUIPO */}
          {step === 5 && (
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.5rem", flexWrap: "wrap", gap: "1rem" }}>
                <div>
                  <h2 style={{ fontSize: "1.25rem", color: "var(--devio-blue-dark)", margin: 0 }}>
                    5. Asignación de Equipo al Proyecto
                  </h2>
                  <p style={{ fontSize: "0.8125rem", color: "var(--text-muted)", marginTop: "0.25rem", margin: 0 }}>
                    Asigna a los asesores comerciales y administradores que tendrán acceso operativo a este desarrollo.
                  </p>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                  {teamMembers.length > 0 && (
                    <>
                      <button
                        type="button"
                        onClick={() => handleSelectAllMembers(true)}
                        className="btn btn-outline"
                        style={{ fontSize: "0.78rem", padding: "0.4rem 0.8rem" }}
                      >
                        <CheckSquare size={14} /> Asignar Todos
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSelectAllMembers(false)}
                        className="btn btn-outline"
                        style={{ fontSize: "0.78rem", padding: "0.4rem 0.8rem" }}
                      >
                        <Square size={14} /> Ninguno
                      </button>
                    </>
                  )}
                  <button
                    type="button"
                    onClick={() => setShowAddMemberModal(true)}
                    className="btn btn-primary"
                    style={{ fontSize: "0.78rem", padding: "0.45rem 0.9rem" }}
                  >
                    <Plus size={15} /> Agregar Colaborador
                  </button>
                </div>
              </div>

              {/* Members List or Empty State */}
              {teamMembers.length === 0 ? (
                <div
                  style={{
                    padding: "3.5rem 1.5rem",
                    textAlign: "center",
                    backgroundColor: "var(--bg-page)",
                    border: "1px dashed var(--border-subtle)",
                    borderRadius: "0.75rem",
                    marginBottom: "1.5rem",
                  }}
                >
                  <div
                    style={{
                      width: "56px",
                      height: "56px",
                      borderRadius: "50%",
                      backgroundColor: "rgba(31, 54, 82, 0.08)",
                      color: "var(--devio-blue)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      margin: "0 auto 1rem",
                    }}
                  >
                    <Users size={28} />
                  </div>
                  <h4 style={{ fontSize: "1.05rem", color: "var(--devio-blue-dark)", marginBottom: "0.4rem" }}>
                    Aún no hay colaboradores registrados
                  </h4>
                  <p style={{ fontSize: "0.8125rem", color: "var(--text-muted)", maxWidth: "480px", margin: "0 auto 1.25rem" }}>
                    Registra a tus asesores de ventas, gerentes o administradores para asignarlos a este proyecto desde el inicio.
                  </p>
                  <button
                    type="button"
                    onClick={() => setShowAddMemberModal(true)}
                    className="btn btn-primary"
                    style={{ fontSize: "0.8125rem", padding: "0.5rem 1.25rem" }}
                  >
                    <Plus size={15} /> Agregar Primer Colaborador
                  </button>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", marginBottom: "1.5rem" }}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "0.6rem 1rem",
                      backgroundColor: "rgba(31, 54, 82, 0.04)",
                      borderRadius: "0.5rem",
                      fontSize: "0.78rem",
                      fontWeight: 700,
                      color: "var(--devio-blue-dark)",
                    }}
                  >
                    <span>
                      {teamMembers.filter((m) => m.assigned).length} de {teamMembers.length} colaboradores asignados a este proyecto
                    </span>
                    <span style={{ fontSize: "0.72rem", color: "var(--text-muted)", fontWeight: 500 }}>
                      Haz clic en la casilla para activar o desactivar el acceso
                    </span>
                  </div>

                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
                      gap: "0.75rem",
                    }}
                  >
                    {teamMembers.map((member) => {
                      const isSuperAdmin = isSuperAdminRole(member.role);
                      const isAssigned = isSuperAdmin ? true : member.assigned;
                      const initials = member.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                        .substring(0, 2)
                        .toUpperCase();

                      return (
                        <div
                          key={member.id}
                          onClick={() => {
                            if (!isSuperAdmin) {
                              handleToggleAssignMember(member.id);
                            }
                          }}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            padding: "0.85rem 1rem",
                            borderRadius: "0.65rem",
                            border: `1.5px solid ${isAssigned ? "var(--devio-blue)" : "var(--border-subtle)"}`,
                            backgroundColor: isAssigned ? "rgba(31, 54, 82, 0.02)" : "var(--devio-white)",
                            cursor: isSuperAdmin ? "default" : "pointer",
                            transition: "all 0.15s ease",
                          }}
                          title={isSuperAdmin ? "El Super Admin tiene acceso global obligatorio a todos los proyectos de la desarrolladora." : undefined}
                        >
                          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                            <div
                              style={{
                                width: "36px",
                                height: "36px",
                                borderRadius: "50%",
                                backgroundColor: isSuperAdmin ? "#1F3652" : (isAssigned ? "var(--devio-blue)" : "var(--devio-neutral-2)"),
                                color: "var(--devio-white)",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontSize: "0.8rem",
                                fontWeight: 800,
                                flexShrink: 0,
                              }}
                            >
                              {initials}
                            </div>
                            <div>
                              <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--devio-blue-dark)", display: "flex", alignItems: "center", gap: "0.4rem" }}>
                                {member.name}
                              </div>
                              <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                                {member.email}
                              </div>
                            </div>
                          </div>

                          <div style={{ display: "flex", alignItems: "center", gap: "0.65rem" }}>
                            <span
                              style={{
                                fontSize: "0.68rem",
                                fontWeight: 700,
                                padding: "0.2rem 0.55rem",
                                borderRadius: "999px",
                                backgroundColor: isSuperAdmin ? "rgba(31, 54, 82, 0.12)" : (isAssigned ? "rgba(31, 54, 82, 0.1)" : "rgba(0,0,0,0.05)"),
                                color: "var(--devio-blue-dark)",
                              }}
                            >
                              {member.role}
                            </span>
                            <input
                              type="checkbox"
                              checked={isAssigned}
                              disabled={isSuperAdmin}
                              onChange={() => {
                                if (!isSuperAdmin) {
                                  handleToggleAssignMember(member.id);
                                }
                              }}
                              onClick={(e) => e.stopPropagation()}
                              title={isSuperAdmin ? "Acceso global permanente a todos los proyectos" : ""}
                              style={{ cursor: isSuperAdmin ? "not-allowed" : "pointer", width: "16px", height: "16px", accentColor: "var(--devio-blue)", opacity: isSuperAdmin ? 0.85 : 1 }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              <div style={{ display: "flex", justifyContent: "space-between", marginTop: "1.5rem" }}>
                <button type="button" onClick={() => goToStep(4)} className="btn btn-outline">
                  <ArrowLeft size={16} /> Anterior
                </button>
                <button type="button" onClick={() => goToStep(6)} className="btn btn-primary">
                  Continuar a Documentos <ArrowRight size={16} />
                </button>
              </div>

              {/* MODAL: AGREGAR COLABORADOR */}
              {showAddMemberModal && (
                <div
                  style={{
                    position: "fixed",
                    inset: 0,
                    backgroundColor: "rgba(15, 23, 42, 0.6)",
                    backdropFilter: "blur(4px)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    zIndex: 9999,
                    padding: "1rem",
                  }}
                  onClick={() => setShowAddMemberModal(false)}
                >
                  <div
                    style={{
                      backgroundColor: "var(--devio-white)",
                      borderRadius: "0.85rem",
                      width: "100%",
                      maxWidth: "460px",
                      padding: "1.5rem",
                      boxShadow: "0 20px 40px rgba(0,0,0,0.2)",
                    }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
                      <h3 style={{ fontSize: "1.1rem", fontWeight: 800, color: "var(--devio-blue-dark)", margin: 0 }}>
                        Agregar Nuevo Colaborador
                      </h3>
                      <button
                        type="button"
                        onClick={() => setShowAddMemberModal(false)}
                        style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer" }}
                      >
                        <X size={18} />
                      </button>
                    </div>

                    <form onSubmit={handleAddNewTeamMember} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                      <div>
                        <label style={{ fontSize: "0.78rem", fontWeight: 700, color: "var(--devio-blue-dark)", display: "block", marginBottom: "0.3rem" }}>
                          Nombre Completo *
                        </label>
                        <input
                          type="text"
                          required
                          value={newMemberName}
                          onChange={(e) => setNewMemberName(e.target.value)}
                          placeholder="Ej. Carlos Mendoza"
                          className="form-input"
                          style={{ width: "100%", padding: "0.6rem 0.8rem", fontSize: "0.85rem" }}
                        />
                      </div>

                      <div>
                        <label style={{ fontSize: "0.78rem", fontWeight: 700, color: "var(--devio-blue-dark)", display: "block", marginBottom: "0.3rem" }}>
                          Correo Electrónico *
                        </label>
                        <input
                          type="email"
                          required
                          value={newMemberEmail}
                          onChange={(e) => setNewMemberEmail(e.target.value)}
                          placeholder="carlos@empresa.com"
                          className="form-input"
                          style={{ width: "100%", padding: "0.6rem 0.8rem", fontSize: "0.85rem" }}
                        />
                      </div>

                      <div>
                        <label style={{ fontSize: "0.78rem", fontWeight: 700, color: "var(--devio-blue-dark)", display: "block", marginBottom: "0.3rem" }}>
                          Rol del Colaborador
                        </label>
                        <select
                          value={newMemberRole}
                          onChange={(e) => setNewMemberRole(e.target.value as UserRole)}
                          className="form-input"
                          style={{ width: "100%", padding: "0.6rem 0.8rem", fontSize: "0.85rem" }}
                        >
                          <option value="Super Admin">Super Admin</option>
                          <option value="Director Comercial">Director Comercial</option>
                          <option value="Asesor de Ventas">Asesor de Ventas</option>
                          <option value="Finanzas / Cobranza">Finanzas / Cobranza</option>
                          <option value="Residente de Obra">Residente de Obra</option>
                          <option value="Coordinador de Postventa">Coordinador de Postventa</option>
                          <option value="Legal / Notaría">Legal / Notaría</option>
                        </select>
                      </div>

                      <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.5rem", marginTop: "0.75rem" }}>
                        <button
                          type="button"
                          onClick={() => setShowAddMemberModal(false)}
                          className="btn btn-outline"
                          style={{ fontSize: "0.8125rem", padding: "0.5rem 1rem" }}
                        >
                          Cancelar
                        </button>
                        <button
                          type="submit"
                          className="btn btn-primary"
                          style={{ fontSize: "0.8125rem", padding: "0.5rem 1rem" }}
                        >
                          Guardar y Asignar
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ETAPA 6: DOCUMENTOS */}
          {step === 6 && (
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.5rem" }}>
                <div>
                  <h2 style={{ fontSize: "1.25rem", color: "var(--devio-blue-dark)" }}>6. Documentos del Proyecto</h2>
                  <p style={{ fontSize: "0.8125rem", color: "var(--text-muted)", marginTop: "0.25rem" }}>
                    Agrega contratos, planos, fichas técnicas u otros archivos importantes para el proyecto.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleOpenDocModal()}
                  className="btn btn-primary"
                  style={{ fontSize: "0.8125rem", padding: "0.5rem 1rem" }}
                >
                  <Plus size={16} /> Agregar Documento
                </button>
              </div>

              {/* Sugerencias de Documentos con 1 Click */}
              <div style={{ marginBottom: "1.5rem" }}>
                <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--devio-neutral-3)", display: "block", marginBottom: "0.5rem" }}>
                  SUGERIDOS CON 1 CLICK:
                </span>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
                  {[
                    "Contrato Promesa de Compraventa",
                    "Planos Arquitectónicos",
                    "Ficha Técnica Comercial",
                    "Régimen de Condominio",
                    "Licencia de Construcción",
                  ].map((sug, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => handleAddSuggestedDoc(sug)}
                      className="btn btn-outline"
                      style={{ fontSize: "0.75rem", padding: "0.35rem 0.75rem" }}
                    >
                      <Plus size={12} /> {sug}
                    </button>
                  ))}
                </div>
              </div>

              {/* Lista de Documentos Cargados */}
              {documents.length > 0 ? (
                <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", marginBottom: "1.5rem" }}>
                  {documents.map((doc) => (
                    <div
                      key={doc.id}
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
                      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                        <FileText size={24} color="var(--devio-blue)" />
                        <div>
                          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                            <h4 style={{ fontSize: "0.95rem", color: "var(--devio-blue-dark)", margin: 0 }}>
                              {doc.title}
                            </h4>
                            {doc.category && <span className="badge badge-info" style={{ fontSize: "0.65rem", padding: "0.1rem 0.5rem" }}>{doc.category}</span>}
                          </div>
                          <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", margin: "0.2rem 0 0" }}>
                            {doc.fileName} • {doc.fileSize} {doc.internalNotes && `• Nota: ${doc.internalNotes}`}
                          </p>
                        </div>
                      </div>

                      <div style={{ display: "flex", gap: "0.5rem" }}>
                        <button
                          type="button"
                          onClick={() => handleOpenDocModal(doc)}
                          className="btn btn-outline"
                          style={{ fontSize: "0.75rem", padding: "0.35rem 0.7rem" }}
                        >
                          <Edit2 size={13} /> Editar
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteDocument(doc.id)}
                          className="btn btn-outline"
                          style={{ fontSize: "0.75rem", padding: "0.35rem 0.7rem", color: "var(--devio-red)", borderColor: "rgba(240, 61, 48, 0.4)" }}
                        >
                          <Trash2 size={13} /> Borrar
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div
                  style={{
                    padding: "2.5rem 1.5rem",
                    textAlign: "center",
                    backgroundColor: "var(--bg-page)",
                    border: "1px dashed var(--border-subtle)",
                    borderRadius: "0.75rem",
                    marginBottom: "1.5rem",
                  }}
                >
                  <FileText size={32} color="var(--devio-neutral-3)" style={{ margin: "0 auto 0.5rem" }} />
                  <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", margin: 0 }}>
                    Aún no has agregado documentos para este proyecto. Puedes agregar machotes o planos con los botones superiores o continuar.
                  </p>
                </div>
              )}

              <div style={{ display: "flex", justifyContent: "space-between", marginTop: "1.5rem" }}>
                <button type="button" onClick={() => goToStep(5)} className="btn btn-outline">
                  <ArrowLeft size={16} /> Anterior
                </button>
                <button type="submit" disabled={isSubmitting} className="btn btn-primary">
                  {isSubmitting ? "Publicando Proyecto..." : "Finalizar y Guardar Proyecto"} <CheckCircle2 size={16} />
                </button>
              </div>
            </div>
          )}
        </form>
      </div>

      {/* MODAL: PLANES DE PAGO */}
      {isPaymentPlanModalOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(22, 43, 63, 0.65)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: "1rem",
          }}
        >
          <div
            className="modal-content"
            style={{
              backgroundColor: "var(--devio-white)",
              borderRadius: "1rem",
              width: "100%",
              maxWidth: "680px",
              padding: "2rem",
              boxShadow: "0 20px 60px rgba(0, 0, 0, 0.25)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1rem" }}>
              <div>
                <h2 style={{ fontSize: "1.5rem", color: "var(--devio-blue-dark)" }}>
                  {editingPlanId ? "Editar Plan de Pago" : "Nuevo Plan de Pago"}
                </h2>
                <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginTop: "0.25rem" }}>
                  Define los porcentajes de enganche, mensualidades y condiciones de liquidación.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsPaymentPlanModalOpen(false)}
                style={{ background: "none", border: "none", cursor: "pointer", color: "var(--devio-neutral-3)" }}
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSavePaymentPlan}>
              <div className="form-group" style={{ marginBottom: "1.25rem" }}>
                <label className="form-label">Nombre del Plan *</label>
                <input
                  type="text"
                  value={modalPlanData.name}
                  onChange={(e) => setModalPlanData({ ...modalPlanData, name: e.target.value })}
                  placeholder="Ej. Plan Tradicional 20/80"
                  className="form-input"
                  required
                />
              </div>

              {/* ¿Cómo se pagará este plan? */}
              <div style={{ marginBottom: "1.25rem" }}>
                <label className="form-label" style={{ marginBottom: "0.5rem", display: "block", textAlign: "center", fontSize: "0.95rem" }}>
                  ¿Cómo se pagará este plan?
                </label>
                <div className="grid-cols-2">
                  <div
                    onClick={() => setModalPlanData({ ...modalPlanData, paymentType: "ESQUEMA" })}
                    className={`radio-card ${modalPlanData.paymentType === "ESQUEMA" ? "active" : ""}`}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.3rem" }}>
                      <input type="radio" checked={modalPlanData.paymentType === "ESQUEMA"} readOnly className="custom-checkbox" />
                      <strong style={{ fontSize: "0.875rem" }}>Esquema de pago</strong>
                    </div>
                    <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", margin: 0 }}>
                      El cliente pagará mediante enganche, parcialidades y liquidación final.
                    </p>
                  </div>

                  <div
                    onClick={() => setModalPlanData({ ...modalPlanData, paymentType: "CONTADO" })}
                    className={`radio-card ${modalPlanData.paymentType === "CONTADO" ? "active" : ""}`}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.3rem" }}>
                      <input type="radio" checked={modalPlanData.paymentType === "CONTADO"} readOnly className="custom-checkbox" />
                      <strong style={{ fontSize: "0.875rem" }}>Pago de contado</strong>
                    </div>
                    <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", margin: 0 }}>
                      El cliente liquidará el total en una sola exhibición.
                    </p>
                  </div>
                </div>
              </div>

              {/* CAMPOS CONDICIONALES: Esquema de Pago */}
              {modalPlanData.paymentType === "ESQUEMA" && (
                <>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "0.75rem", marginBottom: "1rem" }}>
                    <div className="form-group">
                      <label className="form-label">Enganche *</label>
                      <div style={{ position: "relative" }}>
                        <input
                          type="number"
                          value={modalPlanData.downPaymentPercentage}
                          onChange={(e) => setModalPlanData({ ...modalPlanData, downPaymentPercentage: parseFloat(e.target.value) || 0 })}
                          className="form-input"
                          style={{ paddingRight: "1.5rem" }}
                          required
                        />
                        <span style={{ position: "absolute", right: "8px", top: "8px", fontSize: "0.75rem", color: "var(--text-muted)" }}>%</span>
                      </div>
                    </div>

                    <div className="form-group">
                      <label className="form-label">Plazos</label>
                      <input
                        type="number"
                        value={modalPlanData.installmentsCount}
                        onChange={(e) => setModalPlanData({ ...modalPlanData, installmentsCount: parseInt(e.target.value) || 0 })}
                        className="form-input"
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Periodicidad</label>
                      <select
                        value={modalPlanData.periodicity}
                        onChange={(e) => setModalPlanData({ ...modalPlanData, periodicity: e.target.value })}
                        className="form-select"
                      >
                        <option value="Semanal">Semanal</option>
                        <option value="Quincenal">Quincenal</option>
                        <option value="Mensual">Mensual</option>
                        <option value="Bimestral">Bimestral</option>
                        <option value="Trimestral">Trimestral</option>
                        <option value="Semestral">Semestral</option>
                        <option value="Anual">Anual</option>
                      </select>
                    </div>

                    <div className="form-group">
                      <label className="form-label">Liquidación *</label>
                      <div style={{ position: "relative" }}>
                        <input
                          type="number"
                          value={modalPlanData.settlementPercentage}
                          onChange={(e) => setModalPlanData({ ...modalPlanData, settlementPercentage: parseFloat(e.target.value) || 0 })}
                          className="form-input"
                          style={{ paddingRight: "1.5rem" }}
                          required
                        />
                        <span style={{ position: "absolute", right: "8px", top: "8px", fontSize: "0.75rem", color: "var(--text-muted)" }}>%</span>
                      </div>
                    </div>
                  </div>

                  {/* Barra Visual de Distribución Financiera 100% */}
                  <div style={{ backgroundColor: "var(--bg-page)", padding: "0.85rem 1rem", borderRadius: "0.65rem", border: isPlanSumValid ? "1px solid var(--devio-neutral-1)" : "1px solid #FCA5A5", marginBottom: "1rem" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.78rem", marginBottom: "0.4rem" }}>
                      <span style={{ fontWeight: 600, color: "var(--devio-neutral-4)" }}>
                        Distribución: Enganche ({modalPlanData.downPaymentPercentage}%) + {modalPlanData.installmentsCount > 0 ? `${modalPlanData.installmentsCount} Mensualidades (${installmentsTotalPercentage}%)` : "Sin mensualidades"} + Liquidación ({modalPlanData.settlementPercentage}%)
                      </span>
                      <strong style={{ color: isPlanSumValid ? "var(--devio-green)" : "var(--devio-red)", display: "flex", alignItems: "center", gap: "0.3rem" }}>
                        {isPlanSumValid ? "✓ Total: 100%" : `⚠ Total: ${modalPlanData.downPaymentPercentage + installmentsTotalPercentage + modalPlanData.settlementPercentage}%`}
                      </strong>
                    </div>
                    <div style={{ height: "8px", backgroundColor: "var(--devio-neutral-1)", borderRadius: "4px", display: "flex", overflow: "hidden" }}>
                      <div style={{ width: `${Math.max(0, Math.min(100, modalPlanData.downPaymentPercentage))}%`, backgroundColor: "#2F80ED" }} title={`Enganche: ${modalPlanData.downPaymentPercentage}%`} />
                      <div style={{ width: `${Math.max(0, Math.min(100, installmentsTotalPercentage))}%`, backgroundColor: "#F2C94C" }} title={`Parcialidades: ${installmentsTotalPercentage}%`} />
                      <div style={{ width: `${Math.max(0, Math.min(100, modalPlanData.settlementPercentage))}%`, backgroundColor: "#00C48C" }} title={`Liquidación: ${modalPlanData.settlementPercentage}%`} />
                    </div>
                    {isPlanSumValid && modalPlanData.installmentsCount > 0 && installmentsTotalPercentage > 0 && (
                      <p style={{ margin: "0.35rem 0 0", fontSize: "0.72rem", color: "var(--text-muted)" }}>
                        Cada mensualidad será del {(installmentsTotalPercentage / modalPlanData.installmentsCount).toFixed(2)}% del valor del inmueble.
                      </p>
                    )}
                  </div>

                  {/* ALERTA DE ERROR Y SUGERENCIAS DE CORRECCIÓN RÁPIDA (1-CLIC) */}
                  {!planValidation.isValid && planValidation.errorMessage && (
                    <div
                      style={{
                        backgroundColor: "#FEF2F2",
                        border: "1px solid #F87171",
                        borderRadius: "0.65rem",
                        padding: "0.85rem 1rem",
                        marginBottom: "1.2rem",
                        animation: "fadeIn 0.2s ease-in-out",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "flex-start", gap: "0.6rem" }}>
                        <AlertCircle size={18} color="#DC2626" style={{ flexShrink: 0, marginTop: "2px" }} />
                        <div style={{ flex: 1 }}>
                          <h5 style={{ margin: "0 0 0.2rem", fontSize: "0.84rem", fontWeight: 700, color: "#991B1B" }}>
                            {planValidation.errorTitle}
                          </h5>
                          <p style={{ margin: 0, fontSize: "0.78rem", color: "#B91C1C", lineHeight: 1.4 }}>
                            {planValidation.errorMessage}
                          </p>

                          {planValidation.fixes.length > 0 && (
                            <div style={{ marginTop: "0.6rem" }}>
                              <span style={{ fontSize: "0.73rem", fontWeight: 700, color: "#7F1D1D", display: "block", marginBottom: "0.35rem" }}>
                                💡 Sugerencias de corrección rápida (1-clic):
                              </span>
                              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem" }}>
                                {planValidation.fixes.map((fix, idx) => (
                                  <button
                                    key={idx}
                                    type="button"
                                    onClick={fix.action}
                                    style={{
                                      display: "inline-flex",
                                      alignItems: "center",
                                      gap: "0.35rem",
                                      backgroundColor: "#FFFFFF",
                                      border: "1px solid #FCA5A5",
                                      color: "#991B1B",
                                      borderRadius: "6px",
                                      padding: "0.35rem 0.65rem",
                                      fontSize: "0.74rem",
                                      fontWeight: 600,
                                      cursor: "pointer",
                                      boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
                                      transition: "all 0.15s ease",
                                    }}
                                    onMouseEnter={(e) => {
                                      e.currentTarget.style.backgroundColor = "#FEE2E2";
                                    }}
                                    onMouseLeave={(e) => {
                                      e.currentTarget.style.backgroundColor = "#FFFFFF";
                                    }}
                                  >
                                    <Sparkles size={13} color="#DC2626" />
                                    {fix.label}
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="grid-cols-2" style={{ marginBottom: "1rem" }}>
                    <div className="form-group">
                      <label className="form-label">Interés</label>
                      <div style={{ position: "relative" }}>
                        <input
                          type="number"
                          value={modalPlanData.interestPercentage}
                          onChange={(e) => setModalPlanData({ ...modalPlanData, interestPercentage: parseFloat(e.target.value) || 0 })}
                          className="form-input"
                          style={{ paddingRight: "1.5rem" }}
                        />
                        <span style={{ position: "absolute", right: "8px", top: "8px", fontSize: "0.75rem", color: "var(--text-muted)" }}>%</span>
                      </div>
                    </div>

                    <div className="form-group">
                      <label className="form-label">Descuento</label>
                      <div style={{ position: "relative" }}>
                        <input
                          type="number"
                          value={modalPlanData.discountPercentage}
                          onChange={(e) => setModalPlanData({ ...modalPlanData, discountPercentage: parseFloat(e.target.value) || 0 })}
                          className="form-input"
                          style={{ paddingRight: "1.5rem" }}
                        />
                        <span style={{ position: "absolute", right: "8px", top: "8px", fontSize: "0.75rem", color: "var(--text-muted)" }}>%</span>
                      </div>
                    </div>
                  </div>
                </>
              )}

              {/* CAMPOS SI ES PAGO DE CONTADO */}
              {modalPlanData.paymentType === "CONTADO" && (
                <div className="form-group" style={{ marginBottom: "1rem" }}>
                  <label className="form-label">Descuento por Pago de Contado (%)</label>
                  <div style={{ position: "relative" }}>
                    <input
                      type="number"
                      value={modalPlanData.discountPercentage}
                      onChange={(e) => setModalPlanData({ ...modalPlanData, discountPercentage: parseFloat(e.target.value) || 0 })}
                      placeholder="Ej. 10"
                      className="form-input"
                      style={{ paddingRight: "1.5rem" }}
                    />
                    <span style={{ position: "absolute", right: "8px", top: "8px", fontSize: "0.75rem", color: "var(--text-muted)" }}>%</span>
                  </div>
                  <span className="form-hint">El comprador liquida el 100% en una sola exhibición con este descuento.</span>
                </div>
              )}

              <div className="form-group" style={{ marginBottom: "1.5rem" }}>
                <label className="form-label">Notas Internas</label>
                <textarea
                  value={modalPlanData.internalNotes}
                  onChange={(e) => setModalPlanData({ ...modalPlanData, internalNotes: e.target.value })}
                  placeholder="Detalles sobre restricciones o aplicación de este plan..."
                  className="form-textarea"
                  rows={2}
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem" }}>
                <button
                  type="button"
                  onClick={() => setIsPaymentPlanModalOpen(false)}
                  className="btn btn-outline"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={!planValidation.isValid}
                  style={{
                    opacity: planValidation.isValid ? 1 : 0.45,
                    cursor: planValidation.isValid ? "pointer" : "not-allowed",
                  }}
                  title={!planValidation.isValid ? (planValidation.errorMessage || "Completa la configuración correctamente") : ""}
                >
                  <Save size={16} /> Guardar en Biblioteca
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: DOCUMENTO CON UPLOADER REAL FUNCIONAL */}
      {isDocModalOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(22, 43, 63, 0.65)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: "1rem",
          }}
        >
          <div
            className="modal-content"
            style={{
              backgroundColor: "var(--devio-white)",
              borderRadius: "1rem",
              width: "100%",
              maxWidth: "580px",
              padding: "2rem",
              boxShadow: "0 20px 60px rgba(0, 0, 0, 0.25)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1rem" }}>
              <div>
                <h2 style={{ fontSize: "1.5rem", color: "var(--devio-blue-dark)" }}>Documento</h2>
                <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginTop: "0.25rem" }}>
                  Sube y clasifica contratos, planos, fichas técnicas u otros archivos.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsDocModalOpen(false)}
                style={{ background: "none", border: "none", cursor: "pointer", color: "var(--devio-neutral-3)" }}
              >
                <X size={24} />
              </button>
            </div>

            {/* Hidden Input for Doc File */}
            <input
              type="file"
              ref={modalDocFileInputRef}
              onChange={handleDocFileSelect}
              accept=".pdf,.dwg,.docx,.doc,.jpg,.png,.xlsx"
              style={{ display: "none" }}
            />

            <form onSubmit={handleSaveDocument}>
              <div className="grid-cols-2" style={{ marginBottom: "1rem" }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Nombre del documento *</label>
                  <input
                    type="text"
                    value={modalDocData.title}
                    onChange={(e) => setModalDocData({ ...modalDocData, title: e.target.value })}
                    placeholder="Ej. Contrato Promesa Tipo A"
                    className="form-input"
                    required
                  />
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Categoría</label>
                  <select
                    value={modalDocData.category || "Legal"}
                    onChange={(e) => setModalDocData({ ...modalDocData, category: e.target.value })}
                    className="form-select"
                  >
                    <option value="Legal">Legal y Contratos</option>
                    <option value="Técnico">Planos y Técnico</option>
                    <option value="Comercial">Comercial y Fichas</option>
                    <option value="Financiero">Financiero y Fiscal</option>
                  </select>
                </div>
              </div>

              {/* Uploader Box Conectado a Input */}
              <div className="form-group" style={{ marginBottom: "1rem" }}>
                <label className="form-label">Archivo Adjunto *</label>
                {modalDocData.fileName ? (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "0.85rem 1rem",
                      border: "1px solid var(--devio-green)",
                      borderRadius: "0.5rem",
                      backgroundColor: "rgba(111, 172, 156, 0.08)",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                      <FileText size={22} color="var(--devio-green)" />
                      <div>
                        <p style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--devio-blue-dark)", margin: 0 }}>
                          {modalDocData.fileName}
                        </p>
                        <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                          {modalDocData.fileSize || "Archivo listo"}
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => modalDocFileInputRef.current?.click()}
                      className="btn btn-outline"
                      style={{ fontSize: "0.75rem", padding: "0.3rem 0.6rem" }}
                    >
                      Cambiar Archivo
                    </button>
                  </div>
                ) : (
                  <div
                    onClick={() => modalDocFileInputRef.current?.click()}
                    style={{
                      border: "2px dashed var(--devio-neutral-2)",
                      borderRadius: "0.5rem",
                      padding: "1.5rem",
                      textAlign: "center",
                      backgroundColor: "var(--bg-page)",
                      cursor: "pointer",
                      transition: "all 0.2s ease",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.borderColor = "var(--devio-blue)")}
                    onMouseLeave={(e) => (e.currentTarget.style.borderColor = "var(--devio-neutral-2)")}
                  >
                    <Upload size={24} color="var(--devio-blue-matte)" style={{ margin: "0 auto 0.4rem" }} />
                    <p style={{ fontSize: "0.875rem", color: "var(--devio-neutral-4)", fontWeight: 600, margin: 0 }}>
                      Click para seleccionar archivo desde tu equipo
                    </p>
                    <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>PDF, DWG, DOCX, JPG o PNG (hasta 25MB)</span>
                  </div>
                )}
              </div>

              <div className="form-group" style={{ marginBottom: "1.5rem" }}>
                <label className="form-label">Notas Internas</label>
                <textarea
                  value={modalDocData.internalNotes}
                  onChange={(e) => setModalDocData({ ...modalDocData, internalNotes: e.target.value })}
                  placeholder="Detalles sobre uso, vigencia o firmas..."
                  className="form-textarea"
                  rows={2}
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem" }}>
                <button
                  type="button"
                  onClick={() => setIsDocModalOpen(false)}
                  className="btn btn-outline"
                >
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary">
                  <Save size={16} /> Guardar Documento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: MAPEDOR INTELIGENTE DE COLUMNAS DE EXCEL */}
      {isColumnMapperModalOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(22, 43, 63, 0.75)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1100,
            padding: "1.5rem",
          }}
        >
          <div
            className="modal-content"
            style={{
              backgroundColor: "var(--devio-white)",
              borderRadius: "1.25rem",
              width: "100%",
              maxWidth: "850px",
              maxHeight: "90vh",
              overflowY: "auto",
              padding: "2rem",
              boxShadow: "0 25px 70px rgba(0, 0, 0, 0.3)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.25rem", borderBottom: "1px solid var(--devio-border)", paddingBottom: "1rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                <div style={{ width: "44px", height: "44px", borderRadius: "0.75rem", backgroundColor: "rgba(31, 54, 82, 0.08)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--devio-blue-dark)" }}>
                  <FileSpreadsheet size={24} />
                </div>
                <div>
                  <h2 style={{ fontSize: "1.25rem", fontWeight: 700, color: "var(--devio-blue-dark)" }}>
                    Mapeador Inteligente de Columnas
                  </h2>
                  <p style={{ fontSize: "0.875rem", color: "var(--devio-neutral-3)" }}>
                    Se detectaron {unmappedColumnsFound.length} columna(s) en tu archivo Excel que no están registradas. Elige cómo deseas procesarlas:
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsColumnMapperModalOpen(false);
                  setPendingParsedUnits([]);
                  setUnmappedColumnsFound([]);
                }}
                style={{ background: "none", border: "none", cursor: "pointer", color: "var(--devio-neutral-3)" }}
              >
                <X size={22} />
              </button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "1rem", marginBottom: "1.5rem" }}>
              {unmappedColumnsFound.map((col) => {
                const decision = columnDecisions[col.headerName] || {
                  headerName: col.headerName,
                  action: "create",
                  targetColId: "",
                  newColTitle: col.headerName,
                  newColType: col.inferredType,
                };

                return (
                  <div
                    key={col.headerName}
                    style={{
                      padding: "1.25rem",
                      borderRadius: "0.75rem",
                      border: "1px solid var(--devio-border)",
                      backgroundColor: decision.action === "ignore" ? "var(--devio-gray-light)" : "var(--devio-white)",
                      transition: "all 0.2s ease",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                        <span style={{ fontWeight: 600, fontSize: "0.95rem", color: "var(--devio-blue-dark)" }}>
                          Columna en Excel:
                        </span>
                        <span
                          style={{
                            padding: "0.25rem 0.6rem",
                            borderRadius: "0.375rem",
                            backgroundColor: "rgba(31, 54, 82, 0.1)",
                            color: "var(--devio-blue-dark)",
                            fontFamily: "monospace",
                            fontWeight: 600,
                            fontSize: "0.85rem",
                          }}
                        >
                          {col.headerName}
                        </span>
                      </div>
                      {col.sampleValues.length > 0 && (
                        <span style={{ fontSize: "0.8rem", color: "var(--devio-neutral-3)" }}>
                          Ejemplos detectados: <i>{col.sampleValues.slice(0, 2).join(", ")}</i>
                        </span>
                      )}
                    </div>

                    <div className="grid-cols-3" style={{ gap: "0.75rem", marginBottom: "0.75rem" }}>
                      <button
                        type="button"
                        onClick={() =>
                          setColumnDecisions((prev) => ({
                            ...prev,
                            [col.headerName]: { ...decision, action: "create" },
                          }))
                        }
                        style={{
                          padding: "0.6rem 0.75rem",
                          borderRadius: "0.5rem",
                          border: `1.5px solid ${decision.action === "create" ? "var(--devio-blue)" : "var(--devio-border)"}`,
                          backgroundColor: decision.action === "create" ? "rgba(42, 74, 110, 0.08)" : "var(--devio-white)",
                          color: decision.action === "create" ? "var(--devio-blue-dark)" : "var(--devio-neutral-3)",
                          fontWeight: decision.action === "create" ? 600 : 500,
                          fontSize: "0.85rem",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: "0.4rem",
                        }}
                      >
                        <Plus size={16} /> Crear como Personalizada
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          setColumnDecisions((prev) => ({
                            ...prev,
                            [col.headerName]: { ...decision, action: "map" },
                          }))
                        }
                        style={{
                          padding: "0.6rem 0.75rem",
                          borderRadius: "0.5rem",
                          border: `1.5px solid ${decision.action === "map" ? "var(--devio-blue)" : "var(--devio-border)"}`,
                          backgroundColor: decision.action === "map" ? "rgba(42, 74, 110, 0.08)" : "var(--devio-white)",
                          color: decision.action === "map" ? "var(--devio-blue-dark)" : "var(--devio-neutral-3)",
                          fontWeight: decision.action === "map" ? 600 : 500,
                          fontSize: "0.85rem",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: "0.4rem",
                        }}
                      >
                        <Columns size={16} /> Mapear a Existente
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          setColumnDecisions((prev) => ({
                            ...prev,
                            [col.headerName]: { ...decision, action: "ignore" },
                          }))
                        }
                        style={{
                          padding: "0.6rem 0.75rem",
                          borderRadius: "0.5rem",
                          border: `1.5px solid ${decision.action === "ignore" ? "var(--devio-neutral-3)" : "var(--devio-border)"}`,
                          backgroundColor: decision.action === "ignore" ? "rgba(100, 116, 139, 0.12)" : "var(--devio-white)",
                          color: decision.action === "ignore" ? "var(--devio-dark)" : "var(--devio-neutral-3)",
                          fontWeight: decision.action === "ignore" ? 600 : 500,
                          fontSize: "0.85rem",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: "0.4rem",
                        }}
                      >
                        <X size={16} /> Ignorar Columna
                      </button>
                    </div>

                    {decision.action === "create" && (
                      <div className="grid-cols-2" style={{ gap: "0.75rem", backgroundColor: "rgba(31, 54, 82, 0.03)", padding: "0.75rem", borderRadius: "0.5rem" }}>
                        <div>
                          <label style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--devio-neutral-3)", display: "block", marginBottom: "0.25rem" }}>
                            Nombre de la Columna
                          </label>
                          <input
                            type="text"
                            value={decision.newColTitle}
                            onChange={(e) =>
                              setColumnDecisions((prev) => ({
                                ...prev,
                                [col.headerName]: { ...decision, newColTitle: e.target.value },
                              }))
                            }
                            className="form-input"
                            style={{ height: "36px", fontSize: "0.85rem" }}
                            placeholder="Nombre visible en tabla"
                          />
                        </div>
                        <div>
                          <label style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--devio-neutral-3)", display: "block", marginBottom: "0.25rem" }}>
                            Tipo de Dato
                          </label>
                          <select
                            value={decision.newColType}
                            onChange={(e) =>
                              setColumnDecisions((prev) => ({
                                ...prev,
                                [col.headerName]: { ...decision, newColType: e.target.value as any },
                              }))
                            }
                            className="form-select"
                            style={{ height: "36px", fontSize: "0.85rem" }}
                          >
                            <option value="text">Texto</option>
                            <option value="number">Número</option>
                            <option value="boolean">Sí / No (Booleano)</option>
                          </select>
                        </div>
                      </div>
                    )}

                    {decision.action === "map" && (
                      <div style={{ backgroundColor: "rgba(31, 54, 82, 0.03)", padding: "0.75rem", borderRadius: "0.5rem" }}>
                        <label style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--devio-neutral-3)", display: "block", marginBottom: "0.25rem" }}>
                          Selecciona la Columna de Devio a la que corresponde
                        </label>
                        <select
                          value={decision.targetColId}
                          onChange={(e) =>
                            setColumnDecisions((prev) => ({
                              ...prev,
                              [col.headerName]: { ...decision, targetColId: e.target.value },
                            }))
                          }
                          className="form-select"
                          style={{ height: "36px", fontSize: "0.85rem" }}
                        >
                          <option value="">-- Seleccionar campo --</option>
                          <optgroup label="Columnas Estándar y Tipología">
                            {availableColumnPresets.map((preset) => (
                              <option key={preset.id} value={preset.id}>
                                {preset.title}
                              </option>
                            ))}
                          </optgroup>
                          {activeColumns.length > 0 && (
                            <optgroup label="Columnas Personalizadas Actuales">
                              {activeColumns.map((c) => (
                                <option key={c.id} value={c.id}>
                                  {c.title}
                                </option>
                              ))}
                            </optgroup>
                          )}
                        </select>
                      </div>
                    )}

                    {decision.action === "ignore" && (
                      <div style={{ fontSize: "0.8rem", color: "var(--devio-neutral-3)", padding: "0.4rem 0.2rem" }}>
                        Los datos de esta columna no se guardarán en las unidades.
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid var(--devio-border)", paddingTop: "1rem" }}>
              <button
                type="button"
                onClick={() => {
                  setIsColumnMapperModalOpen(false);
                  setPendingParsedUnits([]);
                  setUnmappedColumnsFound([]);
                }}
                className="btn btn-outline"
              >
                Cancelar Carga
              </button>

              <button
                type="button"
                onClick={handleConfirmColumnMapping}
                className="btn btn-primary"
                style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}
              >
                <Check size={18} /> Confirmar e Importar {pendingParsedUnits.length} Unidades
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: COLUMNA PERSONALIZADA */}
      {isCustomColModalOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(22, 43, 63, 0.65)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: "1rem",
          }}
        >
          <div
            className="modal-content"
            style={{
              backgroundColor: "var(--devio-white)",
              borderRadius: "1rem",
              width: "100%",
              maxWidth: "500px",
              padding: "2rem",
              boxShadow: "0 20px 60px rgba(0, 0, 0, 0.25)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
              <h2 style={{ fontSize: "1.25rem", color: "var(--devio-blue-dark)" }}>Nueva Columna Personalizada</h2>
              <button
                type="button"
                onClick={() => setIsCustomColModalOpen(false)}
                style={{ background: "none", border: "none", cursor: "pointer", color: "var(--devio-neutral-3)" }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleAddCustomColumn}>
              <div className="form-group" style={{ marginBottom: "1rem" }}>
                <label className="form-label">Título de la Columna *</label>
                <input
                  type="text"
                  value={newColTitle}
                  onChange={(e) => setNewColTitle(e.target.value)}
                  placeholder="Ej. KVA Eléctricos / Altura / Acabado"
                  className="form-input"
                  required
                />
              </div>

              <div className="form-group" style={{ marginBottom: "1.5rem" }}>
                <label className="form-label">Tipo de Campo *</label>
                <select
                  value={newColType}
                  onChange={(e) => setNewColType(e.target.value as any)}
                  className="form-select"
                >
                  <option value="text">Texto</option>
                  <option value="number">Número</option>
                  <option value="boolean">Sí / No (Booleano)</option>
                  <option value="file">Archivo / Documento</option>
                  <option value="image">Imagen / Foto</option>
                </select>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.5rem" }}>
                <button
                  type="button"
                  onClick={() => setIsCustomColModalOpen(false)}
                  className="btn btn-outline"
                >
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary">
                  Agregar Columna
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL CONFIGURAR PLANTA DE CONJUNTO */}
      {isFloorPlanModalOpen && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(10, 25, 41, 0.75)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: "1rem",
          }}
        >
          <div
            className="modal-content"
            style={{
              backgroundColor: "var(--devio-white)",
              borderRadius: "1rem",
              width: "100%",
              maxWidth: "580px",
              maxHeight: "90vh",
              overflowY: "auto",
              padding: "1.75rem",
              boxShadow: "0 20px 60px rgba(0, 0, 0, 0.25)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <Layers size={20} color="var(--devio-blue)" />
                <h3 style={{ fontSize: "1.15rem", fontWeight: 700, color: "var(--devio-blue-dark)", margin: 0 }}>
                  {editingFloorPlanForm.id ? "Editar Planta de Conjunto" : "Nueva Planta de Conjunto"}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsFloorPlanModalOpen(false)}
                style={{ background: "none", border: "none", cursor: "pointer", color: "var(--devio-neutral-3)" }}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div>
                <label className="form-label" style={{ fontWeight: 700 }}>Nombre de la Planta *</label>
                <input
                  type="text"
                  value={editingFloorPlanForm.name}
                  onChange={(e) => setEditingFloorPlanForm({ ...editingFloorPlanForm, name: e.target.value })}
                  placeholder="Ej. Planta Tipo A (2 Recámaras)"
                  className="form-input"
                  required
                />
              </div>

              {/* IMAGEN DE PLANO */}
              <div>
                <label className="form-label" style={{ fontWeight: 700 }}>Plano Arquitectónico / Blueprint</label>
                <input
                  type="file"
                  ref={floorPlanImageInputRef}
                  accept="image/*,.pdf"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onload = (ev) => {
                        if (ev.target?.result) {
                          setEditingFloorPlanForm((prev) => ({
                            ...prev,
                            imageUrl: ev.target!.result as string,
                          }));
                        }
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                  style={{ display: "none" }}
                />

                {editingFloorPlanForm.imageUrl ? (
                  <div style={{ position: "relative", height: "130px", borderRadius: "0.6rem", overflow: "hidden", border: "1px solid var(--border-subtle)", backgroundColor: "#0F172A", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <img src={editingFloorPlanForm.imageUrl} alt="Plano" style={{ maxHeight: "100%", maxWidth: "100%", objectFit: "contain" }} />
                    <button
                      type="button"
                      onClick={() => floorPlanImageInputRef.current?.click()}
                      className="btn btn-secondary"
                      style={{ position: "absolute", bottom: "0.5rem", right: "0.5rem", fontSize: "0.7rem", padding: "0.25rem 0.5rem" }}
                    >
                      Cambiar Imagen
                    </button>
                  </div>
                ) : (
                  <div
                    onClick={() => floorPlanImageInputRef.current?.click()}
                    style={{
                      height: "90px",
                      borderRadius: "0.6rem",
                      border: "1.5px dashed var(--border-subtle)",
                      backgroundColor: "var(--bg-page)",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "0.25rem",
                      cursor: "pointer",
                      color: "var(--text-muted)",
                    }}
                  >
                    <Upload size={18} />
                    <span style={{ fontSize: "0.75rem", fontWeight: 600 }}>Subir archivo de plano arquitectónico</span>
                  </div>
                )}
              </div>

              {/* ASIGNAR UNIDADES */}
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.3rem" }}>
                  <label className="form-label" style={{ fontWeight: 700, margin: 0 }}>
                    Unidades Asignadas ({editingFloorPlanForm.assignedUnits.length})
                  </label>
                  <div style={{ display: "flex", gap: "0.3rem" }}>
                    <button
                      type="button"
                      onClick={() => setEditingFloorPlanForm({ ...editingFloorPlanForm, assignedUnits: units.map((u) => u.unitNumber) })}
                      style={{ fontSize: "0.7rem", color: "var(--devio-blue)", background: "none", border: "none", cursor: "pointer", fontWeight: 700 }}
                    >
                      Todas
                    </button>
                    <span style={{ color: "var(--border-subtle)" }}>•</span>
                    <button
                      type="button"
                      onClick={() => setEditingFloorPlanForm({ ...editingFloorPlanForm, assignedUnits: [] })}
                      style={{ fontSize: "0.7rem", color: "var(--text-muted)", background: "none", border: "none", cursor: "pointer" }}
                    >
                      Ninguna
                    </button>
                  </div>
                </div>

                <div
                  style={{
                    maxHeight: "120px",
                    overflowY: "auto",
                    backgroundColor: "var(--bg-page)",
                    borderRadius: "0.5rem",
                    border: "1px solid var(--border-subtle)",
                    padding: "0.45rem",
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fill, minmax(70px, 1fr))",
                    gap: "0.3rem",
                  }}
                >
                  {units.map((u) => {
                    const isSelected = editingFloorPlanForm.assignedUnits.includes(u.unitNumber);
                    return (
                      <div
                        key={u.id}
                        onClick={() => {
                          if (isSelected) {
                            setEditingFloorPlanForm({
                              ...editingFloorPlanForm,
                              assignedUnits: editingFloorPlanForm.assignedUnits.filter((n) => n !== u.unitNumber),
                            });
                          } else {
                            setEditingFloorPlanForm({
                              ...editingFloorPlanForm,
                              assignedUnits: [...editingFloorPlanForm.assignedUnits, u.unitNumber],
                            });
                          }
                        }}
                        style={{
                          padding: "0.25rem 0.4rem",
                          borderRadius: "0.3rem",
                          fontSize: "0.72rem",
                          fontWeight: 700,
                          textAlign: "center",
                          cursor: "pointer",
                          backgroundColor: isSelected ? "var(--devio-blue)" : "var(--devio-white)",
                          color: isSelected ? "#FFFFFF" : "var(--devio-blue-dark)",
                          border: isSelected ? "1px solid var(--devio-blue)" : "1px solid var(--border-subtle)",
                        }}
                      >
                        {u.unitNumber}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.5rem", marginTop: "0.5rem" }}>
                <button
                  type="button"
                  onClick={() => setIsFloorPlanModalOpen(false)}
                  className="btn btn-outline"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleSaveFloorPlan}
                  className="btn btn-primary"
                >
                  Guardar Planta
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
