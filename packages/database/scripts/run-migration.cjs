const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
require('dotenv').config({ path: path.resolve(__dirname, '../../../.env') });
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const pg = require('pg');
const crypto = require('crypto');

const connectionString =
  process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/devio?schema=public';

console.log(`Connecting to: ${connectionString.split('@')[1] || connectionString}`);

const pool = new pg.Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const migrationDataDir = path.join(__dirname, '../migration-data');

// Helpers
function sanitizeUrl(url) {
  if (!url || typeof url !== 'string') return null;
  const trimmed = url.trim();
  if (!trimmed || trimmed === '(deleted thing)') return null;
  if (trimmed.startsWith('//')) return 'https:' + trimmed;
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) return trimmed;
  return 'https://' + trimmed;
}

function parseDate(dateStr) {
  if (!dateStr || typeof dateStr !== 'string' || dateStr.includes('(deleted')) return null;
  const d = new Date(dateStr);
  return isNaN(d.getTime()) ? null : d;
}

function parseDecimal(val, defaultVal = 0) {
  if (val === null || val === undefined || val === '') return defaultVal;
  if (typeof val === 'number') return val;
  const cleaned = String(val).replace(/[^0-9.-]/g, '');
  const n = parseFloat(cleaned);
  return isNaN(n) ? defaultVal : n;
}

function parseIntSafe(val, defaultVal = 0) {
  if (val === null || val === undefined || val === '') return defaultVal;
  if (typeof val === 'number') return Math.round(val);
  const cleaned = String(val).replace(/[^0-9-]/g, '');
  const n = parseInt(cleaned, 10);
  return isNaN(n) ? defaultVal : n;
}

function parseList(str) {
  if (!str || typeof str !== 'string') return [];
  return str
    .split(',')
    .map((s) => s.trim())
    .filter((s) => s && s !== '(deleted thing)');
}

function loadJson(filename) {
  const filePath = path.join(migrationDataDir, filename);
  if (!fs.existsSync(filePath)) {
    console.warn(`⚠️ Archivo ${filename} no encontrado.`);
    return [];
  }
  return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
}

