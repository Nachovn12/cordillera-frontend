import ExecutiveDashboard from "../dashboard/ExecutiveDashboard";
import { useDashboardContext } from "../../context/DashboardContext";
import { useEffect, useRef, useState } from "react";
import AppIcon from "../ui/AppIcon";

function CircuitBreakerToast({ onDismiss }) {
  return (
    <div className="cb-toast" role="alert" aria-live="polite">
      <AppIcon name="warning" size={17} strokeWidth={2} />
      <span>
        <strong>Alerta:</strong> Mostrando datos cacheados. El servicio de origen no está disponible temporalmente.
      </span>
      <button
        type="button"
        className="cb-toast__close"
        onClick={onDismiss}
        aria-label="Cerrar alerta"
      >
        <AppIcon name="more" size={14} strokeWidth={2} />
      </button>
    </div>
  );
}

export default function DashboardScreen({ refreshToken = 0, onBffStatusChange, sucursal = "todas" }) {
  const { dashboard, fetchDashboard, fetchDashboardBySucursal } = useDashboardContext();
  const { data, loading, error } = dashboard;
  const didMount = useRef(false);
  const prevSucursal = useRef(sucursal);
  const [showCbToast, setShowCbToast] = useState(false);

  // Carga inicial
  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  // Recarga cuando cambia la sucursal desde el Topbar
  useEffect(() => {
    if (prevSucursal.current === sucursal) return;
    prevSucursal.current = sucursal;
    setShowCbToast(false);
    if (sucursal === "todas") {
      fetchDashboard();
    } else {
      fetchDashboardBySucursal(sucursal);
    }
  }, [sucursal, fetchDashboard, fetchDashboardBySucursal]);

  // Comunica estado BFF al AppShell y detecta caídas de circuit breaker
  useEffect(() => {
    if (loading) {
      onBffStatusChange?.({ status: "info", label: "Consultando" });
      return;
    }
    if (error) {
      onBffStatusChange?.({ status: "danger", label: "Error" });
      return;
    }
    if (data?.bffStatus) {
      onBffStatusChange?.(data.bffStatus);
    }
    if (data?.services?.some((s) => s.status === "danger" || s.status === "warning")) {
      setShowCbToast(true);
    }
  }, [data, error, loading, onBffStatusChange]);

  // Refresh manual desde botón Actualizar del Topbar
  useEffect(() => {
    if (!didMount.current) {
      didMount.current = true;
      return;
    }
    if (sucursal === "todas") fetchDashboard();
    else fetchDashboardBySucursal(sucursal);
  }, [refreshToken, fetchDashboard, fetchDashboardBySucursal, sucursal]);

  return (
    <main className="screen screen--dashboard">
      {showCbToast && <CircuitBreakerToast onDismiss={() => setShowCbToast(false)} />}
      <ExecutiveDashboard
        data={data}
        error={error}
        loading={loading}
        sucursal={sucursal}
        onRetry={() => {
          if (sucursal === "todas") fetchDashboard();
          else fetchDashboardBySucursal(sucursal);
        }}
      />
    </main>
  );
}
