# Devio — Guía de Desarrollo y Arquitectura para Agentes

> **MANDATORIO:** Todo agente o desarrollador que trabaje en este monorepo **DEBE** leer y apegarse estrictamente a este documento antes de generar o modificar código. Este archivo es un documento vivo y debe actualizarse ante cualquier cambio arquitectónico o de negocio relevante.

---

## 1. Visión y Principios del Proyecto

Devio es la plataforma operativa central para desarrolladoras inmobiliarias y sus clientes compradores.
La migración desde Bubble a código busca:
1. **Cero ineficiencias heredadas:** Crear una arquitectura limpia, relacional y escalable (PostgreSQL + Prisma).
2. **Trazabilidad total:** Mantener `bubble_id` en los modelos para migración sin fricción y conciliación de saldos.
3. **Backend como única fuente de verdad:** Web y Mobile consumen la misma API (`apps/api`) y comparten tipos (`packages/types`) y validaciones (`packages/validation`).
4. **Copropiedad nativa:** Múltiples compradores por unidad con porcentajes obligatorios que sumen 100%, sin dueño principal forzado.
5. **Motor financiero estricto:** Validación matemática inquebrantable:
   $$\text{Precio de venta} + \text{ajustes} = \text{pagado} + \text{pendiente}$$

---

## 2. Tipos de Desarrollo Inmobiliario Soportados

La plataforma está diseñada para soportar 5 tipologías de proyectos inmobiliarios, cada una con atributos y métricas específicas:

1. **Vertical (Departamentos / Torres):**
   - Niveles, torres, tipologías, elevadores, amenidades comunes, terrazas, cajones de estacionamiento, bodegas.
2. **Horizontal (Casas / Privadas / Residenciales):**
   - Lotes, m² de terreno, m² de construcción, modelo de vivienda, indivisos, áreas comunes, cocheras.
3. **Comercial (Plazas / Locales / Oficinas):**
   - M² rentables/vendibles, frente, fondo, tipo de giro permitido, nivel de tráfico, mezzanine, cajones de clientes.
4. **Industrial (Parques Industriales / Bodegas / Naves / Macro-lotes):**
   - Altura libre, capacidad de carga de piso, bahías de carga/descarga, KVA eléctricos, acceso para trailers, uso de suelo.
5. **Mixto (Combinación de usos):**
   - Proyectos que combinan residencial vertical, comercial y/u oficinas en diferentes zonas o fases.

---

## 3. Internacionalización (i18n) y Multidivisa (FX)

### 3.1 Idiomas
- **Idiomas oficiales:** Español (`es`, predeterminado) e Inglés (`en`).
- Todos los textos, mensajes de validación, correos, PDFs e interfaces deben estar internacionalizados mediante claves de traducción estandarizadas.

### 3.2 Monedas y Tipo de Cambio (Banxico)
- **Monedas soportadas:** Pesos Mexicanos (`MXN`) y Dólares Estadounidenses (`USD`).
- **Moneda base por proyecto:** Se define en el onboarding del proyecto. Las obligaciones y contratos base se emiten en la moneda fijada del proyecto.
- **Visualización y preferencia del cliente:** El cliente (y el equipo comercial) puede alternar la vista entre `MXN` y `USD`.
- **Tipo de cambio oficial:** Se consulta diariamente la API oficial del **Banco de México (Banxico)** (Serie FIX / DOF) mediante un cron job en `apps/worker` y se almacena en caché/base de datos histórica.
- **Regla financiera de pagos:** Cuando un pago se liquida en una divisa distinta a la de la obligación, se registra la tasa de cambio pactada/aplicada en la fecha valor del pago para evitar distorsiones de saldo.

---

## 4. Estructura del Monorepo

