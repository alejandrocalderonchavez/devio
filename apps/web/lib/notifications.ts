import {
  NotificationChannelConfig,
  NotificationDeliveryLog,
  NotificationTemplate,
  INITIAL_NOTIFICATION_CHANNELS,
  INITIAL_NOTIFICATION_TEMPLATES,
  INITIAL_NOTIFICATION_DELIVERY_LOGS,
} from "@/data/super-admin-data";

const STORAGE_KEY_CHANNELS = "devio_notification_channels_config";
const STORAGE_KEY_TEMPLATES = "devio_notification_templates_config";
const STORAGE_KEY_LOGS = "devio_notification_delivery_logs";

export function getNotificationChannelsConfig(): NotificationChannelConfig {
  if (typeof window === "undefined") return INITIAL_NOTIFICATION_CHANNELS;
  const stored = localStorage.getItem(STORAGE_KEY_CHANNELS) || sessionStorage.getItem(STORAGE_KEY_CHANNELS);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch (e) {}
  }
  return INITIAL_NOTIFICATION_CHANNELS;
}

export function saveNotificationChannelsConfig(config: NotificationChannelConfig) {
  if (typeof window === "undefined") return;
  const str = JSON.stringify(config);
  localStorage.setItem(STORAGE_KEY_CHANNELS, str);
  sessionStorage.setItem(STORAGE_KEY_CHANNELS, str);
}

export function getNotificationTemplates(): NotificationTemplate[] {
  if (typeof window === "undefined") return INITIAL_NOTIFICATION_TEMPLATES;
  const stored = localStorage.getItem(STORAGE_KEY_TEMPLATES) || sessionStorage.getItem(STORAGE_KEY_TEMPLATES);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch (e) {}
  }
  return INITIAL_NOTIFICATION_TEMPLATES;
}

export function saveNotificationTemplates(templates: NotificationTemplate[]) {
  if (typeof window === "undefined") return;
  const str = JSON.stringify(templates);
  localStorage.setItem(STORAGE_KEY_TEMPLATES, str);
  sessionStorage.setItem(STORAGE_KEY_TEMPLATES, str);
}

export function getNotificationDeliveryLogs(): NotificationDeliveryLog[] {
  if (typeof window === "undefined") return INITIAL_NOTIFICATION_DELIVERY_LOGS;
  const stored = localStorage.getItem(STORAGE_KEY_LOGS) || sessionStorage.getItem(STORAGE_KEY_LOGS);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch (e) {}
  }
  return INITIAL_NOTIFICATION_DELIVERY_LOGS;
}

export function saveNotificationDeliveryLogs(logs: NotificationDeliveryLog[]) {
  if (typeof window === "undefined") return;
  const str = JSON.stringify(logs);
  localStorage.setItem(STORAGE_KEY_LOGS, str);
  sessionStorage.setItem(STORAGE_KEY_LOGS, str);
  // Dispatch custom event for real-time reactive updates
  window.dispatchEvent(new CustomEvent("devio_notification_logs_changed", { detail: { logs } }));
}

/**
 * Inserts a new delivery log at the top of the logs list
 */
export function recordNotificationDeliveryLog(log: NotificationDeliveryLog) {
  const currentLogs = getNotificationDeliveryLogs();
  // Avoid duplicate ID
  const filtered = currentLogs.filter((l) => l.id !== log.id);
  const updated = [log, ...filtered];
  saveNotificationDeliveryLogs(updated);
}

/**
 * Updates an existing delivery log by ID
 */
export function updateNotificationDeliveryLog(logId: string, updates: Partial<NotificationDeliveryLog>) {
  const currentLogs = getNotificationDeliveryLogs();
  const updated = currentLogs.map((l) => {
    if (l.id === logId) {
      return { ...l, ...updates };
    }
    return l;
  });
  saveNotificationDeliveryLogs(updated);
}

export interface SendAndLogOptions {
  to: string;
  templateAlias: string;
  templateModel: Record<string, any>;
  triggerKey?: string;
  triggerName?: string;
  recipientName?: string;
  developerName?: string;
  channel?: "POSTMARK" | "WHATSAPP" | "PUSH";
  fromEmail?: string;
  fromName?: string;
}

/**
 * Sends a notification via API and automatically registers/updates the real-time delivery log
 */
