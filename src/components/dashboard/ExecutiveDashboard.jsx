import AlertItem from './AlertItem'
import KpiCard from './KpiCard'
import ReportItem from './ReportItem'
import ServiceStatusCard from './ServiceStatusCard'
import TrendPanel from './TrendPanel'
import AppIcon from '../ui/AppIcon'
import MetricCard from '../ui/MetricCard'
import SectionHeader from '../ui/SectionHeader'
import { formatClp } from '../../services/dashboardApi'

function DashboardSkeleton() {
  return (
    <>
      <section className="hero-panel hero-panel--dashboard dashboard-skeleton" />
      <section className="metric-grid metric-grid--four" aria-label="Cargando resumen ejecutivo">
        {Array.from({ length: 4 }).map((_, index) => (
          <article className="metric-card dashboard-skeleton" key={index} />
        ))}
      </section>
      <section className="panel dashboard-skeleton dashboard-skeleton--large" />
      <section className="content-grid content-grid--dashboard content-grid--dashboard-main">
        <article className="trend-panel dashboard-skeleton dashboard-skeleton--large" />
        <article className="panel dashboard-skeleton dashboard-skeleton--large" />
      </section>
    </>
  )
}

function DashboardError({ error, onRetry }) {
  const checklist = [
    ['gateway', 'Levantar BFF Gateway en puerto 8081'],
    ['database', 'Verificar Data Service en puerto 8083'],
    ['kpis', 'Verificar KPI Service en puerto 8084'],
    ['reports', 'Verificar Report Service en puerto 8085'],
    ['document', 'Probar GET /api/dashboard/stats'],
  ]

  const scrollToChecklist = () => {
    document.getElementById('error-checklist')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <section className="dashboard-error-view dashboard-error-view--compact" aria-label="Estado de conectividad del Dashboard Ejecutivo">
      <article className="error-hero error-hero--compact">
        <span className="error-hero__accent" aria-hidden="true" />
        <div className="error-hero__body">
          <div className="error-hero__icon-wrap">
            <span className="icon-box icon-box--danger error-hero__icon">
              <AppIcon name="gatewayOff" size={28} strokeWidth={1.8} />
            </span>
          </div>
          <div className="error-hero__content">
            <span className="integration-status-badge integration-status-badge--danger">BFF Gateway sin conexión</span>
            <h2>No fue posible cargar la información del dashboard</h2>
            <p>El frontend está operativo, pero no recibió respuesta válida desde el BFF Gateway.</p>
            <small>Levanta el BFF Gateway en http://localhost:8081 para habilitar los indicadores ejecutivos.</small>
            <details>
              <summary>Detalle técnico</summary>
              <span>{error?.message || 'No fue posible conectar con BFF Gateway en http://localhost:8081'}</span>
            </details>
            <div className="error-hero__actions">
              <button
                type="button"
                className="error-hero__btn-primary"
                onClick={onRetry}
                aria-label="Reintentar conexión con BFF Gateway"
              >
                <AppIcon name="refresh" size={17} strokeWidth={2.1} />
                Reintentar
              </button>
              <button type="button" className="error-hero__btn-secondary" onClick={scrollToChecklist}>
                Ver checklist
              </button>
            </div>
          </div>
        </div>
      </article>

      <article className="error-panel error-panel--checklist error-panel--compact-checklist" id="error-checklist">
        <div className="error-panel__header">
          <span className="icon-box icon-box--info">
            <AppIcon name="settings" size={21} strokeWidth={2} />
          </span>
          <div>
            <h3>Checklist de habilitación</h3>
            <p>Ayuda técnica secundaria para restablecer el flujo Frontend {'->'} BFF Gateway {'->'} Microservicios.</p>
          </div>
        </div>
        <ol className="error-checklist error-checklist--compact">
          {checklist.map(([icon, label], index) => (
            <li className="error-checklist__item" key={label}>
              <span className="error-checklist__number">{index + 1}</span>
              <span className="error-checklist__icon">
                <AppIcon name={icon} size={17} strokeWidth={2} />
              </span>
              <strong>{label}</strong>
              <em className="error-checklist__status">Por validar</em>
            </li>
          ))}
        </ol>
      </article>
    </section>
  )
}

function EmptyState({ title, description }) {
  return (
    <div className="empty-state">
      <strong>{title}</strong>
      {description && <p>{description}</p>}
    </div>
  )
}

function buildSummaryMetrics(data) {
  return [
    {
      title: 'Ventas totales',
      value: formatClp(data.ventasTotales),
      detail: data.ventasTotales === undefined || data.ventasTotales === null
        ? 'Sin datos disponibles'
        : 'Fuente: BFF Gateway',
      icon: 'sales',
    },
    {
      title: 'KPIs monitoreados',
      value: String(data.kpis.length),
      detail: 'Última lectura disponible',
      icon: 'kpis',
    },
    {
      title: 'Alertas activas',
      value: String(data.alertas.length),
      detail: data.alertas.length > 0 ? 'Requiere revisión' : 'Sin alertas críticas',
      icon: 'alerts',
      tone: data.alertas.length > 0 ? 'warning' : 'success',
    },
    {
      title: 'Estado BFF',
      value: data.bffStatus.label,
      detail: 'Consolidado desde servicios internos',
      icon: 'shield',
      tone: data.bffStatus.status === 'danger' ? 'critical' : data.bffStatus.status,
    },
  ]
}

