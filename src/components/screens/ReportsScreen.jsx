import useReports from '../../hooks/useReports'
import AppIcon from '../ui/AppIcon'
import FormatBadge from '../ui/FormatBadge'
import MetricCard from '../ui/MetricCard'
import SectionHeader from '../ui/SectionHeader'
import StatusBadge from '../ui/StatusBadge'

const dateOnlyFormatter = new Intl.DateTimeFormat('es-CL', {
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
})

function isToday(value) {
  if (!value) return false

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return false

  return dateOnlyFormatter.format(date) === dateOnlyFormatter.format(new Date())
}

function getLatestReport(reports) {
  return reports
    .filter((report) => report.generatedAt && !Number.isNaN(new Date(report.generatedAt).getTime()))
    .sort((first, second) => new Date(second.generatedAt) - new Date(first.generatedAt))[0]
}

function buildMetrics(reports) {
  const generatedToday = reports.filter((report) => isToday(report.generatedAt)).length
  const pendingExports = reports.filter((report) => ['pending', 'warning'].includes(report.status)).length
  const formats = new Set(reports.flatMap((report) => report.formats.map((format) => format.value)))
  const latestReport = getLatestReport(reports)

  return [
    {
      title: 'Reportes generados hoy',
      value: String(generatedToday),
      detail: generatedToday === 1 ? '1 reporte disponible' : `${generatedToday} reportes disponibles`,
      icon: 'reports',
      tone: 'info',
    },
    {
      title: 'Pendientes de exportación',
      value: String(pendingExports),
      detail: pendingExports > 0 ? 'Requieren seguimiento' : 'Sin pendientes informados',
      icon: 'download',
      tone: pendingExports > 0 ? 'warning' : 'success',
    },
    {
      title: 'Tipos disponibles',
      value: String(formats.size),
      detail: formats.size > 0 ? 'Formatos informados por BFF' : 'Sin formatos informados',
      icon: 'layers',
      tone: 'success',
    },
    {
      title: 'Última ejecución',
      value: latestReport?.generatedAtLabel || 'Sin fecha',
      detail: latestReport?.title || 'Sin ejecución informada',
      icon: 'calendar',
      tone: 'info',
    },
  ]
}

function ReportLoadingState() {
  return (
    <main className="screen screen--reports">
      <section className="hero-panel hero-panel--reports dashboard-skeleton dashboard-skeleton--large" aria-label="Cargando centro de reportes" />
      <section className="metric-grid metric-grid--four" aria-label="Cargando métricas de reportes">
        {['metric-1', 'metric-2', 'metric-3', 'metric-4'].map((item) => (
          <article className="metric-card dashboard-skeleton" key={item} />
        ))}
      </section>
      <section className="filters-bar dashboard-skeleton" aria-label="Cargando filtros" />
      <section className="panel panel--table panel--library dashboard-skeleton dashboard-skeleton--large" aria-label="Cargando biblioteca de reportes" />
    </main>
  )
}

function ReportErrorState({ error, onRetry }) {
  return (
    <main className="screen screen--reports">
      <section className="integration-error-state integration-error-state--reports" role="alert" aria-live="polite">
        <div className="icon-box icon-box--warning">
          <AppIcon name="gatewayOff" size={25} strokeWidth={2} />
        </div>
        <div>
          <StatusBadge status="warning" label="Endpoint pendiente" />
          <h2>Centro de Reportes pendiente de conexión</h2>
          <p>El frontend está operativo, pero aún no recibe reportes desde el BFF Gateway.</p>
          <small>Endpoint esperado: GET /api/reportes</small>
          <details>
            <summary>Ver detalle técnico</summary>
            <span>{error?.message || 'No fue posible conectar con BFF Gateway.'}</span>
          </details>
        </div>
        <button type="button" onClick={onRetry} aria-label="Reintentar carga de reportes">
          <AppIcon name="refresh" size={16} strokeWidth={2} />
          Reintentar
        </button>
      </section>
    </main>
  )
}

function ReportEmptyState({ onRetry }) {
  return (
    <main className="screen screen--reports">
      <section className="hero-panel hero-panel--reports">
        <div className="hero-panel__illustration">
          <AppIcon name="reports" size={58} strokeWidth={1.75} />
        </div>
        <div>
          <h2>Centro de Reportes</h2>
          <p>La conexión con el BFF está activa, pero todavía no existen reportes ejecutivos disponibles.</p>
          <div className="hero-features">
            <span><AppIcon name="checkCircle" size={15} strokeWidth={2} /> Fuente: BFF Gateway</span>
            <span><AppIcon name="shield" size={15} strokeWidth={2} /> Sin datos simulados</span>
          </div>
        </div>
      </section>
      <section className="integration-empty-state">
        <div className="icon-box icon-box--info">
          <AppIcon name="document" size={25} strokeWidth={2} />
        </div>
        <div>
          <StatusBadge status="info" label="Sin reportes" />
          <h2>No hay reportes disponibles</h2>
          <p>Cuando Report Service genere reportes ejecutivos vía BFF, aparecerán en este panel.</p>
        </div>
        <button type="button" onClick={onRetry} aria-label="Actualizar reportes">
          <AppIcon name="refresh" size={16} strokeWidth={2} />
          Actualizar
        </button>
      </section>
    </main>
  )
}

