import AppIcon from '../ui/AppIcon'

function getUser() {
  try {
    return JSON.parse(localStorage.getItem('authUser') || '{}')
  } catch {
    return {}
  }
}

function handleLogout() {
  if (!window.confirm('¿Cerrar sesión?')) return
  localStorage.removeItem('authToken')
  localStorage.removeItem('authUser')
  window.location.reload()
}

export default function Sidebar({ activeScreen, items, onNavigate }) {
  const user = getUser()

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

      <div className="sidebar__user">
        <div className="sidebar__user-avatar" aria-hidden="true">
          {user.nombre ? user.nombre.charAt(0).toUpperCase() : '?'}
        </div>
        <div className="sidebar__user-info">
          <strong>{user.nombre || 'Usuario'}</strong>
          <span>{user.rol || 'Sin rol'}</span>
        </div>
        <button
          type="button"
          className="sidebar__logout"
          onClick={handleLogout}
          title="Cerrar sesión"
          aria-label="Cerrar sesión"
        >
          <AppIcon name="logout" size={16} strokeWidth={2} />
        </button>
      </div>
    </aside>
  )
}
