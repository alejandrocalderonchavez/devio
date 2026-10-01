import { ProjectItem } from "@/data/projects-data";

/**
 * Sanitizes a project object by removing oversized base64 data URLs (images, PDFs)
 * before persisting to Web Storage to avoid QuotaExceededError (~5MB browser limit).
 */
export function sanitizeProjectForStorage(p: ProjectItem, aggressive = false): ProjectItem {
  if (!p) return p;

  const rawP = p as any;
  // If aggressive mode is requested (e.g. quota nearly full), use stricter 60KB limit, otherwise ~120KB
  const MAX_IMAGE_LEN = aggressive ? 60000 : 130000;
  const MAX_DOC_LEN = 30000;

  return {
    ...p,
    image:
      typeof p.image === "string" && p.image.startsWith("data:") && p.image.length > MAX_IMAGE_LEN
        ? "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1200&q=80"
        : p.image,
    logo:
      typeof p.logo === "string" && p.logo.startsWith("data:") && p.logo.length > MAX_IMAGE_LEN
        ? undefined
        : p.logo,
    logoUrl:
      typeof p.logoUrl === "string" && p.logoUrl.startsWith("data:") && p.logoUrl.length > MAX_IMAGE_LEN
        ? undefined
        : p.logoUrl,
    floorPlans: Array.isArray(p.floorPlans)
      ? p.floorPlans.map((fp) => ({
          ...fp,
          imageUrl:
            typeof fp.imageUrl === "string" && fp.imageUrl.startsWith("data:") && fp.imageUrl.length > MAX_IMAGE_LEN
              ? ""
              : fp.imageUrl,
        }))
      : p.floorPlans,
    unitsInventory: Array.isArray(p.unitsInventory)
      ? p.unitsInventory.map((u) => ({
          ...u,
          images: Array.isArray(u.images)
            ? u.images
                .slice(0, aggressive ? 1 : 3)
                .map((img) =>
                  typeof img === "string" && img.startsWith("data:") && img.length > MAX_IMAGE_LEN ? "" : img
                )
                .filter(Boolean)
            : u.images,
        }))
      : p.unitsInventory,
    documents: Array.isArray(p.documents)
      ? p.documents.map((d: any) => ({
          ...d,
          url:
            typeof d.url === "string" && d.url.startsWith("data:") && d.url.length > MAX_DOC_LEN
              ? undefined
              : d.url,
          fileDataUrl: undefined, // Never keep full base64 PDF in localStorage
        }))
      : p.documents,
    clientDocuments: Array.isArray(p.clientDocuments)
      ? p.clientDocuments.map((d: any) => ({
          ...d,
          url:
            typeof d.url === "string" && d.url.startsWith("data:") && d.url.length > MAX_DOC_LEN
              ? undefined
              : d.url,
          fileDataUrl: undefined,
        }))
      : p.clientDocuments,
    ...(rawP.coverImagePath && typeof rawP.coverImagePath === "string" && rawP.coverImagePath.length > MAX_IMAGE_LEN
      ? { coverImagePath: undefined }
      : {}),
  };
}

/**
 * Safely persists projects to localStorage and sessionStorage, handling QuotaExceededError gracefully.
 */
export function safeSaveProjectsState(projects: ProjectItem[]) {
  if (typeof window === "undefined" || !Array.isArray(projects)) return;

  // 1. Standard sanitization
  let sanitized = projects.map((p) => sanitizeProjectForStorage(p, false));
  let serialized = JSON.stringify(sanitized);

  // Try standard save
  try {
    localStorage.setItem("devio_projects_state", serialized);
    sessionStorage.setItem("devio_projects_state", serialized);
    return;
  } catch (e1) {
    console.warn("Storage quota warning. Running aggressive cleanup...", e1);
  }

  // 2. Clear non-critical heavy storage keys
  try {
    const keysToClean = [
      "devio_user_avatar",
      "devio_developer_logo",
      "devio_payment_plans_library",
      "devio_projects_backup",
      "devio_system_audit_logs",
    ];
    keysToClean.forEach((k) => {
      try {
        const val = localStorage.getItem(k);
        if (val && val.length > 50000) localStorage.removeItem(k);
      } catch (_) {}
    });
  } catch (_) {}

  // 3. Aggressive sanitization (limit image sizes to 60KB and strip older project heavy base64s)
  try {
    sanitized = projects.map((p, idx) => {
      // For the most recently added project (idx 0), keep compressed images; for older ones, be more aggressive
      return sanitizeProjectForStorage(p, idx > 0);
    });
    serialized = JSON.stringify(sanitized);
    localStorage.setItem("devio_projects_state", serialized);
    sessionStorage.setItem("devio_projects_state", serialized);
    return;
  } catch (e2) {
    console.warn("Could not save full projects state with aggressive mode. Fallback to essential data:", e2);
  }

  // 4. Ultimate fallback: preserve project structure and unit counts, strip all base64 data URLs
  try {
    sanitized = projects.map((p) => ({
      ...p,
      image: p.image?.startsWith("data:") ? "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1200&q=80" : p.image,
      logo: undefined,
      logoUrl: undefined,
      floorPlans: Array.isArray(p.floorPlans) ? p.floorPlans.map(fp => ({ ...fp, imageUrl: "" })) : p.floorPlans,
      unitsInventory: Array.isArray(p.unitsInventory) ? p.unitsInventory.map(u => ({ ...u, images: [] })) : p.unitsInventory,
      documents: Array.isArray(p.documents) ? p.documents.map((d: any) => ({ ...d, url: undefined, fileDataUrl: undefined })) : p.documents,
      clientDocuments: Array.isArray(p.clientDocuments) ? p.clientDocuments.map((d: any) => ({ ...d, url: undefined, fileDataUrl: undefined })) : p.clientDocuments,
    }));
    serialized = JSON.stringify(sanitized);
    localStorage.setItem("devio_projects_state", serialized);
    sessionStorage.setItem("devio_projects_state", serialized);
  } catch (e3) {
    console.error("Critical: Web Storage completely unavailable or exceeded total device quota:", e3);
  }
}
