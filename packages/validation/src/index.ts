import { z } from "zod";

// -----------------------------------------------------------------------------
// ENTORNO
// -----------------------------------------------------------------------------

export const serverEnvironmentSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  API_URL: z.string().url().default("http://localhost:4000"),
  DATABASE_URL: z.string().min(1),
  DIRECT_URL: z.string().min(1).optional(),
  SUPABASE_URL: z.string().url(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  BANXICO_TOKEN: z.string().optional(),
});

export const publicEnvironmentSchema = z.object({
  NEXT_PUBLIC_API_URL: z.string().url().default("http://localhost:4000"),
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
});

export type ServerEnvironment = z.infer<typeof serverEnvironmentSchema>;
export type PublicEnvironment = z.infer<typeof publicEnvironmentSchema>;

// -----------------------------------------------------------------------------
// ENUMS & COMUNES
// -----------------------------------------------------------------------------

export const currencySchema = z.enum(["MXN", "USD"]);
export const languageSchema = z.enum(["ES", "EN"]);
export const projectTypeSchema = z.enum([
  "VERTICAL",
  "HORIZONTAL",
  "COMMERCIAL",
  "INDUSTRIAL",
  "MIXED",
]);
export const projectStatusSchema = z.enum(["DRAFT", "ACTIVE", "ARCHIVED"]);
export const unitCategorySchema = z.enum([
  "APARTMENT",
  "HOUSE",
  "COMMERCIAL_SPACE",
  "INDUSTRIAL_WAREHOUSE",
  "LAND_LOT",
  "OFFICE",
  "OTHER",
]);
export const unitStatusSchema = z.enum([
  "AVAILABLE",
  "RESERVED",
  "BLOCKED",
  "SOLD",
]);
export const additionalTypeSchema = z.enum(["PARKING", "STORAGE", "OTHER"]);
export const paymentMethodSchema = z.enum([
  "TRANSFER",
  "CHECK",
  "CARD",
  "CASH",
  "DIRECT_DEBIT",
  "OTHER",
]);

// -----------------------------------------------------------------------------
// ONBOARDING DE DESARROLLADORA
// -----------------------------------------------------------------------------

export const developerOnboardingSchema = z.object({
  name: z.string().min(2, "El nombre comercial es obligatorio"),
  legalName: z.string().min(2, "La razón social es obligatoria"),
  taxId: z
    .string()
    .min(12, "El RFC debe tener al menos 12 caracteres")
    .max(13, "El RFC no debe exceder 13 caracteres")
    .regex(/^[A-ZÑ&]{3,4}\d{6}[A-V1-9][A-Z1-9][0-9A]$/i, "Formato de RFC inválido")
    .optional()
    .or(z.literal("")),
  logoPath: z.string().optional(),
  phone: z.string().min(10, "El teléfono debe tener al menos 10 dígitos").optional(),
  email: z.string().email("Correo electrónico inválido").optional(),
  website: z.string().url("URL de sitio web inválida").optional().or(z.literal("")),
  instagram: z.string().optional(),
  addressLine1: z.string().min(3, "La dirección es obligatoria").optional(),
  addressLine2: z.string().optional(),
  neighborhood: z.string().min(2, "La colonia es obligatoria").optional(),
  city: z.string().min(2, "La ciudad es obligatoria").optional(),
  state: z.string().min(2, "El estado es obligatorio").optional(),
  postalCode: z.string().min(4, "Código postal inválido").max(10).optional(),
  country: z.string().default("MEX"),
  description: z.string().max(1000).optional(),
});

export type DeveloperOnboardingInput = z.infer<typeof developerOnboardingSchema>;

// -----------------------------------------------------------------------------
// ONBOARDING DE PROYECTO (5 ETAPAS)
// -----------------------------------------------------------------------------

// Etapa 1: Datos Generales
export const projectGeneralDataSchema = z.object({
  name: z.string().min(2, "El nombre del proyecto es obligatorio"),
  code: z.string().max(10, "El código no debe exceder 10 caracteres").optional(),
  projectType: projectTypeSchema.default("VERTICAL"),
  baseCurrency: currencySchema.default("MXN"),
  defaultLanguage: languageSchema.default("ES"),
  lateInterestRateMonthly: z.number().min(0).max(100).default(0),
  commercialCommissionPercentage: z.number().min(0).max(100).default(0),
  description: z.string().max(2000).optional(),
  addressLine1: z.string().optional(),
  addressLine2: z.string().optional(),
  neighborhood: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  postalCode: z.string().optional(),
  country: z.string().default("MEX"),
});

