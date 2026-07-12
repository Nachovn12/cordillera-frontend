import { useEffect, useMemo, useState } from 'react'
import useAlerts from '../../hooks/useAlerts'
import AlertItem from '../dashboard/AlertItem'
import AppIcon from '../ui/AppIcon'
import MetricCard from '../ui/MetricCard'
import SectionHeader from '../ui/SectionHeader'
import StatusBadge from '../ui/StatusBadge'

const EMPTY_ALERTS = []

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
  const active = alerts.filter((alert) => alert.statusLabel === 'Activa').length
  const critical = alerts.filter((alert) => alert.severityLabel === 'Crítica').length
  const tracking = alerts.filter((alert) => alert.statusLabel === 'En seguimiento').length
  const resolvedToday = alerts.filter((alert) => alert.statusLabel === 'Resuelta' && isToday(alert.detectedAt)).length

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

function matchesTab(alert, activeTab) {
  const category = String(alert.category || '').toLowerCase()
  const origin = String(alert.origin || '').toLowerCase()

  if (activeTab === 'todas') return true
  if (activeTab === 'criticas') return alert.severityLabel === 'Crítica'
  if (activeTab === 'operacionales') return category.includes('operacional') || origin.includes('kpi')
  if (activeTab === 'reportes') return category.includes('reporte')
  if (activeTab === 'servicios') return category.includes('servicio')

  return true
}

function filterAlerts(alerts, activeTab, query) {
  const normalizedQuery = query.trim().toLowerCase()

  return alerts.filter((alert) => {
    const matchesSearch = !normalizedQuery
      || [
        alert.title,
        alert.description,
        alert.category,
        alert.origin,
        alert.statusLabel,
        alert.severityLabel,
      ].some((value) => String(value || '').toLowerCase().includes(normalizedQuery))

    return matchesTab(alert, activeTab) && matchesSearch
  })
}

