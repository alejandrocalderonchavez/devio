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
  masterMute: boolean;
  stagingMode: boolean;
  postmark: {
    enabled: boolean;
    senderAlias: string;
    fromEmail: string;
    serverApiToken: string;
    status: "CONNECTED" | "UNCONFIGURED" | "PAUSED" | "ERROR";
  };
  whatsapp: {
    enabled: boolean;
    accountAlias: string;
    fromNumber: string;
    apiToken: string;
    phoneNumberId?: string;
    wabaId?: string;
    status: "CONNECTED" | "UNCONFIGURED" | "PAUSED" | "ERROR";
  };
  push: {
    enabled: boolean;
    vapidPublicKey: string;
    appIconUrl: string;
    status: "CONNECTED" | "UNCONFIGURED" | "PAUSED";
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
  status: "ENVIADO" | "ENTREGADO" | "FALLIDO" | "PENDIENTE" | "PAUSADO";
  errorDetails?: string;
  retryCount: number;
  metadata?: Record<string, any>;
}

export interface ScheduledNotification {
  id: string;
  triggerKey: string;
  triggerName: string;
  category: "COBRANZA" | "VENTAS" | "OBRA" | "POSTVENTA" | "DOCUMENTOS" | "USUARIOS";
  channel: "POSTMARK" | "WHATSAPP" | "PUSH";
  scheduledFor: string;
  scheduledForFormatted: string;
  relativeTime: string;
  recipientName: string;
  recipientContact: string;
  recipientRole: string;
  developerName: string;
  projectName: string;
  unitName: string;
  sourceEvent: string;
  status: "PROGRAMADA" | "EN_COLA" | "PAUSADA" | "ENVIADA" | "CANCELADA" | "FALLIDA";
  payloadSummary?: string;
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
  masterMute: false, // Control maestro de Staging (cuando es true, desactiva y bloquea todos los envíos reales)
  stagingMode: true,
  postmark: {
    enabled: true,
    senderAlias: "DEVIO",
    fromEmail: "noreply@deviomx.com",
    serverApiToken: "ec9d2701-f4ec-4433-8135-a0e64a59244d",
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
    triggerKey: "auth.password_reset",
    title: "1. Enviar Reset Password",
    category: "USUARIOS",
    description: "Recuperación y restablecimiento seguro de contraseña para usuarios de la plataforma.",
    recipientRole: "Cualquier Usuario",
    enabled: true,
    postmark: {
      enabled: true,
      templateAlias: "password-reset",
      subject: "Restablece tu contraseña de Devio",
    },
    whatsapp: {
      enabled: false,
      templateName: "devio_password_reset",
    },
    push: {
      enabled: false,
      title: "Solicitud de cambio de contraseña",
    },
    systemAuditStatus: "LISTO_EN_API",
    samplePayload: '{"nombre": "Iñigo Heredia", "correo": "contacto@deviomx.com", "reset_link": "https://deviomx.com/reset", "año": "2026"}',
  },
  {
    id: "tpl-2",
    triggerKey: "auth.welcome_client",
    title: "2. Enviar Bienvenida Cliente",
    category: "USUARIOS",
    description: "Bienvenida para compradores con envío de contraseña temporal y enlace de acceso al portal y app móvil.",
    recipientRole: "Comprador / Cliente",
    enabled: true,
    postmark: {
      enabled: true,
      templateAlias: "bienvenida-cliente",
      subject: "¡Bienvenido a Devio! Acceso a tu portal de comprador",
    },
    whatsapp: {
      enabled: true,
      templateName: "devio_welcome_client_v1",
    },
    push: {
      enabled: false,
      title: "Bienvenido a Devio",
    },
    systemAuditStatus: "ACTIVO_FRONTEND",
    samplePayload: '{"nombre": "Iñigo Heredia", "correo": "contacto@deviomx.com", "password_temporal": "jh997b9b7", "login_link": "https://deviomx.com/registro?login=login&profesional=Profesional", "año": "2026"}',
  },
  {
    id: "tpl-3",
    triggerKey: "auth.invite_staff",
    title: "3. Enviar Invitación Staff",
    category: "USUARIOS",
    description: "Invitación a colaboradores internos de la desarrolladora (Admin, Comercial, Construcción) con credenciales iniciales.",
    recipientRole: "Staff / Colaborador",
    enabled: true,
    postmark: {
      enabled: true,
      templateAlias: "bienvenida-user",
      subject: "Has sido invitado al equipo de {{desarrolladora}} en Devio",
    },
    whatsapp: {
      enabled: true,
      templateName: "devio_welcome_staff_v1",
    },
    push: {
      enabled: false,
      title: "Invitación de Staff",
    },
    systemAuditStatus: "ACTIVO_FRONTEND",
    samplePayload: '{"nombre": "Iñigo Heredia", "correo": "contacto@deviomx.com", "password_temporal": "jh997b9b7", "login_link": "https://deviomx.com/registro?login=login&profesional=Profesional", "desarrolladora": "Grupo VEQ", "año": "2026"}',
  },
  {
    id: "tpl-4",
    triggerKey: "sales.unit_assigned",
    title: "4. Enviar Alta de Unidad",
    category: "VENTAS",
    description: "Confirmación de asignación formal de unidad inmobiliaria al comprador con fecha estimada de entrega y branding del proyecto.",
    recipientRole: "Cliente / Comprador",
    enabled: true,
    postmark: {
      enabled: true,
      templateAlias: "alta-unidad",
      subject: "Asignación confirmada de unidad {{unidad}} en {{proyecto}}",
    },
    whatsapp: {
      enabled: true,
      templateName: "devio_alta_unidad_v1",
    },
    push: {
      enabled: true,
      title: "Unidad asignada exitosamente",
    },
    systemAuditStatus: "ACTIVO_FRONTEND",
    samplePayload: '{"nombre": "Iñigo Heredia", "correo": "contacto@deviomx.com", "proyecto": "Lirica", "unidad": "2B", "tipo": "Departamento", "fecha_entrega": "30 de mayo", "login_link": "https://deviomx.com/registro?login=login&profesional=Profesional", "logo_proyecto": "https://6d94a8ea50a1bc576a3e8162c197d74f.cdn.bubble.io/f1777398492782x453733136803679400/lirica.jpeg", "logo_desarrolladora": "https://6d94a8ea50a1bc576a3e8162c197d74f.cdn.bubble.io/f1777398110026x731242031517065300/grupo_veq_logo.jpeg", "año": "2026"}',
  },
  {
    id: "tpl-5",
    triggerKey: "obra.progress_report",
    title: "5. Avance de Proyecto (Fotográfico)",
    category: "OBRA",
    description: "Difusión masiva a los propietarios con las fotografías y resumen del avance físico de obra.",
    recipientRole: "Propietarios del Proyecto",
    enabled: true,
    postmark: {
      enabled: true,
      templateAlias: "avance-proyecto",
      subject: "Nuevo reporte de avance de obra en {{proyecto}}: {{titulo_avance}}",
    },
    whatsapp: {
      enabled: true,
      templateName: "devio_avance_obra_v1",
    },
    push: {
      enabled: true,
      title: "Nuevo avance de obra disponible",
    },
    systemAuditStatus: "ACTIVO_FRONTEND",
    samplePayload: '{"nombre": "Iñigo Heredia", "proyecto": "Lirica", "titulo_avance": "Avance General", "fecha_avance": "29 de Abril", "descripcion_avance": "Avance enfocado en estructura", "foto_1": "https://6d94a8ea50a1bc576a3e8162c197d74f.cdn.bubble.io/f1777401220510x647449209921793000/black_eleven_07.jpg", "foto_2": "https://6d94a8ea50a1bc576a3e8162c197d74f.cdn.bubble.io/f1777401219420x876505465866231700/black_eleven_05.jpg", "foto_3": "https://6d94a8ea50a1bc576a3e8162c197d74f.cdn.bubble.io/f1777401219392x670070627510692200/black_eleven_06.jpg", "login_link": "https://deviomx.com/registro", "logo_proyecto": "https://6d94a8ea50a1bc576a3e8162c197d74f.cdn.bubble.io/f1777398492782x453733136803679400/lirica.jpeg", "logo_desarrolladora": "https://6d94a8ea50a1bc576a3e8162c197d74f.cdn.bubble.io/f1777398110026x731242031517065300/grupo_veq_logo.jpeg", "año": "2026"}',
  },
  {
    id: "tpl-6",
    triggerKey: "obra.percentage_breakdown",
    title: "6. Enviar Registro de Porcentaje de Obra",
    category: "OBRA",
    description: "Desglose paramétrico por partidas constructivas (cimentación, estructura, albañilería, instalaciones, acabados, carpintería, etc.).",
    recipientRole: "Inversionistas / Propietarios",
    enabled: true,
    postmark: {
      enabled: true,
      templateAlias: "registro-porcentaje",
      subject: "Reporte de avance constructivo en {{proyecto}} ({{porcentaje_general}}%)",
    },
    whatsapp: {
      enabled: true,
      templateName: "devio_porcentaje_obra_v1",
    },
    push: {
      enabled: true,
      title: "Actualización de porcentajes de obra",
    },
    systemAuditStatus: "ACTIVO_FRONTEND",
    samplePayload: '{"nombre": "Iñigo Heredia", "proyecto": "Lirica", "fecha": "26 de abril 2026", "porcentaje_general": 53, "pct_trabajos_preliminares": 12, "pct_cimentacion": 24, "pct_estructura": 45, "pct_albanileria": 23, "pct_instalaciones": 78, "pct_acabados": 12, "pct_carpinteria": 11, "pct_mobiliario": 98, "pct_urbanizacion": 100, "login_link": "https://deviomx.com/registro", "logo_proyecto": "https://6d94a8ea50a1bc576a3e8162c197d74f.cdn.bubble.io/f1777398492782x453733136803679400/lirica.jpeg", "logo_desarrolladora": "https://6d94a8ea50a1bc576a3e8162c197d74f.cdn.bubble.io/f1777398110026x731242031517065300/grupo_veq_logo.jpeg", "año": "2026"}',
  },
  {
    id: "tpl-7",
    triggerKey: "payments.account_statement",
    title: "7. Enviar Estado de Cuenta",
    category: "COBRANZA",
    description: "Envío formal del estado de cuenta con total pagado, saldo pendiente, próximo vencimiento y enlace al PDF descargable.",
    recipientRole: "Cliente / Comprador",
    enabled: true,
    postmark: {
      enabled: true,
      templateAlias: "estado-cuenta",
      subject: "Estado de Cuenta - Unidad {{unidad}} en {{proyecto}}",
    },
    whatsapp: {
      enabled: true,
      templateName: "devio_estado_cuenta_v1",
    },
    push: {
      enabled: true,
      title: "Tu estado de cuenta está disponible",
    },
    systemAuditStatus: "ACTIVO_FRONTEND",
    samplePayload: '{"nombre": "Iñigo Heredia", "proyecto": "Lirica", "unidad": "3B", "fecha_emision": "29 de abril 2026", "total_pagado": "$100,000", "saldo_pendiente": "$900,000", "proximo_pago": "20 de Mayo", "monto_proximo": "$500,000", "pdf_url": "https://6d94a8ea50a1bc576a3e8162c197d74f.cdn.bubble.io/f1777400952946x992846113647714100/1A_280426.pdf", "login_link": "https://deviomx.com/registro", "logo_proyecto": "https://6d94a8ea50a1bc576a3e8162c197d74f.cdn.bubble.io/f1777398492782x453733136803679400/lirica.jpeg", "logo_desarrolladora": "https://6d94a8ea50a1bc576a3e8162c197d74f.cdn.bubble.io/f1777398110026x731242031517065300/grupo_veq_logo.jpeg", "año": "2026"}',
  },
  {
    id: "tpl-8",
    triggerKey: "payments.upcoming_reminder",
    title: "8. Enviar Recordatorio de Pago",
    category: "COBRANZA",
    description: "Recordatorio preventivo previo al vencimiento de una mensualidad o pago programado con monto y fecha límite.",
    recipientRole: "Cliente / Comprador",
    enabled: true,
    postmark: {
      enabled: true,
      templateAlias: "recordatorio-pago",
      subject: "Recordatorio de Pago: Tu cuota de {{monto}} vence el {{fecha_vencimiento}}",
    },
    whatsapp: {
      enabled: true,
      templateName: "devio_recordatorio_pago_v1",
    },
    push: {
      enabled: true,
      title: "Recordatorio de pago próximo",
    },
    systemAuditStatus: "REQUIERE_WORKER",
    samplePayload: '{"nombre": "Iñigo Heredia", "proyecto": "Lirica", "unidad": "3B", "dias": 15, "fecha_vencimiento": "30 de Mayo 2026", "monto": "$100,000", "concepto": "Mensualidad", "login_link": "https://deviomx.com/registro", "logo_proyecto": "https://6d94a8ea50a1bc576a3e8162c197d74f.cdn.bubble.io/f1777398492782x453733136803679400/lirica.jpeg", "logo_desarrolladora": "https://6d94a8ea50a1bc576a3e8162c197d74f.cdn.bubble.io/f1777398110026x731242031517065300/grupo_veq_logo.jpeg", "año": "2026"}',
  },
  {
    id: "tpl-9",
    triggerKey: "payments.overdue_notice",
    title: "9. Enviar Moroso / Saldo Vencido",
    category: "COBRANZA",
    description: "Alerta de morosidad formal informando días de retraso, monto vencido y cálculo de interés moratorio aplicable.",
    recipientRole: "Cliente en Mora",
    enabled: true,
    postmark: {
      enabled: true,
      templateAlias: "moroso",
      subject: "Aviso Urgente: Pago vencido en {{proyecto}} - Unidad {{unidad}}",
    },
    whatsapp: {
      enabled: true,
      templateName: "devio_moroso_alerta_v1",
    },
    push: {
      enabled: true,
      title: "Aviso de pago vencido",
    },
    systemAuditStatus: "LISTO_EN_API",
    samplePayload: '{"nombre": "Iñigo Heredia", "proyecto": "Lirica", "unidad": "3B", "dias_vencido": 10, "fecha_vencimiento": "30 de mayo 2026", "monto": "$100,000", "concepto": "Mensualidad", "interes_moratorio": 11, "login_link": "https://deviomx.com/registro", "logo_proyecto": "https://6d94a8ea50a1bc576a3e8162c197d74f.cdn.bubble.io/f1777398492782x453733136803679400/lirica.jpeg", "logo_desarrolladora": "https://6d94a8ea50a1bc576a3e8162c197d74f.cdn.bubble.io/f1777398110026x731242031517065300/grupo_veq_logo.jpeg", "año": "2026"}',
  },
  {
    id: "tpl-10",
    triggerKey: "payments.payment_receipt",
    title: "10. Enviar Recibo de Pago",
    category: "COBRANZA",
    description: "Comprobante formal y recibo de abono con folio único, método de pago y liga al PDF digital.",
    recipientRole: "Cliente / Pagador",
    enabled: true,
    postmark: {
      enabled: true,
      templateAlias: "recibo-pago",
      subject: "Recibo de Pago {{folio}} - Unidad {{unidad}} en {{proyecto}}",
    },
    whatsapp: {
      enabled: true,
      templateName: "devio_recibo_pago_v1",
    },
    push: {
      enabled: true,
      title: "Pago registrado exitosamente",
    },
    systemAuditStatus: "ACTIVO_FRONTEND",
    samplePayload: '{"nombre": "Iñigo Heredia", "proyecto": "Lirica", "unidad": "3B", "concepto": "Mensualidad", "monto": "$100,000", "fecha_pago": "30 de Mayo", "metodo_pago": "Transferencia", "folio": "90890709", "recibo_url": "https://6d94a8ea50a1bc576a3e8162c197d74f.cdn.bubble.io/f1777400952946x992846113647714100/1A_280426.pdf", "login_link": "https://deviomx.com/registro", "logo_proyecto": "https://6d94a8ea50a1bc576a3e8162c197d74f.cdn.bubble.io/f1777398492782x453733136803679400/lirica.jpeg", "logo_desarrolladora": "https://6d94a8ea50a1bc576a3e8162c197d74f.cdn.bubble.io/f1777398110026x731242031517065300/grupo_veq_logo.jpeg", "año": "2026"}',
  },
  {
    id: "tpl-11",
    triggerKey: "broadcast.general_announcement",
    title: "11. Enviar Broadcast / Comunicado",
    category: "PROYECTOS",
    description: "Difusión de avisos generales, noticias o llamados a la acción dirigidos a clientes o colaboradores.",
    recipientRole: "Audiencia Masiva",
    enabled: true,
    postmark: {
      enabled: true,
      templateAlias: "broadcast-devio",
      subject: "{{titulo}} - Comunicado de Devio",
    },
    whatsapp: {
      enabled: true,
      templateName: "devio_broadcast_v1",
    },
    push: {
      enabled: true,
      title: "Nuevo comunicado disponible",
    },
    systemAuditStatus: "ACTIVO_FRONTEND",
    samplePayload: '{"nombre": "Iñigo Heredia", "correo": "contacto@deviomx.com", "titulo": "Activacion", "mensaje": "Hola que tal", "cta_texto": "Ingresa", "cta_link": "https://deviomx.com/registro", "año": "2026"}',
  },
  {
    id: "tpl-12",
    triggerKey: "sales.send_quote",
    title: "12. Enviar Cotización Digital",
    category: "VENTAS",
    description: "Ficha comercial y cotización financiera detallada de unidad con desglose del plan de pagos y enlace PDF.",
    recipientRole: "Prospecto / Comprador",
    enabled: true,
    postmark: {
      enabled: true,
      templateAlias: "cotizacion",
      subject: "Cotización de Unidad {{unidad}} - {{proyecto}}",
    },
    whatsapp: {
      enabled: true,
      templateName: "devio_cotizacion_v1",
    },
    push: {
      enabled: false,
      title: "Cotización generada",
    },
    systemAuditStatus: "ACTIVO_FRONTEND",
    samplePayload: '{"nombre": "Iñigo Heredia", "proyecto": "Lirica", "unidad": "3B", "tipo": "Depa", "superficie": "300", "fecha_entrega": "25/2/2030", "plan_nombre": "Plan Oro", "enganche": "100000", "num_pagos": "6", "monto_pago": "50000", "liquidacion": "500000", "total_plan": "5000000", "cotizacion_url": "https://6d94a8ea50a1bc576a3e8162c197d74f.cdn.bubble.io/f1777400952946x992846113647714100/1A_280426.pdf", "login_link": "https://deviomx.com/registro", "logo_proyecto": "https://6d94a8ea50a1bc576a3e8162c197d74f.cdn.bubble.io/f1777398492782x453733136803679400/lirica.jpeg", "logo_desarrolladora": "https://6d94a8ea50a1bc576a3e8162c197d74f.cdn.bubble.io/f1777398110026x731242031517065300/grupo_veq_logo.jpeg", "año": "2026"}',
  },
];

