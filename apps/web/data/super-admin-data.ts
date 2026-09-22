export interface SuperAdminProject {
  id: string;
  name: string;
  type: string;
  totalUnits: number;
  soldUnits: number;
  availableUnits: number;
  blockedUnits: number;
  pricePerUnit?: number;
  status: "ACTIVE" | "COMPLETED" | "DRAFT";
  assignedUsersCount: number;
  createdAt: string;
}

export interface SuperAdminDeveloper {
  id: string;
  name: string;
  legalName: string;
  rfc: string;
  contactEmail: string;
  phone: string;
  city: string;
  pricePerUnitMonthly: number; // e.g. $180 MXN / unidad / mes
  subscriptionStatus: "ACTIVE" | "TRIALING" | "PAST_DUE" | "CANCELED";
  trialEndsAt?: string;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  createdAt: string;
  projects: SuperAdminProject[];
  users: Array<{
    id: string;
    name: string;
    email: string;
    role: string;
    assignedProjectIds?: string[];
    permissions?: string[];
  }>;
}

export interface CustomPricingInvite {
  id: string;
  token: string;
  developerName: string;
  developerEmail: string;
  pricePerUnitMonthly: number;
  discountPercentage: number;
  freeTrialMonths: number;
  status: "PENDING" | "ACCEPTED" | "EXPIRED";
  expiresAt: string;
  createdAt: string;
  linkUrl: string;
}

export interface SuperAdminAuditLog {
  id: string;
  timestamp: string;
  superAdminName: string;
  action: string;
  targetEntity: string;
  details: string;
  ipAddress: string;
}

export interface NotificationChannelConfig {
  postmark: {
    enabled: boolean;
    senderAlias: string;
    fromEmail: string;
    serverApiToken: string;
    status: "CONNECTED" | "UNCONFIGURED" | "ERROR";
  };
  whatsapp: {
    enabled: boolean;
    accountAlias: string;
    fromNumber: string;
    apiToken: string;
    status: "CONNECTED" | "UNCONFIGURED" | "ERROR";
  };
  push: {
    enabled: boolean;
    vapidPublicKey: string;
    appIconUrl: string;
    status: "CONNECTED" | "UNCONFIGURED";
  };
}

export interface NotificationTemplate {
  id: string;
  triggerKey: string;
  title: string;
  category: "USUARIOS" | "PROYECTOS" | "COBRANZA" | "VENTAS" | "OBRA" | "POSTVENTA" | "DOCUMENTOS";
  description: string;
  recipientRole: string;
  enabled: boolean;
  postmark: {
    enabled: boolean;
    templateAlias: string;
    subject: string;
  };
  whatsapp: {
    enabled: boolean;
    templateName: string;
  };
  push: {
    enabled: boolean;
    title: string;
  };
  systemAuditStatus: "ACTIVO_FRONTEND" | "LISTO_EN_API" | "REQUIERE_WORKER";
  samplePayload: string;
}

export interface NotificationDeliveryLog {
  id: string;
  timestamp: string;
  triggerKey: string;
  triggerName: string;
  channel: "POSTMARK" | "WHATSAPP" | "PUSH";
  recipient: string;
  recipientName: string;
  developerName: string;
  status: "ENVIADO" | "ENTREGADO" | "FALLIDO" | "PENDIENTE";
  errorDetails?: string;
  retryCount: number;
  metadata?: Record<string, any>;
}

export interface SaaSPricingTier {
  id: string;
  name: string;
  tagline: string;
  pricePerUnit: number;
  minUnits: number;
  features: string[];
  isPopular?: boolean;
}

