import FilterCard from '../ui/FilterCard'
import AppIcon from '../ui/AppIcon'
import StatusBadge from '../ui/StatusBadge'

const SUCURSALES = [
  { id: 'todas', label: 'Todas las sucursales' },
  { id: '1',     label: 'Santiago' },
  { id: '2',     label: 'Valdivia' },
  { id: '3',     label: 'Concepción' },
  { id: '4',     label: 'Temuco' },
]

function SucursalFilterCard({ sucursal, onChange }) {
  const selected = SUCURSALES.find((s) => s.id === sucursal) ?? SUCURSALES[0]

  return (
    <label className="filter-card filter-card--select" aria-label="Filtrar por sucursal">
      <AppIcon className="topbar-icon" name="store" size={21} strokeWidth={2.1} />
      <span>
        <small>Sucursal</small>
        <strong>{selected.label}</strong>
      </span>
      <select
        className="filter-card__select"
        value={sucursal}
        onChange={(e) => onChange(e.target.value)}
        aria-label="Seleccionar sucursal"
      >
        {SUCURSALES.map((s) => (
          <option key={s.id} value={s.id}>{s.label}</option>
        ))}
      </select>
    </label>
  )
}

export default function Topbar({ bffStatus, meta, onRefresh, sucursal, onSucursalChange }) {
  return (
    <header className="topbar">
      <div className="topbar__heading">
        <span>MÓDULO EJECUTIVO</span>
        <h1>{meta.title}</h1>
        <p>{meta.subtitle}</p>
      </div>

      <div className="topbar__actions" aria-label="Filtros del módulo">
        <FilterCard icon="calendar" label="Periodo" value="Mayo 2026" />

        {sucursal !== undefined && onSucursalChange ? (
          <SucursalFilterCard sucursal={sucursal} onChange={onSucursalChange} />
        ) : (
          <FilterCard icon="store" label="Sucursal" value="Todas las sucursales" />
        )}

        <div className="topbar__gateway">
          <AppIcon className="topbar-icon" name="gateway" size={21} strokeWidth={2.1} />
          <span>
            <small>BFF Gateway</small>
            <StatusBadge
              status={bffStatus?.status || 'info'}
              label={bffStatus?.label || 'Pendiente'}
            />
          </span>
        </div>

        <button className="topbar__refresh" type="button" onClick={onRefresh}>
          <AppIcon className="topbar-icon" name="refresh" size={20} strokeWidth={2.1} />
          Actualizar
        </button>

      </div>
    </header>
  )
}
