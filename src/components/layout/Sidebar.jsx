import AppIcon from '../ui/AppIcon'

export default function Sidebar({ activeScreen, items, onNavigate }) {
  return (
    <aside className="sidebar" aria-label="Navegacion principal">
      <div className="sidebar__brand">
        <div className="sidebar__mark" aria-hidden="true">
          <span />
          <span />
          <span />
        </div>
        <div>
          <strong>CORDILLERA</strong>
          <span>Platform</span>
        </div>
      </div>

      <nav className="sidebar__nav" aria-label="Módulos ejecutivos">
        {items.map((item) => {
          const isActive = activeScreen === item.id

          return (
            <button
              className={`sidebar__item${isActive ? ' sidebar__item--active' : ''}`}
              type="button"
              key={item.id}
              onClick={() => onNavigate(item.id)}
              aria-current={isActive ? 'page' : undefined}
            >
              <AppIcon className="nav-icon" name={item.icon} size={20} strokeWidth={2} />
              <span>{item.label}</span>
              {item.badge && <em>{item.badge}</em>}
            </button>
          )
        })}
      </nav>

      <div className="sidebar__footer">
        <span>Grupo Cordillera</span>
        <strong>Suite Ejecutiva</strong>
      </div>
    </aside>
  )
}
