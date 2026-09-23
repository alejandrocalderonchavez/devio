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

  const formattedDevs = developers.map((dev) => {
    // Filter out dummy/empty projects
    const validProjects = dev.projects.filter(
      (p) => p.name && p.name !== 'Proyecto Sin Nombre' && p.name !== 'k'
    );

    const formattedProjects = validProjects.map((p) => {
      // Calculate unit stats
      const totalUnits = p.units.length;
      const soldUnits = p.units.filter((u) => u.status === 'SOLD').length;
      const availableUnits = p.units.filter((u) => u.status === 'AVAILABLE').length;
      const blockedUnits = p.units.filter((u) => u.status === 'BLOCKED' || u.status === 'RESERVED').length;

      // Build units inventory
      const unitsInventory = p.units.map((u) => {
        const matchingSale = p.sales.find((s) => s.unitId === u.id);
        const uStatus =
          u.status === 'SOLD' ? 'VENDIDA' : u.status === 'AVAILABLE' ? 'DISPONIBLE' : 'BLOQUEADA';

        const clientName = matchingSale && matchingSale.primaryClient
          ? (matchingSale.primaryClient.legalName || matchingSale.primaryClient.contactName || 'Cliente Propietario')
          : (uStatus === 'VENDIDA' ? 'Cliente Propietario' : '-');

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
          saleFolio: matchingSale?.saleFolio || (uStatus === 'VENDIDA' ? `VEN-${u.unitNumber}` : undefined),
          salePaidAmount: matchingSale ? Number(matchingSale.paidAmount) : (uStatus === 'VENDIDA' ? Number(u.basePrice) : 0),
          salePendingAmount: matchingSale ? (Number(matchingSale.totalPrice) - Number(matchingSale.paidAmount)) : 0,
        };
      });

      // Build sales list
      const salesList = p.sales.map((s) => {
        const u = p.units.find((unit) => unit.id === s.unitId);
        const clientName = s.primaryClient?.legalName || s.primaryClient?.contactName || 'Cliente';
        const clientEmail = s.primaryClient?.email || '-';
        const clientPhone = s.primaryClient?.phone || '-';
        const clientRfc = s.primaryClient?.taxId || '-';

        const scheduled = (s.scheduledObligations || []).map((o, idx) => ({
          id: o.id,
          concept: o.concept || `Mensualidad ${idx + 1}`,
          unit: u?.unitNumber || 'N/A',
          montoProgramado: Number(o.scheduledAmount),
          fechaProgramada: o.dueDate ? o.dueDate.toISOString().split('T')[0] : '2026-10-01',
          montoPagado: Number(o.paidAmount) || 0,
          montoPendiente: Number(o.scheduledAmount) - (Number(o.paidAmount) || 0),
          fechaPago: o.paidAt ? o.paidAt.toISOString().split('T')[0] : 'Pendiente',
          planPago: 'Personalizado',
          metodoPago: 'Transferencia SPEI',
          status: o.status === 'PAID' ? 'Pagado' : o.status === 'OVERDUE' ? 'Atrasado' : 'Pendiente',
          interesMoratorio: 0,
        }));

        const receipts = (s.paymentReceipts || []).map((r) => ({
          id: r.id,
          fechaPago: r.paymentDate ? r.paymentDate.toISOString().split('T')[0] : '2026-09-01',
          metodoPago: 'Transferencia SPEI',
          monto: Number(r.amount),
          unit: u?.unitNumber || 'N/A',
          reciboFolio: r.receiptFolio || `REC-${r.id.slice(-6)}`,
          comprobanteUrl: r.notes?.includes('Recibo: ') ? r.notes.split('Recibo: ')[1]?.split(' ')[0] : undefined,
          voucherName: 'Comprobante_Pago.pdf',
        }));

        const totalScheduled = scheduled.reduce((acc, o) => acc + o.montoProgramado, 0);
        const totalPaidFromReceipts = receipts.reduce((acc, r) => acc + r.monto, 0);

        const finalTotal = Number(s.totalPrice) > 0 ? Number(s.totalPrice) : (totalScheduled > 0 ? totalScheduled : (Number(u?.basePrice) || 0));
        const finalPaid = totalPaidFromReceipts > 0 ? totalPaidFromReceipts : Number(s.paidAmount);
        const finalPending = Math.max(0, finalTotal - finalPaid);

        return {
          id: s.id,
          folio: s.saleFolio || `VEN-${s.id.slice(-6)}`,
          unit: u?.unitNumber || 'N/A',
          clientName,
          clientEmail,
          clientPhone,
          clientRfc,
          clientId: s.clientId || `cli-${s.id.slice(-6)}`,
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

      return {
        id: p.id,
        name: p.name,
        type: p.projectType === 'HOUSE_DEVELOPMENT' ? 'Horizontal' : 'Vertical',
        image: p.renderUrls && p.renderUrls[0] ? p.renderUrls[0] : 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1200&q=80',
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
          morosidadMonto: 0,
        },
        unitsInventory,
        sales: salesList,
      };
    });

    return {
      id: dev.id,
      name: dev.name,
      legalName: dev.legalName,
      taxId: dev.taxId,
      logoPath: dev.logoPath,
      phone: dev.phone,
      email: dev.email,
      website: dev.website,
      city: dev.city,
      memberships: dev.memberships,
      projects: formattedProjects,
    };
  });

  const outputPath = path.resolve(__dirname, '../../../apps/web/data/migrated-developers.json');
  fs.writeFileSync(outputPath, JSON.stringify(formattedDevs, null, 2));
  console.log(`✅ ${formattedDevs.length} desarrolladoras y sus proyectos exportados a ${outputPath}`);

  await prisma.$disconnect();
  await pool.end();
}

generateRichJson().catch((err) => {
  console.error('❌ Error generando rich json:', err);
  process.exit(1);
});
