const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
require('dotenv').config({ path: path.resolve(__dirname, '../../../.env') });
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const pg = require('pg');

const connectionString =
  process.env.DATABASE_URL || 'postgresql://postgres.mildwxjlopmvdbupuzpa:Acalderon1%3Fdevio@aws-0-us-east-1.pooler.supabase.com:5432/postgres';

const pool = new pg.Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function generateRichJson() {
  console.log('🔄 Extrayendo datos enriquecidos desde Supabase...');

  const developers = await prisma.developer.findMany({
    include: {
      memberships: {
        include: {
          user: true,
        },
      },
      projects: {
        include: {
          units: true,
          sales: {
            include: {
              primaryClient: true,
              scheduledObligations: true,
              paymentReceipts: true,
            },
          },
          constructionProgress: true,
          documents: true,
        },
      },
    },
  });

  const rawProjectsPath = path.resolve(__dirname, '../migration-data/export_All-Projects-modified--_2026-09-23_20-17-08.json');
  let rawProjects = [];
  if (fs.existsSync(rawProjectsPath)) {
    try {
      rawProjects = JSON.parse(fs.readFileSync(rawProjectsPath, 'utf8'));
    } catch (e) {}
  }

  const rawDevsPath = path.resolve(__dirname, '../migration-data/export_All-Desarrolladoras-modified_2026-09-23_20-16-01.json');
  let rawDevs = [];
  if (fs.existsSync(rawDevsPath)) {
    try {
      rawDevs = JSON.parse(fs.readFileSync(rawDevsPath, 'utf8'));
    } catch (e) {}
  }

  const rawPlansPath = path.resolve(__dirname, '../migration-data/export_All-PaymentPlans-modified_2026-09-23_20-16-38.json');
  let rawPlans = [];
  if (fs.existsSync(rawPlansPath)) {
    try {
      rawPlans = JSON.parse(fs.readFileSync(rawPlansPath, 'utf8'));
    } catch (e) {}
  }

  const rawUsersPath = path.resolve(__dirname, '../migration-data/export_All-Users-modified--_2026-09-23_20-17-51.json');
  let rawUsers = [];
  if (fs.existsSync(rawUsersPath)) {
    try {
      rawUsers = JSON.parse(fs.readFileSync(rawUsersPath, 'utf8'));
    } catch (e) {}
  }

  const mapBubblePermissions = (rawPermsStr, role) => {
    if (role === 'Super Admin' || !rawPermsStr) {
      return ['all'];
    }
    const parts = rawPermsStr.split(',').map((s) => s.trim().toLowerCase());
    const mapped = new Set();

    parts.forEach((p) => {
      if (p.includes('dashboard general') || p.includes('dashboard proyecto')) {
        mapped.add('dashboard.view_general');
        mapped.add('dashboard.view_financials');
      }
      if (p.includes('crear proyecto')) mapped.add('projects.create');
      if (p.includes('editar proyecto')) mapped.add('projects.edit');

      if (p.includes('ver inventario') || p.includes('ver lista y detalle')) {
        mapped.add('units.view');
        mapped.add('clients.view');
      }
      if (p.includes('editar unidades') || p.includes('editar inventario')) {
        mapped.add('units.edit_specs');
        mapped.add('units.change_price');
      }
      if (p.includes('exportar unidades')) mapped.add('units.export');
      if (p.includes('crear cotización') || p.includes('cotizacion')) {
        mapped.add('units.quote');
        mapped.add('quotes.view');
        mapped.add('quotes.create');
        mapped.add('quotes.edit');
        mapped.add('quotes.export');
      }
      if (p.includes('ver ventas')) mapped.add('sales.view');
      if (p.includes('registrar venta')) {
        mapped.add('sales.view');
        mapped.add('sales.create');
      }
      if (p.includes('exportar ventas')) mapped.add('sales.export');

      if (p.includes('ver pagos') || p.includes('ver recibo') || p.includes('ver comprobante')) {
        mapped.add('payments.view');
      }
      if (p.includes('registrar pagos')) {
        mapped.add('payments.view');
        mapped.add('payments.register');
      }
      if (p.includes('eliminar pagos')) mapped.add('payments.delete');
      if (p.includes('exportar pagos')) mapped.add('payments.export');

      if (p.includes('ver datos clientes') || p.includes('ver propietario')) {
        mapped.add('clients.view');
      }
      if (p.includes('exportar clientes')) {
        mapped.add('clients.export_statement');
      }
      if (p.includes('subir documentos') || p.includes('añadir documentos')) {
        mapped.add('documents.upload');
        mapped.add('clients.upload_docs');
      }
      if (p.includes('ver documentos')) {
        mapped.add('documents.view');
      }
      if (p.includes('eliminar documentos')) {
        mapped.add('documents.delete');
        mapped.add('clients.delete_docs');
      }
      if (p.includes('registrar avances')) {
        mapped.add('obra.view');
        mapped.add('obra.register_progress');
      }
    });

    return Array.from(mapped);
  };

  const mapRole = (bubbleRole) => {
    if (!bubbleRole) return 'Asesor de Ventas';
    const lower = bubbleRole.toLowerCase().trim();
    if (lower.includes('super admin')) return 'Super Admin';
    if (lower.includes('admin')) return 'Director Comercial';
    if (lower.includes('comercial')) return 'Asesor de Ventas';
    if (lower.includes('asesor') || lower.includes('ventas')) return 'Asesor de Ventas';
    if (lower.includes('finanzas') || lower.includes('cobranza')) return 'Finanzas / Cobranza';
    if (lower.includes('obra')) return 'Residente de Obra';
    if (lower.includes('postventa')) return 'Coordinador de Postventa';
    if (lower.includes('legal')) return 'Legal / Notaría';
    return 'Asesor de Ventas';
  };

  const sanitizeUrl = (url) => {
    if (!url || typeof url !== 'string') return undefined;
    const trimmed = url.trim();
    if (!trimmed) return undefined;
    if (trimmed.startsWith('//')) return `https:${trimmed}`;
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) return trimmed;
    return `https://${trimmed}`;
  };

  const formattedDevs = developers.map((dev) => {
    // Filter out dummy/empty projects
    const validProjects = dev.projects.filter(
      (p) => p.name && p.name !== 'Proyecto Sin Nombre' && p.name !== 'k'
    );

    const formattedProjects = validProjects.map((p) => {
      const bubbleProj = rawProjects.find((rp) => rp['unique id'] === p.bubbleId || (rp.name && rp.name.trim().toLowerCase() === p.name.trim().toLowerCase()));
      const projLogo = sanitizeUrl(bubbleProj?.logo) || p.coverImagePath || 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1200&q=80';

      // Calculate unit stats
      const totalUnits = p.units.length;
      const soldUnits = p.units.filter((u) => u.status === 'SOLD').length;
      const availableUnits = p.units.filter((u) => u.status === 'AVAILABLE').length;
      const blockedUnits = p.units.filter((u) => u.status === 'BLOCKED' || u.status === 'RESERVED').length;

      // Build units inventory
      const unitsInventory = p.units.map((u) => {
        const uStatus =
          u.status === 'SOLD' ? 'VENDIDA' : u.status === 'AVAILABLE' ? 'DISPONIBLE' : 'BLOQUEADA';

        // ONLY Sold units can have an active matching sale and client
        const matchingSale = uStatus === 'VENDIDA'
          ? p.sales.find((s) => s.unitId === u.id && s.status === 'ACTIVE')
          : null;

        const clientName = matchingSale && matchingSale.primaryClient
          ? (matchingSale.primaryClient.fullName || matchingSale.primaryClient.firstName || 'Cliente Propietario')
          : '-';

        const clientEmail = matchingSale && matchingSale.primaryClient?.email ? matchingSale.primaryClient.email : '-';
        const clientPhone = matchingSale && matchingSale.primaryClient?.phone ? matchingSale.primaryClient.phone : '-';

        return {
          id: u.id,
          unit: u.unitNumber,
          type: u.category === 'HOUSE' ? 'Casa' : u.category === 'COMMERCIAL_SPACE' ? 'Comercial' : 'Departamento',
          price: Number(u.basePrice) || 0,
          areaM2: Number(u.totalAreaM2) || 65,
          floor: u.level !== null ? String(u.level) : '1',
          status: uStatus,
          client: clientName,
          clientEmail,
          clientPhone,
          bedrooms: u.bedrooms || 1,
          bathrooms: Number(u.bathrooms) || 1,
          parkingSpots: u.parkingSpaces || 0,
          saleFolio: matchingSale?.saleFolio || undefined,
          salePaidAmount: matchingSale ? Number(matchingSale.paidAmount) : 0,
          salePendingAmount: matchingSale ? Math.max(0, Number(matchingSale.totalPrice) - Number(matchingSale.paidAmount)) : 0,
        };
      });

      // Build sales list - only active sales for actually sold units
      const activeSales = p.sales.filter((s) => {
        if (s.status !== 'ACTIVE') return false;
        const u = p.units.find((unit) => unit.id === s.unitId);
        return u && u.status === 'SOLD';
      });

      const salesList = activeSales.map((s) => {
        const u = p.units.find((unit) => unit.id === s.unitId);
        const clientName = s.primaryClient?.fullName || s.primaryClient?.firstName || 'Cliente';
        const clientEmail = s.primaryClient?.email || '-';
        const clientPhone = s.primaryClient?.phone || '-';
        const clientRfc = s.primaryClient?.taxId || '-';

        const sortedObligations = [...(s.scheduledObligations || [])].sort((a, b) => {
          const dateA = a.dueDate ? new Date(a.dueDate).getTime() : 0;
          const dateB = b.dueDate ? new Date(b.dueDate).getTime() : 0;
          if (dateA !== dateB) return dateA - dateB;
          return (a.obligationNumber || 0) - (b.obligationNumber || 0);
        });

        const sortedReceipts = [...(s.paymentReceipts || [])].sort((a, b) => {
          const dateA = a.paymentDate ? new Date(a.paymentDate).getTime() : 0;
          const dateB = b.paymentDate ? new Date(b.paymentDate).getTime() : 0;
          return dateA - dateB;
        });

        const receipts = sortedReceipts.map((r) => {
          const rAmount = Number(r.amount) || 0;
          const rDate = r.paymentDate ? r.paymentDate.toISOString().split('T')[0] : '2026-09-01';
          const rFolio = r.receiptFolio || `REC-${r.id.slice(-6)}`;
          const rVoucher = r.notes?.includes('Recibo: ') ? r.notes.split('Recibo: ')[1]?.split(' ')[0] : undefined;

          return {
            id: r.id,
            amount: rAmount,
            monto: rAmount,
            paymentDate: rDate,
            fechaPago: rDate,
            metodoPago: 'Transferencia SPEI',
            paymentMethod: 'Transferencia SPEI',
            unit: u?.unitNumber || 'N/A',
            reciboFolio: rFolio,
            receiptFolio: rFolio,
            comprobanteUrl: rVoucher,
            voucherName: 'Comprobante_Pago.pdf',
            moratoryAmount: 0,
          };
        });

        const totalScheduled = sortedObligations.reduce((acc, o) => acc + (Number(o.originalAmount) || 0), 0);
        const totalPaidFromReceipts = receipts.reduce((acc, r) => acc + r.monto, 0);

        const finalTotal = Number(s.totalPrice) > 0 ? Number(s.totalPrice) : (totalScheduled > 0 ? totalScheduled : (Number(u?.basePrice) || 0));
        const finalPaid = totalPaidFromReceipts > 0 ? totalPaidFromReceipts : (Number(s.paidAmount) || 0);
        const finalPending = Math.max(0, finalTotal - finalPaid);

        const now = new Date();
        now.setHours(0, 0, 0, 0);

        let remainingPaid = finalPaid;

        const scheduled = sortedObligations.map((o, idx) => {
          const sAmount = Number(o.originalAmount) || Number(o.scheduledAmount) || 0;
          const sDate = o.dueDate ? o.dueDate.toISOString().split('T')[0] : '2026-10-01';
          const oDate = o.dueDate ? new Date(o.dueDate) : null;
          if (oDate) oDate.setHours(0, 0, 0, 0);

          let pAmount = 0;
          let pendAmount = sAmount;
          let stat = 'Pendiente';
          let pDate = 'Pendiente';

          if (remainingPaid >= sAmount && sAmount > 0) {
            pAmount = sAmount;
            pendAmount = 0;
            remainingPaid -= sAmount;
            stat = 'Pagado';
            pDate = sDate;
          } else if (remainingPaid > 0) {
            pAmount = remainingPaid;
            pendAmount = Math.max(0, sAmount - remainingPaid);
            remainingPaid = 0;
            const isPastDue = oDate && oDate < now;
            stat = isPastDue ? 'Atrasado' : 'Pendiente';
            pDate = 'Parcial';
          } else {
            pAmount = 0;
            pendAmount = sAmount;
            const isPastDue = oDate && oDate < now;
            stat = isPastDue ? 'Atrasado' : 'Pendiente';
            pDate = 'Pendiente';
          }

          return {
            id: o.id,
            concept: o.title || o.concept || `Mensualidad ${idx + 1}`,
            unit: u?.unitNumber || 'N/A',
            scheduledAmount: sAmount,
            montoProgramado: sAmount,
            scheduledDate: sDate,
            fechaProgramada: sDate,
            paidAmount: pAmount,
            montoPagado: pAmount,
            pendingAmount: pendAmount,
            montoPendiente: pendAmount,
            paidDate: pDate,
            fechaPago: pDate,
            planPago: 'Personalizado',
            paymentPlan: 'Personalizado',
            metodoPago: pAmount > 0 ? 'Transferencia SPEI' : 'Pendiente',
            paymentMethod: pAmount > 0 ? 'Transferencia SPEI' : 'Pendiente',
            status: stat,
            interesMoratorio: 0,
            moratoryAmount: 0,
          };
        });

        return {
          id: s.id,
          folio: s.saleFolio || `VEN-${s.id.slice(-6)}`,
          unit: u?.unitNumber || 'N/A',
          clientName,
          clientEmail,
          clientPhone,
          clientRfc,
          clientId: s.primaryClientId || (s.primaryClient?.email ? `cli-${s.primaryClient.email.toLowerCase().replace(/[^a-z0-9]/g, '-')}` : `cli-${s.id.slice(-6)}`),
          totalAmount: finalTotal,
          downPaymentAmount: Number(s.downPaymentAmount) || 0,
          paidAmount: finalPaid,
          pendingAmount: finalPending,
          totalPrice: finalTotal,
          status: s.status === 'ACTIVE' ? 'ACTIVA' : 'CANCELADA',
          saleDate: s.createdAt.toISOString().split('T')[0],
          schedule: scheduled,
          payments: receipts,
        };
      });

      // Calculate project financials
      const valorComercialTotal = unitsInventory.reduce((acc, u) => acc + u.price, 0);
      const totalCobrado = salesList.reduce((acc, s) => acc + s.paidAmount, 0);
      const porCobrar = salesList.reduce((acc, s) => acc + s.pendingAmount, 0);
      const totalVendido = totalCobrado + porCobrar;
      const morosidadMonto = salesList.reduce((acc, s) => {
        const saleOverdue = (s.schedule || [])
          .filter((inst) => inst.status === 'Atrasado')
          .reduce((subAcc, inst) => subAcc + inst.montoPendiente, 0);
        return acc + saleOverdue;
      }, 0);

      const projPlans = rawPlans
        .filter((rp) => !rp.client && !rp.unit && rp.Name && (rp.project === bubbleProj?.['unique id'] || rp.project === p.bubbleId))
        .map((rp) => {
          const downPct = parseFloat(rp.enganche) > 1 ? parseFloat(rp.enganche) : Math.round(parseFloat(rp.enganche || 0) * 100);
          const liqPct = parseFloat(rp.Liquidacion) > 1 ? parseFloat(rp.Liquidacion) : Math.round(parseFloat(rp.Liquidacion || 0) * 100);
          const descPct = parseFloat(rp.descuento) > 1 ? parseFloat(rp.descuento) : Math.round(parseFloat(rp.descuento || 0) * 100);
          const instCount = parseInt(rp['cantidad de pagos'] || '0', 10) || 0;
          return {
            id: rp['unique id'] || `plan-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
            name: rp.Name,
            downPaymentPct: downPct,
            installmentsCount: instCount,
            balloonLiquidationPct: liqPct,
            discountPct: descPct,
            moratoryRatePct: parseFloat(rp.interes || '3') || 3.0,
            isActive: true,
            description: rp.notas || `${downPct}% Enganche, ${instCount} Mensualidades (${Math.max(0, 100 - downPct - liqPct)}%), ${liqPct}% Liquidación`,
          };
        });

      return {
        id: p.id,
        name: p.name,
        type: p.projectType === 'HOUSE_DEVELOPMENT' ? 'Horizontal' : 'Vertical',
        image: p.coverImagePath || (p.galleryPaths && p.galleryPaths[0]) || 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1200&q=80',
        coverFileName: p.coverImagePath || (p.galleryPaths && p.galleryPaths[0]) || undefined,
        logo: projLogo,
        logoUrl: projLogo,
        logoFileName: projLogo,
        progressPct: p.constructionProgress && p.constructionProgress[0] ? Number(p.constructionProgress[0].overallPercentage) : 0,
        address: p.addressLine1 || 'Guadalajara, Jalisco',
        totalUnits,
        soldUnits,
        availableUnits,
        blockedUnits,
        metrics: {
          totalCobrado,
          porCobrar,
          valorComercialTotal,
          totalVendido,
          cobranzaEfectivaPct: totalVendido > 0 ? Math.round((totalCobrado / totalVendido) * 100) : 0,
          morosidadMonto,
        },
        unitsInventory,
        sales: salesList,
        paymentPlans: projPlans,
      };
    });

    const bubbleDev = rawDevs.find(
      (rd) =>
        rd['unique id'] === dev.bubbleId ||
        (rd.Nombre && dev.name && rd.Nombre.toLowerCase().trim() === dev.name.toLowerCase().trim()) ||
        (rd.Nombre && dev.name && dev.name.toLowerCase().includes(rd.Nombre.toLowerCase())) ||
        (rd.Nombre && dev.name && rd.Nombre.toLowerCase().includes(dev.name.toLowerCase()))
    );

    // Aggregate all template plans for this developer
    const devPlansSet = new Map();
    formattedProjects.forEach((fp) => {
      (fp.paymentPlans || []).forEach((pl) => {
        if (!devPlansSet.has(pl.name.toLowerCase().trim())) {
          devPlansSet.set(pl.name.toLowerCase().trim(), pl);
        }
      });
    });

    const devPaymentPlans = Array.from(devPlansSet.values());

    const devLogo = sanitizeUrl(bubbleDev?.Logo) || dev.logoPath || 'https://6d94a8ea50a1bc576a3e8162c197d74f.cdn.bubble.io/f1777398110026x731242031517065300/grupo_veq_logo.jpeg';

    // Find and map team members from rawUsers
    const devBubbleId = bubbleDev?.['unique id'] || dev.bubbleId;
    const matchedTeamUsers = rawUsers.filter((u) => {
      const uDevId = u.desarolladora || u.desarrolladora;
      const matchesDev = uDevId && devBubbleId && uDevId === devBubbleId;
      const matchesEmail = dev.email && u.email && u.email.toLowerCase().trim() === dev.email.toLowerCase().trim();
      return (matchesDev || matchesEmail) && u.role !== 'Cliente' && u.email;
    });

    const teamMembers = matchedTeamUsers.length > 0
      ? matchedTeamUsers.map((u) => {
          const role = mapRole(u.role);
          const perms = mapBubblePermissions(u['Lista de Permisos'], role);
          const assignedProjIds = u['Proyectos Asignados']
            ? u['Proyectos Asignados'].split(',').map((s) => s.trim()).filter(Boolean)
            : [];
          return {
            id: u['unique id'] || `usr-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
            name: (u.Nombre || dev.name).trim(),
            fullName: (u.Nombre || dev.name).trim(),
            email: u.email.trim(),
            role,
            status: 'ACTIVO',
            phone: u.telefono || dev.phone || '',
            avatarUrl: sanitizeUrl(u['foto de perfil']) || '',
            assignedProjects: assignedProjIds,
            permissions: perms,
            rawPermissions: u['Lista de Permisos'] || '',
          };
        })
      : [
          {
            id: `usr-${dev.id}`,
            name: dev.name,
            fullName: dev.name,
            email: dev.email || 'admin@desarrolladora.mx',
            role: 'Super Admin',
            status: 'ACTIVO',
            phone: dev.phone || '',
            avatarUrl: devLogo,
            assignedProjects: [],
            permissions: ['all'],
            rawPermissions: '',
          },
        ];

    const cleanMemberships = teamMembers.map((tm) => ({
      id: `mem-${tm.id}`,
      userId: tm.id,
      developerId: dev.id,
      role: tm.role === 'Super Admin' ? 'SUPER_ADMIN' : (tm.role === 'Director Comercial' ? 'ADMIN' : 'MEMBER'),
      user: {
        id: tm.id,
        email: tm.email,
        fullName: tm.name,
        phone: tm.phone,
        avatarUrl: tm.avatarUrl,
        role: tm.role,
        permissions: tm.permissions,
      },
    }));

    return {
      id: dev.id,
      name: bubbleDev?.Nombre || dev.name,
      commercialName: bubbleDev?.Nombre || dev.name,
      legalName: bubbleDev?.['Razon Social'] || dev.legalName || dev.name,
      taxId: dev.taxId || 'DEV-RFC-01',
      taxRegime: '601 - General de Ley Personas Morales',
      addressStreet: bubbleDev?.domicilio || dev.addressLine1 || 'Av. Principal 100',
      addressLine1: bubbleDev?.domicilio || dev.addressLine1 || 'Av. Principal 100',
      neighborhood: bubbleDev?.colonia || dev.neighborhood || 'Centro',
      addressCol: bubbleDev?.colonia || dev.neighborhood || 'Centro',
      city: dev.city || 'Guadalajara',
      state: 'Jalisco',
      postalCode: bubbleDev?.CP || dev.postalCode || '45000',
      zipCode: bubbleDev?.CP || dev.postalCode || '45000',
      phone: bubbleDev?.telefono || dev.phone || '3312345678',
      phoneNumber: bubbleDev?.telefono || dev.phone || '3312345678',
      email: dev.email || 'contacto@desarrolladora.mx',
      billingEmail: dev.email || 'facturacion@desarrolladora.mx',
      contactEmail: dev.email || 'contacto@desarrolladora.mx',
      website: bubbleDev?.Paginaweb || dev.website || '',
      logoPath: devLogo,
      logo: devLogo,
      logoUrl: devLogo,
      logoName: 'logo-desarrolladora.png',
      memberships: cleanMemberships,
      teamMembers,
      projects: formattedProjects,
      paymentPlans: devPaymentPlans,
    };
  });

  const outputPath = path.resolve(__dirname, '../../../apps/web/data/migrated-developers.json');
  fs.writeFileSync(outputPath, JSON.stringify(formattedDevs, null, 2));
  console.log(`✅ ${formattedDevs.length} desarrolladoras y sus proyectos exportados a ${outputPath}`);

  // ---------------------------------------------------------------------------
  // GENERAR COLA DE NOTIFICACIONES PROGRAMADAS FUTURAS (A partir de hoy 9:00 AM CDMX)
  // ---------------------------------------------------------------------------
  const todayCdmx = new Date('2026-09-23T00:00:00-06:00');
  const futureScheduledNotifs = [];

  formattedDevs.forEach((dev) => {
    (dev.projects || []).forEach((proj) => {
      (proj.sales || []).forEach((sale) => {
        (sale.schedule || []).forEach((inst) => {
          if (!inst.scheduledDate && !inst.fechaProgramada) return;
          const rawDateStr = inst.scheduledDate || inst.fechaProgramada;
          const dueDate = new Date(rawDateStr);
          if (isNaN(dueDate.getTime())) return;

          // Solo programar cuotas futuras a partir de hoy (23 de septiembre 2026 en adelante)
          if (dueDate >= todayCdmx && inst.status !== 'Pagado') {
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
              { chan: 'WHATSAPP', contact: sale.clientPhone || '+52 33 2256 7499' },
              { chan: 'POSTMARK', contact: sale.clientEmail || 'comprador@ejemplo.com' },
              { chan: 'PUSH', contact: 'App Devio / Web Push' },
            ];

            channels.forEach((ch) => {
              futureScheduledNotifs.push({
                id: `sch-${inst.id}-${ch.chan.toLowerCase()}`,
                triggerKey: 'payments.upcoming_reminder',
                triggerName: 'Recordatorio Preventivo de Mensualidad',
                category: 'COBRANZA',
                channel: ch.chan,
                scheduledFor: iso,
                scheduledForFormatted: formattedDate,
                relativeTime: relTime,
                recipientName: sale.clientName || 'Comprador Titular',
                recipientContact: ch.contact,
                recipientRole: 'Comprador / Titular',
                developerName: dev.name,
                projectName: proj.name,
                unitName: sale.unit || 'Unidad',
                sourceEvent: `Cuota ${inst.concept || 'Mensualidad'} (${sale.folio})`,
                status: 'PROGRAMADA',
                payloadSummary: `${inst.concept || 'Mensualidad'} por $${Number(inst.montoProgramado || inst.scheduledAmount || 0).toLocaleString('es-MX')} MXN (Vence ${dueDate.toLocaleDateString('es-MX', { timeZone: 'America/Mexico_City' })})`,
                metadata: {
                  monto: `$${Number(inst.montoProgramado || inst.scheduledAmount || 0).toLocaleString('es-MX')} MXN`,
                  fecha_vencimiento: rawDateStr,
                },
              });
            });
          }
        });
      });
    });
  });

  const scheduledExportPath = path.resolve(__dirname, '../../../apps/web/data/migrated-scheduled-notifications.json');
  fs.writeFileSync(scheduledExportPath, JSON.stringify(futureScheduledNotifs, null, 2));
  console.log(`✅ ${futureScheduledNotifs.length} notificaciones programadas futuras (3 canales a las 9:00 a.m. CDMX) exportadas a ${scheduledExportPath}`);

  await prisma.$disconnect();
  await pool.end();
}

generateRichJson().catch((err) => {
  console.error('❌ Error generando rich json:', err);
  process.exit(1);
});
