import * as XLSX from "xlsx";

export type ProjectType = "VERTICAL" | "HORIZONTAL" | "COMMERCIAL" | "INDUSTRIAL" | "MIXED";

export interface CustomColumnDef {
  id: string;
  title: string;
  type: "number" | "text" | "file" | "image" | "boolean";
}

export interface ParsedUnitData {
  id: string;
  unitNumber: string;
  surfaceM2: number;
  price: number;
  status: "Disponible" | "Apartada" | "Vendida" | "Bloqueada";
  deliveryDate: string;
  type: string;
  extraFields: Record<string, any>;
}

export interface UnmappedColumnInfo {
  headerName: string;
  sampleValues: string[];
  inferredType: "number" | "text" | "boolean";
}

// -----------------------------------------------------------------------------
// DICCIONARIO DE ALIAS Y NORMALIZACIÓN DE COLUMNAS
// -----------------------------------------------------------------------------
const COLUMN_ALIASES: Record<string, string> = {
  // Unit number
  "# unidad": "unitNumber",
  "unidad": "unitNumber",
  "unit_number": "unitNumber",
  "num unidad": "unitNumber",
  "no. unidad": "unitNumber",
  "depto": "unitNumber",
  "lote": "unitNumber",
  "local": "unitNumber",
  "nave": "unitNumber",
  
  // Surface
  "superficie (m²)": "surfaceM2",
  "superficie (m2)": "surfaceM2",
  "superficie_m2": "surfaceM2",
  "superficie": "surfaceM2",
  "m2": "surfaceM2",
  "área (m²)": "surfaceM2",
  "area (m2)": "surfaceM2",
  "area": "surfaceM2",

  // Price
  "precio": "price",
  "precio de venta": "price",
  "precio_lista": "price",
  "price": "price",
  "monto": "price",

  // Status
  "estado": "status",
  "estatus": "status",
  "status": "status",
  "disponibilidad": "status",

  // Delivery Date
  "fecha de entrega": "deliveryDate",
  "fecha_entrega": "deliveryDate",
  "entrega": "deliveryDate",
  "delivery_date": "deliveryDate",

  // Typology / Type
  "tipo": "type",
  "tipo de unidad": "type",
  "tipologia": "type",
  "tipología": "type",
  "unit_type": "type",

  // Presets
  "piso / nivel.": "level",
  "piso / nivel": "level",
  "piso": "level",
  "nivel": "level",
  "número de recámaras.": "bedrooms",
  "número de recámaras": "bedrooms",
  "recámaras": "bedrooms",
  "recamaras": "bedrooms",
  "número de baños.": "bathrooms",
  "número de baños": "bathrooms",
  "baños": "bathrooms",
  "cajones de estacionamiento.": "parkingSpaces",
  "cajones de estacionamiento": "parkingSpaces",
  "cajones": "parkingSpaces",
  "estacionamiento": "parkingSpaces",
  "m² de terraza/balcón.": "terraceM2",
  "m² de terraza/balcón": "terraceM2",
  "terraza": "terraceM2",
  "vista": "view",
  "orientación": "view",
  "dimensiones del terreno (frente x fondo).": "frontDepth",
  "(frente x fondo)": "frontDepth",
  "área total de construcción.": "constructionArea",
  "área total de construcción": "constructionArea",
  "jardín (sí/no o m²).": "garden",
  "jardín": "garden",
  "tipo de uso": "usageType",
  "frente a calle": "streetFront",
  "área techada.": "roofedArea",
  "área techada": "roofedArea",
  "altura libre (m).": "clearHeight",
  "altura libre": "clearHeight",
  "capacidad de carga de piso (tons/m²).": "floorLoadCapacity",
  "andenes de carga (#).": "loadingDocks",
  "andenes de carga": "loadingDocks",
  "energía eléctrica (kva disponibles).": "electricalKVA",
  "energía eléctrica": "electricalKVA",
  "kva": "electricalKVA",
  "notas / descripción corta": "notes",
  "notas": "notes",
};