function buildDisplayedServices(data) {
  if (data.services.length > 0) {
    return data.services
  }

  return [
    {
      id: 'bff',
      name: 'BFF Gateway',
      status: data.bffStatus.status,
      statusLabel: data.bffStatus.label,
      shortDetail: 'Estado informado por BFF',
    },
  ]
}

export default function ExecutiveDashboard({ data, error, loading, onRetry }) {
  if (loading) {
    return <DashboardSkeleton />
  }

  if (error) {
    return <DashboardError error={error} onRetry={onRetry} />
  }

  if (!data) {
    return (
      <DashboardError
        error={{ message: 'La respuesta del BFF no contiene datos disponibles.' }}
        onRetry={onRetry}
      />
    )
  }

  const summaryMetrics = buildSummaryMetrics(data)
  const displayedServices = buildDisplayedServices(data)

  return (
    <>
      <section className="hero-panel hero-panel--dashboard">
        <div>
          <span>CORDILLERA PLATFORM</span>
          <h2>Monitoreo ejecutivo retail</h2>
          <p>
            Vista consolidada de ventas, inventario, finanzas, CRM y disponibilidad de servicios
            para apoyar decisiones de gerencia.
          </p>
        </div>
        <aside className="hero-panel__meta">
          <span>Última actualización</span>
          <strong>{data.fetchedAt}</strong>
          <small>Fuente: BFF Gateway</small>
        </aside>
      </section>

      <section className="metric-grid metric-grid--four" aria-label="Resumen ejecutivo">
        {summaryMetrics.map((metric) => (
          <MetricCard key={metric.title} {...metric} />
        ))}
      </section>

      <section className="panel-group panel-group--dashboard-kpis">
        <SectionHeader
          title="Indicadores ejecutivos"
          description="KPIs consolidados desde BFF Gateway para evaluar desempeño comercial, inventario y rentabilidad."
          action="Ver todos los KPIs"
        />
        {data.kpis.length > 0 ? (
          <div className="kpi-grid">
            {data.kpis.map((kpi) => (
              <KpiCard kpi={kpi} key={kpi.id} />
            ))}
          </div>
        ) : (
          <EmptyState
            title="Sin KPIs disponibles"
            description="El BFF no entregó indicadores para esta consulta."
          />
        )}
      </section>

      <section className="content-grid content-grid--dashboard content-grid--dashboard-main">
        <TrendPanel
          title="Tendencia de ventas"
          description="Evolución mensual consolidada desde el BFF Gateway."
          data={data.salesTrend}
          badge={data.salesTrend.length > 0 ? 'Histórico BFF' : null}
        />

        <div className="panel panel--dashboard-reports">
          <SectionHeader
            title="Reportes recientes"
            description="Últimos reportes ejecutivos entregados por el BFF Gateway."
            action="Ver todos los reportes"
          />
          {data.recentReports.length > 0 ? (
            <div className="stack-list">
              {data.recentReports.map((report) => (
                <ReportItem report={report} key={report.id} />
              ))}
            </div>
          ) : (
            <EmptyState
              title="No hay reportes recientes disponibles."
              description="El BFF no entregó reportes recientes para esta consulta."
            />
          )}
        </div>
      </section>

      <section className="content-grid content-grid--dashboard content-grid--dashboard-bottom">
        <div className="panel panel--dashboard-alerts">
          <SectionHeader
            title="Alertas operacionales"
            description="Eventos relevantes detectados en la operación del negocio."
          />
          {data.alertas.length > 0 ? (
            <div className="stack-list">
              {data.alertas.map((alert) => (
                <AlertItem alert={alert} key={alert.id} />
              ))}
              {data.alertas.length <= 1 && (
                <div className="dashboard-safe-note">
                  <AppIcon name="checkCircle" size={16} strokeWidth={2} />
                  <span>Sin alertas críticas adicionales.</span>
                </div>
              )}
            </div>
          ) : (
            <EmptyState
              title="Sin alertas activas"
              description="Sin alertas críticas adicionales."
            />
          )}
        </div>

        <div className="panel panel--dashboard-services">
          <SectionHeader
            title="Estado de microservicios"
            description={data.services.length > 0 ? 'Disponibilidad informada por BFF Gateway.' : 'El BFF solo informó su propio estado.'}
          />
          <div className={`service-compact-grid${displayedServices.length === 1 ? ' service-compact-grid--single' : ''}`}>
            {displayedServices.map((service) => (
              <ServiceStatusCard compact service={service} key={service.id} />
            ))}
          </div>
        </div>
      </section>
    </>
  )
}
