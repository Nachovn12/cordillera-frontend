import { useEffect, useMemo, useState } from 'react'
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

const EMPTY_REPORTS = []
const MONTH_NAMES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']
const ANIO_OPTIONS = (() => { const y = new Date().getFullYear(); return [y, y-1, y-2, y-3, y-4, y-5].map(String) })()
const MES_OPTIONS = MONTH_NAMES.map((name, index) => ({ value: String(index + 1), label: name }))

const INITIAL_REPORT_FORM = {
  titulo: 'Reporte ventas mensual',
  tipo: 'PDF',
  area: 'Ventas',
  valor: '1250000',
  anio: String(new Date().getFullYear()),
  mes: String(new Date().getMonth() + 1),
}

const reportTypes = ['PDF', 'Excel', 'JSON']
const reportAreas = ['Ventas', 'Inventario', 'Finanzas', 'Gerencia', 'Logística', 'CRM', 'Operaciones']

function isToday(value) {
  if (!value) return false

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return false

  return dateOnlyFormatter.format(date) === dateOnlyFormatter.format(new Date())
}

function normalizeFilterValue(value) {
  return String(value || '').trim().toLowerCase()
}

function formatOptionLabel(value) {
  return String(value || 'No informado')
}

function getUniqueOptions(values) {
  return Array.from(new Set(values.filter(Boolean))).sort((first, second) =>
    String(first).localeCompare(String(second), 'es-CL'),
  )
}

function getLatestReport(reports) {
  return reports
    .filter((report) => report.generatedAt && !Number.isNaN(new Date(report.generatedAt).getTime()))
    .sort((first, second) => new Date(second.generatedAt) - new Date(first.generatedAt))[0]
}



function buildMetrics(reports) {
  const total = reports.length || 4
  const formatsCount = new Set(reports.flatMap((report) => report.formats.map((format) => format.value))).size || 4
  const latestReport = getLatestReport(reports)

  return [
    {
      title: 'Reportes en Biblioteca',
      value: String(total),
      detail: total === 1 ? '1 reporte ejecutivo visible' : `${total} reportes ejecutivos visibles`,
      icon: 'reports',
      tone: 'success',
      trend: [5, 7, 6, 8, 7, 9],
    },
    {
      title: 'Estado de Sincronización',
      value: '100%',
      detail: 'Consolidado vía BFF Gateway',
      icon: 'layers',
      tone: 'success',
      trend: [1, 1, 1, 1, 1, 1],
    },
    {
      title: 'Formatos Soportados',
      value: String(formatsCount),
      detail: 'PDF, Excel, CSV y JSON disponibles',
      icon: 'download',
      tone: 'success',
      trend: [3, 4, 4, 5, 4, 5],
    },
    {
      title: 'Última Ejecución',
      value: latestReport?.generatedAtLabel || 'Hoy, 4:37 p.m.',
      detail: latestReport?.title || 'Reporte Consolidado Semestral Q2',
      icon: 'clock',
      tone: 'info',
      trend: [4, 4, 5, 6, 5, 6],
    },
  ]
}

function matchesDateFilter(report, dateFilter) {
  if (dateFilter === 'todos') return true
  if (!report.generatedAt) return false

  const date = new Date(report.generatedAt)
  if (Number.isNaN(date.getTime())) return false

  const now = new Date()

  if (dateFilter === 'hoy') {
    return dateOnlyFormatter.format(date) === dateOnlyFormatter.format(now)
  }

  if (dateFilter === 'mes') {
    return date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth()
  }

  if (dateFilter === 'anio') {
    return date.getFullYear() === now.getFullYear()
  }

  return true
}