function OptionalReportsPanel({ title, description, items, variant }) {
  if (!items.length) return null

  return (
    <div className={`panel panel--${variant}`}>
      <SectionHeader title={title} description={description} />
      <div className="stack-list">
        {items.map((item) => (
          <article className="export-item" key={item.id}>
            <FormatBadge format={item.primaryFormat} />
            <strong>{item.title}</strong>
            <time>{item.generatedAtLabel}</time>
            <StatusBadge status={item.status} label={item.statusLabel} />
          </article>
        ))}
      </div>
    </div>
  )
}

export default function ReportsScreen() {
  const {
    data,
    loading,
    error,
    refetch,
    generar,
    exportar,
    actionLoading,
    actionError,
  } = useReports()

  if (loading) {
    return <ReportLoadingState />
  }

  if (error) {
    return <ReportErrorState error={error} onRetry={refetch} />
  }

  const reports = data?.reportes || []

  if (reports.length === 0) {
    return <ReportEmptyState onRetry={refetch} />
  }

  const metrics = buildMetrics(reports)
  const handleGenerate = () => {
    void generar({ origen: 'frontend', modulo: 'reportes' }).catch(() => {})
  }
  const handleExport = (id, format) => {
    void exportar(id, format).catch(() => {})
  }

  return (
    <main className="screen screen--reports">
      <section className="hero-panel hero-panel--reports">
        <div className="hero-panel__illustration">
          <AppIcon name="reports" size={58} strokeWidth={1.75} />
        </div>
        <div>
          <h2>Genera y exporta reportes ejecutivos</h2>
          <p>Reportes consolidados desde el BFF Gateway para apoyar la revisión ejecutiva de Grupo Cordillera.</p>
          <div className="hero-features">
            <span><AppIcon name="checkCircle" size={15} strokeWidth={2} /> Fuente: BFF Gateway</span>
            <span><AppIcon name="layers" size={15} strokeWidth={2} /> Formatos reales del servicio</span>
            <span><AppIcon name="shield" size={15} strokeWidth={2} /> Exportación segura</span>
          </div>
        </div>
        <button className="primary-action-button" type="button" onClick={handleGenerate} disabled={actionLoading}>
          <AppIcon name="refresh" size={17} strokeWidth={2} />
          {actionLoading ? 'Procesando' : 'Generar reporte'}
        </button>
      </section>

      {actionError && (
        <section className="reports-action-error" role="alert">
          <AppIcon name="warning" size={17} strokeWidth={2} />
          <span>{actionError.message}</span>
        </section>
      )}

      <section className="metric-grid metric-grid--four" aria-label="Resumen de reportes">
        {metrics.map((metric) => (
          <MetricCard key={metric.title} {...metric} />
        ))}
      </section>

      <section className="filters-bar" aria-label="Filtros de reportes">
        {['Área', 'Formato', 'Fecha', 'Estado'].map((filter) => (
          <label className="select-field" key={filter}>
            <span>{filter}</span>
            <select defaultValue="todos">
              <option value="todos">{filter === 'Fecha' ? 'Todas las fechas' : 'Todos'}</option>
            </select>
          </label>
        ))}
        <button className="secondary-button" type="button" onClick={refetch}>
          <AppIcon name="refresh" size={15} strokeWidth={2} />
          Actualizar datos
        </button>
      </section>

      <section className="content-grid content-grid--reports-main">
        <div className="panel panel--table panel--library">
          <SectionHeader title="Biblioteca de reportes" description="Reportes entregados por el BFF Gateway." />
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Reporte</th>
                  <th>Área</th>
                  <th>Formato(s)</th>
                  <th>Fecha generación</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {reports.map((report) => (
                  <tr key={report.id}>
                    <td>
                      <strong>{report.title}</strong>
                      <span>{report.description}</span>
                      {report.value && <small>{report.value}</small>}
                    </td>
                    <td>{report.area}</td>
                    <td>
                      <div className="report-format-list">
                        {report.formats.map((format) => (
                          <FormatBadge format={format.label} key={format.value} />
                        ))}
                      </div>
                    </td>
                    <td>{report.generatedAtLabel}</td>
                    <td><StatusBadge status={report.status} label={report.statusLabel} /></td>
                    <td>
                      <div className="row-actions report-action-group">
                        {report.formats.map((format) => (
                          <button
                            className="icon-button"
                            type="button"
                            key={format.value}
                            onClick={() => handleExport(report.id, format.value)}
                            disabled={actionLoading}
                            aria-label={`Descargar ${report.title} en ${format.label}`}
                            title={`Descargar ${format.label}`}
                          >
                            <AppIcon name="download" size={15} strokeWidth={2} />
                          </button>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="table-footer">
            <span>Mostrando 1 a {reports.length} de {reports.length} reportes</span>
          </div>
        </div>

        <div className="reports-side">
          <OptionalReportsPanel
            title="Plantillas disponibles"
            description="Plantillas informadas por el BFF."
            items={data?.plantillas || []}
            variant="templates"
          />
          <OptionalReportsPanel
            title="Exportaciones recientes"
            description="Exportaciones informadas por el BFF."
            items={data?.exportaciones || []}
            variant="exports"
          />
        </div>

        <OptionalReportsPanel
          title="Programación de reportes"
          description="Programaciones informadas por el BFF."
          items={data?.programaciones || []}
          variant="schedule"
        />
      </section>
    </main>
  )
}
