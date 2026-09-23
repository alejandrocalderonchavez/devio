"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  X,
  Check,
  ChevronRight,
  ChevronLeft,
  Calendar,
  FileText,
  Download,
  Mail,
  Share2,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  Sparkles,
  RefreshCw,
  Building2,
  DollarSign,
  User,
  Phone,
  Hash,
  Layers,
  Printer,
  Copy,
  Plus,
  Trash2,
  Edit2,
  Sliders,
  Users,
  ExternalLink
} from "lucide-react";
import { DevioDatePicker } from "../ui/devio-date-picker";
import PhoneInput from "../ui/phone-input";
import CurrencyInput from "../ui/currency-input";
import { CoOwner, ProjectAdditional, QuoteRecord, UnitItem } from "../../data/projects-data";
import { useProject } from "../../context/project-context";
import { generateQuotePDF, openQuoteInNewTab, QuotePDFData } from "../../lib/pdf-generator";

export interface QuoteUnitWizardModalProps {
  isOpen: boolean;
  onClose: () => void;
  unit: UnitItem | null;
  projectId?: string;
  projectName?: string;
  currency?: "MXN" | "USD";
  initialAdditionals?: ProjectAdditional[];
  onQuoteGenerated?: (quoteData: any) => void;
}

interface PaymentRow {
  id: string;
  concept: string;
  date: string;
  amount: number;
}

interface AdditionalItem {
  id: string;
  name: string;
  price: number;
  category?: "bodega" | "estacionamiento" | "acabados" | "terraza" | "otro";
}

interface ClientData {
  name: string;
  email: string;
  phone: string;
  rfc: string;
  isExisting?: boolean;
}

