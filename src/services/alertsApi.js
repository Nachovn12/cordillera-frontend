import { getDashboardStats } from './dashboardApi'
import { getReportes } from './reportsApi'

const dateTimeFormatter = new Intl.DateTimeFormat('es-CL', {
  dateStyle: 'short',
  timeStyle: 'short',
})

function formatDetectedAt(value) {
  if (!value) return 'Reciente'

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return String(value)

  return dateTimeFormatter.format(date)
}

function createAlert({
  id,
  title,
  description,
  category,
  severity,
  severityLabel,
  status,
  statusLabel,
  origin,
  detectedAt,
  icon,
  recommendation,
}) {
  return {
    id,
    title,
    description,
    category,
    severity,
    severityLabel,
    status,
    statusLabel,
    origin,
    detectedAt,
    detectedAtLabel: formatDetectedAt(detectedAt),
    icon,
    recommendation,
    reviewed: false,
  }
}

function normalizeBffLabel(value) {
  return String(value || '').trim().toLowerCase()
}

export function buildAlertsFromBackend({ dashboard, reports }) {
  const detectedAt = new Date().toISOString()
  const alerts = []
  const bffStatusLabel = normalizeBffLabel(dashboard?.bffStatus?.label)

  if (bffStatusLabel === 'operativo') {
    alerts.push(createAlert({
      id: 'event-bff-operativo',
      title: 'Flujo BFF operativo',
      description: 'Frontend, BFF Gateway y microservicios principales responden correctamente.',
      category: 'Servicios',
      severity: 'info',
      severityLabel: 'Informativa',
      status: 'resolved',
      statusLabel: 'Resuelta',
      origin: 'BFF Gateway',
      detectedAt,
      icon: 'services',
      recommendation: 'Validar disponibilidad desde Estado de Servicios.',
    }))
  } else if (bffStatusLabel === 'degradado') {
    alerts.push(createAlert({
      id: 'alert-bff-degradado',
      title: 'BFF Gateway en estado degradado',
      description: 'El BFF respondió con estado degradado. Revisar servicios internos.',
      category: 'Servicios',
      severity: 'critical',
      severityLabel: 'Crítica',
      status: 'warning',
      statusLabel: 'Activa',
      origin: 'BFF Gateway',
      detectedAt,
      icon: 'shield',
      recommendation: 'Validar disponibilidad desde Estado de Servicios.',
    }))
  }

  const warningKpis = (dashboard?.kpis || []).filter((kpi) => kpi.status === 'warning')

  if (warningKpis.length > 0) {
    alerts.push(createAlert({
      id: 'alert-kpis-advertencia',
      title: 'KPIs requieren revisión',
      description: 'Existen indicadores con estado de advertencia.',
      category: 'Operacionales',
      severity: 'warning',
      severityLabel: 'Media',
      status: 'warning',
      statusLabel: 'Activa',
      origin: 'KPI Service',
      detectedAt,
      icon: 'kpis',
      recommendation: 'Revisar indicadores con estado Advertencia.',
    }))
  }

  const reportList = reports?.reportes || []

  if (reportList.length > 0) {
    alerts.push(createAlert({
      id: 'event-reportes-disponibles',
      title: 'Reportes disponibles',
      description: 'Report Service entregó reportes ejecutivos disponibles para consulta.',
      category: 'Reportes',
      severity: 'info',
      severityLabel: 'Informativa',
      status: 'resolved',
      statusLabel: 'Resuelta',
      origin: 'Report Service',
      detectedAt,
      icon: 'document',
      recommendation: 'Verificar Centro de Reportes.',
    }))
  } else {
    alerts.push(createAlert({
      id: 'event-sin-reportes',
      title: 'Sin reportes recientes informados',
      description: 'El BFF no entregó reportes recientes para esta consulta.',
      category: 'Reportes',
      severity: 'info',
      severityLabel: 'Informativa',
      status: 'info',
      statusLabel: 'Informativa',
      origin: 'BFF Gateway',
      detectedAt,
      icon: 'document',
      recommendation: 'Verificar Centro de Reportes.',
    }))
  }

  ;(dashboard?.services || [])
    .filter((service) => service.status !== 'success')
    .forEach((service) => {
      alerts.push(createAlert({
        id: `alert-servicio-${service.id}`,
        title: `${service.name} requiere revisión`,
        description: `${service.name} fue informado con estado ${service.statusLabel}.`,
        category: 'Servicios',
        severity: service.status === 'danger' ? 'critical' : 'warning',
        severityLabel: service.status === 'danger' ? 'Crítica' : 'Media',
        status: 'warning',
        statusLabel: 'Activa',
        origin: 'BFF Gateway',
        detectedAt,
        icon: 'services',
        recommendation: 'Validar disponibilidad desde Estado de Servicios.',
      }))
    })

  return alerts
}

export async function getAlertas() {
  const [dashboard, reports] = await Promise.all([
    getDashboardStats(),
    getReportes().catch(() => ({ reportes: [] })),
  ])
  const alertas = buildAlertsFromBackend({ dashboard, reports })
  const historial = [...alertas]
    .sort((first, second) => new Date(second.detectedAt) - new Date(first.detectedAt))
    .slice(0, 5)

  return {
    alertas,
    historial,
    heatmap: [],
    fetchedAt: new Date().toLocaleString('es-CL', {
      dateStyle: 'short',
      timeStyle: 'short',
    }),
  }
}
