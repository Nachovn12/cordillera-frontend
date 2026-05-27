export const navigationItems = [
  { id: 'dashboard', label: 'Dashboard', icon: 'dashboard' },
  { id: 'kpis', label: 'KPIs', icon: 'kpis' },
  { id: 'reports', label: 'Reportes', icon: 'reports' },
  { id: 'alerts', label: 'Alertas', icon: 'alerts' },
  { id: 'services', label: 'Servicios', icon: 'services' },
  { id: 'settings', label: 'Configuración', icon: 'settings' },
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
  alerts: {
    title: 'Centro de Alertas',
    subtitle: 'Monitorea eventos operacionales y recibe notificaciones críticas en tiempo real.',
  },
  services: {
    title: 'Estado de Servicios',
    subtitle: 'Monitoreo de la salud y disponibilidad de los microservicios de la plataforma.',
  },
  settings: {
    title: 'Configuración',
    subtitle: 'Gestiona las preferencias de la plataforma e integraciones.',
  },
}

export const summaryMetrics = [
  {
    title: 'Ventas totales',
    value: '$1.250.000',
    detail: 'Consolidado operacional',
    icon: 'sales',
    trend: [42, 58, 50, 72, 64, 78],
  },
  {
    title: 'KPIs monitoreados',
    value: '3',
    detail: 'Indicadores activos',
    icon: 'kpis',
    trend: [28, 36, 50, 44, 62, 58],
  },
  {
    title: 'Alertas activas',
    value: '2',
    detail: 'Requieren revisión',
    icon: 'alerts',
    tone: 'warning',
    trend: [24, 46, 38, 70, 42, 58],
  },
  {
    title: 'Estado BFF',
    value: 'Operativo',
    detail: 'Gateway disponible',
    icon: 'shield',
    trend: [35, 46, 38, 60, 52, 72],
  },
]

export const executiveKpis = [
  {
    id: 'sales',
    title: 'Ventas totales',
    category: 'Ventas',
    value: '$1.250.000',
    unit: 'CLP',
    status: 'success',
    statusLabel: 'Activo',
    change: '+8.4%',
    target: 'Meta: $1.200.000 CLP',
    completion: '104%',
    progress: 104,
    icon: 'sales',
    trend: [42, 48, 46, 62, 54, 72],
  },
  {
    id: 'stock',
    title: 'Rotación de inventario',
    category: 'Inventario',
    value: '82',
    unit: '%',
    status: 'warning',
    statusLabel: 'Advertencia',
    change: '-3.1%',
    target: 'Meta: >= 85%',
    completion: '96%',
    progress: 96,
    icon: 'inventory',
    trend: [58, 42, 50, 34, 46, 38],
  },
  {
    id: 'profit',
    title: 'Rentabilidad operacional',
    category: 'Finanzas',
    value: '18,4',
    unit: '%',
    status: 'success',
    statusLabel: 'Activo',
    change: '+8.4%',
    target: 'Meta: >= 16%',
    completion: '115%',
    progress: 115,
    icon: 'finance',
    trend: [44, 50, 56, 52, 70, 76],
  },
]

export const salesTrend = [
  { label: 'Sem 1', value: 950000 },
  { label: 'Sem 2', value: 1080000 },
  { label: 'Sem 3', value: 1140000 },
  { label: 'Sem 4', value: 1210000 },
  { label: 'Sem 5', value: 1280000 },
  { label: 'Sem 6', value: 1420000 },
]

export const recentReports = [
  { id: 1, title: 'Reporte ventas mensual', format: 'PDF', category: 'Ventas', time: 'Hoy 16:30', status: 'Completado' },
  { id: 2, title: 'Reporte inventario crítico', format: 'CSV', category: 'Inventario', time: 'Hoy 15:10', status: 'En proceso' },
  { id: 3, title: 'Reporte rentabilidad', format: 'JSON', category: 'Finanzas', time: 'Ayer 18:45', status: 'Completado' },
]

export const operationalAlerts = [
  {
    id: 1,
    title: 'Inventario bajo',
    description: 'Productos críticos bajo umbral mínimo en sucursales seleccionadas.',
    category: 'Inventario',
    severity: 'critical',
    status: 'Activa',
    origin: 'Inventario',
    time: 'Hoy 14:22',
  },
  {
    id: 2,
    title: 'Reporte ejecutivo disponible',
    description: 'El reporte semanal está disponible para descarga.',
    category: 'Reportes',
    severity: 'info',
    status: 'Resuelta',
    origin: 'Reportes',
    time: 'Hoy 13:20',
  },
]

