/**
 * DashboardScreen — Observer del DashboardContext.
 *
 * En lugar de crear su propio estado local con fetch individual, este componente
 * se suscribe al DashboardContext (patrón Observer) mediante useDashboardContext().
 * Cualquier actualización despachada al contexto se propaga automáticamente aquí.
 */
import ExecutiveDashboard from "../dashboard/ExecutiveDashboard";
import { useDashboardContext } from "../../context/DashboardContext";
import { useEffect, useRef } from "react";

export default function DashboardScreen({
  refreshToken = 0,
  onBffStatusChange,
}) {
  // Observer: suscripción al contexto centralizado
  const { dashboard, fetchDashboard } = useDashboardContext();
  const { data, loading, error } = dashboard;
  const didMount = useRef(false);

  // Carga inicial
  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  // Comunica el estado BFF al AppShell
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
  }, [data, error, loading, onBffStatusChange]);

  // Refresca cuando el usuario pulsa el botón de refresh en AppShell
  useEffect(() => {
    if (!didMount.current) {
      didMount.current = true;
      return;
    }
    fetchDashboard();
  }, [refreshToken, fetchDashboard]);

  return (
    <main className="screen screen--dashboard">
      <ExecutiveDashboard
        data={data}
        error={error}
        loading={loading}
        onRetry={fetchDashboard}
      />
    </main>
  );
}