export function normalizeHeader(header: string): string {
  return header
    .trim()
    .toLowerCase()
    .replace(/\r?\n|\r/g, " ")
    .replace(/\s+/g, " ");
}

// -----------------------------------------------------------------------------
// GENERACIÓN DE PLANTILLA EXCEL PARA UNIDADES (.XLSX MULTI-HOJA)
// -----------------------------------------------------------------------------

export function generateUnitsExcelTemplate({
  projectType,
  activeColumns,
  projectName = "Proyecto Devio",
}: {
  projectType: ProjectType;
  activeColumns: CustomColumnDef[];
  projectName?: string;
}) {
  const wb = XLSX.utils.book_new();

  // 1. Columnas y Filas de Ejemplo según Tipología
  let typologyHeaders: string[] = [];
  let sampleRows: (string | number)[][] = [];

  if (projectType === "VERTICAL") {
    typologyHeaders = [
      "Piso / Nivel",
      "Número de recámaras",
      "Número de baños",
      "Cajones de estacionamiento",
      "M² de terraza/balcón",
      "Vista",
    ];
    sampleRows = [
      ["101", 95.5, 4200000, "Disponible", "Piso 1", "Departamento", "2028-09-17", 2, 2, 1, 12.5, "Norte"],
      ["102", 120.0, 5350000, "Disponible", "Piso 1", "Departamento", "2028-09-17", 3, 2.5, 2, 18.0, "Jardín Central"],
      ["201", 85.0, 3900000, "Disponible", "Piso 2", "Departamento", "2028-09-17", 1, 1.5, 1, 8.0, "Panorámica"],
    ];
  } else if (projectType === "HORIZONTAL") {
    typologyHeaders = [
      "Dimensiones del terreno (frente x fondo)",
      "Área total de construcción",
      "Jardín (m²)",
      "Número de recámaras",
      "Número de baños",
      "Cajones de estacionamiento",
    ];
    sampleRows = [
      ["Lote 12", 220.0, 3800000, "Disponible", "PB", "Casa/Vivienda", "2028-09-17", "10x22", 185.0, 35.0, 3, 2.5, 2],
      ["Lote 14", 300.0, 5100000, "Disponible", "PB", "Casa/Vivienda", "2028-09-17", "12x25", 240.0, 60.0, 4, 3.5, 3],
      ["Lote 15", 180.0, 2900000, "Disponible", "PB", "Lote", "2028-09-17", "9x20", 0, 0, 0, 0, 0],
    ];
  } else if (projectType === "COMMERCIAL") {
    typologyHeaders = [
      "Piso / Nivel",
      "Frente a calle",
      "Altura libre (m)",
      "Energía eléctrica (kVA disponibles)",
      "Tipo de uso",
      "Cajones de estacionamiento",
    ];
    sampleRows = [
      ["Local 101", 65.0, 3200000, "Disponible", "PB", "Local", "2028-09-17", "Av. Principal", 4.5, 30, "Comercial / Retail", 2],
      ["Local 102", 120.0, 5800000, "Disponible", "PB", "Local", "2028-09-17", "Pasillo Central", 4.5, 45, "Restaurante", 4],
      ["OF-201", 90.0, 4100000, "Disponible", "Nivel 2", "Oficina", "2028-09-17", "Fachada Poniente", 3.2, 25, "Corporativo", 3],
    ];
  } else if (projectType === "INDUSTRIAL") {
    typologyHeaders = [
      "Altura libre (m)",
      "Andenes de carga (#)",
      "Capacidad de carga de piso (tons/m²)",
      "Energía eléctrica (kVA disponibles)",
      "Área techada",
      "Tipo de uso",
    ];
    sampleRows = [
      ["Nave 01", 1500.0, 22500000, "Disponible", "PB", "Nave", "2028-09-17", 9.5, 2, 5.0, 150, 1400.0, "Logístico"],
      ["Nave 02", 2800.0, 41000000, "Disponible", "PB", "Nave", "2028-09-17", 11.0, 4, 6.0, 300, 2650.0, "Manufactura Ligera"],
      ["Lote Ind-05", 5000.0, 35000000, "Disponible", "PB", "Lote", "2028-09-17", 0, 0, 0, 500, 0, "Industrial Pesado"],
    ];
  } else {
    // MIXED
    typologyHeaders = [
      "Piso / Nivel",
      "Tipo de uso",
      "Número de recámaras",
      "Número de baños",
      "Cajones de estacionamiento",
      "Altura libre (m)",
    ];
    sampleRows = [
      ["Dep-301", 105.0, 4800000, "Disponible", "Nivel 3", "Departamento", "2028-09-17", 2, 2, 1, 2.8],
      ["Loc-102", 80.0, 3600000, "Disponible", "PB", "Local", "2028-09-17", 0, 1, 2, 4.2],
      ["Of-401", 150.0, 6200000, "Disponible", "Nivel 4", "Oficina", "2028-09-17", 0, 2, 3, 3.5],
    ];
  }

  // Filtrar columnas personalizadas que no estén ya en la tipología
  const customColsOnly = activeColumns.filter(
    (c) =>
      !["unitnumber", "surfacem2", "price", "status", "deliverydate", "type"].includes(
        c.id.toLowerCase()
      ) &&
      !typologyHeaders.some(
        (th) => normalizeHeader(th) === normalizeHeader(c.title)
      )
  );

  const customHeaders = customColsOnly.map((c) => c.title);

  // Encabezados Base
  const baseHeaders = [
    "# Unidad",
    "Superficie (m²)",
    "Precio",
    "Estado",
    "Piso / Nivel",
    "tipo",
    "Fecha de entrega",
  ];

  const allHeaders = [...baseHeaders, ...typologyHeaders, ...customHeaders];

  // Completar filas de ejemplo con las columnas custom
  const completeSampleRows = sampleRows.map((r, rowIdx) => {
    const customValues = customColsOnly.map((c) =>
      c.type === "number" ? 1 : c.type === "boolean" ? "Sí" : `Dato ${rowIdx + 1}`
    );
    return [...r, ...customValues];
  });

  const wsData = [allHeaders, ...completeSampleRows];
  const wsUnidades = XLSX.utils.aoa_to_sheet(wsData);

  // Configurar ancho de columnas
  wsUnidades["!cols"] = allHeaders.map(() => ({ wch: 22 }));
  XLSX.utils.book_append_sheet(wb, wsUnidades, "Unidades");

  // ---------------------------------------------------------------------------
  // HOJA 2: INSTRUCCIONES (OFICIAL DEVIO)
  // ---------------------------------------------------------------------------
  const instructionsData = [
    ["", "", "", ""],
    ["", `Plantilla Oficial para Subir Unidades  |  Devio (${projectName})`, "", ""],
    ["", "", "", ""],
    ["", "Información General", "", ""],
    ["", "Este archivo es la plantilla oficial de Devio para cargar o actualizar unidades dentro de tu proyecto. Completa los datos en la pestaña 'Unidades' y súbela directamente en formato Excel (.xlsx).", "", ""],
    ["", "", "", ""],
    ["", "Reglas y Recomendaciones", "", ""],
    ["", "• Identificador Único:", "La columna '# Unidad' es obligatoria. No puede repetirse ni estar vacía.", ""],
    ["", "• Superficie y Precio:", "Ingresa solo números sin texto adicional (ejemplo: 95.5 en superficie y 4200000 en precio, sin 'm2' ni signos de '$').", ""],
    ["", "• Estados Permitidos:", "Valores válidos: 'Disponible', 'Apartada', 'Vendida' o 'Bloqueada'.", ""],
    ["", "• Tipos de Unidad:", "Valores sugeridos: Departamento, Casa/Vivienda, Lote, Local, Oficina, Consultorio, Nave, Estudio/Loft.", ""],
    ["", "• Columnas Opcionales:", "Si un campo no aplica para una unidad en particular, déjalo en blanco. No escribas 'N/A' ni '0' si el dato no existe.", ""],
    ["", "• Columnas Personalizadas:", "Puedes agregar columnas adicionales al final de la tabla (ej. 'No. Bodega', 'Paquete Acabados'). Al subir el archivo, el Mapeador Inteligente de Devio las detectará y te permitirá agregarlas automáticamente como atributos del proyecto.", ""],
    ["", "• Imágenes de Unidades:", "Las imágenes y planos se cargan directamente desde la interfaz web de Devio una vez creada la unidad.", ""],
    ["", "", "", ""],
    ["", "Catálogo de Columnas y Formatos", "", ""],
    ["", "Columna", "Formato Esperado", "Ejemplo"],
    ["", "# Unidad", "Texto único", "101, Lote-12, Nave-A"],
    ["", "Superficie (m²)", "Número decimal o entero", "95.5"],
    ["", "Precio", "Número sin símbolos", "4200000"],
    ["", "Estado", "Disponible | Apartada | Vendida | Bloqueada", "Disponible"],
    ["", "Piso / Nivel", "Texto o número", "Piso 1 / PB / Nivel 4"],
    ["", "tipo", "Tipo de unidad", "Departamento / Local / Nave"],
    ["", "Fecha de entrega", "Formato YYYY-MM-DD o DD/MM/YYYY", "2028-09-17"],
    ["", "Número de recámaras", "Número entero", "2"],
    ["", "Número de baños", "Número decimal o entero", "2.5"],
    ["", "Cajones de estacionamiento", "Número entero", "2"],
    ["", "M² de terraza/balcón", "Número decimal", "14.5"],
    ["", "Dimensiones del terreno", "Texto (Frente x Fondo)", "10x20"],
    ["", "Altura libre (m)", "Número decimal", "4.5"],
    ["", "Capacidad de piso (tons/m²)", "Número decimal", "5.0"],
    ["", "Andenes de carga (#)", "Número entero", "2"],
    ["", "Energía eléctrica (kVA)", "Número o texto", "150"],
    ["", "", "", ""],
    ["", "Devio  |  Plataforma de Gestión Inmobiliaria  |  Soporte: soporte@devio.mx", "", ""],
  ];

  const wsInstrucciones = XLSX.utils.aoa_to_sheet(instructionsData);
  wsInstrucciones["!cols"] = [
    { wch: 4 },
    { wch: 32 },
    { wch: 60 },
    { wch: 25 },
  ];
  XLSX.utils.book_append_sheet(wb, wsInstrucciones, "Instrucciones");

  const fileName = `plantilla_unidades_${projectType.toLowerCase()}_devio.xlsx`;
  XLSX.writeFile(wb, fileName);
}

