"use client";

import React, { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import {
  Search,
  MapPin,
  Building2,
  Layers,
  ArrowRight,
  Tag,
  Share2,
  Check,
  PlusCircle,
  Home,
  Sparkles,
} from "lucide-react";
import { MarketplaceNav } from "../../components/marketplace/marketplace-nav";
import { MarketplaceFooter } from "../../components/marketplace/marketplace-footer";
import { useProject } from "../../context/project-context";

export default function PublicMarketplacePage() {
  const { projects, developerName, formatMoney } = useProject();
  const [developerLogo, setDeveloperLogo] = useState<string | null>(null);
  const [developerCity, setDeveloperCity] = useState<string>("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedDev = localStorage.getItem("devio_developer_onboarding") || sessionStorage.getItem("devio_developer_onboarding");
      if (storedDev) {
        try {
          const parsed = JSON.parse(storedDev);
          if (parsed.logoUrl) setDeveloperLogo(parsed.logoUrl);
          if (parsed.city) setDeveloperCity(parsed.city);
        } catch (e) {}
      }
    }
  }, []);

  // Normalize projects for public marketplace presentation
  const publicProjects = useMemo(() => {
    return projects.map((p) => {
      const avail =
        p.availableUnits !== undefined
          ? p.availableUnits
          : (p.unitsInventory || []).filter((u) => u.status === "DISPONIBLE").length;
      
      const total = p.totalUnits || (p.unitsInventory || []).length || 0;
      
      const minPrice =
        (p.unitsInventory || []).length > 0
          ? Math.min(...(p.unitsInventory || []).map((u) => u.price || 0))
          : p.metrics?.precioPromedio || 0;

      const totalArea =
        (p.unitsInventory || []).reduce((acc, u) => acc + (u.areaM2 || 0), 0) || 2500;

      const address =
        p.id === "p-1"
          ? "Av Pablo Neruda 3809, Providencia"
          : p.id === "p-2"
          ? "Av Empresarios 150, Puerta de Hierro"
          : "Ubicación Residencial";

      const city =
        p.id === "p-1"
          ? "Guadalajara"
          : p.id === "p-2"
          ? "Zapopan"
          : developerCity || "México";

      return {
        id: p.id,
        slug: p.id,
        name: p.name,
        type: (p.type as "Vertical" | "Horizontal" | "Mixto") || "Vertical",
        address,
        city,
        areaM2: totalArea,
        minPrice,
        totalUnits: total,
        availableUnits: avail,
        image:
          p.image ||
          "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1200&q=80",
        status: (p.progressPct > 90
          ? "Entrega Inmediata"
          : p.progressPct > 20
          ? "Construcción"
          : "Preventa") as "Preventa" | "Construcción" | "Entrega Inmediata",
      };
    });
  }, [projects, developerCity]);

  // Dynamic unique locations & property types for filters
  const uniqueLocations = useMemo(() => {
    const locs = Array.from(new Set(publicProjects.map((p) => p.city))).filter(Boolean);
    return locs;
  }, [publicProjects]);

  // Filters State
  const [searchName, setSearchName] = useState("");
  const [selectedLocation, setSelectedLocation] = useState("ALL");
  const [selectedType, setSelectedType] = useState("ALL");

  // Filtered Projects
  const filteredProjects = useMemo(() => {
    return publicProjects.filter((proj) => {
      const matchName =
        proj.name.toLowerCase().includes(searchName.toLowerCase()) ||
        proj.address.toLowerCase().includes(searchName.toLowerCase());

      const matchLoc =
        selectedLocation === "ALL" || proj.city.toLowerCase() === selectedLocation.toLowerCase();
      const matchType =
        selectedType === "ALL" || proj.type.toLowerCase() === selectedType.toLowerCase();

      return matchName && matchLoc && matchType;
    });
  }, [publicProjects, searchName, selectedLocation, selectedType]);

  const totalUnitsAvailable = publicProjects.reduce((acc, p) => acc + p.availableUnits, 0);

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#F8FAFC", display: "flex", flexDirection: "column" }}>
      {/* 1. FLOATING NAVBAR */}
      <MarketplaceNav activePage="inicio" />

      {/* MAIN CONTAINER */}
      <main style={{ maxWidth: "1280px", width: "100%", margin: "0 auto", padding: "0 1.5rem", flex: 1 }}>
        
        {/* 2. HERO BANNER */}
        <div
          style={{
            position: "relative",
            borderRadius: "1.5rem",
            overflow: "hidden",
            boxShadow: "0 10px 30px rgba(0, 0, 0, 0.08)",
            marginBottom: "2rem",
            backgroundColor: "#162B3F",
            minHeight: "260px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "flex-end",
            padding: "2.5rem 3rem",
          }}
        >
          {/* Background image overlay */}
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundImage: publicProjects[0]?.image
                ? `url('${publicProjects[0].image}')`
                : "url('https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1800&q=80')",
              backgroundSize: "cover",
              backgroundPosition: "center",
              opacity: 0.25,
            }}
          />

          <div style={{ position: "relative", zIndex: 2, display: "flex", flexDirection: "column", gap: "1.25rem" }}>
            {/* Developer Logo / Name Card */}
            <div
              style={{
                backgroundColor: "#FFFFFF",
                padding: "0.6rem 1.25rem",
                borderRadius: "0.85rem",
                boxShadow: "0 4px 15px rgba(0, 0, 0, 0.1)",
                display: "inline-flex",
                alignItems: "center",
                gap: "0.75rem",
                maxWidth: "340px",
              }}
            >
              {developerLogo ? (
                <img
                  src={developerLogo}
                  alt={developerName}
                  style={{ width: "32px", height: "32px", objectFit: "contain", borderRadius: "6px" }}
                />
              ) : (
                <Building2 size={24} color="#C7B28B" />
              )}
              <div>
                <strong style={{ fontSize: "0.88rem", color: "#1F3652", display: "block", letterSpacing: "0.05em" }}>
                  {(developerName || "Desarrolladora").toUpperCase()}
                </strong>
                <span style={{ fontSize: "0.65rem", color: "#64748B", textTransform: "uppercase" }}>
                  Catálogo Oficial de Desarrollos
                </span>
              </div>
            </div>

            {/* Title */}
            <div>
              <h1 style={{ fontSize: "2rem", fontWeight: 800, color: "#FFFFFF", margin: "0 0 0.35rem 0", letterSpacing: "-0.02em" }}>
                Proyectos Disponibles
              </h1>
              <div style={{ width: "48px", height: "3px", backgroundColor: "#C7B28B", borderRadius: "2px" }} />
            </div>

            {/* 3 Metric counters */}
            <div style={{ display: "flex", alignItems: "center", gap: "1rem", flexWrap: "wrap" }}>
              <div
                style={{
                  backgroundColor: "rgba(255, 255, 255, 0.12)",
                  backdropFilter: "blur(8px)",
                  padding: "0.5rem 1rem",
                  borderRadius: "0.75rem",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.6rem",
                  color: "#FFFFFF",
                  border: "1px solid rgba(255, 255, 255, 0.15)",
                }}
              >
                <Building2 size={18} color="#C7B28B" />
                <span style={{ fontSize: "0.82rem" }}>
                  <strong>{publicProjects.length}</strong> {publicProjects.length === 1 ? "Proyecto" : "Proyectos"}
                </span>
              </div>

              <div
                style={{
                  backgroundColor: "rgba(255, 255, 255, 0.12)",
                  backdropFilter: "blur(8px)",
                  padding: "0.5rem 1rem",
                  borderRadius: "0.75rem",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.6rem",
                  color: "#FFFFFF",
                  border: "1px solid rgba(255, 255, 255, 0.15)",
                }}
              >
                <Layers size={18} color="#C7B28B" />
                <span style={{ fontSize: "0.82rem" }}>
                  <strong>{totalUnitsAvailable}</strong> Unidades Disponibles
                </span>
              </div>

              <div
                style={{
                  backgroundColor: "rgba(255, 255, 255, 0.12)",
                  backdropFilter: "blur(8px)",
                  padding: "0.5rem 1rem",
                  borderRadius: "0.75rem",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.6rem",
                  color: "#FFFFFF",
                  border: "1px solid rgba(255, 255, 255, 0.15)",
                }}
              >
                <MapPin size={18} color="#C7B28B" />
                <span style={{ fontSize: "0.82rem" }}>
                  <strong>{uniqueLocations.length || (publicProjects.length > 0 ? 1 : 0)}</strong> {uniqueLocations.length === 1 ? "Ubicación" : "Ubicaciones"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* 3. FILTERS ROW */}
        {publicProjects.length > 0 && (
          <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr 1fr", gap: "1rem", marginBottom: "2.5rem" }}>
            
            {/* Buscar por nombre */}
            <div style={{ position: "relative" }}>
              <Search
                size={18}
                style={{
                  position: "absolute",
                  left: "1rem",
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "#94A3B8",
                  pointerEvents: "none",
                }}
              />
              <input
                type="text"
                placeholder="Buscar por nombre o ubicación"
                value={searchName}
                onChange={(e) => setSearchName(e.target.value)}
                style={{
                  width: "100%",
                  padding: "0.75rem 1rem 0.75rem 2.75rem",
                  borderRadius: "0.75rem",
                  border: "1px solid #E2E8F0",
                  backgroundColor: "#FFFFFF",
                  fontSize: "0.85rem",
                  color: "#1F3652",
                  outline: "none",
                  boxShadow: "0 1px 3px rgba(0, 0, 0, 0.02)",
                }}
              />
            </div>

            {/* Ubicación */}
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.35rem", marginBottom: "0.3rem", fontSize: "0.75rem", fontWeight: 700, color: "#1F3652" }}>
                <MapPin size={13} color="#64748B" /> Ubicación
              </div>
              <select
                value={selectedLocation}
                onChange={(e) => setSelectedLocation(e.target.value)}
                style={{
                  width: "100%",
                  padding: "0.7rem 0.85rem",
                  borderRadius: "0.75rem",
                  border: "1px solid #E2E8F0",
                  backgroundColor: "#FFFFFF",
                  fontSize: "0.85rem",
                  color: "#1F3652",
                  outline: "none",
                }}
              >
                <option value="ALL">Todas las ubicaciones</option>
                {uniqueLocations.map((loc) => (
                  <option key={loc} value={loc}>
                    {loc}
                  </option>
                ))}
              </select>
            </div>

            {/* Tipo de Propiedad */}
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.35rem", marginBottom: "0.3rem", fontSize: "0.75rem", fontWeight: 700, color: "#1F3652" }}>
                <Building2 size={13} color="#64748B" /> Tipo de Propiedad
              </div>
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                style={{
                  width: "100%",
                  padding: "0.7rem 0.85rem",
                  borderRadius: "0.75rem",
                  border: "1px solid #E2E8F0",
                  backgroundColor: "#FFFFFF",
                  fontSize: "0.85rem",
                  color: "#1F3652",
                  outline: "none",
                }}
              >
                <option value="ALL">Todos los tipos</option>
                <option value="Vertical">Vertical (Departamentos)</option>
                <option value="Horizontal">Horizontal (Residencial)</option>
                <option value="Mixto">Mixto</option>
              </select>
            </div>
          </div>
        )}

        {/* 4. RESULTADOS SECTION */}
        <div style={{ marginBottom: "1.5rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
            <h2 style={{ fontSize: "1.3rem", fontWeight: 800, color: "#1F3652", margin: 0 }}>
              Resultados ({filteredProjects.length})
            </h2>
            {publicProjects.length > 0 && (
              <span style={{ fontSize: "0.82rem", color: "#64748B" }}>
                Mostrando proyectos de <strong>{developerName}</strong>
              </span>
            )}
          </div>

          {/* EMPTY STATE: When 0 projects exist for developer */}
          {publicProjects.length === 0 ? (
            <div
              style={{
                backgroundColor: "#FFFFFF",
                borderRadius: "1.5rem",
                padding: "4rem 2rem",
                textAlign: "center",
                border: "1px dashed #CBD5E1",
                boxShadow: "0 4px 20px rgba(0,0,0,0.02)",
                maxWidth: "680px",
                margin: "1rem auto 3rem auto",
              }}
            >
              <div
                style={{
                  width: "72px",
                  height: "72px",
                  borderRadius: "50%",
                  backgroundColor: "#F1F5F9",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 1.5rem auto",
                  color: "#94A3B8",
                }}
              >
                <Building2 size={36} />
              </div>
              <h3 style={{ fontSize: "1.35rem", fontWeight: 800, color: "#1F3652", margin: "0 0 0.5rem 0" }}>
                Esta desarrolladora aún no tiene proyectos publicados
              </h3>
              <p style={{ fontSize: "0.9rem", color: "#64748B", maxWidth: "480px", margin: "0 auto 1.75rem auto", lineHeight: 1.6 }}>
                Los proyectos residenciales y comerciales registrados en Devio por <strong>{developerName}</strong> aparecerán automáticamente aquí para que tus prospectos puedan explorar tu inventario y solicitar cotizaciones.
              </p>
              <div style={{ display: "flex", justifyContent: "center", gap: "1rem", flexWrap: "wrap" }}>
                <Link
                  href="/onboarding/project"
                  style={{
                    backgroundColor: "#1B3047",
                    color: "#FFFFFF",
                    padding: "0.75rem 1.5rem",
                    borderRadius: "9999px",
                    fontSize: "0.88rem",
                    fontWeight: 700,
                    textDecoration: "none",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "0.5rem",
                    boxShadow: "0 4px 12px rgba(27, 48, 71, 0.15)",
                  }}
                >
                  <PlusCircle size={16} /> Crear Primer Proyecto
                </Link>
                <Link
                  href="/dashboard"
                  style={{
                    backgroundColor: "#FFFFFF",
                    color: "#1B3047",
                    border: "1px solid #CBD5E1",
                    padding: "0.75rem 1.5rem",
                    borderRadius: "9999px",
                    fontSize: "0.88rem",
                    fontWeight: 700,
                    textDecoration: "none",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "0.5rem",
                  }}
                >
                  <Home size={16} /> Ir al Dashboard
                </Link>
              </div>
            </div>
          ) : filteredProjects.length === 0 ? (
            /* EMPTY STATE: Filter didn't match */
            <div
              style={{
                backgroundColor: "#FFFFFF",
                borderRadius: "1.25rem",
                padding: "3rem 2rem",
                textAlign: "center",
                border: "1px solid #E2E8F0",
              }}
            >
              <Search size={32} color="#94A3B8" style={{ margin: "0 auto 1rem auto" }} />
              <h3 style={{ fontSize: "1.1rem", fontWeight: 700, color: "#1F3652", margin: "0 0 0.4rem 0" }}>
                No encontramos proyectos que coincidan con tu búsqueda
              </h3>
              <p style={{ fontSize: "0.85rem", color: "#64748B", margin: "0 0 1.25rem 0" }}>
                Intenta cambiando los filtros de ubicación, tipo de propiedad o término de búsqueda.
              </p>
              <button
                type="button"
                onClick={() => {
                  setSearchName("");
                  setSelectedLocation("ALL");
                  setSelectedType("ALL");
                }}
                style={{
                  backgroundColor: "#F1F5F9",
                  color: "#1F3652",
                  padding: "0.5rem 1.25rem",
                  borderRadius: "9999px",
                  border: "none",
                  fontSize: "0.82rem",
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                Limpiar Filtros
              </button>
            </div>
          ) : (
            /* Projects Grid */
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "1.75rem" }}>
              {filteredProjects.map((project) => (
                <div
                  key={project.id}
                  style={{
                    backgroundColor: "#FFFFFF",
                    borderRadius: "1.25rem",
                    overflow: "hidden",
                    boxShadow: "0 4px 20px rgba(0, 0, 0, 0.04)",
                    border: "1px solid #E2E8F0",
                    display: "flex",
                    flexDirection: "column",
                    transition: "transform 0.2s ease, box-shadow 0.2s ease",
                  }}
                >
                  {/* Image / Header Block */}
                  <div
                    style={{
                      position: "relative",
                      height: "200px",
                      backgroundColor: "#162B3F",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      overflow: "hidden",
                    }}
                  >
                    {/* Background photo */}
                    <img
                      src={project.image}
                      alt={project.name}
                      style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                        opacity: 0.65,
                      }}
                    />

                    {/* Badge Tipo (Vertical / Horizontal) */}
                    <span
                      style={{
                        position: "absolute",
                        top: "1rem",
                        left: "1rem",
                        backgroundColor: "#1B3047",
                        color: "#FFFFFF",
                        padding: "0.3rem 0.75rem",
                        borderRadius: "9999px",
                        fontSize: "0.72rem",
                        fontWeight: 700,
                        zIndex: 3,
                        boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
                      }}
                    >
                      {project.type}
                    </span>

                    {/* Badge Status */}
                    <span
                      style={{
                        position: "absolute",
                        top: "1rem",
                        right: "1rem",
                        backgroundColor: "rgba(255, 255, 255, 0.92)",
                        color: "#1F3652",
                        padding: "0.3rem 0.75rem",
                        borderRadius: "9999px",
                        fontSize: "0.72rem",
                        fontWeight: 800,
                        zIndex: 3,
                      }}
                    >
                      {project.status}
                    </span>

                    {/* Logo / Center Overlay */}
                    <div style={{ textAlign: "center", padding: "1.5rem", position: "relative", zIndex: 2 }}>
                      <div
                        style={{
                          width: "56px",
                          height: "56px",
                          margin: "0 auto 0.5rem auto",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          borderRadius: "1rem",
                          backgroundColor: "#FFFFFF",
                          boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                        }}
                      >
                        <Building2 size={28} color="#C7B28B" />
                      </div>
                      <strong
                        style={{
                          fontSize: "1.25rem",
                          fontWeight: 900,
                          color: "#FFFFFF",
                          letterSpacing: "0.08em",
                          display: "block",
                          textShadow: "0 2px 8px rgba(0,0,0,0.6)",
                        }}
                      >
                        {project.name.toUpperCase()}
                      </strong>
                    </div>
                  </div>

                  {/* Body Details */}
                  <div style={{ padding: "1.5rem", display: "flex", flexDirection: "column", gap: "1rem", flex: 1 }}>
                    <div>
                      <h3 style={{ fontSize: "1.2rem", fontWeight: 800, color: "#1F3652", margin: "0 0 0.4rem 0" }}>
                        {project.name}
                      </h3>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", fontSize: "0.82rem", color: "#64748B" }}>
                        <MapPin size={14} color="#64748B" />
                        <span>{project.address}</span>
                      </div>
                    </div>

                    {/* Badges: Units, Area and Price */}
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem" }}>
                        <div
                          style={{
                            backgroundColor: "#F1F5F9",
                            padding: "0.5rem 0.75rem",
                            borderRadius: "0.6rem",
                            fontSize: "0.78rem",
                            color: "#475569",
                            fontWeight: 600,
                            display: "flex",
                            alignItems: "center",
                            gap: "0.4rem",
                          }}
                        >
                          <Layers size={14} color="#64748B" />
                          <span>{project.availableUnits} Disp.</span>
                        </div>

                        <div
                          style={{
                            backgroundColor: "#F1F5F9",
                            padding: "0.5rem 0.75rem",
                            borderRadius: "0.6rem",
                            fontSize: "0.78rem",
                            color: "#475569",
                            fontWeight: 600,
                            display: "flex",
                            alignItems: "center",
                            gap: "0.4rem",
                          }}
                        >
                          <Building2 size={14} color="#64748B" />
                          <span>{project.areaM2} m²</span>
                        </div>
                      </div>

                      <div
                        style={{
                          backgroundColor: "rgba(0, 196, 140, 0.08)",
                          padding: "0.55rem 0.85rem",
                          borderRadius: "0.6rem",
                          fontSize: "0.82rem",
                          color: "#0B7A58",
                          fontWeight: 700,
                          display: "flex",
                          alignItems: "center",
                          gap: "0.4rem",
                        }}
                      >
                        <Tag size={14} color="#00C48C" />
                        <span>
                          {project.minPrice > 0 ? `Desde ${formatMoney(project.minPrice)}` : "Consultar precio"}
                        </span>
                      </div>
                    </div>

                    {/* Button: Explorar Proyecto */}
                    <div style={{ marginTop: "auto", paddingTop: "0.5rem" }}>
                      <Link
                        href={`/marketplace/${project.slug}`}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: "0.5rem",
                          backgroundColor: "#1B3047",
                          color: "#FFFFFF",
                          padding: "0.75rem 1.25rem",
                          borderRadius: "9999px",
                          fontSize: "0.85rem",
                          fontWeight: 700,
                          textDecoration: "none",
                          boxShadow: "0 4px 12px rgba(27, 48, 71, 0.15)",
                          transition: "all 0.15s ease",
                        }}
                      >
                        Explorar Proyecto <ArrowRight size={15} />
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </main>

      {/* 5. FOOTER INSTITUCIONAL */}
      <MarketplaceFooter />
    </div>
  );
}
