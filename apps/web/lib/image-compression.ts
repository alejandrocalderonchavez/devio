/**
 * Image Compression Utilities for Devio
 * Compresses images client-side before sending to API or storing in localStorage,
 * preventing HTTP 413 (Payload Too Large) and QuotaExceededError (~5MB browser limit).
 */

export interface CompressOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  mimeType?: "image/jpeg" | "image/png" | "image/webp";
}

/**
 * Compresses an image File or Blob using HTML5 Canvas.
 * Returns a small base64 data URL (typically 40KB - 100KB).
 */
export async function compressImageFile(
  file: File | Blob,
  options: CompressOptions = {}
): Promise<string> {
  const {
    maxWidth = 1200,
    maxHeight = 1200,
    quality = 0.75,
    mimeType = "image/jpeg",
  } = options;

  return new Promise((resolve) => {
    // If not a browser environment or not an image
    if (typeof window === "undefined" || !file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (e) => resolve((e.target?.result as string) || "");
      reader.onerror = () => resolve("");
      reader.readAsDataURL(file);
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      if (!dataUrl) {
        resolve("");
        return;
      }

      const img = new Image();
      img.onload = () => {
        try {
          let { width, height } = img;

          // Calculate scaled dimensions
          if (width > maxWidth || height > maxHeight) {
            if (width / height > maxWidth / maxHeight) {
              height = Math.round((height * maxWidth) / width);
              width = maxWidth;
            } else {
              width = Math.round((width * maxHeight) / height);
              height = maxHeight;
            }
          }

          const canvas = document.createElement("canvas");
          canvas.width = Math.max(1, width);
          canvas.height = Math.max(1, height);

          const ctx = canvas.getContext("2d");
          if (!ctx) {
            resolve(dataUrl);
            return;
          }

          // Fill background with white for transparent images converted to JPEG
          if (mimeType === "image/jpeg") {
            ctx.fillStyle = "#FFFFFF";
            ctx.fillRect(0, 0, canvas.width, canvas.height);
          }

          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          const compressed = canvas.toDataURL(mimeType, quality);
          resolve(compressed);
        } catch (_) {
          resolve(dataUrl);
        }
      };

      img.onerror = () => {
        resolve(dataUrl);
      };

      img.src = dataUrl;
    };

    reader.onerror = () => resolve("");
    reader.readAsDataURL(file);
  });
}

/**
 * Compresses an existing base64 image data URL string.
 */
export async function compressBase64Image(
  dataUrl: string,
  options: CompressOptions = {}
): Promise<string> {
  if (typeof window === "undefined" || !dataUrl || !dataUrl.startsWith("data:image/")) {
    return dataUrl;
  }

  // If already under 80KB (~100,000 characters), no need to compress further
  if (dataUrl.length < 100000) {
    return dataUrl;
  }

  const {
    maxWidth = 1200,
    maxHeight = 1200,
    quality = 0.75,
    mimeType = "image/jpeg",
  } = options;

  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      try {
        let { width, height } = img;

        if (width > maxWidth || height > maxHeight) {
          if (width / height > maxWidth / maxHeight) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          } else {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement("canvas");
        canvas.width = Math.max(1, width);
        canvas.height = Math.max(1, height);

        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve(dataUrl);
          return;
        }

        if (mimeType === "image/jpeg") {
          ctx.fillStyle = "#FFFFFF";
          ctx.fillRect(0, 0, canvas.width, canvas.height);
        }

        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        const compressed = canvas.toDataURL(mimeType, quality);
        resolve(compressed);
      } catch (_) {
        resolve(dataUrl);
      }
    };

    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
}
