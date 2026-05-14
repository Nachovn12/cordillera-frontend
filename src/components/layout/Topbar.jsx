import FilterCard from '../ui/FilterCard'
import AppIcon from '../ui/AppIcon'
import StatusBadge from '../ui/StatusBadge'

export default function Topbar({ bffStatus, meta, onRefresh }) {
  return (
    <header className="topbar">
      <div className="topbar__heading">
        <span>MÓDULO EJECUTIVO</span>
        <h1>{meta.title}</h1>
        <p>{meta.subtitle}</p>
      </div>

      <div className="topbar__actions" aria-label="Filtros del módulo">
        <FilterCard icon="calendar" label="Periodo" value="Mayo 2026" />
        <FilterCard icon="store" label="Sucursal" value="Todas las sucursales" />

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