export const SAAS_PRICING_TIERS: SaaSPricingTier[] = [
  {
    id: "tier-starter",
    name: "Starter",
    tagline: "Cobro por unidad para desarrolladoras en etapa inicial",
    pricePerUnit: 195,
    minUnits: 10,
    features: [
      "Cobro 100% por unidad activa ($195 MXN/u/mes)",
      "Inventario dinámico y cotizador de unidades",
      "Calendario de pagos y cobranza automatizada",
      "Notificaciones por Postmark y WhatsApp",
      "Soporte estándar en horario comercial",
    ],
  },
  {
    id: "tier-growth",
    name: "Growth Pro",
    tagline: "Tarifa preferencial por volumen para desarrolladoras consolidadas",
    pricePerUnit: 175,
    minUnits: 50,
    isPopular: true,
    features: [
      "Tarifa preferencial de $175 MXN/u/mes",
      "WhatsApp Business API & Postmark activo",
      "Bóveda de documentos con auditoría legal",
      "Módulo de avance de obra y postventa",
      "Matriz granular de 30 permisos",
      "Soporte prioritario 24/7",
    ],
  },
  {
    id: "tier-enterprise",
    name: "Enterprise",
    tagline: "Para portafolios de gran escala y fondos de inversión",
    pricePerUnit: 150,
    minUnits: 150,
    features: [
      "Tarifa escala de $150 MXN/u/mes",
      "Proyectos y unidades ilimitadas",
      "Webhooks, integraciones ERP y API dedicada",
      "Notificaciones Push nativas + WhatsApp + Postmark",
      "Account Manager y onboarding presencial dedicado",
      "SLA 99.9% y respaldos redundantes",
    ],
  },
];

export const INITIAL_SUPER_ADMIN_DEVELOPERS: SuperAdminDeveloper[] = [
  {
    id: "dev-active",
    name: "Desarrolladora Principal",
    legalName: "Inmobiliaria y Desarrollos S.A. de C.V.",
    rfc: "DEV260101XYZ",
    contactEmail: "acalderoncha@gmail.com",
    phone: "3322567499",
    city: "Guadalajara, JAL",
    pricePerUnitMonthly: 180,
    subscriptionStatus: "ACTIVE",
    stripeCustomerId: "cus_live_devio_001",
    stripeSubscriptionId: "sub_live_devio_001",
    createdAt: "2026-01-15",
    projects: [],
    users: [
      { id: "usr-admin", name: "Alejandro Calderón", email: "acalderoncha@gmail.com", role: "Super Admin" },
    ],
  },
];

export const INITIAL_NOTIFICATION_CHANNELS: NotificationChannelConfig = {
  postmark: {
    enabled: true,
    senderAlias: "Devio Notificaciones",
    fromEmail: "notificaciones@devio.mx",
    serverApiToken: "pmk_live_94819a828103847b2c910",
    status: "CONNECTED",
  },
  whatsapp: {
    enabled: true,
    accountAlias: "Devio Real Estate Cloud",
    fromNumber: "+52 (33) 2256 7499",
    apiToken: "wa_token_live_devio_waba_8819230",
    status: "CONNECTED",
  },
  push: {
    enabled: true,
    vapidPublicKey: "BKx91j0A_devio_vapid_publicKey_8841293_live",
    appIconUrl: "/devio-logo.png",
    status: "CONNECTED",
  },
};

