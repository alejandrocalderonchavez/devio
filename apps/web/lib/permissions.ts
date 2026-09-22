export type UserRole =
  | "Super Admin"
  | "Director Comercial"
  | "Asesor de Ventas"
  | "Finanzas / Cobranza"
  | "Residente de Obra"
  | "Coordinador de Postventa"
  | "Legal / Notaría";

export type PermissionKey =
  // 1. DASHBOARD & FINANZAS
  | "dashboard.view_general"
  | "dashboard.view_financials"
  // 2. DESARROLLOS & PROYECTOS
  | "projects.create"
  | "projects.edit"
  | "projects.catalog_manage"
  // 3. INVENTARIO & UNIDADES
  | "units.view"
  | "units.edit_specs"
  | "units.change_price"
  | "units.bulk_price"
  | "units.bulk_import"
  | "units.quote"
  | "units.export"
  // 4. VENTAS & CONTRATACIÓN
  | "sales.view"
  | "sales.create"
  | "sales.edit"
  | "sales.cancel"
  | "sales.export"
  // 5. COBRANZA & PAGOS
  | "payments.view"
  | "payments.register"
  | "payments.bulk_import"
  | "payments.edit_schedule"
  | "payments.audit_abonos"
  | "payments.delete"
  | "payments.waive_moratory"
  | "payments.export"
  // 6. CLIENTES & ESTADO DE CUENTA
  | "clients.view"
  | "clients.edit"
  | "clients.upload_docs"
  | "clients.delete_docs"
  | "clients.export_statement"
  // 7. BÓVEDA DE DOCUMENTOS
  | "documents.view"
  | "documents.upload"
  | "documents.delete"
  // 8. AVANCE DE OBRA
  | "obra.view"
  | "obra.register_progress"
  // 9. POSTVENTA & GARANTÍAS
  | "postventa.view"
  | "postventa.manage"
  // 10. CONFIGURACIÓN & ADMINISTRACIÓN
  | "settings.manage_developer"
  | "settings.manage_plans"
  | "settings.manage_users";

export interface PermissionDefinition {
  key: PermissionKey;
  label: string;
  description: string;
  isParent?: boolean;
  parentKey?: PermissionKey;
}

export interface PermissionModuleCategory {
  id: string;
  name: string;
  iconName: string;
  parentKey?: PermissionKey;
  permissions: PermissionDefinition[];
}

