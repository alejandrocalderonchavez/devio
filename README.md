# Devio

Monorepo para la reconstrucción de Devio, la plataforma operativa para desarrolladoras inmobiliarias.

## Aplicaciones

- `apps/web`: back office y marketplace con Next.js.
- `apps/api`: API central con NestJS.
- `apps/mobile`: aplicación nativa de clientes con Expo/React Native.
- `apps/worker`: procesamiento asíncrono de PDFs, correos, notificaciones y migraciones.

## Paquetes compartidos

- `packages/database`: esquema y cliente Prisma.
- `packages/types`: contratos y tipos de dominio.
- `packages/validation`: esquemas Zod y validación de entorno.
- `packages/typescript-config`: configuraciones TypeScript compartidas.

## Primer arranque

1. Copia `.env.example` como `.env` y configura Supabase/PostgreSQL.
2. Ejecuta `pnpm install`.
3. Ejecuta `pnpm db:generate`.
4. Ejecuta `pnpm dev` o inicia cada aplicación por separado.

Puertos locales: web `3000`, API `4000`, worker sin puerto HTTP y Expo según el entorno local.

> Antes de generar builds de tiendas se deben colocar los identificadores existentes de iOS y Android. No se inventan identificadores nuevos porque Devio debe actualizar la aplicación actual sin perder continuidad.
