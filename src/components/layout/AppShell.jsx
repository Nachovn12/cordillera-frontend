import Sidebar from './Sidebar'
import Topbar from './Topbar'

export default function AppShell({
  activeScreen,
  bffStatus,
  children,
  meta,
  navigationItems,
  onNavigate,
  onRefresh,
  sucursal,
  onSucursalChange,
}) {
  return (
    <div className="app-shell">
      <Sidebar activeScreen={activeScreen} items={navigationItems} onNavigate={onNavigate} />

      <div className="app-shell__workspace">
        <Topbar
          bffStatus={bffStatus}
          meta={meta}
          onRefresh={onRefresh}
          sucursal={activeScreen === 'dashboard' ? sucursal : undefined}
          onSucursalChange={activeScreen === 'dashboard' ? onSucursalChange : undefined}
        />
        {children}
      </div>
    </div>
  )
}