export const PERMISSIONS_CATALOG: PermissionModuleCategory[] = [
  {
    id: "dashboard",
    name: "Dashboard & Métricas",
    iconName: "BarChart3",
    permissions: [
      {
        key: "dashboard.view_general",
        label: "Ver Dashboard Comercial",
        description: "Acceso al resumen de ventas, inventario y métricas generales",
      },
      {
        key: "dashboard.view_financials",
        label: "Ver Dashboard Financiero",
        description: "Acceso a flujo proyectado, cobranza total recaudada y cuentas por cobrar",
      },
    ],
  },
  {
    id: "projects",
    name: "Desarrollos & Proyectos",
    iconName: "Building",
    permissions: [
      {
        key: "projects.create",
        label: "Crear Nuevos Desarrollos",
        description: "Dar de alta nuevos proyectos y configuraciones base",
      },
      {
        key: "projects.edit",
        label: "Editar Proyectos",
        description: "Modificar datos generales, portada, logotipo y equipo asignado",
      },
      {
        key: "projects.catalog_manage",
        label: "Administrar Catálogos",
        description: "Gestionar catálogo de adicionales (cajones/bodegas) y planos de conjunto",
      },
    ],
  },
  {
    id: "units",
    name: "Inventario & Unidades",
    iconName: "Home",
    parentKey: "units.view",
    permissions: [
      {
        key: "units.view",
        label: "Ver Inventario de Unidades (Módulo)",
        description: "Permiso principal para acceder al listado y tarjetas de unidades",
        isParent: true,
      },
      {
        key: "units.edit_specs",
        label: "Editar Características Técnicas",
        description: "Modificar m², recámaras, nivel, orientación y distribución",
        parentKey: "units.view",
      },
      {
        key: "units.change_price",
        label: "Modificar Precio Individual",
        description: "Ajustar el precio de lista vigente de una unidad",
        parentKey: "units.view",
      },
      {
        key: "units.bulk_price",
        label: "Ajuste Masivo de Precios",
        description: "Aplicar incrementos o descuentos porcentuales por lote",
        parentKey: "units.view",
      },
      {
        key: "units.bulk_import",
        label: "Carga Masiva con Excel",
        description: "Importar y actualizar lotes de unidades desde archivos Excel",
        parentKey: "units.view",
      },
      {
        key: "units.quote",
        label: "Generar Cotizaciones",
        description: "Crear corridas financieras y cotizaciones comerciales",
        parentKey: "units.view",
      },
      {
        key: "units.export",
        label: "Exportar Inventario",
        description: "Descargar lista de unidades en formato Excel o PDF",
        parentKey: "units.view",
      },
    ],
  },
  {
    id: "sales",
    name: "Ventas & Contratación",
    iconName: "ShoppingBag",
    parentKey: "sales.view",
    permissions: [
      {
        key: "sales.view",
        label: "Ver Módulo de Ventas",
        description: "Consultar listado de ventas, expedientes y contratos",
        isParent: true,
      },
      {
        key: "sales.create",
        label: "Registrar Nueva Venta",
        description: "Apartar y vender unidades asignando cliente y plan de pagos",
        parentKey: "sales.view",
      },
      {
        key: "sales.edit",
        label: "Editar Venta & Adicionales",
        description: "Asignar/quitar adicionales de catálogo y ajustar calendarios",
        parentKey: "sales.view",
      },
      {
        key: "sales.cancel",
        label: "Cancelar Ventas / Liberar Unidades",
        description: "Rescindir ventas y revertir unidades vendidas a disponibles",
        parentKey: "sales.view",
      },
      {
        key: "sales.export",
        label: "Exportar Libro de Ventas",
        description: "Descargar catálogo de ventas y contratos en Excel o PDF",
        parentKey: "sales.view",
      },
    ],
  },
  {
    id: "payments",
    name: "Cobranza & Pagos",
    iconName: "CreditCard",
    parentKey: "payments.view",
    permissions: [
      {
        key: "payments.view",
        label: "Ver Calendario de Pagos (Módulo)",
        description: "Consultar calendario de cuotas y abonos registrados",
        isParent: true,
      },
      {
        key: "payments.register",
        label: "Registrar Pagos y Comprobantes SPEI",
        description: "Aplicar abonos reales y asociar comprobantes bancarios",
        parentKey: "payments.view",
      },
      {
        key: "payments.bulk_import",
        label: "Carga Masiva de Pagos Excel",
        description: "Importar cobros bancarios masivos desde archivo Excel",
        parentKey: "payments.view",
      },
      {
        key: "payments.edit_schedule",
        label: "Modificar Cuota Programada",
        description: "Ajustar fechas y montos programados con efecto cascada",
        parentKey: "payments.view",
      },
      {
        key: "payments.audit_abonos",
        label: "Auditar y Modificar Abonos Reales",
        description: "Corregir fechas, montos y métodos de abonos ya cobrados",
        parentKey: "payments.view",
      },
      {
        key: "payments.delete",
        label: "Eliminar / Revertir Abonos",
        description: "Revertir abonos cobrados y recalcular balances",
        parentKey: "payments.view",
      },
      {
        key: "payments.waive_moratory",
        label: "Condonar Intereses Moratorios",
        description: "Autorizar descuentos o condonación total de moratorios",
        parentKey: "payments.view",
      },
      {
        key: "payments.export",
        label: "Exportar Reportes de Cobranza",
        description: "Descargar libro contable de ingresos en Excel y PDF",
        parentKey: "payments.view",
      },
    ],
  },
  {
    id: "clients",
    name: "Clientes & Estados de Cuenta",
    iconName: "Users",
    parentKey: "clients.view",
    permissions: [
      {
        key: "clients.view",
        label: "Ver Directorio de Clientes (Módulo)",
        description: "Consultar lista de clientes, copropietarios y perfiles",
        isParent: true,
      },
      {
        key: "clients.edit",
        label: "Editar Datos de Cliente",
        description: "Modificar información de contacto, teléfono y RFC",
        parentKey: "clients.view",
      },
      {
        key: "clients.upload_docs",
        label: "Subir Documentos al Expediente",
        description: "Adjuntar identificaciones, contratos firmados y pagarés",
        parentKey: "clients.view",
      },
      {
        key: "clients.delete_docs",
        label: "Eliminar Documentos del Expediente",
        description: "Borrar archivos adjuntos del expediente del cliente",
        parentKey: "clients.view",
      },
      {
        key: "clients.export_statement",
        label: "Exportar / Imprimir Estado de Cuenta",
        description: "Descargar PDF oficial y Excel de estados de cuenta individuales",
        parentKey: "clients.view",
      },
    ],
  },
  {
    id: "documents",
    name: "Bóveda de Documentos",
    iconName: "FileText",
    parentKey: "documents.view",
    permissions: [
      {
        key: "documents.view",
        label: "Consultar Bóveda de Documentos",
        description: "Ver archivos, contratos tipo y licencias del proyecto",
        isParent: true,
      },
      {
        key: "documents.upload",
        label: "Subir Nuevos Documentos",
        description: "Cargar contratos, licencias y especificaciones técnicas",
        parentKey: "documents.view",
      },
      {
        key: "documents.delete",
        label: "Eliminar Documentos",
        description: "Borrar archivos de la bóveda del proyecto",
        parentKey: "documents.view",
      },
    ],
  },
  {
    id: "obra",
    name: "Avance de Obra",
    iconName: "HardHat",
    parentKey: "obra.view",
    permissions: [
      {
        key: "obra.view",
        label: "Ver Bitácora de Obra",
        description: "Consultar avances, galería fotográfica y porcentajes",
        isParent: true,
      },
      {
        key: "obra.register_progress",
        label: "Registrar Avance de Obra",
        description: "Registrar nuevos hitos, subir fotografías y dictámenes en PDF",
        parentKey: "obra.view",
      },
    ],
  },
  {
    id: "postventa",
    name: "Postventa & Garantías",
    iconName: "ShieldCheck",
    parentKey: "postventa.view",
    permissions: [
      {
        key: "postventa.view",
        label: "Ver Mesa de Control de Postventa",
        description: "Consultar tickets de garantía e incidencias registradas",
        isParent: true,
      },
      {
        key: "postventa.manage",
        label: "Gestionar Tickets y Reparaciones",
        description: "Crear tickets, cambiar estatus y asignar cuadrillas responsables",
        parentKey: "postventa.view",
      },
    ],
  },
  {
    id: "settings",
    name: "Configuración & Administración",
    iconName: "Settings",
    permissions: [
      {
        key: "settings.manage_developer",
        label: "Editar Datos de la Desarrolladora",
        description: "Modificar razón social, RFC, nombre comercial y logotipo",
      },
      {
        key: "settings.manage_plans",
        label: "Administrar Planes de Pago",
        description: "Crear, modificar y desactivar planes financieros maestros",
      },
      {
        key: "settings.manage_users",
        label: "Administrar Usuarios y Roles",
        description: "Invitar colaboradores y configurar la matriz de permisos",
      },
    ],
  },
];

