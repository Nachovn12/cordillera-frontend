const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080').replace(/\/$/, '')

const percentFormatter = new Intl.NumberFormat('es-CL', {
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
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

function toNumber(value) {
  const numberValue = Number(value)
  return Number.isFinite(numberValue) ? numberValue : null
}

function formatDate(value) {
  if (!value) return 'Sin fecha'

  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? String(value) : dateTimeFormatter.format(date)
}

function normalizeStatus(value) {
  const normalized = String(value || '').trim().toLowerCase()

  if (normalized.includes('operativo') || normalized.includes('ok') || normalized.includes('up')) {
    return { status: 'success', label: 'Operativo' }
  }

  if (normalized.includes('advert') || normalized.includes('degrad') || normalized.includes('warning')) {
    return { status: 'warning', label: 'Advertencia' }
  }

  if (normalized.includes('crít') || normalized.includes('crit') || normalized.includes('error') || normalized.includes('down')) {
    return { status: 'critical', label: 'Crítico' }
  }

  if (normalized.includes('sin conexión') || normalized.includes('offline')) {
    return { status: 'danger', label: 'Sin conexión' }
  }

  if (normalized.includes('pend')) {
    return { status: 'pending', label: 'Pendiente' }
  }

  return { status: 'info', label: value ? String(value) : 'Estado no informado' }
}

function normalizeSeverity(value) {
  const normalized = String(value || '').trim().toLowerCase()

  if (normalized.includes('crít') || normalized.includes('crit')) return { status: 'critical', label: 'Crítico' }
  if (normalized.includes('mayor') || normalized.includes('major')) return { status: 'warning', label: 'Mayor' }
  if (normalized.includes('menor') || normalized.includes('minor')) return { status: 'warning', label: 'Menor' }
  return { status: 'info', label: value ? String(value) : 'Informativo' }
}

function getServiceIcon(name) {
  const normalized = String(name || '').toLowerCase()

  if (normalized.includes('data')) return 'database'
  if (normalized.includes('kpi')) return 'kpis'
  if (normalized.includes('report')) return 'reports'
  if (normalized.includes('extern')) return 'external'
  if (normalized.includes('bff') || normalized.includes('gateway')) return 'gateway'
  return 'services'
}

function normalizeService(service, index) {
  const name = getFirstDefined(service.name, service.nombre, service.serviceName, `Servicio ${index + 1}`)
  const latency = toNumber(getFirstDefined(service.latencyMs, service.latency, service.latenciaMs, service.latencia))
  const uptime = toNumber(getFirstDefined(service.uptime, service.disponibilidad, service.availability))
  const statusMeta = normalizeStatus(getFirstDefined(service.status, service.estado, service.health))
  const rawTrend = toArray(getFirstDefined(service.trend, service.tendencia, service.history, service.historico))

  return {
    id: getFirstDefined(service.id, service.codigo, String(name).toLowerCase().replace(/\s+/g, '-')),
    name,
    status: statusMeta.status,
    statusLabel: statusMeta.label,
    latency,
    latencyLabel: latency !== null ? `${latency} ms` : 'Sin dato',
    uptime,
    uptimeLabel: uptime !== null ? `${percentFormatter.format(uptime)}%` : 'Sin dato',
    description: getFirstDefined(service.description, service.descripcion, service.detail, service.detalle, 'Sin descripción disponible'),
    icon: getServiceIcon(name),
    trend: rawTrend.map((item) => Number(getFirstDefined(item.value, item.valor, item)) || 0),
  }
}

function normalizeIncident(incident, index) {
  const severityMeta = normalizeSeverity(getFirstDefined(incident.severity, incident.severidad, incident.tipo))
  const statusMeta = normalizeStatus(getFirstDefined(incident.status, incident.estado))

  return {
    id: getFirstDefined(incident.id, incident.codigo, `incidente-${index}`),
    title: getFirstDefined(incident.title, incident.titulo, incident.nombre, 'Incidente sin título'),
    description: getFirstDefined(incident.description, incident.descripcion, incident.detalle, ''),
    severity: severityMeta.status,
    severityLabel: severityMeta.label,
    status: statusMeta.status,
    statusLabel: statusMeta.label,
    time: getFirstDefined(incident.time, incident.fecha, incident.createdAt, incident.fechaDeteccion),
    timeLabel: formatDate(getFirstDefined(incident.time, incident.fecha, incident.createdAt, incident.fechaDeteccion)),
  }
}

function normalizeEvent(event, index) {
  const statusMeta = normalizeStatus(getFirstDefined(event.status, event.estado, event.tipo))

  return {
    id: getFirstDefined(event.id, event.codigo, `evento-${index}`),
    title: getFirstDefined(event.title, event.titulo, event.nombre, 'Evento sin título'),
    description: getFirstDefined(event.description, event.descripcion, event.detalle, ''),
    status: statusMeta.status,
    statusLabel: statusMeta.label,
    timeLabel: formatDate(getFirstDefined(event.time, event.fecha, event.createdAt)),
  }
}

function normalizeAvailability(item, index) {
  return {
    id: getFirstDefined(item.id, item.label, item.fecha, `availability-${index}`),
    label: getFirstDefined(item.label, item.fecha, item.dia, `Día ${index + 1}`),
    value: toNumber(getFirstDefined(item.value, item.valor, item.uptime, item.disponibilidad)) ?? 0,
  }
}

export function normalizeServicesResponse(payload) {
  const rawServices = Array.isArray(payload)
    ? payload
    : Array.isArray(payload?.services)
      ? payload.services
      : Array.isArray(payload?.servicios)
        ? payload.servicios
        : []

  return {
    services: rawServices.map(normalizeService),
    incidents: toArray(getFirstDefined(payload?.incidents, payload?.incidentes)).map(normalizeIncident),
    events: toArray(getFirstDefined(payload?.events, payload?.eventos)).map(normalizeEvent),
    availabilityHistory: toArray(getFirstDefined(
      payload?.availabilityHistory,
      payload?.historialDisponibilidad,
      payload?.availability,
    )).map(normalizeAvailability),
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

export async function getServicesStatus() {
  const response = await requestWithTimeout(`${API_BASE_URL}/api/dashboard/services`)

  if (!response.ok) {
    throw new Error(`BFF Gateway respondió con estado HTTP ${response.status}`)
  }

  const text = await response.text()
  const payload = text ? JSON.parse(text) : {}

  return normalizeServicesResponse(payload)
}
