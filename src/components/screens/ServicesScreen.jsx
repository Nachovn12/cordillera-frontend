import { useEffect, useState } from 'react'
import ServiceStatusCard from '../dashboard/ServiceStatusCard'
import TrendPanel from '../dashboard/TrendPanel'
import AppIcon from '../ui/AppIcon'
import MetricCard from '../ui/MetricCard'
import SectionHeader from '../ui/SectionHeader'
import StatusBadge from '../ui/StatusBadge'
import useDashboardStats from '../../hooks/useDashboardStats'

function getServiceContextualData(service) {
  const name = String(service?.name || '').toLowerCase()

  if (name.includes('data')) {
    return {
      portProtocol: ':8083 · Spring Boot 3 REST Service',
      dbConnection: 'MySQL 8 (data_db.datos) · XAMPP localhost:3306',
      archRole: 'Repositorio transaccional de ventas, inventario, finanzas y CRM consolidados por sucursal.',
      chartTitle: 'Tráfico por Sistema de Origen',
      chartDesc: 'Distribución transaccional por módulo POS & ERP.',
      distribution: [
        { name: 'POS Retail (Punto de Venta)', share: 52, valueLabel: '52% volumen' },
        { name: 'Finanzas & Tesorería', share: 28, valueLabel: '28% volumen' },
        { name: 'E-commerce & Web Orders', share: 20, valueLabel: '20% volumen' }
      ],
      endpoints: [
        { method: 'GET', path: '/api/v1/datos/sucursal/{id}', desc: 'Datos filtrados por sucursal' },
        { method: 'POST', path: '/api/v1/datos', desc: 'Registro transaccional POS/ERP' }
      ]
    }
  }

  if (name.includes('kpi')) {
    return {
      portProtocol: ':8082 · Spring Boot 3 KPI Engine',
      dbConnection: 'MySQL 8 (data_db.kpis) · XAMPP localhost:3306',
      archRole: 'Motor estadístico para evaluación de metas comerciales, rotación logística y rentabilidad.',
      chartTitle: 'Evaluación por Área Estratégica',
      chartDesc: 'Carga computacional de indicadores directivos.',
      distribution: [
        { name: 'Ventas & Facturación POS', share: 44, valueLabel: '44% del motor' },
        { name: 'Eficiencia Logística & Stock', share: 32, valueLabel: '32% del motor' },
        { name: 'Margen Financiero & EBITDA', share: 24, valueLabel: '24% del motor' }
      ],
      endpoints: [
        { method: 'GET', path: '/api/v1/kpis', desc: 'Consolidado general de KPIs' },
        { method: 'GET', path: '/api/v1/kpis/categoria/{cat}', desc: 'Filtrado por área de negocio' }
      ]
    }
  }

  if (name.includes('report')) {
    return {
      portProtocol: ':8084 · Spring Boot 3 Document Engine',
      dbConnection: 'MySQL 8 (data_db.reportes) · XAMPP localhost:3306',
      archRole: 'Generador y catalogador de informes corporativos en formatos PDF, Excel y CSV.',
      chartTitle: 'Demanda por Formato Documental',
      chartDesc: 'Desglose de exportaciones gerenciales.',
      distribution: [
        { name: 'PDF Ejecutivo de Directorio', share: 65, valueLabel: '65% solicitudes' },
        { name: 'Excel Detallado Financiero', share: 25, valueLabel: '25% solicitudes' },
        { name: 'CSV para Auditoría Externa', share: 10, valueLabel: '10% solicitudes' }
      ],
      endpoints: [
        { method: 'GET', path: '/api/v1/reportes', desc: 'Catálogo de reportes emitidos' },
        { method: 'GET', path: '/api/v1/reportes/{id}/descargar', desc: 'Descarga documental binaria' }
      ]
    }
  }

  return {
    portProtocol: ':8080 · Spring Boot 3 BFF Gateway',
    dbConnection: 'Orquestador HTTP -> :8082, :8083, :8084',
    archRole: 'Punto de entrada único para React, balanceo de carga y control de fallos en cascada.',
    chartTitle: 'Tráfico de Orquestación por Módulo',
    chartDesc: 'Peticiones procesadas por el BFF Gateway.',
    distribution: [
      { name: 'Consultas Dashboard & Ventas', share: 48, valueLabel: '48% tráfico' },
      { name: 'Evaluación KPIs & Alertas', share: 32, valueLabel: '32% tráfico' },
      { name: 'Gestión Documental & Reportes', share: 20, valueLabel: '20% tráfico' }
    ],
    endpoints: [
      { method: 'GET', path: '/api/dashboard/stats', desc: 'Agregación de salud general' },
      { method: 'GET', path: '/api/dashboard/sucursal/{id}', desc: 'Consolidación por sucursal' }
    ]
  }
}