export const services = [
  {
    id: 'bff',
    name: 'BFF Gateway',
    status: 'success',
    statusLabel: 'Operativo',
    uptime: '99,98%',
    latency: '98 ms',
    detail: 'Puerta de entrada para clientes web y móviles. Gestiona autenticación, rutas y agregación de servicios.',
    shortDetail: 'Gateway disponible',
    trend: [40, 48, 52, 62, 54, 48, 45, 58, 66, 54],
  },
  {
    id: 'data',
    name: 'Data Service',
    status: 'success',
    statusLabel: 'Operativo',
    uptime: '99,95%',
    latency: '112 ms',
    detail: 'Servicio de datos maestros y catálogos. Acceso a información de clientes, productos y sucursales.',
    shortDetail: 'Sincronización activa',
    trend: [46, 52, 60, 48, 42, 45, 39, 58, 50, 47],
  },
  {
    id: 'kpi',
    name: 'KPI Service',
    status: 'success',
    statusLabel: 'Operativo',
    uptime: '99,90%',
    latency: '154 ms',
    detail: 'Cálculo, consolidación y exposición de indicadores y métricas para tableros ejecutivos.',
    shortDetail: 'Cálculo operativo',
    trend: [56, 52, 54, 40, 36, 48, 46, 52, 50, 45],
  },
  {
    id: 'report',
    name: 'Report Service',
    status: 'success',
    statusLabel: 'Operativo',
    uptime: '99,92%',
    latency: '128 ms',
    detail: 'Generación y exportación de reportes ejecutivos.',
    shortDetail: 'Exportación habilitada',
    trend: [44, 46, 52, 48, 40, 42, 50, 58, 48, 46],
  },
]

export const strategicMetrics = [
  { title: 'KPIs activos', value: '12', detail: 'Indicadores monitoreados', icon: 'kpis', trend: [40, 52, 48, 70, 58, 62] },
  { title: 'KPIs en alerta', value: '2', detail: 'Requieren atención', icon: 'alerts', tone: 'warning', trend: [20, 40, 32, 64, 38, 45] },
  { title: 'Meta cumplida', value: '83%', detail: '10 de 12 indicadores', icon: 'target', trend: [58, 52, 70, 66, 72, 68] },
  { title: 'Tendencia mensual', value: '+8,4%', detail: 'Promedio de variación', icon: 'trend', trend: [48, 62, 58, 78, 64, 70] },
]

export const kpiEvolution = [
  { label: 'Dic 2025', sales: 84, stock: 36, profit: 58 },
  { label: 'Ene 2026', sales: 110, stock: 50, profit: 74 },
  { label: 'Feb 2026', sales: 104, stock: 38, profit: 74 },
  { label: 'Mar 2026', sales: 102, stock: 38, profit: 72 },
  { label: 'Abr 2026', sales: 112, stock: 52, profit: 88 },
  { label: 'May 2026', sales: 128, stock: 64, profit: 104 },
]

export const kpiUpdates = [
  { title: 'Ventas totales', detail: 'Actualizado por Sistema', time: 'Hoy 16:45', status: 'Actualizado' },
  { title: 'Rotación de inventario', detail: 'Actualizado por Job nocturno', time: 'Hoy 02:15', status: 'Actualizado' },
  { title: 'Rentabilidad operacional', detail: 'Actualizado por Sistema', time: 'Ayer 18:35', status: 'Actualizado' },
  { title: 'Ticket promedio', detail: 'Actualizado por Integración POS', time: 'Ayer 17:50', status: 'Actualizado' },
]

export const kpiTableRows = [
  ['Ventas totales', 'Ventas', '$1.250.000 CLP', '$1.200.000 CLP', '104%', '+8,4%', 'En objetivo'],
  ['Rotación de inventario', 'Inventario', '82%', '>= 85%', '96%', '-3,1%', 'En alerta'],
  ['Rentabilidad operacional', 'Finanzas', '18,4%', '>= 16%', '115%', '+8,4%', 'En objetivo'],
  ['Ticket promedio', 'Ventas', '$24.350 CLP', '$23.000 CLP', '106%', '+5,9%', 'En objetivo'],
]

