"use client";

import React, { useState, useRef } from "react";
import {
  UploadCloud,
  FileText,
  Image as ImageIcon,
  Film,
  X,
  CheckCircle2,
  AlertCircle,
  File,
} from "lucide-react";

export interface DevioUploadedFile {
  id: string;
  name: string;
  sizeBytes: number;
  sizeFormatted: string;
  type: string;
  url: string;
  progress?: number;
  file?: File;
}

interface DevioFileUploaderProps {
  files?: DevioUploadedFile[];
  onFilesChange: (files: DevioUploadedFile[]) => void;
  accept?: string;
  maxFiles?: number;
  maxSizeBytes?: number; // e.g. 25 * 1024 * 1024 for 25MB
  multiple?: boolean;
  label?: string;
  description?: string;
  disabled?: boolean;
  style?: React.CSSProperties;
}

export function DevioFileUploader({
  files = [],
  onFilesChange,
  accept = "image/*,application/pdf,video/*",
  maxFiles = 10,
  maxSizeBytes = 25 * 1024 * 1024,
  multiple = true,
  label,
  description = "PNG, JPG, PDF o MP4 hasta 25MB por archivo.",
  disabled = false,
  style,
}: DevioFileUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
  };

  const processFiles = (incomingFiles: FileList | File[]) => {
    setErrorMsg(null);
    const fileArray = Array.from(incomingFiles);

    if (!multiple && fileArray.length > 1) {
      setErrorMsg("Solo se permite subir un único archivo.");
      return;
    }

    if (files.length + fileArray.length > maxFiles) {
      setErrorMsg(`Se ha alcanzado el límite máximo de ${maxFiles} archivos.`);
      return;
    }

    const newUploaded: DevioUploadedFile[] = [];

    for (const f of fileArray) {
      if (f.size > maxSizeBytes) {
        setErrorMsg(`El archivo "${f.name}" excede el tamaño máximo permitido (${formatFileSize(maxSizeBytes)}).`);
        continue;
      }

      const fileUrl = URL.createObjectURL(f);
      newUploaded.push({
        id: `file-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        name: f.name,
        sizeBytes: f.size,
        sizeFormatted: formatFileSize(f.size),
        type: f.type,
        url: fileUrl,
        progress: 100,
        file: f,
      });
    }

    if (multiple) {
      onFilesChange([...files, ...newUploaded]);
    } else if (newUploaded.length > 0) {
      onFilesChange(newUploaded);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (disabled) return;
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(e.dataTransfer.files);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFiles(e.target.files);
    }
    // reset input value so user can select same file again if deleted
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleRemoveFile = (id: string) => {
    onFilesChange(files.filter((f) => f.id !== id));
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith("image/")) {
      return <ImageIcon size={18} color="#00C48C" />;
    }
    if (mimeType.startsWith("video/")) {
      return <Film size={18} color="#2F80ED" />;
    }
    if (mimeType.includes("pdf")) {
      return <FileText size={18} color="#E05345" />;
    }
    return <File size={18} color="#64748B" />;
  };

  return (
    <div style={{ width: "100%", ...style }}>
      {label && (
        <label
          style={{
            fontSize: "0.78rem",
            fontWeight: 700,
            color: "#1F3652",
            display: "block",
            marginBottom: "0.35rem",
          }}
        >
          {label}
        </label>
      )}

      {/* Hidden native input */}
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        disabled={disabled}
        onChange={handleFileInputChange}
        style={{ display: "none" }}
      />

      {/* Dropzone Container */}
      <div
        onClick={() => !disabled && fileInputRef.current?.click()}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        style={{
          border: isDragging ? "2px dashed #2F80ED" : "2px dashed #CBD5E1",
          borderRadius: "0.85rem",
          padding: "1.25rem 1rem",
          textAlign: "center",
          cursor: disabled ? "not-allowed" : "pointer",
          backgroundColor: isDragging ? "rgba(47, 128, 237, 0.05)" : "#F8FAFC",
          transition: "all 0.15s ease",
        }}
      >
        <div
          style={{
            width: "44px",
            height: "44px",
            borderRadius: "50%",
            backgroundColor: isDragging ? "#2F80ED" : "rgba(31, 54, 82, 0.06)",
            color: isDragging ? "#FFFFFF" : "#1B3047",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 0.5rem auto",
            transition: "all 0.15s ease",
          }}
        >
          <UploadCloud size={22} />
        </div>

        <p style={{ fontSize: "0.85rem", fontWeight: 700, color: "#1E293B", margin: 0 }}>
          Arrastra y suelta tus archivos aquí, o <span style={{ color: "#2F80ED", textDecoration: "underline" }}>haz clic para examinar</span>
        </p>
        <p style={{ fontSize: "0.72rem", color: "#64748B", margin: "0.25rem 0 0 0" }}>
          {description}
        </p>
      </div>

      {/* Error Message */}
      {errorMsg && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.4rem",
            marginTop: "0.5rem",
            padding: "0.45rem 0.75rem",
            backgroundColor: "#FEF2F2",
            border: "1px solid #FECACA",
            borderRadius: "0.5rem",
            color: "#DC2626",
            fontSize: "0.75rem",
            fontWeight: 600,
          }}
        >
          <AlertCircle size={14} />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Uploaded Files List */}
      {files.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", marginTop: "0.75rem" }}>
          {files.map((file) => (
            <div
              key={file.id}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "0.5rem 0.75rem",
                borderRadius: "0.6rem",
                backgroundColor: "#FFFFFF",
                border: "1px solid #E2E8F0",
                boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "0.65rem", minWidth: 0, flex: 1 }}>
                {/* Thumbnail Preview for Images */}
                {file.type.startsWith("image/") ? (
                  <img
                    src={file.url}
                    alt={file.name}
                    style={{
                      width: "36px",
                      height: "36px",
                      borderRadius: "0.4rem",
                      objectFit: "cover",
                      border: "1px solid #CBD5E1",
                      flexShrink: 0,
                    }}
                  />
                ) : (
                  <div
                    style={{
                      width: "36px",
                      height: "36px",
                      borderRadius: "0.4rem",
                      backgroundColor: "#F8FAFC",
                      border: "1px solid #E2E8F0",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    {getFileIcon(file.type)}
                  </div>
                )}

                <div style={{ minWidth: 0, flex: 1 }}>
                  <span
                    style={{
                      fontSize: "0.8rem",
                      fontWeight: 600,
                      color: "#1E293B",
                      display: "block",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {file.name}
                  </span>
                  <span style={{ fontSize: "0.7rem", color: "#94A3B8" }}>
                    {file.sizeFormatted} &bull; <span style={{ color: "#00C48C", fontWeight: 600 }}>Listo</span>
                  </span>
                </div>
              </div>

              {/* Remove button */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemoveFile(file.id);
                }}
                style={{
                  border: "none",
                  backgroundColor: "transparent",
                  color: "#94A3B8",
                  cursor: "pointer",
                  padding: "0.3rem",
                  borderRadius: "0.4rem",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "#EF4444")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "#94A3B8")}
              >
                <X size={16} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
