import { ClientUser, ClientProperty, PushNotificationItem } from "../types/client";

export const CLIENT_USERS: Record<string, ClientUser> = {
  "default": {
    id: "cli-default",
    name: "Eduardo Arroniz Estefan",
    email: "earronize@gmail.com",
    phone: "+52 33 3123 4567",
    rfc: "ARRE800101XYZ",
    address: "Paseo Valle Real 1050, Zapopan, Jal.",
    avatarUrl: "https://ui-avatars.com/api/?name=Eduardo+Arroniz&background=1F3652&color=fff&bold=true",
    preferredLanguage: "es",
  },
};

export const INITIAL_CLIENT_USER: ClientUser = CLIENT_USERS["default"]!;

export const INITIAL_CLIENT_PROPERTIES: ClientProperty[] = [];

export const INITIAL_PUSH_NOTIFICATIONS: PushNotificationItem[] = [];