export const INITIAL_NOTIFICATION_DELIVERY_LOGS: NotificationDeliveryLog[] = [];

export const INITIAL_CUSTOM_INVITES: CustomPricingInvite[] = [];

export const INITIAL_SUPER_ADMIN_AUDIT_LOGS: SuperAdminAuditLog[] = [];

export const INITIAL_SCHEDULED_NOTIFICATIONS: ScheduledNotification[] = [
  {
    id: "sch-1-wa",
    triggerKey: "payments.upcoming_reminder",
    triggerName: "Recordatorio Preventivo de Mensualidad",
    category: "COBRANZA",
    channel: "WHATSAPP",
    scheduledFor: "2026-09-28T09:00:00-06:00",
    scheduledForFormatted: "28 Sep 2026",
    relativeTime: "En 5 días",
    recipientName: "Alejandro Calderón",
    recipientContact: "+52 33 2256 7499",
    recipientRole: "Comprador / Titular",
    developerName: "Lippu México",
    projectName: "Night Club Tower",
    unitName: "Depto 301",
    sourceEvent: "Venta #VTA-2026-004 (Plan 24 Mensualidades)",
    status: "PROGRAMADA",
    payloadSummary: "Mensualidad 2/24 por $28,500 MXN (Vence 05 Oct 2026)",
    metadata: {
      monto: "$28,500 MXN",
      fecha_vencimiento: "05 de Octubre 2026",
    },
  },
  {
    id: "sch-1-pmk",
    triggerKey: "payments.upcoming_reminder",
    triggerName: "Recordatorio Preventivo de Mensualidad",
    category: "COBRANZA",
    channel: "POSTMARK",
    scheduledFor: "2026-09-28T09:00:00-06:00",
    scheduledForFormatted: "28 Sep 2026",
    relativeTime: "En 5 días",
    recipientName: "Alejandro Calderón",
    recipientContact: "acalderoncha@gmail.com",
    recipientRole: "Comprador / Titular",
    developerName: "Lippu México",
    projectName: "Night Club Tower",
    unitName: "Depto 301",
    sourceEvent: "Venta #VTA-2026-004 (Plan 24 Mensualidades)",
    status: "PROGRAMADA",
    payloadSummary: "Desglose formal y referencia bancaria SPEI",
    metadata: {
      templateAlias: "recordatorio-pago",
      monto: "$28,500 MXN",
    },
  },
  {
    id: "sch-1-push",
    triggerKey: "payments.upcoming_reminder",
    triggerName: "Recordatorio Preventivo de Mensualidad",
    category: "COBRANZA",
    channel: "PUSH",
    scheduledFor: "2026-09-28T09:00:00-06:00",
    scheduledForFormatted: "28 Sep 2026",
    relativeTime: "En 5 días",
    recipientName: "Alejandro Calderón",
    recipientContact: "App Móvil / Web Push",
    recipientRole: "Comprador / Titular",
    developerName: "Lippu México",
    projectName: "Night Club Tower",
    unitName: "Depto 301",
    sourceEvent: "Venta #VTA-2026-004 (Plan 24 Mensualidades)",
    status: "PROGRAMADA",
    payloadSummary: "Alerta Push en Portal de Comprador",
    metadata: {
      monto: "$28,500 MXN",
    },
  },
  {
    id: "sch-3-pmk",
    triggerKey: "obra.percentage_breakdown",
    triggerName: "Reporte Mensual de Avance de Obra",
    category: "OBRA",
    channel: "POSTMARK",
    scheduledFor: "2026-09-30T09:00:00-06:00",
    scheduledForFormatted: "30 Sep 2026",
    relativeTime: "Fin de Mes",
    recipientName: "Inversionistas y Compradores",
    recipientContact: "propietarios@kitostower.mx",
    recipientRole: "Propietarios Kitos Tower",
    developerName: "Lippu México",
    projectName: "Kitos Tower",
    unitName: "Todas las unidades vendidas",
    sourceEvent: "Cierre Mensual de Residencia de Obra",
    status: "PROGRAMADA",
    payloadSummary: "Avance global 53% • Cimentación 100% • Estructura 45%",
    metadata: {
      templateAlias: "registro-porcentaje",
    },
  },
  {
    id: "sch-3-wa",
    triggerKey: "obra.percentage_breakdown",
    triggerName: "Reporte Mensual de Avance de Obra",
    category: "OBRA",
    channel: "WHATSAPP",
    scheduledFor: "2026-09-30T09:00:00-06:00",
    scheduledForFormatted: "30 Sep 2026",
    relativeTime: "Fin de Mes",
    recipientName: "Inversionistas y Compradores",
    recipientContact: "+52 33 2256 7499",
    recipientRole: "Propietarios Kitos Tower",
    developerName: "Lippu México",
    projectName: "Kitos Tower",
    unitName: "Todas las unidades vendidas",
    sourceEvent: "Cierre Mensual de Residencia de Obra",
    status: "PROGRAMADA",
    payloadSummary: "Resumen de fotos y avance 53%",
    metadata: {
      templateAlias: "registro-porcentaje",
    },
  },
  {
    id: "sch-3-push",
    triggerKey: "obra.percentage_breakdown",
    triggerName: "Reporte Mensual de Avance de Obra",
    category: "OBRA",
    channel: "PUSH",
    scheduledFor: "2026-09-30T09:00:00-06:00",
    scheduledForFormatted: "30 Sep 2026",
    relativeTime: "Fin de Mes",
    recipientName: "Inversionistas y Compradores",
    recipientContact: "App Móvil / Web Push",
    recipientRole: "Propietarios Kitos Tower",
    developerName: "Lippu México",
    projectName: "Kitos Tower",
    unitName: "Todas las unidades vendidas",
    sourceEvent: "Cierre Mensual de Residencia de Obra",
    status: "PROGRAMADA",
    payloadSummary: "Galería de avance disponible en portal",
    metadata: {},
  },
  {
    id: "sch-5-wa",
    triggerKey: "postventa.guarantee_followup",
    triggerName: "Seguimiento y Encuesta de Entrega",
    category: "POSTVENTA",
    channel: "WHATSAPP",
    scheduledFor: "2026-10-15T09:00:00-06:00",
    scheduledForFormatted: "15 Oct 2026",
    relativeTime: "En 22 días",
    recipientName: "Alex Legaius",
    recipientContact: "+52 33 3490 8821",
    recipientRole: "Propietario Entregado",
    developerName: "Lippu México",
    projectName: "Night Club Tower",
    unitName: "Depto 102",
    sourceEvent: "Acta de Entrega de Llaves #ENT-091",
    status: "PROGRAMADA",
    payloadSummary: "Checklist de garantías 30 días y satisfacción",
  },
  {
    id: "sch-5-pmk",
    triggerKey: "postventa.guarantee_followup",
    triggerName: "Seguimiento y Encuesta de Entrega",
    category: "POSTVENTA",
    channel: "POSTMARK",
    scheduledFor: "2026-10-15T09:00:00-06:00",
    scheduledForFormatted: "15 Oct 2026",
    relativeTime: "En 22 días",
    recipientName: "Alex Legaius",
    recipientContact: "alegaius@gmail.com",
    recipientRole: "Propietario Entregado",
    developerName: "Lippu México",
    projectName: "Night Club Tower",
    unitName: "Depto 102",
    sourceEvent: "Acta de Entrega de Llaves #ENT-091",
    status: "PROGRAMADA",
    payloadSummary: "Encuesta digital de satisfacción de entrega",
  },
  {
    id: "sch-5-push",
    triggerKey: "postventa.guarantee_followup",
    triggerName: "Seguimiento y Encuesta de Entrega",
    category: "POSTVENTA",
    channel: "PUSH",
    scheduledFor: "2026-10-15T09:00:00-06:00",
    scheduledForFormatted: "15 Oct 2026",
    relativeTime: "En 22 días",
    recipientName: "Alex Legaius",
    recipientContact: "App Móvil / Web Push",
    recipientRole: "Propietario Entregado",
    developerName: "Lippu México",
    projectName: "Night Club Tower",
    unitName: "Depto 102",
    sourceEvent: "Acta de Entrega de Llaves #ENT-091",
    status: "PROGRAMADA",
    payloadSummary: "Notificación de bienvenida y garantías",
  },
];