async function runMigration() {
  console.log('====================================================');
  console.log('🚀 INICIANDO MIGRACIÓN DE DATOS BUBBLE A DEVIO STAGING');
  console.log('====================================================\n');

  // Lookup maps: Bubble unique id -> PostgreSQL UUID
  const devMap = new Map();
  const userMap = new Map();
  const projectMap = new Map();
  const unitMap = new Map();
  const clientMap = new Map();
  const saleMap = new Map();

  // ---------------------------------------------------------------------------
  // 1. DESARROLLADORAS
  // ---------------------------------------------------------------------------
  console.log('1️⃣ Migrando Desarrolladoras...');
  const rawDevs = loadJson('export_All-Desarrolladoras-modified_2026-09-23_20-16-01.json');
  for (const item of rawDevs) {
    const bubbleId = item['unique id'];
    const name = item['Nombre'] || item['Razon Social'] || 'Desarrolladora Sin Nombre';
    const legalName = item['Razon Social'] || name;
    const logoPath = sanitizeUrl(item['Logo']);
    const phone = item['telefono'] || null;
    const email = item['email'] || (name.toLowerCase().includes('campero') ? 'contacto@desarrolloscampero.com' : null);
    const website = sanitizeUrl(item['Paginaweb']);
    const addressLine1 = item['domicilio'] || null;
    const neighborhood = item['colonia'] || null;
    const postalCode = item['CP'] || null;

    let dev = await prisma.developer.findFirst({
      where: { OR: [{ bubbleId }, { name }] },
    });

    if (dev) {
      dev = await prisma.developer.update({
        where: { id: dev.id },
        data: {
          name,
          legalName,
          logoPath,
          phone,
          email,
          website,
          addressLine1,
          neighborhood,
          postalCode,
          bubbleId,
        },
      });
    } else {
      dev = await prisma.developer.create({
        data: {
          name,
          legalName,
          logoPath,
          phone,
          email,
          website,
          addressLine1,
          neighborhood,
          postalCode,
          bubbleId,
        },
      });
    }

    devMap.set(bubbleId, dev.id);
    console.log(`   ✓ Desarrolladora: "${dev.name}" (ID: ${dev.id})`);
  }
  console.log(`   Total Desarrolladoras migradas: ${devMap.size}\n`);

  let defaultDevId = Array.from(devMap.values())[0];
  if (!defaultDevId) {
    const fallbackDev = await prisma.developer.create({
      data: { name: 'Desarrolladora Principal Devio', bubbleId: 'dev-fallback' },
    });
    defaultDevId = fallbackDev.id;
    devMap.set('dev-fallback', defaultDevId);
  }

  // ---------------------------------------------------------------------------
  // 2. USUARIOS & MEMBRESÍAS
  // ---------------------------------------------------------------------------
  console.log('2️⃣ Migrando Usuarios y Membresías...');
  const rawUsers = loadJson('export_All-Users-modified--_2026-09-23_20-17-51.json');
  let userCount = 0;
  let membershipCount = 0;
  const usedUserPhones = new Set();

  for (const item of rawUsers) {
    const bubbleId = item['unique id'];
    const emailRaw = (item['email'] || '').trim().toLowerCase();
    const email = emailRaw && emailRaw.includes('@') ? emailRaw : `user_${bubbleId}@devio.lat`;
    const fullName = item['Nombre'] || 'Usuario Devio';
    const rawPhone = (item['telefono'] || '').trim() || null;
    let phone = null;
    if (rawPhone && !usedUserPhones.has(rawPhone)) {
      usedUserPhones.add(rawPhone);
      phone = rawPhone;
    }
    const avatarUrl = sanitizeUrl(item['foto de perfil']);
    const roleStr = (item['role'] || '').trim();

    let user = await prisma.user.findFirst({
      where: { OR: [{ bubbleId }, { email }] },
    });

    if (user) {
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          email,
          fullName,
          avatarUrl: avatarUrl || user.avatarUrl,
          phone: phone || user.phone,
          bubbleId,
        },
      });
    } else {
      user = await prisma.user.create({
        data: {
          authUserId: crypto.randomUUID(),
          email,
          phone,
          fullName,
          avatarUrl,
          bubbleId,
        },
      });
    }

    userMap.set(bubbleId, user.id);
    userCount++;

    // Assign membership
    const devBubbleId = item['desarolladora'];
    const targetDevId = devMap.get(devBubbleId) || defaultDevId;

    let roleEnum = 'CLIENT';
    if (roleStr === 'Super Admin') roleEnum = 'SUPER_ADMIN';
    else if (roleStr === 'Administrador') roleEnum = 'ADMIN';
    else if (roleStr === 'Comercial') roleEnum = 'COMMERCIAL';
    else if (roleStr === 'Construcción' || roleStr === 'Construccion') roleEnum = 'CONSTRUCTION';

    try {
      await prisma.membership.upsert({
        where: {
          userId_developerId: {
            userId: user.id,
            developerId: targetDevId,
          },
        },
        update: { role: roleEnum },
        create: {
          userId: user.id,
          developerId: targetDevId,
          role: roleEnum,
        },
      });
      membershipCount++;
    } catch (e) {}

    // Create Client profile
    if (roleEnum === 'CLIENT' || roleStr === 'Cliente' || item['RFC']) {
      let client = await prisma.client.findFirst({
        where: { bubbleId },
      });

      if (client) {
        client = await prisma.client.update({
          where: { id: client.id },
          data: {
            fullName,
            email: email.includes('@devio.lat') ? null : email,
            phone: rawPhone,
            taxId: item['RFC'] || null,
            developerId: targetDevId,
            userId: user.id,
          },
        });
      } else {
        client = await prisma.client.create({
          data: {
            fullName,
            email: email.includes('@devio.lat') ? null : email,
            phone: rawPhone,
            taxId: item['RFC'] || null,
            developerId: targetDevId,
            userId: user.id,
            bubbleId,
          },
        });
      }
      clientMap.set(bubbleId, client.id);
    }
  }
  console.log(`   Total Usuarios migrados: ${userCount} | Membresías: ${membershipCount} | Clientes iniciales: ${clientMap.size}\n`);

  // ---------------------------------------------------------------------------
  // 3. PROYECTOS
  // ---------------------------------------------------------------------------
  console.log('3️⃣ Migrando Proyectos...');
  const rawProjects = loadJson('export_All-Projects-modified--_2026-09-23_20-17-08.json');
  for (const item of rawProjects) {
    const bubbleId = item['unique id'];
    const name = item['name'] || 'Proyecto Sin Nombre';
    const description = item['description'] || null;
    const coverImagePath = sanitizeUrl(item['imagen'] || item['logo']);
    const galleryPaths = parseList(item['fotos']).map(sanitizeUrl).filter(Boolean);
    const addressLine1 = item['location'] || null;
    const devBubbleId = item['desarrolladora'];
    const developerId = devMap.get(devBubbleId) || defaultDevId;

    let project = await prisma.project.findFirst({
      where: { bubbleId },
    });

    if (project) {
      project = await prisma.project.update({
        where: { id: project.id },
        data: {
          name,
          description,
          coverImagePath,
          galleryPaths,
          addressLine1,
          developerId,
          status: 'ACTIVE',
        },
      });
    } else {
      project = await prisma.project.create({
        data: {
          name,
          description,
          coverImagePath,
          galleryPaths,
          addressLine1,
          developerId,
          status: 'ACTIVE',
          bubbleId,
        },
      });
    }

    projectMap.set(bubbleId, project.id);
    console.log(`   ✓ Proyecto: "${project.name}" (ID: ${project.id})`);
  }
  console.log(`   Total Proyectos migrados: ${projectMap.size}\n`);

  const defaultProjectId = Array.from(projectMap.values())[0];

  // ---------------------------------------------------------------------------
  // 4. UNIDADES (INVENTARIO)
  // ---------------------------------------------------------------------------
  console.log('4️⃣ Migrando Unidades / Inventario...');
  const rawUnits = loadJson('export_All-Units-modified--_2026-09-23_20-17-43.json');
  let unitCount = 0;

  for (const item of rawUnits) {
    const bubbleId = item['unique id'];
    const unitNumber = String(item['# Unidad'] || item['Numero'] || bubbleId.substring(0, 8));
    const projectBubbleId = item['project'];
    const projectId = projectMap.get(projectBubbleId) || defaultProjectId;

    if (!projectId) continue;

    const rawEstado = (item['Estado'] || item['status'] || '').trim().toLowerCase();
    let status = 'AVAILABLE';
    if (rawEstado.includes('vendida') || rawEstado.includes('sold')) status = 'SOLD';
    else if (rawEstado.includes('apartada') || rawEstado.includes('reserv')) status = 'RESERVED';
    else if (rawEstado.includes('bloqueada') || rawEstado.includes('block')) status = 'BLOCKED';

    const rawTipo = (item['Tipo'] || item['type'] || '').trim().toLowerCase();
    let category = 'APARTMENT';
    if (rawTipo.includes('casa') || rawTipo.includes('house')) category = 'HOUSE';
    else if (rawTipo.includes('comercial') || rawTipo.includes('local')) category = 'COMMERCIAL_SPACE';
    else if (rawTipo.includes('terreno') || rawTipo.includes('lote')) category = 'LAND_LOT';
    else if (rawTipo.includes('bodega') || rawTipo.includes('industrial')) category = 'INDUSTRIAL_WAREHOUSE';

    const level = parseIntSafe(item['Piso / Nivel.']) || null;
    const totalAreaM2 = parseDecimal(item['Superficie (m²)'] || item['Área total de construcción.']) || 65.0;
    const bedrooms = parseIntSafe(item['Número de recámaras.']) || null;
    const bathrooms = parseDecimal(item['Número de baños.']) || null;
    const parkingSpaces = parseIntSafe(item['Cajones de estacionamiento.']) || 0;
    const basePrice = parseDecimal(item['Precio'], 0.0);
    const renderUrls = item['image'] ? [sanitizeUrl(item['image'])].filter(Boolean) : [];

    let unit = await prisma.unit.findFirst({
      where: {
        OR: [
          { bubbleId },
          { projectId, unitNumber },
        ],
      },
    });

    if (unit) {
      unit = await prisma.unit.update({
        where: { id: unit.id },
        data: {
          unitNumber,
          category,
          status,
          level,
          totalAreaM2,
          bedrooms,
          bathrooms,
          parkingSpaces,
          basePrice,
          renderUrls,
          projectId,
          bubbleId,
        },
      });
    } else {
      unit = await prisma.unit.create({
        data: {
          unitNumber,
          category,
          status,
          level,
          totalAreaM2,
          bedrooms,
          bathrooms,
          parkingSpaces,
          basePrice,
          renderUrls,
          projectId,
          bubbleId,
        },
      });
    }

    unitMap.set(bubbleId, unit.id);
    unitCount++;
  }
  console.log(`   Total Unidades migradas: ${unitCount}\n`);

  // ---------------------------------------------------------------------------
  // 5. ADICIONALES (BODEGAS, CAJONES)
  // ---------------------------------------------------------------------------
  console.log('5️⃣ Migrando Adicionales (Cajones & Bodegas)...');
  const rawAddons = loadJson('export_All-AddOns-modified--_2026-09-23_20-15-21.json');
  let addonCount = 0;

  for (const item of rawAddons) {
    const bubbleId = item['unique id'];
    const name = item['Name'] || item['Nombre'] || 'Adicional';
    const projectBubbleId = item['project'];
    const projectId = projectMap.get(projectBubbleId) || defaultProjectId;
    const unitBubbleId = item['unit'];
    const unitId = unitMap.get(unitBubbleId) || null;
    const price = parseDecimal(item['Price'] || item['Precio'] || item['monto']) || 0;
    const rawTipo = (item['Tipo'] || item['type'] || '').toLowerCase();
    const type = rawTipo.includes('bodega') || rawTipo.includes('storage') ? 'STORAGE' : 'PARKING';

    if (!projectId) continue;

    let addon = await prisma.unitAdditional.findFirst({ where: { bubbleId } });
    if (addon) {
      await prisma.unitAdditional.update({
        where: { id: addon.id },
        data: { name, type, price, unitId, projectId },
      });
    } else {
      await prisma.unitAdditional.create({
        data: { name, type, price, unitId, projectId, bubbleId },
      });
    }
    addonCount++;
  }
  console.log(`   Total Adicionales migrados: ${addonCount}\n`);

  // ---------------------------------------------------------------------------
  // 6. VENTAS (FORMALIZACIONES & COTIZACIONES)
  // ---------------------------------------------------------------------------
  console.log('6️⃣ Migrando Ventas y Contratos...');
  const rawSales = loadJson('export_All-sales-modified_2026-09-23_20-17-21.json');
  let saleCount = 0;

  for (const item of rawSales) {
    const bubbleId = item['unique id'];
    const projectBubbleId = item['project'];
    const unitBubbleId = item['unidad'];
    const clientBubbleId = item['client'] || item['Clients'];
    const visible = (item['visible'] || '').trim().toLowerCase();

    // Skip non-visible sales (unfinished drafts / cancelled quotes)
    if (visible !== 'si') continue;
    if (!projectBubbleId || projectBubbleId === '(deleted thing)') continue;
    if (!unitBubbleId || unitBubbleId === '(deleted thing)') continue;

    const projectId = projectMap.get(projectBubbleId) || defaultProjectId;
    const unitId = unitMap.get(unitBubbleId);

    if (!projectId || !unitId) continue;

    // Verify unit is actually SOLD or RESERVED
    const targetUnit = await prisma.unit.findUnique({ where: { id: unitId } });
    if (targetUnit && targetUnit.status !== 'SOLD' && targetUnit.status !== 'RESERVED') {
      continue;
    }

    let primaryClientId = clientMap.get(clientBubbleId);
    if (!primaryClientId) {
      const clientName = item['Nombre'] || 'Cliente Comprador';
      const clientEmail = (item['Correo'] || '').trim().toLowerCase() || null;
      const clientPhone = item['Teléfono'] || null;
      const devBubbleId = item['desarrolladora'];
      const targetDevId = devMap.get(devBubbleId) || defaultDevId;

      const newClient = await prisma.client.create({
        data: {
          fullName: clientName,
          email: clientEmail,
          phone: clientPhone,
          developerId: targetDevId,
          bubbleId: clientBubbleId || `client-sale-${bubbleId}`,
        },
      });
      primaryClientId = newClient.id;
      if (clientBubbleId) clientMap.set(clientBubbleId, primaryClientId);
    }

    const agreedPrice = parseDecimal(item['operation_total'] || item['unit_amount'] || item['Monto total incial']) || 2000000;
    const finalPrice = agreedPrice;
    const rawStatus = (item['Status'] || '').trim().toLowerCase();
    let status = 'ACTIVE';
    if (rawStatus.includes('apart')) status = 'RESERVED';
    else if (rawStatus.includes('cancel')) status = 'CANCELLED';
    else if (rawStatus.includes('liquid')) status = 'LIQUIDATED';

    let sale = await prisma.sale.findFirst({ where: { bubbleId } });
    if (sale) {
      sale = await prisma.sale.update({
        where: { id: sale.id },
        data: { agreedPrice, finalPrice, status, projectId, unitId, primaryClientId },
      });
    } else {
      sale = await prisma.sale.create({
        data: { agreedPrice, finalPrice, status, projectId, unitId, primaryClientId, bubbleId },
      });
    }

    saleMap.set(bubbleId, sale.id);
    saleCount++;
  }
  console.log(`   Total Ventas migradas: ${saleCount}\n`);

  // ---------------------------------------------------------------------------
  // 7. CUOTAS PROGRAMADAS (SCHEDULED OBLIGATIONS)
  // ---------------------------------------------------------------------------
  console.log('7️⃣ Migrando Cuotas Programadas y Mensualidades...');
  const rawPayments = loadJson('export_All-Payments-modified--_2026-09-23_20-16-49.json');
  let obligationCount = 0;
  const saleObligationCounters = new Map(); // saleId -> number
  const scheduledNotifsToGenerate = [];

  for (const item of rawPayments) {
    const bubbleId = item['unique id'];
    const activo = (item['activo'] || '').trim().toLowerCase();
    const cotizacionyes = (item['cotizacionyes'] || '').trim().toLowerCase();

    // Skip inactive payments or quote simulations
    if (activo !== 'si' || cotizacionyes === 'si') continue;

    const saleBubbleId = item['sale'];
    let targetSaleId = saleMap.get(saleBubbleId);

    if (!targetSaleId) {
      const unitBubbleId = item['Unidad'];
      const unitId = unitMap.get(unitBubbleId);
      if (unitId) {
        const foundSale = await prisma.sale.findFirst({ where: { unitId } });
        if (foundSale) targetSaleId = foundSale.id;
      }
    }

    if (!targetSaleId) {
      const unitBubbleId = item['Unidad'];
      const projectBubbleId = item['Project'];
      const unitId = unitMap.get(unitBubbleId);
      const projectId = projectMap.get(projectBubbleId) || defaultProjectId;

      if (unitId && projectId) {
        const fallbackClient = Array.from(clientMap.values())[0];
        if (fallbackClient) {
          const syntheticSale = await prisma.sale.create({
            data: {
              projectId,
              unitId,
              primaryClientId: fallbackClient,
              agreedPrice: parseDecimal(item['Monto programado']) * 10 || 1000000,
              finalPrice: parseDecimal(item['Monto programado']) * 10 || 1000000,
              status: 'ACTIVE',
              bubbleId: `sale-payment-${bubbleId}`,
            },
          });
          targetSaleId = syntheticSale.id;
          saleMap.set(`sale-payment-${bubbleId}`, targetSaleId);
        }
      }
    }

    if (!targetSaleId) continue;

    const currentCount = (saleObligationCounters.get(targetSaleId) || 0) + 1;
    saleObligationCounters.set(targetSaleId, currentCount);

    const conceptoRaw = (item['Concepto'] || '').trim();
    const concepto = conceptoRaw.toLowerCase();
    let obligationType = 'INSTALLMENT';
    if (concepto.includes('enganche') || concepto.includes('down')) obligationType = 'DOWN_PAYMENT';
    else if (concepto.includes('apartado') || concepto.includes('reserv')) obligationType = 'RESERVATION';
    else if (concepto.includes('liquidacion') || concepto.includes('fin')) obligationType = 'SETTLEMENT';

    const title = conceptoRaw || `Mensualidad #${currentCount}`;
    const amount = parseDecimal(item['Monto programado'] || item['restante']) || 10000;
    const dueDate = parseDate(item['Fecha programada']) || new Date();
    const rawStatus = (item['status'] || '').toLowerCase();
    let status = 'PENDING';
    if (rawStatus.includes('pagad') || rawStatus.includes('paid')) status = 'PAID';
    else if (dueDate < new Date() && status === 'PENDING') status = 'OVERDUE';

    const paidAmount = status === 'PAID' ? amount : 0;
    const pendingAmount = status === 'PAID' ? 0 : amount;

    let obligation = await prisma.scheduledObligation.findFirst({ where: { bubbleId } });
    if (obligation) {
      await prisma.scheduledObligation.update({
        where: { id: obligation.id },
        data: {
          obligationNumber: currentCount,
          title,
          type: obligationType,
          originalAmount: amount,
          pendingAmount,
          paidAmount,
          dueDate,
          status,
          saleId: targetSaleId,
        },
      });
    } else {
      await prisma.scheduledObligation.create({
        data: {
          obligationNumber: currentCount,
          title,
          type: obligationType,
          originalAmount: amount,
          pendingAmount,
          paidAmount,
          dueDate,
          status,
          saleId: targetSaleId,
          bubbleId,
        },
      });
    }

    obligationCount++;

    // Automated Scheduled Notification for future payments (from today forward in CDMX timezone)
    const todayCdmx = new Date('2026-09-23T00:00:00-06:00');
    if (dueDate >= todayCdmx && status !== 'PAID') {
      const clientEmail = item['mail_cliente'] || 'comprador@ejemplo.com';
      let notifDate = new Date(dueDate.getTime() - 5 * 24 * 60 * 60 * 1000);
      if (notifDate < todayCdmx) {
        notifDate = new Date('2026-09-24T09:00:00-06:00');
      }
      const y = notifDate.getFullYear();
      const m = String(notifDate.getMonth() + 1).padStart(2, '0');
      const d = String(notifDate.getDate()).padStart(2, '0');
      const iso = `${y}-${m}-${d}T09:00:00-06:00`;
      const formattedDate = notifDate.toLocaleDateString('es-MX', {
        timeZone: 'America/Mexico_City',
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });

      const diffMs = notifDate.getTime() - todayCdmx.getTime();
      const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
      let relTime = 'Próximo vencimiento';
      if (diffDays <= 0) relTime = 'Hoy, 09:00 a.m.';
      else if (diffDays === 1) relTime = 'Mañana, 09:00 a.m.';
      else if (diffDays <= 30) relTime = `En ${diffDays} días`;
      else {
        const diffMonths = Math.round(diffDays / 30);
        relTime = `En ${diffMonths} meses`;
      }

      const channels = [
        { chan: 'WHATSAPP', contact: '+52 33 2256 7499' },
        { chan: 'POSTMARK', contact: clientEmail },
        { chan: 'PUSH', contact: 'App Devio / Web Push' },
      ];

      channels.forEach((ch) => {
        scheduledNotifsToGenerate.push({
          id: `sch-bubble-${bubbleId}-${ch.chan.toLowerCase()}`,
          triggerKey: 'payments.upcoming_reminder',
          triggerName: 'Recordatorio Preventivo de Mensualidad',
          category: 'COBRANZA',
          channel: ch.chan,
          scheduledFor: iso,
          scheduledForFormatted: formattedDate,
          relativeTime: relTime,
          recipientName: 'Comprador Titular',
          recipientContact: ch.contact,
          recipientRole: 'Comprador / Titular',
          developerName: 'Desarrolladora Devio',
          projectName: 'Proyecto Residencial',
          unitName: 'Unidad',
          sourceEvent: `Cuota ${title} #CUOTA-${bubbleId.slice(-4)}`,
          status: 'PROGRAMADA',
          payloadSummary: `${title} por $${amount.toLocaleString('es-MX')} MXN (Vence ${dueDate.toLocaleDateString('es-MX', { timeZone: 'America/Mexico_City' })})`,
          metadata: {
            monto: `$${amount.toLocaleString('es-MX')} MXN`,
            fecha_vencimiento: dueDate.toLocaleDateString('es-MX', { timeZone: 'America/Mexico_City' }),
          },
        });
      });
    }
  }
  console.log(`   Total Cuotas Programadas migradas: ${obligationCount}`);
  console.log(`   Notificaciones automáticas generadas a partir de pagos: ${scheduledNotifsToGenerate.length}\n`);

  // ---------------------------------------------------------------------------
  // 8. PAGOS REALES & COMPROBANTES (PAYMENT RECEIPTS)
  // ---------------------------------------------------------------------------
  console.log('8️⃣ Migrando Recibos de Pago y Comprobantes SPEI...');
  const rawReceipts = loadJson('export_All-Pagos-modified--_2026-09-23_20-16-27.json');
  let receiptCount = 0;

  for (const item of rawReceipts) {
    const bubbleId = item['unique id'];
    const clientBubbleId = item['Cliente'];
    const clientId = clientMap.get(clientBubbleId) || Array.from(clientMap.values())[0];
    const unitBubbleId = item['Unidad'];
    const unitId = unitMap.get(unitBubbleId);

    let targetSaleId = null;
    if (unitId) {
      const foundSale = await prisma.sale.findFirst({ where: { unitId } });
      if (foundSale) targetSaleId = foundSale.id;
    }
    if (!targetSaleId) {
      targetSaleId = Array.from(saleMap.values())[0];
    }

    if (!clientId || !targetSaleId) continue;

    const amount = parseDecimal(item['Monto']) || 50000;
    const paymentDate = parseDate(item['Fecha pago']) || new Date();
    const receiptUrl = sanitizeUrl(item['Comprobante']);
    const speiVoucherUrl = sanitizeUrl(item['comprobante t']);
    const receiptFolio = `REC-${String(receiptCount + 1).padStart(5, '0')}-${bubbleId.slice(-8)}`;

    let receipt = await prisma.paymentReceipt.findFirst({ where: { bubbleId } });
    if (receipt) {
      await prisma.paymentReceipt.update({
        where: { id: receipt.id },
        data: {
          receiptFolio,
          amount,
          equivalentAmountInSaleCurrency: amount,
          paymentDate,
          notes: receiptUrl ? `Recibo: ${receiptUrl} | SPEI: ${speiVoucherUrl || 'N/A'}` : null,
          payerClientId: clientId,
          saleId: targetSaleId,
        },
      });
    } else {
      await prisma.paymentReceipt.create({
        data: {
          receiptFolio,
          amount,
          equivalentAmountInSaleCurrency: amount,
          paymentDate,
          notes: receiptUrl ? `Recibo: ${receiptUrl} | SPEI: ${speiVoucherUrl || 'N/A'}` : null,
          payerClientId: clientId,
          saleId: targetSaleId,
          bubbleId,
        },
      });
    }

    receiptCount++;
  }
  console.log(`   Total Recibos de Pago migrados: ${receiptCount}\n`);

  // ---------------------------------------------------------------------------
  // 9. AVANCES DE OBRA
  // ---------------------------------------------------------------------------
  console.log('9️⃣ Migrando Avances de Obra...');
  const rawProgress = loadJson('export_All-Progresses-modified_2026-09-23_20-16-58.json');
  let progressCount = 0;

  for (const item of rawProgress) {
    const bubbleId = item['unique id'];
    const projectBubbleId = item['proyecto'];
    const projectId = projectMap.get(projectBubbleId) || defaultProjectId;

    if (!projectId) continue;

    const overallPercentage = parseDecimal(item['Avance Obra General%']) || 0;
    const title = item['titulo'] || 'Avance Mensual';
    const description = item['descripcion del avance'] || '';
    const progressDate = parseDate(item['fecha']) || new Date();
    const documentUrl = sanitizeUrl(item['documento']);
    const photos = parseList(item['fotos']).map(sanitizeUrl).filter(Boolean);
    const mediaUrls = documentUrl ? [documentUrl, ...photos] : photos;

    let progress = await prisma.constructionProgress.findFirst({ where: { bubbleId } });
    if (progress) {
      await prisma.constructionProgress.update({
        where: { id: progress.id },
        data: { overallPercentage, title, description, progressDate, mediaUrls, projectId },
      });
    } else {
      await prisma.constructionProgress.create({
        data: { overallPercentage, title, description, progressDate, mediaUrls, projectId, bubbleId },
      });
    }

    progressCount++;
  }
  console.log(`   Total Avances de Obra migrados: ${progressCount}\n`);

  // ---------------------------------------------------------------------------
  // 10. DOCUMENTOS & BÓVEDA
  // ---------------------------------------------------------------------------
  console.log('🔟 Migrando Documentos y Bóveda...');
  const rawDocs = loadJson('export_All-Documents-modified_2026-09-23_20-16-12.json');
  let docCount = 0;

  for (const item of rawDocs) {
    const bubbleId = item['unique id'];
    const title = item['name'] || 'Documento';
    const storagePath = sanitizeUrl(item['file']);
    const projectBubbleId = item['project'];
    const projectId = projectMap.get(projectBubbleId) || defaultProjectId;
    const targetDevId = defaultDevId;

    if (!storagePath) continue;

    let doc = await prisma.document.findFirst({ where: { bubbleId } });
    if (doc) {
      await prisma.document.update({
        where: { id: doc.id },
        data: { title, storagePath, projectId, developerId: targetDevId },
      });
    } else {
      await prisma.document.create({
        data: { title, storagePath, projectId, developerId: targetDevId, bubbleId },
      });
    }

    docCount++;
  }
  console.log(`   Total Documentos migrados: ${docCount}\n`);

  // ---------------------------------------------------------------------------
  // 11. EXPORTAR NOTIFICACIONES PROGRAMADAS PARA LA UI DE SUPER ADMIN
  // ---------------------------------------------------------------------------
  console.log('1️⃣1️⃣ Exportando Cola de Notificaciones Programadas sincronizadas...');
  const scheduledExportDir = path.resolve(__dirname, '../../../apps/web/data');
  if (!fs.existsSync(scheduledExportDir)) {
    fs.mkdirSync(scheduledExportDir, { recursive: true });
  }
  const scheduledExportPath = path.join(scheduledExportDir, 'migrated-scheduled-notifications.json');
  fs.writeFileSync(scheduledExportPath, JSON.stringify(scheduledNotifsToGenerate, null, 2));
  console.log(`   ✓ ${scheduledNotifsToGenerate.length} notificaciones calendarizadas exportadas a ${scheduledExportPath}\n`);

  console.log('====================================================');
  console.log('🎉 ¡MIGRACIÓN BUBBLE ➔ DEVIO STAGING COMPLETADA CON ÉXITO!');
  console.log('====================================================');

  await prisma.$disconnect();
  await pool.end();
}

runMigration().catch((err) => {
  console.error('\n❌ ERROR DURANTE LA MIGRACIÓN:', err);
  process.exit(1);
});
