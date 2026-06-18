const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/$/, "");

function getToken() {
  return localStorage.getItem("authToken");
}

function logout() {
  localStorage.removeItem("authToken");
  localStorage.removeItem("authUser");
  window.location.href = "/login";
}

/**
 * Wrapper de fetch que añade automáticamente el header Authorization
 * y fuerza logout si el BFF responde con 401.
 */
export async function authFetch(url, options = {}) {
  const token = getToken();

  const headers = {
    "Content-Type": "application/json",
    ...options.headers,
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  const response = await fetch(`${API_BASE_URL}${url}`, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    logout();
    throw new Error("Sesión expirada. Por favor inicia sesión nuevamente.");
  }

  return response;
}

export async function loginApi(usuario, contrasena) {
  const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ usuario, contrasena }),
  });

  if (response.status === 401) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.error || "Credenciales inválidas.");
  }

  if (!response.ok) {
    throw new Error(`Error del servidor (${response.status}).`);
  }

  return response.json();
}

export { API_BASE_URL };
