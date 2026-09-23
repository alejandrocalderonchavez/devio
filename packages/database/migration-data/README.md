# 📦 Bubble Data Migration Directory (`/packages/database/migration-data`)

Coloca en esta carpeta todos los archivos `.json` exportados desde Bubble.

---

### 🗂️ Nombres recomendados para los archivos JSON:

1. **`developers.json`** (Desarrolladoras / Organizaciones)
   * Datos: `name`, `legalName`, `rfc`, `contactEmail`, `phone`, `city`, `logoUrl`, etc.
2. **`users.json`** (Usuarios del equipo / Staff)
   * Datos: `email`, `name`, `role`, `developerId` (o nombre de desarrolladora), etc.
3. **`projects.json`** (Proyectos inmobiliarios)
   * Datos: `name`, `address`, `city`, `developerId`, `logoUrl`, `coverImageUrl`, `amenities`, etc.
4. **`units.json`** (Inventario de unidades / lotes / departamentos)
   * Datos: `unitNumber`, `projectId`, `type`, `floor`, `areaM2`, `price`, `bedrooms`, `bathrooms`, `status`, etc.
5. **`clients.json`** (Clientes / Compradores / Prospectos)
   * Datos: `name`, `email`, `phone`, `rfc`, `address`, `civilStatus`, etc.
6. **`sales.json`** (Ventas / Apartados / Cotizaciones)
   * Datos: `folio`, `unitId`, `clientId`, `advisorId`, `totalAmount`, `downPayment`, `installments`, `status`, `saleDate`, etc.
7. **`payments.json`** (Pagos / Mensualidades / Recibos)
   * Datos: `saleId`, `installmentNumber`, `amount`, `dueDate`, `paymentDate`, `status`, `receiptUrl`, `speiVoucherUrl`, etc.
8. **`documents.json`** (Expedientes de clientes y documentos de unidades)
   * Datos: `clientId`, `unitId`, `documentType`, `fileUrl`, `fileName`, `uploadedAt`, etc.
9. **`postventa.json`** (Tickets de postventa / Garantías)
   * Datos: `unitId`, `clientId`, `title`, `description`, `status`, `priority`, `category`, etc.

---

> 💡 **Nota:** Si tus archivos exportados de Bubble tienen nombres diferentes o vienen agrupados de otra forma, súbelos tal como están y el script de migración se encargará de mapear los campos correspondientes.
