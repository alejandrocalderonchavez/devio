export interface CoOwner {
  id: string;
  name: string;
  email: string;
  phone: string;
  rfc: string;
  ownershipPct: number;
  isPrimary: boolean;
  relationship?: string;
}

export interface UnitPriceHistoryItem {
  date: string;
  previousPrice: number;
  newPrice: number;
  pctChange: number;
  reason: string;
  user: string;
}

export interface UnitItem {
  id?: string;
  unit: string;
  type: string;
  price: number;
  areaM2: number;
  floor: number;
  status: "DISPONIBLE" | "VENDIDA" | "BLOQUEADA" | "APARTADA";
  client: string;
  coOwners?: CoOwner[];
  deliveryDate?: string;
  bedrooms?: number;
  bathrooms?: number;
  parkingSpots?: number;
  storageUnits?: number;
  orientation?: string;
  viewType?: string;
  levelHeightM?: number;
  maintenanceFee?: number;
  interiorAreaM2?: number;
  terraceAreaM2?: number;
  gardenAreaM2?: number;
  images?: string[];
  priceHistory?: UnitPriceHistoryItem[];
  saleFolio?: string;
  saleDate?: string;
  salePlanName?: string;
  salePaidAmount?: number;
  salePendingAmount?: number;
  floorPlan?: string; // Nombre de la Planta de Conjunto asignada
  constructionPct?: number; // Porcentaje de avance de obra específico de la unidad
  advisor?: string; // Nombre del Asesor comercial asignado
  advisorEmail?: string; // Email del Asesor asignado
}

export interface ProjectMetric {
  totalCobrado: number;
  porCobrar: number;
  pagosAtrasados: number;
  avanceVentasPct: number;
  unidadesVendidasCount: number;
  unidadesTotalesCount: number;
  porVenderUnidades: number;
  valorComercialVendido: number;
  valorComercialTotal: number;
  porVenderMonto: number;
  flujoFuturoMonto: number;
  precioPromedio: number;
  inventarioMonetarioPct: number;
  totalFacturado: number;
  distribucionPct: number;
}

export interface ProjectAdditional {
  id: string;
  name: string;
  category: "estacionamiento" | "bodega" | "acabados" | "terraza" | "otro";
  price: number;
  areaM2?: number;
  status: "DISPONIBLE" | "ASIGNADO" | "VENDIDO";
  assignedToUnit?: string;
  notes?: string;
}

export interface ProjectFloorPlan {
  id: string;
  name: string; // Ej: "Planta Tipo A", "Planta Tipo B", "Planta Penthouse"
  imageUrl?: string; // Plano arquitectónico / layout
}

export interface ProjectConstructionAdvance {
  id: string;
  title: string;
  date: string;
  pct: number;
  image?: string;
  description?: string;
  cimentacionPct?: number;
  estructuraPct?: number;
  instalacionesPct?: number;
  acabadosPct?: number;
  photos?: Array<{ name: string; url: string; size?: string }>;
  uploadedDocument?: { name: string; size: string; url?: string } | null;
  targetScope: "PROJECT" | "UNITS";
  targetUnits?: string[]; // Array de números de unidad cuando targetScope === "UNITS"
  emailSent?: boolean;
  createdAt?: string;
}

export interface ProjectTeamMember {
  id: string;
  name: string;
  role: string;
  email: string;
  assigned: boolean;
}

export interface ProjectItem {
  id: string;
  name: string;
  type: string;
  image: string;
  progressPct: number;
  totalUnits: number;
  soldUnits: number;
  availableUnits: number;
  blockedUnits?: number;
  legalName?: string;
  description?: string;
  googleMapsUrl?: string;
  websiteUrl?: string;
  totalSurfaceM2?: number;
  estimatedDeliveryDate?: string;
  currency?: "MXN" | "USD";
  logoFileName?: string;
  coverFileName?: string;
  teamIds?: string[];
  team?: ProjectTeamMember[];
  constructionHistory?: ProjectConstructionAdvance[];
  metrics: ProjectMetric;
  monthlyBilling: Array<{ month: string; cobrado: number; porCobrar: number }>;
  overdueClients: Array<{ name: string; amount: number; unit?: string; daysOverdue?: number }>;
  unitsInventory: UnitItem[];
  additionals?: ProjectAdditional[];
  sales?: SaleRecord[];
  quotes?: QuoteRecord[];
  floorPlans?: ProjectFloorPlan[];
  documents?: ProjectDocument[];
  paymentPlans?: any[];
}