export const ALL_PERMISSION_KEYS: PermissionKey[] = PERMISSIONS_CATALOG.flatMap(
  (c) => c.permissions.map((p) => p.key)
);

export const DEFAULT_ROLE_PERMISSIONS: Record<UserRole, PermissionKey[]> = {
  "Super Admin": ALL_PERMISSION_KEYS,

  "Director Comercial": [
    "dashboard.view_general",
    "dashboard.view_financials",
    "projects.create",
    "projects.edit",
    "projects.catalog_manage",
    "units.view",
    "units.edit_specs",
    "units.change_price",
    "units.bulk_price",
    "units.bulk_import",
    "units.quote",
    "units.export",
    "sales.view",
    "sales.create",
    "sales.edit",
    "sales.cancel",
    "sales.export",
    "payments.view",
    "payments.export",
    "payments.waive_moratory",
    "clients.view",
    "clients.edit",
    "clients.upload_docs",
    "clients.export_statement",
    "documents.view",
    "documents.upload",
    "obra.view",
    "postventa.view",
    "settings.manage_plans",
  ],

  "Asesor de Ventas": [
    "dashboard.view_general",
    "units.view",
    "units.quote",
    "units.export",
    "sales.view",
    "sales.create",
    "sales.export",
    "clients.view",
    "clients.edit",
    "clients.upload_docs",
    "clients.export_statement",
    "documents.view",
    "obra.view",
    "postventa.view",
  ],

  "Finanzas / Cobranza": [
    "dashboard.view_general",
    "dashboard.view_financials",
    "units.view",
    "units.export",
    "sales.view",
    "sales.export",
    "payments.view",
    "payments.register",
    "payments.bulk_import",
    "payments.edit_schedule",
    "payments.audit_abonos",
    "payments.waive_moratory",
    "payments.export",
    "clients.view",
    "clients.upload_docs",
    "clients.export_statement",
    "documents.view",
    "settings.manage_plans",
  ],

  "Residente de Obra": [
    "dashboard.view_general",
    "projects.catalog_manage",
    "units.view",
    "documents.view",
    "documents.upload",
    "obra.view",
    "obra.register_progress",
    "postventa.view",
  ],

  "Coordinador de Postventa": [
    "dashboard.view_general",
    "units.view",
    "clients.view",
    "documents.view",
    "obra.view",
    "postventa.view",
    "postventa.manage",
  ],

  "Legal / Notaría": [
    "units.view",
    "sales.view",
    "clients.view",
    "clients.upload_docs",
    "clients.export_statement",
    "documents.view",
    "documents.upload",
    "documents.delete",
  ],
};

