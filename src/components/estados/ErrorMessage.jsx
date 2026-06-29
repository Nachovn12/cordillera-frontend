/**
 * ErrorMessage — Estado de error de red o servidor.
 * CORD-128: Estados loading/empty/error/degradado en 6 screens.
 */
import { AlertCircle } from "lucide-react";

export default function ErrorMessage({ titulo = "Error", detalle }) {
  return (
    <div style={{
      display: "flex",
      alignItems: "flex-start",
      gap: "0.75rem",
      padding: "1rem 1.25rem",
      backgroundColor: "#fef2f2",
      border: "1px solid #fecaca",
      borderRadius: "0.5rem",
      color: "#b91c1c",
      margin: "1rem 0",
    }}>
      <AlertCircle size={20} style={{ flexShrink: 0, marginTop: "2px" }} />
      <div>
        <p style={{ margin: 0, fontWeight: 600 }}>{titulo}</p>
        {detalle && (
          <p style={{ margin: "0.25rem 0 0", fontSize: "0.875rem", opacity: 0.85 }}>
            {typeof detalle === "string" ? detalle : "Ha ocurrido un error inesperado."}
          </p>
        )}
      </div>
    </div>
  );
}
