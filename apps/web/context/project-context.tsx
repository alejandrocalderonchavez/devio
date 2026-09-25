"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import {
  INITIAL_PROJECTS,
  ProjectItem,
  UnitItem,
  CoOwner,
  SaleItem,
  SaleRecord,
  SaleScheduleInstallment,
  SalePaymentReceipt,
  ClientProfile,
  ProjectAdditional,
  ProjectFloorPlan,
  ProjectConstructionAdvance,
  ProjectDocument,
  ClientDocument,
  QuoteRecord,
  ProjectMetric,
} from "../data/projects-data";
import { PostventaIncident, INITIAL_INCIDENTS } from "../data/postventa-data";
import {
  UserRole,
  PermissionKey,
  PERMISSIONS_CATALOG,
  DEFAULT_ROLE_PERMISSIONS,
  ALL_PERMISSION_KEYS,
  checkPermission,
  getRolePermissionsMap,
} from "../lib/permissions";

export type Currency = "MXN" | "USD";

export interface DeveloperPaymentPlan {
  id: string;
  name: string;
  downPaymentPct: number;
  installmentsCount: number;
  balloonLiquidationPct: number;
  discountPct: number;
  isActive: boolean;
  description?: string;
  moratoryRatePct?: number; // Tasa de interés moratorio mensual (%)
}

export const DEFAULT_DEVELOPER_PAYMENT_PLANS: DeveloperPaymentPlan[] = [
  {
    id: "plan-tradicional",
    name: "Plan Tradicional",
    downPaymentPct: 30,
    installmentsCount: 18,
    balloonLiquidationPct: 20,
    discountPct: 0,
    isActive: true,
    moratoryRatePct: 3.0,
    description: "30% Enganche, 18 Mensualidades (50%), 20% Liquidación contra entrega",
  },
  {
    id: "plan-preventa",
    name: "Plan Preventa",
    downPaymentPct: 20,
    installmentsCount: 12,
    balloonLiquidationPct: 30,
    discountPct: 0,
    isActive: true,
    moratoryRatePct: 3.5,
    description: "20% Enganche, 12 Mensualidades (50%), 30% Liquidación",
  },
  {
    id: "plan-inversionista",
    name: "Plan Inversionista",
    downPaymentPct: 50,
    installmentsCount: 24,
    balloonLiquidationPct: 0,
    discountPct: 3,
    isActive: true,
    moratoryRatePct: 2.5,
    description: "50% Enganche, 24 Mensualidades (50%), 3% Descuento especial",
  },
  {
    id: "plan-contado",
    name: "Plan Contado",
    downPaymentPct: 90,
    installmentsCount: 0,
    balloonLiquidationPct: 10,
    discountPct: 6,
    isActive: true,
    moratoryRatePct: 4.0,
    description: "90% Enganche, 10% Liquidación, 6% Descuento por pago de contado",
  },
];

