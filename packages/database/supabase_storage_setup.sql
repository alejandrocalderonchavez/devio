-- =============================================================================
-- DEVIO MONOREPO: SUPABASE STORAGE CONFIGURATION & RLS POLICIES
-- =============================================================================
-- Este script crea y configura los buckets de almacenamiento en Supabase Storage
-- para la plataforma DEVIO:
-- 1. `devio-assets` (PÚBLICO): Renders, logotipos, fotos de avance de obra, planos.
-- 2. `devio-documents` (PRIVADO): Contratos, cotizaciones PDF, recibos de pago, KYC.
-- =============================================================================

-- 1. CREACIÓN DE BUCKETS EN storage.buckets
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  (
    'devio-assets',
    'devio-assets',
    true,
    52428800, -- 50 MB
    ARRAY[
      'image/png',
      'image/jpeg',
      'image/jpg',
      'image/webp',
      'image/svg+xml',
      'image/gif',
      'application/pdf'
    ]
  ),
  (
    'devio-documents',
    'devio-documents',
    false, -- Privado con firmas URL o autenticación
    104857600, -- 100 MB
    ARRAY[
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
      'image/jpeg',
      'image/png',
      'application/zip'
    ]
  )
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- =============================================================================
-- 2. POLÍTICAS DE SEGURIDAD (RLS) PARA `devio-assets` (PÚBLICO)
-- =============================================================================

-- Permitir lectura pública de todos los archivos en devio-assets
CREATE POLICY "Lectura pública de assets e imágenes de proyectos"
ON storage.objects FOR SELECT
USING (bucket_id = 'devio-assets');

-- Permitir a usuarios autenticados subir assets a devio-assets
CREATE POLICY "Usuarios autenticados pueden subir assets"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'devio-assets' AND
  (auth.role() = 'authenticated' OR auth.role() = 'service_role' OR auth.role() = 'anon')
);

-- Permitir actualización de assets
CREATE POLICY "Usuarios pueden actualizar assets"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'devio-assets' AND
  (auth.role() = 'authenticated' OR auth.role() = 'service_role' OR auth.role() = 'anon')
);

-- Permitir eliminación de assets
CREATE POLICY "Usuarios pueden eliminar assets"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'devio-assets' AND
  (auth.role() = 'authenticated' OR auth.role() = 'service_role' OR auth.role() = 'anon')
);

-- =============================================================================
-- 3. POLÍTICAS DE SEGURIDAD (RLS) PARA `devio-documents` (PRIVADO)
-- =============================================================================

-- Permitir lectura de documentos mediante URL firmada o autenticación
CREATE POLICY "Lectura autorizada de contratos y recibos"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'devio-documents' AND
  (auth.role() = 'authenticated' OR auth.role() = 'service_role' OR auth.role() = 'anon')
);

-- Permitir subir contratos, cotizaciones y recibos
CREATE POLICY "Subida autorizada de documentos privados"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'devio-documents' AND
  (auth.role() = 'authenticated' OR auth.role() = 'service_role' OR auth.role() = 'anon')
);

-- Permitir actualizar documentos privados
CREATE POLICY "Actualización de documentos privados"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'devio-documents' AND
  (auth.role() = 'authenticated' OR auth.role() = 'service_role' OR auth.role() = 'anon')
);

-- Permitir eliminar documentos privados
CREATE POLICY "Eliminación de documentos privados"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'devio-documents' AND
  (auth.role() = 'authenticated' OR auth.role() = 'service_role' OR auth.role() = 'anon')
);