export interface QuoteRecord {
  id: string;
  folio: string;
  projectId: string;
  projectName: string;
  unit: string;
  unitType: string;
  superficieM2: number;
  deliveryDate?: string;
  clientName: string;
  clientEmail?: string;
  clientPhone?: string;
  clientRfc?: string;
  advisorName: string;
  advisorEmail?: string;
  advisorPhone?: string;
  listPrice: number;
  discountPct: number;
  discountAmount: number;
  totalQuoteAmount: number;
  planName: string;
  downPaymentPct: number;
  downPaymentAmount: number;
  installmentsCount: number;
  installmentAmount: number;
  periodicity: string;
  settlementPct: number;
  settlementAmount: number;
  additionals?: Array<{ id?: string; name: string; price: number }>;
  status: "VIGENTE" | "EN_ESPERA" | "CONVERTIDA_A_VENTA" | "PERDIDA" | "EXPIRADA" | "RECHAZADA";
  lostReason?: string;
  notes?: string;
  createdAt: string; // ISO format
  expiresAt: string; // ISO format
  pdfUrl?: string;
}

export interface ClientOwnedUnit {
  unit: string;
  type: string;
  price: number;
  ownershipPct: number;
  isPrimary: boolean;
  saleFolio?: string;
  additionals?: ProjectAdditional[];
  coOwners?: Array<{
    id?: string;
    name: string;
    email?: string;
    phone?: string;
    rfc?: string;
    ownershipPct: number;
    isPrimary?: boolean;
    clientId?: string;
  }>;
}

export interface ClientProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  rfc: string;
  avatarUrl?: string;
  totalPaid: number;
  totalPending: number;
  unitsCount: number;
  ownedUnits: ClientOwnedUnit[];
}

export interface SaleScheduleInstallment {
  id: string;
  concept: string; // e.g., "Enganche", "Mensualidad 1", "Liquidación"
  scheduledDate: string; // e.g. "2026-10-15" or "15 Oct 2026"
  scheduledAmount: number;
  paidAmount: number;
  pendingAmount: number;
  paymentDate?: string;
  paymentMethod?: string;
  status: "Atrasado" | "Pendiente" | "Pagado" | "Parcial";
  moratoryInterest?: number;
  planName?: string;
}

export interface SalePaymentReceipt {
  id: string;
  receiptFolio: string; // e.g., "REC-2026-001"
  paymentDate: string;
  amount: number;
  paymentMethod: "Transferencia" | "SPEI" | "Cheque" | "Efectivo" | "Tarjeta" | string;
  unit: string;
  reference?: string;
  notes?: string;
  voucherUrl?: string;
  voucherName?: string;
  scheduledAmount?: number;
  scheduledDate?: string;
  sendReceiptEmail?: boolean;
  moratoryAmount?: number;
  moratoryAction?: string;
  waiveReason?: string;
  createdAt?: string;
}

export interface SaleRecord {
  id: string;
  folio: string;
  clientId?: string;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  clientRfc?: string;
  unit: string;
  paymentPlan: string;
  totalPrice: number;
  paidAmount: number;
  pendingAmount: number;
  saleDate: string; // ISO or DD/MM/YY
  coOwners?: CoOwner[];
  additionals?: ProjectAdditional[];
  schedule?: SaleScheduleInstallment[];
  payments?: SalePaymentReceipt[];
  status: "ACTIVA" | "PAGADA" | "CANCELADA";
}

export type SaleItem = SaleRecord;

export interface PaymentScheduleItem {
  id: string;
  clientName: string;
  clientEmail?: string;
  unit: string;
  scheduledAmount: number;
  scheduledDate: string; // DD/MM/YY
  paidAmount: number;
  paymentDate: string; // DD/MM/YY or "Pendiente"
  paymentPlan: string;
  paymentMethod: "Pendiente" | "Transferencia" | "SPEI" | "Cheque" | "Efectivo";
  status: "PENDIENTE" | "PAGADO" | "ATRASADO";
  voucherUrl?: string;
}

export interface ProjectDocument {
  id: string;
  title: string;
  category: "Contratos" | "Legal" | "Técnico" | "Permisos" | "General";
  fileType: "PDF" | "DOCX" | "XLSX" | "DWG" | "ZIP";
  fileSize: string;
  uploadDate: string;
  updatedAt: string;
  url?: string;
  version?: string;
  notes?: string;
}

// ---------------------------------------------------------------------------
// INITIAL SAMPLE DATA EXACT TO SCREENSHOTS
// ---------------------------------------------------------------------------

