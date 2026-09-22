export type PostventaStatus =
  | "Reportada"
  | "En revisión"
  | "Asignada"
  | "Visita programada"
  | "En reparación"
  | "Esperando cliente"
  | "Resuelta"
  | "Cerrada"
  | "Reabierta";

export type PostventaPriority = "Baja" | "Media" | "Alta" | "Urgente";

export type PostventaCategory =
  | "Plomería / Hidráulico"
  | "Eléctrico"
  | "Acabados / Pintura"
  | "Carpintería"
  | "Cancelaría / Vidrio"
  | "Aire Acondicionado / HVAC"
  | "Impermeabilización / Humedad"
  | "Estructural / Albañilería"
  | "Cerrajería / Seguridad"
  | "General";

export interface PostventaSupplier {
  id: string;
  name: string;
  specialty: PostventaCategory;
  phone: string;
  email: string;
  contactPerson: string;
}

export interface PostventaAppointment {
  id: string;
  scheduledDate: string; // YYYY-MM-DD or DD/MM/YYYY
  scheduledTime: string; // HH:MM
  technicianName: string;
  supplierName?: string;
  status: "PROGRAMADA" | "COMPLETADA" | "CANCELADA" | "REPROGRAMADA";
  notes?: string;
}

export interface PostventaLogItem {
  id: string;
  timestamp: string;
  authorName: string;
  authorRole: string;
  action: string;
  previousState?: string;
  newState?: string;
  notes?: string;
}

export interface PostventaComment {
  id: string;
  timestamp: string;
  authorName: string;
  authorRole: string;
  isInternalOnly: boolean;
  message: string;
  attachments?: string[];
}

export interface PostventaEvidence {
  id: string;
  type: "INITIAL_DEFECT" | "REPAIR_PROOF" | "DELIVERY_ACT";
  url: string;
  title: string;
  uploadDate: string;
  uploadedBy: string;
}

export interface PostventaCSAT {
  rating: number; // 1 to 5
  feedbackDate: string;
  comment?: string;
  timelinessRating: number; // 1 to 5
  qualityRating: number; // 1 to 5
}

export interface PostventaIncident {
  id: string;
  folio: string; // e.g. INC-2026-001
  projectId: string;
  projectName: string;
  unit: string;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  coOwners?: Array<{ name: string; pct: number; phone?: string }>;
  category: PostventaCategory;
  priority: PostventaPriority;
  status: PostventaStatus;
  title: string;
  description: string;
  createdAt: string;
  updatedAt: string;
  slaHours: number; // e.g. 24, 48, 72, 120
  slaDeadline: string; // ISO date or DD/MM/YYYY HH:MM
  slaExpired: boolean;
  assignedTo: {
    id: string;
    name: string;
    role: string;
  };
  supplier?: PostventaSupplier;
  appointments: PostventaAppointment[];
  evidences: PostventaEvidence[];
  comments: PostventaComment[];
  logs: PostventaLogItem[];
  csat?: PostventaCSAT;
  isReopened?: boolean;
  reopenedCount?: number;
  reopenedReason?: string;
}

// ---------------------------------------------------------------------------
// MASTER SUPPLIERS DATASET
// ---------------------------------------------------------------------------

export const POSTVENTA_SUPPLIERS: PostventaSupplier[] = [
  {
    id: "sup-1",
    name: "HidroSoluciones GDL",
    specialty: "Plomería / Hidráulico",
    phone: "3321456789",
    email: "contacto@hidrosoluciones.mx",
    contactPerson: "Ing. Manuel Ramos",
  },
  {
    id: "sup-2",
    name: "Electromecánica Integral Bajío",
    specialty: "Eléctrico",
    phone: "3318904567",
    email: "servicios@electrobajio.com",
    contactPerson: "Téc. Fernando Ruiz",
  },
  {
    id: "sup-3",
    name: "Acabados & Pinturas Premier",
    specialty: "Acabados / Pintura",
    phone: "3334567890",
    email: "operaciones@acabadospremier.mx",
    contactPerson: "Arq. Sofia Lozano",
  },
  {
    id: "sup-4",
    name: "Maderas & Diseños Finos",
    specialty: "Carpintería",
    phone: "3328901234",
    email: "ventas@maderasfinas.com",
    contactPerson: "Maestro Sergio Vega",
  },
  {
    id: "sup-5",
    name: "Vidrio & Aluminio Europeo",
    specialty: "Cancelaría / Vidrio",
    phone: "3312345678",
    email: "garantias@vidrioeuropeo.mx",
    contactPerson: "Lic. Carlos Morales",
  },
  {
    id: "sup-6",
    name: "Climas & Confort HVAC",
    specialty: "Aire Acondicionado / HVAC",
    phone: "3345678901",
    email: "soporte@climasconfort.mx",
    contactPerson: "Ing. Arturo Peña",
  },
];

