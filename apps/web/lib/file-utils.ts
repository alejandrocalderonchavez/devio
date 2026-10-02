/**
 * Universal File Download and View Utilities for Devio
 * Handles images, PDFs, Word, Excel, CAD, ZIPs and raw base64 data URLs cleanly.
 */

export function getMimeTypeAndExtension(urlOrData?: string, fallbackType?: string): { mimeType: string; extension: string } {
  let mimeType = "application/pdf";
  let extension = "pdf";

  if (urlOrData && urlOrData.startsWith("data:")) {
    const match = urlOrData.match(/^data:([^;,]+)/);
    if (match && match[1]) {
      mimeType = match[1].toLowerCase();
    }
  }

  const normalizedFallback = (fallbackType || "").toLowerCase().trim();

  if (mimeType.includes("png") || normalizedFallback === "png") {
    mimeType = "image/png";
    extension = "png";
  } else if (mimeType.includes("jpeg") || mimeType.includes("jpg") || normalizedFallback === "jpg" || normalizedFallback === "jpeg") {
    mimeType = "image/jpeg";
    extension = "jpg";
  } else if (mimeType.includes("webp") || normalizedFallback === "webp") {
    mimeType = "image/webp";
    extension = "webp";
  } else if (mimeType.includes("gif") || normalizedFallback === "gif") {
    mimeType = "image/gif";
    extension = "gif";
  } else if (mimeType.includes("svg") || normalizedFallback === "svg") {
    mimeType = "image/svg+xml";
    extension = "svg";
  } else if (mimeType.includes("word") || mimeType.includes("docx") || normalizedFallback === "docx" || normalizedFallback === "doc") {
    mimeType = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
    extension = "docx";
  } else if (mimeType.includes("sheet") || mimeType.includes("excel") || mimeType.includes("xlsx") || normalizedFallback === "xlsx" || normalizedFallback === "xls") {
    mimeType = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
    extension = "xlsx";
  } else if (mimeType.includes("zip") || normalizedFallback === "zip") {
    mimeType = "application/zip";
    extension = "zip";
  } else if (mimeType.includes("dwg") || normalizedFallback === "dwg") {
    mimeType = "application/acad";
    extension = "dwg";
  } else {
    mimeType = "application/pdf";
    extension = "pdf";
  }

  return { mimeType, extension };
}

export function base64ToBlob(dataUrl: string, targetMime?: string): Blob {
  const parts = dataUrl.split(",");
  const inferredMime = parts[0]?.match(/:(.*?);/)?.[1] || targetMime || "application/octet-stream";
  const base64Data = parts[1] || parts[0] || "";
  const byteCharacters = atob(base64Data);
  const byteNumbers = new Array(byteCharacters.length);
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }
  const byteArray = new Uint8Array(byteNumbers);
  return new Blob([byteArray], { type: targetMime || inferredMime });
}

export function downloadDocumentFile(options: {
  url?: string;
  title: string;
  fileType?: string;
  projectName?: string;
  clientName?: string;
  unit?: string;
  uploadDate?: string;
  notes?: string;
}): void {
  const { url, title, fileType } = options;
  const { mimeType, extension } = getMimeTypeAndExtension(url, fileType);
  const cleanTitle = (title || "Documento").replace(/[\\/:*?"<>|]/g, "_");
  const fileName = cleanTitle.toLowerCase().endsWith(`.${extension}`) ? cleanTitle : `${cleanTitle}.${extension}`;

  if (url && url.startsWith("data:")) {
    try {
      const blob = base64ToBlob(url, mimeType);
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(blobUrl), 1500);
      return;
    } catch (err) {
      console.warn("Could not download base64 directly as blob, fallback to link:", err);
    }
  }

  if (url && (url.startsWith("http") || url.startsWith("blob:"))) {
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    a.target = "_blank";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    return;
  }

  // Fallback: If no binary file is attached, generate a clean text metadata report with .txt (not corrupt image or html)
  const report = `=====================================================
DEVIO • BÓVEDA DIGITAL DE EXPEDIENTES
=====================================================
Documento: ${title}
Proyecto: ${options.projectName || "Desarrollo Inmobiliario"}
${options.clientName ? `Cliente: ${options.clientName}\n` : ""}${options.unit ? `Unidad: ${options.unit}\n` : ""}Fecha de Registro: ${options.uploadDate || new Date().toLocaleDateString("es-MX")}
Tipo de Archivo: ${fileType || "Documento Oficial"}
${options.notes ? `Notas: ${options.notes}\n` : ""}
Este documento está registrado formalmente en la plataforma Devio.
=====================================================`;

  const blob = new Blob([report], { type: "text/plain;charset=utf-8" });
  const blobUrl = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = blobUrl;
  a.download = `${cleanTitle}.txt`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(blobUrl), 1500);
}

export function openDocumentInNewTab(options: {
  url?: string;
  title: string;
  fileType?: string;
}): void {
  const { url, fileType } = options;
  if (!url) {
    return;
  }

  if (url.startsWith("data:")) {
    try {
      const { mimeType } = getMimeTypeAndExtension(url, fileType);
      const blob = base64ToBlob(url, mimeType);
      const blobUrl = URL.createObjectURL(blob);
      window.open(blobUrl, "_blank");
      return;
    } catch (err) {
      console.warn("Could not create blobUrl for open in new tab:", err);
    }
  }

  window.open(url, "_blank");
}