// -----------------------------------------------------------------------------
// GENERACIÓN DE PLANTILLA EXCEL PARA ADICIONALES (.XLSX MULTI-HOJA)
// -----------------------------------------------------------------------------

export function generateAdditionalsExcelTemplate() {
  const wb = XLSX.utils.book_new();

  const headers = ["Nombre / Identificador", "Tipo", "Precio", "Estado", "Notas"];
  const sampleRows = [
    ["Cajón E-101 (Sótano 1)", "Estacionamiento", 250000, "Disponible", "Cajón techado individual"],
    ["Bodega B-04 (Sótano 2)", "Bodega", 120000, "Disponible", "4.5 m2 con puerta de seguridad"],
    ["Roof Garden Privado RG-3", "Otro", 450000, "Disponible", "Área privada de 40 m2"],
  ];

  const wsAdicionales = XLSX.utils.aoa_to_sheet([headers, ...sampleRows]);
  wsAdicionales["!cols"] = [
    { wch: 28 },
    { wch: 18 },
    { wch: 15 },
    { wch: 15 },
    { wch: 35 },
  ];
  XLSX.utils.book_append_sheet(wb, wsAdicionales, "Adicionales");

  const instructionsData = [
    ["", "", "", ""],
    ["", "Plantilla Oficial para Subir Adicionales  |  Devio", "", ""],
    ["", "", "", ""],
    ["", "Instrucciones de Llenado", "", ""],
    ["", "• Nombre / Identificador:", "Nombre claro del cajón, bodega o extra (ej. 'Cajón E-101 (Sótano 1)').", ""],
    ["", "• Tipos Permitidos:", "Valores válidos: 'Estacionamiento', 'Bodega' u 'Otro'.", ""],
    ["", "• Precio:", "Número entero sin comas ni símbolos (ej. 250000).", ""],
    ["", "• Estado:", "Valores válidos: 'Disponible', 'Asignado' o 'Vendido'.", ""],
    ["", "", "", ""],
    ["", "Devio  |  Plataforma de Gestión Inmobiliaria", "", ""],
  ];

  const wsInstrucciones = XLSX.utils.aoa_to_sheet(instructionsData);
  wsInstrucciones["!cols"] = [{ wch: 4 }, { wch: 25 }, { wch: 55 }, { wch: 20 }];
  XLSX.utils.book_append_sheet(wb, wsInstrucciones, "Instrucciones");

  XLSX.writeFile(wb, "plantilla_adicionales_devio.xlsx");
}

