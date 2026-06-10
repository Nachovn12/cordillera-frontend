import { useMemo, useState } from "react";
import { DashboardProvider } from "./context/DashboardContext";
import AppShell from "./components/layout/AppShell";
import AlertsScreen from "./components/screens/AlertsScreen";
import DashboardScreen from "./components/screens/DashboardScreen";
import KpisScreen from "./components/screens/KpisScreen";
import ReportsScreen from "./components/screens/ReportsScreen";
import ServicesScreen from "./components/screens/ServicesScreen";
import SettingsScreen from "./components/screens/SettingsScreen";
import { navigationItems, screenMeta } from "./data/appConfig";
import "./styles/dashboard.css";

const screenComponents = {
  dashboard: DashboardScreen,
  kpis: KpisScreen,
  reports: ReportsScreen,
  alerts: AlertsScreen,
  services: ServicesScreen,
  settings: SettingsScreen,
};

// Mapeo de ruta pathname → screenId
const pathToScreen = {
  "/":          "dashboard",
  "/dashboard": "dashboard",
  "/kpis":      "kpis",
  "/reports":   "reports",
  "/alerts":    "alerts",
  "/services":  "services",
  "/settings":  "settings",
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
  const [activeScreen, setActiveScreen] = useState(getInitialScreen);
  const [dashboardRefreshToken, setDashboardRefreshToken] = useState(0);
  const [bffStatus, setBffStatus] = useState({
    status: "info",
    label: "Pendiente",
  });
  const ActiveScreen = screenComponents[activeScreen];

  const activeMeta = useMemo(() => screenMeta[activeScreen], [activeScreen]);

  // Sincroniza el estado cuando el usuario usa el botón Atrás/Adelante del navegador
  useState(() => {
    const onPopState = () => {
      const screenId = pathToScreen[window.location.pathname] ?? "dashboard";
      setActiveScreen(screenId);
    };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  });

  const handleRefresh = () => {
    if (activeScreen === "dashboard") {
      setDashboardRefreshToken((current) => current + 1);
    }
  };

  const handleNavigate = (screenId) => {
    setActiveScreen(screenId);
    // Ruta limpia: /dashboard, /kpis, /reports, etc.
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
      >
        <ActiveScreen
          refreshToken={dashboardRefreshToken}
          onBffStatusChange={setBffStatus}
        />
      </AppShell>
    </DashboardProvider>
  );
}
