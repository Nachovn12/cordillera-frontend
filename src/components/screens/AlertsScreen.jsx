import { useMemo, useState } from 'react'
import useAlerts from '../../hooks/useAlerts'
import AlertItem from '../dashboard/AlertItem'
import AppIcon from '../ui/AppIcon'
import MetricCard from '../ui/MetricCard'
import SectionHeader from '../ui/SectionHeader'
import StatusBadge from '../ui/StatusBadge'

const tabs = [
  { label: 'Todas', value: 'todas', icon: 'layers' },
  { label: 'Críticas', value: 'criticas', icon: 'shield' },
  { label: 'Operacionales', value: 'operacionales', icon: 'settings' },
  { label: 'Reportes', value: 'reportes', icon: 'document' },
  { label: 'Servicios', value: 'servicios', icon: 'services' },
]

function isToday(value) {
  if (!value) return false

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return false

  return date.toDateString() === new Date().toDateString()
}

function buildMetrics(alerts) {
  const active = alerts.filter((alert) => alert.statusLabel === 'Activa' || alert.status === 'warning').length
  const critical = alerts.filter((alert) => alert.severity === 'critical').length
  const tracking = alerts.filter((alert) => alert.statusLabel === 'En seguimiento').length
  const resolvedToday = alerts.filter((alert) => alert.status === 'resolved' && isToday(alert.detectedAt)).length

  return [
    {
      title: 'Alertas activas',
      value: String(active),
      detail: active === 1 ? '1 alerta activa' : `${active} alertas activas`,
      icon: 'alerts',
      tone: active > 0 ? 'warning' : 'success',
    },
    {
      title: 'Críticas',
      value: String(critical),
      detail: critical > 0 ? 'Atención inmediata' : 'Sin críticas informadas',
      icon: 'shield',
      tone: critical > 0 ? 'critical' : 'success',
    },
    {
      title: 'En seguimiento',
      value: String(tracking),
      detail: tracking > 0 ? 'Asignadas a revisión' : 'Sin seguimiento informado',
      icon: 'target',
      tone: 'info',
    },
    {
      title: 'Resueltas hoy',
      value: String(resolvedToday),
      detail: resolvedToday > 0 ? 'Cerradas hoy' : 'Sin resoluciones hoy',
      icon: 'checkCircle',
      tone: 'success',
    },
  ]
}

function filterAlerts(alerts, activeTab, query) {
  const normalizedQuery = query.trim().toLowerCase()

  return alerts.filter((alert) => {
    const matchesTab = activeTab === 'todas'
      || (activeTab === 'criticas' && alert.severity === 'critical')
      || (activeTab === 'operacionales' && String(alert.category).toLowerCase().includes('operacional'))
      || (activeTab === 'reportes' && String(alert.category).toLowerCase().includes('reporte'))
      || (activeTab === 'servicios' && String(alert.category).toLowerCase().includes('serv'))

    const matchesSearch = !normalizedQuery
      || [alert.title, alert.description, alert.category, alert.origin, alert.statusLabel, alert.severityLabel]
        .some((value) => String(value || '').toLowerCase().includes(normalizedQuery))

    return matchesTab && matchesSearch
  })
}

function AlertsLoadingState() {
  return (
    <main className="screen screen--alerts">
      <section className="metric-grid metric-grid--four" aria-label="Cargando resumen de alertas">
        {['metric-1', 'metric-2', 'metric-3', 'metric-4'].map((item) => (
          <article className="metric-card dashboard-skeleton" key={item} />
        ))}
      </section>
      <section className="alerts-toolbar dashboard-skeleton" aria-label="Cargando filtros de alertas" />
      <section className="content-grid content-grid--alerts">
        <div className="panel panel--alerts-list dashboard-skeleton dashboard-skeleton--large" />
        <aside className="side-stack">
          <div className="panel panel--priority dashboard-skeleton" />
          <div className="panel panel--history dashboard-skeleton" />
        </aside>
      </section>
    </main>
  )
}

function AlertsErrorState({ error, onRetry }) {
  return (
    <main className="screen screen--alerts">
      <section className="integration-error-state" role="alert" aria-live="polite">
        <div className="icon-box icon-box--warning">
          <AppIcon name="gatewayOff" size={25} strokeWidth={2} />
        </div>
        <div>
          <StatusBadge status="warning" label="Endpoint pendiente" />
          <h2>Centro de Alertas pendiente de conexión</h2>
          <p>El frontend está operativo, pero aún no recibe alertas desde el BFF Gateway.</p>
          <small>Endpoint esperado: GET /api/dashboard/alertas</small>
          <details>
            <summary>Ver detalle técnico</summary>
            <span>{error?.message || 'No fue posible conectar con BFF Gateway.'}</span>
          </details>
        </div>
        <button type="button" onClick={onRetry} aria-label="Reintentar carga de alertas">
          <AppIcon name="refresh" size={16} strokeWidth={2} />
          Reintentar
        </button>
      </section>
    </main>
  )
}

function AlertsEmptyState({ onRetry }) {
  return (
    <main className="screen screen--alerts">
      <section className="integration-empty-state">
        <div className="icon-box icon-box--info">
          <AppIcon name="alerts" size={25} strokeWidth={2} />
        </div>
        <div>
          <StatusBadge status="info" label="Sin alertas" />
          <h2>No hay alertas disponibles</h2>
          <p>Cuando el BFF reciba eventos operacionales o alertas de KPIs, aparecerán en este panel.</p>
        </div>
        <button type="button" onClick={onRetry} aria-label="Actualizar alertas">
          <AppIcon name="refresh" size={16} strokeWidth={2} />
          Actualizar
        </button>
      </section>
    </main>
  )
}