export const INITIAL_CLIENTS: ClientProfile[] = [
  {
    id: "cli-1",
    name: "Hugo Heredia Horner",
    email: "hheredia@hyhconsultores.com",
    phone: "3322567568",
    rfc: "HEHH820412AA1",
    totalPaid: 0,
    totalPending: 12230000,
    unitsCount: 2,
    ownedUnits: [
      { unit: "1A", type: "Departamento", price: 6000000, ownershipPct: 100, isPrimary: true },
      { unit: "6B", type: "Departamento", price: 6230000, ownershipPct: 100, isPrimary: true },
    ],
  },
  {
    id: "cli-2",
    name: "Inigo Heredia Horner",
    email: "0242573@up.edu.mx",
    phone: "3322567499",
    rfc: "HEHI950718BB2",
    totalPaid: 2570000,
    totalPending: 9430000,
    unitsCount: 2,
    ownedUnits: [
      {
        unit: "1C",
        type: "Departamento",
        price: 6000000,
        ownershipPct: 50,
        isPrimary: true,
        coOwners: [
          {
            id: "co-1",
            name: "Mariana Silva González",
            email: "mariana.silva@gmail.com",
            phone: "3319876543",
            rfc: "SIGM960411CC2",
            ownershipPct: 50,
            isPrimary: false,
          },
        ],
      },
      { unit: "1B", type: "Departamento", price: 6000000, ownershipPct: 100, isPrimary: true },
    ],
  },
  {
    id: "cli-3",
    name: "Inigo Heredia Hernandez",
    email: "iheredia@aktie.com.mx",
    phone: "3348949303",
    rfc: "HEHI700105CC3",
    totalPaid: 0,
    totalPending: 18380000,
    unitsCount: 3,
    ownedUnits: [
      { unit: "2A", type: "Departamento", price: 6000000, ownershipPct: 100, isPrimary: true },
      { unit: "3A", type: "Departamento", price: 6150000, ownershipPct: 100, isPrimary: true },
      { unit: "7B", type: "Departamento", price: 6230000, ownershipPct: 100, isPrimary: true },
    ],
  },
  {
    id: "cli-4",
    name: "Alex",
    email: "acalderoncha@gmail.com",
    phone: "3318497489",
    rfc: "CACA920315DD4",
    totalPaid: 0,
    totalPending: 6230000,
    unitsCount: 1,
    ownedUnits: [
      {
        unit: "4B",
        type: "Departamento",
        price: 6230000,
        ownershipPct: 70,
        isPrimary: true,
        coOwners: [
          {
            id: "co-2",
            name: "Carlos Calderón",
            email: "ccalderon@empresa.mx",
            phone: "3321457890",
            rfc: "CACC650820EE9",
            ownershipPct: 30,
            isPrimary: false,
          },
        ],
      },
    ],
  },
  {
    id: "cli-5",
    name: "Pedro Salvadro",
    email: "pedrosalv@gmail.com",
    phone: "3315848949",
    rfc: "SAPE881020EE5",
    totalPaid: 0,
    totalPending: 6230000,
    unitsCount: 1,
    ownedUnits: [
      { unit: "8B", type: "Departamento", price: 6230000, ownershipPct: 100, isPrimary: true },
    ],
  },
  {
    id: "cli-6",
    name: "Alex",
    email: "medicae.mx@gmail.com",
    phone: "6549845988",
    rfc: "MEMX850614FF6",
    totalPaid: 0,
    totalPending: 6280000,
    unitsCount: 1,
    ownedUnits: [
      { unit: "5C", type: "Departamento", price: 6280000, ownershipPct: 100, isPrimary: true },
    ],
  },
  {
    id: "cli-7",
    name: "Matias Live7823",
    email: "0243450@up.edu.mx",
    phone: "6345645654",
    rfc: "LIMA990203GG7",
    totalPaid: 1546000,
    totalPending: 4684000,
    unitsCount: 1,
    ownedUnits: [
      { unit: "9A", type: "Departamento", price: 6230000, ownershipPct: 100, isPrimary: true },
    ],
  },
];

