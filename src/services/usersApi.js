import { authFetch } from "./api";

export async function getUsuarios() {
  const response = await authFetch("/api/auth/usuarios");
  if (!response.ok) throw new Error(`Error al obtener usuarios (${response.status})`);
  return response.json();
}

export async function deleteUsuario(id) {
  const response = await authFetch(`/api/auth/usuarios/${id}`, { method: "DELETE" });
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.error || `Error al eliminar usuario (${response.status})`);
  }
}

export async function createUsuario(payload) {
  const response = await authFetch("/api/auth/usuarios", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  if (response.status === 409) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.error || "El usuario ya existe.");
  }
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.error || `Error al crear usuario (${response.status})`);
  }
  return response.json();
}
