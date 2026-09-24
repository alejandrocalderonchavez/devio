export type ClientLanguage = "es" | "en";
export type ClientCurrency = "MXN" | "USD";

export const CLIENT_TRANSLATIONS = {
  es: {
    // Navigation
    tabProperties: "Mis Propiedades",
    tabProfile: "Mi Perfil",
    welcomeBack: "Bienvenido de nuevo,",
    clientProfileTitle: "Mi Perfil de Cliente",
    notificationsTitle: "Notificaciones",
    noNotifications: "No tienes notificaciones pendientes",
    
    // Sub-screens
    screenDetail: "Detalle de Propiedad",
    screenConstruction: "Avance de Obra",
    screenDocuments: "Documentación Oficial",
    screenStatement: "Estado de Cuenta y Pagos",
    back: "Volver",
    
    // Status badges
    statusCurrent: "AL CORRIENTE",
    statusOverdue: "CUOTA VENCIDA",
    statusUpcoming: "TU PRÓXIMO PAGO",
    noDebts: "Sin adeudos",
    daysRemaining: "días restantes",
    daysOverdue: "días vencido",
    dueToday: "Vence hoy",
    dueOn: "Vence el",
    paid: "Pagado",
    pending: "Pendiente",
    overdue: "Atrasado",
    
    // Financial Summary
    financialSummary: "Resumen Financiero",
    totalSalePrice: "Precio Total de Venta",
    totalPaidToDate: "Total Pagado a la Fecha",
    pendingBalance: "Saldo Pendiente por Liquidar",
    overdueBalance: "Saldo Vencido Atrasado",
    accumulatedOverdue: "Saldo Vencido Acumulado",
    viewPaymentsAndReceipts: "Ver Pagos & Recibos",
    viewScheduleAndBalance: "Ver Saldo y Calendario de Pagos",
    viewProgressAndPhotos: "Ver Avances y Fotos",
    
    // Copropiedad
    coOwnershipTitle: "Régimen de Copropiedad",
    coOwnershipBadge: "Propiedad en Copropiedad",
    yourShare: "Tu Participación",
    ownershipDistribution: "Distribución Patrimonial",
    registeredCoOwners: "Titulares Registrados",
    primaryOwner: "Titular Principal",
    coOwner: "Copropietario",
    mainContact: "Contacto Principal",
    myShareOfValue: "Tu Valor Proporcional",
    
    // Unit Specs
    technicalSpecs: "Información Técnica de la Unidad",
    totalArea: "Superficie Total",
    bedrooms: "Recámaras",
    bathrooms: "Baños",
    parkingSpots: "Estacionamientos",
    storageUnits: "Bodegas",
    floorLevel: "Nivel / Piso",
    maintenanceFee: "Cuota de Mantenimiento Estimada",
    additionalFeatures: "Atributos Adicionales",
    
    // Quick Actions
    documents: "Documentos",
    accountStatement: "Estado de Cuenta",
    marketplace: "Marketplace",
    scheduleTab: "Calendario de Cuotas",
    historyTab: "Historial de Pagos",
    downloadReceipt: "Descargar Recibo Oficial",
    downloadStatement: "Descargar Estado de Cuenta",
    
    // Progress
    generalProgress: "Avance General de Obra",
    estimatedDelivery: "Entrega Estimada",
    lastProgressUpdate: "Última Actualización",
    specialties: "Especialidades y Frentes",
    photographicRecord: "Bitácora Fotográfica",
    noMilestones: "No se han publicado bitácoras de avance recientemente",
    noDocuments: "No se han publicado documentos para esta propiedad",
    
    // Settings & Profile
    profileData: "Datos del Propietario",
    accountSettings: "Configuración de Cuenta",
    language: "Idioma",
    currency: "Moneda",
    spanish: "Español (ES)",
    english: "English (EN)",
    banxicoRate: "Tipo de Cambio Banxico FIX",
    liveRateBadge: "Banxico FX en Vivo",
    signOut: "Cerrar Sesión",
    securityNote: "Acceso seguro y protegido con encriptación Devio Cloud",
    phone: "Teléfono",
    email: "Correo Electrónico",
    rfc: "RFC / Identificación Fiscal",
    address: "Dirección Registrada",
    
    // Empty state
    noPropertiesTitle: "No se encontraron propiedades vinculadas",
    noPropertiesDesc: "Tu cuenta no tiene unidades formalizadas registradas actualmente. Si adquiriste una propiedad, contacta a tu asesor comercial.",

    // Profile screen specific
    myProfile: "Mi Perfil de Cliente",
    settingsSection: "Ajustes",
    languageSection: "Idioma",
    currencySection: "Moneda",
    languageLabel: "Idioma de la plataforma",
    currencyLabel: "Moneda de visualización",
    currencyMXNDesc: "Pesos Mexicanos (MXN)",
    personalInfo: "Información personal",
    changePassword: "Cambiar contraseña",
    legal: "Legal",
    support: "Soporte y Ayuda",
    supportTitle: "Soporte y Atención a Clientes",
    logout: "Cerrar sesión",
    logoutTitle: "Cerrar Sesión",
    logoutConfirm: "¿Estás seguro de que deseas cerrar tu sesión en Devio Cliente?",
    cancel: "Cancelar",

    // Co-ownership card (screen level)
    coOwners: "Copropietarios",
    myParticipation: "Mi Participación",
  },
  en: {
    // Navigation
    tabProperties: "My Properties",
    tabProfile: "My Profile",
    welcomeBack: "Welcome back,",
    clientProfileTitle: "My Client Profile",
    notificationsTitle: "Notifications",
    noNotifications: "You have no pending notifications",
    
    // Sub-screens
    screenDetail: "Property Details",
    screenConstruction: "Construction Progress",
    screenDocuments: "Official Documents",
    screenStatement: "Account Statement & Payments",
    back: "Back",
    
    // Status badges
    statusCurrent: "CURRENT",
    statusOverdue: "OVERDUE",
    statusUpcoming: "NEXT PAYMENT",
    noDebts: "No debts",
    daysRemaining: "days remaining",
    daysOverdue: "days overdue",
    dueToday: "Due today",
    dueOn: "Due on",
    paid: "Paid",
    pending: "Pending",
    overdue: "Overdue",
    
    // Financial Summary
    financialSummary: "Financial Summary",
    totalSalePrice: "Total Sale Price",
    totalPaidToDate: "Total Paid to Date",
    pendingBalance: "Outstanding Balance",
    overdueBalance: "Overdue Balance",
    accumulatedOverdue: "Accumulated Overdue Balance",
    viewPaymentsAndReceipts: "View Payments & Receipts",
    viewScheduleAndBalance: "View Balance & Payment Schedule",
    viewProgressAndPhotos: "View Progress & Photos",
    
    // Copropiedad
    coOwnershipTitle: "Co-Ownership Regime",
    coOwnershipBadge: "Co-Owned Property",
    yourShare: "Your Ownership Share",
    ownershipDistribution: "Ownership Distribution",
    registeredCoOwners: "Registered Owners",
    primaryOwner: "Primary Owner",
    coOwner: "Co-Owner",
    mainContact: "Main Contact",
    myShareOfValue: "Your Proportional Value",
    
    // Unit Specs
    technicalSpecs: "Unit Technical Specs",
    totalArea: "Total Area",
    bedrooms: "Bedrooms",
    bathrooms: "Bathrooms",
    parkingSpots: "Parking Spots",
    storageUnits: "Storage Units",
    floorLevel: "Floor Level",
    maintenanceFee: "Estimated Maintenance Fee",
    additionalFeatures: "Additional Features",
    
    // Quick Actions
    documents: "Documents",
    accountStatement: "Account Statement",
    marketplace: "Marketplace",
    scheduleTab: "Payment Schedule",
    historyTab: "Payment History",
    downloadReceipt: "Download Official Receipt",
    downloadStatement: "Download Account Statement",
    
    // Progress
    generalProgress: "Overall Construction Progress",
    estimatedDelivery: "Estimated Delivery",
    lastProgressUpdate: "Last Update",
    specialties: "Workstreams & Specialties",
    photographicRecord: "Photo Log",
    noMilestones: "No progress photo logs have been published yet",
    noDocuments: "No official documents available for this unit yet",
    
    // Settings & Profile
    profileData: "Owner Information",
    accountSettings: "Account Settings",
    language: "Language",
    currency: "Currency",
    spanish: "Spanish (ES)",
    english: "English (EN)",
    banxicoRate: "Official Banxico FIX Exchange Rate",
    liveRateBadge: "Live Banxico FX",
    signOut: "Sign Out",
    securityNote: "Secure and protected with Devio Cloud encryption",
    phone: "Phone",
    email: "Email",
    rfc: "Tax ID / RFC",
    address: "Registered Address",
    
    // Empty state
    noPropertiesTitle: "No linked properties found",
    noPropertiesDesc: "Your account does not currently have formalized units registered. If you acquired a unit, please contact your sales executive.",

    // Profile screen specific
    myProfile: "My Client Profile",
    settingsSection: "Settings",
    languageSection: "Language",
    currencySection: "Currency",
    languageLabel: "Platform language",
    currencyLabel: "Display currency",
    currencyMXNDesc: "Mexican Pesos (MXN)",
    personalInfo: "Personal information",
    changePassword: "Change password",
    legal: "Legal",
    support: "Support & Help",
    supportTitle: "Customer Support",
    logout: "Sign out",
    logoutTitle: "Sign Out",
    logoutConfirm: "Are you sure you want to sign out of Devio Client?",
    cancel: "Cancel",

    // Co-ownership card (screen level)
    coOwners: "Co-Owners",
    myParticipation: "My Participation",
  },
};
