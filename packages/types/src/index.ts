export type Brand<T, Name extends string> = T & { readonly __brand: Name };

export type UserId = Brand<string, "UserId">;
export type DeveloperId = Brand<string, "DeveloperId">;
export type ProjectId = Brand<string, "ProjectId">;
export type UnitId = Brand<string, "UnitId">;
export type ClientId = Brand<string, "ClientId">;
export type SaleId = Brand<string, "SaleId">;
export type ObligationId = Brand<string, "ObligationId">;
export type PaymentReceiptId = Brand<string, "PaymentReceiptId">;
export type DocumentId = Brand<string, "DocumentId">;
export type IncidentId = Brand<string, "IncidentId">;

// Roles
export const USER_ROLES = [
  "SUPER_ADMIN",
  "ADMIN",
  "COMMERCIAL",
  "CONSTRUCTION",
  "CLIENT",
] as const;
export type UserRole = (typeof USER_ROLES)[number];

// Tipologías de Proyectos
export const PROJECT_TYPES = [
  "VERTICAL",
  "HORIZONTAL",
  "COMMERCIAL",
  "INDUSTRIAL",
  "MIXED",
] as const;
export type ProjectType = (typeof PROJECT_TYPES)[number];

export const PROJECT_STATUSES = ["DRAFT", "ACTIVE", "ARCHIVED"] as const;
export type ProjectStatus = (typeof PROJECT_STATUSES)[number];

// Divisas e Idiomas
export const CURRENCIES = ["MXN", "USD"] as const;
export type Currency = (typeof CURRENCIES)[number];

export const LANGUAGES = ["ES", "EN"] as const;
export type Language = (typeof LANGUAGES)[number];

// Categorías y Estados de Unidades
export const UNIT_CATEGORIES = [
  "APARTMENT",
  "HOUSE",
  "COMMERCIAL_SPACE",
  "INDUSTRIAL_WAREHOUSE",
  "LAND_LOT",
  "OFFICE",
  "OTHER",
] as const;
export type UnitCategory = (typeof UNIT_CATEGORIES)[number];

export const UNIT_STATUSES = [
  "AVAILABLE",
  "RESERVED",
  "BLOCKED",
  "SOLD",
] as const;
export type UnitStatus = (typeof UNIT_STATUSES)[number];

export const ADDITIONAL_TYPES = ["PARKING", "STORAGE", "OTHER"] as const;
export type AdditionalType = (typeof ADDITIONAL_TYPES)[number];

export const ADDITIONAL_STATUSES = ["AVAILABLE", "ASSIGNED", "SOLD"] as const;
export type AdditionalStatus = (typeof ADDITIONAL_STATUSES)[number];

// Ventas y Copropiedad
export const SALE_STATUSES = [
  "RESERVED",
  "IN_CONTRACT",
  "ACTIVE",
  "LIQUIDATED",
  "CANCELLED",
] as const;
export type SaleStatus = (typeof SALE_STATUSES)[number];

export const OBLIGATION_TYPES = [
  "RESERVATION",
  "DOWN_PAYMENT",
  "INSTALLMENT",
  "SETTLEMENT",
  "ADDITIONAL",
  "INTEREST",
  "OTHER",
] as const;
export type ObligationType = (typeof OBLIGATION_TYPES)[number];

export const OBLIGATION_STATUSES = [
  "PENDING",
  "PARTIALLY_PAID",
  "PAID",
  "OVERDUE",
  "CANCELLED",
] as const;
export type ObligationStatus = (typeof OBLIGATION_STATUSES)[number];

export const PAYMENT_METHODS = [
  "TRANSFER",
  "CHECK",
  "CARD",
  "CASH",
  "DIRECT_DEBIT",
  "OTHER",
] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export const ADJUSTMENT_TYPES = [
  "DISCOUNT",
  "PENALTY",
  "CREDIT_NOTE",
  "CORRECTION",
] as const;
export type AdjustmentType = (typeof ADJUSTMENT_TYPES)[number];

