export const navigationItems = [
  { id: 'dashboard', label: 'Dashboard', icon: 'dashboard' },
  { id: 'kpis', label: 'KPIs', icon: 'kpis' },
  { id: 'reports', label: 'Reportes', icon: 'reports' },
  { id: 'datos', label: 'Datos', icon: 'database' },
  { id: 'services', label: 'Servicios', icon: 'services' },
  { id: 'users', label: 'Usuarios', icon: 'users' },
]

export const screenMeta = {
  dashboard: {
    title: 'Dashboard Ejecutivo',
    subtitle: 'Vista consolidada para la toma de decisiones estratégicas.',
  },
  kpis: {
    title: 'KPIs Estratégicos',
    subtitle: 'Monitoreo y gestión de indicadores clave para la toma de decisiones ejecutivas.',
  },
  reports: {
    title: 'Centro de Reportes',
    subtitle: 'Genera, consulta y exporta reportes ejecutivos para la toma de decisiones estratégicas.',
  },
  datos: {
    title: 'Integración de Datos',
    subtitle: 'Ingesta manual y consulta de datos operacionales por sistema de origen.',
  },
  services: {
    title: 'Estado de Servicios',
    subtitle: 'Monitoreo de la salud y disponibilidad de los microservicios de la plataforma.',
  },
  users: {
    title: 'Gestión de Usuarios',
    subtitle: 'Administra los usuarios con acceso a la plataforma ejecutiva. GET y POST /api/auth/usuarios.',
  },
  alerts: {
    title: 'Centro de Alertas',
    subtitle: 'Monitorea eventos operacionales y recibe notificaciones críticas en tiempo real.',
  },
  settings: {
    title: 'Configuración',
    subtitle: 'Gestiona las preferencias de la plataforma e integraciones.',
  },
}


