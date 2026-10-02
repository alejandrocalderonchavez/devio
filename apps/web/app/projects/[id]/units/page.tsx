"use client";

import React, { useState, useMemo, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Home,
  Building2,
  DollarSign,
  AlertTriangle,
  Search,
  X,
  Package,
  Layers,
  FileSpreadsheet,
  Download,
  ArrowUpDown,
  Edit3,
  Plus,
  Car,
  Archive,
  Sparkles,
  Edit2,
  Trash2,
  CheckCircle2,
  Eye,
  Maximize2,
  Upload,
  Image as ImageIcon,
  Check,
} from "lucide-react";
import * as XLSX from "xlsx";
import AppLayout from "../../../../components/layout/app-layout";
import { useProject } from "../../../../context/project-context";
import BulkPriceModal, { UnitItem } from "../../../../components/units/bulk-price-modal";
import EditInventoryGridModal from "../../../../components/units/edit-inventory-grid-modal";
import QuoteUnitWizardModal from "../../../../components/units/quote-unit-wizard-modal";
import UnitDetailHistoryModal from "../../../../components/units/unit-detail-history-modal";
import DownloadExportModal from "../../../../components/units/download-export-modal";
import UploadInventoryModal from "../../../../components/units/upload-inventory-modal";
import CreateSaleWizardModal from "../../../../components/sales/create-sale-wizard-modal";
import EditProjectModal from "../../../../components/projects/edit-project-modal";
import RegisterProgressWizardModal from "../../../../components/projects/register-progress-wizard-modal";
import { CoOwnersMiniCards } from "../../../../components/ui/co-owners-mini-cards";
import { ProjectAdditional, ProjectFloorPlan } from "@/data/projects-data";
import { generateAdditionalsExcelTemplate } from "@/lib/excel-utils";
import { exportTableToExcel } from "@/lib/export-utils";