// Etapa 2: Inventario
export const unitCreationSchema = z.object({
  unitNumber: z.string().min(1, "El identificador de unidad es obligatorio"),
  category: unitCategorySchema.default("APARTMENT"),
  status: unitStatusSchema.default("AVAILABLE"),
  level: z.number().int().optional(),
  tower: z.string().optional(),
  zone: z.string().optional(),
  totalAreaM2: z.number().positive("El área total debe ser mayor a 0"),
  interiorAreaM2: z.number().positive().optional(),
  terraceAreaM2: z.number().nonnegative().optional(),
  gardenAreaM2: z.number().nonnegative().optional(),
  lotAreaM2: z.number().nonnegative().optional(),
  constructionAreaM2: z.number().nonnegative().optional(),
  bedrooms: z.number().int().nonnegative().optional(),
  bathrooms: z.number().nonnegative().optional(),
  halfBathrooms: z.number().int().nonnegative().optional(),
  parkingSpaces: z.number().int().nonnegative().default(0),
  storageRooms: z.number().int().nonnegative().default(0),
  basePrice: z.number().positive("El precio debe ser mayor a 0"),
  currency: currencySchema.default("MXN"),
  customAttributes: z.record(z.string(), z.any()).optional(),
});

export const unitAdditionalCreationSchema = z.object({
  name: z.string().min(1, "El nombre del adicional es obligatorio"),
  type: additionalTypeSchema.default("PARKING"),
  price: z.number().nonnegative("El precio no puede ser negativo"),
  currency: currencySchema.default("MXN"),
});

// Etapa 3: Plantilla de Planes de Pago
export const paymentPlanTemplateSchema = z.object({
  name: z.string().min(1, "Nombre del plan"),
  downPaymentPercentage: z.number().min(0).max(100),
  installmentsCount: z.number().int().min(0).max(120),
  settlementPercentage: z.number().min(0).max(100),
  discountPercentage: z.number().min(0).max(100).default(0),
  notes: z.string().optional(),
}).refine(
  (data) => Math.abs(data.downPaymentPercentage + data.settlementPercentage + (data.installmentsCount > 0 ? (100 - data.downPaymentPercentage - data.settlementPercentage) : 0) - 100) < 0.01,
  {
    message: "La suma de enganche, parcialidades y liquidación debe equivaler al 100%",
  }
);

// -----------------------------------------------------------------------------
// COTIZADOR & SIMULACIÓN FINANCIERA
// -----------------------------------------------------------------------------

export const quoteCalculationSchema = z.object({
  projectId: z.string().uuid(),
  unitId: z.string().uuid(),
  additionalIds: z.array(z.string().uuid()).default([]),
  discountPercentage: z.number().min(0).max(100).default(0),
  discountFixedAmount: z.number().min(0).default(0),
  downPaymentPercentage: z.number().min(0).max(100),
  installmentsCount: z.number().int().min(0).max(120),
  settlementPercentage: z.number().min(0).max(100),
  targetCurrency: currencySchema.optional(),
}).refine(
  (data) => Math.abs(data.downPaymentPercentage + data.settlementPercentage + (data.installmentsCount > 0 ? (100 - data.downPaymentPercentage - data.settlementPercentage) : 0) - 100) < 0.01,
  {
    message: "La distribución del plan de pagos debe sumar 100%",
  }
);

// -----------------------------------------------------------------------------
// VENTAS Y COPROPIEDAD
// -----------------------------------------------------------------------------

export const coOwnerInputSchema = z.object({
  clientId: z.string().uuid(),
  ownershipPercentage: z.number().min(0.01).max(100),
  isMainContact: z.boolean().default(false),
  notes: z.string().optional(),
});

export const saleCreationSchema = z.object({
  projectId: z.string().uuid(),
  unitId: z.string().uuid(),
  coOwners: z.array(coOwnerInputSchema).min(1, "Debe haber al menos un propietario"),
  agreedPrice: z.number().positive(),
  discountAmount: z.number().min(0).default(0),
  baseCurrency: currencySchema.default("MXN"),
  downPaymentPercentage: z.number().min(0).max(100),
  installmentsCount: z.number().int().min(0).max(120),
  settlementPercentage: z.number().min(0).max(100),
  reservationDate: z.string().datetime().optional(),
  deliveryDate: z.string().datetime().optional(),
  contractDate: z.string().datetime().optional(),
  contractNumber: z.string().optional(),
}).refine(
  (data) => {
    const totalPercentage = data.coOwners.reduce(
      (acc, co) => acc + co.ownershipPercentage,
      0
    );
    return Math.abs(totalPercentage - 100) < 0.01;
  },
  {
    message: "La suma de los porcentajes de copropiedad debe ser exactamente 100%",
    path: ["coOwners"],
  }
);

// -----------------------------------------------------------------------------
// REGISTRO DE PAGOS Y RECIBOS
// -----------------------------------------------------------------------------