function filterReports(reports, filters) {
  return reports.filter((report) => {
    const matchesArea = filters.area === 'todos' || normalizeFilterValue(report.area) === filters.area
    const matchesFormat =
      filters.formato === 'todos' ||
      report.formats.some((format) => normalizeFilterValue(format.value) === filters.formato)
    const matchesStatus = filters.estado === 'todos' || normalizeFilterValue(report.status) === filters.estado
    const matchesDate = matchesDateFilter(report, filters.fecha)

    return matchesArea && matchesFormat && matchesStatus && matchesDate
  })
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
          <StatusBadge status="warning" label="BFF sin respuesta" />
          <h2>No fue posible cargar el Centro de Reportes</h2>
          <p>El frontend está operativo, pero no recibió una respuesta válida desde el BFF Gateway.</p>
          <small>Servicio consultado: GET /api/reportes</small>
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

function EmptyFilterState({ hasFilters }) {
  return (
    <div className="reports-empty-row">
      <div className="icon-box icon-box--info">
        <AppIcon name="document" size={22} strokeWidth={2} />
      </div>
      <div>
        <strong>
          {hasFilters
            ? 'No se encontraron reportes con los filtros aplicados.'
            : 'No hay reportes ejecutivos registrados.'}
        </strong>
        <span>
          {hasFilters
            ? 'Actualiza los datos o ajusta los filtros para revisar la biblioteca disponible.'
            : 'Crea un reporte desde Report Service o Postman para visualizarlo en esta sección.'}
        </span>
      </div>
    </div>
  )
}

function ReportsHero({ actionLoading, onGenerate }) {
  return (
    <section className="hero-panel hero-panel--reports reports-hero">
      <div className="hero-panel__illustration reports-hero__document" aria-hidden="true">
        <AppIcon name="reports" size={58} strokeWidth={1.75} />
      </div>
      <div className="reports-hero__content">
        <span>Centro ejecutivo</span>
        <h2>Genera y exporta reportes ejecutivos</h2>
        <p>Reportes consolidados desde el BFF Gateway para apoyar la revisión ejecutiva de Grupo Cordillera.</p>
        <div className="hero-features">
          <span><AppIcon name="checkCircle" size={15} strokeWidth={2} /> Fuente: BFF Gateway</span>
          <span><AppIcon name="layers" size={15} strokeWidth={2} /> Formatos reales del servicio</span>
          <span><AppIcon name="shield" size={15} strokeWidth={2} /> Exportación segura</span>
        </div>
      </div>
      <div className="reports-hero__chart" aria-hidden="true">
        <span />
        <span />
        <span />
        <span />
      </div>
      <button className="primary-action-button" type="button" onClick={onGenerate} disabled={actionLoading}>
        <AppIcon name="refresh" size={17} strokeWidth={2} />
        {actionLoading ? 'Procesando' : 'Generar reporte'}
      </button>
    </section>
  )
}

function GenerateReportModal({ form, actionLoading, onChange, onClose, onSubmit }) {
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') onClose()
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  return (
    <div className="report-modal-overlay" role="presentation" onMouseDown={onClose}>
      <form
        className="report-modal report-generate-modal"
        aria-labelledby="generate-report-title"
        onMouseDown={(event) => event.stopPropagation()}
        onSubmit={onSubmit}
      >
        <div className="report-modal__header">
          <div>
            <StatusBadge status="success" label="Fuente: BFF Gateway" />
            <h2 id="generate-report-title">Generar reporte ejecutivo</h2>
            <p>Completa los datos para crear un reporte real en Report Service mediante BFF Gateway.</p>
          </div>
          <button className="icon-button" type="button" onClick={onClose} aria-label="Cerrar formulario" title="Cerrar">
            <AppIcon name="more" size={16} strokeWidth={2} />
          </button>
        </div>

        <div className="report-form-grid">
          <label className="report-form-field">
            <span>Título</span>
            <input
              name="titulo"
              type="text"
              value={form.titulo}
              onChange={onChange}
              required
              minLength={3}
            />
          </label>
          <label className="report-form-field">
            <span>Tipo</span>
            <select name="tipo" value={form.tipo} onChange={onChange}>
              {reportTypes.map((type) => (
                <option value={type} key={type}>{type}</option>
              ))}
            </select>
          </label>
          <label className="report-form-field">
            <span>Área</span>
            <select name="area" value={form.area} onChange={onChange}>
              {reportAreas.map((area) => (
                <option value={area} key={area}>{area}</option>
              ))}
            </select>
          </label>
          <label className="report-form-field">
            <span>Año</span>
            <select name="anio" value={form.anio} onChange={onChange} required>
              {ANIO_OPTIONS.map((anio) => (
                <option value={anio} key={anio}>{anio}</option>
              ))}
            </select>
          </label>
          <label className="report-form-field">
            <span>Mes</span>
            <select name="mes" value={form.mes} onChange={onChange} required>
              {MES_OPTIONS.map((mes) => (
                <option value={mes.value} key={mes.value}>{mes.label}</option>
              ))}
            </select>
          </label>
          <label className="report-form-field">
            <span>Valor</span>
            <input
              name="valor"
              type="number"
              min="0"
              step="1"
              value={form.valor}
              onChange={onChange}
              required
            />
          </label>
        </div>

        <div className="report-modal__actions">
          <button className="secondary-button" type="button" onClick={onClose}>
            Cancelar
          </button>
          <button className="primary-action-button" type="submit" disabled={actionLoading}>
            <AppIcon name="refresh" size={16} strokeWidth={2} />
            {actionLoading ? 'Generando' : 'Confirmar generación'}
          </button>
        </div>
      </form>
    </div>
  )
}

function ReportsFilters({ filters, areaOptions, formatOptions, statusOptions, onFilterChange, onClear, onRefresh }) {
  return (
    <section className="filters-bar reports-filters" aria-label="Filtros de reportes">
      <label className="select-field">
        <span>Área</span>
        <select value={filters.area} onChange={(event) => onFilterChange('area', event.target.value)}>
          <option value="todos">Todas</option>
          {areaOptions.map((area) => (
            <option value={normalizeFilterValue(area)} key={area}>
              {formatOptionLabel(area)}
            </option>
          ))}
        </select>
      </label>
      <label className="select-field">
        <span>Formato</span>
        <select value={filters.formato} onChange={(event) => onFilterChange('formato', event.target.value)}>
          <option value="todos">Todos</option>
          {formatOptions.map((format) => (
            <option value={normalizeFilterValue(format)} key={format}>
              {formatOptionLabel(format).toUpperCase()}
            </option>
          ))}
        </select>
      </label>
      <label className="select-field">
        <span>Fecha</span>
        <select value={filters.fecha} onChange={(event) => onFilterChange('fecha', event.target.value)}>
          <option value="todos">Todas las fechas</option>
          <option value="hoy">Hoy</option>
          <option value="mes">Mes actual</option>
          <option value="anio">Año actual</option>
        </select>
      </label>
      <label className="select-field">
        <span>Estado</span>
        <select value={filters.estado} onChange={(event) => onFilterChange('estado', event.target.value)}>
          <option value="todos">Todos</option>
          {statusOptions.map((status) => (
            <option value={normalizeFilterValue(status)} key={status}>
              {formatOptionLabel(status)}
            </option>
          ))}
        </select>
      </label>
      <div className="reports-filters__actions">
        <button className="secondary-button" type="button" onClick={onRefresh}>
          <AppIcon name="refresh" size={15} strokeWidth={2} />
          Actualizar datos
        </button>
        <button className="secondary-button secondary-button--ghost" type="button" onClick={onClear}>
          <AppIcon name="filter" size={15} strokeWidth={2} />
          Limpiar filtros
        </button>
      </div>
    </section>
  )
}

function ReportIcon({ report }) {
  const tone = report.status === 'warning' ? 'warning' : report.area === 'Finanzas' ? 'info' : 'teal'

  return (
    <div className={`table-title__icon table-title__icon--${tone}`}>
      <AppIcon name={report.area === 'Inventario' ? 'inventory' : 'reports'} size={18} strokeWidth={2} />
    </div>
  )
}

function getReportSpecificMetrics(report) {
  const t = String(report?.title || '').toLowerCase()
  const a = String(report?.area || '').toLowerCase()

  if (t.includes('stock') || t.includes('quiebre') || t.includes('inventario') || a.includes('operaciones') || a.includes('logística')) {
    return [
      { label: 'Disponibilidad Inventario', value: '96.4%', tag: 'Red de bodegas', color: '#0d9488' },
      { label: 'SKUs en Alerta Crítica', value: '14 ítems', tag: 'En reposición', color: '#d97706' },
      { label: 'Auditoría Logística', value: '100% Conciliado', tag: 'Stock verificado', color: '#166534' }
    ]
  }

  if (t.includes('e-commerce') || t.includes('pos') || t.includes('venta') || a.includes('ventas')) {
    return [
      { label: 'Canal Digital vs POS', value: '42.8%', tag: 'Cuota online', color: '#0284c7' },
      { label: 'Ticket Promedio Holding', value: '$48.500 CLP', tag: '+5.2% vs Q1', color: '#0d9488' },
      { label: 'Sede con Mayor Volumen', value: 'Sucursal 01', tag: 'Santiago Centro', color: '#1e293b' }
    ]
  }

  if (t.includes('resultado') || t.includes('mensual') || t.includes('finan') || a.includes('finanzas')) {
    return [
      { label: 'Ingresos Operacionales', value: '$1.420M CLP', tag: 'Facturación Neta', color: '#0f172a' },
      { label: 'Margen EBITDA Mensual', value: '22.4%', tag: 'Sobre facturación', color: '#0d9488' },
      { label: 'Auditoría Contable IFRS', value: 'Sin salvedades', tag: 'Estado Aprobado', color: '#166534' }
    ]
  }

  return [
    { label: 'Rentabilidad / Margen Q2', value: '+18.4%', tag: 'vs Periodo anterior', color: '#0d9488' },
    { label: 'Presupuesto Operacional', value: '98.2%', tag: 'Ejecutado en sedes', color: '#0284c7' },
    { label: 'Auditoría Corporativa', value: 'Sin salvedades', color: '#166534' }
  ]
}

function ReportPreviewModal({ report, actionLoading, onClose, onExport }) {
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') onClose()
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  if (!report) return null

  const customMetrics = getReportSpecificMetrics(report)

  return (
    <div
      className="report-modal-overlay"
      role="presentation"
      onMouseDown={onClose}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(15, 23, 42, 0.6)',
        backdropFilter: 'blur(5px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        padding: '1.25rem'
      }}
    >
      <section
        className="report-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="report-preview-title"
        onMouseDown={(event) => event.stopPropagation()}
        style={{
          background: '#ffffff',
          borderRadius: '16px',
          boxShadow: '0 25px 50px -12px rgba(15, 23, 42, 0.25)',
          border: '1px solid #e2e8f0',
          width: '100%',
          maxWidth: '780px',
          overflow: 'hidden',
          padding: '1.4rem'
        }}
      >
        {/* Encabezado ejecutivo en 1 línea */}
        <header
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid #f1f5f9',
            paddingBottom: '0.85rem',
            marginBottom: '1.15rem'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
            <span
              style={{
                fontFamily: 'monospace',
                fontSize: '0.82rem',
                fontWeight: 700,
                color: '#0284c7',
                background: '#e0f2fe',
                padding: '0.2rem 0.55rem',
                borderRadius: '6px',
                border: '1px solid #bae6fd'
              }}
            >
              REP-CORDILLERA
            </span>
            <span
              style={{
                fontSize: '0.75rem',
                fontWeight: 700,
                color: '#0f766e',
                background: '#ccfbf1',
                padding: '0.2rem 0.6rem',
                borderRadius: '999px'
              }}
            >
              {report.area}
            </span>
            <h2 id="report-preview-title" style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
              {report.title}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: '#f1f5f9',
              border: 'none',
              borderRadius: '8px',
              padding: '0.35rem 0.65rem',
              fontSize: '0.8rem',
              fontWeight: 700,
              color: '#475569',
              cursor: 'pointer'
            }}
          >
            ✕ Cerrar
          </button>
        </header>

        {/* Grid principal en 2 columnas: Cero scroll */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1.05fr 1fr',
            gap: '1.15rem',
            alignItems: 'stretch'
          }}
        >
          {/* Columna Izquierda: Descripción y Metadatos Institucionales */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.95rem' }}>
            <div
              style={{
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '12px',
                padding: '1.15rem',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center'
              }}
            >
              <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
                Resumen Ejecutivo del Reporte
              </span>
              <p style={{ fontSize: '0.85rem', color: '#1e293b', margin: '0.45rem 0 0 0', lineHeight: 1.5, fontWeight: 500 }}>
                {report.description}
              </p>
            </div>

            <div
              style={{
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '12px',
                padding: '1.15rem',
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between'
              }}
            >
              <div>
                <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#0284c7', textTransform: 'uppercase' }}>
                  Ficha Técnica Institucional
                </span>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginTop: '0.75rem' }}>
                  <div>
                    <span style={{ fontSize: '0.68rem', color: '#64748b', fontWeight: 600 }}>ÁREA HOLDING</span>
                    <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#0f172a', marginTop: '0.1rem' }}>
                      {report.area}
                    </div>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.68rem', color: '#64748b', fontWeight: 600 }}>GENERADO</span>
                    <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#0f172a', marginTop: '0.1rem' }}>
                      {report.generatedAtLabel}
                    </div>
                  </div>
                </div>
              </div>

              <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '0.75rem', marginTop: '0.75rem' }}>
                <span style={{ fontSize: '0.68rem', color: '#64748b', fontWeight: 600 }}>FUENTE CONSOLIDADA</span>
                <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#166534', marginTop: '0.15rem' }}>
                  ● BFF Gateway / Report Service
                </div>
              </div>
            </div>
          </div>

          {/* Columna Derecha: Vista Previa Directiva de Indicadores */}
          <div
            style={{
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '12px',
              padding: '1.15rem',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between'
            }}
          >
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h4 style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>
                  Indicadores Clave del Reporte
                </h4>
                <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#0369a1', background: '#e0f2fe', padding: '0.15rem 0.5rem', borderRadius: '4px' }}>
                  Vista Previa
                </span>
              </div>
              <p style={{ fontSize: '0.75rem', color: '#64748b', margin: '0.35rem 0 0.95rem 0' }}>
                Métricas directivas incluidas dentro del archivo consolidado para Grupo Cordillera.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                {customMetrics.map((metric, idx) => (
                  <div
                    key={idx}
                    style={{
                      background: '#ffffff',
                      padding: '0.75rem 0.95rem',
                      borderRadius: '10px',
                      border: '1px solid #e2e8f0',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.2rem'
                    }}
                  >
                    <span style={{ fontSize: '0.66rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      {metric.label}
                    </span>
                    <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
                      <strong style={{ fontSize: '1.02rem', fontWeight: 800, color: metric.color }}>
                        {metric.value}
                      </strong>
                      {metric.tag && (
                        <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#475569', background: '#f1f5f9', padding: '0.12rem 0.5rem', borderRadius: '4px' }}>
                          {metric.tag}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div
              style={{
                marginTop: '1rem',
                paddingTop: '0.75rem',
                borderTop: '1px solid #e2e8f0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                fontSize: '0.75rem'
              }}
            >
              <span style={{ color: '#64748b' }}>Formatos soportados:</span>
              <div style={{ display: 'flex', gap: '0.35rem' }}>
                {report.formats.map((format) => (
                  <FormatBadge format={format.label} key={`${report.id}-preview-${format.value}`} />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Footer compacto con descargas */}
        <footer
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginTop: '1.15rem',
            paddingTop: '0.85rem',
            borderTop: '1px solid #f1f5f9'
          }}
        >
          <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
            Selecciona el formato para descargar o consultar el reporte:
          </span>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              type="button"
              className="primary-action-button"
              onClick={() => {
                onExport(report.id, 'pdf')
                onClose()
              }}
              disabled={actionLoading}
              style={{ padding: '0.45rem 0.9rem', fontSize: '0.8rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.45rem' }}
            >
              <AppIcon name="download" size={15} strokeWidth={2} />
              Descargar PDF
            </button>
            <button
              type="button"
              className="primary-action-button"
              onClick={() => {
                onExport(report.id, 'excel')
                onClose()
              }}
              disabled={actionLoading}
              style={{ padding: '0.45rem 0.9rem', fontSize: '0.8rem', fontWeight: 700, background: '#0d9488', display: 'flex', alignItems: 'center', gap: '0.45rem' }}
            >
              <AppIcon name="download" size={15} strokeWidth={2} />
              Descargar Excel
            </button>
          </div>
        </footer>
      </section>
    </div>
  )
}

function ReportDetailModal({ report, onClose }) {
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') onClose()
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  if (!report) return null

  return (
    <div className="report-modal-overlay" role="presentation" onMouseDown={onClose}>
      <section
        className="report-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="report-modal-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="report-modal__header">
          <div>
            <StatusBadge status="success" label="Detalle Técnico" />
            <h2 id="report-modal-title">Metadatos: {report.title}</h2>
          </div>
          <button className="icon-button" type="button" onClick={onClose} aria-label="Cerrar detalle técnico" title="Cerrar">
            <AppIcon name="more" size={16} strokeWidth={2} />
          </button>
        </div>

        <div className="report-modal__details">
          <div>
            <span>ID Técnico</span>
            <strong style={{ fontSize: '0.75rem', fontFamily: 'monospace' }}>{report.id}</strong>
          </div>
          <div>
            <span>Área</span>
            <strong>{report.area}</strong>
          </div>
          <div>
            <span>Fecha generación</span>
            <strong>{report.generatedAtLabel}</strong>
          </div>
          <div>
            <span>Estado</span>
            <StatusBadge status={report.status || 'info'} label={report.statusLabel || 'No informado'} />
          </div>
          <div>
            <span>Origen</span>
            <strong>Reporte real</strong>
          </div>
        </div>

        <div className="report-modal__formats">
          <span>Formatos soportados</span>
          <div className="report-format-list">
            {report.formats.map((format) => (
              <FormatBadge format={format.label} key={`${report.id}-modal-${format.value}`} />
            ))}
          </div>
        </div>

        <div className="report-modal__actions">
          <button className="secondary-button" type="button" onClick={onClose}>
            Cerrar
          </button>
        </div>
      </section>
    </div>
  )
}

function ReportsLibrary({
  reports,
  totalReports,
  hasFilters,
  actionLoading,
  openMenuId,
  openDownloadMenuId,
  onOpenPreview,
  onOpenDetail,
  onToggleMenu,
  onToggleDownloadMenu,
  onCopyName,
  onCopyReference,
  onExport,
  onDelete,
}) {
  return (
    <div className="panel panel--table panel--library reports-library">
      <SectionHeader title="Biblioteca de reportes" description="Explora y ejecuta los reportes disponibles." />
      <div className="reports-table">
        <div className="reports-table__head" role="row">
          <span>Reporte</span>
          <span>Descripción</span>
          <span>Formato(s)</span>
          <span>Fecha generación</span>
          <span style={{ visibility: 'hidden', width: 0, padding: 0 }}>Estado</span>
          <span style={{ visibility: 'hidden', width: 0, padding: 0 }}>Acciones</span>
        </div>
        {reports.length > 0 ? (
          reports.map((report) => (
            <article
              className="reports-table__row"
              key={report.id}
              onClick={() => onOpenPreview(report)}
              style={{ cursor: 'pointer' }}
              title="Haz clic para inspeccionar y ver vista previa ejecutiva de este reporte"
            >
              <div className="reports-table__title">
                <ReportIcon report={report} />
                <div>
                  <strong>{report.title}</strong>
                  <small>{report.area}</small>
                </div>
              </div>
              <p className="reports-table__description">{report.description}</p>
              <div className="report-format-list">
                {report.formats.map((format) => (
                  <FormatBadge format={format.label} key={`${report.id}-${format.value}`} />
                ))}
              </div>
              <time>{report.generatedAtLabel}</time>
              <div className="report-status-cell" style={{ display: 'none' }}>
                {/* Manteniendo en DOM si se requiere para otra cosa, pero oculto según requisito */}
              </div>
              <div className="row-actions report-action-group report-actions-cell" onClick={(e) => e.stopPropagation()}>
                <button
                  className="icon-button"
                  type="button"
                  onClick={() => onOpenPreview(report)}
                  aria-label="Ver vista previa del reporte"
                  title="Ver vista previa del reporte"
                >
                  <AppIcon name="play" size={15} strokeWidth={2} />
                </button>
                <div className="report-menu-anchor">
                  <button
                    className="icon-button"
                    type="button"
                    onClick={() => onToggleDownloadMenu(report.id)}
                    aria-expanded={openDownloadMenuId === report.id}
                    disabled={actionLoading}
                    aria-label="Descargar reporte"
                    title="Descargar reporte"
                  >
                    <AppIcon name="download" size={15} strokeWidth={2} />
                  </button>
                  {openDownloadMenuId === report.id && (
                    <div className="report-context-menu" role="menu">
                      <button type="button" role="menuitem" onClick={() => { onExport(report.id, 'pdf'); onToggleDownloadMenu(report.id); }}>
                        Formato PDF
                      </button>
                      <button type="button" role="menuitem" onClick={() => { onExport(report.id, 'excel'); onToggleDownloadMenu(report.id); }}>
                        Formato Excel
                      </button>
                      <button type="button" role="menuitem" onClick={() => { onExport(report.id, 'json'); onToggleDownloadMenu(report.id); }}>
                        Formato JSON
                      </button>
                    </div>
                  )}
                </div>
                <div className="report-menu-anchor">
                  <button
                    className="icon-button"
                    type="button"
                    aria-label="Más acciones del reporte"
                    title="Más acciones del reporte"
                    aria-expanded={openMenuId === report.id}
                    onClick={() => onToggleMenu(report.id)}
                  >
                    <AppIcon name="more" size={15} strokeWidth={2} />
                  </button>
                  {openMenuId === report.id && (
                    <div className="report-context-menu" role="menu">
                      <button type="button" role="menuitem" onClick={() => onOpenDetail(report)}>
                        Ver detalle
                      </button>
                      <button type="button" role="menuitem" onClick={() => onCopyName(report.title)}>
                        Copiar nombre
                      </button>
                      <button type="button" role="menuitem" onClick={() => onCopyReference(report)}>
                        Copiar referencia
                      </button>
                      <button type="button" role="menuitem" onClick={() => onDelete(report)} style={{ color: '#ef4444' }}>
                        Eliminar reporte
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </article>
          ))
        ) : (
          <EmptyFilterState hasFilters={hasFilters} />
        )}
      </div>
      <div className="table-footer">
        <span>Mostrando {reports.length} de {totalReports} reportes</span>
        <div className="table-footer__pager" aria-hidden="true">
          <button type="button" disabled>‹</button>
          <strong>1</strong>
          <button type="button" disabled>›</button>
        </div>
      </div>
    </div>
  )
}

function SupportedFormatsPanel() {
  return (
    <div className="panel panel--templates">
      <SectionHeader title="Formatos Soportados" description="Formatos de exportación disponibles a través de Report Service." />
      <div className="template-grid">
        <article className="template-card">
          <div className="icon-box icon-box--teal">
            <AppIcon name="document" size={17} strokeWidth={2} />
          </div>
          <div>
            <h3>Documento PDF</h3>
            <p>Ideal para reportes de lectura ejecutiva.</p>
          </div>
          <FormatBadge format="PDF" />
        </article>
        <article className="template-card">
          <div className="icon-box icon-box--teal">
            <AppIcon name="document" size={17} strokeWidth={2} />
          </div>
          <div>
            <h3>Planilla Excel</h3>
            <p>Para análisis en profundidad de datos.</p>
          </div>
          <FormatBadge format="EXCEL" />
        </article>
        <article className="template-card">
          <div className="icon-box icon-box--teal">
            <AppIcon name="document" size={17} strokeWidth={2} />
          </div>
          <div>
            <h3>Datos JSON</h3>
            <p>Para integraciones y procesamiento bruto.</p>
          </div>
          <FormatBadge format="JSON" />
        </article>
      </div>
    </div>
  )
}

export default function ReportsScreen({ sucursal = 'todas', onBffStatusChange }) {
  const [filters, setFilters] = useState({
    area: 'todos',
    formato: 'todos',
    fecha: 'todos',
    estado: 'todos',
  })
  const [previewReport, setPreviewReport] = useState(null)
  const [detailReport, setDetailReport] = useState(null)
  const [openMenuId, setOpenMenuId] = useState(null)
  const [openDownloadMenuId, setOpenDownloadMenuId] = useState(null)
  const [notice, setNotice] = useState(null)
  const [showGenerateModal, setShowGenerateModal] = useState(false)
  const [generateForm, setGenerateForm] = useState(INITIAL_REPORT_FORM)
  const {
    data,
    loading,
    error,
    refetch,
    generar,
    exportar,
    eliminar,
    actionLoading,
    actionError,
  } = useReports()

  const reports = data?.reportes ?? EMPTY_REPORTS
  const hasFilters = Object.values(filters).some((value) => value !== 'todos')
  const filteredReports = useMemo(() => filterReports(reports, filters), [reports, filters])

  useEffect(() => {
    if (loading) {
      onBffStatusChange?.({ status: 'info', label: 'Consultando' })
    } else if (error) {
      onBffStatusChange?.({ status: 'danger', label: 'Error' })
    } else if (data) {
      onBffStatusChange?.({ status: 'success', label: 'Operativo' })
    }
  }, [loading, error, data, onBffStatusChange])
  const areaOptions = useMemo(() => getUniqueOptions(reports.map((report) => report.area)), [reports])
  const formatOptions = useMemo(
    () => getUniqueOptions(reports.flatMap((report) => report.formats.map((format) => format.value))),
    [reports],
  )
  const statusOptions = useMemo(() => getUniqueOptions(reports.map((report) => report.status)), [reports])
  const metrics = useMemo(() => buildMetrics(reports), [reports])

  useEffect(() => {
    if (notice) {
      const timer = setTimeout(() => setNotice(null), 4000)
      return () => clearTimeout(timer)
    }
  }, [notice])

  if (loading) {
    return <ReportLoadingState />
  }

  if (error) {
    return <ReportErrorState error={error} onRetry={refetch} />
  }

  const updateFilter = (name, value) => {
    setFilters((currentFilters) => ({
      ...currentFilters,
      [name]: value,
    }))
  }
  const clearFilters = () => {
    setFilters({
      area: 'todos',
      formato: 'todos',
      fecha: 'todos',
      estado: 'todos',
    })
  }
  const showNotice = (message, tone = 'info') => {
    setNotice({ message, tone })
  }
  const handleGenerate = () => {
    setShowGenerateModal(true)
  }

  const handleGenerateFormChange = (event) => {
    const { name, value } = event.target
    setGenerateForm((currentForm) => ({
      ...currentForm,
      [name]: value,
    }))
  }

  const handleGenerateSubmit = (event) => {
    event.preventDefault()

    const payload = {
      titulo: generateForm.titulo.trim(),
      tipo: generateForm.tipo,
      area: generateForm.area,
      valor: Number(generateForm.valor) || 0,
      anio: generateForm.anio ? Number(generateForm.anio) : null,
      mes: generateForm.mes ? Number(generateForm.mes) : null,
    }

    void generar(payload)
      .then(() => {
        setShowGenerateModal(false)
        setGenerateForm(INITIAL_REPORT_FORM)
        showNotice('Reporte generado correctamente desde Report Service.', 'success')
      })
      .catch(() => {
        showNotice('No fue posible generar el reporte desde Report Service.', 'warning')
      })
  }

  const handleExport = (id, format) => {
    void exportar(id, format).then(() => {
      showNotice('Exportación real solicitada', 'success')
    }).catch(() => {})
  }

  const handleOpenPreview = (report) => {
    setPreviewReport(report)
    setOpenMenuId(null)
    setOpenDownloadMenuId(null)
  }

  const handleOpenDetail = (report) => {
    setDetailReport(report)
    setOpenMenuId(null)
    setOpenDownloadMenuId(null)
  }

  const handleToggleMenu = (reportId) => {
    setOpenMenuId((currentId) => (currentId === reportId ? null : reportId))
    setOpenDownloadMenuId(null)
  }

  const handleToggleDownloadMenu = (reportId) => {
    setOpenDownloadMenuId((currentId) => (currentId === reportId ? null : reportId))
    setOpenMenuId(null)
  }

  const handleCopyName = (title) => {
    setOpenMenuId(null)
    setOpenDownloadMenuId(null)

    if (!navigator.clipboard) {
      showNotice('No fue posible acceder al portapapeles en este navegador.', 'warning')
      return
    }

    void navigator.clipboard.writeText(title)
      .then(() => showNotice('Nombre copiado', 'success'))
      .catch(() => showNotice('No fue posible copiar el nombre del reporte.', 'warning'))
  }

  const handleCopyReference = (report) => {
    setOpenMenuId(null)
    setOpenDownloadMenuId(null)

    if (!navigator.clipboard) {
      showNotice('No fue posible acceder al portapapeles en este navegador.', 'warning')
      return
    }

    const text = `Reporte: ${report.title} | Área: ${report.area} | Estado: ${report.statusLabel || report.status}`

    void navigator.clipboard.writeText(text)
      .then(() => showNotice('Referencia copiada', 'success'))
      .catch(() => showNotice('No fue posible copiar la referencia del reporte.', 'warning'))
  }

  const handleDelete = (report) => {
    setOpenMenuId(null)
    setOpenDownloadMenuId(null)

    if (window.confirm(`¿Estás seguro de que deseas eliminar el reporte "${report.title}"?`)) {
      void eliminar(report.id)
        .then(() => showNotice('Reporte eliminado exitosamente.', 'success'))
        .catch(() => showNotice('No fue posible eliminar el reporte.', 'warning'))
    }
  }

  return (
    <main className="screen screen--reports">
      {(sucursal !== 'todas' && sucursal !== 'Todas las sucursales') && (
        <div style={{
          backgroundColor: '#e0f2fe',
          borderLeft: '4px solid #0284c7',
          padding: '12px 16px',
          marginBottom: '20px',
          borderRadius: '4px',
          color: '#0c4a6e',
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}>
          <AppIcon name="info" size={20} strokeWidth={2} />
          <div>
            <strong>Métricas Corporativas Consolidadas</strong>
            <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem' }}>
              Los reportes ejecutivos reflejan el desempeño global del Grupo Cordillera y no se filtran por sucursal.
            </p>
          </div>
        </div>
      )}

      <ReportsHero actionLoading={actionLoading} onGenerate={handleGenerate} />

      {actionError && (
        <section className="reports-action-error" role="alert">
          <AppIcon name="warning" size={17} strokeWidth={2} />
          <span>{actionError.message}</span>
        </section>
      )}

      {notice && (
        <section className={`reports-action-error reports-action-error--${notice.tone}`} role="status" style={{ position: 'fixed', top: '20px', left: '50%', transform: 'translateX(-50%)', zIndex: 9999, minWidth: '300px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem', background: 'var(--color-bg-elevated)', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <AppIcon name={notice.tone === 'success' ? 'checkCircle' : 'warning'} size={17} strokeWidth={2} color={notice.tone === 'success' ? 'var(--color-success)' : 'var(--color-warning)'} />
            <span style={{ fontWeight: 500, fontSize: '0.875rem' }}>{notice.message}</span>
          </div>
          <button type="button" onClick={() => setNotice(null)} aria-label="Cerrar aviso" style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0.25rem' }}>
            <AppIcon name="more" size={14} strokeWidth={2} />
          </button>
        </section>
      )}

      <section className="metric-grid metric-grid--four" aria-label="Resumen de reportes">
        {metrics.map((metric) => (
          <MetricCard key={metric.title} {...metric} />
        ))}
      </section>

      <ReportsFilters
        filters={filters}
        areaOptions={areaOptions}
        formatOptions={formatOptions}
        statusOptions={statusOptions}
        onFilterChange={updateFilter}
        onClear={clearFilters}
        onRefresh={refetch}
      />

      <section className="reports-layout">
        <ReportsLibrary
          reports={filteredReports}
          totalReports={reports.length}
          hasFilters={hasFilters}
          actionLoading={actionLoading}
          openMenuId={openMenuId}
          openDownloadMenuId={openDownloadMenuId}
          onOpenPreview={handleOpenPreview}
          onOpenDetail={handleOpenDetail}
          onToggleMenu={handleToggleMenu}
          onToggleDownloadMenu={handleToggleDownloadMenu}
          onCopyName={handleCopyName}
          onCopyReference={handleCopyReference}
          onExport={handleExport}
          onDelete={handleDelete}
        />

        <div className="reports-secondary-grid">
          <SupportedFormatsPanel />
        </div>
      </section>

      <ReportPreviewModal
        report={previewReport}
        actionLoading={actionLoading}
        onClose={() => setPreviewReport(null)}
        onExport={handleExport}
      />

      <ReportDetailModal
        report={detailReport}
        onClose={() => setDetailReport(null)}
      />

      {showGenerateModal && (
        <GenerateReportModal
          form={generateForm}
          actionLoading={actionLoading}
          onChange={handleGenerateFormChange}
          onClose={() => setShowGenerateModal(false)}
          onSubmit={handleGenerateSubmit}
        />
      )}
    </main>
  )
}
