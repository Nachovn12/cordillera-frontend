// Proxy BFF → Data Service. Todas las peticiones pasan por /api/v1/datos (BFF Gateway).
const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '')

const SISTEMAS_ORIGEN = ['POS', 'E-commerce', 'Inventario', 'Finanzas', 'CRM']

export { SISTEMAS_ORIGEN }

async function requestWithTimeout(url, options = {}) {
  const controller = new AbortController()
  const timeoutId = window.setTimeout(() => controller.abort(), 8000)
  try {
    return await fetch(url, { ...options, signal: controller.signal })
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new Error(`Tiempo de espera agotado al conectar con BFF Gateway en ${API_BASE_URL}`)
    }
    throw new Error(`No fue posible conectar con BFF Gateway en ${API_BASE_URL}`)
  } finally {
    window.clearTimeout(timeoutId)
  }
}

function normalizeDato(dato, index) {
  return {
    id: dato.id ?? `dato-${index}`,
    sistemaOrigen: dato.sistemaOrigen ?? dato.sistema_origen ?? '—',
    tipoDato: dato.tipoDato ?? dato.tipo_dato ?? '—',
    valor: dato.valor ?? '—',
    sucursalId: dato.sucursalId ?? dato.sucursal_id ?? '—',
    fechaRegistro: dato.fechaRegistro ?? dato.fecha_registro ?? null,
  }
}

function normalizeList(payload) {
  const raw = Array.isArray(payload) ? payload : []
  return raw.map(normalizeDato)
}

export async function getDatos() {
  const response = await requestWithTimeout(`${API_BASE_URL}/api/v1/datos`)
  if (!response.ok) throw new Error(`BFF Gateway respondió con estado HTTP ${response.status}`)
  const payload = await response.json()
  return normalizeList(payload)
}

export async function getDatosBySistema(sistemaOrigen) {
  const response = await requestWithTimeout(
    `${API_BASE_URL}/api/v1/datos/sistema/${encodeURIComponent(sistemaOrigen)}`,
  )
  if (!response.ok) throw new Error(`BFF Gateway respondió con estado HTTP ${response.status}`)
  const payload = await response.json()
  return normalizeList(payload)
}

export async function createDato(payload) {
  const response = await requestWithTimeout(`${API_BASE_URL}/api/v1/datos`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!response.ok) throw new Error(`BFF Gateway respondió con estado HTTP ${response.status}`)
  return response.json()
}