export const INITIAL_SALES: SaleRecord[] = [
  {
    id: "sale-1",
    folio: "VTA-001",
    clientName: "Hugo Heredia Horner",
    clientEmail: "hheredia@hyhconsultores.com",
    clientPhone: "3322567568",
    unit: "1A",
    paymentPlan: "Plan Oro",
    totalPrice: 6000000,
    paidAmount: 0,
    pendingAmount: 6000000,
    saleDate: "14/08/26",
    status: "ACTIVA",
  },
  {
    id: "sale-2",
    folio: "VTA-002",
    clientName: "Inigo Heredia Horner",
    clientEmail: "0242573@up.edu.mx",
    clientPhone: "3322567499",
    unit: "1C",
    paymentPlan: "Plan Oro",
    totalPrice: 6000000,
    paidAmount: 1200000,
    pendingAmount: 10800000,
    saleDate: "17/08/26",
    status: "ACTIVA",
  },
  {
    id: "sale-3",
    folio: "VTA-003",
    clientName: "Inigo Heredia Horner",
    clientEmail: "0242573@up.edu.mx",
    clientPhone: "3322567499",
    unit: "1B",
    paymentPlan: "Plan Oro",
    totalPrice: 6000000,
    paidAmount: 1370000,
    pendingAmount: 10630000,
    saleDate: "19/08/26",
    status: "ACTIVA",
  },
  {
    id: "sale-4",
    folio: "VTA-004",
    clientName: "Inigo Heredia Hernandez",
    clientEmail: "iheredia@aktie.com.mx",
    clientPhone: "3348949303",
    unit: "2A",
    paymentPlan: "Plan Oro",
    totalPrice: 6000000,
    paidAmount: 0,
    pendingAmount: 6000000,
    saleDate: "22/08/26",
    status: "ACTIVA",
  },
  {
    id: "sale-5",
    folio: "VTA-005",
    clientName: "Inigo Heredia Hernandez",
    clientEmail: "iheredia@aktie.com.mx",
    clientPhone: "3348949303",
    unit: "3A",
    paymentPlan: "Plan Oro modificado",
    totalPrice: 6150000,
    paidAmount: 0,
    pendingAmount: 6150000,
    saleDate: "25/08/26",
    status: "ACTIVA",
  },
  {
    id: "sale-6",
    folio: "VTA-006",
    clientName: "Alex",
    clientEmail: "acalderoncha@gmail.com",
    clientPhone: "3318497489",
    unit: "4B",
    paymentPlan: "Plan Oro modificado",
    totalPrice: 6230000,
    paidAmount: 0,
    pendingAmount: 6230000,
    saleDate: "26/08/26",
    status: "ACTIVA",
  },
  {
    id: "sale-7",
    folio: "VTA-007",
    clientName: "Inigo Heredia Hernandez",
    clientEmail: "iheredia@aktie.com.mx",
    clientPhone: "3348949303",
    unit: "7B",
    paymentPlan: "Plan Interes modificado",
    totalPrice: 6230000,
    paidAmount: 0,
    pendingAmount: 6230000,
    saleDate: "27/08/26",
    status: "ACTIVA",
  },
  {
    id: "sale-8",
    folio: "VTA-008",
    clientName: "Hugo Heredia Horner",
    clientEmail: "hheredia@hyhconsultores.com",
    clientPhone: "3322567568",
    unit: "6B",
    paymentPlan: "Plan Interes modificado",
    totalPrice: 6230000,
    paidAmount: 0,
    pendingAmount: 9230000,
    saleDate: "27/08/26",
    status: "ACTIVA",
  },
  {
    id: "sale-9",
    folio: "VTA-009",
    clientName: "Pedro Salvadro",
    clientEmail: "pedrosalv@gmail.com",
    clientPhone: "3315848949",
    unit: "8B",
    paymentPlan: "Plan Oro modificado",
    totalPrice: 6230000,
    paidAmount: 0,
    pendingAmount: 6230000,
    saleDate: "31/08/26",
    status: "ACTIVA",
  },
  {
    id: "sale-10",
    folio: "VTA-010",
    clientName: "Alex",
    clientEmail: "medicae.mx@gmail.com",
    clientPhone: "6549845988",
    unit: "5C",
    paymentPlan: "Plan Oro modificado",
    totalPrice: 6280000,
    paidAmount: 0,
    pendingAmount: 12280000,
    saleDate: "31/08/26",
    status: "ACTIVA",
  },
];