```
devio-platform/
├── apps/
│   ├── web/          # Next.js 16 (Back office y Marketplace)
│   ├── mobile/       # Expo 57 / React Native (App nativa de clientes)
│   ├── api/          # NestJS 11 (API REST central)
│   └── worker/       # Procesos asíncronos: PDFs, correos, crons de Banxico, migraciones
│
├── packages/
│   ├── database/     # Prisma ORM + cliente generado
│   ├── types/        # Tipos de TypeScript compartidos
│   ├── validation/   # Esquemas de validación Zod compartidos
│   ├── ui/           # Sistema de diseño, tokens y componentes base compartidos
│   ├── web-views/    # Vistas y formularios compartidos entre Web y Mobile
│   ├── api-client/   # Cliente tipado para consumo de la API
│   └── typescript-config/ # Configuraciones TS base
```

---

## 5. Reglas y Estándares de UI/UX (¡Prohibido inventar componentes!)

Para evitar inconsistencias visuales y proliferación de componentes no estándar:

1. **Tokens y Sistema de Diseño (`packages/ui`):**
   - **Tipografía:** Inter o sans-serif neutral. Escala fija: `xs` (12px), `sm` (14px), `base` (16px), `lg` (18px), `xl` (20px), `2xl` (24px), `3xl` (30px).
   - **Paleta de Colores:**
     - Primario (Brand): Azul Devio / Slate oscuro profesional.
     - Neutros: Escala Slate/Zinc (`gray-50` a `gray-900`).
     - Semánticos: Success (Verde esmeralda), Warning (Ámbar), Danger (Rojo carmesí), Info (Azul cielo).
   - **Estados de Unidades (Estandarizados):**
     - `DISPONIBLE` (Verde / Emerald)
     - `APARTADA` (Amarillo / Amber)
     - `BLOQUEADA` (Gris / Slate)
     - `VENDIDA` (Azul oscuro / Indigo)
2. **Componentes Base Reutilizables:**
   - Botones (`Button` con variantes: `primary`, `secondary`, `outline`, `ghost`, `danger`).
   - Formularios (`Input`, `Select`, `Switch`, `Checkbox`, `CurrencyInput` con selector MXN/USD, `DatePicker`).
   - Modales y Drawers (`Modal`, `Sheet`, `Dialog`).
   - Tablas de Datos (`DataTable` con paginación, filtros de búsqueda y ordenamiento).
   - Badges y Chips (`StatusBadge` tipado con los enums oficiales).
   - Notificaciones y Toasts (`ToastProvider`).
3. **Regla de oro de UI:** Si un componente o variante no existe en el sistema de diseño, **se debe proponer en `packages/ui`** antes de implementar CSS arbitrario en una vista.

---

## 6. Motor Financiero y Cobranza

1. **Modelos separados:**
   - `Sale`: Registro de la venta (precio final, descuentos aplicados, moneda base).
   - `PaymentPlan`: Estructura del plan contratado (enganche %, parcialidades, finiquito).
   - `ScheduledObligation`: Cada cuota o pago esperado con fecha límite, monto original, saldo pendiente y estado (`PENDING`, `PARTIALLY_PAID`, `PAID`, `OVERDUE`).
   - `PaymentReceipt`: Registro del dinero ingresado (banco, fecha real, método, comprobante, moneda de pago y tipo de cambio).
   - `PaymentAllocation`: Puente N:M que distribuye un recibo de pago entre una o varias obligaciones.
2. **Interés Moratorio:**
   - Se calcula exclusivamente sobre obligaciones vencidas y con configuración expresa del proyecto o contrato. No se calcula como interés ordinario del plan base.
3. **Copropiedad:**
   - Cada venta puede tener $N$ `SaleCoOwner`. La suma de porcentajes de copropiedad debe validar exactamente $100.00\%$.
   - Los recibos de pago identifican quién aportó los fondos, pero el saldo de la unidad se refleja consolidado e individualmente.

---

## 7. Políticas de Migración desde Bubble