// -----------------------------------------------------------------------------
// PARSER INTELIGENTE DE EXCEL PARA UNIDADES
// -----------------------------------------------------------------------------

export function parseUnitsExcelFile(
  fileBuffer: ArrayBuffer,
  activeColumns: CustomColumnDef[]
): {
  success: boolean;
  error?: string;
  parsedRows: ParsedUnitData[];
  unmappedColumns: UnmappedColumnInfo[];
  mappedColumnsCount: number;
} {
  try {
    const workbook = XLSX.read(new Uint8Array(fileBuffer), { type: "array" });

    // Buscar hoja llamada 'Unidades' o tomar la primera hoja no instructiva
    let sheetName = workbook.SheetNames.find(
      (n) => normalizeHeader(n) === "unidades" || normalizeHeader(n).includes("inventario")
    );
    if (!sheetName) {
      sheetName = workbook.SheetNames[0];
    }
    if (!sheetName) {
      return { success: false, error: "El archivo no contiene hojas válidas.", parsedRows: [], unmappedColumns: [], mappedColumnsCount: 0 };
    }

    const worksheet = workbook.Sheets[sheetName];
    if (!worksheet) {
      return { success: false, error: "No se pudo leer la hoja de unidades.", parsedRows: [], unmappedColumns: [], mappedColumnsCount: 0 };
    }

    const rawRows = XLSX.utils.sheet_to_json<any[]>(worksheet, { header: 1, defval: "" });
    if (rawRows.length < 2) {
      return { success: false, error: "El archivo está vacío o no contiene filas de datos.", parsedRows: [], unmappedColumns: [], mappedColumnsCount: 0 };
    }

    const rawHeaders = rawRows[0] as any[];
    if (!rawHeaders || rawHeaders.length === 0) {
      return { success: false, error: "No se encontraron encabezados de columnas.", parsedRows: [], unmappedColumns: [], mappedColumnsCount: 0 };
    }

    // Identificar mapeos de encabezados
    interface HeaderMapping {
      index: number;
      rawHeader: string;
      targetKey: string;
      isCustom: boolean;
    }

    const headerMappings: HeaderMapping[] = [];
    const unmappedList: UnmappedColumnInfo[] = [];

    // Mapeo de columnas conocidas activas
    const activeColMap = new Map<string, CustomColumnDef>();
    activeColumns.forEach((c) => {
      activeColMap.set(normalizeHeader(c.title), c);
      activeColMap.set(normalizeHeader(c.id), c);
    });

    for (let colIdx = 0; colIdx < rawHeaders.length; colIdx++) {
      const headerStr = String(rawHeaders[colIdx] || "").trim();
      if (!headerStr) continue;

      const norm = normalizeHeader(headerStr);

      // Verificar alias estándar
      if (COLUMN_ALIASES[norm]) {
        headerMappings.push({
          index: colIdx,
          rawHeader: headerStr,
          targetKey: COLUMN_ALIASES[norm],
          isCustom: false,
        });
        continue;
      }

      // Verificar si coincide con columna personalizada activa
      const matchedActive = activeColMap.get(norm);
      if (matchedActive) {
        headerMappings.push({
          index: colIdx,
          rawHeader: headerStr,
          targetKey: matchedActive.id,
          isCustom: true,
        });
        continue;
      }

      // Columna desconocida / no mapeada
      const sampleVals: string[] = [];
      let numericCount = 0;
      let validCount = 0;

      for (let r = 1; r < Math.min(rawRows.length, 10); r++) {
        const val = rawRows[r]?.[colIdx];
        if (val !== undefined && val !== null && String(val).trim() !== "") {
          const strVal = String(val).trim();
          sampleVals.push(strVal);
          validCount++;
          if (!isNaN(Number(strVal.replace(/,/g, "")))) {
            numericCount++;
          }
        }
      }

      const inferredType: "number" | "text" | "boolean" =
        validCount > 0 && numericCount === validCount ? "number" : "text";

      unmappedList.push({
        headerName: headerStr,
        sampleValues: sampleVals.slice(0, 3),
        inferredType,
      });
    }

    // Procesar filas de datos
    const parsedRows: ParsedUnitData[] = [];

    for (let rowIdx = 1; rowIdx < rawRows.length; rowIdx++) {
      const row = rawRows[rowIdx];
      if (!row || row.every((c: any) => c === "" || c === null || c === undefined)) {
        continue; // Fila vacía
      }

      let unitNumber = "";
      let surfaceM2 = 0;
      let price = 0;
      let status: "Disponible" | "Apartada" | "Vendida" | "Bloqueada" = "Disponible";
      let deliveryDate = "2028-09-17";
      let type = "Departamento";
      const extraFields: Record<string, any> = {};

      headerMappings.forEach((map) => {
        const val = row[map.index];
        if (val === undefined || val === null || val === "") return;

        switch (map.targetKey) {
          case "unitNumber":
            unitNumber = String(val).trim();
            break;
          case "surfaceM2": {
            const num = parseFloat(String(val).replace(/[^0-9.-]/g, ""));
            surfaceM2 = isNaN(num) ? 0 : num;
            break;
          }
          case "price": {
            const num = parseFloat(String(val).replace(/[^0-9.-]/g, ""));
            price = isNaN(num) ? 0 : num;
            break;
          }
          case "status": {
            const strStatus = String(val).trim().toLowerCase();
            if (strStatus.includes("apartad")) status = "Apartada";
            else if (strStatus.includes("vendid")) status = "Vendida";
            else if (strStatus.includes("bloquead")) status = "Bloqueada";
            else status = "Disponible";
            break;
          }
          case "deliveryDate": {
            if (typeof val === "number") {
              // Convertir número serial de Excel a fecha legible
              const date = new Date(Math.round((val - 25569) * 86400 * 1000));
              deliveryDate = date.toISOString().split("T")[0] || "2028-09-17";
            } else {
              deliveryDate = String(val).trim();
            }
            break;
          }
          case "type":
            type = String(val).trim();
            break;
          default:
            extraFields[map.targetKey] = val;
            break;
        }
      });

      if (!unitNumber) {
        unitNumber = `Unidad-${rowIdx}`;
      }

      parsedRows.push({
        id: `u-excel-${Date.now()}-${rowIdx}`,
        unitNumber,
        surfaceM2,
        price,
        status,
        deliveryDate,
        type,
        extraFields,
      });
    }

    return {
      success: true,
      parsedRows,
      unmappedColumns: unmappedList,
      mappedColumnsCount: headerMappings.length,
    };
  } catch (err: any) {
    return {
      success: false,
      error: `Error al procesar el archivo Excel: ${err?.message || err}`,
      parsedRows: [],
      unmappedColumns: [],
      mappedColumnsCount: 0,
    };
  }
}
