const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080').replace(/\/$/, '')

const currencyFormatter = new Intl.NumberFormat('es-CL', {
  style: 'currency',
  currency: 'CLP',
  maximumFractionDigits: 0,
})

const percentFormatter = new Intl.NumberFormat('es-CL', {
  maximumFractionDigits: 1,
})

function getFirstDefined(...values) {
  return values.find((value) => value !== undefined && value !== null)
}

function toNumber(value) {
  const numberValue = Number(value)
  return Number.isFinite(numberValue) ? numberValue : null
}

function formatKpiValue(value, unit = '') {
  const numberValue = toNumber(value)

  if (numberValue === null) {
    return 'Sin datos disponibles'
  }

  if (String(unit).toUpperCase() === 'CLP') {
    return currencyFormatter.format(numberValue).replace(/\s/g, '')
  }

  return percentFormatter.format(numberValue)
}

function formatVariation(value) {
  const numberValue = toNumber(value)

  if (numberValue === null) {
    return 'Sin variación'
  }

  const prefix = numberValue > 0 ? '+' : ''
  return `${prefix}${percentFormatter.format(numberValue)}%`
}

function normalizeStatus(value, completion) {
  const normalized = String(value || '').trim().toLowerCase()

  if (normalized.includes('crít') || normalized.includes('crit') || normalized.includes('error')) {
    return { status: 'danger', label: 'Crítico' }
  }

  if (normalized.includes('advert') || normalized.includes('alert')) {
    return { status: 'warning', label: normalized.includes('alert') ? 'En alerta' : 'Advertencia' }
  }

  if (normalized.includes('objetivo')) {
    return { status: 'success', label: 'En objetivo' }
  }

  if (normalized.includes('activo') || normalized.includes('ok')) {
    return { status: 'success', label: 'Activo' }
  }

  if (completion !== null && completion < 100) {
    return { status: 'warning', label: 'En alerta' }
  }

  return { status: 'info', label: value ? String(value) : 'Estado no informado' }
}

function getIconByCategory(category) {
  const normalized = String(category || '').toLowerCase()

  if (normalized.includes('invent')) return 'inventory'
  if (normalized.includes('fin')) return 'finance'
  if (normalized.includes('venta')) return 'sales'
  return 'kpis'
}

function normalizeKpi(kpi, index) {
  const rawValue = getFirstDefined(kpi.valor, kpi.value, kpi.valorActual, kpi.currentValue)
  const rawTarget = getFirstDefined(kpi.meta, kpi.target, kpi.objetivo)
  const rawCompletion = getFirstDefined(kpi.cumplimiento, kpi.completion)
  const unit = getFirstDefined(kpi.unidad, kpi.unit, '')
  const category = getFirstDefined(kpi.categoria, kpi.category, 'General')
  const valueNumber = toNumber(rawValue)
  const targetNumber = toNumber(rawTarget)
  const completionNumber = toNumber(rawCompletion) ?? (
    valueNumber !== null && targetNumber ? (valueNumber / targetNumber) * 100 : null
  )
  const statusMeta = normalizeStatus(getFirstDefined(kpi.estado, kpi.status, kpi.statusLabel), completionNumber)
  const variation = getFirstDefined(kpi.variacion, kpi.change, kpi.tendencia)
  const history = Array.isArray(kpi.historico)
    ? kpi.historico
    : Array.isArray(kpi.history)
      ? kpi.history
      : []

  return {
    id: getFirstDefined(kpi.id, kpi.codigo, `kpi-${index}`),
    title: getFirstDefined(kpi.nombre, kpi.name, kpi.title, 'KPI sin nombre'),
    category,
    value: formatKpiValue(rawValue, unit),
    unit,
    status: statusMeta.status,
    statusLabel: statusMeta.label,
    change: formatVariation(variation),
    target: targetNumber !== null ? `Meta: ${formatKpiValue(targetNumber, unit)} ${unit}`.trim() : 'Meta no informada',
    completion: completionNumber !== null ? `${percentFormatter.format(completionNumber)}%` : 'Sin meta',
    progress: completionNumber ?? 0,
    rawValue: valueNumber,
    rawTarget: targetNumber,
    rawVariation: toNumber(variation),
    icon: getIconByCategory(category),
    history,
  }
}

export function normalizeKpisResponse(payload) {
  const rawKpis = Array.isArray(payload)
    ? payload
    : Array.isArray(payload?.kpis)
      ? payload.kpis
      : Array.isArray(payload?.indicadores)
        ? payload.indicadores
        : []

  return {
    kpis: rawKpis.map(normalizeKpi),
    fetchedAt: new Date().toLocaleString('es-CL', {
      dateStyle: 'short',
      timeStyle: 'short',
    }),
  }
}

export async function getKpis() {
  let response
  const controller = new AbortController()
  const timeoutId = window.setTimeout(() => controller.abort(), 8000)

  try {
    response = await fetch(`${API_BASE_URL}/api/dashboard/kpis`, {
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

  if (!response.ok) {
    throw new Error(`BFF Gateway respondió con estado HTTP ${response.status}`)
  }

  const payload = await response.json()
  return normalizeKpisResponse(payload)
}