1. **Campos `bubble_id`:** Todas las tablas de negocio tienen `bubbleId String? @unique @map("bubble_id")`.
2. **Idempotencia:** Los scripts de migración en `apps/worker` deben ser re-ejecutables sin duplicar registros ni romper relaciones.
3. **Validación de Saldos:** Antes del corte, ningún cliente ni venta se considera migrado hasta que la suma de obligaciones y pagos coincida exactamente con la exportación auditada.

---

## 8. Proceso de Actualización de estas Guidelines

Cuando se tome una decisión arquitectónica o de negocio nueva (nuevos estados, integraciones de pasarelas de pago, cambios de reglas contables o flujos de usuario), **el agente o desarrollador debe actualizar este archivo `GUIDELINES.md`** reflejando el cambio.

---

## 9. Brandbook y Tokens Oficiales de Devio (2026)

### 9.1 Colores Institucionales
- **Azul Devio (Primario / Brand):** `#1F3652` (RGB `31, 54, 82` | CMYK `95, 75, 40, 35`)
- **Beige Devio (Acento / Destacados):** `#C7B28B` (RGB `199, 178, 139` | CMYK `22, 25, 45, 5`)

### 9.2 Colores Auxiliares y Semánticos
- **Azul Profundo:** `#162B3F` (RGB `22, 43, 63`)
- **Azul Mate:** `#577A8B` (RGB `87, 122, 139`)
- **Verde Mate (Success / Disponible / Finalizado):** `#6FAC9C` (RGB `111, 172, 156`)
- **Rojo Mate (Danger / Cancelado / Error):** `#F03D30` (RGB `240, 61, 48`)
- **Amarillo / Ámbar (Warning / Retrasado / Pendiente):** `#EACF4E` (RGB `234, 207, 78`)
- **Beige Escala 1:** `#AA9777`
- **Beige Escala 2:** `#99876D`
- **Neutro 1 (Bordes y fondos suaves claros):** `#E6E9EF` (RGB `230, 233, 239`)
- **Neutro 2:** `#A1AAB4` (RGB `161, 170, 180`)
- **Neutro 3:** `#757D8A` (RGB `117, 125, 138`)
- **Neutro 4:** `#2C3640` (RGB `44, 54, 64`)
- **Neutro 5 (Fondos oscuros / Dark Mode Base):** `#222A30` (RGB `34, 42, 48`)
- **Blanco:** `#FFFFFF`

### 9.3 Tipografías
- **Institucional / Títulos (H1 a H3):** *Power Grotesk*
- **Auxiliar / Textos / Formularios y UI (H4, H5, Body, Buttons, Inputs):** *Montserrat* (Light, Regular, SemiBold, Bold, Black)

### 9.4 Reglas de Reducción y Área de Protección
- El área de protección mínima alrededor del logotipo equivale al tamaño del carácter "o".
- Reducción mínima permitida:
  - Isologo Horizontal: 54 px (1.70 cm)
  - Isologo Vertical: 28 px (0.90 cm)
  - Logotipo solo: 28 px (0.90 cm)
  - Isotipo solo: 14 px (0.45 cm)

---

## 10. Reglas de Adaptación Dinámica por Tipología de Proyecto

El onboarding y la captura de inventario **DEBEN** adaptarse según la tipología seleccionada:

1. **Vertical (Torres / Departamentos):**
   - Campos: Torre, Nivel/Piso, Número de Unidad, m² Totales, m² Interiores, m² Terraza, Recámaras, Baños, Cajones de Estacionamiento, Bodegas, Vista/Orientación, Acceso a Elevador.
2. **Horizontal (Casas / Lotes / Privadas):**
   - Campos: Manzana/Lote, Modelo de Vivienda, m² Terreno, m² Construcción, m² Jardín Privado, Recámaras, Baños, Cajones de Estacionamiento, Frente (m), Fondo (m).
3. **Comercial (Plazas / Locales / Oficinas):**
   - Campos: Nivel, Número de Local/Oficina, m² Vendibles/Rentables, m² Mezzanine, Frente (m), Fondo (m), Giros Permitidos, KVA Eléctricos, Instalación de Gas, Cajones de Clientes.
