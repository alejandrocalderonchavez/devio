export interface ServerNotificationLog {
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

// Global server memory store initialized with audit records
const globalLogs: ServerNotificationLog[] = [
  {
    id: "log-pmk-init-1",
    timestamp: new Date().toLocaleString("es-MX", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }),
    triggerKey: "auth.welcome_client",
    triggerName: "Bienvenida y Credenciales Portal Cliente",
    channel: "POSTMARK",
    recipient: "acalderoncha@gmail.com",
    recipientName: "Alejandro Calderón",
    developerName: "Devio Inmobiliario",
    status: "ENTREGADO",
    retryCount: 0,
    metadata: {
      templateAlias: "bienvenida-cliente",
    },
  },
  {
    id: "log-pmk-init-2",
    timestamp: new Date().toLocaleString("es-MX", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }),
    triggerKey: "sales.unit_assigned",
    triggerName: "Asignación de Unidad Formalizada",
    channel: "POSTMARK",
    recipient: "acalderoncha@gmail.com",
    recipientName: "Alejandro Calderón",
    developerName: "Devio Inmobiliario",
    status: "ENTREGADO",
    retryCount: 0,
    metadata: {
      templateAlias: "alta-unidad",
    },
  },
  {
    id: "log-pmk-init-3",
    timestamp: new Date().toLocaleString("es-MX", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }),
    triggerKey: "payments.payment_receipt",
    triggerName: "Recibo de Pago de Enganche",
    channel: "POSTMARK",
    recipient: "acalderoncha@gmail.com",
    recipientName: "Alejandro Calderón",
    developerName: "Devio Inmobiliario",
    status: "ENTREGADO",
    retryCount: 0,
    metadata: {
      templateAlias: "recibo-pago",
    },
  },
];

export function getServerLogs(): ServerNotificationLog[] {
  return [...globalLogs];
}

export function addServerLog(log: ServerNotificationLog) {
  const index = globalLogs.findIndex((l) => l.id === log.id);
  if (index >= 0) {
    globalLogs[index] = { ...globalLogs[index], ...log };
  } else {
    globalLogs.unshift(log);
  }
}

export function updateServerLog(id: string, updates: Partial<ServerNotificationLog>) {
  const index = globalLogs.findIndex((l) => l.id === id);
  if (index >= 0 && globalLogs[index]) {
    Object.assign(globalLogs[index], updates);
  }
}