function sortByDateDesc(alerts) {
  return [...alerts].sort((first, second) => new Date(second.detectedAt) - new Date(first.detectedAt))
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
          <StatusBadge status="warning" label="BFF sin respuesta" />
          <h2>No fue posible cargar el Centro de Alertas</h2>
          <p>El frontend está operativo, pero no recibió una respuesta válida desde el BFF Gateway.</p>
          <small>Fuente consultada: GET /api/dashboard/stats y GET /api/reportes</small>
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

function AlertsEmptyInline({ activeTab }) {
  const selectedTab = tabs.find((tab) => tab.value === activeTab)?.label || 'seleccionado'

  return (
    <div className="alerts-empty-inline">
      <AppIcon name="search" size={22} strokeWidth={2} />
      <strong>No hay alertas para el filtro seleccionado.</strong>
      <span>El BFF Gateway no informó eventos asociados a esta categoría: {selectedTab}.</span>
    </div>
  )
}

function getRecommendation(alert) {
  if (alert.recommendation) return alert.recommendation
  const category = String(alert.category || '').toLowerCase()

  if (category.includes('serv')) return 'Validar disponibilidad desde Estado de Servicios.'
  if (category.includes('reporte')) return 'Verificar Centro de Reportes.'
  return 'Revisar indicadores con estado Advertencia.'
}

function getAlertContextualData(alert) {
  const category = String(alert?.category || '').toLowerCase()
  const origin = String(alert?.origin || '').toLowerCase()
  const title = String(alert?.title || '').toLowerCase()

  if (category.includes('serv') || origin.includes('bff') || title.includes('bff')) {
    return {
      chartTitle: 'Tráfico API Gateway por Sucursal',
      chartDesc: 'Distribución transaccional de peticiones enrutadas por el BFF.',
      distribution: [
        { name: 'Sucursal 01 - Santiago Centro', share: 52, label: '52% peticiones' },
        { name: 'Sucursal 02 - Providencia', share: 31, label: '31% peticiones' },
        { name: 'Sucursal 03 - Las Condes', share: 17, label: '17% peticiones' },
      ],
      metric1Title: 'DISPONIBILIDAD GATEWAY',
      metric1Value: '99.98% Uptime',
      metric2Title: 'LATENCIA ENRUTAMIENTO',
      metric2Value: '12 ms (Excelente)',
    }
  }

  if (category.includes('operacion') || origin.includes('kpi') || title.includes('kpi')) {
    return {
      chartTitle: 'Indicadores Observados por Sede',
      chartDesc: 'Desglose de métricas operacionales fuera de rango nominal.',
      distribution: [
        { name: 'Sucursal 01 - Santiago Centro', share: 40, label: '40% alertas KPI' },
        { name: 'Sucursal 03 - Las Condes', share: 35, label: '35% alertas KPI' },
        { name: 'Sucursal 02 - Providencia', share: 25, label: '25% alertas KPI' },
      ],
      metric1Title: 'CONSISTENCIA ACID',
      metric1Value: '100% Validado',
      metric2Title: 'FRECUENCIA LECTURA',
      metric2Value: '5 min (Real-time)',
    }
  }

  if (category.includes('reporte') || origin.includes('report')) {
    return {
      chartTitle: 'Descargas de Reporte por Sucursal',
      chartDesc: 'Frecuencia de consulta y generación documental por gerencia.',
      distribution: [
        { name: 'Sucursal 01 - Santiago Centro', share: 48, label: '48% descargas' },
        { name: 'Sucursal 02 - Providencia', share: 29, label: '29% descargas' },
        { name: 'Sucursal 03 - Las Condes', share: 23, label: '23% descargas' },
      ],
      metric1Title: 'TIEMPO GENERACIÓN',
      metric1Value: '1.2 seg promedio',
      metric2Title: 'STORAGE DOCUMENTAL',
      metric2Value: '99.99% Integridad',
    }
  }

  return {
    chartTitle: 'Gráfico de Incidencia por Sucursal',
    chartDesc: 'Porcentaje de ocurrencia y trazabilidad del evento en las sedes.',
    distribution: [
      { name: 'Sucursal 01 - Santiago Centro', share: 46, label: '46% eventos' },
      { name: 'Sucursal 02 - Providencia', share: 34, label: '34% eventos' },
      { name: 'Sucursal 03 - Las Condes', share: 20, label: '20% eventos' },
    ],
    metric1Title: 'DISPONIBILIDAD ORIGEN',
    metric1Value: '99.94% Uptime',
    metric2Title: 'LATENCIA TELEMETRÍA',
    metric2Value: '24 ms (Óptimo)',
  }
}

function AlertDetailModal({ alert, onClose }) {
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') onClose()
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  if (!alert) return null

  const ctxData = getAlertContextualData(alert)

  return (
    <div
      className="alert-modal-overlay"
      role="presentation"
      onMouseDown={onClose}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(15, 23, 42, 0.62)',
        backdropFilter: 'blur(5px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        padding: '1.25rem',
      }}
    >
      <section
        className="alert-modal"
        role="dialog"
        aria-modal="true"
        onMouseDown={(event) => event.stopPropagation()}
        style={{
          background: '#ffffff',
          borderRadius: '16px',
          boxShadow: '0 25px 50px -12px rgba(15, 23, 42, 0.25)',
          border: '1px solid #e2e8f0',
          width: '100%',
          maxWidth: '820px',
          overflow: 'hidden',
          padding: '1.4rem',
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
            marginBottom: '1.15rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
            <span
              style={{
                fontFamily: 'monospace',
                fontSize: '0.82rem',
                fontWeight: 700,
                color: '#d97706',
                background: '#fef3c7',
                padding: '0.2rem 0.55rem',
                borderRadius: '6px',
                border: '1px solid #fde68a',
              }}
            >
              EVENTO-OPERACIONAL
            </span>
            <StatusBadge status={alert.severity} label={alert.severityLabel} />
            <h2 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
              Ficha Técnica: {alert.title}
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
              cursor: 'pointer',
            }}
          >
            ✕ Cerrar
          </button>
        </header>

        {/* Grid principal a 2 columnas: Cero scroll */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1.05fr',
            gap: '1.15rem',
            alignItems: 'stretch',
          }}
        >
          {/* Columna Izquierda: Diagnóstico e Impacto Operacional */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.95rem' }}>
            <div
              style={{
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '12px',
                padding: '1.15rem',
              }}
            >
              <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
                Descripción y Causa Raíz
              </span>
              <p style={{ fontSize: '0.86rem', color: '#1e293b', fontWeight: 600, margin: '0.5rem 0 0.75rem 0', lineHeight: 1.45 }}>
                {alert.description || 'Evento operacional informado por la capa de servicios.'}
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem', borderTop: '1px solid #e2e8f0', paddingTop: '0.65rem', fontSize: '0.78rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748b' }}>Origen del Evento:</span>
                  <strong style={{ color: '#0f172a' }}>{alert.origin || 'Microservicio Interno'}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748b' }}>Categoría:</span>
                  <strong style={{ color: '#0f172a' }}>{alert.category}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748b' }}>Estado Actual:</span>
                  <strong style={{ color: '#0d9488' }}>{alert.statusLabel}</strong>
                </div>
              </div>
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
                justifyContent: 'space-between',
              }}
            >
              <div>
                <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#0284c7', textTransform: 'uppercase' }}>
                  Protocolo de Mitigación Corporativa
                </span>
                <p style={{ fontSize: '0.82rem', color: '#334155', fontWeight: 600, margin: '0.55rem 0 0 0', lineHeight: 1.4 }}>
                  {getRecommendation(alert)}
                </p>
              </div>

              <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '0.75rem', marginTop: '0.75rem' }}>
                <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#166534', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  ● SLA Operacional: Cumplimiento en norma ({'<'} 15 min)
                </span>
              </div>
            </div>
          </div>

          {/* Columna Derecha: Gráfico contextual + Telemetría */}
          <div
            style={{
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '12px',
              padding: '1.15rem',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}
          >
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h4 style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>
                  {ctxData.chartTitle}
                </h4>
                <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#0369a1', background: '#e0f2fe', padding: '0.15rem 0.5rem', borderRadius: '4px' }}>
                  Distribución Red
                </span>
              </div>
              <p style={{ fontSize: '0.75rem', color: '#64748b', margin: '0.35rem 0 0.95rem 0' }}>
                {ctxData.chartDesc}
              </p>

              {/* Barras visuales por sucursal */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {ctxData.distribution.map((branch, idx) => (
                  <div key={idx} style={{ background: '#ffffff', padding: '0.75rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.76rem', fontWeight: 600, color: '#334155', marginBottom: '0.4rem' }}>
                      <span>{branch.name}</span>
                      <strong style={{ color: idx === 0 ? '#d97706' : '#0284c7' }}>{branch.label}</strong>
                    </div>
                    <div style={{ width: '100%', height: '8px', background: '#f1f5f9', borderRadius: '999px', overflow: 'hidden' }}>
                      <div
                        style={{
                          width: `${branch.share}%`,
                          height: '100%',
                          background: idx === 0 ? '#d97706' : idx === 1 ? '#0284c7' : '#64748b',
                          borderRadius: '999px',
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Tarjeta inferior de Telemetría contextual */}
            <div
              style={{
                marginTop: '1rem',
                paddingTop: '0.85rem',
                borderTop: '1px solid #e2e8f0',
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '0.75rem',
              }}
            >
              <div style={{ background: '#ffffff', padding: '0.65rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <span style={{ fontSize: '0.68rem', color: '#64748b', fontWeight: 600 }}>{ctxData.metric1Title}</span>
                <strong style={{ fontSize: '0.82rem', color: '#0d9488', display: 'block', marginTop: '0.15rem' }}>{ctxData.metric1Value}</strong>
              </div>
              <div style={{ background: '#ffffff', padding: '0.65rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <span style={{ fontSize: '0.68rem', color: '#64748b', fontWeight: 600 }}>{ctxData.metric2Title}</span>
                <strong style={{ fontSize: '0.82rem', color: '#0284c7', display: 'block', marginTop: '0.15rem' }}>{ctxData.metric2Value}</strong>
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
            borderTop: '1px solid #f1f5f9',
          }}
        >
          <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
            Auditoría de eventos conectada en tiempo real al BFF Gateway de Grupo Cordillera.
          </span>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              type="button"
              className="primary-action-button"
              onClick={() => {
                const blob = new Blob([JSON.stringify({ alert, details: ctxData }, null, 2)], { type: 'application/json' })
                const url = URL.createObjectURL(blob)
                const a = document.createElement('a')
                a.href = url
                a.download = `incidencia_operacional_${(alert.title || 'alerta').toLowerCase().replace(/\s+/g, '_')}.json`
                a.click()
              }}
              style={{ padding: '0.45rem 0.9rem', fontSize: '0.8rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.45rem' }}
            >
              <AppIcon name="fileJson" size={15} strokeWidth={2} />
              Exportar Evento JSON
            </button>
            <button
              type="button"
              className="secondary-button"
              onClick={onClose}
              style={{ padding: '0.45rem 0.9rem', fontSize: '0.8rem', fontWeight: 700 }}
            >
              Cerrar
            </button>
          </div>
        </footer>
      </section>
    </div>
  )
}

function PriorityPanel({ alerts }) {
  const priorityAlerts = alerts
    .filter((alert) => alert.severity === 'critical' || alert.severity === 'warning')
    .slice(0, 4)

  if (!priorityAlerts.length) {
    return (
      <div className="panel panel--priority">
        <SectionHeader title="Alertas prioritarias" description="Alertas derivadas del estado de integración." />
        <div className="alerts-empty-side">
          <AppIcon name="checkCircle" size={18} strokeWidth={2} />
          <span>Sin críticas informadas.</span>
        </div>
      </div>
    )
  }

  return (
    <div className="panel panel--priority">
      <SectionHeader title="Alertas prioritarias" description="Alertas derivadas del estado de integración." />
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
      <SectionHeader title="Historial reciente" description="Eventos informados por BFF Gateway." />
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

function copyText(value, successMessage, onNotice) {
  if (!navigator.clipboard) {
    onNotice('No fue posible acceder al portapapeles en este navegador.', 'warning')
    return
  }

  void navigator.clipboard.writeText(value)
    .then(() => onNotice(successMessage, 'success'))
    .catch(() => onNotice('No fue posible copiar la información solicitada.', 'warning'))
}

export default function AlertsScreen() {
  const { data, loading, error, refetch } = useAlerts()
  const [activeTab, setActiveTab] = useState('todas')
  const [query, setQuery] = useState('')
  const [selectedAlert, setSelectedAlert] = useState(null)
  const [openMenuId, setOpenMenuId] = useState(null)
  const [reviewedIds, setReviewedIds] = useState([])
  const [notice, setNotice] = useState(null)

  const baseAlerts = data?.alertas ?? EMPTY_ALERTS
  const alerts = useMemo(() => baseAlerts.map((alert) => {
    if (!reviewedIds.includes(alert.id)) return alert

    return {
      ...alert,
      status: 'info',
      statusLabel: 'En seguimiento',
      reviewed: true,
    }
  }), [baseAlerts, reviewedIds])
  const visibleAlerts = useMemo(() => filterAlerts(alerts, activeTab, query), [alerts, activeTab, query])
  const history = useMemo(() => sortByDateDesc(alerts).slice(0, 5), [alerts])
  const metrics = useMemo(() => buildMetrics(alerts), [alerts])

  if (loading) {
    return <AlertsLoadingState />
  }

  if (error) {
    return <AlertsErrorState error={error} onRetry={refetch} />
  }

  const showNotice = (message, tone = 'info') => {
    setNotice({ message, tone })
  }
  const handleToggleMenu = (alertId) => {
    setOpenMenuId((currentId) => (currentId === alertId ? null : alertId))
  }
  const handleView = (alert) => {
    setSelectedAlert(alert)
    setOpenMenuId(null)
  }
  const handleMarkReviewed = (alert) => {
    setReviewedIds((currentIds) => currentIds.includes(alert.id) ? currentIds : [...currentIds, alert.id])
    setOpenMenuId(null)
    showNotice('Alerta marcada como revisada en esta sesión.', 'success')
  }

  return (
    <main className="screen screen--alerts">
      <section className="metric-grid metric-grid--four" aria-label="Resumen de alertas">
        {metrics.map((metric) => (
          <MetricCard key={metric.title} {...metric} />
        ))}
      </section>

      {notice && (
        <section className={`alerts-notice alerts-notice--${notice.tone}`} role="status">
          <AppIcon name={notice.tone === 'success' ? 'checkCircle' : 'warning'} size={17} strokeWidth={2} />
          <span>{notice.message}</span>
          <button type="button" onClick={() => setNotice(null)} aria-label="Cerrar aviso">Cerrar</button>
        </section>
      )}

      <section
        aria-label="Filtros de alertas"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '14px',
          background: '#ffffff',
          border: '1px solid #e2e8f0',
          borderRadius: '14px',
          padding: '12px 18px',
          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.03)',
        }}
      >
        {/* Pestañas integradas tipo Segmented Control corporativo */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            background: '#f1f5f9',
            padding: '4px',
            borderRadius: '10px',
            gap: '4px',
            flexWrap: 'wrap',
          }}
        >
          {tabs.map((tab) => {
            const isActive = activeTab === tab.value
            return (
              <button
                key={tab.value}
                type="button"
                onClick={() => setActiveTab(tab.value)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 14px',
                  borderRadius: '8px',
                  border: 'none',
                  fontSize: '0.82rem',
                  fontWeight: isActive ? 700 : 600,
                  background: isActive ? '#ffffff' : 'transparent',
                  color: isActive ? '#0f172a' : '#64748b',
                  boxShadow: isActive ? '0 1px 3px rgba(0, 0, 0, 0.08)' : 'none',
                  cursor: 'pointer',
                  transition: 'all 0.18s ease',
                }}
              >
                <span style={{ color: isActive ? '#0284c7' : '#94a3b8', display: 'flex', alignItems: 'center' }}>
                  <AppIcon name={tab.icon} size={15} strokeWidth={2} />
                </span>
                {tab.label}
              </button>
            )
          })}
        </div>

        {/* Grupo derecho: Buscador e Icono Actualizar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: '1 1 auto', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              background: '#f8fafc',
              border: '1px solid #cbd5e1',
              borderRadius: '9px',
              padding: '6px 12px',
              minWidth: '250px',
              flex: '0 1 320px',
            }}
          >
            <span style={{ color: '#64748b', display: 'flex', alignItems: 'center' }}>
              <AppIcon name="search" size={16} strokeWidth={2} />
            </span>
            <input
              type="text"
              placeholder="Buscar por título, categoría u origen..."
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              style={{
                border: 'none',
                background: 'transparent',
                outline: 'none',
                fontSize: '0.82rem',
                color: '#0f172a',
                width: '100%',
                fontWeight: 500,
              }}
            />
          </div>

          <button
            type="button"
            onClick={refetch}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '7px 14px',
              borderRadius: '9px',
              border: '1px solid #cbd5e1',
              background: '#ffffff',
              color: '#334155',
              fontSize: '0.82rem',
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
            title="Refrescar listado de alertas"
          >
            <AppIcon name="refresh" size={15} strokeWidth={2} />
            Actualizar
          </button>
        </div>
      </section>

      <section className="content-grid content-grid--alerts" aria-label="Listado de alertas">
        <div className="panel panel--alerts-list">
          <SectionHeader title="Eventos operacionales" description="Eventos informados por BFF Gateway." />
          {visibleAlerts.length > 0 ? (
            <>
              <div className="alerts-card-list">
                {visibleAlerts.map((alert) => (
                  <AlertItem
                    table
                    alert={alert}
                    key={alert.id}
                    isMenuOpen={openMenuId === alert.id}
                    onView={() => handleView(alert)}
                    onToggleMenu={() => handleToggleMenu(alert.id)}
                    onCopyDescription={() => {
                      setOpenMenuId(null)
                      copyText(alert.description, 'Descripción copiada al portapapeles.', showNotice)
                    }}
                    onCopyOrigin={() => {
                      setOpenMenuId(null)
                      copyText(alert.origin, 'Origen copiado al portapapeles.', showNotice)
                    }}
                    onMarkReviewed={() => handleMarkReviewed(alert)}
                  />
                ))}
              </div>
              <div className="table-footer">
                <span>Mostrando {visibleAlerts.length} de {alerts.length} eventos</span>
              </div>
            </>
          ) : (
            <AlertsEmptyInline activeTab={activeTab} />
          )}
        </div>

        <aside className="side-stack">
          <PriorityPanel alerts={alerts} />
          <HistoryPanel history={history} />
        </aside>
      </section>

      <AlertDetailModal alert={selectedAlert} onClose={() => setSelectedAlert(null)} />
    </main>
  )
}
