/**
 * EmptyState — Sin datos disponibles.
 * CORD-128: Estados loading/empty/error/degradado en 6 screens.
 */
import { PackageOpen } from "lucide-react";

export default function EmptyState({ mensaje = "No hay datos disponibles aún." }) {
  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      padding: "3rem",
      gap: "0.75rem",
      color: "#9ca3af",
      textAlign: "center",
    }}>
      <PackageOpen size={48} strokeWidth={1.25} />
      <h3 style={{ margin: 0, fontSize: "1rem", fontWeight: 600, color: "#6b7280" }}>
        Sin datos
      </h3>
      <p style={{ margin: 0, fontSize: "0.875rem" }}>{mensaje}</p>
    </div>
  );
}
