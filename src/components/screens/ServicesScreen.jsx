import { useEffect } from 'react'
import ServiceStatusCard from '../dashboard/ServiceStatusCard'
import TrendPanel from '../dashboard/TrendPanel'
import AppIcon from '../ui/AppIcon'
import MetricCard from '../ui/MetricCard'
import SectionHeader from '../ui/SectionHeader'
import StatusBadge from '../ui/StatusBadge'
import useDashboardStats from '../../hooks/useDashboardStats'

const percentFormatter = new Intl.NumberFormat('es-CL', {
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
})

function buildMetrics(data) {
  const services = data.services || []
  const alerts = data.alertas || []
  const operative = services.filter((service) => service.status === 'success').length
  const openIncidents = alerts.length

  return [
    {
      title: 'Servicios operativos',
      value: `${operative} / ${services.length}`,
      detail: 'Calculado desde BFF Gateway',
      icon: 'shield',
      tone: operative === services.length ? 'success' : 'warning',
    },
    {
      title: 'Alertas activas',
      value: String(openIncidents),
      detail: alerts.length ? 'Informados por BFF' : 'Sin alertas críticas',
      icon: 'warning',
      tone: openIncidents > 0 ? 'warning' : 'success',
    },
    {
      title: 'Tiempo promedio de respuesta',
      value: services.some(s => s.latency !== null)
        ? `${Math.round(services.reduce((acc, s) => acc + (s.latency || 0), 0) / services.filter(s => s.latency !== null).length)} ms`
        : 'No medido',
      detail: services.some(s => s.latency !== null) ? 'Latencia de red interna' : 'Dato no entregado por BFF',
      icon: 'clock',
      tone: 'info',
    },
    {
      title: 'Disponibilidad promedio',
      value: services.some(s => s.uptime !== null)
        ? `${percentFormatter.format(services.reduce((acc, s) => acc + (s.uptime || 0), 0) / services.filter(s => s.uptime !== null).length)}%`
        : 'No medida',
      detail: services.some(s => s.uptime !== null) ? 'Uptime reportado' : 'Sin histórico de uptime',
      icon: 'shield',
      tone: 'info',
    },
  ]
}

function ServicesLoadingState() {
  return (
    <main className="screen screen--services">
      <section className="metric-grid metric-grid--four" aria-label="Cargando resumen de servicios">
        {['metric-1', 'metric-2', 'metric-3', 'metric-4'].map((item) => (
          <article className="metric-card dashboard-skeleton" key={item} />
        ))}
      </section>
      <section className="content-grid content-grid--services">
        <div className="panel dashboard-skeleton dashboard-skeleton--large" />
        <div className="panel dashboard-skeleton dashboard-skeleton--large" />
      </section>
    </main>
  )
}

function ServicesErrorState({ error, onRetry }) {
  return (
    <main className="screen screen--services">
      <section className="integration-error-state" role="alert" aria-live="polite">
        <div className="icon-box icon-box--warning">
          <AppIcon name="gatewayOff" size={25} strokeWidth={2} />
        </div>
        <div>
          <StatusBadge status="warning" label="Endpoint pendiente" />
          <h2>Estado de Servicios pendiente de conexión</h2>
          <p>El frontend está operativo, pero aún no recibe el estado de microservicios desde el BFF Gateway.</p>
          <small>Endpoint esperado: GET /api/dashboard/services</small>
          <details>
            <summary>Ver detalle técnico</summary>
            <span>{error?.message || 'No fue posible conectar con BFF Gateway.'}</span>
          </details>
        </div>
        <button type="button" onClick={onRetry} aria-label="Reintentar carga de servicios">
          <AppIcon name="refresh" size={16} strokeWidth={2} />
          Reintentar
        </button>
      </section>
    </main>
  )
}

function ServicesEmptyState({ onRetry }) {
  return (
    <main className="screen screen--services">
      <section className="integration-empty-state">
        <div className="icon-box icon-box--info">
          <AppIcon name="services" size={25} strokeWidth={2} />
        </div>
        <div>
          <StatusBadge status="info" label="Sin servicios" />
          <h2>No hay servicios disponibles</h2>
          <p>Cuando el BFF entregue la salud de los microservicios, se visualizará en este panel.</p>
        </div>
        <button type="button" onClick={onRetry} aria-label="Actualizar servicios">
          <AppIcon name="refresh" size={16} strokeWidth={2} />
          Actualizar
        </button>
      </section>
    </main>
  )
}

function DependencyNode({ icon, title, subtitle, status, label, main = false }) {
  return (
    <article className={`dependency-node${main ? ' dependency-node--main' : ''}`}>
      <span className="dependency-node__icon">
        <AppIcon name={icon} size={18} strokeWidth={2} />
      </span>
      <div>
        <strong>{title}</strong>
        {subtitle && <small>{subtitle}</small>}
      </div>
      <StatusBadge status={status} label={label} />
    </article>
  )
}