export default function ProjectUnitsPage() {
  const router = useRouter();
  const params = useParams();
  const projectId = (params?.id as string) || "p-1";
  const {
    projects,
    getProject,
    currency,
    formatMoney,
    updateBulkPrices,
    updateUnit,
    updateMultipleUnits,
    bulkImportUnits,
    bulkImportAdditionals,
    unsellUnit,
    addSale,
    updateProjectProgress,
    updateProjectAdditionals,
    saveFloorPlanWithAssignments,
    deleteFloorPlan,
    showToast,
    hasPermission,
  } = useProject();

  const project = getProject(projectId);

  // Sub-Tab Activa: "units" | "additionals" | "floorPlans"
  const [activeTab, setActiveTab] = useState<"units" | "additionals" | "floorPlans">("units");

  // Modales del módulo de Unidades
  const [showBulkPriceModal, setShowBulkPriceModal] = useState(false);
  const [showEditInventoryModal, setShowEditInventoryModal] = useState(false);
  const [showQuoteModal, setShowQuoteModal] = useState(false);
  const [showUnitDetailModal, setShowUnitDetailModal] = useState(false);
  const [showDownloadModal, setShowDownloadModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedUnitForAction, setSelectedUnitForAction] = useState<UnitItem | null>(null);

  // Modales adicionales de proyecto
  const [showNewSaleModal, setShowNewSaleModal] = useState(false);
  const [showEditProjectModal, setShowEditProjectModal] = useState(false);
  const [showProgressModal, setShowProgressModal] = useState(false);

  // Filtros & Sorting para TAB UNIDADES
  const [unitStatusFilter, setUnitStatusFilter] = useState("ALL");
  const [unitSearchQuery, setUnitSearchQuery] = useState("");
  const [sortField, setSortField] = useState<"unit" | "type" | "areaM2" | "price" | "status" | "client">("unit");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  // Filtros & Estados para TAB ADICIONALES
  const [additionalCategoryFilter, setAdditionalCategoryFilter] = useState<string>("ALL");
  const [additionalStatusFilter, setAdditionalStatusFilter] = useState<string>("ALL");
  const [additionalSearchQuery, setAdditionalSearchQuery] = useState("");
  const [isAdditionalItemModalOpen, setIsAdditionalItemModalOpen] = useState(false);
  const [editingAdditionalItem, setEditingAdditionalItem] = useState<ProjectAdditional | null>(null);
  const [additionalFormName, setAdditionalFormName] = useState("");
  const [additionalFormCategory, setAdditionalFormCategory] = useState<ProjectAdditional["category"]>("bodega");
  const [additionalFormPrice, setAdditionalFormPrice] = useState<number>(150000);
  const [additionalFormArea, setAdditionalFormArea] = useState<number>(0);
  const [additionalFormStatus, setAdditionalFormStatus] = useState<ProjectAdditional["status"]>("DISPONIBLE");
  const [additionalFormNotes, setAdditionalFormNotes] = useState("");
  const additionalFileInputRef = useRef<HTMLInputElement>(null);

  // Filtros & Estados para TAB PLANTAS CONJUNTO
  const [floorPlanSearchQuery, setFloorPlanSearchQuery] = useState("");
  const [isFloorPlanModalOpen, setIsFloorPlanModalOpen] = useState(false);
  const [editingFloorPlanForm, setEditingFloorPlanForm] = useState<{
    id?: string;
    name: string;
    imageUrl: string;
    selectedUnitNumbers: string[];
  }>({
    name: "",
    imageUrl: "",
    selectedUnitNumbers: [],
  });
  const [previewFloorPlanImage, setPreviewFloorPlanImage] = useState<{ url: string; title: string } | null>(null);
  const floorPlanFileInputRef = useRef<HTMLInputElement>(null);

  const unitsList = useMemo(() => project?.unitsInventory || [], [project?.unitsInventory]);
  const additionalsList = useMemo(() => project?.additionals || [], [project?.additionals]);
  const floorPlansList = useMemo(() => project?.floorPlans || [], [project?.floorPlans]);

  // Handlers para Unidades
  const handleOpenUnitDetail = (unit: UnitItem) => {
    setSelectedUnitForAction(unit);
    setShowUnitDetailModal(true);
  };

  const handleOpenQuoteWizard = (unit: UnitItem) => {
    setSelectedUnitForAction(unit);
    setShowQuoteModal(true);
  };

  const handleNavigateToClient = (unit: UnitItem, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();

    // 1. Buscar en project.sales
    const matchedSale = (project?.sales || []).find(
      (s) =>
        s.status !== "CANCELADA" &&
        (s.unit === unit.unit || (typeof s.unit === "object" && (s.unit as any)?.unitNumber === unit.unit))
    );

    if (matchedSale) {
      if (matchedSale.coOwners && matchedSale.coOwners.length > 0) {
        const primaryCo = matchedSale.coOwners.find((co: any) => co.isPrimary) || matchedSale.coOwners[0];
        const targetId = primaryCo?.id || primaryCo?.email || primaryCo?.name;
        if (targetId) {
          router.push(`/projects/${projectId}/clients/${encodeURIComponent(targetId)}?unit=${encodeURIComponent(unit.unit)}`);
          return;
        }
      }

      const targetId =
        (matchedSale.clientId && matchedSale.clientId !== "primary-1" ? matchedSale.clientId : null) ||
        (matchedSale as any).primaryClientId ||
        matchedSale.clientEmail ||
        matchedSale.clientName;

      if (targetId) {
        router.push(`/projects/${projectId}/clients/${encodeURIComponent(targetId)}?unit=${encodeURIComponent(unit.unit)}`);
        return;
      }
    }

    // 2. Buscar en unit.coOwners
    if (unit.coOwners && unit.coOwners.length > 0) {
      const primaryCo = unit.coOwners.find((co: any) => co.isPrimary) || unit.coOwners[0];
      const targetId = primaryCo?.id || primaryCo?.email || primaryCo?.name;
      if (targetId) {
        router.push(`/projects/${projectId}/clients/${encodeURIComponent(targetId)}?unit=${encodeURIComponent(unit.unit)}`);
        return;
      }
    }

    // 3. Buscar en project.clients
    const matchedClient = (project?.clients || []).find((c) =>
      c.ownedUnits?.some((ou) => ou.unit.toLowerCase().trim() === unit.unit.toLowerCase().trim())
    );
    if (matchedClient) {
      const targetId = matchedClient.id || matchedClient.email || matchedClient.name;
      router.push(`/projects/${projectId}/clients/${encodeURIComponent(targetId)}?unit=${encodeURIComponent(unit.unit)}`);
      return;
    }

    // 4. Si tiene nombre de cliente asignado
    if (unit.client && unit.client !== "-" && unit.client !== "Sin asignar") {
      router.push(`/projects/${projectId}/clients/${encodeURIComponent(unit.client)}?unit=${encodeURIComponent(unit.unit)}`);
      return;
    }

    // Fallback si no está vendida o no tiene cliente
    handleOpenUnitDetail(unit);
  };

  const handleApplyPriceAdjustment = (updatedUnits: UnitItem[], logSummary: string) => {
    if (!project) return;
    updateMultipleUnits(project.id, updatedUnits);
    showToast("Ajuste de Precios Aplicado", logSummary);
  };

  const handleSaveInventoryGrid = (updatedUnits: UnitItem[]) => {
    if (!project) return;
    updateMultipleUnits(project.id, updatedUnits);
    showToast("Inventario Actualizado", `Se guardaron los cambios en ${updatedUnits.length} unidades.`);
  };

  const handleSaveSingleUnit = (updatedFields: any) => {
    if (!project) return;
    if (selectedUnitForAction) {
      updateUnit(project.id, selectedUnitForAction.unit, updatedFields);
      showToast("Unidad Actualizada", `Se guardaron los cambios de la unidad ${selectedUnitForAction.unit}.`);
    }
  };

  // Handlers para Adicionales
  const handleOpenAddAdditionalModal = () => {
    setEditingAdditionalItem(null);
    setAdditionalFormName(`Adicional ${additionalsList.length + 1}`);
    setAdditionalFormCategory("estacionamiento");
    setAdditionalFormPrice(150000);
    setAdditionalFormArea(0);
    setAdditionalFormStatus("DISPONIBLE");
    setAdditionalFormNotes("");
    setIsAdditionalItemModalOpen(true);
  };

  const handleOpenEditAdditionalModal = (item: ProjectAdditional) => {
    if (item.status !== "DISPONIBLE") {
      alert(`Solo se pueden editar adicionales con estatus Disponible. Este adicional está: ${item.status}.`);
      return;
    }
    setEditingAdditionalItem(item);
    setAdditionalFormName(item.name);
    setAdditionalFormCategory(item.category);
    setAdditionalFormPrice(item.price);
    setAdditionalFormArea(item.areaM2 || 0);
    setAdditionalFormStatus(item.status);
    setAdditionalFormNotes(item.notes || "");
    setIsAdditionalItemModalOpen(true);
  };

  const handleSaveAdditionalItemModal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!project || !additionalFormName.trim()) return;

    let updatedList: ProjectAdditional[] = [];
    if (editingAdditionalItem) {
      updatedList = additionalsList.map((item) =>
        item.id === editingAdditionalItem.id
          ? {
              ...item,
              name: additionalFormName.trim(),
              category: additionalFormCategory,
              price: additionalFormPrice,
              areaM2: additionalFormArea,
              status: additionalFormStatus,
              notes: additionalFormNotes.trim(),
            }
          : item
      );
    } else {
      const newItem: ProjectAdditional = {
        id: `add-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        name: additionalFormName.trim(),
        category: additionalFormCategory,
        price: additionalFormPrice,
        areaM2: additionalFormArea,
        status: additionalFormStatus,
        notes: additionalFormNotes.trim(),
      };
      updatedList = [...additionalsList, newItem];
    }

    updateProjectAdditionals(project.id, updatedList);
    showToast("Adicional Guardado", `Se actualizó el catálogo de adicionales.`);
    setIsAdditionalItemModalOpen(false);
    setEditingAdditionalItem(null);
  };

  const handleDeleteAdditionalItem = (id: string) => {
    if (!project) return;
    const target = additionalsList.find((i) => i.id === id);
    if (target && target.status !== "DISPONIBLE") {
      alert(
        `No se puede eliminar ${target.name} porque ya está asignado a la unidad ${
          target.assignedToUnit || ""
        } o no está disponible.`
      );
      return;
    }
    if (confirm(`¿Estás seguro de eliminar el adicional "${target?.name || id}"?`)) {
      const updatedList = additionalsList.filter((i) => i.id !== id);
      updateProjectAdditionals(project.id, updatedList);
      showToast("Adicional Eliminado", "Se retiró el adicional del catálogo.");
    }
  };

  const handleBulkUploadAdditionals = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!project) return;
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      let rawRows: any[][] = [];
      const isCsv = file.name.endsWith(".csv") || file.type.includes("csv") || file.type.includes("text");
      if (isCsv) {
        const text = await file.text();
        const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
        rawRows = lines.map((line) =>
          line.split(",").map((c) => c.replace(/^["']|["']$/g, "").trim())
        );
      } else {
        const buffer = await file.arrayBuffer();
        const workbook = XLSX.read(buffer, { type: "array" });
        const sheetName =
          workbook.SheetNames.find((s) => s.toLowerCase().includes("adicional")) ||
          workbook.SheetNames[0];
        if (sheetName) {
          const worksheet = workbook.Sheets[sheetName];
          if (worksheet) {
            const rawJson = XLSX.utils.sheet_to_json<any[]>(worksheet, { header: 1 });
            rawRows = rawJson.filter(
              (r) => Array.isArray(r) && r.some((c) => c !== undefined && c !== null && String(c).trim() !== "")
            );
          }
        }
      }

      if (rawRows.length === 0) {
        alert("El archivo está vacío o no contiene filas válidas.");
        return;
      }

      const firstRow = rawRows[0] || [];
      const isHeader = firstRow.some((h) =>
        /nombre|identificador|tipo|categoria|precio|estado|status|notas/i.test(String(h))
      );
      const dataRows = isHeader ? rawRows.slice(1) : rawRows;

      const existingNamesMap = new Map<string, number>();
      additionalsList.forEach((a, idx) => existingNamesMap.set(a.name.toLowerCase().trim(), idx));

      const updatedList = [...additionalsList];

      dataRows.forEach((row, rIdx) => {
        const rawName = String(row[0] || `Adicional ${additionalsList.length + rIdx + 1}`).trim();
        const rawCat = String(row[1] || "").toLowerCase().trim();
        let cat: ProjectAdditional["category"] = "otro";
        if (
          rawCat.includes("estacionamiento") ||
          rawCat.includes("cajon") ||
          rawCat.includes("cajón") ||
          rawCat.includes("auto") ||
          rawCat.includes("parking")
        ) {
          cat = "estacionamiento";
        } else if (rawCat.includes("bodega") || rawCat.includes("storage")) {
          cat = "bodega";
        } else if (rawCat.includes("acabado") || rawCat.includes("paquete")) {
          cat = "acabados";
        } else if (rawCat.includes("terraza") || rawCat.includes("balcon") || rawCat.includes("balcón") || rawCat.includes("roof")) {
          cat = "terraza";
        }

        const price = parseFloat(String(row[2] || "").replace(/[^0-9.-]+/g, "")) || 150000;
        const rawStatus = String(row[3] || "").toLowerCase().trim();
        let status: ProjectAdditional["status"] = "DISPONIBLE";
        if (rawStatus.includes("vend") || rawStatus.includes("sold")) status = "VENDIDO";
        else if (rawStatus.includes("asig") || rawStatus.includes("apart") || rawStatus.includes("reserv")) status = "ASIGNADO";

        const notes = String(row[4] || "").trim();
        const area = parseFloat(String(row[5] || "").replace(/[^0-9.-]+/g, "")) || 0;

        const itemObj: ProjectAdditional = {
          id: `add-imp-${Date.now()}-${rIdx}`,
          name: rawName,
          category: cat,
          price,
          areaM2: area > 0 ? area : undefined,
          status,
          notes,
        };

        const key = rawName.toLowerCase();
        if (existingNamesMap.has(key)) {
          const idx = existingNamesMap.get(key)!;
          if (updatedList[idx] && updatedList[idx].status === "DISPONIBLE") {
            updatedList[idx] = { ...updatedList[idx], ...itemObj, id: updatedList[idx].id };
          }
        } else {
          updatedList.push(itemObj);
          existingNamesMap.set(key, updatedList.length - 1);
        }
      });

      updateProjectAdditionals(project.id, updatedList);
      showToast("Carga Exitosa", `Se importaron/actualizaron ${dataRows.length} adicionales.`);
    } catch (err) {
      console.error(err);
      alert("Error procesando el archivo XLSX/CSV.");
    } finally {
      if (additionalFileInputRef.current) {
        additionalFileInputRef.current.value = "";
      }
    }
  };

  const handleExportAdditionalsExcel = () => {
    const data = additionalsList.map((a) => ({
      Nombre: a.name,
      Categoría: a.category,
      Precio: a.price,
      SuperficieM2: a.areaM2 || 0,
      Estado: a.status,
      AsignadoAUnidad: a.assignedToUnit || "-",
      Notas: a.notes || "-",
    }));
    exportTableToExcel(data, `Devio_Adicionales_${project?.name || "Proyecto"}`);
  };

  // Handlers para Plantas de Conjunto
  const handleOpenCreateFloorPlan = () => {
    setEditingFloorPlanForm({
      name: `Planta Tipo ${String.fromCharCode(65 + floorPlansList.length)}`,
      imageUrl: "",
      selectedUnitNumbers: [],
    });
    setIsFloorPlanModalOpen(true);
  };

  const handleOpenEditFloorPlan = (plan: ProjectFloorPlan) => {
    const assigned = unitsList.filter((u) => u.floorPlan === plan.name).map((u) => u.unit);
    setEditingFloorPlanForm({
      id: plan.id,
      name: plan.name,
      imageUrl: plan.imageUrl || "",
      selectedUnitNumbers: assigned,
    });
    setIsFloorPlanModalOpen(true);
  };

  const handleSaveFloorPlan = () => {
    if (!project) return;
    if (!editingFloorPlanForm.name.trim()) {
      showToast("Nombre requerido", "Ingresa un nombre para la planta.", "warning");
      return;
    }

    const targetId = editingFloorPlanForm.id || `fp-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const planToSave: ProjectFloorPlan = {
      id: targetId,
      name: editingFloorPlanForm.name.trim(),
      imageUrl: editingFloorPlanForm.imageUrl,
    };

    saveFloorPlanWithAssignments(project.id, planToSave, editingFloorPlanForm.selectedUnitNumbers);
    setIsFloorPlanModalOpen(false);
    showToast("Planta Guardada", `Se guardó "${planToSave.name}" y se asignó a ${editingFloorPlanForm.selectedUnitNumbers.length} unidades.`);
  };

  const handleDeleteFloorPlan = (plan: ProjectFloorPlan) => {
    if (!project) return;
    if (confirm(`¿Estás seguro de eliminar la planta "${plan.name}"? Las unidades asignadas quedarán sin planta.`)) {
      deleteFloorPlan(project.id, plan.id);
      showToast("Planta Eliminada", `Se eliminó "${plan.name}".`);
    }
  };

  const handleFloorPlanImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        if (ev.target?.result) {
          setEditingFloorPlanForm((prev) => ({
            ...prev,
            imageUrl: ev.target!.result as string,
          }));
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "estacionamiento":
        return <Car size={15} color="#2F80ED" />;
      case "bodega":
        return <Archive size={15} color="#F59E0B" />;
      case "acabados":
        return <Sparkles size={15} color="#8B5CF6" />;
      case "terraza":
        return <Layers size={15} color="#059669" />;
      default:
        return <Package size={15} color="#64748B" />;
    }
  };

  if (!project) return null;

  if (!hasPermission("units.view")) {
    return (
      <AppLayout activeProjectId={projectId} projectSubTab="units">
        <main style={{ padding: "3rem 2rem", flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center" }}>
          <div style={{ width: "64px", height: "64px", borderRadius: "50%", backgroundColor: "#FEE2E2", color: "#DC2626", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "1rem" }}>
            <AlertTriangle size={32} />
          </div>
          <h2 style={{ fontSize: "1.3rem", fontWeight: 800, color: "#1F3652", marginBottom: "0.5rem" }}>
            Módulo No Autorizado
          </h2>
          <p style={{ fontSize: "0.85rem", color: "#64748B", maxWidth: "420px", lineHeight: 1.5 }}>
            Tu usuario no cuenta con el permiso requerido (<strong>units.view</strong>) para consultar el inventario de unidades de este proyecto.
          </p>
        </main>
      </AppLayout>
    );
  }

  // Filtrado de Adicionales
  const filteredAdditionals = additionalsList.filter((item) => {
    if (additionalCategoryFilter !== "ALL" && item.category !== additionalCategoryFilter) return false;
    if (additionalStatusFilter === "DISPONIBLE" && item.status !== "DISPONIBLE") return false;
    if (additionalStatusFilter === "ASIGNADO" && item.status === "DISPONIBLE") return false;
    if (additionalSearchQuery.trim()) {
      const q = additionalSearchQuery.toLowerCase();
      const matchName = item.name.toLowerCase().includes(q);
      const matchUnit = (item.assignedToUnit || "").toLowerCase().includes(q);
      const matchNotes = (item.notes || "").toLowerCase().includes(q);
      if (!matchName && !matchUnit && !matchNotes) return false;
    }
    return true;
  });

  // Filtrado de Plantas de Conjunto
  const filteredFloorPlans = floorPlansList.filter((plan) => {
    if (!floorPlanSearchQuery.trim()) return true;
    const q = floorPlanSearchQuery.toLowerCase();
    const matchName = plan.name.toLowerCase().includes(q);
    const assignedUnits = unitsList.filter((u) => u.floorPlan === plan.name);
    const matchUnit = assignedUnits.some((u) => u.unit.toLowerCase().includes(q));
    return matchName || matchUnit;
  });

  return (
    <AppLayout
      activeProjectId={projectId}
      projectSubTab="units"
      onOpenBulkPrice={() => setShowBulkPriceModal(true)}
      onOpenEditInventory={() => setShowEditInventoryModal(true)}
      onOpenNewSale={() => setShowNewSaleModal(true)}
      onOpenEditProject={() => setShowEditProjectModal(true)}
      onOpenProgress={() => setShowProgressModal(true)}
    >
      <main style={{ padding: "1.25rem 2rem 2.5rem 2rem", flex: 1, overflowY: "auto", minHeight: 0 }}>
        {/* TAB SWITCHER (Mismo menú y estilo que en Postventa) */}
        <div
          style={{
            display: "flex",
            gap: "0.5rem",
            borderBottom: "2px solid #EAEFF5",
            paddingBottom: "0.15rem",
            marginBottom: "1.25rem",
          }}
        >
          <button
            type="button"
            onClick={() => setActiveTab("units")}
            style={{
              padding: "0.65rem 1.25rem",
              borderRadius: "0.6rem 0.6rem 0 0",
              border: "none",
              backgroundColor: activeTab === "units" ? "#1B3047" : "transparent",
              color: activeTab === "units" ? "#FFFFFF" : "#64748B",
              fontWeight: 700,
              fontSize: "0.85rem",
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              cursor: "pointer",
              transition: "all 0.15s ease",
            }}
          >
            <Home size={16} />
            <span>Unidades ({unitsList.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("additionals")}
            style={{
              padding: "0.65rem 1.25rem",
              borderRadius: "0.6rem 0.6rem 0 0",
              border: "none",
              backgroundColor: activeTab === "additionals" ? "#1B3047" : "transparent",
              color: activeTab === "additionals" ? "#FFFFFF" : "#64748B",
              fontWeight: 700,
              fontSize: "0.85rem",
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              cursor: "pointer",
              transition: "all 0.15s ease",
            }}
          >
            <Package size={16} />
            <span>Adicionales ({additionalsList.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("floorPlans")}
            style={{
              padding: "0.65rem 1.25rem",
              borderRadius: "0.6rem 0.6rem 0 0",
              border: "none",
              backgroundColor: activeTab === "floorPlans" ? "#1B3047" : "transparent",
              color: activeTab === "floorPlans" ? "#FFFFFF" : "#64748B",
              fontWeight: 700,
              fontSize: "0.85rem",
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              cursor: "pointer",
              transition: "all 0.15s ease",
            }}
          >
            <Layers size={16} />
            <span>Plantas Conjunto ({floorPlansList.length})</span>
          </button>
        </div>

        {/* TOP DYNAMIC KPI CARDS (Se adaptan a la pestaña activa) */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "1rem", marginBottom: "1.25rem" }}>
          {activeTab === "units" && (
            <>
              {/* 1. Total de Unidades */}
              <div
                style={{
                  backgroundColor: "#FFFFFF",
                  borderRadius: "1.1rem",
                  padding: "1.1rem 1.25rem",
                  boxShadow: "0 2px 10px rgba(0,0,0,0.03)",
                  border: "1px solid rgba(22, 43, 63, 0.05)",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <div>
                  <span style={{ fontSize: "0.82rem", fontWeight: 600, color: "#64748B", display: "block", marginBottom: "0.35rem" }}>
                    Total de Unidades
                  </span>
                  <h3 style={{ fontSize: "1.6rem", fontWeight: 800, color: "#1F3652", margin: 0, lineHeight: 1 }}>
                    {unitsList.length}
                  </h3>
                </div>
                <div
                  style={{
                    width: "42px",
                    height: "42px",
                    borderRadius: "0.75rem",
                    backgroundColor: "rgba(31, 54, 82, 0.06)",
                    color: "#1F3652",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Home size={22} />
                </div>
              </div>

              {/* 2. Unidades Disponibles */}
              <div
                style={{
                  backgroundColor: "#FFFFFF",
                  borderRadius: "1.1rem",
                  padding: "1.1rem 1.25rem",
                  boxShadow: "0 2px 10px rgba(0,0,0,0.03)",
                  border: "1px solid rgba(22, 43, 63, 0.05)",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <div>
                  <span style={{ fontSize: "0.82rem", fontWeight: 600, color: "#64748B", display: "block", marginBottom: "0.35rem" }}>
                    Unidades Disponibles
                  </span>
                  <h3 style={{ fontSize: "1.6rem", fontWeight: 800, color: "#1F3652", margin: 0, lineHeight: 1 }}>
                    {unitsList.filter((u) => u.status === "DISPONIBLE").length}
                  </h3>
                </div>
                <div
                  style={{
                    width: "42px",
                    height: "42px",
                    borderRadius: "0.75rem",
                    backgroundColor: "rgba(47, 128, 237, 0.08)",
                    color: "#2F80ED",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Building2 size={22} />
                </div>
              </div>

              {/* 3. Unidades Vendidas */}
              <div
                style={{
                  backgroundColor: "#FFFFFF",
                  borderRadius: "1.1rem",
                  padding: "1.1rem 1.25rem",
                  boxShadow: "0 2px 10px rgba(0,0,0,0.03)",
                  border: "1px solid rgba(22, 43, 63, 0.05)",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <div>
                  <span style={{ fontSize: "0.82rem", fontWeight: 600, color: "#64748B", display: "block", marginBottom: "0.35rem" }}>
                    Unidades Vendidas
                  </span>
                  <h3 style={{ fontSize: "1.6rem", fontWeight: 800, color: "#1F3652", margin: 0, lineHeight: 1 }}>
                    {unitsList.filter((u) => u.status === "VENDIDA").length}
                  </h3>
                </div>
                <div
                  style={{
                    width: "42px",
                    height: "42px",
                    borderRadius: "0.75rem",
                    backgroundColor: "rgba(0, 196, 140, 0.1)",
                    color: "#00C48C",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <DollarSign size={22} />
                </div>
              </div>

              {/* 4. Unidades Bloqueadas */}
              <div
                style={{
                  backgroundColor: "#FFFFFF",
                  borderRadius: "1.1rem",
                  padding: "1.1rem 1.25rem",
                  boxShadow: "0 2px 10px rgba(0,0,0,0.03)",
                  border: "1px solid rgba(22, 43, 63, 0.05)",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <div>
                  <span style={{ fontSize: "0.82rem", fontWeight: 600, color: "#64748B", display: "block", marginBottom: "0.35rem" }}>
                    Unidades Bloqueadas
                  </span>
                  <h3 style={{ fontSize: "1.6rem", fontWeight: 800, color: "#1F3652", margin: 0, lineHeight: 1 }}>
                    {unitsList.filter((u) => u.status === "BLOQUEADA").length}
                  </h3>
                </div>
                <div
                  style={{
                    width: "42px",
                    height: "42px",
                    borderRadius: "0.75rem",
                    backgroundColor: "rgba(224, 83, 69, 0.1)",
                    color: "#E05345",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <AlertTriangle size={22} />
                </div>
              </div>
            </>
          )}

          {activeTab === "additionals" && (
            <>
              {/* 1. Total Adicionales */}
              <div
                style={{
                  backgroundColor: "#FFFFFF",
                  borderRadius: "1.1rem",
                  padding: "1.1rem 1.25rem",
                  boxShadow: "0 2px 10px rgba(0,0,0,0.03)",
                  border: "1px solid rgba(22, 43, 63, 0.05)",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <div>
                  <span style={{ fontSize: "0.82rem", fontWeight: 600, color: "#64748B", display: "block", marginBottom: "0.35rem" }}>
                    Total Adicionales
                  </span>
                  <h3 style={{ fontSize: "1.6rem", fontWeight: 800, color: "#1F3652", margin: 0, lineHeight: 1 }}>
                    {additionalsList.length}
                  </h3>
                </div>
                <div
                  style={{
                    width: "42px",
                    height: "42px",
                    borderRadius: "0.75rem",
                    backgroundColor: "rgba(31, 54, 82, 0.06)",
                    color: "#1F3652",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Package size={22} />
                </div>
              </div>

              {/* 2. Adicionales Disponibles */}
              <div
                style={{
                  backgroundColor: "#FFFFFF",
                  borderRadius: "1.1rem",
                  padding: "1.1rem 1.25rem",
                  boxShadow: "0 2px 10px rgba(0,0,0,0.03)",
                  border: "1px solid rgba(22, 43, 63, 0.05)",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <div>
                  <span style={{ fontSize: "0.82rem", fontWeight: 600, color: "#64748B", display: "block", marginBottom: "0.35rem" }}>
                    Disponibles
                  </span>
                  <h3 style={{ fontSize: "1.6rem", fontWeight: 800, color: "#1F3652", margin: 0, lineHeight: 1 }}>
                    {additionalsList.filter((a) => a.status === "DISPONIBLE").length}
                  </h3>
                </div>
                <div
                  style={{
                    width: "42px",
                    height: "42px",
                    borderRadius: "0.75rem",
                    backgroundColor: "rgba(0, 196, 140, 0.1)",
                    color: "#00C48C",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <CheckCircle2 size={22} />
                </div>
              </div>

              {/* 3. Asignados / Vendidos */}
              <div
                style={{
                  backgroundColor: "#FFFFFF",
                  borderRadius: "1.1rem",
                  padding: "1.1rem 1.25rem",
                  boxShadow: "0 2px 10px rgba(0,0,0,0.03)",
                  border: "1px solid rgba(22, 43, 63, 0.05)",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <div>
                  <span style={{ fontSize: "0.82rem", fontWeight: 600, color: "#64748B", display: "block", marginBottom: "0.35rem" }}>
                    Asignados / Vendidos
                  </span>
                  <h3 style={{ fontSize: "1.6rem", fontWeight: 800, color: "#1F3652", margin: 0, lineHeight: 1 }}>
                    {additionalsList.filter((a) => a.status !== "DISPONIBLE").length}
                  </h3>
                </div>
                <div
                  style={{
                    width: "42px",
                    height: "42px",
                    borderRadius: "0.75rem",
                    backgroundColor: "rgba(47, 128, 237, 0.08)",
                    color: "#2F80ED",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Layers size={22} />
                </div>
              </div>

              {/* 4. Valor Total Adicionales */}
              <div
                style={{
                  backgroundColor: "#FFFFFF",
                  borderRadius: "1.1rem",
                  padding: "1.1rem 1.25rem",
                  boxShadow: "0 2px 10px rgba(0,0,0,0.03)",
                  border: "1px solid rgba(22, 43, 63, 0.05)",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <div>
                  <span style={{ fontSize: "0.82rem", fontWeight: 600, color: "#64748B", display: "block", marginBottom: "0.35rem" }}>
                    Valor en Adicionales
                  </span>
                  <h3 style={{ fontSize: "1.35rem", fontWeight: 800, color: "#1F3652", margin: 0, lineHeight: 1.2 }}>
                    {formatMoney(additionalsList.reduce((sum, a) => sum + (a.price || 0), 0))}
                  </h3>
                </div>
                <div
                  style={{
                    width: "42px",
                    height: "42px",
                    borderRadius: "0.75rem",
                    backgroundColor: "rgba(139, 92, 246, 0.1)",
                    color: "#8B5CF6",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <DollarSign size={22} />
                </div>
              </div>
            </>
          )}

          {activeTab === "floorPlans" && (
            <>
              {/* 1. Total Plantas Conjunto */}
              <div
                style={{
                  backgroundColor: "#FFFFFF",
                  borderRadius: "1.1rem",
                  padding: "1.1rem 1.25rem",
                  boxShadow: "0 2px 10px rgba(0,0,0,0.03)",
                  border: "1px solid rgba(22, 43, 63, 0.05)",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <div>
                  <span style={{ fontSize: "0.82rem", fontWeight: 600, color: "#64748B", display: "block", marginBottom: "0.35rem" }}>
                    Total Plantas Creadas
                  </span>
                  <h3 style={{ fontSize: "1.6rem", fontWeight: 800, color: "#1F3652", margin: 0, lineHeight: 1 }}>
                    {floorPlansList.length}
                  </h3>
                </div>
                <div
                  style={{
                    width: "42px",
                    height: "42px",
                    borderRadius: "0.75rem",
                    backgroundColor: "rgba(47, 128, 237, 0.1)",
                    color: "#2F80ED",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Layers size={22} />
                </div>
              </div>

              {/* 2. Unidades con Planta */}
              <div
                style={{
                  backgroundColor: "#FFFFFF",
                  borderRadius: "1.1rem",
                  padding: "1.1rem 1.25rem",
                  boxShadow: "0 2px 10px rgba(0,0,0,0.03)",
                  border: "1px solid rgba(22, 43, 63, 0.05)",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <div>
                  <span style={{ fontSize: "0.82rem", fontWeight: 600, color: "#64748B", display: "block", marginBottom: "0.35rem" }}>
                    Unidades Asignadas
                  </span>
                  <h3 style={{ fontSize: "1.6rem", fontWeight: 800, color: "#1F3652", margin: 0, lineHeight: 1 }}>
                    {unitsList.filter((u) => !!u.floorPlan).length}
                  </h3>
                </div>
                <div
                  style={{
                    width: "42px",
                    height: "42px",
                    borderRadius: "0.75rem",
                    backgroundColor: "rgba(0, 196, 140, 0.1)",
                    color: "#00C48C",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Building2 size={22} />
                </div>
              </div>

              {/* 3. Unidades Sin Asignar */}
              <div
                style={{
                  backgroundColor: "#FFFFFF",
                  borderRadius: "1.1rem",
                  padding: "1.1rem 1.25rem",
                  boxShadow: "0 2px 10px rgba(0,0,0,0.03)",
                  border: "1px solid rgba(22, 43, 63, 0.05)",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <div>
                  <span style={{ fontSize: "0.82rem", fontWeight: 600, color: "#64748B", display: "block", marginBottom: "0.35rem" }}>
                    Unidades Sin Planta
                  </span>
                  <h3 style={{ fontSize: "1.6rem", fontWeight: 800, color: "#1F3652", margin: 0, lineHeight: 1 }}>
                    {unitsList.filter((u) => !u.floorPlan).length}
                  </h3>
                </div>
                <div
                  style={{
                    width: "42px",
                    height: "42px",
                    borderRadius: "0.75rem",
                    backgroundColor: "rgba(245, 158, 11, 0.1)",
                    color: "#F59E0B",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Home size={22} />
                </div>
              </div>

              {/* 4. Plantas con Plano / Render */}
              <div
                style={{
                  backgroundColor: "#FFFFFF",
                  borderRadius: "1.1rem",
                  padding: "1.1rem 1.25rem",
                  boxShadow: "0 2px 10px rgba(0,0,0,0.03)",
                  border: "1px solid rgba(22, 43, 63, 0.05)",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <div>
                  <span style={{ fontSize: "0.82rem", fontWeight: 600, color: "#64748B", display: "block", marginBottom: "0.35rem" }}>
                    Con Plano/Render
                  </span>
                  <h3 style={{ fontSize: "1.6rem", fontWeight: 800, color: "#1F3652", margin: 0, lineHeight: 1 }}>
                    {floorPlansList.filter((fp) => !!fp.imageUrl).length}
                  </h3>
                </div>
                <div
                  style={{
                    width: "42px",
                    height: "42px",
                    borderRadius: "0.75rem",
                    backgroundColor: "rgba(139, 92, 246, 0.1)",
                    color: "#8B5CF6",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Eye size={22} />
                </div>
              </div>
            </>
          )}
        </div>

        {/* ---------------------------------------------------- */}
        {/* VISTA 1: TAB UNIDADES (Inventario Principal)         */}
        {/* ---------------------------------------------------- */}
        {activeTab === "units" && (
          <>
            {/* BARRA DE BÚSQUEDA Y ACCIONES */}
            <div
              style={{
                backgroundColor: "#FFFFFF",
                borderRadius: "1rem",
                padding: "0.85rem 1.25rem",
                marginBottom: "1rem",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: "1rem",
                boxShadow: "0 2px 8px rgba(0,0,0,0.02)",
                border: "1px solid rgba(22, 43, 63, 0.05)",
              }}
            >
              {/* Input Buscar por # Unidad */}
              <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", flex: 1, maxWidth: "340px", backgroundColor: "#F8FAFC", padding: "0.55rem 0.85rem", borderRadius: "9999px", border: "1px solid #E2E8F0" }}>
                <Search size={16} color="#8B9BB0" />
                <input
                  type="text"
                  placeholder="Buscar por # Unidad, cliente o tipo..."
                  value={unitSearchQuery}
                  onChange={(e) => setUnitSearchQuery(e.target.value)}
                  style={{
                    border: "none",
                    outline: "none",
                    backgroundColor: "transparent",
                    fontSize: "0.85rem",
                    color: "#1F3652",
                    width: "100%",
                  }}
                />
                {unitSearchQuery && (
                  <button
                    type="button"
                    onClick={() => setUnitSearchQuery("")}
                    style={{ background: "none", border: "none", cursor: "pointer", color: "#8B9BB0" }}
                  >
                    <X size={14} />
                  </button>
                )}
              </div>

              {/* Filtros rápidos de estado (Pills) */}
              <div style={{ display: "flex", gap: "0.35rem" }}>
                {["ALL", "DISPONIBLE", "VENDIDA", "BLOQUEADA"].map((st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => setUnitStatusFilter(st)}
                    style={{
                      padding: "0.35rem 0.75rem",
                      borderRadius: "9999px",
                      border: "none",
                      backgroundColor: unitStatusFilter === st ? "#1B3047" : "#F1F5F9",
                      color: unitStatusFilter === st ? "#FFFFFF" : "#64748B",
                      fontSize: "0.75rem",
                      fontWeight: 700,
                      cursor: "pointer",
                      transition: "all 0.15s ease",
                    }}
                  >
                    {st === "ALL" ? "Todas" : st === "DISPONIBLE" ? "Disponibles" : st === "VENDIDA" ? "Vendidas" : "Bloqueadas"}
                  </button>
                ))}
              </div>

              {/* Botones de Acción Derecha */}
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                {hasPermission("units.bulk_import") && (
                  <button
                    type="button"
                    onClick={() => setShowUploadModal(true)}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "0.4rem",
                      padding: "0.5rem 1rem",
                      borderRadius: "9999px",
                      backgroundColor: "#1B3047",
                      color: "#FFFFFF",
                      fontSize: "0.82rem",
                      fontWeight: 700,
                      border: "none",
                      cursor: "pointer",
                      boxShadow: "0 2px 6px rgba(27, 48, 71, 0.15)",
                    }}
                  >
                    <FileSpreadsheet size={15} /> Subir (.xlsx)
                  </button>
                )}

                {hasPermission("units.export") && (
                  <button
                    type="button"
                    onClick={() => setShowDownloadModal(true)}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "0.4rem",
                      padding: "0.5rem 1.1rem",
                      borderRadius: "9999px",
                      backgroundColor: "#1B3047",
                      color: "#FFFFFF",
                      fontSize: "0.82rem",
                      fontWeight: 700,
                      border: "none",
                      cursor: "pointer",
                      boxShadow: "0 2px 6px rgba(27, 48, 71, 0.15)",
                    }}
                  >
                    <Download size={15} /> Descargar
                  </button>
                )}
              </div>
            </div>

            {/* TABLA DE INVENTARIO CON SORTING POR COLUMNA */}
            <div
              style={{
                backgroundColor: "#FFFFFF",
                borderRadius: "1rem",
                overflow: "hidden",
                boxShadow: "0 4px 15px rgba(0,0,0,0.03)",
                border: "1px solid rgba(22, 43, 63, 0.05)",
              }}
            >
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem", textAlign: "left" }}>
                <thead>
                  <tr style={{ backgroundColor: "#F8FAFC", borderBottom: "1px solid #EAEFF5" }}>
                    <th
                      onClick={() => {
                        if (sortField === "unit") setSortDirection(sortDirection === "asc" ? "desc" : "asc");
                        else { setSortField("unit"); setSortDirection("asc"); }
                      }}
                      style={{ padding: "0.85rem 1rem", fontWeight: 700, color: "#1F3652", cursor: "pointer", userSelect: "none" }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
                        Numero {sortField === "unit" && <ArrowUpDown size={12} color="#1B3047" />}
                      </div>
                    </th>

                    <th
                      onClick={() => {
                        if (sortField === "type") setSortDirection(sortDirection === "asc" ? "desc" : "asc");
                        else { setSortField("type"); setSortDirection("asc"); }
                      }}
                      style={{ padding: "0.85rem 1rem", fontWeight: 700, color: "#1F3652", cursor: "pointer", userSelect: "none" }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
                        Tipo {sortField === "type" && <ArrowUpDown size={12} color="#1B3047" />}
                      </div>
                    </th>

                    <th
                      onClick={() => {
                        if (sortField === "areaM2") setSortDirection(sortDirection === "asc" ? "desc" : "asc");
                        else { setSortField("areaM2"); setSortDirection("asc"); }
                      }}
                      style={{ padding: "0.85rem 1rem", fontWeight: 700, color: "#1F3652", cursor: "pointer", userSelect: "none" }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
                        Superficie (m²) {sortField === "areaM2" && <ArrowUpDown size={12} color="#1B3047" />}
                      </div>
                    </th>

                    <th
                      onClick={() => {
                        if (sortField === "price") setSortDirection(sortDirection === "asc" ? "desc" : "asc");
                        else { setSortField("price"); setSortDirection("asc"); }
                      }}
                      style={{ padding: "0.85rem 1rem", fontWeight: 700, color: "#1F3652", cursor: "pointer", userSelect: "none" }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
                        Precio {sortField === "price" && <ArrowUpDown size={12} color="#1B3047" />}
                      </div>
                    </th>

                    <th
                      onClick={() => {
                        if (sortField === "status") setSortDirection(sortDirection === "asc" ? "desc" : "asc");
                        else { setSortField("status"); setSortDirection("asc"); }
                      }}
                      style={{ padding: "0.85rem 1rem", fontWeight: 700, color: "#1F3652", cursor: "pointer", userSelect: "none" }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
                        Estado {sortField === "status" && <ArrowUpDown size={12} color="#1B3047" />}
                      </div>
                    </th>

                    <th
                      onClick={() => {
                        if (sortField === "client") setSortDirection(sortDirection === "asc" ? "desc" : "asc");
                        else { setSortField("client"); setSortDirection("asc"); }
                      }}
                      style={{ padding: "0.85rem 1rem", fontWeight: 700, color: "#1F3652", cursor: "pointer", userSelect: "none" }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
                        Cliente {sortField === "client" && <ArrowUpDown size={12} color="#1B3047" />}
                      </div>
                    </th>

                    <th style={{ padding: "0.85rem 1rem", fontWeight: 700, color: "#1F3652", textAlign: "center" }}>
                      Editar
                    </th>

                    <th style={{ padding: "0.85rem 1rem", fontWeight: 700, color: "#1F3652", textAlign: "center" }}>
                      Cotización
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {unitsList
                    .filter((u) => {
                      if (unitStatusFilter !== "ALL" && u.status !== unitStatusFilter) return false;
                      if (!unitSearchQuery.trim()) return true;
                      const q = unitSearchQuery.toLowerCase();
                      return (
                        u.unit.toLowerCase().includes(q) ||
                        (u.client && u.client.toLowerCase().includes(q)) ||
                        u.type.toLowerCase().includes(q)
                      );
                    })
                    .sort((a, b) => {
                      if (sortField === "unit") {
                        return sortDirection === "asc"
                          ? a.unit.localeCompare(b.unit, undefined, { numeric: true, sensitivity: "base" })
                          : b.unit.localeCompare(a.unit, undefined, { numeric: true, sensitivity: "base" });
                      }
                      if (sortField === "areaM2" || sortField === "price") {
                        const numA = Number(a[sortField]) || 0;
                        const numB = Number(b[sortField]) || 0;
                        return sortDirection === "asc" ? numA - numB : numB - numA;
                      }
                      let valA = (a[sortField] || "").toString().toLowerCase();
                      let valB = (b[sortField] || "").toString().toLowerCase();
                      if (valA < valB) return sortDirection === "asc" ? -1 : 1;
                      if (valA > valB) return sortDirection === "asc" ? 1 : -1;
                      return 0;
                    })
                    .map((u, i) => (
                      <tr
                        key={u.id || i}
                        onClick={() => {
                          if (u.status === "VENDIDA") {
                            handleNavigateToClient(u);
                          } else {
                            handleOpenUnitDetail(u);
                          }
                        }}
                        style={{
                          borderBottom: "1px solid #EAEFF5",
                          backgroundColor: i % 2 === 0 ? "#FFFFFF" : "#FAFBFD",
                          transition: "background-color 0.15s ease",
                          cursor: "pointer",
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "rgba(31, 54, 82, 0.04)")}
                        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = i % 2 === 0 ? "#FFFFFF" : "#FAFBFD")}
                      >
                        {/* 1. Numero */}
                        <td style={{ padding: "0.85rem 1rem", fontWeight: 800, color: "#1F3652" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                            <span>{u.unit}</span>
                            {u.floorPlan && (
                              <span
                                style={{
                                  fontSize: "0.68rem",
                                  backgroundColor: "rgba(47, 128, 237, 0.1)",
                                  color: "#2F80ED",
                                  padding: "0.15rem 0.45rem",
                                  borderRadius: "9999px",
                                  fontWeight: 700,
                                }}
                              >
                                {u.floorPlan}
                              </span>
                            )}
                          </div>
                        </td>

                        {/* 2. Tipo */}
                        <td style={{ padding: "0.85rem 1rem", color: "#64748B", fontWeight: 500 }}>
                          {u.type}
                        </td>

                        {/* 3. Superficie */}
                        <td style={{ padding: "0.85rem 1rem", color: "#1F3652", fontWeight: 600 }}>
                          {u.areaM2}
                        </td>

                        {/* 4. Precio */}
                        <td style={{ padding: "0.85rem 1rem", fontWeight: 700, color: "#1F3652" }}>
                          {formatMoney(u.price)}
                        </td>

                        {/* 5. Estado */}
                        <td style={{ padding: "0.85rem 1rem" }}>
                          <span
                            style={{
                              display: "inline-block",
                              padding: "0.3rem 0.85rem",
                              borderRadius: "9999px",
                              fontSize: "0.75rem",
                              fontWeight: 700,
                              backgroundColor:
                                u.status === "VENDIDA"
                                  ? "#0F2942"
                                  : u.status === "BLOQUEADA"
                                  ? "#EF4444"
                                  : u.status === "APARTADA"
                                  ? "#F59E0B"
                                  : "#10B981",
                              color: "#FFFFFF",
                            }}
                          >
                            {u.status === "DISPONIBLE"
                              ? "Disponible"
                              : u.status === "VENDIDA"
                              ? "Vendida"
                              : u.status === "BLOQUEADA"
                              ? "Bloqueada"
                              : "Apartada"}
                          </span>
                        </td>

                        {/* 6. Cliente / Copropiedad */}
                        <td style={{ padding: "0.85rem 1rem" }}>
                          <CoOwnersMiniCards
                            clientName={u.client}
                            coOwners={u.coOwners}
                            onCoOwnerClick={u.status === "VENDIDA" ? (co, e) => {
                              e.stopPropagation();
                              const targetId = co.id || co.email || co.name;
                              router.push(`/projects/${projectId}/clients/${encodeURIComponent(targetId)}?unit=${encodeURIComponent(u.unit)}`);
                            } : undefined}
                          />
                        </td>

                        {/* 7. Editar / Ver estado de cuenta */}
                        <td style={{ padding: "0.85rem 1rem", textAlign: "center" }} onClick={(e) => e.stopPropagation()}>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (u.status === "VENDIDA") {
                                handleNavigateToClient(u, e);
                              } else {
                                handleOpenUnitDetail(u);
                              }
                            }}
                            title={u.status === "VENDIDA" ? "Ver estado de cuenta de la unidad vendida" : "Editar información de la unidad"}
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              justifyContent: "center",
                              backgroundColor: "#1B3047",
                              color: "#FFFFFF",
                              padding: "0.45rem 1.25rem",
                              borderRadius: "9999px",
                              border: "none",
                              cursor: "pointer",
                              boxShadow: "0 2px 4px rgba(27, 48, 71, 0.15)",
                              transition: "transform 0.15s ease",
                            }}
                          >
                            <Edit3 size={14} />
                          </button>
                        </td>

                        {/* 8. Cotización */}
                        <td style={{ padding: "0.85rem 1rem", textAlign: "center" }} onClick={(e) => e.stopPropagation()}>
                          {hasPermission("units.quote") ? (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenQuoteWizard(u);
                              }}
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                justifyContent: "center",
                                backgroundColor: "#1B3047",
                                color: "#FFFFFF",
                                padding: "0.45rem 1.25rem",
                                borderRadius: "9999px",
                                border: "none",
                                cursor: "pointer",
                                fontSize: "0.78rem",
                                fontWeight: 700,
                                boxShadow: "0 2px 4px rgba(27, 48, 71, 0.15)",
                                transition: "transform 0.15s ease",
                              }}
                            >
                              Cotizar
                            </button>
                          ) : (
                            <span style={{ fontSize: "0.75rem", color: "#94A3B8" }}>-</span>
                          )}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* ---------------------------------------------------- */}
        {/* VISTA 2: TAB ADICIONALES                             */}
        {/* ---------------------------------------------------- */}
        {activeTab === "additionals" && (
          <>
            {/* Hidden file input for XLSX Import */}
            <input
              type="file"
              ref={additionalFileInputRef}
              accept=".xlsx,.xls,.csv"
              style={{ display: "none" }}
              onChange={handleBulkUploadAdditionals}
            />

            {/* BARRA DE BÚSQUEDA, CATEGORÍAS Y ACCIONES */}
            <div
              style={{
                backgroundColor: "#FFFFFF",
                borderRadius: "1rem",
                padding: "0.85rem 1.25rem",
                marginBottom: "1rem",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: "1rem",
                boxShadow: "0 2px 8px rgba(0,0,0,0.02)",
                border: "1px solid rgba(22, 43, 63, 0.05)",
              }}
            >
              {/* Input Buscar Adicional */}
              <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", flex: "1 1 240px", maxWidth: "320px", backgroundColor: "#F8FAFC", padding: "0.55rem 0.85rem", borderRadius: "9999px", border: "1px solid #E2E8F0" }}>
                <Search size={16} color="#8B9BB0" />
                <input
                  type="text"
                  placeholder="Buscar adicional, notas, unidad..."
                  value={additionalSearchQuery}
                  onChange={(e) => setAdditionalSearchQuery(e.target.value)}
                  style={{
                    border: "none",
                    outline: "none",
                    backgroundColor: "transparent",
                    fontSize: "0.85rem",
                    color: "#1F3652",
                    width: "100%",
                  }}
                />
                {additionalSearchQuery && (
                  <button
                    type="button"
                    onClick={() => setAdditionalSearchQuery("")}
                    style={{ background: "none", border: "none", cursor: "pointer", color: "#8B9BB0" }}
                  >
                    <X size={14} />
                  </button>
                )}
              </div>

              {/* Categorías Filters (Pills) */}
              <div style={{ display: "flex", gap: "0.35rem", flexWrap: "wrap" }}>
                {[
                  { id: "ALL", label: "Todas" },
                  { id: "estacionamiento", label: "Estacionamientos" },
                  { id: "bodega", label: "Bodegas" },
                  { id: "acabados", label: "Acabados" },
                  { id: "terraza", label: "Terrazas" },
                  { id: "otro", label: "Otros" },
                ].map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setAdditionalCategoryFilter(cat.id)}
                    style={{
                      padding: "0.35rem 0.75rem",
                      borderRadius: "9999px",
                      border: "none",
                      backgroundColor: additionalCategoryFilter === cat.id ? "#1B3047" : "#F1F5F9",
                      color: additionalCategoryFilter === cat.id ? "#FFFFFF" : "#64748B",
                      fontSize: "0.75rem",
                      fontWeight: 700,
                      cursor: "pointer",
                      transition: "all 0.15s ease",
                    }}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>

              {/* Status Filters */}
              <div style={{ display: "flex", gap: "0.35rem" }}>
                {[
                  { id: "ALL", label: "Todos" },
                  { id: "DISPONIBLE", label: "Disponibles" },
                  { id: "ASIGNADO", label: "Asignados / Vendidos" },
                ].map((st) => (
                  <button
                    key={st.id}
                    type="button"
                    onClick={() => setAdditionalStatusFilter(st.id)}
                    style={{
                      padding: "0.35rem 0.75rem",
                      borderRadius: "9999px",
                      border: "none",
                      backgroundColor: additionalStatusFilter === st.id ? "#2F80ED" : "#F8FAFC",
                      color: additionalStatusFilter === st.id ? "#FFFFFF" : "#64748B",
                      fontSize: "0.75rem",
                      fontWeight: 700,
                      cursor: "pointer",
                      borderWidth: "1px",
                      borderColor: additionalStatusFilter === st.id ? "#2F80ED" : "#E2E8F0",
                      transition: "all 0.15s ease",
                    }}
                  >
                    {st.label}
                  </button>
                ))}
              </div>

              {/* Botones de Acción de Adicionales */}
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
                <button
                  type="button"
                  onClick={generateAdditionalsExcelTemplate}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "0.4rem",
                    padding: "0.5rem 0.95rem",
                    borderRadius: "9999px",
                    backgroundColor: "#FFFFFF",
                    color: "#1F3652",
                    fontSize: "0.8rem",
                    fontWeight: 700,
                    border: "1px solid #CBD5E1",
                    cursor: "pointer",
                  }}
                  title="Descargar plantilla de Excel para carga masiva de adicionales"
                >
                  <Download size={14} color="#64748B" /> Plantilla
                </button>

                <button
                  type="button"
                  onClick={() => additionalFileInputRef.current?.click()}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "0.4rem",
                    padding: "0.5rem 0.95rem",
                    borderRadius: "9999px",
                    backgroundColor: "#FFFFFF",
                    color: "#1F3652",
                    fontSize: "0.8rem",
                    fontWeight: 700,
                    border: "1px solid #CBD5E1",
                    cursor: "pointer",
                  }}
                  title="Subir archivo XLSX de adicionales"
                >
                  <FileSpreadsheet size={14} color="#059669" /> Cargar XLSX
                </button>

                <button
                  type="button"
                  onClick={handleExportAdditionalsExcel}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "0.4rem",
                    padding: "0.5rem 0.95rem",
                    borderRadius: "9999px",
                    backgroundColor: "#FFFFFF",
                    color: "#1F3652",
                    fontSize: "0.8rem",
                    fontWeight: 700,
                    border: "1px solid #CBD5E1",
                    cursor: "pointer",
                  }}
                  title="Exportar catálogo de adicionales a Excel"
                >
                  <Download size={14} color="#2F80ED" /> Exportar
                </button>

                {hasPermission("projects.catalog_manage") && (
                  <button
                    type="button"
                    onClick={handleOpenAddAdditionalModal}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "0.4rem",
                      padding: "0.5rem 1.25rem",
                      borderRadius: "9999px",
                      backgroundColor: "#1B3047",
                      color: "#FFFFFF",
                      fontSize: "0.82rem",
                      fontWeight: 700,
                      border: "none",
                      cursor: "pointer",
                      boxShadow: "0 2px 6px rgba(27, 48, 71, 0.15)",
                    }}
                  >
                    <Plus size={15} /> Nuevo Adicional
                  </button>
                )}
              </div>
            </div>

            {/* TABLA DE ADICIONALES */}
            <div
              style={{
                backgroundColor: "#FFFFFF",
                borderRadius: "1rem",
                overflow: "hidden",
                boxShadow: "0 4px 15px rgba(0,0,0,0.03)",
                border: "1px solid rgba(22, 43, 63, 0.05)",
              }}
            >
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem", textAlign: "left" }}>
                <thead>
                  <tr style={{ backgroundColor: "#F8FAFC", borderBottom: "1px solid #EAEFF5" }}>
                    <th style={{ padding: "0.85rem 1rem", fontWeight: 700, color: "#1F3652" }}>
                      Nombre / Identificador
                    </th>
                    <th style={{ padding: "0.85rem 1rem", fontWeight: 700, color: "#1F3652" }}>
                      Categoría
                    </th>
                    <th style={{ padding: "0.85rem 1rem", fontWeight: 700, color: "#1F3652" }}>
                      Precio ({currency})
                    </th>
                    <th style={{ padding: "0.85rem 1rem", fontWeight: 700, color: "#1F3652" }}>
                      Superficie (m²)
                    </th>
                    <th style={{ padding: "0.85rem 1rem", fontWeight: 700, color: "#1F3652" }}>
                      Estado
                    </th>
                    <th style={{ padding: "0.85rem 1rem", fontWeight: 700, color: "#1F3652" }}>
                      Asignado a
                    </th>
                    <th style={{ padding: "0.85rem 1rem", fontWeight: 700, color: "#1F3652" }}>
                      Notas
                    </th>
                    <th style={{ padding: "0.85rem 1rem", fontWeight: 700, color: "#1F3652", textAlign: "center" }}>
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAdditionals.length === 0 ? (
                    <tr>
                      <td colSpan={8} style={{ padding: "3rem 1rem", textAlign: "center", color: "#64748B" }}>
                        <Package size={36} color="#CBD5E1" style={{ margin: "0 auto 0.75rem auto", display: "block" }} />
                        <p style={{ fontWeight: 700, fontSize: "0.95rem", color: "#1F3652", margin: "0 0 0.25rem 0" }}>
                          No se encontraron adicionales
                        </p>
                        <p style={{ fontSize: "0.8rem", margin: 0 }}>
                          Crea un nuevo adicional o ajusta los filtros de búsqueda.
                        </p>
                      </td>
                    </tr>
                  ) : (
                    filteredAdditionals.map((item, i) => (
                      <tr
                        key={item.id || i}
                        style={{
                          borderBottom: "1px solid #EAEFF5",
                          backgroundColor: i % 2 === 0 ? "#FFFFFF" : "#FAFBFD",
                          transition: "background-color 0.15s ease",
                        }}
                      >
                        <td style={{ padding: "0.85rem 1rem", fontWeight: 800, color: "#1F3652" }}>
                          {item.name}
                        </td>

                        <td style={{ padding: "0.85rem 1rem" }}>
                          <div style={{ display: "inline-flex", alignItems: "center", gap: "0.35rem", padding: "0.25rem 0.6rem", borderRadius: "9999px", backgroundColor: "#F1F5F9", fontSize: "0.75rem", fontWeight: 700, color: "#1F3652", textTransform: "capitalize" }}>
                            {getCategoryIcon(item.category)}
                            <span>{item.category}</span>
                          </div>
                        </td>

                        <td style={{ padding: "0.85rem 1rem", fontWeight: 700, color: "#1F3652" }}>
                          {formatMoney(item.price)}
                        </td>

                        <td style={{ padding: "0.85rem 1rem", color: "#64748B", fontWeight: 600 }}>
                          {item.areaM2 ? `${item.areaM2} m²` : "-"}
                        </td>

                        <td style={{ padding: "0.85rem 1rem" }}>
                          <span
                            style={{
                              display: "inline-block",
                              padding: "0.25rem 0.75rem",
                              borderRadius: "9999px",
                              fontSize: "0.72rem",
                              fontWeight: 700,
                              backgroundColor:
                                item.status === "DISPONIBLE"
                                  ? "#10B981"
                                  : item.status === "VENDIDO"
                                  ? "#0F2942"
                                  : "#2F80ED",
                              color: "#FFFFFF",
                            }}
                          >
                            {item.status}
                          </span>
                        </td>

                        <td style={{ padding: "0.85rem 1rem", fontWeight: 700, color: item.assignedToUnit ? "#2F80ED" : "#94A3B8" }}>
                          {item.assignedToUnit ? `Unidad ${item.assignedToUnit}` : "Sin asignar"}
                        </td>

                        <td style={{ padding: "0.85rem 1rem", color: "#64748B", fontSize: "0.8rem", maxWidth: "200px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {item.notes || "-"}
                        </td>

                        <td style={{ padding: "0.85rem 1rem", textAlign: "center" }}>
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.4rem" }}>
                            <button
                              type="button"
                              onClick={() => handleOpenEditAdditionalModal(item)}
                              disabled={item.status !== "DISPONIBLE"}
                              title={item.status === "DISPONIBLE" ? "Editar adicional" : "Solo editables si están disponibles"}
                              style={{
                                width: "28px",
                                height: "28px",
                                borderRadius: "6px",
                                border: "1px solid #E2E8F0",
                                backgroundColor: item.status === "DISPONIBLE" ? "#FFFFFF" : "#F1F5F9",
                                color: item.status === "DISPONIBLE" ? "#1B3047" : "#CBD5E1",
                                display: "inline-flex",
                                alignItems: "center",
                                justifyContent: "center",
                                cursor: item.status === "DISPONIBLE" ? "pointer" : "not-allowed",
                              }}
                            >
                              <Edit2 size={13} />
                            </button>

                            <button
                              type="button"
                              onClick={() => handleDeleteAdditionalItem(item.id)}
                              disabled={item.status !== "DISPONIBLE"}
                              title={item.status === "DISPONIBLE" ? "Eliminar adicional" : "Solo eliminables si están disponibles"}
                              style={{
                                width: "28px",
                                height: "28px",
                                borderRadius: "6px",
                                border: "1px solid #FEE2E2",
                                backgroundColor: item.status === "DISPONIBLE" ? "#FFFFFF" : "#F1F5F9",
                                color: item.status === "DISPONIBLE" ? "#EF4444" : "#CBD5E1",
                                display: "inline-flex",
                                alignItems: "center",
                                justifyContent: "center",
                                cursor: item.status === "DISPONIBLE" ? "pointer" : "not-allowed",
                              }}
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* ---------------------------------------------------- */}
        {/* VISTA 3: TAB PLANTAS CONJUNTO                        */}
        {/* ---------------------------------------------------- */}
        {activeTab === "floorPlans" && (
          <>
            {/* BARRA SUPERIOR DE PLANTAS CONJUNTO */}
            <div
              style={{
                backgroundColor: "#FFFFFF",
                borderRadius: "1rem",
                padding: "0.85rem 1.25rem",
                marginBottom: "1.25rem",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: "1rem",
                boxShadow: "0 2px 8px rgba(0,0,0,0.02)",
                border: "1px solid rgba(22, 43, 63, 0.05)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", flex: 1, maxWidth: "340px", backgroundColor: "#F8FAFC", padding: "0.55rem 0.85rem", borderRadius: "9999px", border: "1px solid #E2E8F0" }}>
                <Search size={16} color="#8B9BB0" />
                <input
                  type="text"
                  placeholder="Buscar por nombre de planta o # unidad..."
                  value={floorPlanSearchQuery}
                  onChange={(e) => setFloorPlanSearchQuery(e.target.value)}
                  style={{
                    border: "none",
                    outline: "none",
                    backgroundColor: "transparent",
                    fontSize: "0.85rem",
                    color: "#1F3652",
                    width: "100%",
                  }}
                />
                {floorPlanSearchQuery && (
                  <button
                    type="button"
                    onClick={() => setFloorPlanSearchQuery("")}
                    style={{ background: "none", border: "none", cursor: "pointer", color: "#8B9BB0" }}
                  >
                    <X size={14} />
                  </button>
                )}
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <button
                  type="button"
                  onClick={handleOpenCreateFloorPlan}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "0.45rem",
                    padding: "0.5rem 1.35rem",
                    borderRadius: "9999px",
                    backgroundColor: "#1B3047",
                    color: "#FFFFFF",
                    fontSize: "0.82rem",
                    fontWeight: 700,
                    border: "none",
                    cursor: "pointer",
                    boxShadow: "0 2px 6px rgba(27, 48, 71, 0.15)",
                  }}
                >
                  <Plus size={16} /> Nueva Planta
                </button>
              </div>
            </div>

            {/* GRID DE CARDS DE PLANTAS CONJUNTO */}
            {filteredFloorPlans.length === 0 ? (
              <div
                style={{
                  backgroundColor: "#FFFFFF",
                  borderRadius: "1.25rem",
                  padding: "4rem 2rem",
                  textAlign: "center",
                  border: "1px solid rgba(22, 43, 63, 0.05)",
                  boxShadow: "0 4px 15px rgba(0,0,0,0.02)",
                }}
              >
                <div
                  style={{
                    width: "64px",
                    height: "64px",
                    borderRadius: "50%",
                    backgroundColor: "rgba(47, 128, 237, 0.08)",
                    color: "#2F80ED",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    margin: "0 auto 1.25rem auto",
                  }}
                >
                  <Layers size={32} />
                </div>
                <h3 style={{ fontSize: "1.2rem", fontWeight: 800, color: "#1F3652", margin: "0 0 0.4rem 0" }}>
                  No hay plantas de conjunto registradas
                </h3>
                <p style={{ fontSize: "0.85rem", color: "#64748B", maxWidth: "420px", margin: "0 auto 1.5rem auto", lineHeight: 1.5 }}>
                  Crea plantas arquitectónicas para asociar tus unidades con sus planos y layouts correspondientes.
                </p>
                <button
                  type="button"
                  onClick={handleOpenCreateFloorPlan}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "0.45rem",
                    padding: "0.6rem 1.4rem",
                    borderRadius: "9999px",
                    backgroundColor: "#1B3047",
                    color: "#FFFFFF",
                    fontSize: "0.85rem",
                    fontWeight: 700,
                    border: "none",
                    cursor: "pointer",
                    boxShadow: "0 2px 6px rgba(27, 48, 71, 0.15)",
                  }}
                >
                  <Plus size={16} /> Crear Primera Planta
                </button>
              </div>
            ) : (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
                  gap: "1.25rem",
                }}
              >
                {filteredFloorPlans.map((plan) => {
                  const assignedUnits = unitsList.filter((u) => u.floorPlan === plan.name);

                  return (
                    <div
                      key={plan.id}
                      style={{
                        backgroundColor: "#FFFFFF",
                        borderRadius: "1.1rem",
                        border: "1px solid rgba(22, 43, 63, 0.08)",
                        boxShadow: "0 4px 15px rgba(0,0,0,0.03)",
                        overflow: "hidden",
                        display: "flex",
                        flexDirection: "column",
                        transition: "all 0.2s ease",
                      }}
                    >
                      {/* PREVIEW CONTAINER */}
                      <div
                        style={{
                          height: "180px",
                          backgroundColor: "#0F2942",
                          position: "relative",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          overflow: "hidden",
                        }}
                      >
                        {plan.imageUrl ? (
                          <>
                            <img
                              src={plan.imageUrl}
                              alt={plan.name}
                              style={{
                                width: "100%",
                                height: "100%",
                                objectFit: "cover",
                                cursor: "pointer",
                              }}
                              onClick={() => setPreviewFloorPlanImage({ url: plan.imageUrl!, title: plan.name })}
                            />
                            <button
                              type="button"
                              onClick={() => setPreviewFloorPlanImage({ url: plan.imageUrl!, title: plan.name })}
                              title="Ampliar plano"
                              style={{
                                position: "absolute",
                                bottom: "10px",
                                right: "10px",
                                width: "32px",
                                height: "32px",
                                borderRadius: "8px",
                                backgroundColor: "rgba(0,0,0,0.6)",
                                color: "#FFFFFF",
                                border: "none",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                cursor: "pointer",
                              }}
                            >
                              <Maximize2 size={16} />
                            </button>
                          </>
                        ) : (
                          <div style={{ textAlign: "center", color: "rgba(255,255,255,0.4)" }}>
                            <ImageIcon size={40} style={{ margin: "0 auto 0.5rem auto" }} />
                            <p style={{ fontSize: "0.75rem", margin: 0, fontWeight: 600 }}>
                              Sin plano/render subido
                            </p>
                          </div>
                        )}

                        <span
                          style={{
                            position: "absolute",
                            top: "10px",
                            left: "10px",
                            backgroundColor: "rgba(27, 48, 71, 0.85)",
                            color: "#FFFFFF",
                            padding: "0.2rem 0.6rem",
                            borderRadius: "9999px",
                            fontSize: "0.72rem",
                            fontWeight: 700,
                            backdropFilter: "blur(4px)",
                          }}
                        >
                          {assignedUnits.length} {assignedUnits.length === 1 ? "Unidad" : "Unidades"}
                        </span>
                      </div>

                      {/* CARD BODY */}
                      <div style={{ padding: "1.1rem 1.25rem", flex: 1, display: "flex", flexDirection: "column" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.75rem" }}>
                          <div>
                            <h4 style={{ fontSize: "1.05rem", fontWeight: 800, color: "#1F3652", margin: 0 }}>
                              {plan.name}
                            </h4>
                            <span style={{ fontSize: "0.78rem", color: "#64748B" }}>
                              {assignedUnits.length > 0
                                ? `${assignedUnits.length} unidades asociadas`
                                : "Sin unidades asociadas actualmente"}
                            </span>
                          </div>
                        </div>

                        {/* CHIPS DE UNIDADES ASOCIADAS */}
                        <div style={{ flex: 1, marginBottom: "1rem" }}>
                          <span style={{ fontSize: "0.72rem", fontWeight: 700, color: "#64748B", textTransform: "uppercase", display: "block", marginBottom: "0.4rem" }}>
                            Unidades en esta planta:
                          </span>
                          {assignedUnits.length === 0 ? (
                            <p style={{ fontSize: "0.78rem", color: "#94A3B8", fontStyle: "italic", margin: 0 }}>
                              Ninguna unidad tiene asignada esta planta.
                            </p>
                          ) : (
                            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.35rem", maxHeight: "80px", overflowY: "auto" }}>
                              {assignedUnits.map((u) => (
                                <span
                                  key={u.unit}
                                  onClick={() => {
                                    if (u.status === "VENDIDA") {
                                      handleNavigateToClient(u);
                                    } else {
                                      handleOpenUnitDetail(u);
                                    }
                                  }}
                                  title={`Ver detalles de unidad ${u.unit}`}
                                  style={{
                                    display: "inline-flex",
                                    alignItems: "center",
                                    padding: "0.2rem 0.55rem",
                                    borderRadius: "6px",
                                    backgroundColor: "#F1F5F9",
                                    color: "#1F3652",
                                    fontSize: "0.75rem",
                                    fontWeight: 700,
                                    cursor: "pointer",
                                    border: "1px solid #E2E8F0",
                                  }}
                                >
                                  #{u.unit}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* ACCIONES DE LA CARD */}
                        <div style={{ display: "flex", gap: "0.5rem", borderTop: "1px solid #EAEFF5", paddingTop: "0.85rem" }}>
                          <button
                            type="button"
                            onClick={() => handleOpenEditFloorPlan(plan)}
                            style={{
                              flex: 1,
                              display: "inline-flex",
                              alignItems: "center",
                              justifyContent: "center",
                              gap: "0.4rem",
                              padding: "0.45rem 0.75rem",
                              borderRadius: "8px",
                              backgroundColor: "#1B3047",
                              color: "#FFFFFF",
                              fontSize: "0.78rem",
                              fontWeight: 700,
                              border: "none",
                              cursor: "pointer",
                            }}
                          >
                            <Edit2 size={13} /> Editar & Asignar
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDeleteFloorPlan(plan)}
                            style={{
                              width: "34px",
                              height: "34px",
                              borderRadius: "8px",
                              border: "1px solid #FEE2E2",
                              backgroundColor: "#FFFFFF",
                              color: "#EF4444",
                              display: "inline-flex",
                              alignItems: "center",
                              justifyContent: "center",
                              cursor: "pointer",
                            }}
                            title="Eliminar planta"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </main>

      {/* ---------------------------------------------------- */}
      {/* MODAL: CREAR / EDITAR ADICIONAL                      */}
      {/* ---------------------------------------------------- */}
      {isAdditionalItemModalOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 9999,
            backgroundColor: "rgba(10, 25, 41, 0.7)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "1rem",
          }}
        >
          <div
            style={{
              backgroundColor: "#FFFFFF",
              borderRadius: "1.25rem",
              width: "100%",
              maxWidth: "500px",
              boxShadow: "0 20px 50px rgba(0,0,0,0.3)",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                padding: "1.25rem 1.5rem",
                borderBottom: "1px solid #E2E8F0",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                backgroundColor: "#F8FAFC",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <Package size={20} color="#1B3047" />
                <h3 style={{ fontSize: "1.1rem", fontWeight: 800, color: "#1F3652", margin: 0 }}>
                  {editingAdditionalItem ? "Editar Adicional" : "Nuevo Adicional"}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsAdditionalItemModalOpen(false)}
                style={{ background: "none", border: "none", cursor: "pointer", color: "#64748B" }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveAdditionalItemModal} style={{ padding: "1.5rem" }}>
              <div style={{ marginBottom: "1rem" }}>
                <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 700, color: "#1F3652", marginBottom: "0.35rem" }}>
                  Nombre / Identificador *
                </label>
                <input
                  type="text"
                  required
                  value={additionalFormName}
                  onChange={(e) => setAdditionalFormName(e.target.value)}
                  placeholder="Ej: Cajón E-12, Bodega B-04"
                  style={{
                    width: "100%",
                    padding: "0.6rem 0.85rem",
                    borderRadius: "8px",
                    border: "1px solid #CBD5E1",
                    fontSize: "0.85rem",
                    color: "#1F3652",
                    outline: "none",
                  }}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1rem" }}>
                <div>
                  <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 700, color: "#1F3652", marginBottom: "0.35rem" }}>
                    Categoría
                  </label>
                  <select
                    value={additionalFormCategory}
                    onChange={(e) => setAdditionalFormCategory(e.target.value as any)}
                    style={{
                      width: "100%",
                      padding: "0.6rem 0.85rem",
                      borderRadius: "8px",
                      border: "1px solid #CBD5E1",
                      fontSize: "0.85rem",
                      color: "#1F3652",
                      backgroundColor: "#FFFFFF",
                      outline: "none",
                    }}
                  >
                    <option value="estacionamiento">Estacionamiento</option>
                    <option value="bodega">Bodega</option>
                    <option value="acabados">Acabados</option>
                    <option value="terraza">Terraza</option>
                    <option value="otro">Otro</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 700, color: "#1F3652", marginBottom: "0.35rem" }}>
                    Precio ({currency}) *
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    step="1000"
                    value={additionalFormPrice}
                    onChange={(e) => setAdditionalFormPrice(parseFloat(e.target.value) || 0)}
                    style={{
                      width: "100%",
                      padding: "0.6rem 0.85rem",
                      borderRadius: "8px",
                      border: "1px solid #CBD5E1",
                      fontSize: "0.85rem",
                      color: "#1F3652",
                      outline: "none",
                    }}
                  />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1rem" }}>
                <div>
                  <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 700, color: "#1F3652", marginBottom: "0.35rem" }}>
                    Superficie m² (opcional)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.1"
                    value={additionalFormArea || ""}
                    onChange={(e) => setAdditionalFormArea(parseFloat(e.target.value) || 0)}
                    placeholder="0.00"
                    style={{
                      width: "100%",
                      padding: "0.6rem 0.85rem",
                      borderRadius: "8px",
                      border: "1px solid #CBD5E1",
                      fontSize: "0.85rem",
                      color: "#1F3652",
                      outline: "none",
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 700, color: "#1F3652", marginBottom: "0.35rem" }}>
                    Estado
                  </label>
                  <select
                    value={additionalFormStatus}
                    onChange={(e) => setAdditionalFormStatus(e.target.value as any)}
                    style={{
                      width: "100%",
                      padding: "0.6rem 0.85rem",
                      borderRadius: "8px",
                      border: "1px solid #CBD5E1",
                      fontSize: "0.85rem",
                      color: "#1F3652",
                      backgroundColor: "#FFFFFF",
                      outline: "none",
                    }}
                  >
                    <option value="DISPONIBLE">Disponible</option>
                    <option value="ASIGNADO">Asignado</option>
                    <option value="VENDIDO">Vendido</option>
                  </select>
                </div>
              </div>

              <div style={{ marginBottom: "1.5rem" }}>
                <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 700, color: "#1F3652", marginBottom: "0.35rem" }}>
                  Notas / Observaciones
                </label>
                <textarea
                  rows={2}
                  value={additionalFormNotes}
                  onChange={(e) => setAdditionalFormNotes(e.target.value)}
                  placeholder="Ubicación en sótano 1, incluye preparación eléctrica, etc."
                  style={{
                    width: "100%",
                    padding: "0.6rem 0.85rem",
                    borderRadius: "8px",
                    border: "1px solid #CBD5E1",
                    fontSize: "0.85rem",
                    color: "#1F3652",
                    outline: "none",
                    resize: "none",
                  }}
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.6rem" }}>
                <button
                  type="button"
                  onClick={() => setIsAdditionalItemModalOpen(false)}
                  style={{
                    padding: "0.55rem 1.1rem",
                    borderRadius: "8px",
                    border: "1px solid #CBD5E1",
                    backgroundColor: "#FFFFFF",
                    color: "#64748B",
                    fontSize: "0.82rem",
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  style={{
                    padding: "0.55rem 1.35rem",
                    borderRadius: "8px",
                    border: "none",
                    backgroundColor: "#1B3047",
                    color: "#FFFFFF",
                    fontSize: "0.82rem",
                    fontWeight: 700,
                    cursor: "pointer",
                    boxShadow: "0 2px 6px rgba(27, 48, 71, 0.15)",
                  }}
                >
                  Guardar Adicional
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* MODAL: CREAR / EDITAR PLANTA CONJUNTO                */}
      {/* ---------------------------------------------------- */}
      {isFloorPlanModalOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 9999,
            backgroundColor: "rgba(10, 25, 41, 0.75)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "1rem",
          }}
        >
          <div
            style={{
              backgroundColor: "#FFFFFF",
              borderRadius: "1.25rem",
              width: "100%",
              maxWidth: "650px",
              maxHeight: "90vh",
              display: "flex",
              flexDirection: "column",
              boxShadow: "0 25px 60px -12px rgba(0, 0, 0, 0.35)",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                padding: "1.25rem 1.5rem",
                borderBottom: "1px solid #E2E8F0",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                backgroundColor: "#F8FAFC",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <Layers size={20} color="#1B3047" />
                <h3 style={{ fontSize: "1.1rem", fontWeight: 800, color: "#1F3652", margin: 0 }}>
                  {editingFloorPlanForm.id ? "Editar Planta Conjunto" : "Nueva Planta Conjunto"}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsFloorPlanModalOpen(false)}
                style={{ background: "none", border: "none", cursor: "pointer", color: "#64748B" }}
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ padding: "1.5rem", overflowY: "auto", flex: 1 }}>
              {/* Nombre de la Planta */}
              <div style={{ marginBottom: "1.25rem" }}>
                <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 700, color: "#1F3652", marginBottom: "0.35rem" }}>
                  Nombre de la Planta *
                </label>
                <input
                  type="text"
                  required
                  value={editingFloorPlanForm.name}
                  onChange={(e) => setEditingFloorPlanForm({ ...editingFloorPlanForm, name: e.target.value })}
                  placeholder="Ej: Planta Tipo A, Penthouse, Nivel 1"
                  style={{
                    width: "100%",
                    padding: "0.65rem 0.85rem",
                    borderRadius: "8px",
                    border: "1px solid #CBD5E1",
                    fontSize: "0.85rem",
                    color: "#1F3652",
                    outline: "none",
                  }}
                />
              </div>

              {/* Imagen / Plano Render */}
              <div style={{ marginBottom: "1.25rem" }}>
                <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 700, color: "#1F3652", marginBottom: "0.35rem" }}>
                  Plano Arquitectónico o Render (Imagen)
                </label>

                <input
                  type="file"
                  ref={floorPlanFileInputRef}
                  accept="image/*"
                  style={{ display: "none" }}
                  onChange={handleFloorPlanImageUpload}
                />

                <div
                  style={{
                    border: "2px dashed #CBD5E1",
                    borderRadius: "10px",
                    padding: "1rem",
                    textAlign: "center",
                    backgroundColor: "#F8FAFC",
                    cursor: "pointer",
                  }}
                  onClick={() => floorPlanFileInputRef.current?.click()}
                >
                  {editingFloorPlanForm.imageUrl ? (
                    <div style={{ position: "relative" }}>
                      <img
                        src={editingFloorPlanForm.imageUrl}
                        alt="Preview"
                        style={{ maxHeight: "180px", maxWidth: "100%", objectFit: "contain", borderRadius: "8px", margin: "0 auto" }}
                      />
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingFloorPlanForm({ ...editingFloorPlanForm, imageUrl: "" });
                        }}
                        style={{
                          position: "absolute",
                          top: "5px",
                          right: "5px",
                          backgroundColor: "#EF4444",
                          color: "#FFFFFF",
                          border: "none",
                          borderRadius: "50%",
                          width: "24px",
                          height: "24px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          cursor: "pointer",
                        }}
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ) : (
                    <div>
                      <Upload size={28} color="#64748B" style={{ margin: "0 auto 0.5rem auto", display: "block" }} />
                      <p style={{ fontSize: "0.82rem", fontWeight: 700, color: "#1F3652", margin: "0 0 0.25rem 0" }}>
                        Haz clic para subir un plano o render
                      </p>
                      <p style={{ fontSize: "0.75rem", color: "#94A3B8", margin: 0 }}>
                        PNG, JPG o WEBP
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Asignar Unidades a esta Planta */}
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
                  <label style={{ fontSize: "0.82rem", fontWeight: 700, color: "#1F3652", margin: 0 }}>
                    Asignar Unidades a esta Planta ({editingFloorPlanForm.selectedUnitNumbers.length} seleccionadas)
                  </label>
                  <div style={{ display: "flex", gap: "0.4rem" }}>
                    <button
                      type="button"
                      onClick={() => setEditingFloorPlanForm({
                        ...editingFloorPlanForm,
                        selectedUnitNumbers: unitsList.map((u) => u.unit),
                      })}
                      style={{ fontSize: "0.72rem", color: "#2F80ED", background: "none", border: "none", cursor: "pointer", fontWeight: 700 }}
                    >
                      Todas
                    </button>
                    <span style={{ color: "#CBD5E1" }}>|</span>
                    <button
                      type="button"
                      onClick={() => setEditingFloorPlanForm({
                        ...editingFloorPlanForm,
                        selectedUnitNumbers: [],
                      })}
                      style={{ fontSize: "0.72rem", color: "#64748B", background: "none", border: "none", cursor: "pointer", fontWeight: 700 }}
                    >
                      Ninguna
                    </button>
                  </div>
                </div>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fill, minmax(80px, 1fr))",
                    gap: "0.4rem",
                    maxHeight: "180px",
                    overflowY: "auto",
                    padding: "0.5rem",
                    backgroundColor: "#F8FAFC",
                    borderRadius: "8px",
                    border: "1px solid #E2E8F0",
                  }}
                >
                  {unitsList.map((u) => {
                    const isChecked = editingFloorPlanForm.selectedUnitNumbers.includes(u.unit);
                    return (
                      <button
                        type="button"
                        key={u.unit}
                        onClick={() => {
                          if (isChecked) {
                            setEditingFloorPlanForm({
                              ...editingFloorPlanForm,
                              selectedUnitNumbers: editingFloorPlanForm.selectedUnitNumbers.filter((n) => n !== u.unit),
                            });
                          } else {
                            setEditingFloorPlanForm({
                              ...editingFloorPlanForm,
                              selectedUnitNumbers: [...editingFloorPlanForm.selectedUnitNumbers, u.unit],
                            });
                          }
                        }}
                        style={{
                          padding: "0.35rem 0.5rem",
                          borderRadius: "6px",
                          border: isChecked ? "1px solid #1B3047" : "1px solid #CBD5E1",
                          backgroundColor: isChecked ? "#1B3047" : "#FFFFFF",
                          color: isChecked ? "#FFFFFF" : "#1F3652",
                          fontSize: "0.78rem",
                          fontWeight: 700,
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          transition: "all 0.1s ease",
                        }}
                      >
                        <span>{u.unit}</span>
                        {isChecked && <Check size={12} />}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div
              style={{
                padding: "1rem 1.5rem",
                borderTop: "1px solid #E2E8F0",
                display: "flex",
                justifyContent: "flex-end",
                gap: "0.6rem",
                backgroundColor: "#F8FAFC",
              }}
            >
              <button
                type="button"
                onClick={() => setIsFloorPlanModalOpen(false)}
                style={{
                  padding: "0.55rem 1.1rem",
                  borderRadius: "8px",
                  border: "1px solid #CBD5E1",
                  backgroundColor: "#FFFFFF",
                  color: "#64748B",
                  fontSize: "0.82rem",
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSaveFloorPlan}
                style={{
                  padding: "0.55rem 1.35rem",
                  borderRadius: "8px",
                  border: "none",
                  backgroundColor: "#1B3047",
                  color: "#FFFFFF",
                  fontSize: "0.82rem",
                  fontWeight: 700,
                  cursor: "pointer",
                  boxShadow: "0 2px 6px rgba(27, 48, 71, 0.15)",
                }}
              >
                Guardar Planta
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* MODAL LIGHTBOX: ZOOM DE IMAGEN PLANTA                */}
      {/* ---------------------------------------------------- */}
      {previewFloorPlanImage && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 10000,
            backgroundColor: "rgba(0,0,0,0.85)",
            backdropFilter: "blur(6px)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "2rem",
          }}
          onClick={() => setPreviewFloorPlanImage(null)}
        >
          <div
            style={{
              position: "absolute",
              top: "1.5rem",
              right: "2rem",
              display: "flex",
              alignItems: "center",
              gap: "1rem",
            }}
          >
            <span style={{ color: "#FFFFFF", fontWeight: 700, fontSize: "1rem" }}>
              {previewFloorPlanImage.title}
            </span>
            <button
              type="button"
              onClick={() => setPreviewFloorPlanImage(null)}
              style={{
                backgroundColor: "rgba(255,255,255,0.2)",
                border: "none",
                borderRadius: "50%",
                width: "36px",
                height: "36px",
                color: "#FFFFFF",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
              }}
            >
              <X size={20} />
            </button>
          </div>

          <img
            src={previewFloorPlanImage.url}
            alt={previewFloorPlanImage.title}
            style={{
              maxWidth: "90vw",
              maxHeight: "85vh",
              objectFit: "contain",
              borderRadius: "8px",
              boxShadow: "0 10px 40px rgba(0,0,0,0.5)",
            }}
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* MODALES DEL MÓDULO DE UNIDADES                        */}
      {/* ---------------------------------------------------- */}
      {showBulkPriceModal && (
        <BulkPriceModal
          isOpen={showBulkPriceModal}
          onClose={() => setShowBulkPriceModal(false)}
          units={unitsList}
          currency={currency}
          onApplyAdjustment={handleApplyPriceAdjustment}
        />
      )}

      {showEditInventoryModal && (
        <EditInventoryGridModal
          isOpen={showEditInventoryModal}
          onClose={() => setShowEditInventoryModal(false)}
          initialUnits={unitsList}
          project={project}
          currency={currency}
          onSaveUnits={handleSaveInventoryGrid}
        />
      )}

      {showQuoteModal && selectedUnitForAction && (
        <QuoteUnitWizardModal
          isOpen={showQuoteModal}
          onClose={() => {
            setShowQuoteModal(false);
            setSelectedUnitForAction(null);
          }}
          unit={selectedUnitForAction}
          projectName={project.name}
          currency={currency}
          initialAdditionals={project.additionals || []}
          onQuoteGenerated={(quoteData) => {
            setShowQuoteModal(false);
            setSelectedUnitForAction(null);
            showToast("Cotización Generada", `PDF emitido para ${quoteData.clientName || "cliente"}.`);
          }}
        />
      )}

      {showUnitDetailModal && selectedUnitForAction && (
        <UnitDetailHistoryModal
          isOpen={showUnitDetailModal}
          onClose={() => {
            setShowUnitDetailModal(false);
            setSelectedUnitForAction(null);
          }}
          unit={selectedUnitForAction}
          project={project}
          currency={currency}
          additionals={project.additionals || []}
          onSaveUnit={handleSaveSingleUnit}
          onInitiateSale={(unit) => {
            setSelectedUnitForAction(unit);
            setShowUnitDetailModal(false);
            setShowNewSaleModal(true);
          }}
          onInitiateQuote={(unit) => {
            setSelectedUnitForAction(unit);
            setShowUnitDetailModal(false);
            setShowQuoteModal(true);
          }}
        />
      )}

      {showDownloadModal && (
        <DownloadExportModal
          isOpen={showDownloadModal}
          onClose={() => setShowDownloadModal(false)}
          units={unitsList}
          projectName={project.name}
          currency={currency}
        />
      )}

      {showUploadModal && (
        <UploadInventoryModal
          isOpen={showUploadModal}
          onClose={() => setShowUploadModal(false)}
          onImportUnits={(importedUnits) => {
            bulkImportUnits(project.id, importedUnits as any);
          }}
          onImportAddons={(importedAddons) => {
            bulkImportAdditionals(project.id, importedAddons);
          }}
        />
      )}

      {/* Modales Proyecto */}
      {showNewSaleModal && (
        <CreateSaleWizardModal
          isOpen={showNewSaleModal}
          onClose={() => setShowNewSaleModal(false)}
          currency={currency}
          initialProjectId={project.id}
          projects={projects}
          onSaleCreated={(saleData) => {
            setShowNewSaleModal(false);
          }}
        />
      )}

      {showEditProjectModal && (
        <EditProjectModal
          isOpen={showEditProjectModal}
          onClose={() => setShowEditProjectModal(false)}
          project={project}
          onSave={() => {
            setShowEditProjectModal(false);
            showToast("Proyecto Actualizado", "La información general y el equipo han sido guardados.");
          }}
        />
      )}

      {showProgressModal && (
        <RegisterProgressWizardModal
          isOpen={showProgressModal}
          onClose={() => setShowProgressModal(false)}
          project={project}
          projectName={project.name}
          currentProgressPct={project.progressPct}
          onProgressSaved={() => {
            setShowProgressModal(false);
          }}
        />
      )}
    </AppLayout>
  );
}