export async function sendAndLogNotification({
  to,
  templateAlias,
  templateModel,
  triggerKey = "custom.dispatch",
  triggerName = "Notificación del Sistema",
  recipientName = "Usuario Devio",
  developerName = "Desarrolladora Inmobiliaria",
  channel = "POSTMARK",
  fromEmail,
  fromName,
}: SendAndLogOptions): Promise<{ success: boolean; error?: string; logId: string }> {
  const logId = `log-${channel.toLowerCase()}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  const nowStr = new Date().toLocaleString("es-MX", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const initialLog: NotificationDeliveryLog = {
    id: logId,
    timestamp: nowStr,
    triggerKey,
    triggerName,
    channel,
    recipient: to,
    recipientName,
    developerName,
    status: "ENVIADO",
    retryCount: 0,
    metadata: { templateAlias, templateModel },
  };

  recordNotificationDeliveryLog(initialLog);

  if (channel === "POSTMARK") {
    try {
      const response = await fetch("/api/notifications/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to,
          templateAlias,
          templateModel,
          fromEmail,
          fromName,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        updateNotificationDeliveryLog(logId, {
          status: "ENTREGADO",
          errorDetails: undefined,
          metadata: { ...initialLog.metadata, messageId: data.messageId },
        });
        return { success: true, logId };
      } else {
        const errorMsg = data.error || `Error HTTP ${response.status} de Postmark`;
        updateNotificationDeliveryLog(logId, {
          status: "FALLIDO",
          errorDetails: errorMsg,
          metadata: { ...initialLog.metadata, postmarkCode: data.postmarkCode },
        });
        return { success: false, error: errorMsg, logId };
      }
    } catch (err: any) {
      const errorMsg = err.message || "Error de conexión al enviar notificación";
      updateNotificationDeliveryLog(logId, {
        status: "FALLIDO",
        errorDetails: errorMsg,
      });
      return { success: false, error: errorMsg, logId };
    }
  }

  // Non-postmark channels (simulated)
  updateNotificationDeliveryLog(logId, {
    status: "ENTREGADO",
  });
  return { success: true, logId };
}

export interface DispatchNotificationOptions {
  triggerKey: string;
  recipientEmail?: string;
  recipientPhone?: string;
  recipientName: string;
  developerName?: string;
  metadata?: Record<string, any>;
  forcedChannels?: Array<"POSTMARK" | "WHATSAPP" | "PUSH">;
}

/**
 * Centralized notification dispatcher across Postmark, WhatsApp, and Push
 */
export function dispatchSystemNotification(options: DispatchNotificationOptions): NotificationDeliveryLog[] {
  const channelsConfig = getNotificationChannelsConfig();
  const templates = getNotificationTemplates();
  const template = templates.find((t) => t.triggerKey === options.triggerKey);

  if (!template || !template.enabled) {
    return [];
  }

  const generatedLogs: NotificationDeliveryLog[] = [];
  const nowStr = new Date().toLocaleString("es-MX", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const devName = options.developerName || "Devio Inmobiliario";

  // 1. POSTMARK EMAIL
  if (
    template.postmark.enabled &&
    channelsConfig.postmark.enabled &&
    options.recipientEmail &&
    (!options.forcedChannels || options.forcedChannels.includes("POSTMARK"))
  ) {
    const pmkLogId = `log-pmk-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const pmkLog: NotificationDeliveryLog = {
      id: pmkLogId,
      timestamp: nowStr,
      triggerKey: template.triggerKey,
      triggerName: template.title,
      channel: "POSTMARK",
      recipient: options.recipientEmail,
      recipientName: options.recipientName,
      developerName: devName,
      status: "ENVIADO",
      retryCount: 0,
      metadata: {
        templateAlias: template.postmark.templateAlias,
        templateModel: {
          nombre: options.recipientName,
          correo: options.recipientEmail,
          ...options.metadata,
        },
      },
    };
    generatedLogs.push(pmkLog);

    // Real async dispatch with result logging
    if (typeof window !== "undefined") {
      fetch("/api/notifications/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: options.recipientEmail,
          templateAlias: template.postmark.templateAlias,
          templateModel: {
            nombre: options.recipientName,
            correo: options.recipientEmail,
            ...options.metadata,
          },
          fromEmail: channelsConfig.postmark.fromEmail || "noreply@deviomx.com",
          fromName: channelsConfig.postmark.senderAlias || "DEVIO",
        }),
      })
        .then(async (res) => {
          const data = await res.json();
          if (res.ok && data.success) {
            updateNotificationDeliveryLog(pmkLogId, {
              status: "ENTREGADO",
              errorDetails: undefined,
              metadata: { ...pmkLog.metadata, messageId: data.messageId },
            });
          } else {
            const errText = data.error || `Error ${res.status} al enviar correo con Postmark`;
            updateNotificationDeliveryLog(pmkLogId, {
              status: "FALLIDO",
              errorDetails: errText,
              metadata: { ...pmkLog.metadata, postmarkCode: data.postmarkCode },
            });
          }
        })
        .catch((err) => {
          updateNotificationDeliveryLog(pmkLogId, {
            status: "FALLIDO",
            errorDetails: err.message || "Error de red al despachar correo",
          });
        });
    }
  }

  // 2. WHATSAPP
  if (
    template.whatsapp.enabled &&
    channelsConfig.whatsapp.enabled &&
    options.recipientPhone &&
    (!options.forcedChannels || options.forcedChannels.includes("WHATSAPP"))
  ) {
    generatedLogs.push({
      id: `log-wa-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: nowStr,
      triggerKey: template.triggerKey,
      triggerName: template.title,
      channel: "WHATSAPP",
      recipient: options.recipientPhone,
      recipientName: options.recipientName,
      developerName: devName,
      status: "ENTREGADO",
      retryCount: 0,
      metadata: options.metadata,
    });
  }

  // 3. PUSH NOTIFICATION
  if (
    template.push.enabled &&
    channelsConfig.push.enabled &&
    (!options.forcedChannels || options.forcedChannels.includes("PUSH"))
  ) {
    generatedLogs.push({
      id: `log-push-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: nowStr,
      triggerKey: template.triggerKey,
      triggerName: template.title,
      channel: "PUSH",
      recipient: `Web Push App (${options.recipientName})`,
      recipientName: options.recipientName,
      developerName: devName,
      status: "ENTREGADO",
      retryCount: 0,
      metadata: options.metadata,
    });
  }

  if (generatedLogs.length > 0) {
    const currentLogs = getNotificationDeliveryLogs();
    const updated = [...generatedLogs, ...currentLogs];
    saveNotificationDeliveryLogs(updated);
  }

  return generatedLogs;
}
