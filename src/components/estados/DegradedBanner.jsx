/**
 * DegradedBanner — Servicio parcialmente disponible (status="Degradado").
 * CORD-128: Estados loading/empty/error/degradado en 6 screens.
 *
 * Aparece cuando el BFF retorna status="Degradado" porque algún microservicio
 * (kpi-service, data-service o report-service) no responde. Muestra al usuario
 * que la plataforma sigue operando con datos parciales.
 */
import { AlertTriangle } from "lucide-react";

export default function DegradedBanner({ servicioAfectado = "Microservicios" }) {
  return (
    <div style={{
      display: "flex",
      alignItems: "center",
      gap: "0.75rem",
      padding: "0.75rem 1.25rem",
      backgroundColor: "#fffbeb",
      border: "1px solid #fcd34d",
      borderRadius: "0.5rem",
      color: "#92400e",
      marginBottom: "1rem",
    }}>
      <AlertTriangle size={20} style={{ flexShrink: 0, color: "#d97706" }} />
      <div>
        <span style={{ fontWeight: 600 }}>Servicio parcialmente disponible — </span>
        <span style={{ fontSize: "0.875rem" }}>
          {servicioAfectado} no está respondiendo. Se muestran datos disponibles.
        </span>
      </div>
    </div>
  );
}