export default function QuoteUnitWizardModal({
  isOpen,
  onClose,
  unit,
  projectId,
  projectName = "Proyecto",
  currency = "MXN",
  initialAdditionals = [],
  onQuoteGenerated,
}: QuoteUnitWizardModalProps) {
  const { paymentPlans = [], addQuote, projects = [], userName = "Asesor Comercial", userEmail = "ventas@devio.mx" } = useProject();

  const [currentStep, setCurrentStep] = useState<number>(1);
  const [isSending, setIsSending] = useState(false);
  const [isSentSuccess, setIsSentSuccess] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // --------------------------------------------------------------------------
  // CLIENTES REGISTRADOS (Búsqueda multi-proyecto como en Nueva Venta)
  // --------------------------------------------------------------------------
  const existingClients = useMemo(() => {
    const clientsMap: Record<string, ClientData> = {};

    projects.forEach((p) => {
      // 1. Desde ventas registradas
      (p.sales || []).forEach((s) => {
        if (s.clientName && s.clientName.trim()) {
          const key = (s.clientEmail || s.clientName).toLowerCase();
          clientsMap[key] = {
            name: s.clientName,
            email: s.clientEmail || "",
            phone: s.clientPhone || "",
            rfc: s.clientRfc || "",
            isExisting: true,
          };
        }
        (s.coOwners || []).forEach((co) => {
          if (co.name && co.name.trim()) {
            const coKey = (co.email || co.name).toLowerCase();
            clientsMap[coKey] = {
              name: co.name,
              email: co.email || "",
              phone: co.phone || "",
              rfc: co.rfc || "",
              isExisting: true,
            };
          }
        });
      });

      // 2. Desde cotizaciones
      (p.quotes || []).forEach((q) => {
        if (q.clientName && q.clientName.trim()) {
          const key = (q.clientEmail || q.clientName).toLowerCase();
          if (!clientsMap[key]) {
            clientsMap[key] = {
              name: q.clientName,
              email: q.clientEmail || "",
              phone: q.clientPhone || "",
              rfc: q.clientRfc || "",
              isExisting: true,
            };
          }
        }
      });

      // 3. Desde inventario de unidades
      (p.unitsInventory || []).forEach((u) => {
        if (u.client && u.client !== "-" && u.client !== "Sin asignar") {
          const key = u.client.toLowerCase();
          if (!clientsMap[key]) {
            clientsMap[key] = {
              name: u.client,
              email: (u as any).clientEmail || "",
              phone: (u as any).clientPhone || "",
              rfc: (u as any).clientRfc || "",
              isExisting: true,
            };
          }
        }
        (u.coOwners || []).forEach((co) => {
          if (co.name && co.name.trim()) {
            const coKey = (co.email || co.name).toLowerCase();
            clientsMap[coKey] = {
              name: co.name,
              email: co.email || "",
              phone: co.phone || "",
              rfc: co.rfc || "",
              isExisting: true,
            };
          }
        });
      });
    });

    return Object.values(clientsMap);
  }, [projects]);

  // --------------------------------------------------------------------------
  // STEP 1: CLIENTE Y COPROPIEDAD
  // --------------------------------------------------------------------------
  const [isCoOwnership, setIsCoOwnership] = useState<boolean>(false);

  const [primaryClient, setPrimaryClient] = useState<CoOwner>({
    id: "",
    name: "",
    email: "",
    phone: "",
    rfc: "",
    ownershipPct: 100,
    isPrimary: true,
    relationship: "Titular Principal",
  });
  const [isPrimaryFound, setIsPrimaryFound] = useState(false);
  const [coOwnersList, setCoOwnersList] = useState<CoOwner[]>([]);

  // Autocompletado del prospecto principal por email o nombre
  useEffect(() => {
    if (!primaryClient.email && !primaryClient.name) {
      setIsPrimaryFound(false);
      return;
    }
    const trimmedEmail = (primaryClient.email || "").trim().toLowerCase();
    const trimmedName = (primaryClient.name || "").trim().toLowerCase();
    const found = existingClients.find(
      (c) =>
        (trimmedEmail && c.email && c.email.toLowerCase() === trimmedEmail) ||
        (trimmedName && c.name && c.name.toLowerCase() === trimmedName)
    );
    if (found) {
      setIsPrimaryFound(true);
      setPrimaryClient((prev) => ({
        ...prev,
        name: prev.name || found.name,
        email: prev.email || found.email,
        phone: prev.phone || found.phone,
        rfc: prev.rfc || found.rfc,
      }));
    } else {
      setIsPrimaryFound(false);
    }
  }, [primaryClient.email, primaryClient.name, existingClients]);

  const handleToggleCoOwnership = (enabled: boolean) => {
    setIsCoOwnership(enabled);
    if (enabled) {
      if (coOwnersList.length === 0) {
        setPrimaryClient((prev) => ({ ...prev, ownershipPct: 50 }));
        setCoOwnersList([
          {
            id: `co-${Date.now()}`,
            name: "",
            email: "",
            phone: "",
            rfc: "",
            ownershipPct: 50,
            isPrimary: false,
            relationship: "Copropietario",
          },
        ]);
      }
    } else {
      setPrimaryClient((prev) => ({ ...prev, ownershipPct: 100 }));
      setCoOwnersList([]);
    }
  };

  const handleAddCoOwner = () => {
    const newId = `co-${Date.now()}`;
    const newCoOwner: CoOwner = {
      id: newId,
      name: "",
      email: "",
      phone: "",
      rfc: "",
      ownershipPct: 0,
      isPrimary: false,
      relationship: "Copropietario",
    };
    const updated = [...coOwnersList, newCoOwner];
    setCoOwnersList(updated);
    distributeEqually(primaryClient, updated);
  };

  const handleRemoveCoOwner = (id: string) => {
    const filtered = coOwnersList.filter((co) => co.id !== id);
    setCoOwnersList(filtered);
    if (filtered.length === 0) {
      setIsCoOwnership(false);
      setPrimaryClient((prev) => ({ ...prev, ownershipPct: 100 }));
    } else {
      distributeEqually(primaryClient, filtered);
    }
  };

  const handleUpdateCoOwner = (id: string, field: keyof CoOwner, val: any) => {
    setCoOwnersList((prev) =>
      prev.map((co) => {
        if (co.id !== id) return co;
        return { ...co, [field]: val };
      })
    );
  };

  const distributeEqually = (prim: CoOwner, coList: CoOwner[]) => {
    const totalPeople = 1 + coList.length;
    const basePct = Math.floor(100 / totalPeople);
    const remainder = 100 - basePct * totalPeople;

    setPrimaryClient((prev) => ({ ...prev, ownershipPct: basePct + remainder }));
    setCoOwnersList((prev) =>
      prev.map((co) => ({ ...co, ownershipPct: basePct }))
    );
  };

  const totalOwnershipPct = useMemo(() => {
    const primaryPct = Number(primaryClient.ownershipPct) || 0;
    const coOwnersPct = coOwnersList.reduce((acc, c) => acc + (Number(c.ownershipPct) || 0), 0);
    return Math.round((primaryPct + coOwnersPct) * 100) / 100;
  }, [primaryClient.ownershipPct, coOwnersList]);

  const isOwnershipBalanced = Math.abs(totalOwnershipPct - 100) < 0.01;

  const allOwnersCombined = useMemo(() => {
    return [primaryClient, ...coOwnersList];
  }, [primaryClient, coOwnersList]);

  // --------------------------------------------------------------------------
  // STEP 2: ADICIONALES
  // --------------------------------------------------------------------------
  const availableAdditionalsPool = useMemo<AdditionalItem[]>(() => {
    if (!initialAdditionals) return [];
    return initialAdditionals
      .filter((a) => a.status === "DISPONIBLE" || !a.status)
      .map((a) => ({
        id: a.id,
        name: a.name,
        price: a.price,
        category: a.category,
      }));
  }, [initialAdditionals]);

  const [selectedAdditionals, setSelectedAdditionals] = useState<AdditionalItem[]>([]);

  const totalAdditionalsAmount = useMemo(() => {
    return selectedAdditionals.reduce((sum, item) => sum + item.price, 0);
  }, [selectedAdditionals]);

  const unitBasePrice = unit?.price || 0;
  const totalQuoteAmount = unitBasePrice + totalAdditionalsAmount;

  // --------------------------------------------------------------------------
  // STEP 3: PLAN DE PAGO
  // --------------------------------------------------------------------------
  const activeDeveloperPlans = useMemo(() => paymentPlans.filter((p) => p.isActive), [paymentPlans]);

  const [selectedPlanId, setSelectedPlanId] = useState<string>("custom");
  const [customPlanName, setCustomPlanName] = useState("Plan Personalizado");
  const [quoteDate, setQuoteDate] = useState("2026-09-17");
  const [discountPct, setDiscountPct] = useState(0);
  const [discountAppliesTo, setDiscountAppliesTo] = useState<"total" | "unit_only">("total");
  const [downPaymentPct, setDownPaymentPct] = useState(20);
  const [installmentsCount, setInstallmentsCount] = useState(12);
  const [balloonLiquidationPct, setBalloonLiquidationPct] = useState(30);
  const [showAdvancedSettings, setShowAdvancedSettings] = useState(false);

  // Initialize with first active developer plan if available
  useEffect(() => {
    if (activeDeveloperPlans.length > 0 && selectedPlanId === "custom" && customPlanName === "Plan Personalizado") {
      const firstPlan = activeDeveloperPlans[0];
      if (firstPlan) {
        setSelectedPlanId(firstPlan.id);
        setCustomPlanName(firstPlan.name);
        setDownPaymentPct(firstPlan.downPaymentPct);
        setInstallmentsCount(firstPlan.installmentsCount);
        setBalloonLiquidationPct(firstPlan.balloonLiquidationPct);
        setDiscountPct(firstPlan.discountPct);
      }
    }
  }, [activeDeveloperPlans]);

  const [paymentSchedule, setPaymentSchedule] = useState<PaymentRow[]>([]);

  const discountAmount = useMemo(() => {
    if (discountPct <= 0) return 0;
    const base = discountAppliesTo === "unit_only" ? unitBasePrice : totalQuoteAmount;
    return Math.round(base * (discountPct / 100) * 100) / 100;
  }, [discountPct, discountAppliesTo, unitBasePrice, totalQuoteAmount]);

  const netTotalQuoteAmount = useMemo(() => {
    return Math.max(0, Math.round((totalQuoteAmount - discountAmount) * 100) / 100);
  }, [totalQuoteAmount, discountAmount]);

  // Cálculos de validación en tiempo real y sugerencias de corrección para el plan de pagos cotizado
  const planValidation = useMemo(() => {
    const down = Number(downPaymentPct) || 0;
    const settlement = Number(balloonLiquidationPct) || 0;
    const plazos = Number(installmentsCount) || 0;
    const sumDownSettlement = down + settlement;
    const remainingPct = 100 - sumDownSettlement;
    const totalPct = down + (plazos > 0 ? Math.max(0, remainingPct) : 0) + settlement;

    if (down <= 0) {
      return {
        isValid: false,
        errorTitle: "Enganche requerido",
        errorMessage: "El enganche debe ser mayor a 0% para el esquema de cotización.",
        fixes: [
          {
            label: "Asignar 20% de Enganche",
            action: () => {
              setDownPaymentPct(20);
              setBalloonLiquidationPct((prev) => Math.min(prev, 80));
              setSelectedPlanId("custom");
              setCustomPlanName("Plan Personalizado");
            },
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
        errorMessage: `El Enganche (${down}%) y la Liquidación (${settlement}%) suman ${sumDownSettlement}%, excediendo el 100% total por ${excess}%.`,
        fixes: [
          {
            label: `Ajustar Liquidación a ${Math.max(0, 100 - down)}%`,
            action: () => {
              setBalloonLiquidationPct(Math.max(0, 100 - down));
              setSelectedPlanId("custom");
              setCustomPlanName("Plan Personalizado");
            },
          },
          {
            label: `Ajustar Enganche a ${Math.max(0, 100 - settlement)}%`,
            action: () => {
              setDownPaymentPct(Math.max(0, 100 - settlement));
              setSelectedPlanId("custom");
              setCustomPlanName("Plan Personalizado");
            },
          },
          {
            label: `Distribuir: ${down}% Enganche / ${Math.floor((100 - down) / 2)}% Mensualidades / ${100 - down - Math.floor((100 - down) / 2)}% Liquidación`,
            action: () => {
              const half = Math.floor((100 - down) / 2);
              setBalloonLiquidationPct(100 - down - half);
              setInstallmentsCount(plazos > 0 ? plazos : 12);
              setSelectedPlanId("custom");
              setCustomPlanName("Plan Personalizado");
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
        errorMessage: `Definiste ${plazos} mensualidades, pero el Enganche (${down}%) y la Liquidación (${settlement}%) ya suman el 100%. No queda porcentaje para mensualidades.`,
        fixes: [
          {
            label: `Reducir Liquidación para dejar 40% en ${plazos} mensualidades (${(40 / plazos).toFixed(1)}% c/u)`,
            action: () => {
              setBalloonLiquidationPct(Math.max(0, 100 - down - 40));
              setSelectedPlanId("custom");
              setCustomPlanName("Plan Personalizado");
            },
          },
          {
            label: "Cambiar Mensualidades a 0",
            action: () => {
              setInstallmentsCount(0);
              setSelectedPlanId("custom");
              setCustomPlanName("Plan Personalizado");
            },
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
        errorTitle: "Porcentaje flotante sin mensualidades",
        errorMessage: `Queda un ${remainingPct}% pendiente de asignar porque el número de mensualidades es 0.`,
        fixes: [
          {
            label: `Sumar ${remainingPct}% a la Liquidación (Total: ${settlement + remainingPct}%)`,
            action: () => {
              setBalloonLiquidationPct(100 - down);
              setSelectedPlanId("custom");
              setCustomPlanName("Plan Personalizado");
            },
          },
          {
            label: `Asignar 12 mensualidades para cubrir el ${remainingPct}% (${(remainingPct / 12).toFixed(1)}% c/u)`,
            action: () => {
              setInstallmentsCount(12);
              setSelectedPlanId("custom");
              setCustomPlanName("Plan Personalizado");
            },
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
  }, [downPaymentPct, balloonLiquidationPct, installmentsCount]);

  const generateSchedule = () => {
    const downPayment = Math.round(netTotalQuoteAmount * (downPaymentPct / 100));
    const liquidation = Math.round(netTotalQuoteAmount * (balloonLiquidationPct / 100));
    const remainingForInstallments = Math.max(0, netTotalQuoteAmount - downPayment - liquidation);
    const monthlyAmount = installmentsCount > 0 ? remainingForInstallments / installmentsCount : 0;

    const rows: PaymentRow[] = [];
    const baseDate = new Date(quoteDate || "2026-09-17");

    rows.push({
      id: "row-enganche",
      concept: "Enganche",
      date: quoteDate,
      amount: downPayment,
    });

    for (let i = 1; i <= installmentsCount; i++) {
      const monthDate = new Date(baseDate);
      monthDate.setMonth(baseDate.getMonth() + i);
      const formattedDate = monthDate.toISOString().slice(0, 10);

      rows.push({
        id: `row-mensual-${i}`,
        concept: `Mensual`,
        date: formattedDate,
        amount: Math.round(monthlyAmount * 100) / 100,
      });
    }

    if (balloonLiquidationPct > 0) {
      const deliveryDate = new Date(baseDate);
      deliveryDate.setMonth(baseDate.getMonth() + installmentsCount + 2);
      rows.push({
        id: "row-liquidacion",
        concept: "Liquidación",
        date: deliveryDate.toISOString().slice(0, 10),
        amount: liquidation,
      });
    }

    setPaymentSchedule(rows);
  };

  const handleSelectPlan = (planId: string) => {
    setSelectedPlanId(planId);
    if (planId === "custom") {
      setCustomPlanName("Plan Personalizado");
      setShowAdvancedSettings(true);
      return;
    }
    const plan = activeDeveloperPlans.find((p) => p.id === planId);
    if (plan) {
      setDownPaymentPct(plan.downPaymentPct);
      setInstallmentsCount(plan.installmentsCount);
      setBalloonLiquidationPct(plan.balloonLiquidationPct);
      setDiscountPct(plan.discountPct);
      setCustomPlanName(plan.name);
    }
  };

  useEffect(() => {
    generateSchedule();
  }, [selectedPlanId, netTotalQuoteAmount, downPaymentPct, installmentsCount, balloonLiquidationPct, discountPct, discountAppliesTo, quoteDate]);

  const totalScheduleSum = useMemo(() => {
    return paymentSchedule.reduce((acc, row) => acc + (Number(row.amount) || 0), 0);
  }, [paymentSchedule]);

  const scheduleDifference = useMemo(() => {
    return Math.round((totalScheduleSum - netTotalQuoteAmount) * 100) / 100;
  }, [totalScheduleSum, netTotalQuoteAmount]);

  const isScheduleBalanced = Math.abs(scheduleDifference) < 1;

  const handleAutoBalanceOnLiquidation = () => {
    if (paymentSchedule.length === 0) return;
    const diff = netTotalQuoteAmount - totalScheduleSum;
    const newSchedule = [...paymentSchedule];
    const lastRowIndex = newSchedule.length - 1;
    const targetRow = newSchedule[lastRowIndex];
    if (targetRow) {
      targetRow.amount = Math.max(0, Math.round((targetRow.amount + diff) * 100) / 100);
      setPaymentSchedule(newSchedule);
    }
  };

  const handleUpdateRowAmount = (id: string, newAmount: number) => {
    setPaymentSchedule((prev) =>
      prev.map((r) => (r.id === id ? { ...r, amount: newAmount } : r))
    );
  };

  const handleUpdateRowDate = (id: string, newDate: string) => {
    setPaymentSchedule((prev) =>
      prev.map((r) => (r.id === id ? { ...r, date: newDate } : r))
    );
  };

  // --------------------------------------------------------------------------
  // STEP 4: CARÁTULA DIGITAL, DESCARGA PDF Y ENVÍO
  // --------------------------------------------------------------------------
  const [sendEmail, setSendEmail] = useState(true);
  const [quoteFolio] = useState(`COT-2026-${Math.floor(1000 + Math.random() * 9000)}`);

  if (!isOpen || !unit) return null;

  const formatMoney = (val: number) => {
    return new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: currency,
      maximumFractionDigits: 0,
    }).format(val || 0);
  };

  const stepsList = [
    { num: 1, label: "Cliente / Copropiedad" },
    { num: 2, label: "Adicionales" },
    { num: 3, label: "Plan de Pago" },
    { num: 4, label: "Carátula y Enlace" },
  ];

  const getUnitCharacteristics = () => {
    const chars: Array<{ label: string; value: string }> = [];
    if (unit?.areaM2) chars.push({ label: "Superficie Total", value: `${unit.areaM2} m²` });
    if (unit?.interiorAreaM2) chars.push({ label: "Superficie Interior", value: `${unit.interiorAreaM2} m²` });
    if (unit?.terraceAreaM2) chars.push({ label: "Terraza / Balcón", value: `${unit.terraceAreaM2} m²` });
    if (unit?.gardenAreaM2) chars.push({ label: "Jardín / Roof", value: `${unit.gardenAreaM2} m²` });
    if (unit?.bedrooms !== undefined && unit?.bedrooms !== null && unit?.bedrooms > 0) chars.push({ label: "Recámaras", value: `${unit.bedrooms}` });
    if (unit?.bathrooms !== undefined && unit?.bathrooms !== null && unit?.bathrooms > 0) chars.push({ label: "Baños", value: `${unit.bathrooms}` });
    if (unit?.parkingSpots !== undefined && unit?.parkingSpots !== null && unit?.parkingSpots > 0) chars.push({ label: "Estacionamientos", value: `${unit.parkingSpots}` });
    if (unit?.storageUnits !== undefined && unit?.storageUnits !== null && unit?.storageUnits > 0) chars.push({ label: "Bodegas", value: `${unit.storageUnits}` });
    if (unit?.floor !== undefined && unit?.floor !== null) chars.push({ label: "Nivel / Piso", value: `Nivel ${unit.floor}` });
    if (unit?.orientation) chars.push({ label: "Orientación", value: unit.orientation });
    if (unit?.viewType) chars.push({ label: "Vista", value: unit.viewType });
    if (unit?.deliveryDate) chars.push({ label: "Entrega Estimada", value: unit.deliveryDate });
    if (unit?.maintenanceFee) chars.push({ label: "Cuota Mantto.", value: `$${unit.maintenanceFee.toLocaleString("es-MX")}/mes` });
    if (unit?.levelHeightM) chars.push({ label: "Altura Libre", value: `${unit.levelHeightM} m` });
    return chars;
  };

  const buildQuotePDFPayload = (): QuotePDFData => {
    const targetProjId = projectId || (projects.length > 0 && projects[0]?.id ? projects[0].id : "p-1");
    const curProj = projects.find((p) => p.id === targetProjId);
    const devLogo =
      (typeof window !== "undefined" && (localStorage.getItem("devio_developer_logo") || sessionStorage.getItem("devio_developer_logo"))) ||
      "https://6d94a8ea50a1bc576a3e8162c197d74f.cdn.bubble.io/f1777398110026x731242031517065300/grupo_veq_logo.jpeg";
    const projLogo =
      (curProj?.image && curProj.image.startsWith("http"))
        ? curProj.image
        : "https://6d94a8ea50a1bc576a3e8162c197d74f.cdn.bubble.io/f1777398492782x453733136803679400/lirica.jpeg";

    const unitPhoto = (unit?.images && unit.images.length > 0 && unit.images[0])
      ? unit.images[0]
      : (curProj?.coverFileName || curProj?.image || curProj?.logoFileName || "https://6d94a8ea50a1bc576a3e8162c197d74f.cdn.bubble.io/f1777398492782x453733136803679400/lirica.jpeg");

    const floorPlanUrl =
      (unit?.floorPlan && curProj?.floorPlans?.find((fp) => fp.name === unit.floorPlan || fp.id === unit.floorPlan)?.imageUrl) ||
      (curProj?.floorPlans && curProj.floorPlans.length > 0 && curProj.floorPlans[0]?.imageUrl) ||
      undefined;

    return {
      quoteFolio: quoteFolio,
      projectName: projectName !== "Proyecto" ? projectName : (curProj?.name || "Proyecto"),
      unitNumber: unit?.unit || "Unidad",
      unitType: unit?.type || "Departamento",
      superficieM2: unit?.areaM2 || 100,
      deliveryDate: unit?.deliveryDate || curProj?.estimatedDeliveryDate || "Mayo 2028",
      listPrice: unitBasePrice,
      discountPct: discountPct,
      discountAmount: discountAmount,
      totalQuoteAmount: netTotalQuoteAmount,
      planName: customPlanName || "Plan de Pago",
      downPaymentAmount: Math.round(netTotalQuoteAmount * (downPaymentPct / 100)),
      downPaymentPct: downPaymentPct,
      installmentsCount: installmentsCount,
      installmentAmount: installmentsCount > 0 ? Math.round(((netTotalQuoteAmount * (1 - (downPaymentPct + balloonLiquidationPct) / 100)) / installmentsCount) * 100) / 100 : 0,
      settlementAmount: Math.round(netTotalQuoteAmount * (balloonLiquidationPct / 100)),
      settlementPct: balloonLiquidationPct,
      additionals: selectedAdditionals.map((a) => ({ name: a.name, price: a.price })),
      isCoOwnership: isCoOwnership,
      coOwners: isCoOwnership ? coOwnersList : undefined,
      client: {
        name: primaryClient.name || "Cliente",
        email: primaryClient.email,
        phone: primaryClient.phone,
        rfc: primaryClient.rfc,
        ownershipPct: isCoOwnership ? primaryClient.ownershipPct : 100,
      },
      advisor: {
        name: userName || "Asesor Comercial",
        role: "Asesor de Ventas",
        email: userEmail || "ventas@devio.mx",
      },
      unitImageUrl: unitPhoto,
      projectCoverUrl: curProj?.coverFileName || curProj?.image,
      floorPlanUrl: floorPlanUrl,
      developerLogoUrl: devLogo,
      projectLogoUrl: projLogo,
      characteristics: getUnitCharacteristics(),
      brandColor: "#1F3652",
    };
  };

  const handleSendQuote = () => {
    setIsSending(true);
    const targetProjId = projectId || (projects.length > 0 && projects[0]?.id ? projects[0].id : "p-1");
    const targetProj = projects.find((p) => p.id === targetProjId);
    const projName = projectName !== "Proyecto" ? projectName : (targetProj?.name || "Proyecto");

    const downPaymentAmt = Math.round(netTotalQuoteAmount * (downPaymentPct / 100));
    const settlementAmt = Math.round(netTotalQuoteAmount * (balloonLiquidationPct / 100));
    const instAmt = installmentsCount > 0
      ? Math.round(((netTotalQuoteAmount - downPaymentAmt - settlementAmt) / installmentsCount) * 100) / 100
      : 0;

    const newQuoteRecord: QuoteRecord = {
      id: `quote-${Date.now()}`,
      folio: quoteFolio,
      projectId: targetProjId,
      projectName: projName,
      unit: unit.unit,
      unitType: unit.type || "Departamento",
      superficieM2: unit.areaM2 || 0,
      deliveryDate: unit.deliveryDate,
      clientName: primaryClient.name || "Cliente",
      clientEmail: primaryClient.email || "",
      clientPhone: primaryClient.phone || "",
      clientRfc: primaryClient.rfc || "",
      advisorName: userName || "Asesor Comercial",
      advisorEmail: userEmail || "ventas@devio.mx",
      listPrice: unitBasePrice,
      discountPct,
      discountAmount,
      totalQuoteAmount: netTotalQuoteAmount,
      planName: customPlanName || "Plan Personalizado",
      downPaymentPct,
      downPaymentAmount: downPaymentAmt,
      installmentsCount,
      installmentAmount: instAmt,
      periodicity: "Mensual",
      settlementPct: balloonLiquidationPct,
      settlementAmount: settlementAmt,
      additionals: selectedAdditionals.map((a) => ({ id: a.id, name: a.name, price: a.price })),
      isCoOwnership: isCoOwnership,
      coOwners: isCoOwnership ? allOwnersCombined : undefined,
      status: "VIGENTE",
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    };

    if (addQuote) {
      addQuote(targetProjId, newQuoteRecord);
    }

    if (sendEmail) {
      const targets = isCoOwnership
        ? allOwnersCombined.filter((o) => o.email && o.email.trim())
        : primaryClient.email
        ? [{ email: primaryClient.email, name: primaryClient.name }]
        : [];

      targets.forEach((t) => {
        fetch("/api/notifications/send", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            to: t.email,
            templateAlias: "nueva-cotizacion",
            templateModel: {
              nombre_cliente: t.name || primaryClient.name || "Cliente",
              unidad: unit.unit,
              proyecto: projName,
              monto_total: netTotalQuoteAmount,
              folio_cotizacion: quoteFolio,
              nombre_asesor: userName || "Asesor Devio",
              anio: new Date().getFullYear().toString(),
            },
          }),
        }).catch((err) => console.error("Error sending quote notification:", err));
      });
    }

    setTimeout(() => {
      setIsSending(false);
      setIsSentSuccess(true);
      if (onQuoteGenerated) {
        onQuoteGenerated({
          folio: quoteFolio,
          unit: unit.unit,
          isCoOwnership,
          coOwners: allOwnersCombined,
          total: netTotalQuoteAmount,
          schedule: paymentSchedule.map((row, idx) => ({ ...row, id: `quote-${unit.unit}-${row.id || idx}` })),
          quoteRecord: newQuoteRecord,
        });
      }
    }, 700);
  };

  const handleCopyLink = () => {
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
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
          maxWidth: "880px",
          maxHeight: "92vh",
          display: "flex",
          flexDirection: "column",
          boxShadow: "0 25px 70px rgba(0, 0, 0, 0.28)",
          border: "1px solid var(--devio-neutral-1)",
          overflow: "hidden",
          animation: "fadeIn 0.2s ease-out",
        }}
      >
        {/* Header & Stepper */}
        <div
          style={{
            padding: "1.25rem 1.75rem 1rem 1.75rem",
            borderBottom: "1px solid var(--devio-neutral-1)",
            backgroundColor: "#FAFBFD",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
              <div
                style={{
                  width: "36px",
                  height: "36px",
                  borderRadius: "10px",
                  backgroundColor: "rgba(31, 54, 82, 0.08)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "var(--devio-blue)",
                }}
              >
                <FileText size={20} />
              </div>
              <div>
                <h2 style={{ fontSize: "1.35rem", fontWeight: 800, color: "var(--devio-blue-dark)", margin: 0, letterSpacing: "-0.02em" }}>
                  Cotizar Unidad {unit.unit}
                </h2>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginTop: "2px" }}>
                  <span style={{ fontSize: "0.78rem", color: "var(--devio-neutral-3)" }}>
                    {projectName} • {unit.type} ({unit.areaM2} m²)
                  </span>
                  <span style={{ fontSize: "0.78rem", color: "var(--devio-neutral-2)" }}>•</span>
                  <span style={{ fontSize: "0.78rem", fontWeight: 600, color: "var(--devio-blue)" }}>
                    Paso {currentStep} de 4: {stepsList[currentStep - 1]?.label || ""}
                  </span>
                </div>
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
                color: "var(--devio-neutral-3)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <X size={20} />
            </button>
          </div>

          {/* Stepper Pills */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "0.5rem", paddingBottom: "0.25rem" }}>
            {stepsList.map((step) => {
              const isDone = currentStep > step.num;
              const isCurrent = currentStep === step.num;
              return (
                <div
                  key={step.num}
                  onClick={() => {
                    if (step.num < currentStep) setCurrentStep(step.num);
                  }}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.45rem",
                    cursor: step.num < currentStep ? "pointer" : "default",
                    opacity: isCurrent ? 1 : isDone ? 0.9 : 0.45,
                    transition: "all 0.2s ease",
                  }}
                >
                  <div
                    style={{
                      width: "24px",
                      height: "24px",
                      borderRadius: "50%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "0.75rem",
                      fontWeight: 700,
                      backgroundColor: isDone
                        ? "var(--devio-green)"
                        : isCurrent
                        ? "var(--devio-blue-dark)"
                        : "transparent",
                      color: isDone || isCurrent ? "#FFFFFF" : "var(--devio-neutral-3)",
                      border: isDone || isCurrent ? "none" : "1.5px solid var(--devio-neutral-2)",
                    }}
                  >
                    {isDone ? <Check size={13} strokeWidth={3} /> : step.num}
                  </div>
                  <span style={{ fontSize: "0.8rem", fontWeight: isCurrent ? 700 : 500, color: isCurrent ? "var(--devio-blue-dark)" : "var(--devio-neutral-4)" }}>
                    {step.label}
                  </span>
                  {step.num < 4 && (
                    <div style={{ width: "24px", height: "1px", backgroundColor: isDone ? "var(--devio-green)" : "var(--devio-neutral-1)", marginLeft: "0.25rem" }} />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Modal Body */}
        <div style={{ flex: 1, overflowY: "auto", padding: "1.5rem 2rem", display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          
          {/* STEP 1: CLIENTE Y COPROPIEDAD */}
          {currentStep === 1 && (
            <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
              <div style={{ textAlign: "center", maxWidth: "660px", margin: "0 auto" }}>
                <h3 style={{ fontSize: "1.25rem", fontWeight: 800, color: "var(--devio-blue-dark)", marginBottom: "0.4rem" }}>
                  Asignar Prospecto y Modalidad de Propiedad
                </h3>
                <p style={{ fontSize: "0.85rem", color: "var(--devio-neutral-3)", lineHeight: 1.45 }}>
                  Busca o registra los datos del titular principal o activa la modalidad en Copropiedad para múltiples compradores.
                </p>
              </div>

              {/* Selector UI/UX Claro: Propietario Único vs Copropiedad */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.85rem" }}>
                {/* Card 1: Propietario Único */}
                <button
                  type="button"
                  onClick={() => handleToggleCoOwnership(false)}
                  style={{
                    padding: "1rem 1.15rem",
                    borderRadius: "0.85rem",
                    border: !isCoOwnership ? "2px solid #2F80ED" : "1.5px solid var(--devio-neutral-1)",
                    backgroundColor: !isCoOwnership ? "rgba(47, 128, 237, 0.05)" : "#FFFFFF",
                    display: "flex",
                    alignItems: "flex-start",
                    gap: "0.85rem",
                    textAlign: "left",
                    cursor: "pointer",
                    transition: "all 0.15s ease",
                  }}
                >
                  <div
                    style={{
                      width: "38px",
                      height: "38px",
                      borderRadius: "8px",
                      backgroundColor: !isCoOwnership ? "var(--devio-blue)" : "rgba(31, 54, 82, 0.08)",
                      color: !isCoOwnership ? "#FFFFFF" : "var(--devio-blue-dark)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    <User size={20} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <strong style={{ fontSize: "0.92rem", color: "var(--devio-blue-dark)" }}>
                        Propietario Único
                      </strong>
                      {!isCoOwnership && (
                        <span style={{ width: "18px", height: "18px", borderRadius: "50%", backgroundColor: "var(--devio-blue)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "11px", fontWeight: 800 }}>
                          ✓
                        </span>
                      )}
                    </div>
                    <p style={{ fontSize: "0.76rem", color: "var(--devio-neutral-3)", margin: "0.25rem 0 0", lineHeight: 1.35 }}>
                      Cotización individual asignada a un solo titular (100% de propiedad).
                    </p>
                  </div>
                </button>

                {/* Card 2: Copropiedad */}
                <button
                  type="button"
                  onClick={() => handleToggleCoOwnership(true)}
                  style={{
                    padding: "1rem 1.15rem",
                    borderRadius: "0.85rem",
                    border: isCoOwnership ? "2px solid #00C48C" : "1.5px solid var(--devio-neutral-1)",
                    backgroundColor: isCoOwnership ? "rgba(0, 196, 140, 0.06)" : "#FFFFFF",
                    display: "flex",
                    alignItems: "flex-start",
                    gap: "0.85rem",
                    textAlign: "left",
                    cursor: "pointer",
                    transition: "all 0.15s ease",
                  }}
                >
                  <div
                    style={{
                      width: "38px",
                      height: "38px",
                      borderRadius: "8px",
                      backgroundColor: isCoOwnership ? "var(--devio-green)" : "rgba(31, 54, 82, 0.08)",
                      color: isCoOwnership ? "#FFFFFF" : "var(--devio-blue-dark)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    <Users size={20} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <strong style={{ fontSize: "0.92rem", color: "var(--devio-blue-dark)" }}>
                        Copropiedad (Varios Titulares)
                      </strong>
                      {isCoOwnership && (
                        <span style={{ width: "18px", height: "18px", borderRadius: "50%", backgroundColor: "var(--devio-green)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "11px", fontWeight: 800 }}>
                          ✓
                        </span>
                      )}
                    </div>
                    <p style={{ fontSize: "0.76rem", color: "var(--devio-neutral-3)", margin: "0.25rem 0 0", lineHeight: 1.35 }}>
                      Cotización compartida entre 2 o más compradores con porcentajes que sumen 100%.
                    </p>
                  </div>
                </button>
              </div>

              {/* Ownership Visual Distribution Bar (When Copropiedad is active) */}
              {isCoOwnership && (
                <div
                  style={{
                    backgroundColor: "#FFFFFF",
                    border: "1px solid var(--devio-neutral-1)",
                    borderRadius: "0.85rem",
                    padding: "1rem 1.25rem",
                    display: "flex",
                    flexDirection: "column",
                    gap: "0.6rem",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <span style={{ fontSize: "0.82rem", fontWeight: 700, color: "var(--devio-blue-dark)" }}>
                        Distribución Patrimonial ({allOwnersCombined.length} Copropietarios):
                      </span>
                      <span
                        style={{
                          fontSize: "0.75rem",
                          fontWeight: 800,
                          padding: "0.2rem 0.6rem",
                          borderRadius: "9999px",
                          backgroundColor: isOwnershipBalanced ? "rgba(0, 196, 140, 0.15)" : "rgba(224, 83, 69, 0.15)",
                          color: isOwnershipBalanced ? "var(--devio-green)" : "var(--devio-red)",
                        }}
                      >
                        {totalOwnershipPct}% / 100% {isOwnershipBalanced ? "✓ Balanceado" : "⚠ Desbalanceado"}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => distributeEqually(primaryClient, coOwnersList)}
                      style={{
                        fontSize: "0.75rem",
                        fontWeight: 700,
                        color: "var(--devio-blue)",
                        background: "none",
                        border: "1px solid var(--devio-blue)",
                        padding: "0.3rem 0.75rem",
                        borderRadius: "0.4rem",
                        cursor: "pointer",
                      }}
                    >
                      Distribuir Equitativamente
                    </button>
                  </div>

                  <div
                    style={{
                      height: "10px",
                      width: "100%",
                      backgroundColor: "var(--devio-neutral-1)",
                      borderRadius: "9999px",
                      overflow: "hidden",
                      display: "flex",
                    }}
                  >
                    {allOwnersCombined.map((owner, idx) => {
                      const colors = ["#1B3047", "#2F80ED", "#00C48C", "#F2994A", "#9B51E0"];
                      const color = colors[idx % colors.length];
                      return (
                        <div
                          key={owner.id || idx}
                          style={{
                            width: `${Math.max(0, Math.min(100, owner.ownershipPct))}%`,
                            backgroundColor: color,
                            transition: "width 0.2s ease",
                          }}
                          title={`${owner.name || "Sin nombre"}: ${owner.ownershipPct}%`}
                        />
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Titular Principal Card */}
              <div
                style={{
                  backgroundColor: "#F8FAFC",
                  padding: "1.25rem",
                  borderRadius: "1rem",
                  border: "1.5px solid var(--devio-neutral-1)",
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.85rem",
                }}
              >
                {/* Selector rápido de cliente existente */}
                {existingClients.length > 0 && (
                  <div>
                    <label style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--devio-neutral-4)", display: "block", marginBottom: "0.25rem" }}>
                      Seleccionar de clientes registrados ({existingClients.length}):
                    </label>
                    <select
                      onChange={(e) => {
                        const found = existingClients.find(
                          (c) => (c.email || c.name).toLowerCase() === e.target.value.toLowerCase()
                        );
                        if (found) {
                          setPrimaryClient((prev) => ({
                            ...prev,
                            name: found.name,
                            email: found.email,
                            phone: found.phone,
                            rfc: found.rfc,
                          }));
                          setIsPrimaryFound(true);
                        }
                      }}
                      defaultValue=""
                      style={{
                        width: "100%",
                        padding: "0.55rem 0.85rem",
                        borderRadius: "0.5rem",
                        border: "1px solid var(--devio-neutral-2)",
                        fontSize: "0.85rem",
                        backgroundColor: "#FFFFFF",
                        color: "var(--devio-blue-dark)",
                        outline: "none",
                        fontWeight: 600,
                      }}
                    >
                      <option value="">-- Buscar o seleccionar cliente existente --</option>
                      {existingClients.map((c, idx) => (
                        <option key={idx} value={c.email || c.name}>
                          {c.name} ({c.email || "Sin correo"}{c.phone ? ` • ${c.phone}` : ""})
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: existingClients.length > 0 ? "1px solid var(--devio-neutral-1)" : "none", paddingTop: existingClients.length > 0 ? "0.6rem" : "0" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <span
                      style={{
                        fontSize: "0.72rem",
                        fontWeight: 800,
                        textTransform: "uppercase",
                        backgroundColor: "var(--devio-blue-dark)",
                        color: "#FFFFFF",
                        padding: "0.2rem 0.55rem",
                        borderRadius: "0.35rem",
                      }}
                    >
                      Titular Principal
                    </span>
                    <strong style={{ fontSize: "0.88rem", color: "var(--devio-blue-dark)" }}>
                      Contacto y Ficha Comercial
                    </strong>
                    {isPrimaryFound ? (
                      <span
                        style={{
                          fontSize: "0.7rem",
                          fontWeight: 800,
                          backgroundColor: "rgba(0, 196, 140, 0.12)",
                          color: "var(--devio-green)",
                          padding: "0.15rem 0.5rem",
                          borderRadius: "9999px",
                          border: "1px solid rgba(0, 196, 140, 0.3)",
                        }}
                      >
                        ✓ Cliente Registrado
                      </span>
                    ) : primaryClient.email.trim() ? (
                      <span
                        style={{
                          fontSize: "0.7rem",
                          fontWeight: 800,
                          backgroundColor: "rgba(47, 128, 237, 0.1)",
                          color: "var(--devio-blue)",
                          padding: "0.15rem 0.5rem",
                          borderRadius: "9999px",
                          border: "1px solid rgba(47, 128, 237, 0.25)",
                        }}
                      >
                        + Nuevo Prospecto
                      </span>
                    ) : null}
                  </div>

                  {isCoOwnership && (
                    <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                      <label style={{ fontSize: "0.78rem", fontWeight: 700, color: "var(--devio-blue-dark)" }}>
                        % Participación:
                      </label>
                      <input
                        type="number"
                        min={1}
                        max={100}
                        value={primaryClient.ownershipPct}
                        onChange={(e) =>
                          setPrimaryClient((prev) => ({
                            ...prev,
                            ownershipPct: Number(e.target.value),
                          }))
                        }
                        style={{
                          width: "65px",
                          padding: "0.3rem 0.5rem",
                          borderRadius: "0.4rem",
                          border: "1.5px solid var(--devio-blue)",
                          fontWeight: 800,
                          textAlign: "center",
                          fontSize: "0.85rem",
                        }}
                      />
                      <span style={{ fontSize: "0.85rem", fontWeight: 700 }}>%</span>
                    </div>
                  )}
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.85rem" }}>
                  <div style={{ gridColumn: "span 2" }}>
                    <label style={{ fontSize: "0.78rem", fontWeight: 700, color: "var(--devio-blue-dark)", display: "flex", alignItems: "center", gap: "0.35rem", marginBottom: "0.25rem" }}>
                      <Mail size={13} style={{ color: "var(--devio-blue)" }} /> Correo Electrónico *
                    </label>
                    <input
                      type="email"
                      value={primaryClient.email}
                      onChange={(e) => setPrimaryClient({ ...primaryClient, email: e.target.value })}
                      placeholder="cliente@ejemplo.com"
                      style={{
                        width: "100%",
                        padding: "0.65rem 0.85rem",
                        borderRadius: "0.5rem",
                        border: isPrimaryFound ? "1.5px solid var(--devio-green)" : "1px solid var(--devio-neutral-2)",
                        fontSize: "0.9rem",
                        backgroundColor: "#FFFFFF",
                      }}
                      required
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: "0.78rem", fontWeight: 700, color: "var(--devio-blue-dark)", display: "block", marginBottom: "0.25rem" }}>
                      Nombre Completo *
                    </label>
                    <input
                      type="text"
                      value={primaryClient.name}
                      onChange={(e) => setPrimaryClient({ ...primaryClient, name: e.target.value })}
                      placeholder="Nombre y Apellidos"
                      style={{
                        width: "100%",
                        padding: "0.65rem 0.85rem",
                        borderRadius: "0.5rem",
                        border: "1px solid var(--devio-neutral-2)",
                        fontSize: "0.88rem",
                        backgroundColor: "#FFFFFF",
                      }}
                      required
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: "0.78rem", fontWeight: 700, color: "var(--devio-blue-dark)", display: "block", marginBottom: "0.25rem" }}>
                      Teléfono de Contacto
                    </label>
                    <PhoneInput
                      value={primaryClient.phone}
                      onChange={(fullVal) => setPrimaryClient({ ...primaryClient, phone: fullVal })}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: "0.78rem", fontWeight: 700, color: "var(--devio-blue-dark)", display: "block", marginBottom: "0.25rem" }}>
                      RFC / Identificación (Opcional)
                    </label>
                    <input
                      type="text"
                      value={primaryClient.rfc}
                      onChange={(e) => setPrimaryClient({ ...primaryClient, rfc: e.target.value.toUpperCase() })}
                      placeholder="MOAL890214XYZ"
                      style={{
                        width: "100%",
                        padding: "0.65rem 0.85rem",
                        borderRadius: "0.5rem",
                        border: "1px solid var(--devio-neutral-2)",
                        fontSize: "0.88rem",
                        backgroundColor: "#FFFFFF",
                        textTransform: "uppercase",
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Co-Owners list */}
              {isCoOwnership && (
                <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                  {coOwnersList.map((co, index) => (
                    <div
                      key={co.id}
                      style={{
                        backgroundColor: "#FAFBFD",
                        padding: "1.25rem",
                        borderRadius: "1rem",
                        border: "1px solid var(--devio-neutral-2)",
                        display: "flex",
                        flexDirection: "column",
                        gap: "0.85rem",
                      }}
                    >
                      {/* Selector rápido para copropietario */}
                      {existingClients.length > 0 && (
                        <div>
                          <label style={{ fontSize: "0.72rem", fontWeight: 700, color: "var(--devio-neutral-4)", display: "block", marginBottom: "0.25rem" }}>
                            Cargar de clientes registrados:
                          </label>
                          <select
                            onChange={(e) => {
                              const found = existingClients.find(
                                (c) => (c.email || c.name).toLowerCase() === e.target.value.toLowerCase()
                              );
                              if (found) {
                                handleUpdateCoOwner(co.id, "name", found.name);
                                handleUpdateCoOwner(co.id, "email", found.email);
                                handleUpdateCoOwner(co.id, "phone", found.phone);
                                handleUpdateCoOwner(co.id, "rfc", found.rfc);
                              }
                            }}
                            defaultValue=""
                            style={{
                              width: "100%",
                              padding: "0.45rem 0.75rem",
                              borderRadius: "0.4rem",
                              border: "1px solid var(--devio-neutral-2)",
                              fontSize: "0.8rem",
                              backgroundColor: "#FFFFFF",
                              color: "var(--devio-blue-dark)",
                              outline: "none",
                            }}
                          >
                            <option value="">-- Seleccionar copropietario existente --</option>
                            {existingClients.map((c, idx) => (
                              <option key={idx} value={c.email || c.name}>
                                {c.name} ({c.email || "Sin correo"}{c.phone ? ` • ${c.phone}` : ""})
                              </option>
                            ))}
                          </select>
                        </div>
                      )}

                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span
                          style={{
                            fontSize: "0.72rem",
                            fontWeight: 800,
                            textTransform: "uppercase",
                            backgroundColor: "var(--devio-blue)",
                            color: "#FFFFFF",
                            padding: "0.2rem 0.55rem",
                            borderRadius: "0.35rem",
                          }}
                        >
                          Copropietario #{index + 1}
                        </span>

                        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                            <label style={{ fontSize: "0.78rem", fontWeight: 700, color: "var(--devio-blue-dark)" }}>
                              % Participación:
                            </label>
                            <input
                              type="number"
                              min={1}
                              max={100}
                              value={co.ownershipPct}
                              onChange={(e) => handleUpdateCoOwner(co.id, "ownershipPct", Number(e.target.value))}
                              style={{
                                width: "65px",
                                padding: "0.3rem 0.5rem",
                                borderRadius: "0.4rem",
                                border: "1.5px solid var(--devio-blue)",
                                fontWeight: 800,
                                textAlign: "center",
                                fontSize: "0.85rem",
                              }}
                            />
                            <span style={{ fontSize: "0.85rem", fontWeight: 700 }}>%</span>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleRemoveCoOwner(co.id)}
                            style={{
                              background: "none",
                              border: "none",
                              color: "var(--devio-red)",
                              cursor: "pointer",
                              padding: "0.25rem",
                            }}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>

                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.85rem" }}>
                        <div style={{ gridColumn: "span 2" }}>
                          <label style={{ fontSize: "0.78rem", fontWeight: 700, color: "var(--devio-blue-dark)", display: "block", marginBottom: "0.25rem" }}>
                            Correo Electrónico *
                          </label>
                          <input
                            type="email"
                            value={co.email}
                            onChange={(e) => handleUpdateCoOwner(co.id, "email", e.target.value)}
                            placeholder="copropietario@ejemplo.com"
                            style={{
                              width: "100%",
                              padding: "0.65rem 0.85rem",
                              borderRadius: "0.5rem",
                              border: "1px solid var(--devio-neutral-2)",
                              fontSize: "0.9rem",
                              backgroundColor: "#FFFFFF",
                            }}
                            required
                          />
                        </div>

                        <div>
                          <label style={{ fontSize: "0.78rem", fontWeight: 700, color: "var(--devio-blue-dark)", display: "block", marginBottom: "0.25rem" }}>
                            Nombre Completo *
                          </label>
                          <input
                            type="text"
                            value={co.name}
                            onChange={(e) => handleUpdateCoOwner(co.id, "name", e.target.value)}
                            placeholder="Nombre del Copropietario"
                            style={{
                              width: "100%",
                              padding: "0.65rem 0.85rem",
                              borderRadius: "0.5rem",
                              border: "1px solid var(--devio-neutral-2)",
                              fontSize: "0.88rem",
                              backgroundColor: "#FFFFFF",
                            }}
                            required
                          />
                        </div>

                        <div>
                          <label style={{ fontSize: "0.78rem", fontWeight: 700, color: "var(--devio-blue-dark)", display: "block", marginBottom: "0.25rem" }}>
                            Teléfono
                          </label>
                          <PhoneInput
                            value={co.phone}
                            onChange={(fullVal) => handleUpdateCoOwner(co.id, "phone", fullVal)}
                          />
                        </div>
                      </div>
                    </div>
                  ))}

                  <button
                    type="button"
                    onClick={handleAddCoOwner}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "0.5rem",
                      padding: "0.85rem",
                      borderRadius: "0.75rem",
                      border: "2px dashed var(--devio-blue)",
                      backgroundColor: "rgba(47, 128, 237, 0.04)",
                      color: "var(--devio-blue)",
                      fontWeight: 700,
                      fontSize: "0.88rem",
                      cursor: "pointer",
                    }}
                  >
                    <Plus size={18} /> + Agregar Otro Copropietario a esta Cotización
                  </button>
                </div>
              )}
            </div>
          )}

          {/* STEP 2: ADICIONALES */}
          {currentStep === 2 && (
            <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
              <div style={{ textAlign: "center", maxWidth: "620px", margin: "0 auto" }}>
                <h3 style={{ fontSize: "1.25rem", fontWeight: 800, color: "var(--devio-blue-dark)", marginBottom: "0.4rem" }}>
                  Seleccionar Adicionales
                </h3>
                <p style={{ fontSize: "0.85rem", color: "var(--devio-neutral-3)" }}>
                  Agrega bodegas, cajones o acabados a la cotización de la unidad {unit.unit}.
                </p>
              </div>

              <div>
                <label style={{ fontSize: "0.82rem", fontWeight: 700, color: "var(--devio-blue-dark)", display: "block", marginBottom: "0.4rem" }}>
                  Adicionales Disponibles en {projectName}
                </label>
                <div
                  style={{
                    minHeight: "48px",
                    padding: "0.4rem 0.6rem",
                    borderRadius: "0.6rem",
                    border: "1.5px solid var(--devio-neutral-2)",
                    backgroundColor: "var(--devio-white)",
                    display: "flex",
                    flexWrap: "wrap",
                    alignItems: "center",
                    gap: "0.4rem",
                  }}
                >
                  {selectedAdditionals.map((item) => (
                    <span
                      key={item.id}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "0.35rem",
                        padding: "0.25rem 0.6rem",
                        borderRadius: "0.4rem",
                        backgroundColor: "#F1F5F9",
                        border: "1px solid var(--devio-neutral-1)",
                        fontSize: "0.82rem",
                        fontWeight: 600,
                        color: "var(--devio-blue-dark)",
                      }}
                    >
                      <button
                        type="button"
                        onClick={() =>
                          setSelectedAdditionals(selectedAdditionals.filter((i) => i.id !== item.id))
                        }
                        style={{
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                          padding: 0,
                          color: "var(--devio-neutral-3)",
                          display: "flex",
                          alignItems: "center",
                        }}
                      >
                        <X size={13} />
                      </button>
                      {item.name}
                    </span>
                  ))}
                  <select
                    onChange={(e) => {
                      const found = availableAdditionalsPool.find((a) => a.id === e.target.value);
                      if (found && !selectedAdditionals.some((s) => s.id === found.id)) {
                        setSelectedAdditionals([...selectedAdditionals, found]);
                      }
                      e.target.value = "";
                    }}
                    style={{
                      border: "none",
                      outline: "none",
                      fontSize: "0.85rem",
                      color: "var(--devio-neutral-3)",
                      backgroundColor: "transparent",
                      cursor: "pointer",
                      padding: "0.3rem",
                      flex: 1,
                      minWidth: "180px",
                    }}
                    defaultValue=""
                  >
                    <option value="" disabled>
                      {availableAdditionalsPool.length === 0
                        ? "No hay adicionales disponibles en este proyecto"
                        : "+ Añadir adicional a la cotización..."}
                    </option>
                    {availableAdditionalsPool.filter(
                      (a) => !selectedAdditionals.some((s) => s.id === a.id)
                    ).map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.name} — {formatMoney(a.price)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Additionals Resumen */}
              <div
                style={{
                  backgroundColor: "#F8FAFC",
                  borderRadius: "1rem",
                  border: "1px solid var(--devio-neutral-1)",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    backgroundColor: "rgba(31, 54, 82, 0.05)",
                    padding: "0.75rem 1.25rem",
                    borderBottom: "1px solid var(--devio-neutral-1)",
                  }}
                >
                  <h4 style={{ fontSize: "0.9rem", fontWeight: 800, color: "var(--devio-blue-dark)", margin: 0 }}>
                    Resumen de Adicionales
                  </h4>
                </div>

                <div style={{ padding: "1.25rem", display: "flex", flexDirection: "column", gap: "0.65rem" }}>
                  {selectedAdditionals.length === 0 ? (
                    <p style={{ fontSize: "0.85rem", color: "var(--devio-neutral-3)", fontStyle: "italic", margin: 0 }}>
                      Sin adicionales seleccionados para esta cotización.
                    </p>
                  ) : (
                    selectedAdditionals.map((item, index) => (
                      <div
                        key={item.id}
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          fontSize: "0.88rem",
                        }}
                      >
                        <span style={{ color: "var(--devio-blue-dark)", fontWeight: 600 }}>
                          {index + 1}. {item.name}:
                        </span>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                          <span style={{ fontWeight: 700, color: "var(--devio-neutral-5)" }}>
                            {formatMoney(item.price)}
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              setSelectedAdditionals(selectedAdditionals.filter((i) => i.id !== item.id))
                            }
                            style={{
                              background: "none",
                              border: "none",
                              cursor: "pointer",
                              color: "var(--devio-red)",
                              padding: "0.1rem",
                            }}
                            title="Eliminar adicional"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                    ))
                  )}

                  <div
                    style={{
                      marginTop: "0.5rem",
                      paddingTop: "0.75rem",
                      borderTop: "1px solid var(--devio-neutral-1)",
                      display: "flex",
                      justifyContent: "center",
                      alignItems: "center",
                      gap: "0.5rem",
                    }}
                  >
                    <span style={{ fontSize: "0.95rem", fontWeight: 800, color: "var(--devio-blue-dark)" }}>
                      $ Total Adicionales:
                    </span>
                    <span style={{ fontSize: "1.1rem", fontWeight: 800, color: "var(--devio-green)" }}>
                      {formatMoney(totalAdditionalsAmount)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: PLAN DE PAGO */}
          {currentStep === 3 && (
            <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
              <div style={{ textAlign: "center", maxWidth: "680px", margin: "0 auto" }}>
                <h3 style={{ fontSize: "1.25rem", fontWeight: 800, color: "var(--devio-blue-dark)", marginBottom: "0.4rem" }}>
                  Seleccionar Plan de Pago a Cotizar
                </h3>
                <p style={{ fontSize: "0.82rem", color: "var(--devio-neutral-3)", lineHeight: 1.45 }}>
                  Elige el plan de pago que se presentará en la cotización. Puedes personalizar enganche, mensualidades, descuentos y fechas.
                </p>
              </div>

              {/* Plan Preset Selector Header */}
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                <div style={{ flex: 1 }}>
                  <select
                    value={selectedPlanId}
                    onChange={(e) => handleSelectPlan(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "0.7rem 1rem",
                      borderRadius: "0.6rem",
                      border: "1.5px solid var(--devio-neutral-2)",
                      fontSize: "0.9rem",
                      fontWeight: 700,
                      color: "var(--devio-blue-dark)",
                      backgroundColor: "var(--devio-white)",
                      outline: "none",
                    }}
                  >
                    {activeDeveloperPlans.map((plan) => (
                      <option key={plan.id} value={plan.id}>
                        {plan.name} ({plan.downPaymentPct}% Enganche, {plan.installmentsCount} Mensualidades, {plan.balloonLiquidationPct}% Liquidación{plan.discountPct > 0 ? ` - ${plan.discountPct}% Desc` : ""})
                      </option>
                    ))}
                    <option value="custom">Esquema Personalizado (Libre)</option>
                  </select>
                </div>

                <button
                  type="button"
                  onClick={() => setShowAdvancedSettings(!showAdvancedSettings)}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "0.4rem",
                    padding: "0.7rem 1.1rem",
                    borderRadius: "0.6rem",
                    backgroundColor: showAdvancedSettings ? "var(--devio-blue)" : "var(--devio-blue-dark)",
                    color: "var(--devio-white)",
                    fontSize: "0.85rem",
                    fontWeight: 700,
                    border: "none",
                    cursor: "pointer",
                    whiteSpace: "nowrap",
                    transition: "all 0.15s ease",
                  }}
                >
                  <Edit2 size={14} />
                  {showAdvancedSettings ? "Ocultar Personalización" : "Personalizar"}
                </button>
              </div>

              {/* Advanced Parameters Drawer */}
              {showAdvancedSettings && (
                <div
                  style={{
                    backgroundColor: "rgba(31, 54, 82, 0.04)",
                    border: "1px solid var(--devio-neutral-1)",
                    borderRadius: "0.85rem",
                    padding: "1rem 1.25rem",
                    display: "grid",
                    gridTemplateColumns: "repeat(4, 1fr)",
                    gap: "1rem",
                  }}
                >
                  <div>
                    <label style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--devio-blue-dark)", display: "block", marginBottom: "0.25rem" }}>
                      Enganche %
                    </label>
                    <input
                      type="number"
                      value={downPaymentPct}
                      onChange={(e) => {
                        setDownPaymentPct(Number(e.target.value));
                        setSelectedPlanId("custom");
                        setCustomPlanName("Plan Personalizado");
                      }}
                      style={{
                        width: "100%",
                        padding: "0.5rem",
                        borderRadius: "0.5rem",
                        border: "1px solid var(--devio-neutral-2)",
                        fontSize: "0.85rem",
                        fontWeight: 700,
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--devio-blue-dark)", display: "block", marginBottom: "0.25rem" }}>
                      Mensualidades
                    </label>
                    <input
                      type="number"
                      value={installmentsCount}
                      onChange={(e) => {
                        setInstallmentsCount(Number(e.target.value));
                        setSelectedPlanId("custom");
                        setCustomPlanName("Plan Personalizado");
                      }}
                      style={{
                        width: "100%",
                        padding: "0.5rem",
                        borderRadius: "0.5rem",
                        border: "1px solid var(--devio-neutral-2)",
                        fontSize: "0.85rem",
                        fontWeight: 700,
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--devio-blue-dark)", display: "block", marginBottom: "0.25rem" }}>
                      Liquidación %
                    </label>
                    <input
                      type="number"
                      value={balloonLiquidationPct}
                      onChange={(e) => {
                        setBalloonLiquidationPct(Number(e.target.value));
                        setSelectedPlanId("custom");
                        setCustomPlanName("Plan Personalizado");
                      }}
                      style={{
                        width: "100%",
                        padding: "0.5rem",
                        borderRadius: "0.5rem",
                        border: "1px solid var(--devio-neutral-2)",
                        fontSize: "0.85rem",
                        fontWeight: 700,
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--devio-blue-dark)", display: "block", marginBottom: "0.25rem" }}>
                      Descuento %
                    </label>
                    <input
                      type="number"
                      value={discountPct}
                      onChange={(e) => {
                        setDiscountPct(Number(e.target.value));
                        setSelectedPlanId("custom");
                        setCustomPlanName("Plan Personalizado");
                      }}
                      style={{
                        width: "100%",
                        padding: "0.5rem",
                        borderRadius: "0.5rem",
                        border: "1px solid var(--devio-neutral-2)",
                        fontSize: "0.85rem",
                        fontWeight: 700,
                      }}
                    />
                  </div>

                  {/* Live Schema Balance Card & Distribution */}
                  <div
                    style={{
                      gridColumn: "1 / -1",
                      padding: "0.85rem 1rem",
                      borderRadius: "0.65rem",
                      backgroundColor: planValidation.isValid ? "rgba(255, 255, 255, 0.8)" : "#FFF5F5",
                      border: planValidation.isValid ? "1px solid var(--devio-neutral-2)" : "1px solid #FCA5A5",
                      fontSize: "0.78rem",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.35rem" }}>
                      <span style={{ fontWeight: 700, color: "var(--devio-blue-dark)" }}>
                        Distribución: Enganche ({downPaymentPct}%) + {installmentsCount > 0 ? `${installmentsCount} Mensualidades (${planValidation.installmentsPct}%)` : "Sin mensualidades"} + Liquidación ({balloonLiquidationPct}%)
                      </span>
                      <strong style={{ color: planValidation.isValid ? "var(--devio-green)" : "var(--devio-red)" }}>
                        {planValidation.isValid ? "✓ Total: 100%" : `⚠ Total: ${planValidation.totalPct}%`}
                      </strong>
                    </div>
                    <div style={{ height: "8px", backgroundColor: "#E2E8F0", borderRadius: "4px", display: "flex", overflow: "hidden", marginBottom: "0.4rem" }}>
                      <div style={{ width: `${Math.max(0, Math.min(100, downPaymentPct))}%`, backgroundColor: "#2F80ED" }} title={`Enganche: ${downPaymentPct}%`} />
                      <div style={{ width: `${Math.max(0, Math.min(100, planValidation.installmentsPct))}%`, backgroundColor: "#F2C94C" }} title={`Mensualidades: ${planValidation.installmentsPct}%`} />
                      <div style={{ width: `${Math.max(0, Math.min(100, balloonLiquidationPct))}%`, backgroundColor: "#00C48C" }} title={`Liquidación: ${balloonLiquidationPct}%`} />
                    </div>
                    {planValidation.isValid && installmentsCount > 0 && planValidation.installmentsPct > 0 && (
                      <span style={{ color: "var(--text-muted)", fontSize: "0.74rem" }}>
                        Cada mensualidad es del {(planValidation.installmentsPct / installmentsCount).toFixed(2)}% del valor neto a cotizar.
                      </span>
                    )}
                  </div>

                  {/* ALERTA DE ERROR Y SUGERENCIAS DE CORRECCIÓN RÁPIDA (1-CLIC) */}
                  {!planValidation.isValid && planValidation.errorMessage && (
                    <div
                      style={{
                        gridColumn: "1 / -1",
                        backgroundColor: "#FEF2F2",
                        border: "1px solid #F87171",
                        borderRadius: "0.65rem",
                        padding: "0.85rem 1rem",
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

                  {/* Discount Scope Option */}
                  {discountPct > 0 && (
                    <div
                      style={{
                        gridColumn: "1 / -1",
                        marginTop: "0.25rem",
                        padding: "0.75rem 1rem",
                        borderRadius: "0.65rem",
                        backgroundColor: "rgba(47, 128, 237, 0.05)",
                        border: "1px solid rgba(47, 128, 237, 0.15)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        flexWrap: "wrap",
                        gap: "0.75rem",
                      }}
                    >
                      <span style={{ fontSize: "0.78rem", fontWeight: 700, color: "var(--devio-blue-dark)" }}>
                        Aplicar Descuento del {discountPct}% ({formatMoney(discountAmount)}) sobre:
                      </span>
                      <div style={{ display: "flex", alignItems: "center", gap: "1.25rem" }}>
                        <label style={{ display: "flex", alignItems: "center", gap: "0.4rem", fontSize: "0.78rem", cursor: "pointer", fontWeight: discountAppliesTo === "total" ? 700 : 500, color: "var(--devio-blue-dark)" }}>
                          <input
                            type="radio"
                            name="quoteDiscountAppliesTo"
                            checked={discountAppliesTo === "total"}
                            onChange={() => setDiscountAppliesTo("total")}
                            style={{ accentColor: "var(--devio-blue)" }}
                          />
                          <span>Total del Plan (Unidad + Adicionales)</span>
                        </label>
                        <label style={{ display: "flex", alignItems: "center", gap: "0.4rem", fontSize: "0.78rem", cursor: "pointer", fontWeight: discountAppliesTo === "unit_only" ? 700 : 500, color: "var(--devio-blue-dark)" }}>
                          <input
                            type="radio"
                            name="quoteDiscountAppliesTo"
                            checked={discountAppliesTo === "unit_only"}
                            onChange={() => setDiscountAppliesTo("unit_only")}
                            style={{ accentColor: "var(--devio-blue)" }}
                          />
                          <span>Solo Precio de la Unidad</span>
                        </label>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Financial Breakdown Card */}
              <div
                style={{
                  backgroundColor: "#F8FAFC",
                  borderRadius: "1rem",
                  border: "1px solid var(--devio-neutral-1)",
                  padding: "1rem 1.25rem",
                  display: "grid",
                  gridTemplateColumns: "repeat(3, 1fr)",
                  gap: "1rem",
                }}
              >
                <div>
                  <span style={{ fontSize: "0.75rem", color: "var(--devio-neutral-3)", display: "block" }}>
                    Precio Lista + Adicionales
                  </span>
                  <span style={{ fontSize: "1.05rem", fontWeight: 800, color: "var(--devio-blue-dark)" }}>
                    {formatMoney(totalQuoteAmount)}
                  </span>
                </div>
                <div>
                  <span style={{ fontSize: "0.75rem", color: "var(--devio-neutral-3)", display: "block" }}>
                    Descuento Aplicado {discountPct > 0 ? `(${discountAppliesTo === "unit_only" ? "a Unidad" : "Total"})` : ""}
                  </span>
                  <span style={{ fontSize: "1.05rem", fontWeight: 800, color: discountPct > 0 ? "var(--devio-red)" : "var(--devio-neutral-4)" }}>
                    {discountPct}% (-{formatMoney(discountAmount)})
                  </span>
                </div>
                <div>
                  <span style={{ fontSize: "0.75rem", color: "var(--devio-neutral-3)", display: "block" }}>
                    Total Neto a Cotizar
                  </span>
                  <span style={{ fontSize: "1.2rem", fontWeight: 800, color: "var(--devio-green)" }}>
                    {formatMoney(netTotalQuoteAmount)}
                  </span>
                </div>
              </div>

              {/* Interactive Payment Schedule Table */}
              <div
                style={{
                  border: "1px solid var(--devio-neutral-1)",
                  borderRadius: "1rem",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    backgroundColor: "rgba(31, 54, 82, 0.05)",
                    padding: "0.75rem 1.25rem",
                    borderBottom: "1px solid var(--devio-neutral-1)",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <h4 style={{ fontSize: "0.9rem", fontWeight: 800, color: "var(--devio-blue-dark)", margin: 0 }}>
                    Calendario de Pagos Cotizado ({paymentSchedule.length} exhibiciones)
                  </h4>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                    {!isScheduleBalanced && (
                      <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--devio-red)" }}>
                        Diferencia: {formatMoney(scheduleDifference)}
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={handleAutoBalanceOnLiquidation}
                      style={{
                        fontSize: "0.75rem",
                        padding: "0.3rem 0.75rem",
                        borderRadius: "0.4rem",
                        backgroundColor: "var(--devio-white)",
                        border: "1px solid var(--devio-neutral-2)",
                        fontWeight: 700,
                        cursor: "pointer",
                        color: "var(--devio-blue-dark)",
                      }}
                    >
                      Ajustar al 100%
                    </button>
                  </div>
                </div>

                <div style={{ maxHeight: "220px", overflowY: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.82rem" }}>
                    <thead>
                      <tr style={{ backgroundColor: "#FAFBFD", borderBottom: "1px solid var(--devio-neutral-1)", textAlign: "left" }}>
                        <th style={{ padding: "0.6rem 1rem", color: "var(--devio-neutral-3)" }}>Concepto</th>
                        <th style={{ padding: "0.6rem 1rem", color: "var(--devio-neutral-3)" }}>Fecha de Pago</th>
                        <th style={{ padding: "0.6rem 1rem", color: "var(--devio-neutral-3)", textAlign: "right" }}>Monto</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paymentSchedule.map((row, idx) => (
                        <tr key={row.id ? `${row.id}-${idx}` : idx} style={{ borderBottom: "1px solid #F1F5F9" }}>
                          <td style={{ padding: "0.55rem 1rem", fontWeight: 600, color: "var(--devio-blue-dark)" }}>
                            {idx + 1}. {row.concept}
                          </td>
                          <td style={{ padding: "0.55rem 1rem", minWidth: "160px" }}>
                            <DevioDatePicker
                              value={row.date}
                              minDate={idx === 0 ? quoteDate : paymentSchedule[idx - 1]?.date}
                              onChange={(val) => handleUpdateRowDate(row.id, val)}
                              showPresets={false}
                              placeholder="Seleccionar"
                            />
                          </td>
                          <td style={{ padding: "0.55rem 1rem", textAlign: "right" }}>
                            <CurrencyInput
                              value={row.amount}
                              onChange={(newVal) => handleUpdateRowAmount(row.id, newVal)}
                              style={{ width: "150px" }}
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Table Summary Footer with Total Sum */}
                <div
                  style={{
                    backgroundColor: "#FAFBFD",
                    borderTop: "1.5px solid var(--devio-neutral-1)",
                    padding: "0.85rem 1.25rem",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    flexWrap: "wrap",
                    gap: "0.75rem",
                  }}
                >
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                      <span style={{ fontSize: "0.82rem", fontWeight: 700, color: "var(--devio-blue-dark)" }}>
                        Suma Total de Pagos:
                      </span>
                      <strong style={{ fontSize: "1.05rem", color: isScheduleBalanced ? "var(--devio-green)" : "var(--devio-red)" }}>
                        {formatMoney(totalScheduleSum)}
                      </strong>
                      <span
                        style={{
                          fontSize: "0.72rem",
                          fontWeight: 800,
                          padding: "0.2rem 0.55rem",
                          borderRadius: "9999px",
                          backgroundColor: isScheduleBalanced ? "rgba(0, 196, 140, 0.12)" : "rgba(224, 83, 69, 0.12)",
                          color: isScheduleBalanced ? "var(--devio-green)" : "var(--devio-red)",
                        }}
                      >
                        {isScheduleBalanced ? "✓ 100% Cuadrado" : `⚠ Diferencia: ${formatMoney(scheduleDifference)}`}
                      </span>
                    </div>
                    <span style={{ fontSize: "0.75rem", color: "var(--devio-neutral-3)", display: "block", marginTop: "0.2rem" }}>
                      Monto Neto a Liquidar: <strong>{formatMoney(netTotalQuoteAmount)}</strong>
                      {discountPct > 0 ? (
                        <> • (Unidad: {formatMoney(unitBasePrice)}{totalAdditionalsAmount > 0 ? ` + Adicionales: ${formatMoney(totalAdditionalsAmount)}` : ""} - Descuento {discountAppliesTo === "unit_only" ? "a Unidad" : "Total"}: {formatMoney(discountAmount)})</>
                      ) : (
                        totalAdditionalsAmount > 0 ? <> • (Unidad: {formatMoney(unitBasePrice)} + Adicionales: ${formatMoney(totalAdditionalsAmount)})</> : null
                      )}
                    </span>
                  </div>

                  {!isScheduleBalanced && (
                    <button
                      type="button"
                      onClick={handleAutoBalanceOnLiquidation}
                      style={{
                        fontSize: "0.78rem",
                        padding: "0.4rem 0.9rem",
                        borderRadius: "0.5rem",
                        backgroundColor: "var(--devio-blue-dark)",
                        color: "#FFFFFF",
                        border: "none",
                        fontWeight: 700,
                        cursor: "pointer",
                      }}
                    >
                      Ajustar Diferencia en Liquidación
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: CARÁTULA Y ENLACE */}
          {currentStep === 4 && (
            <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
              <div style={{ textAlign: "center", maxWidth: "620px", margin: "0 auto" }}>
                <h3 style={{ fontSize: "1.25rem", fontWeight: 800, color: "var(--devio-blue-dark)", marginBottom: "0.4rem" }}>
                  Carátula Digital de Cotización
                </h3>
                <p style={{ fontSize: "0.85rem", color: "var(--devio-neutral-3)" }}>
                  La cotización está lista con el desglose patrimonial y financiero para ser descargada en PDF y enviada.
                </p>
              </div>

              {/* Digital Sheet Preview */}
              <div
                style={{
                  backgroundColor: "var(--devio-white)",
                  borderRadius: "1rem",
                  border: "2px solid var(--devio-neutral-1)",
                  padding: "1.5rem",
                  boxShadow: "0 4px 20px rgba(0,0,0,0.06)",
                  display: "flex",
                  flexDirection: "column",
                  gap: "1rem",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", borderBottom: "1px solid var(--devio-neutral-1)", paddingBottom: "1rem" }}>
                  <div>
                    <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--devio-neutral-3)" }}>FOLIO: {quoteFolio}</span>
                    <h4 style={{ fontSize: "1.15rem", fontWeight: 800, color: "var(--devio-blue-dark)", margin: "2px 0 0 0" }}>
                      {projectName} — Unidad {unit.unit}
                    </h4>
                    <span style={{ fontSize: "0.8rem", color: "var(--devio-neutral-4)" }}>
                      Superficie: {unit.areaM2} m² • {unit.type} • Entrega estimada: {unit.deliveryDate || "Mayo 2028"}
                    </span>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <span style={{ fontSize: "0.75rem", color: "var(--devio-neutral-3)" }}>Cotizado para:</span>
                    <strong style={{ display: "block", color: "var(--devio-blue-dark)", fontSize: "0.95rem" }}>
                      {isCoOwnership ? `${primaryClient.name} (+${coOwnersList.length} Copropietarios)` : primaryClient.name}
                    </strong>
                    <span style={{ fontSize: "0.78rem", color: "var(--devio-neutral-4)" }}>{primaryClient.email}</span>
                  </div>
                </div>

                {/* Copropietarios breakdown if applicable */}
                {isCoOwnership && (
                  <div style={{ backgroundColor: "#F8FAFC", padding: "0.75rem 1rem", borderRadius: "0.6rem" }}>
                    <span style={{ fontSize: "0.72rem", fontWeight: 700, color: "var(--devio-neutral-3)", textTransform: "uppercase", display: "block", marginBottom: "0.3rem" }}>
                      Titulares Registrados en esta Cotización:
                    </span>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
                      {allOwnersCombined.map((owner) => (
                        <span
                          key={owner.id}
                          style={{
                            fontSize: "0.78rem",
                            fontWeight: 600,
                            backgroundColor: "var(--devio-white)",
                            padding: "0.25rem 0.6rem",
                            borderRadius: "0.35rem",
                            border: "1px solid var(--devio-neutral-2)",
                            color: "var(--devio-blue-dark)",
                          }}
                        >
                          {owner.name} ({owner.ownershipPct}%)
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", backgroundColor: "rgba(31, 54, 82, 0.04)", padding: "0.85rem 1.25rem", borderRadius: "0.6rem" }}>
                  <div>
                    <span style={{ fontSize: "0.75rem", color: "var(--devio-neutral-3)", display: "block" }}>Esquema de Pago</span>
                    <strong style={{ fontSize: "0.95rem", color: "var(--devio-blue-dark)" }}>{customPlanName} ({downPaymentPct}% Enganche / {installmentsCount} Plazos)</strong>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <span style={{ fontSize: "0.75rem", color: "var(--devio-neutral-3)", display: "block" }}>Monto Total Cotizado</span>
                    <strong style={{ fontSize: "1.25rem", color: "var(--devio-green)" }}>{formatMoney(netTotalQuoteAmount)}</strong>
                  </div>
                </div>
              </div>

              {/* Action Buttons: Abrir, PDF Download & Link Copy */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.75rem" }}>
                <button
                  type="button"
                  onClick={() => {
                    openQuoteInNewTab(buildQuotePDFPayload());
                  }}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "0.45rem",
                    padding: "0.75rem 0.5rem",
                    borderRadius: "0.6rem",
                    backgroundColor: "var(--devio-white)",
                    border: "1.5px solid var(--devio-blue-dark)",
                    color: "var(--devio-blue-dark)",
                    fontWeight: 700,
                    fontSize: "0.82rem",
                    cursor: "pointer",
                    transition: "all 0.15s ease",
                  }}
                >
                  <ExternalLink size={15} /> Abrir Cotización
                </button>

                <button
                  type="button"
                  onClick={async () => {
                    await generateQuotePDF(buildQuotePDFPayload());
                  }}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "0.45rem",
                    padding: "0.75rem 0.5rem",
                    borderRadius: "0.6rem",
                    backgroundColor: "var(--devio-blue-dark)",
                    border: "1.5px solid var(--devio-blue-dark)",
                    color: "var(--devio-white)",
                    fontWeight: 700,
                    fontSize: "0.82rem",
                    cursor: "pointer",
                    transition: "all 0.15s ease",
                  }}
                >
                  <Download size={15} /> Descargar PDF
                </button>

                <button
                  type="button"
                  onClick={handleCopyLink}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "0.45rem",
                    padding: "0.75rem 0.5rem",
                    borderRadius: "0.6rem",
                    backgroundColor: "var(--devio-white)",
                    border: "1.5px solid var(--devio-neutral-2)",
                    color: "var(--devio-neutral-4)",
                    fontWeight: 700,
                    fontSize: "0.82rem",
                    cursor: "pointer",
                    transition: "all 0.15s ease",
                  }}
                >
                  <Copy size={15} /> {copiedLink ? "✓ Copiado" : "Copiar Enlace"}
                </button>
              </div>

              {/* Checkbox: Enviar por correo */}
              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.65rem",
                  padding: "0.85rem 1.1rem",
                  borderRadius: "0.75rem",
                  backgroundColor: "rgba(111, 172, 156, 0.1)",
                  border: "1px solid rgba(111, 172, 156, 0.3)",
                  cursor: "pointer",
                  fontSize: "0.88rem",
                  fontWeight: 700,
                  color: "var(--devio-blue-dark)",
                }}
              >
                <input
                  type="checkbox"
                  checked={sendEmail}
                  onChange={(e) => setSendEmail(e.target.checked)}
                  style={{ width: "18px", height: "18px", accentColor: "var(--devio-blue)" }}
                />
                <span>
                  Enviar cotización formal con carátula en PDF a {isCoOwnership ? "todos los copropietarios" : primaryClient.email}
                </span>
              </label>
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            padding: "1rem 2rem",
            borderTop: "1px solid var(--devio-neutral-1)",
            backgroundColor: "#FAFBFD",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          {currentStep > 1 ? (
            <button
              type="button"
              onClick={() => setCurrentStep((prev) => Math.max(1, prev - 1))}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.4rem",
                padding: "0.65rem 1.4rem",
                borderRadius: "9999px",
                backgroundColor: "var(--devio-blue-dark)",
                color: "var(--devio-white)",
                fontSize: "0.875rem",
                fontWeight: 700,
                border: "none",
                cursor: "pointer",
              }}
            >
              <ChevronLeft size={16} /> Anterior
            </button>
          ) : (
            <div />
          )}

          {currentStep < 4 ? (
            <button
              type="button"
              onClick={() => {
                if (currentStep === 1) {
                  if (!primaryClient.email.trim() || !primaryClient.name.trim()) {
                    alert("Por favor completa los datos del prospecto.");
                    return;
                  }
                  if (isCoOwnership && !isOwnershipBalanced) {
                    alert(`El porcentaje de copropiedad debe sumar 100%. Actualmente suma ${totalOwnershipPct}%.`);
                    return;
                  }
                }
                if (currentStep === 3) {
                  if (!planValidation.isValid) {
                    alert(planValidation.errorMessage || "Por favor corrige la distribución de porcentajes del plan de pago.");
                    return;
                  }
                }
                setCurrentStep((prev) => Math.min(4, prev + 1));
              }}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.4rem",
                padding: "0.65rem 1.5rem",
                borderRadius: "9999px",
                backgroundColor: "var(--devio-blue-dark)",
                color: "var(--devio-white)",
                fontSize: "0.875rem",
                fontWeight: 700,
                border: "none",
                cursor: "pointer",
              }}
            >
              Siguiente <ChevronRight size={16} />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSendQuote}
              disabled={isSending}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.5rem",
                padding: "0.65rem 1.75rem",
                borderRadius: "9999px",
                backgroundColor: isSentSuccess ? "var(--devio-green)" : "var(--devio-blue-dark)",
                color: "var(--devio-white)",
                fontSize: "0.875rem",
                fontWeight: 800,
                border: "none",
                cursor: isSending ? "not-allowed" : "pointer",
                boxShadow: "0 4px 14px rgba(22, 43, 63, 0.4)",
              }}
            >
              {isSentSuccess ? (
                <>
                  <CheckCircle2 size={16} /> ¡Cotización Enviada!
                </>
              ) : isSending ? (
                "Generando y Enviando..."
              ) : (
                <>
                  <Mail size={16} /> Finalizar y Enviar Cotización
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