export const INITIAL_PAYMENTS: PaymentScheduleItem[] = [
  {
    id: "pay-1",
    clientName: "Hugo Heredia Horner",
    clientEmail: "hheredia@hyhconsultores.com",
    unit: "1A",
    scheduledAmount: 250000,
    scheduledDate: "14/10/26",
    paidAmount: 0,
    paymentDate: "Pendiente",
    paymentPlan: "Plan Oro",
    paymentMethod: "Pendiente",
    status: "PENDIENTE",
  },
  {
    id: "pay-2",
    clientName: "Inigo Heredia Horner",
    clientEmail: "0242573@up.edu.mx",
    unit: "1C",
    scheduledAmount: 250000,
    scheduledDate: "17/09/26",
    paidAmount: 0,
    paymentDate: "Pendiente",
    paymentPlan: "Plan Oro",
    paymentMethod: "Pendiente",
    status: "PENDIENTE",
  },
  {
    id: "pay-3",
    clientName: "Inigo Heredia Horner",
    clientEmail: "0242573@up.edu.mx",
    unit: "1C",
    scheduledAmount: 250000,
    scheduledDate: "17/10/26",
    paidAmount: 0,
    paymentDate: "Pendiente",
    paymentPlan: "Plan Oro",
    paymentMethod: "Pendiente",
    status: "PENDIENTE",
  },
  {
    id: "pay-4",
    clientName: "Inigo Heredia Horner",
    clientEmail: "0242573@up.edu.mx",
    unit: "1B",
    scheduledAmount: 250000,
    scheduledDate: "19/09/26",
    paidAmount: 170000,
    paymentDate: "03/08/26",
    paymentPlan: "Plan Oro",
    paymentMethod: "Transferencia",
    status: "PAGADO",
  },
  {
    id: "pay-5",
    clientName: "Inigo Heredia Hernandez",
    clientEmail: "iheredia@aktie.com.mx",
    unit: "2A",
    scheduledAmount: 250000,
    scheduledDate: "22/09/26",
    paidAmount: 0,
    paymentDate: "Pendiente",
    paymentPlan: "Plan Oro",
    paymentMethod: "Pendiente",
    status: "PENDIENTE",
  },
  {
    id: "pay-6",
    clientName: "Inigo Heredia Hernandez",
    clientEmail: "iheredia@aktie.com.mx",
    unit: "3A",
    scheduledAmount: 252083,
    scheduledDate: "25/09/26",
    paidAmount: 0,
    paymentDate: "Pendiente",
    paymentPlan: "Plan Oro modificado",
    paymentMethod: "Pendiente",
    status: "PENDIENTE",
  },
  {
    id: "pay-7",
    clientName: "Alex",
    clientEmail: "acalderoncha@gmail.com",
    unit: "4B",
    scheduledAmount: 259583,
    scheduledDate: "26/09/26",
    paidAmount: 0,
    paymentDate: "Pendiente",
    paymentPlan: "Plan Oro modificado",
    paymentMethod: "Pendiente",
    status: "PENDIENTE",
  },
  {
    id: "pay-8",
    clientName: "Inigo Heredia Hernandez",
    clientEmail: "iheredia@aktie.com.mx",
    unit: "7B",
    scheduledAmount: 155750,
    scheduledDate: "27/09/26",
    paidAmount: 0,
    paymentDate: "Pendiente",
    paymentPlan: "Plan Interes modificado",
    paymentMethod: "Pendiente",
    status: "PENDIENTE",
  },
  {
    id: "pay-9",
    clientName: "Pedro Salvadro",
    clientEmail: "pedrosalv@gmail.com",
    unit: "8B",
    scheduledAmount: 259583,
    scheduledDate: "30/09/26",
    paidAmount: 0,
    paymentDate: "Pendiente",
    paymentPlan: "Plan Oro modificado",
    paymentMethod: "Pendiente",
    status: "PENDIENTE",
  },
  {
    id: "pay-10",
    clientName: "Alex",
    clientEmail: "medicae.mx@gmail.com",
    unit: "5C",
    scheduledAmount: 261667,
    scheduledDate: "30/09/26",
    paidAmount: 0,
    paymentDate: "Pendiente",
    paymentPlan: "Plan Oro modificado",
    paymentMethod: "Pendiente",
    status: "PENDIENTE",
  },
];

export const INITIAL_DOCUMENTS: ProjectDocument[] = [
  {
    id: "doc-1",
    title: "Contrato Tipo A",
    category: "Contratos",
    fileType: "PDF",
    fileSize: "2.4 MB",
    uploadDate: "15/09/2026",
    updatedAt: "15/09/2026",
    version: "v2.1",
    notes: "Machote oficial de contrato de promesa de compraventa tradicional",
  },
  {
    id: "doc-2",
    title: "Contrato Copropiedad Modelo",
    category: "Contratos",
    fileType: "PDF",
    fileSize: "3.1 MB",
    uploadDate: "12/09/2026",
    updatedAt: "14/09/2026",
    version: "v1.4",
    notes: "Cláusulas especiales para co-titulares y designación de representante",
  },
  {
    id: "doc-3",
    title: "Reglamento de Condominio",
    category: "Legal",
    fileType: "PDF",
    fileSize: "1.8 MB",
    uploadDate: "01/09/2026",
    updatedAt: "01/09/2026",
    version: "v1.0",
    notes: "Reglamento interno, uso de amenidades y cuotas de mantenimiento",
  },
  {
    id: "doc-4",
    title: "Planos Arquitectónicos y Estructurales",
    category: "Técnico",
    fileType: "PDF",
    fileSize: "18.5 MB",
    uploadDate: "20/08/2026",
    updatedAt: "05/09/2026",
    version: "v3.0",
    notes: "Planos ejecutivos autorizados con sellos periciales",
  },
  {
    id: "doc-5",
    title: "Licencia de Construcción Vigente",
    category: "Permisos",
    fileType: "PDF",
    fileSize: "1.2 MB",
    uploadDate: "10/08/2026",
    updatedAt: "10/08/2026",
    version: "v1.0",
    notes: "Licencia municipal de edificación mayor 2026-2028",
  },
  {
    id: "doc-6",
    title: "Padrón Catastral y Régimen en Condominio",
    category: "Legal",
    fileType: "PDF",
    fileSize: "4.6 MB",
    uploadDate: "05/08/2026",
    updatedAt: "05/08/2026",
    version: "v1.1",
    notes: "Escritura pública de constitución de régimen de propiedad en condominio",
  },
];

