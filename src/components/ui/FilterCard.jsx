import AppIcon from './AppIcon'

export default function FilterCard({ label, value, icon }) {
  return (
    <button className="filter-card" type="button">
      {icon && <AppIcon className="topbar-icon" name={icon} size={21} strokeWidth={2.1} />}
      <span>
        <small>{label}</small>
        <strong>{value}</strong>
      </span>
    </button>
  )
}