export const INITIAL_NOTIFICATION_TEMPLATES: NotificationTemplate[] = [
  {
    id: "tpl-1",
    triggerKey: "auth.welcome_credentials",
    title: "1. Bienvenida y Envío de Credenciales",
    category: "USUARIOS",
    description: "Se envía automáticamente al registrar a un nuevo usuario en la organización con su enlace de acceso y rol asignado.",
    recipientRole: "Nuevo Usuario / Colaborador",
    enabled: true,
    postmark: {
      enabled: true,
      templateAlias: "devio-user-welcome-access",
      subject: "¡Bienvenido a Devio! Tus credenciales de acceso a {{developer_name}}",
    },
    whatsapp: {
      enabled: true,
      templateName: "devio_welcome_user_v2",
    },
    push: {
      enabled: false,
      title: "Cuenta activada en Devio",
    },
    systemAuditStatus: "ACTIVO_FRONTEND",
    samplePayload: '{"name": "Colaborador Devio", "email": "usuario@empresa.com", "role": "Asesor de Ventas", "developer_name": "Desarrolladora", "login_url": "https://devio.mx/login"}',
  },
  {
    id: "tpl-2",
    triggerKey: "projects.assigned_to_team",
    title: "2. Asignación a Proyecto o Unidad",
    category: "PROYECTOS",
    description: "Notifica al asesor comercial, residente o administrador cuando es vinculado formalmente a un desarrollo o unidad.",
    recipientRole: "Asesor / Equipo Asignado",
    enabled: true,
    postmark: {
      enabled: true,
      templateAlias: "devio-project-team-assigned",
      subject: "Has sido asignado al desarrollo {{project_name}}",
    },
    whatsapp: {
      enabled: true,
      templateName: "devio_project_assigned_v1",
    },
    push: {
      enabled: true,
      title: "Nuevo proyecto asignado",
    },
    systemAuditStatus: "ACTIVO_FRONTEND",
    samplePayload: '{"user_name": "Asesor", "project_name": "Desarrollo", "role": "Asesor de Ventas", "assigned_units_count": 5}',
  },
  {
    id: "tpl-3",
    triggerKey: "payments.receipt_issued",
    title: "3. Recibo y Comprobante de Abono SPEI",
    category: "COBRANZA",
    description: "Se dispara al registrar un abono real en cobranza cuando el switch de enviar recibo está activado.",
    recipientRole: "Cliente / Co-propietarios",
    enabled: true,
    postmark: {
      enabled: true,
      templateAlias: "devio-payment-receipt-client",
      subject: "Recibo de Pago {{receipt_folio}} - Unidad {{unit_number}} en {{project_name}}",
    },
    whatsapp: {
      enabled: true,
      templateName: "devio_payment_receipt_instant",
    },
    push: {
      enabled: false,
      title: "Pago procesado con éxito",
    },
    systemAuditStatus: "ACTIVO_FRONTEND",
    samplePayload: '{"client_name": "Cliente", "receipt_folio": "REC-2026-001", "amount": 50000, "unit": "101", "project_name": "Desarrollo", "download_url": "https://devio.mx/receipts/REC-2026-001"}',
  },
  {
    id: "tpl-4",
    triggerKey: "payments.upcoming_reminder",
    title: "4. Recordatorio Preventivo de Cuota Próxima",
    category: "COBRANZA",
    description: "Se envía 3 a 5 días previos a la fecha límite de vencimiento de una mensualidad o enganche programado.",
    recipientRole: "Cliente",
    enabled: true,
    postmark: {
      enabled: true,
      templateAlias: "devio-payment-reminder-3days",
      subject: "Recordatorio: Tu pago de {{concept}} vence el {{due_date}}",
    },
    whatsapp: {
      enabled: true,
      templateName: "devio_payment_due_reminder",
    },
    push: {
      enabled: true,
      title: "Próximo pago programado",
    },
    systemAuditStatus: "REQUIERE_WORKER",
    samplePayload: '{"client_name": "Cliente", "concept": "Mensualidad", "amount": 35000, "due_date": "15 Oct 2026", "spei_clabe": "646180123456789012"}',
  },
  {
    id: "tpl-5",
    triggerKey: "payments.overdue_alert",
    title: "5. Alerta de Pago Vencido y Moratorios",
    category: "COBRANZA",
    description: "Notificación de cuota en mora enviada al cliente con el desglose del saldo pendiente e intereses aplicables.",
    recipientRole: "Cliente & Equipo de Cobranza",
    enabled: true,
    postmark: {
      enabled: true,
      templateAlias: "devio-payment-overdue-notice",
      subject: "Aviso Importante: Cuota vencida en {{project_name}} - Unidad {{unit_number}}",
    },
    whatsapp: {
      enabled: true,
      templateName: "devio_overdue_notice_formal",
    },
    push: {
      enabled: true,
      title: "Cuota vencida requiere atención",
    },
    systemAuditStatus: "LISTO_EN_API",
    samplePayload: '{"client_name": "Cliente", "days_overdue": 5, "pending_amount": 35000, "moratory_interest": 1050, "total_due": 36050, "unit": "101"}',
  },
  {
    id: "tpl-6",
    triggerKey: "sales.sale_completed",
    title: "6. Confirmación de Nueva Venta / Apartado",
    category: "VENTAS",
    description: "Confirmación formal de contrato/apartado enviada al comprador, al asesor asignado y a la dirección comercial.",
    recipientRole: "Cliente, Asesor & Dirección",
    enabled: true,
    postmark: {
      enabled: true,
      templateAlias: "devio-sale-created-contract",
      subject: "¡Felicidades por tu adquisición! Unidad {{unit_number}} en {{project_name}}",
    },
    whatsapp: {
      enabled: true,
      templateName: "devio_sale_congratulations",
    },
    push: {
      enabled: true,
      title: "¡Nueva venta concretada!",
    },
    systemAuditStatus: "ACTIVO_FRONTEND",
    samplePayload: '{"client_name": "Cliente", "unit": "101", "project_name": "Desarrollo", "total_price": 3500000, "folio": "DEV-2026-001"}',
  },
  {
    id: "tpl-7",
    triggerKey: "sales.unit_cancelled",
    title: "7. Cancelación o Rescisión de Venta",
    category: "VENTAS",
    description: "Alerta emitida cuando una venta se cancela y la unidad se regresa al inventario como Disponible.",
    recipientRole: "Asesor & Dirección Comercial",
    enabled: true,
    postmark: {
      enabled: true,
      templateAlias: "devio-sale-cancelled-alert",
      subject: "Aviso: Unidad {{unit_number}} liberada nuevamente al inventario",
    },
    whatsapp: {
      enabled: true,
      templateName: "devio_unit_released_alert",
    },
    push: {
      enabled: true,
      title: "Unidad liberada al inventario",
    },
    systemAuditStatus: "ACTIVO_FRONTEND",
    samplePayload: '{"unit": "101", "project_name": "Desarrollo", "previous_client": "Cliente", "reason": "Liberación de inventario"}',
  },
  {
    id: "tpl-8",
    triggerKey: "obra.progress_updated",
    title: "8. Actualización de Avance de Obra",
    category: "OBRA",
    description: "Difusión masiva a todos los propietarios de un desarrollo cuando el residente registra un nuevo avance fotográfico.",
    recipientRole: "Compradores del Desarrollo",
    enabled: true,
    postmark: {
      enabled: true,
      templateAlias: "devio-construction-advance-update",
      subject: "Nuevo reporte de avance de obra en {{project_name}} ({{progress_pct}}%)",
    },
    whatsapp: {
      enabled: true,
      templateName: "devio_obra_progress_photo",
    },
    push: {
      enabled: true,
      title: "Nuevo avance de obra disponible",
    },
    systemAuditStatus: "ACTIVO_FRONTEND",
    samplePayload: '{"project_name": "Desarrollo", "progress_pct": 50, "milestone": "Avance de estructura", "gallery_url": "https://devio.mx/projects/p-1/obra"}',
  },
  {
    id: "tpl-9",
    triggerKey: "postventa.incident_resolved",
    title: "9. Reporte y Resolución de Garantías Postventa",
    category: "POSTVENTA",
    description: "Notificación de apertura, asignación a contratista y firma de entrega de resolución de ticket de garantía.",
    recipientRole: "Cliente & Contratista",
    enabled: true,
    postmark: {
      enabled: true,
      templateAlias: "devio-postventa-ticket-status",
      subject: "Garantía Postventa #{{ticket_id}}: {{status_label}}",
    },
    whatsapp: {
      enabled: true,
      templateName: "devio_postventa_ticket_update",
    },
    push: {
      enabled: true,
      title: "Actualización en ticket de garantía",
    },
    systemAuditStatus: "ACTIVO_FRONTEND",
    samplePayload: '{"ticket_id": "PV-1001", "unit": "101", "client_name": "Cliente", "status_label": "Resuelto y Validado", "supplier": "Proveedor"}',
  },
  {
    id: "tpl-10",
    triggerKey: "documents.signature_requested",
    title: "10. Solicitud de Firma de Contrato en Bóveda",
    category: "DOCUMENTOS",
    description: "Alerta con enlace seguro enviada al cliente para firmar o revisar un contrato o anexo subido a la bóveda.",
    recipientRole: "Cliente / Notaría",
    enabled: true,
    postmark: {
      enabled: true,
      templateAlias: "devio-doc-signature-required",
      subject: "Documento listo para firma: {{document_title}}",
    },
    whatsapp: {
      enabled: true,
      templateName: "devio_document_signature_link",
    },
    push: {
      enabled: true,
      title: "Documento requiere tu firma",
    },
    systemAuditStatus: "LISTO_EN_API",
    samplePayload: '{"document_title": "Contrato de Compraventa", "client_name": "Cliente", "signature_url": "https://devio.mx/vault/sign/doc-1"}',
  },
];

export const INITIAL_NOTIFICATION_DELIVERY_LOGS: NotificationDeliveryLog[] = [];

export const INITIAL_CUSTOM_INVITES: CustomPricingInvite[] = [];

export const INITIAL_SUPER_ADMIN_AUDIT_LOGS: SuperAdminAuditLog[] = [];