export const INITIAL_PROJECTS: ProjectItem[] = [
  {
    id: "p-1",
    name: "Castellana Residencial",
    type: "Vertical",
    image: "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=800&q=80",
    progressPct: 40,
    totalUnits: 14,
    soldUnits: 6,
    availableUnits: 7,
    blockedUnits: 1,
    metrics: {
      totalCobrado: 0,
      porCobrar: 0,
      pagosAtrasados: 0,
      avanceVentasPct: 0,
      unidadesVendidasCount: 0,
      unidadesTotalesCount: 14,
      porVenderUnidades: 14,
      valorComercialVendido: 0,
      valorComercialTotal: 176647126,
      porVenderMonto: 176647126,
      flujoFuturoMonto: 0,
      precioPromedio: 3500000,
      inventarioMonetarioPct: 0,
      totalFacturado: 0,
      distribucionPct: 0,
    },
    monthlyBilling: [],
    overdueClients: [],
    unitsInventory: [
      {
        id: "u-1",
        unit: "1A",
        type: "Departamento",
        price: 2444597,
        areaM2: 75,
        floor: 1,
        status: "DISPONIBLE",
        client: "-",
        deliveryDate: "15/05/2028",
        priceHistory: [
          {
            date: "10/01/2026",
            previousPrice: 2350000,
            newPrice: 2444597,
            pctChange: 4.02,
            reason: "Ajuste anual por inflación y avance de obra",
            user: "Lizbeth Balderas",
          },
        ],
      },
      {
        id: "u-2",
        unit: "2A",
        type: "Departamento",
        price: 2550000,
        areaM2: 75,
        floor: 2,
        status: "DISPONIBLE",
        client: "-",
        deliveryDate: "15/05/2028",
        priceHistory: [
          {
            date: "10/01/2026",
            previousPrice: 2450000,
            newPrice: 2550000,
            pctChange: 4.08,
            reason: "Ajuste inicial de lista",
            user: "Lizbeth Balderas",
          },
        ],
      },
      {
        id: "u-3",
        unit: "3A",
        type: "Departamento",
        price: 2600000,
        areaM2: 80,
        floor: 3,
        status: "VENDIDA",
        client: "Neil Alberto Garcia + Mariana Soto",
        coOwners: [
          {
            id: "co-1",
            name: "Neil Alberto Garcia",
            email: "neil.garcia@gmail.com",
            phone: "(331) 222-3344",
            rfc: "GANE850101XYZ",
            ownershipPct: 60,
            isPrimary: true,
            relationship: "Titular Principal",
          },
          {
            id: "co-2",
            name: "Mariana Soto Valenzuela",
            email: "mariana.soto@gmail.com",
            phone: "(331) 555-9988",
            rfc: "SOVM880415ABC",
            ownershipPct: 40,
            isPrimary: false,
            relationship: "Cónyuge / Co-propietaria",
          },
        ],
        deliveryDate: "15/05/2028",
      },
      {
        id: "u-4",
        unit: "4A",
        type: "Departamento",
        price: 2890000,
        areaM2: 85,
        floor: 4,
        status: "DISPONIBLE",
        client: "-",
        deliveryDate: "15/05/2028",
      },
      {
        id: "u-5",
        unit: "5A",
        type: "Departamento",
        price: 3150000,
        areaM2: 90,
        floor: 5,
        status: "VENDIDA",
        client: "Luis Alberto Dieguez Lopez",
        coOwners: [
          {
            id: "co-3",
            name: "Luis Alberto Dieguez Lopez",
            email: "luis.dieguez@empresa.com",
            phone: "(333) 888-1234",
            rfc: "DILL790920KK1",
            ownershipPct: 100,
            isPrimary: true,
          },
        ],
        deliveryDate: "15/05/2028",
      },
      {
        id: "u-6",
        unit: "6A",
        type: "Departamento",
        price: 2950000,
        areaM2: 80,
        floor: 6,
        status: "VENDIDA",
        client: "Carlos Mendez R.",
        coOwners: [
          {
            id: "co-4",
            name: "Carlos Mendez R.",
            email: "carlos.mendez@techcorp.mx",
            phone: "(331) 777-6655",
            rfc: "MERC821110AA2",
            ownershipPct: 100,
            isPrimary: true,
          },
        ],
        deliveryDate: "15/05/2028",
      },
      {
        id: "u-7",
        unit: "7A",
        type: "Departamento",
        price: 3450000,
        areaM2: 95,
        floor: 7,
        status: "DISPONIBLE",
        client: "-",
        deliveryDate: "15/05/2028",
      },
      {
        id: "u-8",
        unit: "8A",
        type: "Departamento",
        price: 3600000,
        areaM2: 100,
        floor: 8,
        status: "VENDIDA",
        client: "Gloria Marisol Herrera + Roberto Herrera",
        coOwners: [
          {
            id: "co-5",
            name: "Gloria Marisol Herrera Gonzalez",
            email: "marisol.herrera@outlook.com",
            phone: "(332) 444-5566",
            rfc: "HEGG870312JJ5",
            ownershipPct: 50,
            isPrimary: true,
            relationship: "Co-titular 1",
          },
          {
            id: "co-6",
            name: "Roberto Herrera Gonzalez",
            email: "roberto.herrera@outlook.com",
            phone: "(332) 444-5577",
            rfc: "HEGR890525KK8",
            ownershipPct: 50,
            isPrimary: false,
            relationship: "Hermano / Co-titular 2",
          },
        ],
        deliveryDate: "15/05/2028",
      },
      {
        id: "u-9",
        unit: "9A",
        type: "Departamento",
        price: 3200000,
        areaM2: 85,
        floor: 9,
        status: "DISPONIBLE",
        client: "-",
        deliveryDate: "15/05/2028",
      },
      {
        id: "u-10",
        unit: "10A",
        type: "Departamento",
        price: 3950000,
        areaM2: 110,
        floor: 10,
        status: "VENDIDA",
        client: "Alvaro Seńkowski Ortega",
        coOwners: [
          {
            id: "co-7",
            name: "Alvaro Seńkowski Ortega",
            email: "alvaro.senkowski@live.com",
            phone: "(333) 111-9988",
            rfc: "SEOA780410LM9",
            ownershipPct: 100,
            isPrimary: true,
          },
        ],
        deliveryDate: "15/05/2028",
      },
      {
        id: "u-11",
        unit: "11A",
        type: "Departamento",
        price: 3500000,
        areaM2: 95,
        floor: 11,
        status: "DISPONIBLE",
        client: "-",
        deliveryDate: "15/05/2028",
      },
      {
        id: "u-12",
        unit: "12A",
        type: "Departamento",
        price: 4150000,
        areaM2: 115,
        floor: 12,
        status: "VENDIDA",
        client: "Orely Karina Barrera Goytia",
        coOwners: [
          {
            id: "co-8",
            name: "Orely Karina Barrera Goytia",
            email: "karina.barrera@gmail.com",
            phone: "(331) 555-7766",
            rfc: "BAGO901201PP8",
            ownershipPct: 100,
            isPrimary: true,
          },
        ],
        deliveryDate: "15/05/2028",
      },
      {
        id: "u-13",
        unit: "13A",
        type: "Departamento",
        price: 3800000,
        areaM2: 105,
        floor: 13,
        status: "DISPONIBLE",
        client: "-",
        deliveryDate: "15/05/2028",
      },
      {
        id: "u-14",
        unit: "14A",
        type: "Penthouse",
        price: 4500000,
        areaM2: 130,
        floor: 14,
        status: "BLOQUEADA",
        client: "-",
        deliveryDate: "15/05/2028",
      },
    ],
    floorPlans: [
      {
        id: "fp-1",
        name: "Planta Tipo A (2 Recámaras)",
        imageUrl: "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1200&q=80",
      },
      {
        id: "fp-2",
        name: "Planta Tipo B (3 Recámaras)",
        imageUrl: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1200&q=80",
      },
      {
        id: "fp-3",
        name: "Planta Tipo C (1 Recámara)",
        imageUrl: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1200&q=80",
      },
      {
        id: "fp-4",
        name: "Planta Penthouse Sky",
        imageUrl: "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1200&q=80",
      },
    ],
    legalName: "Inmobiliaria Castellana S.A. de C.V.",
    description: "Desarrollo residencial vertical premium ubicado en una de las zonas con mayor plusvalía, con acabados de lujo y amenidades exclusivas.",
    googleMapsUrl: "https://maps.google.com/?q=Av.+de+las+Rosas+1234,+Guadalajara",
    websiteUrl: "https://castellanagdl.mx",
    totalSurfaceM2: 12500,
    estimatedDeliveryDate: "15/05/2028",
    currency: "MXN",
    constructionHistory: [
      {
        id: "adv-1",
        title: "Cimentación y Muros de Contención Concluidos",
        date: "15/08/2026",
        pct: 25,
        image: "https://images.unsplash.com/photo-1541888946425-d0fbb18f15f6?auto=format&fit=crop&w=600&q=80",
        description: "Se finalizó al 100% la excavación profunda, pilotes de cimentación y colado de losas de sótano 1 y 2.",
        cimentacionPct: 100,
        estructuraPct: 20,
        instalacionesPct: 0,
        acabadosPct: 0,
        targetScope: "PROJECT",
        emailSent: true,
      },
      {
        id: "adv-2",
        title: "Estructura Principal hasta Nivel 8 y Ductos Hidráulicos",
        date: "10/09/2026",
        pct: 40,
        image: "https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&w=600&q=80",
        description: "Avance estructural en niveles intermedios, colado de columnas y colocación de montantes hidrosanitarias.",
        cimentacionPct: 100,
        estructuraPct: 65,
        instalacionesPct: 30,
        acabadosPct: 5,
        targetScope: "PROJECT",
        emailSent: true,
      },
    ],
    quotes: [
      {
        id: "quote-1",
        folio: "COT-2026-1048",
        projectId: "p-1",
        projectName: "Castellana Residencial",
        unit: "1A",
        unitType: "Departamento",
        superficieM2: 75,
        deliveryDate: "15/05/2028",
        clientName: "Hugo Heredia Horner",
        clientEmail: "hheredia@hyhconsultores.com",
        clientPhone: "3322567568",
        clientRfc: "HEHH820412AA1",
        advisorName: "Lizbeth Balderas",
        advisorEmail: "ventas@castellana.mx",
        advisorPhone: "3331234567",
        listPrice: 2444597,
        discountPct: 0,
        discountAmount: 0,
        totalQuoteAmount: 2444597,
        planName: "Plan Preventa",
        downPaymentPct: 20,
        downPaymentAmount: 488919,
        installmentsCount: 12,
        installmentAmount: 101858,
        periodicity: "Mensual",
        settlementPct: 30,
        settlementAmount: 733379,
        status: "VIGENTE",
        createdAt: "2026-09-18T10:00:00.000Z",
        expiresAt: "2026-10-18T10:00:00.000Z",
      },
      {
        id: "quote-2",
        folio: "COT-2026-1035",
        projectId: "p-1",
        projectName: "Castellana Residencial",
        unit: "2A",
        unitType: "Departamento",
        superficieM2: 75,
        deliveryDate: "15/05/2028",
        clientName: "Inigo Heredia Horner",
        clientEmail: "0242573@up.edu.mx",
        clientPhone: "3322567499",
        clientRfc: "HEHI950718BB2",
        advisorName: "Carlos Mendoza",
        advisorEmail: "carlos@castellana.mx",
        advisorPhone: "3339876543",
        listPrice: 2550000,
        discountPct: 0,
        discountAmount: 0,
        totalQuoteAmount: 2550000,
        planName: "Plan Inversionista",
        downPaymentPct: 50,
        downPaymentAmount: 1275000,
        installmentsCount: 24,
        installmentAmount: 53125,
        periodicity: "Mensual",
        settlementPct: 0,
        settlementAmount: 0,
        status: "CONVERTIDA_A_VENTA",
        createdAt: "2026-09-12T14:30:00.000Z",
        expiresAt: "2026-10-12T14:30:00.000Z",
      },
      {
        id: "quote-3",
        folio: "COT-2026-1012",
        projectId: "p-1",
        projectName: "Castellana Residencial",
        unit: "4A",
        unitType: "Departamento",
        superficieM2: 85,
        deliveryDate: "15/05/2028",
        clientName: "Mariana Soto Valenzuela",
        clientEmail: "mariana.soto@gmail.com",
        clientPhone: "3315559988",
        clientRfc: "SOVM880415ABC",
        advisorName: "Lizbeth Balderas",
        advisorEmail: "ventas@castellana.mx",
        advisorPhone: "3331234567",
        listPrice: 2890000,
        discountPct: 0,
        discountAmount: 0,
        totalQuoteAmount: 2890000,
        planName: "Plan Tradicional",
        downPaymentPct: 30,
        downPaymentAmount: 867000,
        installmentsCount: 18,
        installmentAmount: 80277,
        periodicity: "Mensual",
        settlementPct: 20,
        settlementAmount: 578000,
        status: "EXPIRADA",
        createdAt: "2026-08-10T09:15:00.000Z",
        expiresAt: "2026-09-10T09:15:00.000Z",
      },
    ],
  },
  {
    id: "p-2",
    name: "Mainstreet Valle Real",
    type: "Vertical",
    image: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=800&q=80",
    progressPct: 0,
    totalUnits: 58,
    soldUnits: 19,
    availableUnits: 39,
    blockedUnits: 0,
    metrics: {
      totalCobrado: 0,
      porCobrar: 0,
      pagosAtrasados: 0,
      avanceVentasPct: 0,
      unidadesVendidasCount: 0,
      unidadesTotalesCount: 58,
      porVenderUnidades: 58,
      valorComercialVendido: 0,
      valorComercialTotal: 245000000,
      porVenderMonto: 245000000,
      flujoFuturoMonto: 0,
      precioPromedio: 4200000,
      inventarioMonetarioPct: 0,
      totalFacturado: 0,
      distribucionPct: 0,
    },
    monthlyBilling: [],
    overdueClients: [],
    unitsInventory: [
      {
        id: "u-201",
        unit: "101",
        type: "Departamento",
        price: 3900000,
        areaM2: 85,
        floor: 1,
        status: "DISPONIBLE",
        client: "-",
        floorPlan: "Planta Tipo A (2 Recámaras)",
      },
    ],
    floorPlans: [
      {
        id: "fp-p2-1",
        name: "Planta Tipo A (2 Recámaras)",
        imageUrl: "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1200&q=80",
      },
    ],
  },
];
