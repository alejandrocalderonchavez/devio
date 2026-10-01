import { ProjectItem } from "@/data/projects-data";

/**
 * Sanitizes a project object by removing oversized base64 data URLs (images, PDFs)
 * before persisting to Web Storage to avoid QuotaExceededError (~5MB browser limit).
 */
export function sanitizeProjectForStorage(p: ProjectItem): ProjectItem {
  if (!p) return p;

  const rawP = p as any;

  return {
    ...p,
    image:
      typeof p.image === "string" && p.image.startsWith("data:") && p.image.length > 50000
        ? "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1200&q=80"
        : p.image,
    logo:
      typeof p.logo === "string" && p.logo.startsWith("data:") && p.logo.length > 50000
        ? undefined
        : p.logo,
    logoUrl:
      typeof p.logoUrl === "string" && p.logoUrl.startsWith("data:") && p.logoUrl.length > 50000
        ? undefined
        : p.logoUrl,
    floorPlans: Array.isArray(p.floorPlans)
      ? p.floorPlans.map((fp) => ({
          ...fp,
          imageUrl:
            typeof fp.imageUrl === "string" && fp.imageUrl.startsWith("data:") && fp.imageUrl.length > 50000
              ? ""
              : fp.imageUrl,
        }))
      : p.floorPlans,
    documents: Array.isArray(p.documents)
      ? p.documents.map((d: any) => ({
          ...d,
          url:
            typeof d.url === "string" && d.url.startsWith("data:") && d.url.length > 50000
              ? undefined
              : d.url,
          fileDataUrl: undefined,
        }))
      : p.documents,
    clientDocuments: Array.isArray(p.clientDocuments)
      ? p.clientDocuments.map((d: any) => ({
          ...d,
          url:
            typeof d.url === "string" && d.url.startsWith("data:") && d.url.length > 50000
              ? undefined
              : d.url,
          fileDataUrl: undefined,
        }))
      : p.clientDocuments,
    ...(rawP.coverImagePath && typeof rawP.coverImagePath === "string" && rawP.coverImagePath.length > 50000
      ? { coverImagePath: undefined }
      : {}),
  };
}

/**
 * Safely persists projects to localStorage and sessionStorage, handling QuotaExceededError gracefully.
 */
export function safeSaveProjectsState(projects: ProjectItem[]) {
  if (typeof window === "undefined" || !Array.isArray(projects)) return;

  const sanitized = projects.map(sanitizeProjectForStorage);
  const serialized = JSON.stringify(sanitized);

  try {
    localStorage.setItem("devio_projects_state", serialized);
  } catch (e1) {
    console.warn("localStorage quota exceeded for devio_projects_state. Cleaning heavy keys...", e1);
    try {
      // Clear oversized temporary keys
      const keysToClean = ["devio_user_avatar", "devio_developer_logo", "devio_payment_plans_library"];
      keysToClean.forEach((k) => {
        try {
          const val = localStorage.getItem(k);
          if (val && val.length > 100000) localStorage.removeItem(k);
        } catch (_) {}
      });
      localStorage.setItem("devio_projects_state", serialized);
    } catch (e2) {
      console.warn("Could not save to localStorage, attempting fallback:", e2);
    }
  }

  try {
    sessionStorage.setItem("devio_projects_state", serialized);
  } catch (e3) {
    console.warn("sessionStorage quota exceeded:", e3);
  }
}
