"use client";

import React, { useState, useMemo, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  MapPin,
  Building2,
  Calendar,
  Layers,
  Phone,
  Download,
  Share2,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  CheckCircle2,
  X,
  Send,
  ExternalLink,
  Info,
  DollarSign,
  Compass,
  ArrowLeft,
} from "lucide-react";
import { MarketplaceNav } from "../../../components/marketplace/marketplace-nav";
import { MarketplaceFooter } from "../../../components/marketplace/marketplace-footer";
import { useProject } from "../../../context/project-context";
import { exportTableToPDF } from "../../../lib/export-utils";
import PhoneInput from "../../../components/ui/phone-input";

interface UnitInventoryRow {
  unit: string;
  type: string;
  areaM2: number;
  price: number;
  status: "Disponible" | "Apartado" | "Vendido";
}

export default function PublicProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const slug = (params?.slug as string) || "";
  const { projects, developerName, formatMoney, showToast } = useProject();

  const [developerContact, setDeveloperContact] = useState<{
    phone: string;
    email: string;
    logoUrl: string | null;
  }>({
    phone: "33 2256 4378",
    email: "ventas@devio.mx",
    logoUrl: null,
  });

  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedDev = localStorage.getItem("devio_developer_onboarding") || sessionStorage.getItem("devio_developer_onboarding");
      if (storedDev) {
        try {
          const parsed = JSON.parse(storedDev);
          setDeveloperContact({
            phone: parsed.phoneNumber || "33 2256 4378",
            email: parsed.email || "ventas@devio.mx",
            logoUrl: parsed.logoUrl || null,
          });
        } catch (e) {}
      }
    }
  }, []);

  // Find project by ID or slug
  const currentProject = useMemo(() => {
    if (!slug) return projects[0];
    const found = projects.find(
      (p) =>
        p.id.toLowerCase() === slug.toLowerCase() ||
        p.name.toLowerCase().replace(/\s+/g, "-") === slug.toLowerCase()
    );
    return found || projects[0];
  }, [projects, slug]);

  // Project Gallery Images
  const projectGallery = useMemo(() => {
    const mainImg =
      currentProject?.image ||
      "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1200&q=80";

    return [
      {
        id: 1,
        title: "Fachada Principal y Accesos",
        url: mainImg,
      },
      {
        id: 2,
        title: "Rooftop y Vista Panorámica",
        url: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1200&q=80",
      },
      {
        id: 3,
        title: "Amenidades y Áreas Comunes",
        url: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80",
      },
      {
        id: 4,
        title: "Circulaciones e Interiores",
        url: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1200&q=80",
      },
    ];
  }, [currentProject]);

  // Carousel Active Slide State
  const [activeSlideIndex, setActiveSlideIndex] = useState(0);

  // Available Inventory Data mapped from project.unitsInventory
  const inventoryUnits: UnitInventoryRow[] = useMemo(() => {
    if (!currentProject || !currentProject.unitsInventory || currentProject.unitsInventory.length === 0) {
      return [];
    }
    return currentProject.unitsInventory.map((u) => ({
      unit: u.unit,
      type: u.type || "Departamento",
      areaM2: u.areaM2 || 75,
      price: u.price || 0,
      status:
        u.status === "DISPONIBLE"
          ? "Disponible"
          : u.status === "APARTADA"
          ? "Apartado"
          : "Vendido",
    }));
  }, [currentProject]);

  // Lead Quote Modal State
  const [selectedUnitForQuote, setSelectedUnitForQuote] = useState<UnitInventoryRow | null>(null);
  const [leadForm, setLeadForm] = useState({
    name: "",
    email: "",
    phone: "",
    notes: "",
  });

  // Next & Prev Slide handlers
  const handlePrevSlide = () => {
    setActiveSlideIndex((prev) => (prev === 0 ? projectGallery.length - 1 : prev - 1));
  };

  const handleNextSlide = () => {
    setActiveSlideIndex((prev) => (prev === projectGallery.length - 1 ? 0 : prev + 1));
  };

  // Download Official Brochure PDF
  const handleDownloadBrochure = () => {
    if (!currentProject) return;
    const headers = ["Unidad", "Tipo", "Superficie (m²)", "Precio Base", "Estatus"];
    const rows = inventoryUnits.map((u) => [
      u.unit,
      u.type,
      `${u.areaM2} m²`,
      formatMoney(u.price),
      u.status,
    ]);

    const summary = `${currentProject.name} | Desarrolladora: ${developerName} | Avance: ${currentProject.progressPct}% | Unidades Disponibles: ${inventoryUnits.filter((u) => u.status === "Disponible").length}`;

    exportTableToPDF(`Brochure Oficial de Ventas - ${currentProject.name}`, developerName, headers, rows, summary);
    showToast("Brochure Descargado", "Se generó el catálogo de ventas en formato PDF listo para compartir.");
  };

  // Submit Lead Quote
  const handleSubmitLead = (e: React.FormEvent) => {
    e.preventDefault();
    showToast(
      "Cotización Solicitada",
      `Gracias ${leadForm.name}, un asesor de ${developerName} te contactará al ${leadForm.phone} con la cotización de la unidad ${selectedUnitForQuote?.unit}.`
    );
    setSelectedUnitForQuote(null);
    setLeadForm({ name: "", email: "", phone: "", notes: "" });
  };

  if (!currentProject) {
    return (
      <div style={{ minHeight: "100vh", backgroundColor: "#F8FAFC", display: "flex", flexDirection: "column" }}>
        <MarketplaceNav activePage="proyecto" />
        <main style={{ maxWidth: "1280px", width: "100%", margin: "4rem auto", padding: "0 1.5rem", flex: 1, textAlign: "center" }}>
          <div style={{ backgroundColor: "#FFFFFF", borderRadius: "1.5rem", padding: "4rem 2rem", border: "1px solid #E2E8F0", maxWidth: "600px", margin: "0 auto" }}>
            <Building2 size={48} color="#94A3B8" style={{ margin: "0 auto 1rem auto" }} />
            <h1 style={{ fontSize: "1.5rem", fontWeight: 800, color: "#1F3652", marginBottom: "0.5rem" }}>
              Proyecto no encontrado
            </h1>
            <p style={{ fontSize: "0.9rem", color: "#64748B", marginBottom: "1.5rem" }}>
              No se encontró un proyecto activo con el identificador proporcionado.
            </p>
            <Link
              href="/marketplace"
              style={{
                backgroundColor: "#1B3047",
                color: "#FFFFFF",
                padding: "0.75rem 1.5rem",
                borderRadius: "9999px",
                fontSize: "0.85rem",
                fontWeight: 700,
                textDecoration: "none",
                display: "inline-flex",
                alignItems: "center",
                gap: "0.5rem",
              }}
            >
              <ArrowLeft size={16} /> Volver al Marketplace
            </Link>
          </div>
        </main>
        <MarketplaceFooter />
      </div>
    );
  }

  const projectName = currentProject.name;
  const projectAddress =
    currentProject.id === "p-1"
      ? "Av Pablo Neruda 3809, Providencia"
      : currentProject.id === "p-2"
      ? "Av Empresarios 150, Puerta de Hierro"
      : "Ubicación Residencial";

  const totalAreaM2 =
    currentProject.unitsInventory.reduce((acc, u) => acc + (u.areaM2 || 0), 0) || 2500;

  const totalUnits = currentProject.totalUnits || currentProject.unitsInventory.length;
  const progressPct = currentProject.progressPct ?? 45;

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#F8FAFC", display: "flex", flexDirection: "column" }}>
      {/* 1. FLOATING NAVBAR */}
      <MarketplaceNav activePage="proyecto" />

      {/* MAIN CONTENT CONTAINER */}
      <main style={{ maxWidth: "1280px", width: "100%", margin: "0 auto", padding: "0 1.5rem", flex: 1 }}>
        
        {/* 2. TOP HERO SECTION: GALLERY (LEFT) + FLOATING INFO CARD (RIGHT) */}
        <div style={{ display: "grid", gridTemplateColumns: "1.35fr 1fr", gap: "1.75rem", marginBottom: "2rem" }}>
          
          {/* LEFT: PHOTO GALLERY GRID */}
          <div style={{ display: "grid", gridTemplateColumns: "1.6fr 1fr", gap: "0.75rem", height: "460px" }}>
            
            {/* Main Featured Photo (Left) */}
            <div
              onClick={() => setActiveSlideIndex(0)}
              style={{
                borderRadius: "1.25rem",
                overflow: "hidden",
                position: "relative",
                cursor: "pointer",
                boxShadow: "0 4px 15px rgba(0,0,0,0.05)",
              }}
            >
              <img
                src={projectGallery[0]?.url || "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1200&q=80"}
                alt={projectGallery[0]?.title || projectName}
                style={{ width: "100%", height: "100%", objectFit: "cover", transition: "transform 0.3s ease" }}
              />
            </div>

            {/* 3 Stacked Thumbnail Photos (Right) */}
            <div style={{ display: "grid", gridTemplateRows: "repeat(3, 1fr)", gap: "0.75rem", height: "100%" }}>
              {projectGallery.slice(1, 4).map((img, idx) => (
                <div
                  key={img.id}
                  onClick={() => setActiveSlideIndex(idx + 1)}
                  style={{
                    borderRadius: "0.85rem",
                    overflow: "hidden",
                    position: "relative",
                    cursor: "pointer",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
                  }}
                >
                  <img
                    src={img.url}
                    alt={img.title}
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* RIGHT: FLOATING WHITE INFO CARD */}
          <div
            style={{
              backgroundColor: "#FFFFFF",
              borderRadius: "1.5rem",
              padding: "2rem",
              boxShadow: "0 4px 25px rgba(0, 0, 0, 0.05)",
              border: "1px solid #E2E8F0",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
            }}
          >
            <div>
              {/* Top Row: Title + Developer Logo */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.75rem" }}>
                <div>
                  <h1 style={{ fontSize: "2rem", fontWeight: 900, color: "#1F3652", margin: "0 0 0.35rem 0", letterSpacing: "-0.02em" }}>
                    {projectName}
                  </h1>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", color: "#64748B", fontSize: "0.85rem" }}>
                    <MapPin size={15} color="#64748B" />
                    <span>{projectAddress}</span>
                  </div>
                </div>

                {/* Inset Developer Logo Badge */}
                <div style={{ backgroundColor: "#F8FAFC", padding: "0.5rem 0.85rem", borderRadius: "0.75rem", border: "1px solid #E2E8F0", textAlign: "center" }}>
                  {developerContact.logoUrl ? (
                    <img
                      src={developerContact.logoUrl}
                      alt={developerName}
                      style={{ height: "22px", width: "auto", objectFit: "contain", margin: "0 auto 2px auto" }}
                    />
                  ) : (
                    <Building2 size={22} color="#C7B28B" style={{ margin: "0 auto 2px auto" }} />
                  )}
                  <span style={{ fontSize: "0.62rem", fontWeight: 800, color: "#1F3652", display: "block", letterSpacing: "0.05em" }}>
                    {developerName.toUpperCase()}
                  </span>
                </div>
              </div>

              {/* Botón: Descargar Brochure */}
              <button
                type="button"
                onClick={handleDownloadBrochure}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "0.5rem",
                  backgroundColor: "#1B3047",
                  color: "#FFFFFF",
                  padding: "0.75rem 1.75rem",
                  borderRadius: "9999px",
                  fontSize: "0.88rem",
                  fontWeight: 700,
                  border: "none",
                  cursor: "pointer",
                  width: "100%",
                  boxShadow: "0 4px 12px rgba(27, 48, 71, 0.15)",
                  margin: "1.25rem 0 1.5rem 0",
                }}
              >
                <Download size={16} /> Descargar Brochure
              </button>

              {/* Summary Metadata List */}
              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", fontSize: "0.82rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", paddingBottom: "0.4rem", borderBottom: "1px solid #F1F5F9" }}>
                  <span style={{ color: "#64748B" }}>Desarrolladora</span>
                  <strong style={{ color: "#1F3652" }}>{developerName}</strong>
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", paddingBottom: "0.4rem", borderBottom: "1px solid #F1F5F9" }}>
                  <span style={{ color: "#64748B" }}>Avance de Obra</span>
                  <strong style={{ color: "#1F3652" }}>{progressPct}%</strong>
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", paddingBottom: "0.4rem", borderBottom: "1px solid #F1F5F9" }}>
                  <span style={{ color: "#64748B" }}>Tipo de Proyecto</span>
                  <strong style={{ color: "#1F3652" }}>{currentProject.type || "Vertical"}</strong>
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", paddingBottom: "0.4rem", borderBottom: "1px solid #F1F5F9" }}>
                  <span style={{ color: "#64748B" }}>Total de Unidades</span>
                  <strong style={{ color: "#1F3652" }}>{totalUnits}</strong>
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", paddingBottom: "0.4rem", borderBottom: "1px solid #F1F5F9" }}>
                  <span style={{ color: "#64748B" }}>Superficie Total</span>
                  <strong style={{ color: "#1F3652" }}>{totalAreaM2} m²</strong>
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", paddingTop: "0.2rem" }}>
                  <span style={{ color: "#64748B" }}>Teléfono de Contacto</span>
                  <a
                    href={`tel:${developerContact.phone.replace(/\s+/g, "")}`}
                    style={{ color: "#2F80ED", fontWeight: 700, textDecoration: "none", display: "flex", alignItems: "center", gap: "0.3rem" }}
                  >
                    <Phone size={13} /> {developerContact.phone}
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 3. CARD DESCRIPCIÓN */}
        <div
          style={{
            backgroundColor: "#FFFFFF",
            borderRadius: "1.25rem",
            padding: "1.5rem 2rem",
            boxShadow: "0 2px 10px rgba(0, 0, 0, 0.03)",
            border: "1px solid #E2E8F0",
            marginBottom: "1.25rem",
          }}
        >
          <h2 style={{ fontSize: "1.15rem", fontWeight: 800, color: "#1F3652", margin: "0 0 0.5rem 0" }}>
            Descripción
          </h2>
          <p style={{ fontSize: "0.88rem", color: "#475569", margin: 0, lineHeight: 1.6 }}>
            {projectName} es un desarrollo inmobiliario residencial exclusivo desarrollado por <strong>{developerName}</strong>. Diseñado con arquitectura de vanguardia, materiales de alta gama, amenidades integrales y una ubicación estratégica con gran plusvalía.
          </p>
        </div>

        {/* 4. CARD AVANCE DE OBRA */}
        <div
          style={{
            backgroundColor: "#FFFFFF",
            borderRadius: "1.25rem",
            padding: "1.5rem 2rem",
            boxShadow: "0 2px 10px rgba(0, 0, 0, 0.03)",
            border: "1px solid #E2E8F0",
            marginBottom: "1.5rem",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
            <h2 style={{ fontSize: "1.15rem", fontWeight: 800, color: "#1F3652", margin: 0 }}>
              Avance de Obra
            </h2>
            <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", fontSize: "0.75rem", color: "#64748B" }}>
              <div style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: "#00C48C" }} />
              <span>Actualización en tiempo real</span>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
            <strong style={{ fontSize: "1.35rem", fontWeight: 900, color: "#1F3652", minWidth: "45px" }}>
              {progressPct}%
            </strong>
            <div style={{ flex: 1, height: "10px", backgroundColor: "#E2E8F0", borderRadius: "9999px", overflow: "hidden" }}>
              <div style={{ width: `${progressPct}%`, height: "100%", backgroundColor: "#C7B28B", borderRadius: "9999px" }} />
            </div>
          </div>
        </div>

        {/* 5. SECCIÓN INTERACTIVA DE IMÁGENES / CARRUSEL */}
        <div
          style={{
            backgroundColor: "#FFFFFF",
            borderRadius: "1.5rem",
            padding: "2rem",
            boxShadow: "0 4px 20px rgba(0, 0, 0, 0.04)",
            border: "1px solid #E2E8F0",
            marginBottom: "1.75rem",
          }}
        >
          <h2 style={{ fontSize: "1.5rem", fontWeight: 800, color: "#1F3652", textAlign: "center", margin: "0 0 1.5rem 0" }}>
            Galería del Proyecto
          </h2>

          {/* Large Slider Container */}
          <div style={{ position: "relative", borderRadius: "1.25rem", overflow: "hidden", height: "520px", backgroundColor: "#1E293B" }}>
            <img
              src={projectGallery[activeSlideIndex]?.url || projectGallery[0]?.url || ""}
              alt={projectGallery[activeSlideIndex]?.title || "Galería del Proyecto"}
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />

            {/* Left Arrow Button */}
            <button
              type="button"
              onClick={handlePrevSlide}
              style={{
                position: "absolute",
                left: "1.5rem",
                top: "50%",
                transform: "translateY(-50%)",
                width: "44px",
                height: "44px",
                borderRadius: "50%",
                backgroundColor: "rgba(255, 255, 255, 0.9)",
                backdropFilter: "blur(4px)",
                border: "none",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#1B3047",
                cursor: "pointer",
                boxShadow: "0 4px 15px rgba(0,0,0,0.2)",
                zIndex: 10,
              }}
            >
              <ChevronLeft size={24} />
            </button>

            {/* Right Arrow Button */}
            <button
              type="button"
              onClick={handleNextSlide}
              style={{
                position: "absolute",
                right: "1.5rem",
                top: "50%",
                transform: "translateY(-50%)",
                width: "44px",
                height: "44px",
                borderRadius: "50%",
                backgroundColor: "rgba(255, 255, 255, 0.9)",
                backdropFilter: "blur(4px)",
                border: "none",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#1B3047",
                cursor: "pointer",
                boxShadow: "0 4px 15px rgba(0,0,0,0.2)",
                zIndex: 10,
              }}
            >
              <ChevronRight size={24} />
            </button>
          </div>

          {/* Pagination indicator dots */}
          <div style={{ display: "flex", justifyContent: "center", gap: "0.5rem", marginTop: "1.25rem" }}>
            {projectGallery.map((_, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setActiveSlideIndex(idx)}
                style={{
                  width: idx === activeSlideIndex ? "24px" : "8px",
                  height: "8px",
                  borderRadius: "9999px",
                  border: "none",
                  backgroundColor: idx === activeSlideIndex ? "#1B3047" : "#CBD5E1",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                }}
              />
            ))}
          </div>
        </div>

        {/* 6. CARD MAPA DE UBICACIÓN */}
        <div
          style={{
            backgroundColor: "#FFFFFF",
            borderRadius: "1.5rem",
            overflow: "hidden",
            boxShadow: "0 4px 20px rgba(0, 0, 0, 0.04)",
            border: "1px solid #E2E8F0",
            marginBottom: "3rem",
          }}
        >
          <div style={{ position: "relative", height: "380px", width: "100%", backgroundColor: "#E2E8F0" }}>
            
            {/* Map visual background with overlay */}
            <div
              style={{
                width: "100%",
                height: "100%",
                backgroundImage: "url('https://images.unsplash.com/photo-1524661135-423995f22d0b?auto=format&fit=crop&w=1600&q=80')",
                backgroundSize: "cover",
                backgroundPosition: "center",
                filter: "brightness(0.95)",
              }}
            />

            {/* Custom Location Marker Pin */}
            <div
              style={{
                position: "absolute",
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                zIndex: 5,
              }}
            >
              <div
                style={{
                  backgroundColor: "#EF4444",
                  color: "#FFFFFF",
                  width: "44px",
                  height: "44px",
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: "0 8px 25px rgba(239, 68, 68, 0.5)",
                }}
              >
                <MapPin size={24} />
              </div>
              <div
                style={{
                  backgroundColor: "#FFFFFF",
                  padding: "0.3rem 0.75rem",
                  borderRadius: "0.5rem",
                  marginTop: "0.4rem",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                  fontSize: "0.78rem",
                  fontWeight: 800,
                  color: "#1F3652",
                }}
              >
                {projectName}
              </div>
            </div>

            {/* Map Mode Buttons Inset */}
            <div style={{ position: "absolute", top: "1rem", left: "1rem", display: "flex", gap: "0.35rem", zIndex: 6 }}>
              <span style={{ backgroundColor: "#FFFFFF", padding: "0.35rem 0.75rem", borderRadius: "0.45rem", fontSize: "0.75rem", fontWeight: 700, color: "#1F3652", boxShadow: "0 2px 6px rgba(0,0,0,0.1)" }}>
                Mapa
              </span>
              <span style={{ backgroundColor: "#FFFFFF", padding: "0.35rem 0.75rem", borderRadius: "0.45rem", fontSize: "0.75rem", color: "#64748B", boxShadow: "0 2px 6px rgba(0,0,0,0.1)" }}>
                Satélite
              </span>
            </div>

            {/* External Google Maps Link */}
            <a
              href={`https://maps.google.com/?q=${encodeURIComponent(projectAddress)}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                position: "absolute",
                bottom: "1rem",
                right: "1rem",
                backgroundColor: "#FFFFFF",
                padding: "0.5rem 1rem",
                borderRadius: "9999px",
                fontSize: "0.78rem",
                fontWeight: 700,
                color: "#1F3652",
                textDecoration: "none",
                display: "flex",
                alignItems: "center",
                gap: "0.4rem",
                boxShadow: "0 4px 15px rgba(0,0,0,0.15)",
                zIndex: 6,
              }}
            >
              <ExternalLink size={14} /> Abrir en Google Maps
            </a>
          </div>
        </div>

        {/* 7. INVENTARIO DISPONIBLE */}
        <div style={{ marginBottom: "3rem" }}>
          <h2 style={{ fontSize: "1.75rem", fontWeight: 900, color: "#1F3652", textAlign: "center", margin: "0 0 1.75rem 0", letterSpacing: "-0.02em" }}>
            Inventario Disponible ({inventoryUnits.length})
          </h2>

          {inventoryUnits.length === 0 ? (
            <div style={{ backgroundColor: "#FFFFFF", borderRadius: "1.25rem", padding: "3rem", textAlign: "center", border: "1px solid #E2E8F0" }}>
              <Building2 size={36} color="#94A3B8" style={{ margin: "0 auto 0.75rem auto" }} />
              <h3 style={{ fontSize: "1.1rem", fontWeight: 700, color: "#1F3652" }}>
                No hay unidades registradas aún para este proyecto
              </h3>
              <p style={{ fontSize: "0.85rem", color: "#64748B" }}>
                El inventario de departamentos y residencias aparecerá aquí en cuanto se cargue en el panel de Devio.
              </p>
            </div>
          ) : (
            <div
              style={{
                backgroundColor: "#FFFFFF",
                borderRadius: "1.25rem",
                padding: "1.5rem",
                boxShadow: "0 4px 25px rgba(0, 0, 0, 0.04)",
                border: "1px solid #E2E8F0",
                overflowX: "auto",
              }}
            >
              <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: 0, textAlign: "left", fontSize: "0.85rem" }}>
                <thead>
                  <tr style={{ backgroundColor: "#1B3047", color: "#FFFFFF" }}>
                    <th style={{ padding: "0.9rem 1.25rem", fontWeight: 700, borderTopLeftRadius: "0.75rem", borderBottomLeftRadius: "0.75rem" }}>
                      Número de unidad
                    </th>
                    <th style={{ padding: "0.9rem 1rem", fontWeight: 700 }}>
                      Tipo
                    </th>
                    <th style={{ padding: "0.9rem 1rem", fontWeight: 700, textAlign: "center" }}>
                      Superficie (m²)
                    </th>
                    <th style={{ padding: "0.9rem 1rem", fontWeight: 700, textAlign: "right" }}>
                      Precio
                    </th>
                    <th style={{ padding: "0.9rem 1rem", fontWeight: 700, textAlign: "center" }}>
                      Estatus
                    </th>
                    <th style={{ padding: "0.9rem 1.25rem", fontWeight: 700, borderTopRightRadius: "0.75rem", borderBottomRightRadius: "0.75rem", textAlign: "center" }}>
                      Cotización
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {inventoryUnits.map((row) => (
                    <tr
                      key={row.unit}
                      style={{ borderBottom: "1px solid #F1F5F9", transition: "background-color 0.15s ease" }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "rgba(31, 54, 82, 0.02)")}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                    >
                      {/* Número de unidad */}
                      <td style={{ padding: "1rem 1.25rem", fontWeight: 800, color: "#1F3652" }}>
                        {row.unit}
                      </td>

                      {/* Tipo */}
                      <td style={{ padding: "1rem 1rem", color: "#475569" }}>
                        {row.type}
                      </td>

                      {/* Superficie */}
                      <td style={{ padding: "1rem 1rem", textAlign: "center", fontWeight: 600, color: "#1F3652" }}>
                        {row.areaM2}
                      </td>

                      {/* Precio */}
                      <td style={{ padding: "1rem 1rem", textAlign: "right", fontWeight: 700, color: "#1F3652" }}>
                        {formatMoney(row.price)}
                      </td>

                      {/* Estatus */}
                      <td style={{ padding: "1rem 1rem", textAlign: "center" }}>
                        <span
                          style={{
                            display: "inline-block",
                            backgroundColor: row.status === "Disponible" ? "rgba(0, 196, 140, 0.12)" : "#FEF3C7",
                            color: row.status === "Disponible" ? "#00C48C" : "#D97706",
                            padding: "0.25rem 0.75rem",
                            borderRadius: "9999px",
                            fontSize: "0.74rem",
                            fontWeight: 700,
                          }}
                        >
                          {row.status}
                        </span>
                      </td>

                      {/* Acción Cotizar */}
                      <td style={{ padding: "1rem 1.25rem", textAlign: "center" }}>
                        <button
                          type="button"
                          onClick={() => setSelectedUnitForQuote(row)}
                          style={{
                            backgroundColor: "#1B3047",
                            color: "#FFFFFF",
                            padding: "0.45rem 1rem",
                            borderRadius: "9999px",
                            border: "none",
                            fontSize: "0.78rem",
                            fontWeight: 700,
                            cursor: "pointer",
                            boxShadow: "0 2px 6px rgba(27, 48, 71, 0.15)",
                          }}
                        >
                          Cotizar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </main>

      {/* 8. MODAL DE COTIZACIÓN PARA CLIENTES PÚBLICOS */}
      {selectedUnitForQuote && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(15, 23, 42, 0.65)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
            padding: "1rem",
            backdropFilter: "blur(4px)",
          }}
        >
          <div
            style={{
              backgroundColor: "#FFFFFF",
              borderRadius: "1.5rem",
              width: "100%",
              maxWidth: "520px",
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
              padding: "2rem",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.25rem" }}>
              <div>
                <span style={{ fontSize: "0.75rem", fontWeight: 800, color: "#00C48C", textTransform: "uppercase" }}>
                  Solicitud de Cotización Directa
                </span>
                <h2 style={{ fontSize: "1.35rem", fontWeight: 800, color: "#1F3652", margin: "0.2rem 0 0" }}>
                  Unidad {selectedUnitForQuote.unit} • {projectName}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setSelectedUnitForQuote(null)}
                style={{ background: "#F1F5F9", border: "none", color: "#64748B", cursor: "pointer", width: "32px", height: "32px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Resumen Unidad */}
            <div style={{ backgroundColor: "#F8FAFC", borderRadius: "0.85rem", padding: "1rem", border: "1px solid #E2E8F0", marginBottom: "1.25rem", fontSize: "0.82rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.3rem" }}>
                <span style={{ color: "#64748B" }}>Superficie:</span>
                <strong style={{ color: "#1F3652" }}>{selectedUnitForQuote.areaM2} m²</strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "#64748B" }}>Precio de Lista:</span>
                <strong style={{ color: "#00C48C", fontSize: "0.95rem" }}>{formatMoney(selectedUnitForQuote.price)}</strong>
              </div>
            </div>

            <form onSubmit={handleSubmitLead}>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem", marginBottom: "1.5rem" }}>
                <div>
                  <label style={{ fontSize: "0.78rem", fontWeight: 700, color: "#1F3652", display: "block", marginBottom: "0.3rem" }}>
                    Nombre Completo
                  </label>
                  <input
                    type="text"
                    placeholder="Ej. Roberto Martínez"
                    value={leadForm.name}
                    onChange={(e) => setLeadForm({ ...leadForm, name: e.target.value })}
                    style={{
                      width: "100%",
                      padding: "0.65rem 0.85rem",
                      borderRadius: "0.6rem",
                      border: "1px solid #CBD5E1",
                      fontSize: "0.85rem",
                      color: "#1F3652",
                    }}
                    required
                  />
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                  <div>
                    <label style={{ fontSize: "0.78rem", fontWeight: 700, color: "#1F3652", display: "block", marginBottom: "0.3rem" }}>
                      Correo Electrónico
                    </label>
                    <input
                      type="email"
                      placeholder="correo@ejemplo.com"
                      value={leadForm.email}
                      onChange={(e) => setLeadForm({ ...leadForm, email: e.target.value })}
                      style={{
                        width: "100%",
                        padding: "0.65rem 0.85rem",
                        borderRadius: "0.6rem",
                        border: "1px solid #CBD5E1",
                        fontSize: "0.85rem",
                        color: "#1F3652",
                      }}
                      required
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: "0.78rem", fontWeight: 700, color: "#1F3652", display: "block", marginBottom: "0.3rem" }}>
                      Teléfono WhatsApp
                    </label>
                    <PhoneInput
                      value={leadForm.phone}
                      onChange={(fullVal) => setLeadForm({ ...leadForm, phone: fullVal })}
                      required
                    />
                  </div>
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem" }}>
                <button
                  type="button"
                  onClick={() => setSelectedUnitForQuote(null)}
                  style={{
                    padding: "0.65rem 1.4rem",
                    borderRadius: "9999px",
                    border: "1px solid #CBD5E1",
                    backgroundColor: "#FFFFFF",
                    color: "#64748B",
                    fontSize: "0.82rem",
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "0.45rem",
                    backgroundColor: "#1B3047",
                    color: "#FFFFFF",
                    padding: "0.65rem 1.75rem",
                    borderRadius: "9999px",
                    fontSize: "0.85rem",
                    fontWeight: 700,
                    border: "none",
                    cursor: "pointer",
                    boxShadow: "0 4px 12px rgba(27, 48, 71, 0.2)",
                  }}
                >
                  <Send size={15} /> Solicitar Cotización
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 9. FOOTER INSTITUCIONAL */}
      <MarketplaceFooter />
    </div>
  );
}
