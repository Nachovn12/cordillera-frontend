const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080').replace(/\/$/, '')

const currencyFormatter = new Intl.NumberFormat('es-CL', {
  style: 'currency',
  currency: 'CLP',
  maximumFractionDigits: 0,
})

const dateTimeFormatter = new Intl.DateTimeFormat('es-CL', {
  dateStyle: 'short',
  timeStyle: 'short',
})

function getFirstDefined(...values) {
  return values.find((value) => value !== undefined && value !== null)
}

function toArray(value) {
  return Array.isArray(value) ? value : []
}

function normalizeFormat(value) {
  const normalized = String(value || '').trim().toLowerCase()

  if (normalized === 'excel' || normalized === 'xlsx' || normalized === 'xls') {
    return { label: 'Excel', value: 'excel' }
  }

  if (normalized === 'json') {
    return { label: 'JSON', value: 'json' }
  }

  if (normalized === 'csv') {
    return { label: 'CSV', value: 'csv' }
  }

  return { label: normalized ? normalized.toUpperCase() : 'PDF', value: normalized || 'pdf' }
}

function normalizeFormats(report) {
  const rawFormats = getFirstDefined(report.formatos, report.formats, report.tipos)

  if (Array.isArray(rawFormats) && rawFormats.length > 0) {
    return rawFormats.map(normalizeFormat)
  }

  const singleFormat = getFirstDefined(report.tipo, report.formato, report.format, 'pdf')
  return [normalizeFormat(singleFormat)]
}

function formatDate(value) {
  if (!value) return 'Sin fecha'

  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? String(value) : dateTimeFormatter.format(date)
}

function normalizeStatus(value) {
  const normalized = String(value || '').trim().toLowerCase()

  if (normalized.includes('error') || normalized.includes('fall')) {
    return { status: 'danger', label: 'Error' }
  }

  if (normalized.includes('proceso') || normalized.includes('generando')) {
    return { status: 'warning', label: 'En proceso' }
  }

  if (normalized.includes('pend')) {
    return { status: 'pending', label: 'Pendiente' }
  }

  if (normalized.includes('complet') || normalized.includes('ok') || normalized.includes('generado')) {
    return { status: 'success', label: 'Completado' }
  }

  return { status: 'info', label: value ? String(value) : 'Estado no informado' }
}

function normalizeReport(report, index) {
  const formats = normalizeFormats(report)
  const dateValue = getFirstDefined(
    report.fechaGeneracion,
    report.generatedAt,
    report.createdAt,
    report.fecha,
    report.ultimaEjecucion,
  )
  const statusMeta = normalizeStatus(getFirstDefined(report.estado, report.status))
  const rawValue = getFirstDefined(report.valor, report.value, report.monto)
  const valueNumber = Number(rawValue)

  return {
    id: getFirstDefined(report.id, report.codigo, `reporte-${index}`),
    title: getFirstDefined(report.titulo, report.title, report.nombre, 'Reporte sin título'),
    description: getFirstDefined(report.descripcion, report.description, report.detalle, 'Sin descripción disponible'),
    area: getFirstDefined(report.area, report.categoria, report.category, 'General'),
    formats,
    primaryFormat: formats[0]?.label || 'PDF',
    generatedAt: dateValue,
    generatedAtLabel: formatDate(dateValue),
    status: statusMeta.status,
    statusLabel: statusMeta.label,
    value: Number.isFinite(valueNumber) ? currencyFormatter.format(valueNumber).replace(/\s/g, '') : null,
  }
}

function normalizeOptionalList(value) {
  return toArray(value).map((item, index) => normalizeReport(item, index))
}

export function normalizeReportsResponse(payload) {
  const rawReports = Array.isArray(payload)
    ? payload
    : Array.isArray(payload?.reportes)
      ? payload.reportes
      : Array.isArray(payload?.reports)
        ? payload.reports
        : []

  return {
    reportes: rawReports.map(normalizeReport),
    plantillas: normalizeOptionalList(getFirstDefined(payload?.plantillas, payload?.templates)),
    exportaciones: normalizeOptionalList(getFirstDefined(payload?.exportaciones, payload?.exports)),
    programaciones: normalizeOptionalList(getFirstDefined(payload?.programaciones, payload?.schedules)),
    fetchedAt: new Date().toLocaleString('es-CL', {
      dateStyle: 'short',
      timeStyle: 'short',
    }),
  }
}

async function requestWithTimeout(url, options = {}) {
  const controller = new AbortController()
  const timeoutId = window.setTimeout(() => controller.abort(), 8000)

  try {
    return await fetch(url, {
      ...options,
      signal: controller.signal,
    })
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new Error(`Tiempo de espera agotado al conectar con BFF Gateway en ${API_BASE_URL}`)
    }

    throw new Error(`No fue posible conectar con BFF Gateway en ${API_BASE_URL}`)
  } finally {
    window.clearTimeout(timeoutId)
  }
}

async function parseJsonResponse(response) {
  if (!response.ok) {
    throw new Error(`BFF Gateway respondió con estado HTTP ${response.status}`)
  }

  if (response.status === 204) {
    return {}
  }

  const text = await response.text()
  return text ? JSON.parse(text) : {}
}

export async function getReportes() {
  const response = await requestWithTimeout(`${API_BASE_URL}/api/reportes`)
  const payload = await parseJsonResponse(response)
  return normalizeReportsResponse(payload)
}

export async function generarReporte(payload = {}) {
  const response = await requestWithTimeout(`${API_BASE_URL}/api/reportes/generar`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })

  return parseJsonResponse(response)
}

export async function exportarReporte(id, formato) {
  const response = await requestWithTimeout(
    `${API_BASE_URL}/api/reportes/${encodeURIComponent(id)}/exportar?formato=${encodeURIComponent(formato)}`,
  )

  if (!response.ok) {
    throw new Error(`BFF Gateway respondió con estado HTTP ${response.status}`)
  }

  const disposition = response.headers.get('Content-Disposition') || ''
  const match = disposition.match(/filename="?([^"]+)"?/i)
  const fileName = match?.[1] || `reporte-${id}.${formato === 'excel' ? 'xlsx' : formato}`
  const blob = await response.blob()

  return { blob, fileName }
}
