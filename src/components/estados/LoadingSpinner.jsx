/**
 * LoadingSpinner — Estado de carga.
 * CORD-128: Estados loading/empty/error/degradado en 6 screens.
 */
import { Loader2 } from "lucide-react";

export default function LoadingSpinner({ mensaje = "Cargando..." }) {
  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      padding: "3rem",
      gap: "1rem",
      color: "#6b7280",
    }}>
      <Loader2
        size={40}
        style={{ animation: "spin 1s linear infinite" }}
      />
      <p style={{ margin: 0, fontSize: "0.95rem" }}>{mensaje}</p>
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
