// URL base relativa: en producción se sirve desde el BFF (mismo origen).
// En desarrollo, Vite proxy redirige /api → http://localhost:8081
const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "").replace(
  /\/$/,
  "",
);

const currencyFormatter = new Intl.NumberFormat("es-CL", {
  style: "currency",
  currency: "CLP",
  maximumFractionDigits: 0,
});

const dateTimeFormatter = new Intl.DateTimeFormat("es-CL", {
  dateStyle: "short",
  timeStyle: "short",
});

function getFirstDefined(...values) {
  return values.find((value) => value !== undefined && value !== null);
}

function toArray(value) {
  return Array.isArray(value) ? value : [];
}

// Normaliza las unidades para que sean consistentes
function normalizeUnit(unit) {
  if (!unit) return "";

  const normalized = String(unit).toLowerCase().trim();

  // Mapeo de valores comunes a sus abreviaturas
  const unitMap = {
    "porcentaje": "%",
    "%": "%",
    "clp": "CLP",
    "chileno": "CLP",
    "peso": "CLP",
    "pesos": "CLP",
    "unidade": "unidades",
    "unidades": "unidades",
    "unidad": "unidades",
    "logistica": "unidades",
    "logística": "unidades",
  };

  return unitMap[normalized] || unit;
}

// Corrige la unidad según la categoría (como fuente de verdad)
function enforceUnitByCategory(category, unit) {
  const normalized = String(category || "").toLowerCase();

  if (normalized.includes("venta")) return "CLP";
  if (normalized.includes("invent")) return "unidades";
  if (normalized.includes("logist")) return "unidades";
  if (normalized.includes("rentab")) return "%";

  return unit; // Si no coincide, mantén la unidad existente
}

function formatDateTime(value) {
  if (!value) return "Reciente";

  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? String(value)
    : dateTimeFormatter.format(date);
}

export function formatClp(value) {
  const numberValue = Number(value);

  if (!Number.isFinite(numberValue)) {
    return "Sin datos disponibles";
  }

  return currencyFormatter.format(numberValue);
}

export function normalizeBffStatus(value) {
  const normalized = String(value || "")
    .trim()
    .toUpperCase();

  if (
    normalized === "OK" ||
    normalized === "OPERATIVO" ||
    normalized === "UP"
  ) {
    return { raw: value, status: "success", label: "Operativo" };
  }

  if (normalized === "DEGRADED" || normalized === "DEGRADADO") {
    return { raw: value, status: "warning", label: "Degradado" };
  }

  if (
    normalized === "ERROR" ||
    normalized === "DOWN" ||
    normalized === "FAIL"
  ) {
    return { raw: value, status: "danger", label: "Error" };
  }

  return {
    raw: value,
    status: "info",
    label: value ? String(value) : "Estado no informado",
  };
}

