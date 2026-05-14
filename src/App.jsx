import { useMemo, useState } from 'react'
import AppShell from './components/layout/AppShell'
import AlertsScreen from './components/screens/AlertsScreen'
import DashboardScreen from './components/screens/DashboardScreen'
import KpisScreen from './components/screens/KpisScreen'
import ReportsScreen from './components/screens/ReportsScreen'
import ServicesScreen from './components/screens/ServicesScreen'
import SettingsScreen from './components/screens/SettingsScreen'
import { navigationItems, screenMeta } from './data/mockDashboardData'
import './styles/dashboard.css'

const screenComponents = {
  dashboard: DashboardScreen,
  kpis: KpisScreen,
  reports: ReportsScreen,
  alerts: AlertsScreen,
  services: ServicesScreen,
  settings: SettingsScreen,
}

export default function App() {
  const [activeScreen, setActiveScreen] = useState('dashboard')
  const [dashboardRefreshToken, setDashboardRefreshToken] = useState(0)
  const [bffStatus, setBffStatus] = useState({ status: 'info', label: 'Pendiente' })
  const ActiveScreen = screenComponents[activeScreen]

  const activeMeta = useMemo(() => screenMeta[activeScreen], [activeScreen])
  const handleRefresh = () => {
    if (activeScreen === 'dashboard') {
      setDashboardRefreshToken((current) => current + 1)
    }
  }

  return (
    <AppShell
      activeScreen={activeScreen}
      bffStatus={bffStatus}
      meta={activeMeta}
      navigationItems={navigationItems}
      onNavigate={setActiveScreen}
      onRefresh={handleRefresh}
    >
      <ActiveScreen
        refreshToken={dashboardRefreshToken}
        onBffStatusChange={setBffStatus}
      />
    </AppShell>
  )
}