// Documentos
export const DOCUMENT_TYPES = [
  "QUOTE",
  "RECEIPT",
  "STATEMENT",
  "CONTRACT",
  "ID_OFFICIAL",
  "PROOF_OF_INCOME",
  "TAX_CERTIFICATE",
  "BLUEPRINT",
  "OTHER",
] as const;
export type DocumentType = (typeof DOCUMENT_TYPES)[number];

// Postventa
export const POSTSALE_INCIDENT_STATUSES = [
  "REPORTED",
  "UNDER_REVIEW",
  "ASSIGNED",
  "VISIT_SCHEDULED",
  "IN_REPAIR",
  "WAITING_CLIENT",
  "RESOLVED",
  "CLOSED",
  "REOPENED",
] as const;
export type PostsaleIncidentStatus = (typeof POSTSALE_INCIDENT_STATUSES)[number];

export const POSTSALE_PRIORITIES = ["LOW", "MEDIUM", "HIGH", "URGENT"] as const;
export type PostsalePriority = (typeof POSTSALE_PRIORITIES)[number];

// -----------------------------------------------------------------------------
// DTOs & Domain Interfaces
// -----------------------------------------------------------------------------

export interface ApiHealth {
  service: "devio-api" | "devio-worker";
  status: "ok";
  timestamp: string;
}

// Banxico FX
export interface BanxicoExchangeRateResponse {
  date: string; // YYYY-MM-DD
  rate: number; // MXN per 1 USD
  source: string;
}

export interface CurrencyConversion {
  amount: number;
  fromCurrency: Currency;
  toCurrency: Currency;
  rate: number;
  convertedAmount: number;
  rateDate: string;
}

// Atributos Específicos por Tipología
export interface VerticalAttributes {
  elevatorAccess?: boolean;
  viewOrientation?: string;
  floorNumber?: number;
  towerName?: string;
  balconyAreaM2?: number;
}

export interface HorizontalAttributes {
  lotNumber?: string;
  modelName?: string;
  landAreaM2?: number;
  constructionAreaM2?: number;
  privateGardenM2?: number;
  frontageMeters?: number;
  depthMeters?: number;
}

export interface CommercialAttributes {
  businessTypeAllowed?: string[];
  pedestrianTrafficLevel?: "LOW" | "MEDIUM" | "HIGH";
  mezzanineAreaM2?: number;
  hasGasInstallation?: boolean;
  electricalKVA?: number;
}

export interface IndustrialAttributes {
  clearHeightMeters?: number;
  floorLoadCapacityTonM2?: number;
  loadingDocksCount?: number;
  hasTrailerAccess?: boolean;
  electricalKVA?: number;
  zoningType?: string;
}

// Copropiedad
export interface CoOwnerInput {
  clientId: string;
  ownershipPercentage: number;
  isMainContact?: boolean;
  notes?: string;
}

// Cotizador
export interface QuoteCalculationRequest {
  projectId: string;
  unitId: string;
  additionalIds?: string[];
  discountPercentage?: number;
  discountFixedAmount?: number;
  downPaymentPercentage: number;
  installmentsCount: number;
  settlementPercentage: number;
  targetCurrency?: Currency;
}

export interface ScheduledPaymentSimulation {
  obligationNumber: number;
  type: ObligationType;
  title: string;
  dueDate: string;
  amount: number;
  currency: Currency;
  percentageOfTotal: number;
}

export interface QuoteCalculationResult {
  unitPrice: number;
  additionalsTotal: number;
  grossTotal: number;
  discountTotal: number;
  netFinalPrice: number;
  currency: Currency;
  convertedFinalPrice?: number;
  targetCurrency?: Currency;
  exchangeRateApplied?: number;
  downPaymentAmount: number;
  installmentsTotalAmount: number;
  perInstallmentAmount: number;
  settlementAmount: number;
  schedule: ScheduledPaymentSimulation[];
}