function DependencyMap({ services }) {
  const gateway = services.find((service) => /bff|gateway/i.test(service.name))
  const internalServices = services.filter((service) => service.id !== gateway?.id)

  return (
    <div className="dependency-map dependency-map--stable">
      <div className="dependency-lane">
        <DependencyNode
          icon="monitor"
          title="Clientes"
          subtitle="Frontend React"
          status="info"
          label="Operativo"
        />
        <span className="dependency-arrow" aria-hidden="true">
          <AppIcon name="arrowRight" size={18} strokeWidth={2} />
        </span>
        <DependencyNode
          icon={gateway?.icon || 'gateway'}
          title={gateway?.name || 'BFF Gateway'}
          subtitle={gateway?.description || 'Respuesta recibida desde BFF'}
          status={gateway?.status || 'success'}
          label={gateway?.statusLabel || 'Conectado'}
          main
        />
        <span className="dependency-arrow" aria-hidden="true">
          <AppIcon name="arrowRight" size={18} strokeWidth={2} />
        </span>
        <div className="dependency-services-stack">
          {internalServices.length > 0 ? (
            internalServices.map((service) => (
              <DependencyNode
                icon={service.icon}
                title={service.name}
                subtitle={service.description}
                status={service.status}
                label={service.statusLabel}
                key={service.id}
              />
            ))
          ) : (
            <div className="dependency-empty-node">
              <AppIcon name="services" size={18} strokeWidth={2} />
              <span>Sin servicios internos informados por BFF</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function EventsPanel({ events }) {
  if (!events.length) return null

  return (
    <div className="panel">
      <SectionHeader title="Eventos recientes" description="Eventos entregados por el BFF." />
      <div className="stack-list">
        {events.map((event) => (
          <article className="service-event" key={event.id}>
            <span className={`event-icon event-icon--${event.status === 'critical' ? 'warning' : event.status}`}>
              <AppIcon name={event.status === 'success' ? 'checkCircle' : event.status === 'warning' ? 'warning' : 'document'} size={18} strokeWidth={2.2} />
            </span>
            <div className="service-event__content">
              <h3>{event.title}</h3>
              <p>{event.description}</p>
            </div>
            <time className="service-event__time">{event.timeLabel}</time>
          </article>
        ))}
      </div>
    </div>
  )
}

function IncidentsPanel({ incidents }) {
  if (!incidents.length) return null

  const summary = ['Crítico', 'Mayor', 'Menor', 'Informativo'].map((label) => ({
    label,
    count: incidents.filter((incident) => incident.severityLabel === label).length,
  }))

  return (
    <div className="panel incident-panel">
      <SectionHeader title="Estado de incidentes" description="Incidentes informados por el BFF." />
      <div className="incident-summary">
        {summary.map((item) => (
          <div className="incident-summary__item" key={item.label}>
            <span className={`incident-summary__val${item.label === 'Crítico' ? ' incident-summary__val--critical' : ''}`}>
              {item.count}
            </span>
            <span className="incident-summary__label">{item.label}</span>
          </div>
        ))}
        <div className="incident-summary__item incident-summary__item--total">
          <span className="incident-summary__val">{incidents.length}</span>
          <span className="incident-summary__label">Total</span>
        </div>
      </div>
      <div className="incident-list">
        {incidents.map((incident) => (
          <article className="incident-row" key={incident.id}>
            <StatusBadge status={incident.severity} label={incident.severityLabel} />
            <div className="incident-row__content">
              <h3>{incident.title}</h3>
              <p>{incident.description || incident.statusLabel}</p>
            </div>
            <time className="incident-row__time">{incident.timeLabel}</time>
          </article>
        ))}
      </div>
    </div>
  )
}

export default function ServicesScreen({ onBffStatusChange }) {
  const { data, loading, error, refetch } = useDashboardStats()

  useEffect(() => {
    if (loading) {
      onBffStatusChange?.({ status: 'info', label: 'Consultando' })
    } else if (error) {
      onBffStatusChange?.({ status: 'danger', label: 'Error' })
    } else if (data) {
      onBffStatusChange?.({ status: 'success', label: 'Operativo' })
    }
  }, [loading, error, data, onBffStatusChange])

  if (loading) {
    return <ServicesLoadingState />
  }

  if (error) {
    return <ServicesErrorState error={error} onRetry={refetch} />
  }

  const services = data?.services || []

  if (services.length === 0) {
    return <ServicesEmptyState onRetry={refetch} />
  }

  const metrics = buildMetrics(data)
  // Extract empty arrays since stats endpoint does not provide them
  const incidents = []
  const events = []
  const availabilityHistory = []
  const availabilityAverage = null

  return (
    <main className="screen screen--services">
      <section className="metric-grid metric-grid--four" aria-label="Resumen de estado de servicios">
        {metrics.map((metric) => (
          <MetricCard key={metric.title} {...metric} />
        ))}
      </section>

      <section className="content-grid content-grid--services">
        <div className="panel">
          <SectionHeader title="Servicios monitoreados" description="Servicios entregados por el BFF Gateway." />
          <div className="service-grid">
            {services.map((service) => (
              <ServiceStatusCard service={service} key={service.id} />
            ))}
          </div>
        </div>

        <div className="panel">
          <SectionHeader title="Mapa de dependencias" description="Flujo estable basado en servicios reales." />
          <DependencyMap services={services} />
        </div>
      </section>

      {(events.length > 0 || availabilityHistory.length > 0 || incidents.length > 0) && (
        <section className="content-grid content-grid--services-bottom">
          <EventsPanel events={events} />
          {availabilityHistory.length > 0 && (
            <TrendPanel
              type="line"
              title="Métricas de disponibilidad"
              description="Histórico entregado por el BFF Gateway."
              badge={availabilityAverage !== null ? `${percentFormatter.format(availabilityAverage)}%` : null}
              data={availabilityHistory}
            />
          )}
          <IncidentsPanel incidents={incidents} />
        </section>
      )}
    </main>
  )
}