export const reportLibrary = [
  ['Reporte ventas mensual', 'Resumen de ventas totales por sucursal y categoría.', 'PDF CSV XLS', 'Hoy 16:30', 'Completado'],
  ['Inventario crítico', 'Productos con stock bajo al mínimo definido.', 'PDF CSV JSON', 'Hoy 15:10', 'En proceso'],
  ['Rentabilidad operacional', 'Análisis de rentabilidad por línea de negocio y sucursal.', 'PDF CSV XLS', 'Ayer 18:45', 'Completado'],
  ['Reporte ejecutivo retail', 'Dashboard ejecutivo consolidado del negocio retail.', 'PDF JSON', 'Ayer 12:20', 'Completado'],
]

export const reportTemplates = [
  ['Ventas por sucursal', 'Resumen de ventas por sucursal y periodo.', 'PDF'],
  ['Inventario por categoría', 'Stock y valorización por categoría de producto.', 'CSV'],
  ['Indicadores financieros', 'KPIs financieros y márgenes operacionales.', 'XLS'],
  ['Resumen ejecutivo diario', 'Resumen diario de ventas, inventario y alertas.', 'PDF'],
]

export const reportSchedule = [
  ['Reporte ventas mensual', 'Mensual', '01/06/2026 08:00'],
  ['Inventario crítico', 'Diario', '16/05/2026 07:00'],
  ['Rentabilidad operacional', 'Semanal', '18/05/2026 09:00'],
  ['Reporte ejecutivo retail', 'Diario', '16/05/2026 06:30'],
]

export const alertRows = [
  ['Inventario bajo', 'El inventario del producto SKU-1234 está por debajo del umbral mínimo.', 'Operacional', 'Crítica', 'Inventario', 'Hoy 16:32', 'Activa'],
  ['Desfase de KPI', 'El KPI de Rentabilidad operacional presenta un desfase del 12%.', 'KPI', 'Advertencia', 'Dashboard Ejecutivo', 'Hoy 15:10', 'En seguimiento'],
  ['Servicio KPI no disponible', 'El servicio de KPI no responde desde hace más de 5 minutos.', 'Servicio', 'Crítica', 'BFF Gateway', 'Hoy 14:45', 'Activa'],
  ['Reporte ejecutivo listo', 'El reporte ejecutivo semanal ya está disponible para descarga.', 'Reporte', 'Informativa', 'Reportes', 'Hoy 13:20', 'Resuelta'],
  ['Sincronización pendiente', 'Existen 3 procesos de sincronización pendientes.', 'Operacional', 'Advertencia', 'Data Service', 'Hoy 11:05', 'En seguimiento'],
]

export const alertHistory = [
  ['Reporte diario generado', 'Reportes', 'Resuelta', 'Hoy 10:22'],
  ['Sincronización completada', 'Data Service', 'Resuelta', 'Hoy 09:45'],
  ['Actualización de inventario', 'Inventario', 'Resuelta', 'Hoy 08:30'],
  ['Servicio de reportes reiniciado', 'Reportes', 'Resuelta', 'Ayer 18:15'],
]

export const heatmapRows = [
  { label: 'Críticas', values: [1, 2, 7, 11, 10, 1, 0] },
  { label: 'Advertencias', values: [2, 4, 5, 6, 5, 1, 1] },
  { label: 'Informativas', values: [1, 2, 4, 5, 3, 1, 1] },
]

export const serviceEvents = [
  ['BFF Gateway - Verificación de salud exitosa', 'Health check OK', 'Hoy 16:45', 'success'],
  ['Report Service - Alta latencia detectada', 'Latencia superior al umbral (200 ms)', 'Hoy 16:20', 'warning'],
  ['Data Service - Índices sincronizados', 'Sincronización completada correctamente', 'Hoy 15:58', 'success'],
  ['KPI Service - Proceso programado ejecutado', 'Cálculo de KPIs finalizado', 'Hoy 15:30', 'info'],
  ['BFF Gateway - Despliegue completado', 'Versión 2.4.1 desplegada exitosamente', 'Hoy 14:55', 'success'],
]

export const availabilityTrend = [
  { label: '29 Abr', value: 99.6 },
  { label: '30 Abr', value: 99.45 },
  { label: '1 May', value: 99.75 },
  { label: '2 May', value: 99.68 },
  { label: '3 May', value: 99.52 },
  { label: '4 May', value: 99.78 },
  { label: '5 May', value: 99.60 },
]

export const settingsServices = [
  ['BFF Gateway', 'Operativo', 'Hoy 16:45'],
  ['Data Service', 'Operativo', 'Hoy 16:44'],
  ['KPI Service', 'Operativo', 'Hoy 16:44'],
  ['Report Service', 'Operativo', 'Hoy 16:43'],
]
