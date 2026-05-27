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

function AlertDetailModal({ alert, onClose }) {
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') onClose()
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  if (!alert) return null

  return (
    <div className="alert-modal-overlay" role="presentation" onMouseDown={onClose}>
      <section
        className="alert-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="alert-modal-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="alert-modal__header">
          <div>
            <StatusBadge status={alert.severity} label={alert.severityLabel} />
            <h2 id="alert-modal-title">{alert.title}</h2>
            <p>{alert.description}</p>
          </div>
          <button className="icon-button" type="button" onClick={onClose} aria-label="Cerrar detalle de alerta" title="Cerrar">
            <AppIcon name="more" size={16} strokeWidth={2} />
          </button>
        </div>

        <div className="alert-modal__details">
          <div>
            <span>Categoría</span>
            <strong>{alert.category}</strong>
          </div>
          <div>
            <span>Severidad</span>
            <strong>{alert.severityLabel}</strong>
          </div>
          <div>
            <span>Estado</span>
            <strong>{alert.statusLabel}</strong>
          </div>
          <div>
            <span>Origen</span>
            <strong>{alert.origin}</strong>
          </div>
          <div>
            <span>Fecha/hora</span>
            <strong>{alert.detectedAtLabel}</strong>
          </div>
          <div>
            <span>Fuente</span>
            <strong>BFF Gateway</strong>
          </div>
        </div>

        <div className="alert-modal__recommendation">
          <span>Acción recomendada</span>
          <p>{getRecommendation(alert)}</p>
        </div>

        <div className="alert-modal__actions">
          <button className="secondary-button" type="button" onClick={onClose}>
            Cerrar
          </button>
        </div>
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