4. **Industrial (Parques / Naves / Bodegas):**
   - Campos: Nave/Módulo, m² Terreno, m² Techados, Altura Libre (m), Capacidad de Carga de Piso (Ton/m²), Andenes de Carga, KVA Eléctricos, Acceso a Trailers, Uso de Suelo.
5. **Mixto:**
   - Permite clasificar cada unidad o sección bajo una de las 4 categorías anteriores dentro del mismo desarrollo.

---

## 11. Sistema de Invitaciones y Alta de Usuarios

1. Al registrar miembros en la organización o proyecto, se especifica `email`, `fullName`, `phone` y `role` (`SUPER_ADMIN`, `ADMIN`, `COMMERCIAL`, `CONSTRUCTION`, `CLIENT`).
2. Se genera un token seguro de invitación en la base de datos con expiración (7 días).
3. `apps/worker` despacha de inmediato el correo de bienvenida ("Acceso a la plataforma - Invitado por {Nombre de Desarrolladora}") con el diseño oficial del Brandbook y enlace de activación.

---

## 12. Regla Estricta: Prohibido el Uso de Emojis en el Frontend / UI

> **REGLA MANDATORIA DE DISEÑO:** Queda **ESTRICTAMENTE PROHIBIDO** el uso de emojis en cualquier parte de la interfaz de usuario (UI), tanto en Web (`apps/web`), Mobile (`apps/mobile`), como en correos o PDFs.

1. **Reemplazo con Iconografía Profesional:** Todo elemento visual, de estado, categoría o acción debe utilizar iconografía limpia y consistente (iconos SVG vectoriales / Lucide Icons) o badges tipográficos con los colores del Brandbook.
2. **Razones:** Mantener la sobriedad, elegancia, consistencia visual corporativa y alineación con la identidad de marca de Devio (Lineamientos 2026).
3. **Cero excepciones en UI:** No usar emojis en botones, títulos, tarjetas, selectores, modales, alertas, tablas ni notificaciones.

---

## 13. Lineamientos de UI/UX Apple Glass (Efecto Frosted Glass de Apple y Paridad Web/Mobile)

Para garantizar una experiencia visual prémium, táctil y coherente en todo el ecosistema de Devio:

### 13.1 Encabezado Superior de Bienvenida (Apple Glass Header)
1. **Translucidez y Blur:**
   - **Web (`apps/web`):** `backgroundColor: "rgba(31, 54, 82, 0.88)"`, `backdropFilter: "blur(20px) saturate(180%)"`, `borderBottom: "1px solid rgba(255, 255, 255, 0.12)"`, `boxShadow: "0 8px 32px rgba(15, 23, 42, 0.18)"`.
   - **Mobile (`apps/mobile`):** `BlurView` con intensidad 80 y tint dark (`rgba(31, 54, 82, 0.94)`), con borde inferior `rgba(255, 255, 255, 0.15)`.
2. **Logotipo Oficial:**
   - Usar el logotipo en blanco nítido (`logo-white.png`) para asegurar contraste óptimo y legibilidad contra fondos oscuros y translúcidos.

### 13.2 Dock de Navegación Inferior Flotante (Devio Blue Frosted Glass / Lippu & Apple Material)
1. **Morfología Cápsula Flotante:**
   - No utilizar barras de navegación rectangulares pegadas al borde.
   - Usar una cápsula flotante centrada (`borderRadius: 36px`, `height: 64px`, `maxWidth: 380px`), separada del borde inferior (`bottom: 16px` o `bottom: 26px` con Safe Area Insets).