interface ProjectContextType {
  projects: ProjectItem[];
  currency: Currency;
  setCurrency: (c: Currency) => void;
  banxicoRate: number;
  formatMoney: (amount: number) => string;
  developerName: string;
  setDeveloperName: (name: string) => void;
  developerLogo: string;
  setDeveloperLogo: (logo: string) => void;
  userName: string;
  setUserName: (name: string) => void;
  userEmail: string;
  setUserEmail: (email: string) => void;
  paymentPlans: DeveloperPaymentPlan[];
  addPaymentPlan: (plan: Omit<DeveloperPaymentPlan, "id">) => void;
  updatePaymentPlan: (id: string, plan: Partial<DeveloperPaymentPlan>) => void;
  deletePaymentPlan: (id: string) => void;
  setPaymentPlans: (plans: DeveloperPaymentPlan[]) => void;
  getProject: (id: string) => ProjectItem | undefined;
  addProject: (project: ProjectItem) => void;
  refreshProjects: () => void;
  updateUnit: (projectId: string, unitNumber: string, updatedFields: Partial<UnitItem>) => void;
  updateMultipleUnits: (projectId: string, updatedUnits: UnitItem[]) => void;
  updateBulkPrices: (projectId: string, pctIncrease: number, unitNumbers?: string[]) => void;
  updateProjectAdditionals: (projectId: string, additionals: ProjectAdditional[]) => void;
  addSale: (salePayload: any) => void;
  registerPayment: (
    projectId: string,
    payload: {
      unitNumber: string;
      amount: number;
      paymentDate: string;
      paymentMethod: string;
      reference?: string;
      notes?: string;
      voucherName?: string;
      sendReceiptEmail?: boolean;
      moratoryAction?: string;
      moratoryAmount?: number;
      waiveReason?: string;
    }
  ) => void;
  updateSaleScheduleInstallment: (
    projectId: string,
    unitNumber: string,
    installmentId: string,
    updatedFields: {
      scheduledAmount?: number;
      scheduledDate?: string;
      concept?: string;
    }
  ) => void;
  bulkRegisterPayments: (
    projectId: string,
    paymentsList: Array<{
      unitNumber: string;
      amount: number;
      paymentDate: string;
      paymentMethod: string;
      reference?: string;
      notes?: string;
    }>
  ) => { successCount: number; errors: string[] };
  updateSaleDetailsAndAdditionals: (
    projectId: string,
    unitNumber: string,
    payload: {
      additionals: ProjectAdditional[];
      adjustScheduleMode?: "liquidation" | "proportional";
      notes?: string;
    }
  ) => void;
  updateSalePayment: (
    projectId: string,
    unitNumber: string,
    paymentId: string,
    updatedFields: Partial<SalePaymentReceipt>
  ) => void;
  deleteSalePayment: (projectId: string, unitNumber: string, paymentId: string) => void;
  unsellUnit: (projectId: string, unitNumber: string) => void;
  updateProject: (projectId: string, updatedFields: Partial<ProjectItem>) => void;
  updateProjectProgress: (projectId: string, progressPct: number) => void;
  registerConstructionProgress: (projectId: string, advanceData: ProjectConstructionAdvance) => void;
  updateProjectFloorPlans: (projectId: string, floorPlans: ProjectFloorPlan[]) => void;
  addFloorPlan: (projectId: string, floorPlan: ProjectFloorPlan) => void;
  updateFloorPlan: (projectId: string, floorPlanId: string, updatedFields: Partial<ProjectFloorPlan>) => void;
  deleteFloorPlan: (projectId: string, floorPlanId: string) => void;
  bulkImportUnits: (projectId: string, newUnits: UnitItem[]) => { addedCount: number; updatedCount: number };
  bulkImportAdditionals: (projectId: string, newAddons: ProjectAdditional[]) => { addedCount: number; updatedCount: number };
  updateProjectDocuments: (projectId: string, documents: ProjectDocument[]) => void;
  addProjectDocument: (projectId: string, doc: ProjectDocument) => void;
  deleteProjectDocument: (projectId: string, docId: string) => void;
  addClientDocument: (projectId: string, doc: ClientDocument) => void;
  updateClientDocument: (projectId: string, doc: ClientDocument) => void;
  deleteClientDocument: (projectId: string, docId: string) => void;
  addQuote: (projectId: string, quote: QuoteRecord) => void;
  updateQuote: (projectId: string, quoteId: string, updatedFields: Partial<QuoteRecord>) => void;
  deleteQuote: (projectId: string, quoteId: string) => void;
  postventaIncidents: PostventaIncident[];
  addPostventaIncident: (incident: PostventaIncident) => void;
  updatePostventaIncident: (incident: PostventaIncident) => void;
  deletePostventaIncident: (incidentId: string) => void;
  resetToCleanState: () => void;
  loadDemoData: () => void;
  toast: { title: string; desc: string; type?: "success" | "info" | "warning" } | null;
  showToast: (title: string, desc: string, type?: "success" | "info" | "warning") => void;
  hideToast: () => void;
  logout: () => void;
  userRole: UserRole;
  userPermissions: string[];
  hasPermission: (key: PermissionKey) => boolean;
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

export function ProjectProvider({ children }: { children: React.ReactNode }) {
  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [currency, setCurrency] = useState<Currency>("MXN");
  const [developerName, setDeveloperName] = useState<string>("Mi Desarrolladora");
  const [developerLogo, setDeveloperLogo] = useState<string>("");
  const [userName, setUserName] = useState<string>("Usuario");
  const [userEmail, setUserEmail] = useState<string>("");
  const [userRole, setUserRole] = useState<UserRole>("Super Admin");
  const [userPermissions, setUserPermissions] = useState<string[]>(["all"]);
  const [paymentPlans, setPaymentPlans] = useState<DeveloperPaymentPlan[]>([]);
  const [postventaIncidents, setPostventaIncidents] = useState<PostventaIncident[]>([]);
  const [toast, setToast] = useState<{ title: string; desc: string; type?: "success" | "info" | "warning" } | null>(null);
  const [banxicoRate, setBanxicoRate] = useState<number>(18.35);

  useEffect(() => {
    fetch("/api/finance/exchange-rate")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data && typeof data.rate === "number" && data.rate > 0) {
          setBanxicoRate(data.rate);
        }
      })
      .catch((err) => {
        console.warn("Could not fetch live exchange rate, using default:", err);
      });
  }, []);

  const mapDbProjectToProjectItem = (dbProj: any): ProjectItem => {
    if (!dbProj) return {} as ProjectItem;

    const rawAdditionals = Array.isArray(dbProj.additionals) ? dbProj.additionals : [];
    const additionals: ProjectAdditional[] = rawAdditionals.map((a: any, idx: number) => {
      const rawType = (a.type || a.category || "PARKING").toUpperCase();
      const category: "estacionamiento" | "bodega" | "acabados" | "terraza" | "otro" =
        rawType === "PARKING" || rawType === "ESTACIONAMIENTO"
          ? "estacionamiento"
          : rawType === "STORAGE" || rawType === "BODEGA"
          ? "bodega"
          : rawType === "ROOF_GARDEN" || rawType === "TERRAZA"
          ? "terraza"
          : rawType === "ACABADOS"
          ? "acabados"
          : "otro";

      const assignedUnitNum = a.unit?.unitNumber || a.assignedToUnit || undefined;
      const rawStatus = (a.status || "AVAILABLE").toUpperCase();
      const status: "DISPONIBLE" | "ASIGNADO" | "VENDIDO" =
        rawStatus === "SOLD" || rawStatus === "VENDIDO"
          ? "VENDIDO"
          : rawStatus === "RESERVED" || rawStatus === "ASSIGNED" || rawStatus === "ASIGNADO" || Boolean(assignedUnitNum)
          ? "ASIGNADO"
          : "DISPONIBLE";

      return {
        id: a.id || `add-${idx + 1}`,
        name: a.name || `Adicional ${idx + 1}`,
        category,
        price: Number(a.price) || 0,
        status,
        assignedToUnit: assignedUnitNum,
        notes: a.notes || "",
      };
    });

    const rawSales = Array.isArray(dbProj.sales) ? dbProj.sales : [];
    const mappedSales: SaleRecord[] = rawSales.map((s: any, sIdx: number) => {
      const uNum = String(s.unit?.unitNumber || s.unitNumber || s.unit || "").trim();
      const primaryClientName =
        s.primaryClient?.fullName ||
        s.clientName ||
        s.client?.fullName ||
        s.client?.name ||
        "Cliente Comprador";
      const primaryClientEmail =
        s.primaryClient?.email || s.clientEmail || s.client?.email || "";
      const primaryClientPhone =
        s.primaryClient?.phone || s.clientPhone || s.client?.phone || "";
      const primaryClientRfc =
        s.primaryClient?.taxId || s.clientRfc || s.client?.rfc || "";

      const mappedCoOwners: CoOwner[] = Array.isArray(s.coOwners)
        ? s.coOwners.map((c: any) => ({
            name: c.client?.fullName || c.name || "Co-propietario",
            email: c.client?.email || c.email || "",
            phone: c.client?.phone || c.phone || "",
            rfc: c.client?.taxId || c.rfc || "",
            ownershipPct: Number(c.ownershipPercentage ?? c.ownershipPct ?? 50),
          }))
        : [];

      const rawReceipts = Array.isArray(s.paymentReceipts)
        ? s.paymentReceipts
        : Array.isArray(s.payments)
        ? s.payments
        : [];

      const mappedPayments: SalePaymentReceipt[] = rawReceipts.map((r: any, rIdx: number) => {
        const amt = Number(r.amount) || 0;
        const rawDate = r.paymentDate || r.createdAt;
        let pDate = new Date().toLocaleDateString("es-MX");
        if (rawDate) {
          try {
            const d = new Date(rawDate);
            pDate = !isNaN(d.getTime()) ? d.toLocaleDateString("es-MX") : String(rawDate);
          } catch (_) {
            pDate = String(rawDate);
          }
        }

        return {
          id: r.id || `pay-rec-${sIdx}-${rIdx + 1}`,
          receiptFolio: r.receiptFolio || `REC-${new Date().getFullYear()}-${String(rIdx + 1).padStart(3, "0")}`,
          paymentDate: pDate,
          amount: amt,
          paymentMethod: r.paymentMethod || "SPEI",
          unit: uNum,
          reference: r.transactionReference || r.reference || "",
          notes: r.notes || "",
          scheduledAmount: amt,
          scheduledDate: pDate,
          sendReceiptEmail: Boolean(r.sendReceiptEmail),
          createdAt: r.createdAt ? new Date(r.createdAt).toISOString() : new Date().toISOString(),
        };
      });

      const totalP = Number(s.finalPrice ?? s.agreedPrice ?? s.totalPrice) || 0;
      const totalPaid = mappedPayments.reduce((sum, p) => sum + p.amount, 0) || Number(s.paidAmount) || 0;
      const totalPending = Math.max(0, totalP - totalPaid);

      const rawObligations = Array.isArray(s.scheduledObligations)
        ? s.scheduledObligations
        : Array.isArray(s.schedule)
        ? s.schedule
        : [];

      let remainingPaid = totalPaid;

      const mappedSchedule = rawObligations
        .map((ob: any, obIdx: number) => {
          const origAmt = Number(ob.originalAmount ?? ob.scheduledAmount ?? ob.amount) || 0;
          const rawDate = ob.dueDate || ob.scheduledDate;
          let formattedDate = "18/09/2026";
          let rawTimestamp = 0;
          if (rawDate) {
            try {
              const d = new Date(rawDate);
              if (!isNaN(d.getTime())) {
                rawTimestamp = d.getTime();
                formattedDate = d.toLocaleDateString("es-MX");
              } else {
                formattedDate = String(rawDate);
              }
            } catch (_) {
              formattedDate = String(rawDate);
            }
          }

          return {
            id: ob.id || `inst-${uNum || sIdx}-${obIdx + 1}`,
            concept: ob.title || ob.concept || `Cuota ${obIdx + 1}`,
            scheduledDate: formattedDate,
            scheduledAmount: origAmt,
            _timestamp: rawTimestamp,
            _obNumber: Number(ob.obligationNumber) || obIdx + 1,
            _rawPaid: Number(ob.paidAmount) || 0,
          };
        })
        .sort((a: any, b: any) => {
          if (a._timestamp && b._timestamp) return a._timestamp - b._timestamp;
          return a._obNumber - b._obNumber;
        })
        .map(({ _timestamp, _obNumber, _rawPaid, ...inst }: any) => {
          const sAmount = inst.scheduledAmount;
          let alloc = 0;
          if (remainingPaid > 0 && sAmount > 0) {
            alloc = Math.min(remainingPaid, sAmount);
            remainingPaid -= alloc;
          } else if (_rawPaid > 0) {
            alloc = _rawPaid;
          }
          const pend = Math.max(0, sAmount - alloc);
          const isPaid = pend === 0 && sAmount > 0;
          return {
            ...inst,
            paidAmount: alloc,
            pendingAmount: pend,
            paymentDate: isPaid ? inst.scheduledDate : alloc > 0 ? "Parcial" : "-",
            paymentMethod: alloc > 0 ? "Transferencia SPEI" : "Pendiente",
            status: isPaid ? ("Pagado" as const) : alloc > 0 ? ("Parcial" as const) : ("Pendiente" as const),
          };
        });

      const planName = s.paymentPlan?.name || s.paymentPlan || "Plan Tradicional";
      const sFolio = s.contractNumber || s.folio || `VTA-${new Date().getFullYear()}-${String(sIdx + 1).padStart(3, "0")}`;

      let saleDateIso = new Date().toISOString();
      if (s.reservationDate || s.saleDate || s.createdAt) {
        try {
          const d = new Date(s.reservationDate || s.saleDate || s.createdAt);
          if (!isNaN(d.getTime())) saleDateIso = d.toISOString();
        } catch (_) {}
      }

      const matchingAddons = additionals.filter(
        (a) => a.assignedToUnit && a.assignedToUnit.toLowerCase() === uNum.toLowerCase()
      );

      return {
        id: s.id || `sale-${sIdx + 1}`,
        folio: sFolio,
        clientId: s.primaryClientId || s.clientId || s.primaryClient?.id,
        clientName: primaryClientName,
        clientEmail: primaryClientEmail,
        clientPhone: primaryClientPhone,
        clientRfc: primaryClientRfc,
        unit: uNum,
        paymentPlan: typeof planName === "string" ? planName : "Plan Tradicional",
        totalPrice: totalP,
        paidAmount: totalPaid,
        pendingAmount: totalPending,
        saleDate: saleDateIso,
        coOwners: mappedCoOwners,
        additionals: matchingAddons.length > 0 ? matchingAddons : Array.isArray(s.additionals) ? s.additionals : [],
        schedule: mappedSchedule,
        payments: mappedPayments,
        status:
          (s.status || "ACTIVA").toUpperCase() === "CANCELLED" ||
          (s.status || "").toUpperCase() === "CANCELADA"
            ? "CANCELADA"
            : "ACTIVA",
      };
    });

    const hasInventory = Array.isArray(dbProj.unitsInventory);
    const rawUnits = Array.isArray(dbProj.units) ? dbProj.units : hasInventory ? dbProj.unitsInventory : [];

    const saleByUnitNumber = new Map<string, SaleRecord>();
    const saleByUnitId = new Map<string, SaleRecord>();
    mappedSales.forEach((s) => {
      if (s.unit) saleByUnitNumber.set(s.unit.toLowerCase().trim(), s);
      if (s.id) saleByUnitId.set(s.id, s);
    });

    const unitsInventory: UnitItem[] = rawUnits.map((u: any, idx: number) => {
      const uNum = String(u.unitNumber || u.unit || `${idx + 1}`).trim();
      const associatedSale = saleByUnitNumber.get(uNum.toLowerCase()) || (u.id ? saleByUnitId.get(u.id) : undefined);

      const rawCategory = u.category || u.type || "APARTMENT";
      const type =
        rawCategory === "HOUSE" || rawCategory === "Casa"
          ? "Casa"
          : rawCategory === "COMMERCIAL_SPACE" || rawCategory === "Local"
          ? "Local"
          : rawCategory === "LAND_LOT" || rawCategory === "Terreno"
          ? "Terreno"
          : rawCategory === "INDUSTRIAL_WAREHOUSE" || rawCategory === "Bodega"
          ? "Bodega"
          : "Departamento";

      const rawStatus = (u.status || (associatedSale ? "SOLD" : "AVAILABLE")).toUpperCase();
      const status: "DISPONIBLE" | "VENDIDA" | "BLOQUEADA" | "APARTADA" =
        rawStatus === "SOLD" || rawStatus === "VENDIDA" || Boolean(associatedSale)
          ? "VENDIDA"
          : rawStatus === "BLOCKED" || rawStatus === "BLOQUEADA"
          ? "BLOQUEADA"
          : rawStatus === "RESERVED" || rawStatus === "APARTADA"
          ? "APARTADA"
          : "DISPONIBLE";

      const client =
        associatedSale?.clientName ||
        u.sales?.[0]?.primaryClient?.fullName ||
        u.client ||
        "-";

      return {
        id: u.id || `u-${idx + 1}`,
        unit: uNum,
        type,
        price: Number(associatedSale?.totalPrice ?? u.basePrice ?? u.price) || 0,
        areaM2: Number(u.totalAreaM2 ?? u.areaM2 ?? u.surfaceM2) || 0,
        floor: Number(u.level ?? u.floor) || 1,
        status,
        client,
        coOwners: associatedSale?.coOwners || u.coOwners,
        saleFolio: associatedSale?.folio || u.saleFolio,
        saleDate: associatedSale?.saleDate || u.saleDate,
        salePlanName: associatedSale?.paymentPlan || u.salePlanName,
        salePaidAmount: associatedSale?.paidAmount ?? u.salePaidAmount,
        salePendingAmount: associatedSale?.pendingAmount ?? u.salePendingAmount,
        deliveryDate: u.deliveryDate || dbProj.estimatedDeliveryDate || "",
        bedrooms: u.bedrooms != null ? Number(u.bedrooms) : undefined,
        bathrooms: u.bathrooms != null ? Number(u.bathrooms) : undefined,
        parkingSpots: u.parkingSpaces != null ? Number(u.parkingSpaces) : u.parkingSpots != null ? Number(u.parkingSpots) : 0,
        storageUnits: u.storageRooms != null ? Number(u.storageRooms) : u.storageUnits != null ? Number(u.storageUnits) : 0,
        floorPlan: u.floorPlan || undefined,
        images: Array.isArray(u.renderUrls) ? u.renderUrls : Array.isArray(u.images) ? u.images : [],
        priceHistory: u.priceHistory || [],
      };
    });

    const totalUnits = unitsInventory.length || Number(dbProj.totalUnits) || 0;
    const soldUnits = unitsInventory.filter((u) => u.status === "VENDIDA").length || Number(dbProj.soldUnits) || 0;
    const availableUnits = unitsInventory.filter((u) => u.status === "DISPONIBLE").length || Number(dbProj.availableUnits) || 0;
    const blockedUnits = unitsInventory.filter((u) => u.status === "BLOQUEADA" || u.status === "APARTADA").length || Number(dbProj.blockedUnits) || 0;

    const valorComercialTotal = unitsInventory.reduce((acc, u) => acc + (u.price || 0), 0);
    const soldUnitsPriceSum = unitsInventory.filter((u) => u.status === "VENDIDA").reduce((acc, u) => acc + (u.price || 0), 0);
    const activeMappedSales = mappedSales.filter((s) => s.status !== "CANCELADA");
    const totalCobrado = activeMappedSales.reduce((acc, s) => acc + (s.paidAmount || 0), 0);
    const porCobrar = Math.max(0, soldUnitsPriceSum - totalCobrado);
    const porVenderMonto = valorComercialTotal - soldUnitsPriceSum;
    const precioPromedio = totalUnits > 0 ? Math.round(valorComercialTotal / totalUnits) : 0;
    const avanceVentasPct = totalUnits > 0 ? Math.round((soldUnits / totalUnits) * 100) : 0;

    const metrics: ProjectMetric = dbProj.metrics || {
      totalCobrado,
      porCobrar,
      pagosAtrasados: 0,
      avanceVentasPct,
      unidadesVendidasCount: soldUnits,
      unidadesTotalesCount: totalUnits,
      porVenderUnidades: availableUnits + blockedUnits,
      valorComercialVendido: soldUnitsPriceSum,
      valorComercialTotal,
      porVenderMonto,
      flujoFuturoMonto: totalCobrado + porCobrar,
      precioPromedio,
      inventarioMonetarioPct: valorComercialTotal > 0 ? Math.round((soldUnitsPriceSum / valorComercialTotal) * 100) : 0,
      totalFacturado: soldUnitsPriceSum,
      distribucionPct: 0,
    };

    const image =
      dbProj.coverImagePath ||
      dbProj.image ||
      "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=800&q=80";

    const logo =
      (dbProj.galleryPaths && dbProj.galleryPaths.length > 0 ? dbProj.galleryPaths[0] : null) ||
      dbProj.logoPath ||
      dbProj.logoUrl ||
      dbProj.logo ||
      "";

    const googleMapsUrl = dbProj.googleMapsUrl || dbProj.addressLine1 || "";
    const websiteUrl = dbProj.websiteUrl || dbProj.addressLine2 || "";
    const totalSurfaceM2 =
      dbProj.totalSurfaceM2 != null
        ? Number(dbProj.totalSurfaceM2)
        : dbProj.postalCode && !isNaN(Number(dbProj.postalCode))
        ? Number(dbProj.postalCode)
        : undefined;

    const rawDocs = Array.isArray(dbProj.documents) ? dbProj.documents : [];
    const mappedDocuments: ProjectDocument[] = rawDocs.map((d: any, idx: number) => {
      const rawType = String(d.type || d.category || "Contratos").toUpperCase();
      let category: any = "Contratos";

      if (rawType.includes("BLUEPRINT") || rawType.includes("PLANO")) {
        category = "Planos y Arquitectura";
      } else if (rawType.includes("LICENSE") || rawType.includes("PERMISO") || rawType.includes("LICENCIA")) {
        category = "Licencias y Permisos";
      } else if (rawType.includes("TECHNICAL") || rawType.includes("FICHA") || rawType.includes("TÉCNICO")) {
        category = "Fichas Técnicas";
      } else if (rawType.includes("REGULATION") || rawType.includes("REGLAMENTO") || rawType.includes("ACTA")) {
        category = "Reglamentos y Actas";
      } else if (rawType.includes("FINANCIAL") || rawType.includes("FISCAL") || rawType.includes("RECEIPT") || rawType.includes("STATEMENT")) {
        category = "Financiero y Fiscal";
      } else if (d.category) {
        category = d.category;
      }

      const fileType = d.fileType || (d.mimeType?.includes("image") ? "PNG" : d.storagePath?.split(".").pop()?.toUpperCase() || "PDF");

      return {
        id: d.id || `doc-${idx + 1}`,
        title: d.title || d.name || "Documento",
        category: category,
        fileType: fileType === "DOCX" || fileType === "XLSX" || fileType === "DWG" || fileType === "ZIP" ? fileType : "PDF",
        fileSize: d.fileSizeBytes ? `${Math.round(d.fileSizeBytes / 1024)} KB` : d.fileSize || "1.0 MB",
        uploadDate: d.uploadDate || (d.createdAt ? new Date(d.createdAt).toLocaleDateString("es-MX") : new Date().toLocaleDateString("es-MX")),
        updatedAt: d.updatedAt ? new Date(d.updatedAt).toLocaleDateString("es-MX") : new Date().toLocaleDateString("es-MX"),
        version: d.version || "v1.0",
        notes: d.notes || "",
        url: d.storagePath || d.url || d.fileDataUrl || undefined,
        fileName: d.fileName || (d.storagePath ? d.storagePath.split("/").pop() : `${d.title || "documento"}.pdf`),
      };
    });

    return {
      id: dbProj.id,
      name: dbProj.name,
      type: dbProj.projectType || dbProj.type || "VERTICAL",
      currency: dbProj.baseCurrency || dbProj.currency || "MXN",
      image,
      progressPct: Number(dbProj.progressPct) || 0,
      totalUnits,
      soldUnits,
      availableUnits,
      blockedUnits,
      legalName: dbProj.legalName || dbProj.name,
      description: dbProj.description || "",
      googleMapsUrl,
      websiteUrl,
      totalSurfaceM2,
      estimatedDeliveryDate: dbProj.estimatedDeliveryDate || "",
      logoFileName: dbProj.logoFileName || (logo ? "logo.png" : ""),
      logoUrl: logo,
      logo,
      coverFileName: dbProj.coverFileName || (image ? "cover.jpg" : ""),
      metrics,
      monthlyBilling: dbProj.monthlyBilling || [
        { month: "Ene", cobrado: 0, porCobrar: 0 },
        { month: "Feb", cobrado: 0, porCobrar: 0 },
        { month: "Mar", cobrado: 0, porCobrar: 0 },
        { month: "Abr", cobrado: 0, porCobrar: 0 },
        { month: "May", cobrado: 0, porCobrar: 0 },
        { month: "Jun", cobrado: 0, porCobrar: 0 },
        { month: "Jul", cobrado: 0, porCobrar: 0 },
        { month: "Ago", cobrado: 0, porCobrar: 0 },
        { month: "Sep", cobrado: 0, porCobrar: 0 },
        { month: "Oct", cobrado: 0, porCobrar: 0 },
        { month: "Nov", cobrado: 0, porCobrar: 0 },
        { month: "Dic", cobrado: 0, porCobrar: 0 },
      ],
      overdueClients: dbProj.overdueClients || [],
      unitsInventory,
      additionals,
      sales: mappedSales,
      quotes: dbProj.quotes || [],
      floorPlans: dbProj.floorPlans || [],
      documents: mappedDocuments,
      clientDocuments: dbProj.clientDocuments || [],
      paymentPlans: dbProj.paymentPlans || [],
      team: dbProj.team || [],
    };
  };

  const loadFromStorage = () => {
    if (typeof window === "undefined") return;

    const storedDev = localStorage.getItem("devio_developer_onboarding") || sessionStorage.getItem("devio_developer_onboarding");
    const storedLogo = localStorage.getItem("devio_developer_logo") || sessionStorage.getItem("devio_developer_logo");
    const storedUser = localStorage.getItem("devio_user_session") || sessionStorage.getItem("devio_user_session");
    const storedProjects = localStorage.getItem("devio_projects_state") || sessionStorage.getItem("devio_projects_state");
    const storedPlans = localStorage.getItem("devio_developer_payment_plans") || sessionStorage.getItem("devio_developer_payment_plans");

    if (storedLogo) {
      setDeveloperLogo(storedLogo);
    }

    if (storedProjects) {
      try {
        const parsed = JSON.parse(storedProjects);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setProjects(parsed.map(mapDbProjectToProjectItem));
        }
      } catch (e) {}
    }

    if (storedPlans) {
      try {
        const parsed = JSON.parse(storedPlans);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setPaymentPlans(parsed);
        }
      } catch (e) {}
    }

    if (storedDev) {
      try {
        const parsed = JSON.parse(storedDev);
        if (parsed.name) setDeveloperName(parsed.name);
        else if (parsed.commercialName) setDeveloperName(parsed.commercialName);
        else if (parsed.legalName) setDeveloperName(parsed.legalName);
        const l = parsed.logoPath || parsed.logoUrl || parsed.logo;
        if (l) {
          setDeveloperLogo(l);
          localStorage.setItem("devio_developer_logo", l);
        }
      } catch (e) {}
    }

    if (storedUser) {
      try {
        const parsed = JSON.parse(storedUser);
        if (parsed.fullName) setUserName(parsed.fullName);
        if (parsed.email) setUserEmail(parsed.email);
        if (parsed.role) setUserRole(parsed.role as UserRole);
        if (Array.isArray(parsed.permissions)) setUserPermissions(parsed.permissions);
        else if (parsed.role && DEFAULT_ROLE_PERMISSIONS[parsed.role as UserRole]) {
          setUserPermissions(DEFAULT_ROLE_PERMISSIONS[parsed.role as UserRole]);
        }
      } catch (e) {}
    }

    const storedImpersonation = localStorage.getItem("devio_impersonation") || sessionStorage.getItem("devio_impersonation");
    if (storedImpersonation) {
      try {
        const parsedImp = JSON.parse(storedImpersonation);
        if (parsedImp?.active) {
          if (parsedImp.userName) setUserName(parsedImp.userName);
          if (parsedImp.userEmail) setUserEmail(parsedImp.userEmail);
          if (parsedImp.developerName) setDeveloperName(parsedImp.developerName);
          if (parsedImp.developerLogo) {
            setDeveloperLogo(parsedImp.developerLogo);
            localStorage.setItem("devio_developer_logo", parsedImp.developerLogo);
          }
          if (parsedImp.role) setUserRole(parsedImp.role as UserRole);
          if (Array.isArray(parsedImp.projects) && parsedImp.projects.length > 0) {
            setProjects(parsedImp.projects.map(mapDbProjectToProjectItem));
          }
        }
      } catch (e) {}
    }
  };

  // Load from localStorage / sessionStorage & listen to updates + sync with live API
  useEffect(() => {
    loadFromStorage();

    // Verify session existence against database
    const storedUser = localStorage.getItem("devio_user_session") || sessionStorage.getItem("devio_user_session");
    if (storedUser) {
      try {
        const parsed = JSON.parse(storedUser);
        if (parsed?.email) {
          fetch("/api/auth/validate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: parsed.email }),
          })
            .then((res) => (res.ok ? res.json() : null))
            .then((resData) => {
              if (resData && resData.valid === false) {
                // User was deleted from DB / tables wiped!
                logout();
              }
            })
            .catch(() => {});
        }
      } catch (e) {}
    }

    // Fetch live developer and projects data from Supabase / API
    Promise.all([
      fetch("/api/developers").then((res) => (res.ok ? res.json() : null)).catch(() => null),
      fetch("/api/projects").then((res) => (res.ok ? res.json() : null)).catch(() => null),
    ])
      .then(([devData, projData]) => {
        let matchedDev: any = null;
        let activeDevId = "";
        let activeDevName = "";
        let currentEmail = "";

        const storedUser = localStorage.getItem("devio_user_session") || sessionStorage.getItem("devio_user_session");
        const storedDev = localStorage.getItem("devio_developer_onboarding") || sessionStorage.getItem("devio_developer_onboarding");
        const storedImp = localStorage.getItem("devio_impersonation") || sessionStorage.getItem("devio_impersonation");

        if (storedImp) {
          try {
            const imp = JSON.parse(storedImp);
            if (imp.active) {
              currentEmail = imp.userEmail || "";
              activeDevName = imp.developerName || "";
              activeDevId = imp.developerId || "";
            }
          } catch (e) {}
        }

        if (!currentEmail && storedUser) {
          try {
            const u = JSON.parse(storedUser);
            currentEmail = u.email || "";
            activeDevName = u.activeDeveloper || "";
          } catch (e) {}
        }

        if (!activeDevName && storedDev) {
          try {
            const d = JSON.parse(storedDev);
            activeDevName = d.name || d.commercialName || "";
            activeDevId = d.id || "";
          } catch (e) {}
        }

        if (devData && devData.success && Array.isArray(devData.developers) && devData.developers.length > 0) {
          matchedDev = devData.developers.find((d: any) => {
            if (activeDevId && d.id === activeDevId) return true;
            if (activeDevName && d.name.toLowerCase() === activeDevName.toLowerCase()) return true;
            if (currentEmail) {
              return (
                (d.memberships || []).some((m: any) => m.user?.email?.toLowerCase().trim() === currentEmail.toLowerCase().trim()) ||
                d.email?.toLowerCase().trim() === currentEmail.toLowerCase().trim()
              );
            }
            return false;
          });

          // Fallback to first developer if single developer exists
          if (!matchedDev && devData.developers.length === 1) {
            matchedDev = devData.developers[0];
          }

          if (matchedDev) {
            setDeveloperName(matchedDev.name);
            const dLogo = matchedDev.logoPath || matchedDev.logo || matchedDev.logoUrl || "";
            if (dLogo) {
              setDeveloperLogo(dLogo);
              localStorage.setItem("devio_developer_logo", dLogo);
              sessionStorage.setItem("devio_developer_logo", dLogo);
            }
          }
        }

        // Process projects from either /api/projects or developer projects
        let candidateProjects: any[] = [];
        if (projData && projData.success && Array.isArray(projData.projects) && projData.projects.length > 0) {
          candidateProjects = projData.projects;
          if (matchedDev) {
            const filtered = candidateProjects.filter((p: any) => p.developerId === matchedDev.id);
            if (filtered.length > 0) candidateProjects = filtered;
          }
        } else if (matchedDev && Array.isArray(matchedDev.projects) && matchedDev.projects.length > 0) {
          candidateProjects = matchedDev.projects;
        }

        if (candidateProjects.length > 0) {
          const mapped = candidateProjects.map(mapDbProjectToProjectItem);
          setProjects(mapped);
          localStorage.setItem("devio_projects_state", JSON.stringify(mapped));
          sessionStorage.setItem("devio_projects_state", JSON.stringify(mapped));
        }
      })
      .catch((err) => console.warn("Could not sync projects from API:", err));

    const handleStorageUpdate = () => {
      loadFromStorage();
    };

    window.addEventListener("storage", handleStorageUpdate);
    window.addEventListener("devio_projects_updated", handleStorageUpdate);
    window.addEventListener("devio_payment_plans_updated", handleStorageUpdate);
    window.addEventListener("devio_postventa_updated", handleStorageUpdate);
    window.addEventListener("devio_developer_updated", handleStorageUpdate);

    return () => {
      window.removeEventListener("storage", handleStorageUpdate);
      window.removeEventListener("devio_projects_updated", handleStorageUpdate);
      window.removeEventListener("devio_payment_plans_updated", handleStorageUpdate);
      window.removeEventListener("devio_postventa_updated", handleStorageUpdate);
      window.removeEventListener("devio_developer_updated", handleStorageUpdate);
    };
  }, []);

  const savePaymentPlans = (newPlans: DeveloperPaymentPlan[]) => {
    setPaymentPlans(newPlans);
    if (typeof window !== "undefined") {
      localStorage.setItem("devio_developer_payment_plans", JSON.stringify(newPlans));
      sessionStorage.setItem("devio_developer_payment_plans", JSON.stringify(newPlans));
      window.dispatchEvent(new Event("devio_payment_plans_updated"));
    }
  };

  const addPaymentPlan = (planData: Omit<DeveloperPaymentPlan, "id">) => {
    const newPlan: DeveloperPaymentPlan = {
      ...planData,
      id: `plan-${Date.now()}`,
    };
    const updated = [...paymentPlans, newPlan];
    savePaymentPlans(updated);
    showToast("Plan Creado", `Se guardó "${newPlan.name}" en los planes de la desarrolladora.`);
  };

  const updatePaymentPlan = (id: string, updatedFields: Partial<DeveloperPaymentPlan>) => {
    const updated = paymentPlans.map((p) => (p.id === id ? { ...p, ...updatedFields } : p));
    savePaymentPlans(updated);
    showToast("Plan Actualizado", "Los cambios en el plan de pago se guardaron exitosamente.");
  };

  const deletePaymentPlan = (id: string) => {
    const updated = paymentPlans.filter((p) => p.id !== id);
    savePaymentPlans(updated);
    showToast("Plan Eliminado", "El plan de pago fue retirado del catálogo.");
  };

  const refreshProjects = () => {
    loadFromStorage();
  };

  const addProject = (newProject: ProjectItem) => {
    const mappedNew = mapDbProjectToProjectItem(newProject);
    setProjects((prev) => {
      const updated = [mappedNew, ...prev.filter((p) => p.id !== mappedNew.id)];
      if (typeof window !== "undefined") {
        localStorage.setItem("devio_projects_state", JSON.stringify(updated));
        sessionStorage.setItem("devio_projects_state", JSON.stringify(updated));
      }
      return updated;
    });

    // Persistir en Supabase (Prisma)
    let devId = (newProject as any).developerId;
    if (!devId && typeof window !== "undefined") {
      try {
        const storedDev = localStorage.getItem("devio_active_developer") || sessionStorage.getItem("devio_active_developer") || localStorage.getItem("devio_developer_onboarding");
        if (storedDev) {
          const parsed = JSON.parse(storedDev);
          if (parsed?.id && !parsed.id.startsWith("dev-")) devId = parsed.id;
        }
      } catch (e) {}
    }

    fetch("/api/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...newProject,
        developerId: devId,
        developerName: developerName,
        userEmail: userEmail || undefined,
      }),
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((resData) => {
        if (resData?.project?.id) {
          setProjects((prev) =>
            prev.map((p) => (p.id === newProject.id ? { ...p, id: resData.project.id } : p))
          );
        }
      })
      .catch((err) => console.warn("Could not save project to API:", err));
  };

  const resetToCleanState = () => {
    setProjects([]);
    setPaymentPlans([]);
    setDeveloperName("Mi Desarrolladora");
    if (typeof window !== "undefined") {
      localStorage.removeItem("devio_projects_state");
      sessionStorage.removeItem("devio_projects_state");
      localStorage.removeItem("devio_developer_payment_plans");
      sessionStorage.removeItem("devio_developer_payment_plans");
    }
    showToast("Cuenta Limpia", "Se restableció el estado a limpio.", "info");
  };

  const loadDemoData = () => {
    setProjects([]);
    setPaymentPlans([]);
  };

  const saveProjects = (newProjects: ProjectItem[]) => {
    setProjects(newProjects);
    if (typeof window !== "undefined") {
      localStorage.setItem("devio_projects_state", JSON.stringify(newProjects));
      sessionStorage.setItem("devio_projects_state", JSON.stringify(newProjects));
      window.dispatchEvent(new Event("devio_projects_updated"));
    }
  };

  const showToast = (title: string, desc: string, type: "success" | "info" | "warning" = "success") => {
    setToast({ title, desc, type });
    setTimeout(() => {
      setToast(null);
    }, 4500);
  };

  const hideToast = () => setToast(null);

  const formatMoney = (amount: number): string => {
    const finalAmount = currency === "USD" ? amount / banxicoRate : amount;
    return new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: currency,
      maximumFractionDigits: 0,
    }).format(finalAmount || 0);
  };

  const getProject = (id: string): ProjectItem | undefined => {
    return projects.find((p) => p.id === id) || projects[0];
  };

  const updateUnit = (projectId: string, unitNumber: string, updatedFields: Partial<UnitItem>) => {
    const updated = projects.map((p) => {
      if (p.id !== projectId) return p;
      const isAvailable = updatedFields.status === "DISPONIBLE";
      const newInventory = p.unitsInventory.map((u) => {
        if (u.unit !== unitNumber) return u;
        return {
          ...u,
          ...updatedFields,
          ...(isAvailable
            ? {
                client: "-",
                coOwners: undefined,
                saleFolio: undefined,
                saleDate: undefined,
                salePlanName: undefined,
                salePaidAmount: undefined,
                salePendingAmount: undefined,
              }
            : {}),
        };
      });

      // Synchronize additionals: if unit is made DISPONIBLE, release assigned additionals
      const updatedAdditionals = (p.additionals || []).map((a) => {
        if (a.assignedToUnit === unitNumber && isAvailable) {
          return {
            ...a,
            status: "DISPONIBLE" as const,
            assignedToUnit: undefined,
          };
        }
        return a;
      });

      // Synchronize sales: if unit is made DISPONIBLE, purge sale from sales list
      const updatedSales = isAvailable
        ? (p.sales || []).filter((s) => s.unit !== unitNumber)
        : (p.sales || []);

      const soldCount = newInventory.filter((u) => u.status === "VENDIDA").length;
      const availCount = newInventory.filter((u) => u.status === "DISPONIBLE").length;
      const blockedCount = newInventory.filter((u) => u.status === "BLOQUEADA").length;
      const totalCount = p.totalUnits || (newInventory.length > 0 ? newInventory.length : 1);

      const valorComercialTotal = newInventory.reduce((acc, u) => acc + (u.price || 0), 0);
      const soldUnitsPriceSum = newInventory.filter((u) => u.status === "VENDIDA").reduce((acc, u) => acc + (u.price || 0), 0);
      const activeSales = updatedSales.filter((s) => s.status === "ACTIVA" || s.status === "PAGADA");
      const totalCobrado = activeSales.reduce((acc, s) => acc + (s.paidAmount || 0), 0);
      const porCobrar = Math.max(0, soldUnitsPriceSum - totalCobrado);

      return {
        ...p,
        soldUnits: soldCount,
        availableUnits: availCount,
        blockedUnits: blockedCount,
        unitsInventory: newInventory,
        additionals: updatedAdditionals,
        sales: updatedSales,
        metrics: {
          ...p.metrics,
          unidadesVendidasCount: soldCount,
          porVenderUnidades: availCount,
          avanceVentasPct: totalCount > 0 ? Math.round((soldCount / totalCount) * 100) : 0,
          valorComercialTotal,
          valorComercialVendido: soldUnitsPriceSum,
          porVenderMonto: Math.max(0, valorComercialTotal - soldUnitsPriceSum),
          totalCobrado,
          porCobrar,
          totalFacturado: soldUnitsPriceSum,
          flujoFuturoMonto: totalCobrado + porCobrar,
        },
      };
    });
    saveProjects(updated);
    showToast("Unidad Actualizada", `Los cambios en la unidad ${unitNumber} fueron guardados.`);

    // Persist to Prisma DB
    fetch("/api/units", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        projectId,
        unitNumber,
        status: updatedFields.status,
        price: updatedFields.price,
        areaM2: updatedFields.areaM2,
        floor: updatedFields.floor,
      }),
    }).catch((err) => console.warn("Could not sync unit update with backend:", err));
  };

  const updateMultipleUnits = (projectId: string, updatedUnits: UnitItem[]) => {
    const updatedMap = new Map<string, UnitItem>();
    updatedUnits.forEach((u) => updatedMap.set(u.unit, u));

    const updated = projects.map((p) => {
      if (p.id !== projectId) return p;

      const newInventory = p.unitsInventory.map((u) => {
        if (updatedMap.has(u.unit)) {
          return { ...u, ...updatedMap.get(u.unit)! };
        }
        return u;
      });

      const soldCount = newInventory.filter((u) => u.status === "VENDIDA").length;
      const availCount = newInventory.filter((u) => u.status === "DISPONIBLE").length;
      const blockedCount = newInventory.filter((u) => u.status === "BLOQUEADA").length;
      const totalCount = p.totalUnits || (newInventory.length > 0 ? newInventory.length : 1);

      const valorComercialTotal = newInventory.reduce((acc, u) => acc + (u.price || 0), 0);
      const soldUnitsPriceSum = newInventory.filter((u) => u.status === "VENDIDA").reduce((acc, u) => acc + (u.price || 0), 0);
      const activeSales = (p.sales || []).filter((s) => s.status === "ACTIVA" || s.status === "PAGADA");
      const totalCobrado = activeSales.reduce((acc, s) => acc + (s.paidAmount || 0), 0);
      const porCobrar = Math.max(0, soldUnitsPriceSum - totalCobrado);
      const precioPromedio = newInventory.length > 0 ? Math.round(valorComercialTotal / newInventory.length) : 0;

      return {
        ...p,
        soldUnits: soldCount,
        availableUnits: availCount,
        blockedUnits: blockedCount,
        unitsInventory: newInventory,
        metrics: {
          ...p.metrics,
          unidadesTotalesCount: totalCount,
          unidadesVendidasCount: soldCount,
          porVenderUnidades: availCount,
          avanceVentasPct: totalCount > 0 ? Math.round((soldCount / totalCount) * 100) : 0,
          valorComercialTotal,
          valorComercialVendido: soldUnitsPriceSum,
          porVenderMonto: Math.max(0, valorComercialTotal - soldUnitsPriceSum),
          precioPromedio,
          totalCobrado,
          porCobrar,
          totalFacturado: soldUnitsPriceSum,
          flujoFuturoMonto: totalCobrado + porCobrar,
        },
      };
    });

    saveProjects(updated);

    // Persist bulk unit updates to backend
    updatedUnits.forEach((u) => {
      fetch("/api/units", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId,
          unitNumber: u.unit,
          status: u.status,
          price: u.price,
          areaM2: u.areaM2,
          floor: u.floor,
        }),
      }).catch(() => {});
    });
  };

  const updateBulkPrices = (projectId: string, pctIncrease: number, unitNumbers?: string[]) => {
    const todayStr = new Date().toLocaleDateString("es-MX");
    const updated = projects.map((p) => {
      if (p.id !== projectId) return p;
      const newInventory = p.unitsInventory.map((u) => {
        // Only update available units
        if (u.status !== "DISPONIBLE") return u;
        if (unitNumbers && unitNumbers.length > 0 && !unitNumbers.includes(u.unit)) return u;

        const previousPrice = u.price;
        const newPrice = Math.round(previousPrice * (1 + pctIncrease / 100));
        const historyItem = {
          date: todayStr,
          previousPrice,
          newPrice,
          pctChange: pctIncrease,
          reason: `Aumento masivo del ${pctIncrease}%`,
          user: userName,
        };

        return {
          ...u,
          price: newPrice,
          priceHistory: [...(u.priceHistory || []), historyItem],
        };
      });

      const soldCount = newInventory.filter((u) => u.status === "VENDIDA").length;
      const availCount = newInventory.filter((u) => u.status === "DISPONIBLE").length;
      const blockedCount = newInventory.filter((u) => u.status === "BLOQUEADA").length;
      const totalCount = p.totalUnits || (newInventory.length > 0 ? newInventory.length : 1);

      const valorComercialTotal = newInventory.reduce((acc, u) => acc + (u.price || 0), 0);
      const soldUnitsPriceSum = newInventory.filter((u) => u.status === "VENDIDA").reduce((acc, u) => acc + (u.price || 0), 0);
      const activeSales = (p.sales || []).filter((s) => s.status === "ACTIVA" || s.status === "PAGADA");
      const totalCobrado = activeSales.reduce((acc, s) => acc + (s.paidAmount || 0), 0);
      const porCobrar = Math.max(0, soldUnitsPriceSum - totalCobrado);
      const precioPromedio = newInventory.length > 0 ? Math.round(valorComercialTotal / newInventory.length) : 0;

      return {
        ...p,
        soldUnits: soldCount,
        availableUnits: availCount,
        blockedUnits: blockedCount,
        unitsInventory: newInventory,
        metrics: {
          ...p.metrics,
          unidadesTotalesCount: totalCount,
          unidadesVendidasCount: soldCount,
          porVenderUnidades: availCount,
          avanceVentasPct: totalCount > 0 ? Math.round((soldCount / totalCount) * 100) : 0,
          valorComercialTotal,
          valorComercialVendido: soldUnitsPriceSum,
          porVenderMonto: Math.max(0, valorComercialTotal - soldUnitsPriceSum),
          precioPromedio,
          totalCobrado,
          porCobrar,
          totalFacturado: soldUnitsPriceSum,
          flujoFuturoMonto: totalCobrado + porCobrar,
        },
      };
    });
    saveProjects(updated);
    showToast("Precios Actualizados", `Se aplicó un incremento de +${pctIncrease}% a las unidades disponibles.`);
  };

  const updateProjectAdditionals = (projectId: string, additionals: ProjectAdditional[]) => {
    const updated = projects.map((p) => {
      if (p.id !== projectId) return p;
      return {
        ...p,
        additionals,
      };
    });
    saveProjects(updated);
    showToast("Adicionales Guardados", `Se guardaron ${additionals.length} adicionales en el catálogo.`);

    // Persist to Supabase
    fetch("/api/additionals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ projectId, additionals }),
    }).catch((err) => console.warn("Could not sync additionals with backend:", err));
  };

  const addSale = (salePayload: any) => {
    const rawProjId = salePayload.project?.id;
    const targetProject = projects.find((p) => p.id === rawProjId) || projects[0];
    if (!targetProject) return;
    const projId = targetProject.id;

    const unitNum = String(salePayload.unit?.number || "").trim();
    const primaryName = salePayload.client?.name || "Cliente Devio";
    const coOwners: CoOwner[] = (salePayload.coOwners && salePayload.coOwners.length > 0)
      ? salePayload.coOwners
      : [
          {
            id: `co-${Date.now()}`,
            name: primaryName,
            email: salePayload.client?.email || "",
            phone: salePayload.client?.phone || "",
            rfc: salePayload.client?.rfc || "",
            ownershipPct: 100,
            isPrimary: true,
          },
        ];

    // Format client summary display text
    const clientSummary =
      coOwners.length > 1
        ? coOwners.map((c) => `${c.name} (${c.ownershipPct}%)`).join(" + ")
        : primaryName;

    const netSaleTotal = Number(salePayload.financials?.totalSale || salePayload.financials?.netTotalSale) || (Number(salePayload.unit?.price) || 0);
    const initialPaid = salePayload.initialPayment?.registered ? (Number(salePayload.initialPayment?.amount) || 0) : 0;
    const pendingAmount = Math.max(0, netSaleTotal - initialPaid);
    const saleFolio = salePayload.folio || `VTA-2026-${Math.floor(100 + Math.random() * 900)}`;
    const saleDateIso = salePayload.createdAt || new Date().toISOString();
    const planName = salePayload.financials?.planName || "Plan de Pago";

    // 1. Build Schedule (Cuotas Programadas)
    let remainingInitialForSchedule = initialPaid;
    let constructedSchedule: SaleScheduleInstallment[] = [];

    if (salePayload.schedule && Array.isArray(salePayload.schedule) && salePayload.schedule.length > 0) {
      constructedSchedule = salePayload.schedule.map((s: any, idx: number) => {
        const scheduledAmount = Number(s.scheduledAmount ?? s.amount) || 0;
        let paidForThis = 0;
        if (remainingInitialForSchedule > 0) {
          paidForThis = Math.min(remainingInitialForSchedule, scheduledAmount);
          remainingInitialForSchedule -= paidForThis;
        }
        const pendingForThis = Math.max(0, scheduledAmount - paidForThis);
        const scheduledDateVal = s.scheduledDate || s.date || (saleDateIso ? new Date(saleDateIso).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10));
        const instId = s.id && String(s.id).includes(unitNum) ? s.id : `inst-${unitNum}-${s.id || idx}`;
        return {
          id: instId,
          concept: s.concept || (idx === 0 ? "Enganche" : `Mensualidad ${idx}`),
          scheduledDate: scheduledDateVal,
          scheduledAmount,
          paidAmount: paidForThis,
          pendingAmount: pendingForThis,
          paymentDate: paidForThis > 0 ? new Date().toLocaleDateString("es-MX") : undefined,
          paymentMethod: paidForThis > 0 ? (salePayload.initialPayment?.method || "SPEI") : undefined,
          status: (pendingForThis === 0 ? "Pagado" : paidForThis > 0 ? "Parcial" : "Pendiente") as "Pagado" | "Parcial" | "Pendiente",
          planName,
        };
      });
    } else {
      // Default fallback schedule: Enganche 20%, 12 Mensualidades (50%), Liquidación (30%)
      const downPaymentAmount = Math.round(netSaleTotal * 0.2);
      const balloonAmount = Math.round(netSaleTotal * 0.3);
      const monthlyTotal = Math.max(0, netSaleTotal - downPaymentAmount - balloonAmount);
      const monthlyAmount = Math.round(monthlyTotal / 12);

      const items = [
        { concept: "Enganche Inicial", amount: downPaymentAmount, date: "17 Ago 2026" },
        ...Array.from({ length: 12 }, (_, i) => ({
          concept: `Mensualidad ${i + 1}`,
          amount: monthlyAmount,
          date: `17 ${["Sep", "Oct", "Nov", "Dic", "Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago"][i % 12]} 2026`,
        })),
        { concept: "Liquidación y Entrega", amount: balloonAmount, date: "17 Sep 2027" },
      ];

      constructedSchedule = items.map((item, idx) => {
        let paidForThis = 0;
        if (remainingInitialForSchedule > 0) {
          paidForThis = Math.min(remainingInitialForSchedule, item.amount);
          remainingInitialForSchedule -= paidForThis;
        }
        const pendingForThis = Math.max(0, item.amount - paidForThis);
        return {
          id: `inst-${Date.now()}-${idx}`,
          concept: item.concept,
          scheduledDate: item.date,
          scheduledAmount: item.amount,
          paidAmount: paidForThis,
          pendingAmount: pendingForThis,
          paymentDate: paidForThis > 0 ? new Date().toLocaleDateString("es-MX") : undefined,
          paymentMethod: paidForThis > 0 ? (salePayload.initialPayment?.method || "SPEI") : undefined,
          status: (pendingForThis === 0 ? "Pagado" : paidForThis > 0 ? "Parcial" : "Pendiente") as "Pagado" | "Parcial" | "Pendiente",
          planName,
        };
      });
    }

    // 2. Build Initial Payment Receipt (Transacción Real)
    const initialPaymentsList: SalePaymentReceipt[] = initialPaid > 0 ? [
      {
        id: `pay-rec-${Date.now()}`,
        receiptFolio: `REC-${new Date().getFullYear()}-001`,
        paymentDate: new Date().toLocaleDateString("es-MX"),
        amount: initialPaid,
        paymentMethod: salePayload.initialPayment?.method || "SPEI",
        unit: unitNum,
        reference: salePayload.initialPayment?.reference || "ENGANCHE-INICIAL",
        notes: "Pago de enganche inicial al formalizar venta",
        scheduledAmount: initialPaid,
        scheduledDate: saleDateIso,
        sendReceiptEmail: Boolean(salePayload.initialPayment?.sendReceiptEmail),
        createdAt: new Date().toISOString(),
      }
    ] : [];

    const rawClientId = salePayload.client?.id;
    const resolvedClientId = (rawClientId && rawClientId !== "primary-1")
      ? rawClientId
      : salePayload.client?.email
      ? `cli-${salePayload.client.email.toLowerCase().replace(/[^a-z0-9]/g, "-")}`
      : `cli-${Date.now()}`;

    const newSaleRecord: SaleRecord = {
      id: salePayload.id || `sale-${Date.now()}`,
      folio: saleFolio,
      clientId: resolvedClientId,
      clientName: primaryName,
      clientEmail: salePayload.client?.email || "",
      clientPhone: salePayload.client?.phone || "",
      clientRfc: salePayload.client?.rfc || "",
      unit: unitNum,
      paymentPlan: planName,
      totalPrice: netSaleTotal,
      paidAmount: initialPaid,
      pendingAmount,
      saleDate: saleDateIso,
      coOwners,
      additionals: salePayload.additionals || [],
      schedule: constructedSchedule,
      payments: initialPaymentsList,
      status: "ACTIVA",
    };

    const updated = projects.map((p) => {
      if (p.id !== projId) return p;

      // 1. Update Units Inventory
      let unitFound = false;
      const newInventory = p.unitsInventory.map((u) => {
        if (u.unit.toLowerCase() === unitNum.toLowerCase() || (salePayload.unit?.id && u.id === salePayload.unit?.id)) {
          unitFound = true;
          return {
            ...u,
            status: "VENDIDA" as const,
            client: clientSummary,
            coOwners,
            price: Number(salePayload.financials?.unitPrice) || Number(salePayload.unit?.price) || u.price,
            saleFolio,
            saleDate: saleDateIso,
            salePlanName: planName,
            salePaidAmount: initialPaid,
            salePendingAmount: pendingAmount,
          };
        }
        return u;
      });

      // 2. Update Additionals if included in the sale
      let updatedAdditionals = p.additionals ? [...p.additionals] : [];
      if (salePayload.additionals && Array.isArray(salePayload.additionals) && salePayload.additionals.length > 0) {
        const soldAddonIds = new Set(salePayload.additionals.map((a: any) => a.id));
        updatedAdditionals = updatedAdditionals.map((a) => {
          if (soldAddonIds.has(a.id)) {
            return {
              ...a,
              status: "VENDIDO" as const,
              assignedToUnit: unitNum,
            };
          }
          return a;
        });
      }

      // 3. Update Sales list
      const existingSales = p.sales || [];
      const updatedSales = [newSaleRecord, ...existingSales.filter((s) => s.unit !== unitNum)];

      // 4. Recompute counts and metrics
      const soldUnitsCount = newInventory.filter((u) => u.status === "VENDIDA").length;
      const availUnitsCount = newInventory.filter((u) => u.status === "DISPONIBLE").length;
      const blockedUnitsCount = newInventory.filter((u) => u.status === "BLOQUEADA").length;
      const totalUnitsCount = p.totalUnits || (newInventory.length > 0 ? newInventory.length : 1);

      const valorComercialTotal = newInventory.reduce((acc, u) => acc + (u.price || 0), 0);
      const soldUnitsPriceSum = newInventory.filter((u) => u.status === "VENDIDA").reduce((acc, u) => acc + (u.price || 0), 0);
      const soldAdditionalsPriceSum = updatedAdditionals.filter((a) => a.status === "VENDIDO").reduce((acc, a) => acc + (a.price || 0), 0);
      const valorComercialVendido = soldUnitsPriceSum + soldAdditionalsPriceSum;
      const porVenderMonto = Math.max(0, valorComercialTotal - soldUnitsPriceSum);
      const activeSales = updatedSales.filter((s) => s.status !== "CANCELADA");
      const newTotalCobrado = activeSales.reduce((acc, s) => acc + (s.paidAmount || 0), 0);
      const newPorCobrar = Math.max(0, valorComercialVendido - newTotalCobrado);

      // 5. Update Monthly Billing Window
      const MONTH_NAMES = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
      const currentMonthName = MONTH_NAMES[new Date().getMonth()] || "Sep";
      const updatedBilling = (p.monthlyBilling || []).map((b) => {
        if (b.month.toLowerCase().startsWith(currentMonthName.toLowerCase().slice(0, 3))) {
          return {
            ...b,
            cobrado: (b.cobrado || 0) + initialPaid,
            porCobrar: (b.porCobrar || 0) + pendingAmount,
          };
        }
        return b;
      });

      return {
        ...p,
        soldUnits: soldUnitsCount,
        availableUnits: availUnitsCount,
        blockedUnits: blockedUnitsCount,
        unitsInventory: newInventory,
        additionals: updatedAdditionals,
        monthlyBilling: updatedBilling,
        sales: updatedSales,
        metrics: {
          ...p.metrics,
          unidadesVendidasCount: soldUnitsCount,
          porVenderUnidades: availUnitsCount,
          avanceVentasPct: totalUnitsCount > 0 ? Math.round((soldUnitsCount / totalUnitsCount) * 100) : 0,
          valorComercialTotal,
          valorComercialVendido,
          porVenderMonto,
          totalCobrado: newTotalCobrado,
          porCobrar: newPorCobrar,
          totalFacturado: valorComercialVendido,
          flujoFuturoMonto: newTotalCobrado + newPorCobrar,
          precioPromedio: totalUnitsCount > 0 ? Math.round(valorComercialTotal / totalUnitsCount) : 0,
          inventarioMonetarioPct: valorComercialTotal > 0 ? Math.round((valorComercialVendido / valorComercialTotal) * 100) : 0,
        },
      };
    });

    saveProjects(updated);
    showToast("Venta Registrada Exitosamente", `Folio ${saleFolio} guardado para la unidad ${unitNum}.`, "success");

    // Persistir en Supabase (Prisma)
    fetch("/api/sales", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        projectId: rawProjId || projId,
        unitNumber: unitNum,
        unitId: salePayload.unit?.id,
        client: salePayload.client,
        coOwners,
        financials: salePayload.financials,
        schedule: salePayload.schedule,
        initialPayment: salePayload.initialPayment,
        folio: saleFolio,
        additionals: salePayload.additionals,
      }),
    }).catch((err) => console.warn("Could not save sale to API:", err));
  };

  const registerPayment = (
    projectId: string,
    paymentPayload: {
      unitNumber: string;
      amount: number;
      paymentDate: string;
      paymentMethod: string;
      reference?: string;
      notes?: string;
      voucherName?: string;
      sendReceiptEmail?: boolean;
      moratoryAction?: string;
      moratoryAmount?: number;
      waiveReason?: string;
    }
  ) => {
    const targetProject = projects.find((p) => p.id === projectId) || projects[0];
    if (!targetProject) return;

    const unitNum = String(paymentPayload.unitNumber || "").trim();
    const payAmount = Number(paymentPayload.amount) || 0;
    if (payAmount <= 0) return;

    const todayStr = paymentPayload.paymentDate || new Date().toLocaleDateString("es-MX");

    const updated = projects.map((p) => {
      if (p.id !== targetProject.id) return p;

      // Find unit
      const unitObj = p.unitsInventory.find((u) => u.unit === unitNum);
      if (!unitObj) return p;

      // Find or synthesize existing sale
      const existingSales = p.sales || [];
      let sale = existingSales.find((s) => s.unit === unitNum);

      if (!sale) {
        // Synthesize sale for legacy unit
        const unitPrice = unitObj.price || 0;
        const initialPaid = unitObj.salePaidAmount || 0;
        const pending = Math.max(0, unitPrice - initialPaid);
        sale = {
          id: `sale-${unitNum}-${Date.now()}`,
          folio: unitObj.saleFolio || `VTA-2026-${unitNum}`,
          clientName: unitObj.client || "Cliente Propietario",
          clientEmail: unitObj.coOwners?.[0]?.email || "",
          clientPhone: unitObj.coOwners?.[0]?.phone || "",
          clientRfc: unitObj.coOwners?.[0]?.rfc || "",
          unit: unitNum,
          paymentPlan: unitObj.salePlanName || "Plan Tradicional",
          totalPrice: unitPrice,
          paidAmount: initialPaid,
          pendingAmount: pending,
          saleDate: unitObj.saleDate || new Date().toISOString(),
          coOwners: unitObj.coOwners,
          schedule: [
            {
              id: `inst-${unitNum}-1`,
              concept: "Enganche",
              scheduledDate: "17 Ago 2026",
              scheduledAmount: Math.round(unitPrice * 0.2),
              paidAmount: Math.min(initialPaid, Math.round(unitPrice * 0.2)),
              pendingAmount: Math.max(0, Math.round(unitPrice * 0.2) - initialPaid),
              status: initialPaid >= Math.round(unitPrice * 0.2) ? "Pagado" : "Pendiente",
            },
            {
              id: `inst-${unitNum}-2`,
              concept: "Mensualidad 1",
              scheduledDate: "17 Sep 2026",
              scheduledAmount: Math.round(unitPrice * 0.1),
              paidAmount: 0,
              pendingAmount: Math.round(unitPrice * 0.1),
              status: "Pendiente",
            },
            {
              id: `inst-${unitNum}-3`,
              concept: "Mensualidad 2",
              scheduledDate: "17 Oct 2026",
              scheduledAmount: Math.round(unitPrice * 0.1),
              paidAmount: 0,
              pendingAmount: Math.round(unitPrice * 0.1),
              status: "Pendiente",
            },
            {
              id: `inst-${unitNum}-4`,
              concept: "Liquidación",
              scheduledDate: "17 Nov 2026",
              scheduledAmount: Math.round(unitPrice * 0.6),
              paidAmount: 0,
              pendingAmount: Math.round(unitPrice * 0.6),
              status: "Pendiente",
            },
          ],
          payments: initialPaid > 0 ? [
            {
              id: `pay-rec-${Date.now()}-0`,
              receiptFolio: "REC-2026-001",
              paymentDate: "17 Ago 2026",
              amount: initialPaid,
              paymentMethod: "SPEI",
              unit: unitNum,
              reference: "ENGANCHE-INICIAL",
              notes: "Pago de enganche inicial",
              createdAt: new Date().toISOString(),
            }
          ] : [],
          status: "ACTIVA",
        };
      }

      const currentPayments = sale.payments || [];
      const nextReceiptFolio = `REC-${new Date().getFullYear()}-${String(currentPayments.length + 1).padStart(3, "0")}`;
      const moratoryCharged = Number(paymentPayload.moratoryAmount) || 0;
      const principalToAllocate = Math.max(0, payAmount - moratoryCharged);

      const newReceipt: SalePaymentReceipt = {
        id: `pay-rec-${Date.now()}`,
        receiptFolio: nextReceiptFolio,
        paymentDate: todayStr,
        amount: payAmount,
        paymentMethod: paymentPayload.paymentMethod,
        unit: unitNum,
        reference: paymentPayload.reference || `SPEI-${Math.floor(10000000 + Math.random() * 90000000)}`,
        notes: paymentPayload.notes || (paymentPayload.waiveReason ? `Acuerdo: ${paymentPayload.waiveReason}` : "Abono a cuenta"),
        voucherUrl: paymentPayload.voucherName ? `/vouchers/${paymentPayload.voucherName}` : undefined,
        sendReceiptEmail: Boolean(paymentPayload.sendReceiptEmail),
        moratoryAmount: moratoryCharged > 0 ? moratoryCharged : undefined,
        moratoryAction: paymentPayload.moratoryAction,
        waiveReason: paymentPayload.waiveReason,
        createdAt: new Date().toISOString(),
      };

      // CASCADE ALLOCATION DOWN SCHEDULE CHRONOLOGICALLY FOR PRINCIPAL
      let remainingToAllocate = principalToAllocate;
      const updatedSchedule = (sale.schedule || []).map((inst) => {
        if (remainingToAllocate <= 0 || inst.pendingAmount <= 0) {
          return inst;
        }
        const alloc = Math.min(remainingToAllocate, inst.pendingAmount);
        const newPaid = inst.paidAmount + alloc;
        const newPending = Math.max(0, inst.pendingAmount - alloc);
        remainingToAllocate -= alloc;

        return {
          ...inst,
          paidAmount: newPaid,
          pendingAmount: newPending,
          paymentDate: todayStr,
          paymentMethod: paymentPayload.paymentMethod,
          status: (newPending === 0 ? "Pagado" : "Parcial") as "Pagado" | "Parcial",
          moratoryInterest: newPending === 0 ? 0 : inst.moratoryInterest,
        };
      });

      const newUnitPaid = (unitObj.salePaidAmount || 0) + principalToAllocate;
      const newUnitPending = Math.max(0, (unitObj.price || 0) - newUnitPaid);

      const updatedSale: SaleRecord = {
        ...sale,
        paidAmount: newUnitPaid,
        pendingAmount: newUnitPending,
        schedule: updatedSchedule,
        payments: [newReceipt, ...currentPayments],
        status: newUnitPending === 0 ? "PAGADA" : "ACTIVA",
      };

      const newSales = [updatedSale, ...existingSales.filter((s) => s.unit !== unitNum)];

      // Update unit in inventory
      const newInventory = p.unitsInventory.map((u) => {
        if (u.unit !== unitNum) return u;
        return {
          ...u,
          salePaidAmount: newUnitPaid,
          salePendingAmount: newUnitPending,
        };
      });

      // Update metrics
      const activeSales = newSales.filter((s) => s.status !== "CANCELADA");
      const newTotalCobrado = activeSales.reduce((acc, s) => acc + (s.paidAmount || 0), 0);
      const newPorCobrar = Math.max(0, (p.metrics?.valorComercialVendido || 0) - newTotalCobrado);

      return {
        ...p,
        unitsInventory: newInventory,
        sales: newSales,
        metrics: {
          ...p.metrics,
          totalCobrado: newTotalCobrado,
          porCobrar: newPorCobrar,
          flujoFuturoMonto: newTotalCobrado + newPorCobrar,
        },
      };
    });

    saveProjects(updated);
    showToast("Pago Registrado Exitosamente", `Se abonaron ${formatMoney(payAmount)} a la unidad ${unitNum}.`, "success");

    // Persistir en Supabase (Prisma)
    fetch("/api/payments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        projectId,
        unitNumber: paymentPayload.unitNumber,
        amount: paymentPayload.amount,
        paymentDate: paymentPayload.paymentDate,
        paymentMethod: paymentPayload.paymentMethod,
        reference: paymentPayload.reference,
        notes: paymentPayload.notes,
      }),
    }).catch((err) => console.warn("Could not save payment to API:", err));
  };

  const updateSaleScheduleInstallment = (
    projectId: string,
    unitNumber: string,
    installmentId: string,
    updatedFields: {
      scheduledAmount?: number;
      scheduledDate?: string;
      concept?: string;
    }
  ) => {
    const targetProject = projects.find((p) => p.id === projectId) || projects[0];
    if (!targetProject) return;

    const updated = projects.map((p) => {
      if (p.id !== targetProject.id) return p;

      const existingSales = p.sales || [];
      const sale = existingSales.find((s) => s.unit === unitNumber);
      if (!sale) return p;

      // 1. Update the scheduled installment fields
      const updatedScheduleTemplate = (sale.schedule || []).map((inst) => {
        if (inst.id !== installmentId) return inst;
        return {
          ...inst,
          concept: updatedFields.concept !== undefined ? updatedFields.concept : inst.concept,
          scheduledDate: updatedFields.scheduledDate !== undefined ? updatedFields.scheduledDate : inst.scheduledDate,
          scheduledAmount: updatedFields.scheduledAmount !== undefined ? Number(updatedFields.scheduledAmount) : inst.scheduledAmount,
        };
      });

      // 2. Cascade all existing real payments across the updated schedule
      const totalPaymentsReceived = (sale.payments || []).reduce((acc, pay) => {
        const moratory = Number(pay.moratoryAmount) || 0;
        const principal = Math.max(0, (Number(pay.amount) || 0) - moratory);
        return acc + principal;
      }, 0);

      let remainingPaidToCascade = totalPaymentsReceived;
      const cascadedSchedule = updatedScheduleTemplate.map((inst) => {
        const scheduled = Number(inst.scheduledAmount) || 0;
        let alloc = 0;
        if (remainingPaidToCascade > 0) {
          alloc = Math.min(remainingPaidToCascade, scheduled);
          remainingPaidToCascade -= alloc;
        }
        const pending = Math.max(0, scheduled - alloc);
        return {
          ...inst,
          paidAmount: alloc,
          pendingAmount: pending,
          status: (pending === 0 ? "Pagado" : alloc > 0 ? "Parcial" : "Pendiente") as "Pagado" | "Parcial" | "Pendiente",
        };
      });

      const updatedSale: SaleRecord = {
        ...sale,
        schedule: cascadedSchedule,
      };

      const newSales = existingSales.map((s) => (s.unit === unitNumber ? updatedSale : s));

      return {
        ...p,
        sales: newSales,
      };
    });

    saveProjects(updated);
    showToast("Cuota Actualizada", `Se modificó la cuota de la unidad ${unitNumber} y se aplicó el efecto cascada.`);
  };

  const bulkRegisterPayments = (
    projectId: string,
    paymentsList: Array<{
      unitNumber: string;
      amount: number;
      paymentDate: string;
      paymentMethod: string;
      reference?: string;
      notes?: string;
    }>
  ): { successCount: number; errors: string[] } => {
    const targetProject = projects.find((p) => p.id === projectId) || projects[0];
    if (!targetProject) return { successCount: 0, errors: ["Proyecto no encontrado"] };

    let successCount = 0;
    const errors: string[] = [];

    const updated = projects.map((p) => {
      if (p.id !== targetProject.id) return p;

      let currentSales = [...(p.sales || [])];
      let currentInventory = [...(p.unitsInventory || [])];

      for (const payItem of paymentsList) {
        const unitNum = String(payItem.unitNumber || "").trim();
        const payAmount = Number(payItem.amount) || 0;
        if (!unitNum || payAmount <= 0) {
          errors.push(`Fila con datos insuficientes: Unidad ${unitNum || "vacía"} y monto ${payAmount}`);
          continue;
        }

        const unitObjIndex = currentInventory.findIndex((u) => u.unit.toLowerCase() === unitNum.toLowerCase());
        if (unitObjIndex === -1) {
          errors.push(`Unidad ${unitNum} no encontrada en el inventario`);
          continue;
        }

        const unitObj = currentInventory[unitObjIndex]!;
        let saleIndex = currentSales.findIndex((s) => s.unit.toLowerCase() === unitNum.toLowerCase());
        let sale: SaleRecord;

        if (saleIndex === -1) {
          // Synthesize sale record if not present
          const unitPrice = unitObj.price || payAmount;
          sale = {
            id: `sale-${unitNum}-${Date.now()}`,
            folio: unitObj.saleFolio || `VTA-2026-${unitNum}`,
            clientName: unitObj.client !== "-" ? unitObj.client : "Cliente Propietario",
            clientEmail: unitObj.coOwners?.[0]?.email || "",
            clientPhone: unitObj.coOwners?.[0]?.phone || "",
            clientRfc: unitObj.coOwners?.[0]?.rfc || "",
            unit: unitObj.unit,
            paymentPlan: unitObj.salePlanName || "Plan Tradicional",
            totalPrice: unitPrice,
            paidAmount: 0,
            pendingAmount: unitPrice,
            saleDate: unitObj.saleDate || new Date().toISOString(),
            coOwners: unitObj.coOwners,
            schedule: [
              {
                id: `inst-${unitObj.unit}-1`,
                concept: "Enganche",
                scheduledDate: "17 Ago 2026",
                scheduledAmount: Math.round(unitPrice * 0.2),
                paidAmount: 0,
                pendingAmount: Math.round(unitPrice * 0.2),
                status: "Pendiente",
              },
              {
                id: `inst-${unitObj.unit}-2`,
                concept: "Mensualidad 1",
                scheduledDate: "17 Sep 2026",
                scheduledAmount: Math.round(unitPrice * 0.1),
                paidAmount: 0,
                pendingAmount: Math.round(unitPrice * 0.1),
                status: "Pendiente",
              },
              {
                id: `inst-${unitObj.unit}-3`,
                concept: "Mensualidad 2",
                scheduledDate: "17 Oct 2026",
                scheduledAmount: Math.round(unitPrice * 0.1),
                paidAmount: 0,
                pendingAmount: Math.round(unitPrice * 0.1),
                status: "Pendiente",
              },
              {
                id: `inst-${unitObj.unit}-4`,
                concept: "Liquidación y Entrega",
                scheduledDate: "17 Nov 2026",
                scheduledAmount: Math.round(unitPrice * 0.6),
                paidAmount: 0,
                pendingAmount: Math.round(unitPrice * 0.6),
                status: "Pendiente",
              },
            ],
            payments: [],
            status: "ACTIVA",
          };
          currentSales.push(sale);
          saleIndex = currentSales.length - 1;
        } else {
          sale = currentSales[saleIndex]!;
        }

        const existingReceipts = sale.payments || [];
        const nextFolio = `REC-${new Date().getFullYear()}-${String(existingReceipts.length + 1).padStart(3, "0")}`;
        const newReceipt: SalePaymentReceipt = {
          id: `pay-rec-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          receiptFolio: nextFolio,
          paymentDate: payItem.paymentDate || new Date().toLocaleDateString("es-MX"),
          amount: payAmount,
          paymentMethod: payItem.paymentMethod || "SPEI",
          unit: unitObj.unit,
          reference: payItem.reference || `IMPORT-${Math.floor(100000 + Math.random() * 900000)}`,
          notes: payItem.notes || "Carga masiva inicial de pagos / abonos",
          createdAt: new Date().toISOString(),
        };

        const updatedPayments = [newReceipt, ...existingReceipts];
        const totalPaidAll = updatedPayments.reduce((sum, pRec) => sum + (Number(pRec.amount) || 0), 0);

        // Recalculate cascade
        let remainingToCascade = totalPaidAll;
        const newSchedule = (sale.schedule || []).map((inst) => {
          const scheduled = Number(inst.scheduledAmount) || 0;
          let alloc = 0;
          if (remainingToCascade > 0) {
            alloc = Math.min(remainingToCascade, scheduled);
            remainingToCascade -= alloc;
          }
          const pending = Math.max(0, scheduled - alloc);
          return {
            ...inst,
            paidAmount: alloc,
            pendingAmount: pending,
            paymentDate: alloc > 0 ? payItem.paymentDate : inst.paymentDate,
            paymentMethod: alloc > 0 ? payItem.paymentMethod : inst.paymentMethod,
            status: (pending === 0 ? "Pagado" : alloc > 0 ? "Parcial" : "Pendiente") as "Pagado" | "Parcial" | "Pendiente",
          };
        });

        const newSalePending = Math.max(0, sale.totalPrice - totalPaidAll);
        const updatedSaleRecord: SaleRecord = {
          ...sale,
          paidAmount: totalPaidAll,
          pendingAmount: newSalePending,
          schedule: newSchedule,
          payments: updatedPayments,
          status: newSalePending === 0 ? "PAGADA" : "ACTIVA",
        };

        currentSales[saleIndex] = updatedSaleRecord;

        // Update unit in inventory
        currentInventory[unitObjIndex] = {
          ...unitObj,
          status: unitObj.status === "DISPONIBLE" ? "VENDIDA" : unitObj.status,
          salePaidAmount: totalPaidAll,
          salePendingAmount: newSalePending,
        };

        successCount++;
      }

      // Consolidate project metrics
      const activeSales = currentSales.filter((s) => s.status !== "CANCELADA");
      const newTotalCobrado = activeSales.reduce((acc, s) => acc + (s.paidAmount || 0), 0);
      const soldUnitsCount = currentInventory.filter((u) => u.status === "VENDIDA").length;
      const valorComercialVendido = currentInventory
        .filter((u) => u.status === "VENDIDA")
        .reduce((sum, u) => sum + (u.price || 0), 0);
      const newPorCobrar = Math.max(0, valorComercialVendido - newTotalCobrado);

      return {
        ...p,
        unitsInventory: currentInventory,
        sales: currentSales,
        metrics: {
          ...p.metrics,
          unidadesVendidasCount: soldUnitsCount,
          totalCobrado: newTotalCobrado,
          porCobrar: newPorCobrar,
          flujoFuturoMonto: newTotalCobrado + newPorCobrar,
        },
      };
    });

    saveProjects(updated);
    if (successCount > 0) {
      showToast("Carga Masiva Exitosa", `Se procesaron exitosamente ${successCount} pagos/abonos.`, "success");
    }
    return { successCount, errors };
  };

  const updateSaleDetailsAndAdditionals = (
    projectId: string,
    unitNumber: string,
    payload: {
      additionals: ProjectAdditional[];
      adjustScheduleMode?: "liquidation" | "proportional";
      notes?: string;
    }
  ) => {
    const targetProject = projects.find((p) => p.id === projectId) || projects[0];
    if (!targetProject) return;

    const updated = projects.map((p) => {
      if (p.id !== targetProject.id) return p;

      const currentInventory = [...(p.unitsInventory || [])];
      const unitIndex = currentInventory.findIndex((u) => u.unit === unitNumber);
      if (unitIndex === -1) return p;

      const unitObj = currentInventory[unitIndex]!;
      const currentSales = [...(p.sales || [])];
      const saleIndex = currentSales.findIndex((s) => s.unit === unitNumber);
      if (saleIndex === -1) return p;

      const sale = currentSales[saleIndex]!;
      const existingAdditionalsPrice = (sale.additionals || []).reduce((sum, a) => sum + (Number(a.price) || 0), 0);
      const baseUnitPrice = Math.max(0, (unitObj.price || 0) - existingAdditionalsPrice);
      const newAdditionalsPrice = payload.additionals.reduce((sum, a) => sum + (Number(a.price) || 0), 0);
      const newTotalPrice = Math.max(baseUnitPrice, baseUnitPrice + newAdditionalsPrice);
      const priceDifference = newTotalPrice - sale.totalPrice;

      // Adjust schedule
      let newSchedule = [...(sale.schedule || [])];
      const adjustMode = payload.adjustScheduleMode || "liquidation";

      if (adjustMode === "liquidation" && newSchedule.length > 0) {
        const lastIdx = newSchedule.length - 1;
        const lastInst = newSchedule[lastIdx]!;
        const updatedLastAmount = Math.max(0, lastInst.scheduledAmount + priceDifference);
        newSchedule[lastIdx] = {
          ...lastInst,
          scheduledAmount: updatedLastAmount,
        };
      } else if (newSchedule.length > 0) {
        const pendingInsts = newSchedule.filter((inst) => inst.status !== "Pagado");
        const totalPendingScheduled = pendingInsts.reduce((sum, inst) => sum + inst.scheduledAmount, 0);
        if (totalPendingScheduled > 0 && pendingInsts.length > 0) {
          newSchedule = newSchedule.map((inst) => {
            if (inst.status === "Pagado") return inst;
            const proportion = inst.scheduledAmount / totalPendingScheduled;
            const newAmount = Math.max(0, Math.round(inst.scheduledAmount + priceDifference * proportion));
            return {
              ...inst,
              scheduledAmount: newAmount,
            };
          });
        }
      }

      // Re-run cascade of existing payments
      const totalPaid = (sale.payments || []).reduce((sum, pay) => {
        const moratory = Number(pay.moratoryAmount) || 0;
        return sum + Math.max(0, Number(pay.amount) - moratory);
      }, 0);

      let remPaid = totalPaid;
      newSchedule = newSchedule.map((inst) => {
        const scheduled = Number(inst.scheduledAmount) || 0;
        let alloc = 0;
        if (remPaid > 0) {
          alloc = Math.min(remPaid, scheduled);
          remPaid -= alloc;
        }
        const pending = Math.max(0, scheduled - alloc);
        return {
          ...inst,
          paidAmount: alloc,
          pendingAmount: pending,
          status: (pending === 0 ? "Pagado" : alloc > 0 ? "Parcial" : "Pendiente") as "Pagado" | "Parcial" | "Pendiente",
        };
      });

      const newSalePending = Math.max(0, newTotalPrice - totalPaid);

      const updatedSale: SaleRecord = {
        ...sale,
        totalPrice: newTotalPrice,
        pendingAmount: newSalePending,
        additionals: payload.additionals,
        schedule: newSchedule,
        status: newSalePending === 0 ? "PAGADA" : "ACTIVA",
      };
      currentSales[saleIndex] = updatedSale;

      // Update project additionals inventory statuses
      const updatedProjectAdditionals = (p.additionals || []).map((add) => {
        const isAssignedToThisUnit = payload.additionals.some((a) => a.id === add.id);
        if (isAssignedToThisUnit) {
          return { ...add, status: "ASIGNADO" as const, assignedToUnit: unitNumber };
        }
        if (add.assignedToUnit === unitNumber) {
          return { ...add, status: "DISPONIBLE" as const, assignedToUnit: undefined };
        }
        return add;
      });

      // Update unit inventory
      currentInventory[unitIndex] = {
        ...unitObj,
        price: newTotalPrice,
        salePendingAmount: newSalePending,
      };

      const activeSales = currentSales.filter((s) => s.status !== "CANCELADA");
      const totalCobrado = activeSales.reduce((sum, s) => sum + (s.paidAmount || 0), 0);
      const valorComercialVendido = currentInventory
        .filter((u) => u.status === "VENDIDA")
        .reduce((sum, u) => sum + (u.price || 0), 0);
      const porCobrar = Math.max(0, valorComercialVendido - totalCobrado);

      return {
        ...p,
        unitsInventory: currentInventory,
        additionals: updatedProjectAdditionals,
        sales: currentSales,
        metrics: {
          ...p.metrics,
          valorComercialVendido,
          totalCobrado,
          porCobrar,
          flujoFuturoMonto: totalCobrado + porCobrar,
        },
      };
    });

    saveProjects(updated);
    // Persist additionals changes to Supabase
    if (targetProject) {
      const updatedProj = updated.find((p) => p.id === targetProject.id);
      if (updatedProj && updatedProj.additionals) {
        updateProjectAdditionals(targetProject.id, updatedProj.additionals);
      }
    }
    showToast("Venta y Adicionales Actualizados", `Se actualizaron los adicionales y el precio de la unidad ${unitNumber}.`, "success");
  };

  const updateSalePayment = (
    projectId: string,
    unitNumber: string,
    paymentId: string,
    updatedFields: Partial<SalePaymentReceipt>
  ) => {
    const targetProject = projects.find((p) => p.id === projectId) || projects[0];
    if (!targetProject) return;

    const updated = projects.map((p) => {
      if (p.id !== targetProject.id) return p;

      const existingSales = p.sales || [];
      const sale = existingSales.find((s) => s.unit === unitNumber);
      if (!sale) return p;

      const updatedPayments = (sale.payments || []).map((pay) => {
        if (pay.id !== paymentId) return pay;
        return { ...pay, ...updatedFields };
      });

      let remainingPaid = updatedPayments.reduce((acc, pay) => acc + (Number(pay.amount) || 0), 0);
      const newSchedule = (sale.schedule || []).map((inst) => {
        const scheduled = inst.scheduledAmount;
        let alloc = 0;
        if (remainingPaid > 0) {
          alloc = Math.min(remainingPaid, scheduled);
          remainingPaid -= alloc;
        }
        const pending = Math.max(0, scheduled - alloc);
        return {
          ...inst,
          paidAmount: alloc,
          pendingAmount: pending,
          status: (pending === 0 ? "Pagado" : alloc > 0 ? "Parcial" : "Pendiente") as "Pagado" | "Parcial" | "Pendiente",
        };
      });

      const newUnitPaid = updatedPayments.reduce((acc, pay) => acc + (Number(pay.amount) || 0), 0);
      const newUnitPending = Math.max(0, sale.totalPrice - newUnitPaid);

      const updatedSale: SaleRecord = {
        ...sale,
        paidAmount: newUnitPaid,
        pendingAmount: newUnitPending,
        schedule: newSchedule,
        payments: updatedPayments,
        status: newUnitPending === 0 ? "PAGADA" : "ACTIVA",
      };

      const newSales = [updatedSale, ...existingSales.filter((s) => s.unit !== unitNumber)];
      const newInventory = p.unitsInventory.map((u) => {
        if (u.unit !== unitNumber) return u;
        return {
          ...u,
          salePaidAmount: newUnitPaid,
          salePendingAmount: newUnitPending,
        };
      });

      const activeSales = newSales.filter((s) => s.status !== "CANCELADA");
      const newTotalCobrado = activeSales.reduce((acc, s) => acc + (s.paidAmount || 0), 0);
      const newPorCobrar = Math.max(0, (p.metrics?.valorComercialVendido || 0) - newTotalCobrado);

      return {
        ...p,
        unitsInventory: newInventory,
        sales: newSales,
        metrics: {
          ...p.metrics,
          totalCobrado: newTotalCobrado,
          porCobrar: newPorCobrar,
          flujoFuturoMonto: newTotalCobrado + newPorCobrar,
        },
      };
    });

    saveProjects(updated);
    showToast("Pago Actualizado", "Se guardaron los cambios del pago y se recalcularon las cuotas.");
  };

  const deleteSalePayment = (projectId: string, unitNumber: string, paymentId: string) => {
    const targetProject = projects.find((p) => p.id === projectId) || projects[0];
    if (!targetProject) return;

    const updated = projects.map((p) => {
      if (p.id !== targetProject.id) return p;

      const existingSales = p.sales || [];
      const sale = existingSales.find((s) => s.unit === unitNumber);
      if (!sale) return p;

      const removedPayment = (sale.payments || []).find((pay) => pay.id === paymentId);
      const remainingPayments = (sale.payments || []).filter((pay) => pay.id !== paymentId);

      let remainingPaid = remainingPayments.reduce((acc, pay) => acc + pay.amount, 0);
      const newSchedule = (sale.schedule || []).map((inst) => {
        const scheduled = inst.scheduledAmount;
        let alloc = 0;
        if (remainingPaid > 0) {
          alloc = Math.min(remainingPaid, scheduled);
          remainingPaid -= alloc;
        }
        const pending = Math.max(0, scheduled - alloc);
        return {
          ...inst,
          paidAmount: alloc,
          pendingAmount: pending,
          status: (pending === 0 ? "Pagado" : alloc > 0 ? "Parcial" : "Pendiente") as "Pagado" | "Parcial" | "Pendiente",
        };
      });

      const newUnitPaid = remainingPayments.reduce((acc, pay) => acc + pay.amount, 0);
      const newUnitPending = Math.max(0, sale.totalPrice - newUnitPaid);

      const updatedSale: SaleRecord = {
        ...sale,
        paidAmount: newUnitPaid,
        pendingAmount: newUnitPending,
        schedule: newSchedule,
        payments: remainingPayments,
        status: newUnitPending === 0 ? "PAGADA" : "ACTIVA",
      };

      const newSales = [updatedSale, ...existingSales.filter((s) => s.unit !== unitNumber)];
      const newInventory = p.unitsInventory.map((u) => {
        if (u.unit !== unitNumber) return u;
        return {
          ...u,
          salePaidAmount: newUnitPaid,
          salePendingAmount: newUnitPending,
        };
      });

      const activeSales = newSales.filter((s) => s.status !== "CANCELADA");
      const newTotalCobrado = activeSales.reduce((acc, s) => acc + (s.paidAmount || 0), 0);
      const newPorCobrar = Math.max(0, (p.metrics?.valorComercialVendido || 0) - newTotalCobrado);

      return {
        ...p,
        unitsInventory: newInventory,
        sales: newSales,
        metrics: {
          ...p.metrics,
          totalCobrado: newTotalCobrado,
          porCobrar: newPorCobrar,
          flujoFuturoMonto: newTotalCobrado + newPorCobrar,
        },
      };
    });

    saveProjects(updated);
    showToast("Pago Eliminado", "Se revirtió el registro de pago y se recalcularon las cuotas.");
  };

  const unsellUnit = (projectId: string, unitNumber: string) => {
    const updated = projects.map((p) => {
      if (p.id !== projectId) return p;
      const newInventory = p.unitsInventory.map((u) => {
        if (u.unit !== unitNumber) return u;
        return {
          ...u,
          status: "DISPONIBLE" as const,
          client: "-",
          coOwners: undefined,
          saleFolio: undefined,
          saleDate: undefined,
          salePlanName: undefined,
          salePaidAmount: undefined,
          salePendingAmount: undefined,
        };
      });

      // Release any additionals associated with this unit
      const updatedAdditionals = (p.additionals || []).map((a) => {
        if (a.assignedToUnit === unitNumber) {
          return {
            ...a,
            status: "DISPONIBLE" as const,
            assignedToUnit: undefined,
          };
        }
        return a;
      });

      const updatedSales = (p.sales || []).map((s) => {
        if (s.unit === unitNumber) {
          return { ...s, status: "CANCELADA" as const };
        }
        return s;
      });

      const soldCount = newInventory.filter((u) => u.status === "VENDIDA").length;
      const availCount = newInventory.filter((u) => u.status === "DISPONIBLE").length;
      const blockedCount = newInventory.filter((u) => u.status === "BLOQUEADA").length;
      const totalCount = p.totalUnits || (newInventory.length > 0 ? newInventory.length : 1);

      const valorComercialTotal = newInventory.reduce((acc, u) => acc + (u.price || 0), 0);
      const soldUnitsPriceSum = newInventory.filter((u) => u.status === "VENDIDA").reduce((acc, u) => acc + (u.price || 0), 0);
      const activeSales = updatedSales.filter((s) => s.status === "ACTIVA" || s.status === "PAGADA");
      const totalCobrado = activeSales.reduce((acc, s) => acc + (s.paidAmount || 0), 0);
      const porCobrar = Math.max(0, soldUnitsPriceSum - totalCobrado);

      return {
        ...p,
        soldUnits: soldCount,
        availableUnits: availCount,
        blockedUnits: blockedCount,
        unitsInventory: newInventory,
        additionals: updatedAdditionals,
        sales: updatedSales,
        metrics: {
          ...p.metrics,
          unidadesVendidasCount: soldCount,
          porVenderUnidades: availCount,
          avanceVentasPct: totalCount > 0 ? Math.round((soldCount / totalCount) * 100) : 0,
          valorComercialTotal,
          valorComercialVendido: soldUnitsPriceSum,
          porVenderMonto: Math.max(0, valorComercialTotal - soldUnitsPriceSum),
          totalCobrado,
          porCobrar,
          totalFacturado: soldUnitsPriceSum,
          flujoFuturoMonto: totalCobrado + porCobrar,
        },
      };
    });
    saveProjects(updated);
    showToast("Unidad Disponible", `La unidad ${unitNumber} está disponible nuevamente.`);
  };

  const updateProject = (projectId: string, updatedFields: Partial<ProjectItem>) => {
    const updated = projects.map((p) => {
      if (p.id !== projectId) return p;
      return {
        ...p,
        ...updatedFields,
      };
    });
    saveProjects(updated);
    showToast("Proyecto Actualizado", `La información del proyecto "${updatedFields.name || 'actual'}" ha sido guardada.`);

    // Persist to Supabase via backend API
    fetch(`/api/projects/${projectId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...updatedFields,
        projectId,
      }),
    }).catch((err) => console.warn("Could not sync project update with backend:", err));
  };

  const registerConstructionProgress = (projectId: string, advanceData: ProjectConstructionAdvance) => {
    const updated = projects.map((p) => {
      if (p.id !== projectId) return p;
      const history = p.constructionHistory || [];
      const newHistory = [advanceData, ...history];

      let updatedUnits = p.unitsInventory;
      let newOverallPct = advanceData.pct;

      if (advanceData.targetScope === "UNITS" && advanceData.targetUnits && advanceData.targetUnits.length > 0) {
        // Update constructionPct for targeted units
        updatedUnits = p.unitsInventory.map((u) => {
          if (advanceData.targetUnits?.includes(u.unit)) {
            return {
              ...u,
              constructionPct: advanceData.pct,
            };
          }
          return u;
        });

        // Compute average across all units
        const totalUnits = updatedUnits.length;
        if (totalUnits > 0) {
          const sumPct = updatedUnits.reduce(
            (acc, u) => acc + (u.constructionPct !== undefined ? u.constructionPct : p.progressPct || 0),
            0
          );
          newOverallPct = Math.round(sumPct / totalUnits);
        }
      } else {
        // Target scope is PROJECT: update all units
        updatedUnits = p.unitsInventory.map((u) => ({
          ...u,
          constructionPct: advanceData.pct,
        }));
      }

      return {
        ...p,
        progressPct: newOverallPct,
        unitsInventory: updatedUnits,
        constructionHistory: newHistory,
      };
    });

    saveProjects(updated);
    showToast(
      "Avance de Obra Registrado",
      advanceData.targetScope === "UNITS"
        ? `Avance del ${advanceData.pct}% aplicado a ${advanceData.targetUnits?.length || 0} unidades.`
        : `Avance general de obra registrado al ${advanceData.pct}%.`
    );

    // Persist to Supabase
    fetch("/api/progress", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        projectId,
        title: `Avance de Obra - ${advanceData.date}`,
        overallPercentage: advanceData.pct,
        specialtyDetails: {
          cimentacionPct: advanceData.cimentacionPct,
          estructuraPct: advanceData.estructuraPct,
          instalacionesPct: advanceData.instalacionesPct,
          acabadosPct: advanceData.acabadosPct,
        },
        mediaUrls: advanceData.photos?.map((p) => p.url) || (advanceData.image ? [advanceData.image] : []),
      }),
    }).catch((err) => console.warn("Could not sync progress with backend:", err));
  };

  const updateProjectProgress = (projectId: string, progressPct: number) => {
    const updated = projects.map((p) => {
      if (p.id !== projectId) return p;
      return {
        ...p,
        progressPct,
      };
    });
    saveProjects(updated);
    showToast("Avance Registrado", `Avance de obra actualizado a ${progressPct}%.`);

    fetch("/api/progress", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        projectId,
        title: `Actualización de Avance General (${progressPct}%)`,
        overallPercentage: progressPct,
      }),
    }).catch(() => {});
  };

  const updateProjectFloorPlans = (projectId: string, floorPlans: ProjectFloorPlan[]) => {
    const updated = projects.map((p) => {
      if (p.id !== projectId) return p;
      return {
        ...p,
        floorPlans,
      };
    });
    saveProjects(updated);
  };

  const addFloorPlan = (projectId: string, floorPlan: ProjectFloorPlan) => {
    const updated = projects.map((p) => {
      if (p.id !== projectId) return p;
      const current = p.floorPlans || [];
      return {
        ...p,
        floorPlans: [...current, floorPlan],
      };
    });
    saveProjects(updated);
    showToast("Planta Agregada", `Se agregó la planta "${floorPlan.name}".`);
  };

  const updateFloorPlan = (projectId: string, floorPlanId: string, updatedFields: Partial<ProjectFloorPlan>) => {
    const updated = projects.map((p) => {
      if (p.id !== projectId) return p;
      const current = p.floorPlans || [];
      const newPlans = current.map((fp) => (fp.id === floorPlanId ? { ...fp, ...updatedFields } : fp));
      return {
        ...p,
        floorPlans: newPlans,
      };
    });
    saveProjects(updated);
    showToast("Planta Actualizada", "Los cambios en la planta de conjunto han sido guardados.");
  };

  const deleteFloorPlan = (projectId: string, floorPlanId: string) => {
    const updated = projects.map((p) => {
      if (p.id !== projectId) return p;
      const current = p.floorPlans || [];
      return {
        ...p,
        floorPlans: current.filter((fp) => fp.id !== floorPlanId),
      };
    });
    saveProjects(updated);
    showToast("Planta Eliminada", "La planta ha sido removida del proyecto.", "info");
  };

  const bulkImportUnits = (projectId: string, newUnits: UnitItem[]) => {
    let addedCount = 0;
    let updatedCount = 0;
    const updated = projects.map((p) => {
      if (p.id !== projectId) return p;
      const existingMap = new Map<string, UnitItem>();
      p.unitsInventory.forEach((u) => existingMap.set(u.unit.toLowerCase(), u));

      const mergedInventory = [...p.unitsInventory];
      newUnits.forEach((newU) => {
        const key = newU.unit.toLowerCase();
        if (existingMap.has(key)) {
          const idx = mergedInventory.findIndex((u) => u.unit.toLowerCase() === key);
          if (idx !== -1) {
            mergedInventory[idx] = { ...mergedInventory[idx], ...newU };
            updatedCount++;
          }
        } else {
          mergedInventory.push({
            ...newU,
            id: newU.id || `u-imp-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
            status: newU.status || "DISPONIBLE",
            client: newU.client || "-",
          });
          existingMap.set(key, newU);
          addedCount++;
        }
      });

      const soldCount = mergedInventory.filter((u) => u.status === "VENDIDA").length;
      const availCount = mergedInventory.filter((u) => u.status === "DISPONIBLE").length;
      const blockedCount = mergedInventory.filter((u) => u.status === "BLOQUEADA").length;
      const totalCount = mergedInventory.length;
      const valorComercialTotal = mergedInventory.reduce((acc, u) => acc + (u.price || 0), 0);
      const soldUnitsPriceSum = mergedInventory.filter((u) => u.status === "VENDIDA").reduce((acc, u) => acc + (u.price || 0), 0);
      const activeSales = (p.sales || []).filter((s) => s.status === "ACTIVA" || s.status === "PAGADA");
      const totalCobrado = activeSales.reduce((acc, s) => acc + (s.paidAmount || 0), 0);
      const porCobrar = Math.max(0, soldUnitsPriceSum - totalCobrado);

      return {
        ...p,
        totalUnits: totalCount,
        soldUnits: soldCount,
        availableUnits: availCount,
        blockedUnits: blockedCount,
        unitsInventory: mergedInventory,
        metrics: {
          ...p.metrics,
          unidadesTotalesCount: totalCount,
          unidadesVendidasCount: soldCount,
          porVenderUnidades: availCount,
          avanceVentasPct: totalCount > 0 ? Math.round((soldCount / totalCount) * 100) : 0,
          valorComercialTotal,
          valorComercialVendido: soldUnitsPriceSum,
          porVenderMonto: Math.max(0, valorComercialTotal - soldUnitsPriceSum),
          totalCobrado,
          porCobrar,
          totalFacturado: soldUnitsPriceSum,
          flujoFuturoMonto: totalCobrado + porCobrar,
          precioPromedio: totalCount > 0 ? Math.round(valorComercialTotal / totalCount) : 0,
        },
      };
    });
    saveProjects(updated);
    showToast("Inventario Importado", `Se procesaron ${addedCount} unidades nuevas y ${updatedCount} actualizadas.`);
    return { addedCount, updatedCount };
  };

  const bulkImportAdditionals = (projectId: string, newAddons: ProjectAdditional[]) => {
    let addedCount = 0;
    let updatedCount = 0;
    const updated = projects.map((p) => {
      if (p.id !== projectId) return p;
      const current = p.additionals || [];
      const existingIds = new Set(current.map((a) => a.id));
      const merged = [...current];
      newAddons.forEach((addon) => {
        if (addon.id && existingIds.has(addon.id)) {
          const idx = merged.findIndex((a) => a.id === addon.id);
          if (idx !== -1) {
            merged[idx] = { ...merged[idx], ...addon };
            updatedCount++;
          }
        } else {
          merged.push({
            ...addon,
            id: addon.id || `add-imp-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
            status: addon.status || "DISPONIBLE",
          });
          addedCount++;
        }
      });
      return {
        ...p,
        additionals: merged,
      };
    });
    saveProjects(updated);
    showToast("Adicionales Importados", `Se procesaron ${addedCount} adicionales nuevos y ${updatedCount} actualizados.`);
    return { addedCount, updatedCount };
  };

  const updateProjectDocuments = (projectId: string, documents: ProjectDocument[]) => {
    const updated = projects.map((p) => {
      if (p.id !== projectId) return p;
      return {
        ...p,
        documents,
      };
    });
    saveProjects(updated);
  };

  const addProjectDocument = (projectId: string, doc: ProjectDocument) => {
    const updated = projects.map((p) => {
      if (p.id !== projectId) return p;
      const current = p.documents || [];
      return {
        ...p,
        documents: [doc, ...current.filter((d) => d.id !== doc.id)],
      };
    });
    saveProjects(updated);
    showToast("Documento Guardado", `Se guardó "${doc.title}" en el expediente.`);

    // Persist to Supabase
    fetch("/api/documents", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        projectId,
        title: doc.title,
        category: doc.category,
        filePath: doc.url,
      }),
    }).catch((err) => console.warn("Could not sync document with backend:", err));
  };

  const deleteProjectDocument = (projectId: string, docId: string) => {
    const updated = projects.map((p) => {
      if (p.id !== projectId) return p;
      const current = p.documents || [];
      return {
        ...p,
        documents: current.filter((d) => d.id !== docId),
      };
    });
    saveProjects(updated);
    showToast("Documento Eliminado", "El documento fue eliminado del expediente.", "info");

    fetch(`/api/documents?id=${encodeURIComponent(docId)}`, {
      method: "DELETE",
    }).catch(() => {});
  };

  const addClientDocument = (projectId: string, doc: ClientDocument) => {
    const updated = projects.map((p) => {
      if (p.id !== projectId) return p;
      const current = p.clientDocuments || [];
      return {
        ...p,
        clientDocuments: [doc, ...current.filter((d) => d.id !== doc.id)],
      };
    });
    saveProjects(updated);
    showToast("Documento Guardado", `Se guardó "${doc.title}" en el expediente.`);

    fetch("/api/documents", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        projectId,
        title: doc.title,
        category: doc.category,
        filePath: doc.url,
      }),
    }).catch(() => {});
  };

  const updateClientDocument = (projectId: string, doc: ClientDocument) => {
    const updated = projects.map((p) => {
      if (p.id !== projectId) return p;
      const current = p.clientDocuments || [];
      return {
        ...p,
        clientDocuments: current.map((d) => (d.id === doc.id ? doc : d)),
      };
    });
    saveProjects(updated);
    showToast("Documento Actualizado", `Se actualizó "${doc.title}".`);

    fetch("/api/documents", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        projectId,
        title: doc.title,
        category: doc.category,
        filePath: doc.url,
      }),
    }).catch(() => {});
  };

  const deleteClientDocument = (projectId: string, docId: string) => {
    const updated = projects.map((p) => {
      if (p.id !== projectId) return p;
      const current = p.clientDocuments || [];
      return {
        ...p,
        clientDocuments: current.filter((d) => d.id !== docId),
      };
    });
    saveProjects(updated);
    showToast("Documento Eliminado", "El documento fue eliminado del expediente.", "info");

    fetch(`/api/documents?id=${encodeURIComponent(docId)}`, {
      method: "DELETE",
    }).catch(() => {});
  };

  const savePostventaIncidents = (newIncidents: PostventaIncident[]) => {
    setPostventaIncidents(newIncidents);
  };

  const addPostventaIncident = (incident: PostventaIncident) => {
    const updated = [incident, ...postventaIncidents.filter((i) => i.id !== incident.id)];
    savePostventaIncidents(updated);
    showToast("Incidencia Registrada", `Folio ${incident.folio} guardado.`);
  };

  const updatePostventaIncident = (incident: PostventaIncident) => {
    const updated = postventaIncidents.map((i) => (i.id === incident.id ? incident : i));
    savePostventaIncidents(updated);
    showToast("Incidencia Actualizada", `Folio ${incident.folio} actualizado.`);
  };

  const deletePostventaIncident = (incidentId: string) => {
    const updated = postventaIncidents.filter((i) => i.id !== incidentId);
    savePostventaIncidents(updated);
    showToast("Incidencia Eliminada", "El ticket fue eliminado.", "info");
  };

  const addQuote = (projectId: string, quote: QuoteRecord) => {
    const updated = projects.map((p) => {
      if (p.id !== projectId) return p;
      const current = p.quotes || [];
      return {
        ...p,
        quotes: [quote, ...current.filter((q) => q.id !== quote.id)],
      };
    });
    saveProjects(updated);
    showToast("Cotización Guardada", `Folio ${quote.folio} para unidad ${quote.unit} guardado.`);
  };

  const updateQuote = (projectId: string, quoteId: string, updatedFields: Partial<QuoteRecord>) => {
    const updated = projects.map((p) => {
      if (p.id !== projectId) return p;
      const current = p.quotes || [];
      return {
        ...p,
        quotes: current.map((q) => (q.id === quoteId ? { ...q, ...updatedFields } : q)),
      };
    });
    saveProjects(updated);
    showToast("Cotización Actualizada", "El estado de la cotización se actualizó con éxito.");
  };

  const deleteQuote = (projectId: string, quoteId: string) => {
    const updated = projects.map((p) => {
      if (p.id !== projectId) return p;
      const current = p.quotes || [];
      return {
        ...p,
        quotes: current.filter((q) => q.id !== quoteId),
      };
    });
    saveProjects(updated);
    showToast("Cotización Eliminada", "La cotización fue eliminada.", "info");
  };

  const logout = () => {
    if (typeof window !== "undefined") {
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
      localStorage.removeItem("devio_developer_payment_plans");
      sessionStorage.removeItem("devio_developer_payment_plans");
      localStorage.removeItem("devio_payment_plans_library");
      sessionStorage.removeItem("devio_payment_plans_library");
      localStorage.removeItem("devio_postventa_incidents");
      sessionStorage.removeItem("devio_postventa_incidents");
      
      document.cookie = "devio_auth_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; max-age=0";
      document.cookie = "devio_user_role=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; max-age=0";
      setProjects([]);
      setDeveloperName("");
      setDeveloperLogo("");
      setUserName("");
      setUserEmail("");
      
      window.location.href = "/login";
    }
  };

  const hasPermission = (key: PermissionKey): boolean => {
    return checkPermission(userRole, userPermissions, key);
  };

  return (
    <ProjectContext.Provider
      value={{
        projects,
        currency,
        setCurrency,
        banxicoRate,
        formatMoney,
        developerName,
        setDeveloperName,
        developerLogo,
        setDeveloperLogo,
        userName,
        setUserName,
        userEmail,
        setUserEmail,
        userRole,
        userPermissions,
        hasPermission,
        paymentPlans,
        addPaymentPlan,
        updatePaymentPlan,
        deletePaymentPlan,
        setPaymentPlans: savePaymentPlans,
        getProject,
        addProject,
        refreshProjects,
        updateUnit,
        updateMultipleUnits,
        updateBulkPrices,
        updateProjectAdditionals,
        addSale,
        registerPayment,
        updateSaleScheduleInstallment,
        bulkRegisterPayments,
        updateSaleDetailsAndAdditionals,
        updateSalePayment,
        deleteSalePayment,
        unsellUnit,
        updateProject,
        updateProjectProgress,
        registerConstructionProgress,
        updateProjectFloorPlans,
        addFloorPlan,
        updateFloorPlan,
        deleteFloorPlan,
        bulkImportUnits,
        bulkImportAdditionals,
        updateProjectDocuments,
        addProjectDocument,
        deleteProjectDocument,
        addClientDocument,
        updateClientDocument,
        deleteClientDocument,
        addQuote,
        updateQuote,
        deleteQuote,
        postventaIncidents,
        addPostventaIncident,
        updatePostventaIncident,
        deletePostventaIncident,
        resetToCleanState,
        loadDemoData,
        toast,
        showToast,
        hideToast,
        logout,
      }}
    >
      {children}
    </ProjectContext.Provider>
  );
}

export function useProject() {
  const context = useContext(ProjectContext);
  if (!context) {
    throw new Error("useProject must be used within a ProjectProvider");
  }
  return context;
}