export const ROLE_PRESETS = DEFAULT_ROLE_PERMISSIONS;

export function getRolePermissionsMap(role: UserRole): Record<string, boolean> {
  const allowedKeys = DEFAULT_ROLE_PERMISSIONS[role] || ALL_PERMISSION_KEYS;
  const map: Record<string, boolean> = {};
  ALL_PERMISSION_KEYS.forEach((k) => {
    map[k] = allowedKeys.includes(k);
  });
  return map;
}

/**
 * Intelligent permission toggling with parent-child cascade logic
 */
export function togglePermissionWithCascade(
  currentPerms: Record<string, boolean>,
  toggledKey: PermissionKey
): Record<string, boolean> {
  const isCurrentlyActive = Boolean(currentPerms[toggledKey]);
  const willBeActive = !isCurrentlyActive;
  const nextPerms = { ...currentPerms, [toggledKey]: willBeActive };

  // Find module & definition
  for (const cat of PERMISSIONS_CATALOG) {
    const def = cat.permissions.find((p) => p.key === toggledKey);
    if (!def) continue;

    // 1. If it's a Parent permission:
    if (def.isParent) {
      if (!willBeActive) {
        // If Parent is turned OFF, turn OFF all child permissions in this category
        cat.permissions.forEach((child) => {
          if (child.key !== toggledKey) {
            nextPerms[child.key] = false;
          }
        });
      }
    } else if (def.parentKey) {
      // 2. If it's a Child permission being turned ON, automatically turn ON its Parent
      if (willBeActive) {
        nextPerms[def.parentKey] = true;
      }
    }
    break;
  }

  return nextPerms;
}

/**
 * Toggle all permissions in a module category on/off
 */
export function toggleModuleAllPermissions(
  currentPerms: Record<string, boolean>,
  categoryId: string,
  enableAll: boolean
): Record<string, boolean> {
  const cat = PERMISSIONS_CATALOG.find((c) => c.id === categoryId);
  if (!cat) return currentPerms;

  const nextPerms = { ...currentPerms };
  cat.permissions.forEach((p) => {
    nextPerms[p.key] = enableAll;
  });
  return nextPerms;
}

/**
 * Check if user has permission
 */
export function checkPermission(
  userRole?: string,
  userPermissions?: string[] | Record<string, boolean>,
  requiredPermission?: PermissionKey
): boolean {
  if (!requiredPermission) return true;
  if (!userRole && !userPermissions) return true;

  if (userRole === "Super Admin" || userRole === "SUPER_ADMIN" || userRole === "admin") {
    return true;
  }

  if (Array.isArray(userPermissions)) {
    if (userPermissions.includes("all") || userPermissions.includes("*")) {
      return true;
    }
    return userPermissions.includes(requiredPermission);
  }

  if (typeof userPermissions === "object" && userPermissions !== null) {
    return Boolean(userPermissions[requiredPermission]);
  }

  return false;
}
