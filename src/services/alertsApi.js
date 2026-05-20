const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8081').replace(/\/$/, '')

const dateTimeFormatter = new Intl.DateTimeFormat('es-CL', {
  dateStyle: 'short',
  timeStyle: 'short',
})

const timeFormatter = new Intl.DateTimeFormat('es-CL', {
  hour: '2-digit',
  minute: '2-digit',
})

function getFirstDefined(...values) {
  return values.find((value) => value !== undefined && value !== null)
}

function toArray(value) {
  return Array.isArray(value) ? value : []
}

function normalizeSeverity(value) {
  const normalized = String(value || '').trim().toLowerCase()

  if (normalized.includes('crít') || normalized.includes('crit') || normalized.includes('critical')) {
    return { severity: 'critical', label: 'Crítica' }
  }

  if (normalized.includes('advert') || normalized.includes('warning')) {
    return { severity: 'warning', label: 'Advertencia' }
  }

  if (normalized.includes('resuelta') || normalized.includes('resolved')) {
    return { severity: 'resolved', label: 'Resuelta' }
  }

  return { severity: 'info', label: value ? String(value) : 'Informativa' }
}

function normalizeState(value) {
  const normalized = String(value || '').trim().toLowerCase()

  if (normalized.includes('resuelt') || normalized.includes('resolved')) {
    return { status: 'resolved', label: 'Resuelta' }
  }

  if (normalized.includes('seguimiento')) {
    return { status: 'info', label: 'En seguimiento' }
  }

  if (normalized.includes('pend')) {
    return { status: 'pending', label: 'Pendiente' }
  }

  if (normalized.includes('activa') || normalized.includes('active') || normalized.includes('abierta')) {
    return { status: 'warning', label: 'Activa' }
  }

  return { status: 'info', label: value ? String(value) : 'Estado no informado' }
}

function getIconByCategory(category, severity) {
  const normalized = String(category || '').toLowerCase()

  if (normalized.includes('serv')) return 'services'
  if (normalized.includes('reporte')) return 'document'
  if (normalized.includes('kpi')) return 'kpis'
  if (normalized.includes('invent')) return 'inventory'
  if (severity === 'critical') return 'shield'
  return 'alerts'
}

function formatDetectedAt(value) {
  if (!value) return 'Sin fecha'

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return String(value)

  const today = new Date()
  const sameDay = date.toDateString() === today.toDateString()

  return sameDay ? `Hoy ${timeFormatter.format(date)}` : dateTimeFormatter.format(date)
}

function normalizeAlert(alert, index) {
  const severityMeta = normalizeSeverity(getFirstDefined(alert.severidad, alert.severity, alert.tipo, alert.type))
  const stateMeta = normalizeState(getFirstDefined(alert.estado, alert.status, alert.state))
  const category = getFirstDefined(alert.categoria, alert.category, 'General')
  const detectedAt = getFirstDefined(
    alert.fechaDeteccion,
    alert.detectedAt,
    alert.createdAt,
    alert.fecha,
    alert.time,
  )

  return {
    id: getFirstDefined(alert.id, alert.codigo, `alerta-${index}`),
    title: getFirstDefined(alert.titulo, alert.title, alert.nombre, 'Alerta sin título'),
    description: getFirstDefined(alert.descripcion, alert.description, alert.mensaje, alert.message, ''),
    category,
    origin: getFirstDefined(alert.origen, alert.origin, alert.fuente, category),
    severity: severityMeta.severity,
    severityLabel: severityMeta.label,
    status: stateMeta.status,
    statusLabel: stateMeta.label,
    detectedAt,
    detectedAtLabel: formatDetectedAt(detectedAt),
    icon: getIconByCategory(category, severityMeta.severity),
  }
}

function normalizeHistoryItem(item, index) {
  const base = normalizeAlert(item, index)

  return {
    ...base,
    title: getFirstDefined(item.titulo, item.title, item.evento, item.nombre, base.title),
    description: getFirstDefined(item.descripcion, item.description, item.detalle, item.mensaje, base.description),
  }
}

function normalizeHeatmapItem(item, index) {
  return {
    id: getFirstDefined(item.id, item.dia, item.fecha, `volumen-${index}`),
    label: getFirstDefined(item.label, item.dia, item.fecha, `Día ${index + 1}`),
    values: toArray(getFirstDefined(item.values, item.valores, item.volumenes)).map((value) => Number(value) || 0),
  }
}

export function normalizeAlertsResponse(payload) {
  const rawAlerts = Array.isArray(payload)
    ? payload
    : Array.isArray(payload?.alertas)
      ? payload.alertas
      : Array.isArray(payload?.alerts)
        ? payload.alerts
        : []

  return {
    alertas: rawAlerts.map(normalizeAlert),
    historial: toArray(getFirstDefined(payload?.historial, payload?.history, payload?.eventos)).map(normalizeHistoryItem),
    heatmap: toArray(getFirstDefined(payload?.heatmap, payload?.volumenPorDia, payload?.volumenes)).map(normalizeHeatmapItem),
    fetchedAt: new Date().toLocaleString('es-CL', {
      dateStyle: 'short',
      timeStyle: 'short',
    }),
  }
}

async function requestWithTimeout(url) {
  const controller = new AbortController()
  const timeoutId = window.setTimeout(() => controller.abort(), 8000)

  try {
    return await fetch(url, {
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

export async function getAlertas() {
  const response = await requestWithTimeout(`${API_BASE_URL}/api/dashboard/alertas`)

  if (!response.ok) {
    throw new Error(`BFF Gateway respondió con estado HTTP ${response.status}`)
  }

  const text = await response.text()
  const payload = text ? JSON.parse(text) : {}

  return normalizeAlertsResponse(payload)
}