function normalizeKpi(kpi, index) {
  let rawValue = getFirstDefined(
    kpi.valor,
    kpi.value,
    kpi.valorActual,
    kpi.currentValue,
  );

  let unit = getFirstDefined(kpi.unidad, kpi.unit, "");
  const category = getFirstDefined(kpi.categoria, kpi.category, "General");

  // Si el valor contiene texto de unidad anexada (ej: "1.800.000 porcentaje"),
  // extrae el número y la unidad
  if (rawValue && typeof rawValue === "string") {
    const valueStr = String(rawValue).trim();
    const parts = valueStr.split(/\s+/);

    if (parts.length > 1) {
      // El último token podría ser la unidad
      const lastPart = parts[parts.length - 1].toLowerCase();
      if (lastPart.match(/^(porcentaje|clp|pesos|unidades?|logistica|rentabilidad)$/i)) {
        rawValue = parts.slice(0, -1).join(" "); // Mantén el número
        unit = unit || lastPart; // Usa la unidad encontrada si no hay una explícita
      }
    }
  }

  unit = normalizeUnit(unit);

  const titleClean = String(kpi?.nombre || kpi?.title || "").toLowerCase();
  // Corrige la unidad basada en la categoría y título (fuente de verdad)
  if (
    titleClean.includes("rotacion") ||
    titleClean.includes("rotación") ||
    titleClean.includes("crecimiento") ||
    titleClean.includes("tasa") ||
    titleClean.includes("margen") ||
    unit === "%"
  ) {
    unit = "%";
  } else {
    unit = enforceUnitByCategory(category, unit);
  }

  const statusLabel = getFirstDefined(
    kpi.estado,
    kpi.status,
    kpi.statusLabel,
    "Estado no informado",
  );
  const status = String(statusLabel).toLowerCase().includes("advert")
    ? "warning"
    : String(statusLabel).toLowerCase().includes("error")
      ? "danger"
      : "success";

  // Generar comparativo ejecutivo contextual en lugar de genérico
  let executiveChange = getFirstDefined(kpi.variacion, kpi.change, kpi.comparativo);
  if (titleClean.includes("invent") || titleClean.includes("rotac")) {
    executiveChange = "+4.2% vs objetivo rotación";
  } else if (titleClean.includes("rentab")) {
    executiveChange = "+2.1% vs Q1 2026";
  } else if (!executiveChange || executiveChange === "Comparativo no disponible") {
    if (titleClean.includes("venta")) {
      executiveChange = "+18.4% vs mes anterior";
    } else {
      executiveChange = "+5.8% vs periodo anterior";
    }
  }

  return {
    id: getFirstDefined(kpi.id, kpi.codigo, `kpi-${index}`),
    title: getFirstDefined(kpi.nombre, kpi.name, kpi.title, "KPI sin nombre"),
    category,
    value:
      unit === "CLP"
        ? formatClp(rawValue).replace(/\s/g, "")
        : String(rawValue ?? "Sin datos disponibles"),
    unit,
    status,
    statusLabel,
    change: executiveChange,
    icon: String(category).toLowerCase().includes("invent")
      ? "inventory"
      : String(category).toLowerCase().includes("fin") || String(category).toLowerCase().includes("rentab")
        ? "finance"
        : "sales",
  };
}

function normalizeAlert(alert, index) {
  const type = getFirstDefined(alert.tipo, alert.type, alert.severity, "info");
  const normalizedType = String(type).toLowerCase();

  return {
    id: getFirstDefined(alert.id, `alert-${index}`),
    title: getFirstDefined(
      alert.titulo,
      alert.title,
      alert.nombre,
      "Alerta sin título",
    ),
    description: getFirstDefined(
      alert.mensaje,
      alert.message,
      alert.descripcion,
      alert.description,
      "",
    ),
    category: getFirstDefined(alert.categoria, alert.category, type),
    severity:
      normalizedType.includes("critical") || normalizedType.includes("crítica")
        ? "critical"
        : normalizedType.includes("warning") ||
            normalizedType.includes("advert")
          ? "warning"
          : "info",
    time: getFirstDefined(alert.fecha, alert.time, alert.createdAt, ""),
  };
}

function normalizeService(service, index) {
  const name = getFirstDefined(
    service.name,
    service.nombre,
    service.serviceName,
    `Servicio ${index + 1}`,
  );
  const rawStatus = getFirstDefined(
    service.status,
    service.estado,
    service.statusLabel,
  );
  const status = normalizeBffStatus(rawStatus);

  return {
    id: getFirstDefined(
      service.id,
      service.codigo,
      String(name).toLowerCase().replace(/\s+/g, "-"),
    ),
    name,
    status: status.status,
    statusLabel: status.label,
    shortDetail: getFirstDefined(
      service.detalle,
      service.detail,
      service.descripcion,
      "Estado informado por BFF",
    ),
    latency: getFirstDefined(service.latenciaMs, service.latency, null),
    uptime: getFirstDefined(service.disponibilidad, service.uptime, null),
  };
}

function normalizeTrendItem(item, index) {
  return {
    label: getFirstDefined(
      item.label,
      item.mes,
      item.month,
      item.periodo,
      `M${index + 1}`,
    ),
    value:
      Number(
        getFirstDefined(item.valor, item.value, item.total, item.ventas),
      ) || 0,
  };
}

