/**
 * DashboardContext — Patrón Observer implementado con React Context API + useReducer.
 *
 * Patrón: Observer
 *   - Subject (Publisher): DashboardProvider mantiene el estado centralizado y despacha
 *     cambios a todos los suscriptores mediante dispatch.
 *   - Observers (Subscribers): cualquier componente que llame a useDashboardContext()
 *     se re-renderiza automáticamente cuando el estado relevante cambia, sin acoplamiento
 *     directo entre componentes.
 *
 * Ventaja arquitectónica: los componentes hijos no hacen fetch individual; todos consumen
 * el estado desde el contexto y "observan" actualizaciones de manera reactiva.
 */
import { createContext, useCallback, useContext, useReducer } from 'react'
import { getDashboardStats } from '../services/dashboardApi'
import { getKpis } from '../services/kpisApi'
import { getReportes } from '../services/reportsApi'
import { getAlertas } from '../services/alertsApi'

// ─── Tipos de acción ─────────────────────────────────────────────────────────

const DASHBOARD_FETCH_START   = 'DASHBOARD_FETCH_START'
const DASHBOARD_FETCH_SUCCESS = 'DASHBOARD_FETCH_SUCCESS'
const DASHBOARD_FETCH_ERROR   = 'DASHBOARD_FETCH_ERROR'

const KPIS_FETCH_START   = 'KPIS_FETCH_START'
const KPIS_FETCH_SUCCESS = 'KPIS_FETCH_SUCCESS'
const KPIS_FETCH_ERROR   = 'KPIS_FETCH_ERROR'

const REPORTES_FETCH_START   = 'REPORTES_FETCH_START'
const REPORTES_FETCH_SUCCESS = 'REPORTES_FETCH_SUCCESS'
const REPORTES_FETCH_ERROR   = 'REPORTES_FETCH_ERROR'

const ALERTAS_FETCH_START   = 'ALERTAS_FETCH_START'
const ALERTAS_FETCH_SUCCESS = 'ALERTAS_FETCH_SUCCESS'
const ALERTAS_FETCH_ERROR   = 'ALERTAS_FETCH_ERROR'

// ─── Estado inicial ───────────────────────────────────────────────────────────

const initialState = {
  dashboard: { data: null, loading: false, error: null },
  kpis:      { data: null, loading: false, error: null },
  reportes:  { data: null, loading: false, error: null },
  alertas:   { data: null, loading: false, error: null },
}

// ─── Reducer (función pura — sin efectos secundarios) ─────────────────────────

function dashboardReducer(state, action) {
  switch (action.type) {
    case DASHBOARD_FETCH_START:
      return { ...state, dashboard: { data: state.dashboard.data, loading: true, error: null } }
    case DASHBOARD_FETCH_SUCCESS:
      return { ...state, dashboard: { data: action.payload, loading: false, error: null } }
    case DASHBOARD_FETCH_ERROR:
      return { ...state, dashboard: { data: null, loading: false, error: action.payload } }

    case KPIS_FETCH_START:
      return { ...state, kpis: { data: state.kpis.data, loading: true, error: null } }
    case KPIS_FETCH_SUCCESS:
      return { ...state, kpis: { data: action.payload, loading: false, error: null } }
    case KPIS_FETCH_ERROR:
      return { ...state, kpis: { data: null, loading: false, error: action.payload } }

    case REPORTES_FETCH_START:
      return { ...state, reportes: { data: state.reportes.data, loading: true, error: null } }
    case REPORTES_FETCH_SUCCESS:
      return { ...state, reportes: { data: action.payload, loading: false, error: null } }
    case REPORTES_FETCH_ERROR:
      return { ...state, reportes: { data: null, loading: false, error: action.payload } }

    case ALERTAS_FETCH_START:
      return { ...state, alertas: { data: state.alertas.data, loading: true, error: null } }
    case ALERTAS_FETCH_SUCCESS:
      return { ...state, alertas: { data: action.payload, loading: false, error: null } }
    case ALERTAS_FETCH_ERROR:
      return { ...state, alertas: { data: null, loading: false, error: action.payload } }

    default:
      return state
  }
}

// ─── Contexto ─────────────────────────────────────────────────────────────────

const DashboardContext = createContext(null)

/**
 * DashboardProvider — Subject del patrón Observer.
 * Envuelve la aplicación y provee estado + acciones a todos los Observers.
 */
export function DashboardProvider({ children }) {
  const [state, dispatch] = useReducer(dashboardReducer, initialState)

  /** Notifica a todos los Observers que el dashboard se está actualizando. */
  const fetchDashboard = useCallback(async () => {
    dispatch({ type: DASHBOARD_FETCH_START })
    try {
      const data = await getDashboardStats()
      dispatch({ type: DASHBOARD_FETCH_SUCCESS, payload: data })
    } catch (error) {
      dispatch({ type: DASHBOARD_FETCH_ERROR, payload: error })
    }
  }, [])

  /** Notifica a todos los Observers que los KPIs se están actualizando. */
  const fetchKpis = useCallback(async () => {
    dispatch({ type: KPIS_FETCH_START })
    try {
      const data = await getKpis()
      dispatch({ type: KPIS_FETCH_SUCCESS, payload: data })
    } catch (error) {
      dispatch({ type: KPIS_FETCH_ERROR, payload: error })
    }
  }, [])

  /** Notifica a todos los Observers que los reportes se están actualizando. */
  const fetchReportes = useCallback(async () => {
    dispatch({ type: REPORTES_FETCH_START })
    try {
      const data = await getReportes()
      dispatch({ type: REPORTES_FETCH_SUCCESS, payload: data })
    } catch (error) {
      dispatch({ type: REPORTES_FETCH_ERROR, payload: error })
    }
  }, [])

  /** Notifica a todos los Observers que las alertas se están actualizando. */
  const fetchAlertas = useCallback(async () => {
    dispatch({ type: ALERTAS_FETCH_START })
    try {
      const data = await getAlertas()
      dispatch({ type: ALERTAS_FETCH_SUCCESS, payload: data })
    } catch (error) {
      dispatch({ type: ALERTAS_FETCH_ERROR, payload: error })
    }
  }, [])

  const value = {
    // Estado (leído por los Observers)
    dashboard: state.dashboard,
    kpis:      state.kpis,
    reportes:  state.reportes,
    alertas:   state.alertas,
    // Acciones para disparar actualizaciones
    fetchDashboard,
    fetchKpis,
    fetchReportes,
    fetchAlertas,
  }

  return (
    <DashboardContext.Provider value={value}>
      {children}
    </DashboardContext.Provider>
  )
}

/**
 * useDashboardContext — Hook para que los Observers se suscriban al contexto.
 * Cualquier componente que lo use se re-renderiza automáticamente ante cambios
 * de estado, sin acoplamiento directo con los demás componentes.
 *
 * @returns {{ dashboard, kpis, reportes, alertas, fetchDashboard, fetchKpis, fetchReportes, fetchAlertas }}
 */
export function useDashboardContext() {
  const context = useContext(DashboardContext)
  if (context === null) {
    throw new Error('useDashboardContext debe usarse dentro de <DashboardProvider>')
  }
  return context
}

export default DashboardContext
