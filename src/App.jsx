import { useEffect, useMemo, useState } from "react";
import { DashboardProvider } from "./context/DashboardContext";
import useLocalSettings from "./hooks/useLocalSettings";
import AppShell from "./components/layout/AppShell";
import AlertsScreen from "./components/screens/AlertsScreen";
import DashboardScreen from "./components/screens/DashboardScreen";
import DataScreen from "./components/screens/DataScreen";
import KpisScreen from "./components/screens/KpisScreen";
import ReportsScreen from "./components/screens/ReportsScreen";
import ServicesScreen from "./components/screens/ServicesScreen";
import SettingsScreen from "./components/screens/SettingsScreen";
import LoginPage from "./pages/LoginPage";
import UsersScreen from "./components/screens/UsersScreen";
import { navigationItems, screenMeta } from "./data/appConfig";
import "./styles/dashboard.css";

const screenComponents = {
  dashboard: DashboardScreen,
  kpis: KpisScreen,
  reports: ReportsScreen,
  datos: DataScreen,
  alerts: AlertsScreen,
  services: ServicesScreen,
  settings: SettingsScreen,
  users: UsersScreen,
};

// Mapeo de ruta pathname → screenId
const pathToScreen = {
  "/":          "dashboard",
  "/dashboard": "dashboard",
  "/kpis":      "kpis",
  "/reports":   "reports",
  "/datos":     "datos",
  "/alerts":    "alerts",
  "/services":  "services",
  "/settings":  "settings",
  "/users":     "users",
};

function getInitialScreen() {
  if (typeof window === "undefined") return "dashboard";

  // Soporte de compatibilidad: si llega con ?screen=xxx lo redirigimos a la ruta limpia
  const legacyScreen = new URLSearchParams(window.location.search).get("screen");
  if (legacyScreen && screenComponents[legacyScreen]) {
    window.history.replaceState(null, "", "/" + legacyScreen);
    return legacyScreen;
  }

  const screenId = pathToScreen[window.location.pathname];
  return screenId ?? "dashboard";
}

export default function App() {
  // Todos los hooks deben declararse antes de cualquier return condicional (Rules of Hooks)
  const [isAuthenticated, setIsAuthenticated] = useState(
    () => !!localStorage.getItem("authToken")
  );
  const [activeScreen, setActiveScreen] = useState(getInitialScreen);
  const [dashboardRefreshToken, setDashboardRefreshToken] = useState(0);
  const [bffStatus, setBffStatus] = useState({ status: "info", label: "Pendiente" });
  const { settings } = useLocalSettings();
  
  // Limpieza defensiva: si el localStorage tiene guardado el label antiguo por error
  const safeBranch = settings.defaultBranch === "Todas las sucursales" 
    ? "todas" 
    : (settings.defaultBranch || "todas");
    
  const [sucursal, setSucursal] = useState(safeBranch);

  const activeMeta = useMemo(() => screenMeta[activeScreen], [activeScreen]);

  // Sincroniza el estado cuando el usuario usa Atrás/Adelante del navegador
  useEffect(() => {
    const onPopState = () => {
      const screenId = pathToScreen[window.location.pathname] ?? "dashboard";
      setActiveScreen(screenId);
    };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  // Gate de autenticación — debe ir después de todos los hooks
  if (!isAuthenticated) {
    return <LoginPage onLoginSuccess={() => setIsAuthenticated(true)} />;
  }

  const ActiveScreen = screenComponents[activeScreen];

  const handleRefresh = () => {
    if (activeScreen === "dashboard") {
      setDashboardRefreshToken((current) => current + 1);
    }
  };

  const handleNavigate = (screenId) => {
    setActiveScreen(screenId);
    window.history.pushState(null, "", "/" + screenId);
  };

  return (
    <DashboardProvider>
      <AppShell
        activeScreen={activeScreen}
        bffStatus={bffStatus}
        meta={activeMeta}
        navigationItems={navigationItems}
        onNavigate={handleNavigate}
        onRefresh={handleRefresh}
        periodo={settings.defaultPeriod}
        sucursal={sucursal}
        onSucursalChange={setSucursal}
      >
        <ActiveScreen
          refreshToken={dashboardRefreshToken}
          onBffStatusChange={setBffStatus}
          sucursal={sucursal}
          onNavigate={handleNavigate}
        />
      </AppShell>
    </DashboardProvider>
  );
}
