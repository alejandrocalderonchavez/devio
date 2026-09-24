export interface ClientUser {
  id: string;
  name: string;
  email: string;
  phone: string;
  rfc?: string;
  address?: string;
  avatarUrl?: string;
  preferredLanguage?: "es" | "en";
}

export interface ClientPropertyImage {
  id: string;
  url: string;
  caption?: string;
}

export interface SpecialtyProgress {
  id: string;
  name: string;
  percentage: number;
  iconName?: string;
}

export interface ConstructionMilestone {
  id: string;
  title: string;
  date: string;
  photo?: string;
  photos?: string[];
  description?: string;
}

export interface ClientDocument {
  id: string;
  title: string;
  category: string;
  fileUrl?: string;
  fileSize: string;
  uploadDate: string;
}

export interface ClientPaymentScheduleItem {
  id: string;
  cuotaNumber: number;
  concept: string;
  amount: number;
  interestAmount?: number;
  scheduledDate: string;
  status: "PAGADO" | "PENDIENTE" | "ATRASADO";
  paidDate?: string;
  paidAmount?: number;
  paymentMethod?: string;
  receiptNumber?: string;
  receiptUrl?: string;
  montoPagado?: number;
  saldoPendiente?: number;
}

export interface ClientPaymentReceiptItem {
  id: string;
  folio?: string;
  fechaPago: string;
  monto: number;
  metodoPago: string;
  reciboFolio?: string;
  comprobanteUrl?: string;
  moratoryAmount?: number;
  unit?: string;
}

export interface ClientProperty {
  id: string;
  clientEmail?: string;
  developerName: string;
  developerLogo?: string;
  projectName: string;
  projectLogo?: string;
  projectAddress: string;
  unitNumber: string;
  unitType: string;
  totalPrice: number;
  paidAmount: number;
  pendingAmount: number;
  overdueAmount: number;
  nextPaymentAmount: number;
  nextPaymentDueDate: string;
  nextPaymentDaysRemaining: number;
  nextPaymentConcept?: string;
  constructionPct: number;
  lastProgressUpdateDate: string;
  estimatedDeliveryDate: string;
  areaM2: number;
  bedrooms: number;
  bathrooms: number;
  parkingSpots?: number;
  storageUnits?: number;
  floorLevel?: number;
  maintenanceFeeMonthly?: number;
  images: string[];
  specialtiesProgress: SpecialtyProgress[];
  constructionMilestones: ConstructionMilestone[];
  documents: ClientDocument[];
  schedule: ClientPaymentScheduleItem[];
  paymentsList: ClientPaymentReceiptItem[];
  payments: ClientPaymentScheduleItem[];
  customAttributes?: Array<{ key: string; label: string; value: string }>;
}

export interface PushNotificationItem {
  id: string;
  title: string;
  body: string;
  time: string;
  timestamp?: string;
  read: boolean;
  type: "warning" | "success" | "info";
  category?: "COBRANZA" | "OBRA" | "DOCUMENTO" | "SISTEMA";
  targetScreen?: "property-detail" | "construction" | "documents" | "account-statement";
  propertyId?: string;
}
