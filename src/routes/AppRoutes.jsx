/**
 * AppRoutes — Definición de rutas declarativas con React Router v6.
 *
 * CORD-127: Migrar navegación a React Router con rutas declarativas.
 *
 * Reemplaza el mapeo manual pathToScreen + window.history.pushState
 * del App.jsx original por un sistema de rutas declarativo.
 *
 * Rutas disponibles:
 *   /           → DashboardScreen
 *   /dashboard  → DashboardScreen
 *   /kpis       → KpisScreen
 *   /reports    → ReportsScreen
 *   /datos      → DataScreen
 *   /alerts     → AlertsScreen
 *   /services   → ServicesScreen
 *   /settings   → SettingsScreen
 *   /users      → UsersScreen
 *   *           → redirige a /
 */
import { Routes, Route, Navigate } from "react-router-dom";
import DashboardScreen from "../components/screens/DashboardScreen";
import KpisScreen from "../components/screens/KpisScreen";
import ReportsScreen from "../components/screens/ReportsScreen";
import DataScreen from "../components/screens/DataScreen";
import AlertsScreen from "../components/screens/AlertsScreen";
import ServicesScreen from "../components/screens/ServicesScreen";
import SettingsScreen from "../components/screens/SettingsScreen";
import UsersScreen from "../components/screens/UsersScreen";

/**
 * Props que se pasan a cada screen para mantener compatibilidad
 * con el sistema de tokens de refresco y estado del BFF.
 */
export default function AppRoutes({ refreshToken, onBffStatusChange, sucursal }) {
  const screenProps = { refreshToken, onBffStatusChange, sucursal };

  return (
    <Routes>
      <Route path="/" element={<DashboardScreen {...screenProps} />} />
      <Route path="/dashboard" element={<DashboardScreen {...screenProps} />} />
      <Route path="/kpis" element={<KpisScreen      {...screenProps} />} />
      <Route path="/reports" element={<ReportsScreen   {...screenProps} />} />
      <Route path="/datos" element={<DataScreen      {...screenProps} />} />
      <Route path="/alerts" element={<AlertsScreen    {...screenProps} />} />
      <Route path="/services" element={<ServicesScreen  {...screenProps} />} />
      <Route path="/settings" element={<SettingsScreen  {...screenProps} />} />
      <Route path="/users" element={<UsersScreen     {...screenProps} />} />
      {/* Ruta catch-all: cualquier URL desconocida redirige al dashboard */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
