const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080').replace(/\/$/, '')

function getFirstDefined(...values) {
  return values.find((value) => value !== undefined && value !== null)
}

function toArray(value) {
  return Array.isArray(value) ? value : []
}

function normalizeRemoteItem(item, index, fallbackTitle = 'Elemento sin nombre') {
  return {
    id: getFirstDefined(item.id, item.codigo, item.name, item.nombre, `remote-${index}`),
    title: getFirstDefined(item.title, item.titulo, item.name, item.nombre, fallbackTitle),
    description: getFirstDefined(item.description, item.descripcion, item.detalle, ''),
    status: getFirstDefined(item.status, item.estado, 'info'),
    type: getFirstDefined(item.type, item.tipo, item.categoria, ''),
    value: getFirstDefined(item.value, item.valor, item.cantidad, ''),
  }
}

export function normalizeSettingsResponse(payload = {}) {
  return {
    raw: payload,
    parameters: getFirstDefined(payload.parameters, payload.parametros, payload.configuracion, null),
    integrations: toArray(getFirstDefined(payload.integrations, payload.integraciones)).map((item, index) =>
      normalizeRemoteItem(item, index, 'Integración sin nombre')),
    users: toArray(getFirstDefined(payload.users, payload.usuarios)).map((item, index) =>
      normalizeRemoteItem(item, index, 'Usuario sin nombre')),
    roles: toArray(getFirstDefined(payload.roles, payload.perfiles)).map((item, index) =>
      normalizeRemoteItem(item, index, 'Rol sin nombre')),
    services: toArray(getFirstDefined(payload.services, payload.servicios)).map((item, index) =>
      normalizeRemoteItem(item, index, 'Servicio sin nombre')),
    fetchedAt: new Date().toLocaleString('es-CL', {
      dateStyle: 'short',
      timeStyle: 'short',
    }),
  }
}

async function requestWithTimeout(url, options = {}) {
  const controller = new AbortController()
  const timeoutId = window.setTimeout(() => controller.abort(), 8000)

  try {
    return await fetch(url, {
      ...options,
      signal: controller.signal,
    })
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new Error(`Tiempo de espera agotado al conectar con BFF Gateway en ${API_BASE_URL}`)
    }

    throw new Error(`No fue posible conectar con BFF Gateway en ${API_BASE_URL}`)
  } finally {
    window.clearTimeout(timeoutId)
  }
}

async function parseJsonResponse(response) {
  if (!response.ok) {
    throw new Error(`BFF Gateway respondió con estado HTTP ${response.status}`)
  }

  const text = await response.text()
  return text ? JSON.parse(text) : {}
}

export async function getSettings() {
  const response = await requestWithTimeout(`${API_BASE_URL}/api/configuracion`)
  const payload = await parseJsonResponse(response)
  return normalizeSettingsResponse(payload)
}

export async function updateSettings(payload) {
  const response = await requestWithTimeout(`${API_BASE_URL}/api/configuracion`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })

  const responsePayload = await parseJsonResponse(response)
  return normalizeSettingsResponse(responsePayload)
}
