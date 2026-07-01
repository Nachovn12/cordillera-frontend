import AppIcon from '../ui/AppIcon'
import StatusBadge from '../ui/StatusBadge'

const alertIconMap = {
  Operacionales: { icon: 'alerts', tone: 'warning' },
  Operacional: { icon: 'alerts', tone: 'warning' },
  KPI: { icon: 'kpis', tone: 'teal' },
  Servicios: { icon: 'services', tone: 'success' },
  Servicio: { icon: 'services', tone: 'success' },
  Reportes: { icon: 'document', tone: 'info' },
  Reporte: { icon: 'document', tone: 'info' },
  Inventario: { icon: 'inventory', tone: 'warning' },
  General: { icon: 'alerts', tone: 'info' },
}

const severityMap = {
  Crítica: 'critical',
  Media: 'warning',
  Advertencia: 'warning',
  Informativa: 'info',
  Resuelta: 'resolved',
}

const stateMap = {
  Activa: 'warning',
  'En seguimiento': 'info',
  Resuelta: 'resolved',
  Informativa: 'info',
  Pendiente: 'pending',
}

export default function AlertItem({
  alert,
  table = false,
  isMenuOpen = false,
  onView,
  onToggleMenu,
  onCopyDescription,
  onCopyOrigin,
  onMarkReviewed,
}) {
  const isArrayAlert = Array.isArray(alert)
  const title = isArrayAlert ? alert[0] : alert.title
  const description = isArrayAlert ? alert[1] : alert.description
  const category = isArrayAlert ? alert[2] : alert.category
  const severityLabel = isArrayAlert ? alert[3] : alert.severityLabel
  const origin = isArrayAlert ? alert[4] : alert.origin
  const detectedAt = isArrayAlert ? alert[5] : alert.detectedAtLabel
  const stateLabel = isArrayAlert ? alert[6] : alert.statusLabel
  const severityStatus = isArrayAlert ? severityMap[severityLabel] || 'warning' : alert.severity || 'warning'
  const stateStatus = isArrayAlert ? stateMap[stateLabel] || 'info' : alert.status || 'info'
  const meta = alertIconMap[category] || {
    icon: alert.icon || 'alerts',
    tone: severityStatus === 'critical' ? 'critical' : severityStatus,
  }

  if (table) {
    return (
      <article className="alerts-card-item">
        <div className="alerts-card-item__main">
          <span className={`alerts-card-item__icon alerts-card-item__icon--${meta.tone}`}>
            <AppIcon name={meta.icon} size={18} strokeWidth={2} />
          </span>
          <div className="alerts-card-item__content">
            <h4 className="alerts-card-item__title">{title}</h4>
            <p className="alerts-card-item__description">{description || 'Sin descripción disponible'}</p>
            <div className="alerts-card-item__meta">
              <span className={`tag tag--${meta.tone}`}>{category}</span>
              <StatusBadge status={severityStatus} label={severityLabel} />
              <span className="tag tag--light">{origin}</span>
              <span className="tag tag--light">{detectedAt}</span>
            </div>
          </div>
        </div>
        <div className="alerts-card-item__status">
          <StatusBadge status={stateStatus} label={stateLabel} />
        </div>
        <div className="alerts-card-item__actions">
          <button
            className="icon-button"
            type="button"
            onClick={onView}
            aria-label={`Ver detalle de ${title}`}
            title={`Ver detalle de ${title}`}
          >
            <AppIcon name="eye" size={16} strokeWidth={2} />
          </button>
          <div className="alert-menu-anchor">
            <button
              className="icon-button"
              type="button"
              onClick={onToggleMenu}
              aria-label={`Más acciones de ${title}`}
              title={`Más acciones de ${title}`}
              aria-expanded={isMenuOpen}
            >
              <AppIcon name="more" size={16} strokeWidth={2} />
            </button>
            {isMenuOpen && (
              <div className="alert-context-menu" role="menu">
                <button type="button" role="menuitem" onClick={onView}>Ver detalle</button>
                <button type="button" role="menuitem" onClick={onCopyDescription}>Copiar descripción</button>
                <button type="button" role="menuitem" onClick={onCopyOrigin}>Copiar origen</button>
                <button type="button" role="menuitem" onClick={onMarkReviewed}>Marcar como revisada</button>
              </div>
            )}
          </div>
        </div>
      </article>
    )
  }

  return (
    <article className="alert-item" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '14px', padding: '12px 18px 12px 14px', width: '100%', borderRadius: '10px', border: '1px solid #e2e8f0', background: '#ffffff', transition: 'all 0.2s ease', boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.02)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minWidth: '38px', height: '38px', borderRadius: '8px', background: severityStatus === 'critical' ? '#fef2f2' : severityStatus === 'warning' ? '#fffbeb' : '#f0fdf4', color: severityStatus === 'critical' ? '#dc2626' : severityStatus === 'warning' ? '#d97706' : '#16a34a' }}>
        <AppIcon name={severityStatus === 'info' ? 'document' : severityStatus === 'critical' ? 'shield' : 'alerts'} size={18} strokeWidth={2} />
      </div>

      <div style={{ flex: '1 1 auto', minWidth: 0, display: 'flex', flexDirection: 'column', gap: '3px', paddingRight: '8px' }}>
        <h3 style={{ margin: 0, color: '#0f172a', fontWeight: 600, fontSize: '0.86rem', lineHeight: '1.2' }}>
          {title}
        </h3>
        <p style={{ margin: 0, color: '#64748b', fontSize: '0.75rem', fontWeight: 500, lineHeight: '1.35' }}>
          {description}
        </p>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', paddingLeft: '4px' }}>
        <span className="tag" style={{ padding: '3px 8px', borderRadius: '6px', fontSize: '0.72rem', fontWeight: 600, background: '#f1f5f9', color: '#475569' }}>{category}</span>
        {detectedAt && <time style={{ color: '#64748b', fontSize: '0.75rem', fontWeight: 500 }}>{detectedAt}</time>}
        <span style={{ color: '#94a3b8', display: 'flex', alignItems: 'center' }}>
          <AppIcon name="chevronRight" size={16} strokeWidth={2} />
        </span>
      </div>
    </article>
  )
}