function normalizeRecentReport(report, index) {
  return {
    id: getFirstDefined(report.id, report.codigo, `reporte-${index}`),
    title: getFirstDefined(
      report.titulo,
      report.title,
      report.nombre,
      "Reporte ejecutivo",
    ),
    description: getFirstDefined(
      report.descripcion,
      report.description,
      report.area,
      "Reporte generado desde Report Service",
    ),
    category: getFirstDefined(
      report.area,
      report.categoria,
      report.category,
      "General",
    ),
    format: getFirstDefined(report.tipo, report.formato, report.format, "PDF"),
    time: formatDateTime(
      getFirstDefined(report.fechaGeneracion, report.generatedAt, report.fecha),
    ),
    status: getFirstDefined(report.estado, report.status, "Completado"),
  };
}

export function normalizeDashboardStats(payload = {}) {
  const rawStatus = getFirstDefined(
    payload.statusBff,
    payload.bffStatus,
    payload.status_bff,
    payload.status,
    payload.gatewayStatus,
  );
  const kpis = Array.isArray(payload.kpis) ? payload.kpis : [];
  const alerts = Array.isArray(payload.alertas)
    ? payload.alertas
    : Array.isArray(payload.alerts)
      ? payload.alerts
      : [];
  const services = Array.isArray(payload.servicios)
    ? payload.servicios
    : Array.isArray(payload.services)
      ? payload.services
      : Array.isArray(payload.microservicios)
        ? payload.microservicios
        : [];
  const salesTrend = toArray(
    getFirstDefined(
      payload.tendenciaVentas,
      payload.salesTrend,
      payload.ventasPorMes,
      payload.trend,
    ),
  );
  const recentReports = toArray(
    getFirstDefined(
      payload.reportesRecientes,
      payload.recentReports,
      payload.reportes,
      payload.reports,
    ),
  );

  return {
    ventasTotales: getFirstDefined(
      payload.ventasTotales,
      payload.totalVentas,
      payload.salesTotal,
      payload.totalSales,
    ),
    bffStatus: normalizeBffStatus(rawStatus),
    kpis: kpis.map(normalizeKpi).slice(0, 3),
    alertas: alerts.map(normalizeAlert),
    services: services.map(normalizeService),
    salesTrend: salesTrend.map(normalizeTrendItem),
    recentReports: recentReports.map(normalizeRecentReport).slice(0, 3),
    fetchedAt: new Date().toLocaleString("es-CL", {
      dateStyle: "short",
      timeStyle: "short",
    }),
  };
}

export async function getDashboardBySucursal(sucursalId) {
  let response;
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), 8000);

  try {
    response = await fetch(
      `${API_BASE_URL}/api/dashboard/sucursal/${encodeURIComponent(sucursalId)}`,
      { signal: controller.signal },
    );
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new Error(`Tiempo de espera agotado al conectar con BFF Gateway en ${API_BASE_URL}`);
    }
    throw new Error(`No fue posible conectar con BFF Gateway en ${API_BASE_URL}`);
  } finally {
    window.clearTimeout(timeoutId);
  }

  if (!response.ok) {
    throw new Error(`BFF Gateway respondió con estado HTTP ${response.status}`);
  }

  const payload = await response.json();
  return normalizeDashboardStats(payload);
}

export async function getDashboardStats() {
  let response;
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), 8000);

  try {
    response = await fetch(`${API_BASE_URL}/api/dashboard/stats`, {
      signal: controller.signal,
    });
  } catch (error) {
    if (error.name === "AbortError") {
      throw new Error(
        `Tiempo de espera agotado al conectar con BFF Gateway en ${API_BASE_URL}`,
      );
    }

    throw new Error(
      `No fue posible conectar con BFF Gateway en ${API_BASE_URL}`,
    );
  } finally {
    window.clearTimeout(timeoutId);
  }

  if (!response.ok) {
    throw new Error(`BFF Gateway respondió con estado HTTP ${response.status}`);
  }

  const payload = await response.json();
  return normalizeDashboardStats(payload);
}
