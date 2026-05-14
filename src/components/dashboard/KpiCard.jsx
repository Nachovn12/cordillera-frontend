import AppIcon from '../ui/AppIcon'
import StatusBadge from '../ui/StatusBadge'

export default function KpiCard({ kpi, variant = 'compact' }) {
  const isNegative = String(kpi.change).trim().startsWith('-')
  const isStrategic = variant === 'strategic'
  const warningTone = kpi.status === 'warning'
  const dangerTone = kpi.status === 'danger'
  const progressValue = Number.isFinite(Number(kpi.progress)) ? Number(kpi.progress) : 0

  return (
    <article className={`kpi-card kpi-card--${variant}`}>
      <div className="kpi-card__top">
        <div className="kpi-card__identity">
          <span className={`icon-box kpi-card__icon icon-box--${dangerTone ? 'danger' : warningTone ? 'warning' : 'teal'}`}>
            <AppIcon name={kpi.icon} size={23} strokeWidth={2} />
          </span>
          <div>
            <p>{kpi.category}</p>
            <h3>{kpi.title}</h3>
          </div>
        </div>
        <StatusBadge status={dangerTone ? 'danger' : warningTone ? 'warning' : 'objective'} label={kpi.statusLabel} />
      </div>

      <div className="kpi-card__metrics">
        <div className="kpi-card__value">
          <strong>{kpi.value}</strong>
          <span>{kpi.unit}</span>
        </div>
        {isStrategic && (
          <div className="kpi-card__variation">
            <span>Variación</span>
            <strong className={isNegative ? 'is-negative' : 'is-positive'}>
              {isNegative ? '↓' : '↑'} {kpi.change}
            </strong>
          </div>
        )}
      </div>

      {isStrategic && <p className="kpi-card__target">{kpi.target}</p>}

      {isStrategic ? (
        <div className="kpi-card__progress-row">
          <div className="progress-line">
            <span style={{ '--progress': `${Math.min(progressValue, 120)}%` }} />
          </div>
          <span className="kpi-card__completion">{kpi.completion}</span>
        </div>
      ) : (
        <div className="kpi-card__bottom">
          <span>Comparativo mensual</span>
          <strong className={isNegative ? 'is-negative' : ''}>{kpi.change}</strong>
        </div>
      )}
    </article>
  )
}
