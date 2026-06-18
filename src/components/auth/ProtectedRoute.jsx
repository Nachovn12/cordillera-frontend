/**
 * ProtectedRoute — envuelve cualquier componente que requiera autenticación.
 * Si no hay token en localStorage, fuerza la navegación a /login.
 */
export default function ProtectedRoute({ children }) {
  const token = localStorage.getItem("authToken");

  if (!token) {
    window.location.href = "/login";
    return null;
  }

  return children;
}