// ---------------------------------------------------------------------------
// INITIAL SAMPLE INCIDENTS DATASET
// ---------------------------------------------------------------------------

export const INITIAL_INCIDENTS: PostventaIncident[] = [
  {
    id: "inc-1",
    folio: "INC-2026-001",
    projectId: "p-1",
    projectName: "Tradere",
    unit: "4B",
    clientName: "Alex",
    clientEmail: "acalderoncha@gmail.com",
    clientPhone: "3318497489",
    coOwners: [{ name: "Carlos Calderón", pct: 30, phone: "3321457890" }],
    category: "Plomería / Hidráulico",
    priority: "Urgente",
    status: "En reparación",
    title: "Fuga de agua en llave mezcladora de cocina principal",
    description: "Se detecta goteo continuo por debajo de la tarja que humedece la base del mueble de carpintería.",
    createdAt: "16 Sep 2026 10:30",
    updatedAt: "17 Sep 2026 14:15",
    slaHours: 24,
    slaDeadline: "17 Sep 2026 10:30",
    slaExpired: false,
    assignedTo: { id: "usr-2", name: "Alejandro Calderón", role: "Coordinador de Postventa" },
    supplier: POSTVENTA_SUPPLIERS[0],
    appointments: [
      {
        id: "app-1",
        scheduledDate: "17 Sep 2026",
        scheduledTime: "16:00",
        technicianName: "Juan Pérez (HidroSoluciones)",
        supplierName: "HidroSoluciones GDL",
        status: "PROGRAMADA",
        notes: "Llevar empaques de repuesto y sellador de alta resistencia.",
      },
    ],
    evidences: [
      {
        id: "ev-1",
        type: "INITIAL_DEFECT",
        url: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=800&q=80",
        title: "Goteo bajo tarja de cocina",
        uploadDate: "16 Sep 2026",
        uploadedBy: "Alex (Cliente)",
      },
    ],
    comments: [
      {
        id: "comm-1",
        timestamp: "16 Sep 2026 11:00",
        authorName: "Alejandro Calderón",
        authorRole: "Postventa",
        isInternalOnly: false,
        message: "Estimado Alex, recibimos tu reporte. Hemos asignado al proveedor HidroSoluciones para atender la fuga hoy por la tarde.",
      },
      {
        id: "comm-2",
        timestamp: "16 Sep 2026 11:45",
        authorName: "Alejandro Calderón",
        authorRole: "Postventa",
        isInternalOnly: true,
        message: "Nota interna: Verificar si el mueble de carpintería requiere reemplazo de zócalo por humedad.",
      },
    ],
    logs: [
      {
        id: "log-1",
        timestamp: "16 Sep 2026 10:30",
        authorName: "Alex",
        authorRole: "Cliente",
        action: "Creación de Incidencia",
        newState: "Reportada",
      },
      {
        id: "log-2",
        timestamp: "16 Sep 2026 10:55",
        authorName: "Alejandro Calderón",
        authorRole: "Postventa",
        action: "Asignación de Proveedor",
        previousState: "Reportada",
        newState: "Asignada",
        notes: "Asignado a HidroSoluciones GDL con SLA de 24 horas.",
      },
      {
        id: "log-3",
        timestamp: "17 Sep 2026 09:00",
        authorName: "Alejandro Calderón",
        authorRole: "Postventa",
        action: "Cita Agendada",
        previousState: "Asignada",
        newState: "Visita programada",
        notes: "Cita confirmada con propietario para el 17 Sep a las 16:00 hrs.",
      },
      {
        id: "log-4",
        timestamp: "17 Sep 2026 14:15",
        authorName: "Manuel Ramos",
        authorRole: "Proveedor",
        action: "Inicio de Trabajos",
        previousState: "Visita programada",
        newState: "En reparación",
      },
    ],
  },
  {
    id: "inc-2",
    folio: "INC-2026-002",
    projectId: "p-1",
    projectName: "Tradere",
    unit: "1C",
    clientName: "Inigo Heredia Horner",
    clientEmail: "0242573@up.edu.mx",
    clientPhone: "3322567499",
    coOwners: [{ name: "Mariana Silva González", pct: 50, phone: "3319876543" }],
    category: "Cancelaría / Vidrio",
    priority: "Media",
    status: "Visita programada",
    title: "Ajuste de riel y chapa en cancel corredizo de recámara principal",
    description: "La puerta corrediza que da a la terraza no desliza suavemente y el seguro no traba con facilidad.",
    createdAt: "15 Sep 2026 16:20",
    updatedAt: "17 Sep 2026 11:00",
    slaHours: 72,
    slaDeadline: "18 Sep 2026 16:20",
    slaExpired: false,
    assignedTo: { id: "usr-2", name: "Alejandro Calderón", role: "Coordinador de Postventa" },
    supplier: POSTVENTA_SUPPLIERS[4],
    appointments: [
      {
        id: "app-2",
        scheduledDate: "18 Sep 2026",
        scheduledTime: "11:30",
        technicianName: "Roberto Luna",
        supplierName: "Vidrio & Aluminio Europeo",
        status: "PROGRAMADA",
        notes: "Alineación de riel y lubricación de rodamientos de nylon.",
      },
    ],
    evidences: [
      {
        id: "ev-2",
        type: "INITIAL_DEFECT",
        url: "https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=800&q=80",
        title: "Cancel corredizo terraza",
        uploadDate: "15 Sep 2026",
        uploadedBy: "Inigo Heredia",
      },
    ],
    comments: [],
    logs: [
      {
        id: "log-201",
        timestamp: "15 Sep 2026 16:20",
        authorName: "Inigo Heredia",
        authorRole: "Cliente",
        action: "Creación de Incidencia",
        newState: "Reportada",
      },
      {
        id: "log-202",
        timestamp: "16 Sep 2026 09:30",
        authorName: "Alejandro Calderón",
        authorRole: "Postventa",
        action: "Cita Agendada",
        previousState: "Reportada",
        newState: "Visita programada",
      },
    ],
  },
  {
    id: "inc-3",
    folio: "INC-2026-003",
    projectId: "p-2",
    projectName: "Castellana Residencial",
    unit: "1A",
    clientName: "Hugo Heredia Horner",
    clientEmail: "hheredia@hyhconsultores.com",
    clientPhone: "3322567568",
    category: "Acabados / Pintura",
    priority: "Baja",
    status: "Cerrada",
    title: "Detalle menor de pintura y resane en muro de estancia",
    description: "Se apreciaba una pequeña fisura superficial por asentamiento en la esquina del vestíbulo.",
    createdAt: "10 Sep 2026 12:00",
    updatedAt: "14 Sep 2026 17:00",
    slaHours: 120,
    slaDeadline: "15 Sep 2026 12:00",
    slaExpired: false,
    assignedTo: { id: "usr-2", name: "Alejandro Calderón", role: "Coordinador de Postventa" },
    supplier: POSTVENTA_SUPPLIERS[2],
    appointments: [
      {
        id: "app-3",
        scheduledDate: "12 Sep 2026",
        scheduledTime: "10:00",
        technicianName: "Pedro Méndez",
        supplierName: "Acabados & Pinturas Premier",
        status: "COMPLETADA",
        notes: "Resane con pasta elastomérica y aplicación de dos manos de pintura vinílica tono blanco marfil.",
      },
    ],
    evidences: [
      {
        id: "ev-3a",
        type: "INITIAL_DEFECT",
        url: "https://images.unsplash.com/photo-1562259949-e8e7689d7828?auto=format&fit=crop&w=800&q=80",
        title: "Fisura antes de reparación",
        uploadDate: "10 Sep 2026",
        uploadedBy: "Hugo Heredia",
      },
      {
        id: "ev-3b",
        type: "REPAIR_PROOF",
        url: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80",
        title: "Muro resanado y pintado al 100%",
        uploadDate: "13 Sep 2026",
        uploadedBy: "Acabados Premier",
      },
    ],
    comments: [
      {
        id: "comm-301",
        timestamp: "14 Sep 2026 16:30",
        authorName: "Hugo Heredia",
        authorRole: "Cliente",
        isInternalOnly: false,
        message: "Excelente trabajo, el acabado quedó idéntico y muy limpio.",
      },
    ],
    csat: {
      rating: 5,
      feedbackDate: "14 Sep 2026",
      comment: "Muy puntuales y amables. El trabajo quedó impecable.",
      timelinessRating: 5,
      qualityRating: 5,
    },
    logs: [
      {
        id: "log-301",
        timestamp: "10 Sep 2026 12:00",
        authorName: "Hugo Heredia",
        authorRole: "Cliente",
        action: "Creación de Incidencia",
        newState: "Reportada",
      },
      {
        id: "log-302",
        timestamp: "13 Sep 2026 18:00",
        authorName: "Alejandro Calderón",
        authorRole: "Postventa",
        action: "Reparación Finalizada",
        previousState: "En reparación",
        newState: "Resuelta",
      },
      {
        id: "log-303",
        timestamp: "14 Sep 2026 17:00",
        authorName: "Hugo Heredia",
        authorRole: "Cliente",
        action: "Cierre y Encuesta CSAT",
        previousState: "Resuelta",
        newState: "Cerrada",
        notes: "Cliente califica con 5 estrellas y firma conformidad digital.",
      },
    ],
  },
  {
    id: "inc-4",
    folio: "INC-2026-004",
    projectId: "p-1",
    projectName: "Tradere",
    unit: "2A",
    clientName: "Inigo Heredia Hernandez",
    clientEmail: "iheredia@aktie.com.mx",
    clientPhone: "3348949303",
    category: "Aire Acondicionado / HVAC",
    priority: "Alta",
    status: "En revisión",
    title: "El equipo Minisplit del área social no enfría adecuadamente",
    description: "Enciende la unidad interior pero después de 15 minutos el compresor exterior emite un zumbido y arroja código E4.",
    createdAt: "17 Sep 2026 08:30",
    updatedAt: "17 Sep 2026 09:00",
    slaHours: 48,
    slaDeadline: "19 Sep 2026 08:30",
    slaExpired: false,
    assignedTo: { id: "usr-2", name: "Alejandro Calderón", role: "Coordinador de Postventa" },
    appointments: [],
    evidences: [],
    comments: [],
    logs: [
      {
        id: "log-401",
        timestamp: "17 Sep 2026 08:30",
        authorName: "Inigo Heredia H.",
        authorRole: "Cliente",
        action: "Creación de Incidencia",
        newState: "Reportada",
      },
      {
        id: "log-402",
        timestamp: "17 Sep 2026 09:00",
        authorName: "Alejandro Calderón",
        authorRole: "Postventa",
        action: "Revisión Técnica",
        previousState: "Reportada",
        newState: "En revisión",
        notes: "Verificando póliza de garantía directa con marca Carrier.",
      },
    ],
  },
  {
    id: "inc-5",
    folio: "INC-2026-005",
    projectId: "p-2",
    projectName: "Castellana Residencial",
    unit: "9A",
    clientName: "Matias Live7823",
    clientEmail: "0243450@up.edu.mx",
    clientPhone: "6345645654",
    category: "Eléctrico",
    priority: "Media",
    status: "Reabierta",
    title: "Falso contacto intermitente en apagador de escalera",
    description: "Se había resanado pero el contacto volvió a fallar al presionar en la parte superior.",
    createdAt: "05 Sep 2026 14:00",
    updatedAt: "17 Sep 2026 15:30",
    slaHours: 48,
    slaDeadline: "19 Sep 2026 15:30",
    slaExpired: false,
    isReopened: true,
    reopenedCount: 1,
    reopenedReason: "Falla eléctrica reincidente en circuito de 3 vías.",
    assignedTo: { id: "usr-2", name: "Alejandro Calderón", role: "Coordinador de Postventa" },
    supplier: POSTVENTA_SUPPLIERS[1],
    appointments: [],
    evidences: [],
    comments: [
      {
        id: "comm-501",
        timestamp: "17 Sep 2026 15:30",
        authorName: "Matias Live",
        authorRole: "Cliente",
        isInternalOnly: false,
        message: "Volvió a parpadear la luz del descanso al subir la escalera.",
      },
    ],
    logs: [
      {
        id: "log-501",
        timestamp: "17 Sep 2026 15:30",
        authorName: "Matias Live",
        authorRole: "Cliente",
        action: "Reapertura de Incidencia",
        previousState: "Resuelta",
        newState: "Reabierta",
        notes: "Garantía reincidente: Se reactiva SLA prioritario de 48 horas.",
      },
    ],
  },
];