function PriorityPanel({ alerts }) {
  const priorityAlerts = alerts
    .filter((alert) => alert.severity === 'critical' || alert.severity === 'warning')
    .slice(0, 4)

  if (!priorityAlerts.length) return null

  return (
    <div className="panel panel--priority">
      <SectionHeader title="Alertas prioritarias" description="Derivadas desde datos reales del BFF." />
      <div className="stack-list">
        {priorityAlerts.map((alert) => (
          <article className="priority-alert" key={alert.id}>
            <span className={`priority-alert__icon priority-alert__icon--${alert.severity === 'critical' ? 'critical' : 'warning'}`}>
              <AppIcon name={alert.severity === 'critical' ? 'shield' : 'alerts'} size={18} strokeWidth={2} />
            </span>
            <div className="priority-alert__body">
              <h3>{alert.title}</h3>
              <p>{alert.origin}</p>
            </div>
            <div className="priority-alert__meta">
              <StatusBadge status={alert.severity} label={alert.severityLabel} />
              <time>{alert.detectedAtLabel}</time>
            </div>
          </article>
        ))}
      </div>
    </div>
  )
}

function HistoryPanel({ history }) {
  if (!history.length) return null

  return (
    <div className="panel panel--history">
      <SectionHeader title="Historial reciente" description="Eventos entregados por el BFF." />
      <div className="stack-list">
        {history.map((item) => (
          <article className="history-item" key={item.id}>
            <span className="history-item__icon history-item__icon--info">
              <AppIcon name={item.icon || 'document'} size={17} strokeWidth={2} />
            </span>
            <div className="history-item__body">
              <h3>{item.title}</h3>
              <p>{item.description}</p>
            </div>
            <div className="history-item__meta">
              <StatusBadge status={item.status} label={item.statusLabel} />
              <time>{item.detectedAtLabel}</time>
            </div>
          </article>
        ))}
      </div>
    </div>
  )
}

function HeatmapPanel({ rows }) {
  if (!rows.length || rows.every((row) => row.values.length === 0)) return null

  return (
    <section className="panel panel--heatmap">
      <SectionHeader title="Volumen de alertas por día" description="Datos entregados por el BFF Gateway." />
      <div className="heatmap">
        <div className="heatmap__grid">
          {rows.map((row) => (
            <div className="heatmap__row" key={row.id}>
              <strong>{row.label}</strong>
              {row.values.slice(0, 7).map((value, index) => (
                <span
                  className={`heatmap__cell heatmap__cell--${value > 10 ? 'high' : value > 5 ? 'mid' : value > 2 ? 'low' : value > 0 ? 'soft' : 'zero'}`}
                  title={`${value} alertas`}
                  key={`${row.id}-${index}`}
                />
              ))}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default function AlertsScreen() {
  const { data, loading, error, refetch } = useAlerts()
  const [activeTab, setActiveTab] = useState('todas')
  const [query, setQuery] = useState('')

  const alerts = data?.alertas || []
  const visibleAlerts = useMemo(() => filterAlerts(alerts, activeTab, query), [alerts, activeTab, query])

  if (loading) {
    return <AlertsLoadingState />
  }

  if (error) {
    return <AlertsErrorState error={error} onRetry={refetch} />
  }

  if (alerts.length === 0) {
    return <AlertsEmptyState onRetry={refetch} />
  }

  const metrics = buildMetrics(alerts)

  return (
    <main className="screen screen--alerts">
      <section className="metric-grid metric-grid--four" aria-label="Resumen de alertas">
        {metrics.map((metric) => (
          <MetricCard key={metric.title} {...metric} />
        ))}
      </section>

      <section className="alerts-toolbar" aria-label="Filtros de alertas">
        <div className="tab-list">
          {tabs.map((tab) => (
            <button
              className={activeTab === tab.value ? 'is-active' : ''}
              type="button"
              key={tab.value}
              onClick={() => setActiveTab(tab.value)}
            >
              <AppIcon name={tab.icon} size={15} strokeWidth={2} />
              {tab.label}
            </button>
          ))}
        </div>
        <div className="search-box">
          <AppIcon name="search" size={16} strokeWidth={2} />
          <input
            type="text"
            placeholder="Buscar alerta..."
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </div>
        <button className="secondary-button" type="button" onClick={refetch}>
          <AppIcon name="refresh" size={15} strokeWidth={2} />
          Actualizar
        </button>
      </section>

      <section className="content-grid content-grid--alerts" aria-label="Listado de alertas">
        <div className="panel panel--alerts-list">
          {visibleAlerts.length > 0 ? (
            <>
              <div className="alerts-card-list">
                {visibleAlerts.map((alert) => (
                  <AlertItem table alert={alert} key={alert.id} />
                ))}
              </div>
              <div className="table-footer">
                <span>Mostrando 1 a {visibleAlerts.length} de {alerts.length} alertas</span>
              </div>
            </>
          ) : (
            <div className="alerts-empty-inline">
              <AppIcon name="search" size={22} strokeWidth={2} />
              <strong>Sin resultados para los filtros actuales</strong>
              <span>Ajusta el criterio de búsqueda o cambia la categoría seleccionada.</span>
            </div>
          )}
        </div>

        <aside className="side-stack">
          <PriorityPanel alerts={alerts} />
          <HistoryPanel history={data?.historial || []} />
        </aside>
      </section>

      <HeatmapPanel rows={data?.heatmap || []} />
    </main>
  )
}
