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
    generatedLogs.push({
      id: `log-pmk-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: nowStr,
      triggerKey: template.triggerKey,
      triggerName: template.title,
      channel: "POSTMARK",
      recipient: options.recipientEmail,
      recipientName: options.recipientName,
      developerName: devName,
      status: "ENTREGADO",
      retryCount: 0,
      metadata: options.metadata,
    });

    // Real async dispatch if in browser
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
      }).catch((err) => {
        console.warn("Error sending Postmark notification:", err);
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
      status: "ENVIADO",
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