2. **Material Glass Azul Devio (Apple Frosted Glass):**
   - **Fondo:** Translúcido en Azul Devio `rgba(31, 54, 82, 0.92)` con blur de 25px (`expo-blur` `tint="dark"` en Mobile; `backdrop-filter: blur(25px) saturate(180%)` en Web).
   - **Borde de Cristal:** Borde reflectante sutil `1.5px solid rgba(255, 255, 255, 0.2)`.
   - **Sombra Difusa:** `0 12px 36px rgba(31, 54, 82, 0.35), 0 2px 8px rgba(0, 0, 0, 0.12)`.
3. **Distribución de Íconos y Acentos:**
   - Disposición vertical (ícono arriba, texto abajo).
   - **Pestaña Activa:** Píldora de soporte translúcida `rgba(255, 255, 255, 0.18)`, ícono y texto en **Blanco Nítido (`#FFFFFF`)** con `fontWeight: 800`.
   - **Pestaña Inactiva:** Ícono en blanco translúcido `rgba(255, 255, 255, 0.55)`, texto en `rgba(255, 255, 255, 0.65)` con `fontWeight: 600`.
   - **Feedback Táctil:** `expo-haptics` (`impactAsync(Light)`) al alternar pestañas en iOS.

### 13.3 Controles Segmentados Nativos iOS (Segmented Controls)
1. **Estructura:**
   - Pista o contenedor con radio suave (`borderRadius: 12px`), fondo gris neutro `#E2E8F0` y padding de 4px.
   - Píldora activa en blanco `#FFFFFF` con elevación suave (`shadowOpacity: 0.08`), texto en Azul Devio `#1F3652` (font weight 800).
   - Elementos inactivos con texto neutral `#64748B`.

### 13.4 Persistencia de Sesión
- En la aplicación móvil (`apps/mobile`), la sesión debe persistirse de forma segura mediante `expo-secure-store` para mantener al usuario autenticado entre reinicios de la aplicación sin cerrar sesión inesperadamente.

---

## 14. Arquitectura de Despliegue, Base de Datos (Supabase + Railway) y Sincronización Frontend/Backend (Zero-Failure Architecture)

Para garantizar que todas las implementaciones funcionen de manera robusta y sin fallas entre el backend, la base de datos y la interfaz de usuario:

### 14.1 Despliegue y Networking (Railway + Vercel)
1. **Backend Central NestJS (`apps/api`):**
   - Desplegado en **Railway** (`https://devio-production.up.railway.app`).
   - Variables de entorno críticas: `DATABASE_URL`, `PORT`, `POSTMARK_API_KEY`, `POSTMARK_FROM_EMAIL`, `JWT_SECRET`.
2. **Frontend Next.js (`apps/web`):**
   - Desplegado en **Vercel** (`https://devio-web-six.vercel.app`).
   - Todas las llamadas al backend pasan a través de `rewrites()` en `apps/web/next.config.ts`, mapeando `/api/:path*` a la URL del backend en Railway.
3. **Límites de Payload HTTP (Evitar Errores 413):**
   - En `apps/api/src/main.ts`, siempre configurar `express.json({ limit: '50mb' })` y `express.urlencoded({ extended: true, limit: '50mb' })` para permitir la subida de fotos de portada, renders, logos y matrices de unidades en base64 sin truncamiento ni rechazos 413.

### 14.2 Base de Datos y Modelado (Supabase PostgreSQL + Prisma ORM)
1. **Modelos Relacionales en `packages/database/prisma/schema.prisma`:**
   - `Developer`: Desarrolladora u organización raíz.
   - `Membership`: Relación usuario-desarrolladora con rol asignado (`SUPERADMIN`, `ADMIN`, `SALES_AGENT`, etc.).
   - `Project`: Desarrollo inmobiliario (`developerId`, `name`, `projectType`, `baseCurrency`, `coverImagePath`, etc.).
   - `Unit`: Unidades/lotes/departamentos pertenecientes a un proyecto (`unitNumber`, `category`, `status`, `basePrice`, `totalAreaM2`, `level`, etc.).
   - `UnitAdditional`: Adicionales (cajones, bodegas, terrazas) ligados a un proyecto y opcionalmente asignados a una unidad.
   - `Sale`, `PaymentPlan`, `ScheduledObligation`, `PaymentReceipt`: Motor financiero y cobranza.
