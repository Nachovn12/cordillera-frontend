import AppIcon from './AppIcon'
import MiniSparkline from './MiniSparkline'

export default function MetricCard({ title, value, detail, icon, tone = 'success', trend = [] }) {
  return (
    <article className="metric-card">
      <div className={`icon-box metric-icon icon-box--${tone === 'critical' ? 'danger' : tone} metric-card__icon`}>
        <AppIcon name={icon} size={25} strokeWidth={2} />
      </div>
      <div className="metric-card__content">
        <p>{title}</p>
        <strong>{value}</strong>
        <span>{detail}</span>
      </div>
      {trend.length > 0 && <MiniSparkline data={trend} tone={tone} />}
    </article>
  )
}
