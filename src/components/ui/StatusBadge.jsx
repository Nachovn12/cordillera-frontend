const labelByStatus = {
  success: 'Operativo',
  active: 'Activo',
  warning: 'Advertencia',
  critical: 'Crítica',
  danger: 'Crítico',
  info: 'Informativa',
  pending: 'En proceso',
  resolved: 'Resuelta',
  updated: 'Actualizado',
  objective: 'En objetivo',
}

export default function StatusBadge({ status = 'success', label }) {
  return (
    <span className={`status-badge status-badge--${status}`}>
      <span className="status-badge__dot" />
      {label || labelByStatus[status] || status}
    </span>
  )
}
