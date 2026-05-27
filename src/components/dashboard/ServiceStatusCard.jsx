import AppIcon from '../ui/AppIcon'
import MiniSparkline from '../ui/MiniSparkline'
import StatusBadge from '../ui/StatusBadge'

function getTone(status) {
  if (status === 'critical' || status === 'danger') return 'danger'
  if (status === 'warning' || status === 'pending') return 'warning'
  if (status === 'info') return 'info'
  return 'teal'
}

export default function ServiceStatusCard({ service, compact = false }) {
  const tone = getTone(service.status)
  const description = service.description || service.shortDetail || service.detail || 'Sin descripción disponible'
  const trend = Array.isArray(service.trend) ? service.trend : []

  return (
    <article className={`service-status-card${compact ? ' service-status-card--compact' : ''}`}>
      <div className="service-status-card__header">
        <span className={`icon-box icon-box--${tone} service-status-card__icon`}>
          <AppIcon name={service.icon || 'services'} size={20} strokeWidth={2} />
        </span>
        <div className="service-status-card__title-group">
          <h3>{service.name}</h3>
          {compact && <p>{description}</p>}
        </div>
        <StatusBadge status={service.status} label={service.statusLabel} />
        {compact && <AppIcon className="service-status-card__arrow" name="chevronRight" size={17} strokeWidth={2.1} />}
      </div>

      {!compact && (
        <div className="service-status-card__body">
          <div className="service-status-card__metrics">
            <div className="service-status-card__metric">
              <strong>{service.uptimeLabel || service.uptime || 'Sin medición'}</strong>
              <span>Uptime</span>
            </div>
            <div className="service-status-card__metric">
              <strong>{service.latencyLabel || service.latency || 'No medida'}</strong>
              <span>Latencia</span>
            </div>
          </div>
          <p className="service-status-card__desc">{description}</p>
          {trend.length > 0 && (
            <div className="service-status-card__chart">
              <MiniSparkline data={trend} tone={service.status === 'warning' ? 'warning' : 'success'} />
            </div>
          )}
        </div>
      )}
    </article>
  )
}