2. **Convenciones de Mapeo de Nombres:**
   - En PostgreSQL / Prisma: `snake_case` en la base de datos mediante `@map("unit_number")` y `camelCase` en TypeScript (`unitNumber`).
   - Inserción masiva eficiente: Utilizar `prisma.unit.createMany({ data: [...], skipDuplicates: true })` y `prisma.unitAdditional.createMany({ data: [...], skipDuplicates: true })`.
3. **Resolución Dinámica de `developerId`:**
   - Al crear proyectos o recursos, resolver el `developerId` a partir de:
     1. El `developerId` UUID provisto en la petición.
     2. El email del usuario autenticado (`userEmail`), buscando sus membresías asociadas.
     3. El nombre de la desarrolladora en sesión.
     4. Si no existe ninguno, crear o asociar a la desarrolladora activa para evitar que los datos queden huérfanos.

### 14.3 Sincronización de Estado en Frontend (`ProjectContext` y Vistas)
1. **Mapper Bidireccional Obligatorio (`mapDbProjectToProjectItem`):**
   - Todo proyecto proveniente de la base de datos debe ser transformado a la interfaz de TypeScript del frontend:
     - `p.units` ➔ `unitsInventory` (con campos normalizados: `unit`, `type`, `price`, `areaM2`, `floor`, `status`, `client`).
     - `p.additionals` ➔ `additionals` (con `category`, `price`, `status`, `assignedToUnit`).
     - `p.coverImagePath` ➔ `image`.
     - `p.logoPath` ➔ `logo`.
     - Cálculo en tiempo real de métricas (`totalUnits`, `soldUnits`, `availableUnits`, `valorComercialTotal`, `valorComercialVendido`, `porVenderMonto`, `avanceVentasPct`).
2. **Persistencia Dual (Memoria + LocalStorage):**
   - Los datos de proyectos (`devio_projects_state`) y planes de pago (`devio_developer_payment_plans`) deben persistirse en `localStorage` y `sessionStorage`.
   - `loadFromStorage()` debe ejecutarse inmediatamente en el montaje del componente para evitar destellos (flickering) o listas vacías mientras concluyen las llamadas a la API.
   - Escuchar y disparar eventos personalizados (`devio_projects_updated`, `devio_payment_plans_updated`, `devio_developer_updated`) para sincronizar pestañas y componentes en caliente.
3. **Validación de Sesión Viva:**
   - En cada carga, el frontend valida el email del usuario contra `/api/auth/validate`. Si el usuario ya no existe en la base de datos (por ejemplo, tras un vaciado o eliminación de tablas), se ejecuta `logout()` inmediatamente y se limpian los tokens.

### 14.4 Notificaciones y Correos Transaccionales (Postmark)
1. **Plantillas Oficiales Postmark:**
   - `bienvenida-user`: Se envía al agregar o invitar colaboradores en el onboarding de desarrolladora o en la sección de Configuración (`/settings`).
   - Parámetros requeridos en el payload del template:
     - `user_name`: Nombre completo del colaborador.
     - `user_email`: Correo electrónico del usuario.
     - `developer_name`: Nombre comercial de la desarrolladora inmobiliaria.
     - `user_role`: Rol en español (e.g., "Director Comercial", "Asesor de Ventas").
     - `temporary_password`: `Devio2026!` (o credencial temporal asignada).
     - `login_url`: `https://devio-web-six.vercel.app/login`.
     - `support_email`: `contacto@devio.mx`.
2. **Tolerancia a Fallos:**
   - El envío de correos transaccionales debe ejecutarse de forma asíncrona dentro de un bloque `try/catch` para que ninguna interrupción externa o falta de API key bloquee la creación de entidades en base de datos.

---