function ServiceDetailModal({ service, onClose }) {
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  if (!service) return null

  const ctx = getServiceContextualData(service)

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        padding: '1.25rem',
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: '#ffffff',
          borderRadius: '16px',
          width: '100%',
          maxWidth: '860px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          border: '1px solid #e2e8f0',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cabecera Directiva */}
        <div
          style={{
            padding: '1.1rem 1.6rem',
            borderBottom: '1px solid #e2e8f0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: '#f8fafc',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
            <span
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                background: '#e0f2fe',
                color: '#0284c7',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <AppIcon name={service.icon || 'services'} size={20} strokeWidth={2} />
            </span>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.08rem', fontWeight: 800, color: '#0f172a' }}>
                {service.name}
              </h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginTop: '0.2rem' }}>
                <span style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 600 }}>
                  {ctx.portProtocol}
                </span>
                <span style={{ color: '#cbd5e1' }}>•</span>
                <StatusBadge status={service.status || 'success'} label={service.statusLabel || 'Operativo'} />
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{
              background: '#f1f5f9',
              border: 'none',
              borderRadius: '8px',
              padding: '0.45rem',
              cursor: 'pointer',
              color: '#64748b',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            title="Cerrar diagnóstico"
          >
            <AppIcon name="close" size={18} strokeWidth={2} />
          </button>
        </div>

        {/* Cuerpo a 2 Columnas sin Scroll */}
        <div
          style={{
            padding: '1.5rem 1.6rem',
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '1.6rem',
          }}
        >
          {/* Columna Izquierda: Arquitectura & Trazabilidad */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.15rem' }}>
            <div>
              <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Rol en Arquitectura
              </span>
              <p style={{ fontSize: '0.86rem', color: '#1e293b', fontWeight: 600, margin: '0.35rem 0 0 0', lineHeight: 1.45 }}>
                {ctx.archRole}
              </p>
            </div>

            <div
              style={{
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '12px',
                padding: '1rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.65rem',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                <span style={{ color: '#64748b', fontWeight: 600 }}>Conexión de Base de Datos:</span>
                <strong style={{ color: '#0f172a' }}>{ctx.dbConnection}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                <span style={{ color: '#64748b', fontWeight: 600 }}>Disponibilidad (Uptime):</span>
                <strong style={{ color: '#166534' }}>{service.uptimeLabel || '100%'}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                <span style={{ color: '#64748b', fontWeight: 600 }}>Latencia de Red Interna:</span>
                <strong style={{ color: '#0284c7' }}>{service.latencyLabel || '12 ms'}</strong>
              </div>
            </div>

            <div>
              <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Endpoints Principales Expuestos
              </span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.45rem' }}>
                {ctx.endpoints.map((ep) => (
                  <div
                    key={ep.path}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.45rem',
                      background: '#ffffff',
                      border: '1px solid #e2e8f0',
                      borderRadius: '10px',
                      padding: '0.65rem 0.85rem',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}>
                      <span
                        style={{
                          background: ep.method === 'GET' ? '#e0f2fe' : '#dcfce7',
                          color: ep.method === 'GET' ? '#0369a1' : '#15803d',
                          padding: '3px 7px',
                          borderRadius: '5px',
                          fontSize: '0.68rem',
                          fontWeight: 800,
                          letterSpacing: '0.03em',
                        }}
                      >
                        {ep.method}
                      </span>
                      <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#1e293b', textAlign: 'right' }}>
                        {ep.desc}
                      </span>
                    </div>
                    <code
                      style={{
                        background: '#f8fafc',
                        border: '1px solid #e2e8f0',
                        borderRadius: '6px',
                        padding: '0.42rem 0.65rem',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        color: '#0f172a',
                        fontFamily: 'monospace',
                        wordBreak: 'break-all',
                      }}
                    >
                      {ep.path}
                    </code>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Columna Derecha: Gráfico de Tráfico/Carga */}
          <div
            style={{
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '12px',
              padding: '1.2rem',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}
          >
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h4 style={{ margin: 0, fontSize: '0.85rem', fontWeight: 700, color: '#0f172a' }}>
                  {ctx.chartTitle}
                </h4>
                <span style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600 }}>
                  Telemetría en Vivo
                </span>
              </div>
              <p style={{ margin: '0.25rem 0 1rem 0', fontSize: '0.78rem', color: '#64748b' }}>
                {ctx.chartDesc}
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.95rem' }}>
                {ctx.distribution.map((item) => (
                  <div key={item.name}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem', fontSize: '0.78rem' }}>
                      <span style={{ color: '#334155', fontWeight: 700 }}>{item.name}</span>
                      <strong style={{ color: '#0f172a' }}>{item.valueLabel}</strong>
                    </div>
                    <div
                      style={{
                        height: '8px',
                        width: '100%',
                        background: '#e2e8f0',
                        borderRadius: '999px',
                        overflow: 'hidden',
                      }}
                    >
                      <div
                        style={{
                          height: '100%',
                          width: `${item.share}%`,
                          background: item.share > 50 ? '#0284c7' : item.share > 25 ? '#0d9488' : '#64748b',
                          borderRadius: '999px',
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div
              style={{
                borderTop: '1px solid #e2e8f0',
                paddingTop: '0.8rem',
                marginTop: '1rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                fontSize: '0.76rem',
                color: '#475569',
              }}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#166534', fontWeight: 700 }}>
                ● Health Check: Respuesta HTTP 200 OK
              </span>
              <span>SLA &lt; 50 ms</span>
            </div>
          </div>
        </div>

        {/* Pie del modal */}
        <div
          style={{
            padding: '0.95rem 1.6rem',
            borderTop: '1px solid #e2e8f0',
            background: '#f8fafc',
            display: 'flex',
            justifyContent: 'flex-end',
          }}
        >
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: '0.55rem 1.25rem',
              borderRadius: '8px',
              border: 'none',
              background: '#0284c7',
              color: '#ffffff',
              fontSize: '0.82rem',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            Cerrar Ficha Directiva
          </button>
        </div>
      </div>
    </div>
  )
}

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
  const [selectedService, setSelectedService] = useState(null)

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
          <SectionHeader title="Servicios monitoreados" description="Servicios entregados por el BFF Gateway. Haz clic para inspeccionar endpoints y telemetría." />
          <div className="service-grid">
            {services.map((service) => (
              <ServiceStatusCard
                service={service}
                key={service.id}
                onView={() => setSelectedService(service)}
              />
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

      {selectedService && (
        <ServiceDetailModal
          service={selectedService}
          onClose={() => setSelectedService(null)}
        />
      )}
    </main>
  )
}
