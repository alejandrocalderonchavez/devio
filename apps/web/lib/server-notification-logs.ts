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
const globalLogs: ServerNotificationLog[] = [];

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