export const paymentReceiptCreationSchema = z.object({
  saleId: z.string().uuid(),
  payerClientId: z.string().uuid().optional(),
  receiptFolio: z.string().min(1, "El folio es obligatorio"),
  paymentDate: z.string().datetime(),
  paymentMethod: paymentMethodSchema.default("TRANSFER"),
  bankName: z.string().optional(),
  transactionReference: z.string().optional(),
  amount: z.number().positive("El monto pagado debe ser mayor a 0"),
  currency: currencySchema.default("MXN"),
  exchangeRateToSaleCurrency: z.number().positive().default(1.0),
  voucherDocumentId: z.string().uuid().optional(),
  notes: z.string().optional(),
  allocations: z.array(
    z.object({
      obligationId: z.string().uuid(),
      amountApplied: z.number().positive(),
      amountToPrincipal: z.number().nonnegative(),
      amountToInterest: z.number().nonnegative().default(0),
    })
  ).min(1, "Debe aplicar el pago a al menos una obligación"),
});

// -----------------------------------------------------------------------------
// INVITACIÓN Y ALTA DE USUARIOS / EQUIPO
// -----------------------------------------------------------------------------

export const userRoleSchema = z.enum([
  "SUPER_ADMIN",
  "ADMIN",
  "COMMERCIAL",
  "CONSTRUCTION",
  "CLIENT",
]);

export const inviteUserSchema = z.object({
  developerId: z.string().uuid(),
  email: z.string().email("Correo electrónico inválido"),
  fullName: z.string().min(2, "El nombre completo es obligatorio"),
  phone: z.string().min(10, "El teléfono debe tener al menos 10 dígitos").optional(),
  role: userRoleSchema.default("COMMERCIAL"),
  projectIds: z.array(z.string().uuid()).default([]),
});

export type InviteUserInput = z.infer<typeof inviteUserSchema>;

// -----------------------------------------------------------------------------
// UNIDADES POR TIPOLOGÍA DINÁMICA
// -----------------------------------------------------------------------------

export const verticalUnitDetailsSchema = z.object({
  tower: z.string().optional(),
  level: z.number().int(),
  unitNumber: z.string().min(1),
  interiorAreaM2: z.number().positive(),
  terraceAreaM2: z.number().nonnegative().default(0),
  totalAreaM2: z.number().positive(),
  bedrooms: z.number().int().nonnegative(),
  bathrooms: z.number().nonnegative(),
  parkingSpaces: z.number().int().nonnegative().default(0),
  storageRooms: z.number().int().nonnegative().default(0),
  viewOrientation: z.string().optional(),
  elevatorAccess: z.boolean().default(true),
  basePrice: z.number().positive(),
  currency: currencySchema.default("MXN"),
});

export const horizontalUnitDetailsSchema = z.object({
  lotNumber: z.string().min(1),
  modelName: z.string().optional(),
  lotAreaM2: z.number().positive("Metros de terreno obligatorios"),
  constructionAreaM2: z.number().positive("Metros de construcción obligatorios"),
  privateGardenM2: z.number().nonnegative().default(0),
  totalAreaM2: z.number().positive(),
  bedrooms: z.number().int().nonnegative(),
  bathrooms: z.number().nonnegative(),
  parkingSpaces: z.number().int().nonnegative().default(0),
  frontageMeters: z.number().positive().optional(),
  depthMeters: z.number().positive().optional(),
  basePrice: z.number().positive(),
  currency: currencySchema.default("MXN"),
});

export const commercialUnitDetailsSchema = z.object({
  level: z.number().int().optional(),
  unitNumber: z.string().min(1),
  totalAreaM2: z.number().positive(),
  mezzanineAreaM2: z.number().nonnegative().default(0),
  frontageMeters: z.number().positive().optional(),
  depthMeters: z.number().positive().optional(),
  businessTypeAllowed: z.array(z.string()).default([]),
  electricalKVA: z.number().nonnegative().optional(),
  hasGasInstallation: z.boolean().default(false),
  pedestrianTrafficLevel: z.enum(["LOW", "MEDIUM", "HIGH"]).default("MEDIUM"),
  basePrice: z.number().positive(),
  currency: currencySchema.default("MXN"),
});

export const industrialUnitDetailsSchema = z.object({
  moduleNumber: z.string().min(1),
  lotAreaM2: z.number().positive("Área de terreno obligatoria"),
  warehouseAreaM2: z.number().positive("Área techada/nave obligatoria"),
  totalAreaM2: z.number().positive(),
  clearHeightMeters: z.number().positive("Altura libre obligatoria"),
  floorLoadCapacityTonM2: z.number().positive().optional(),
  loadingDocksCount: z.number().int().nonnegative().default(0),
  hasTrailerAccess: z.boolean().default(true),
  electricalKVA: z.number().positive().optional(),
  zoningType: z.string().optional(),
  basePrice: z.number().positive(),
  currency: currencySchema.default("MXN"),
});
