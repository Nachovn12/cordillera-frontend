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
}) {
  return (
    <div className="app-shell">
      <Sidebar activeScreen={activeScreen} items={navigationItems} onNavigate={onNavigate} />

      <div className="app-shell__workspace">
        <Topbar bffStatus={bffStatus} meta={meta} onRefresh={onRefresh} />
        {children}
      </div>
    </div>
  )
}
