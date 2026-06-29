import { useEffect, useState } from 'react'
import AppIcon from '../ui/AppIcon'
import SectionHeader from '../ui/SectionHeader'
import StatusBadge from '../ui/StatusBadge'
import MetricCard from '../ui/MetricCard'
import { getDatos, getDatosBySistema, createDato, SISTEMAS_ORIGEN } from '../../services/datosApi'

const INITIAL_FORM = {
  sistemaOrigen: 'POS',
  tipoDato: '',
  valor: '',
  sucursalId: '1',
}

const dateFormatter = new Intl.DateTimeFormat('es-CL', { dateStyle: 'short', timeStyle: 'short' })

function formatDate(value) {
  if (!value) return '—'
  const d = new Date(value)
  return Number.isNaN(d.getTime()) ? String(value) : dateFormatter.format(d)
}

function DataSkeleton() {
  return (
    <main className="screen screen--datos">
      <section className="metric-grid metric-grid--four" aria-label="Cargando métricas">
        {[0, 1, 2, 3].map((i) => <article className="metric-card dashboard-skeleton" key={i} />)}
      </section>
      <section className="panel dashboard-skeleton dashboard-skeleton--large" style={{ minHeight: 180 }} />
      <section className="panel dashboard-skeleton dashboard-skeleton--large" style={{ minHeight: 320 }} />
    </main>
  )
}

function DataError({ error, onRetry }) {
  return (
    <main className="screen screen--datos">
      <section className="integration-error-state" aria-live="polite">
        <span className="icon-box icon-box--warning">
          <AppIcon name="warning" size={24} strokeWidth={2.1} />
        </span>
        <div>
          <span className="integration-status-badge integration-status-badge--danger">Sin conexión</span>
          <h2>No fue posible cargar los datos operacionales</h2>
          <p>Verifica que el BFF Gateway y el Data Service estén disponibles.</p>
          <small>Endpoint: GET /api/v1/datos</small>
          {error?.message && (
            <details><summary>Detalle técnico</summary><span>{error.message}</span></details>
          )}
        </div>
        <button type="button" onClick={onRetry}>
          <AppIcon name="refresh" size={17} strokeWidth={2.1} />
          Reintentar
        </button>
      </section>
    </main>
  )
}

function buildMetrics(datos) {
  const sistemas = new Set(datos.map((d) => d.sistemaOrigen))
  const sucursales = new Set(datos.map((d) => d.sucursalId))
  return [
    { title: 'Registros totales', value: String(datos.length), detail: 'Datos en Data Service', icon: 'database', tone: 'success' },
    { title: 'Sistemas de origen', value: String(sistemas.size), detail: 'Fuentes integradas', icon: 'layers' },
    { title: 'Sucursales', value: String(sucursales.size), detail: 'Con registros activos', icon: 'store' },
    { title: 'Último registro', value: datos.length ? formatDate(datos[datos.length - 1].fechaRegistro) : '—', detail: 'Fecha más reciente', icon: 'clock', tone: 'info' },
  ]
}

function ManualLoadModal({ form, loading, notice, onChange, onClose, onSubmit }) {
  useEffect(() => {
    const fn = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', fn)
    return () => window.removeEventListener('keydown', fn)
  }, [onClose])

  return (
    <div className="report-modal-overlay" role="presentation" onMouseDown={onClose}>
      <form
        className="report-modal report-generate-modal"
        aria-labelledby="datos-modal-title"
        onMouseDown={(e) => e.stopPropagation()}
        onSubmit={onSubmit}
      >
        <div className="report-modal__header">
          <div>
            <StatusBadge status="success" label="Data Service · POST /api/v1/datos" />
            <h2 id="datos-modal-title">Carga manual de dato operacional</h2>
            <p>Registra una nueva entrada desde cualquier sistema de origen de Grupo Cordillera.</p>
          </div>
          <button className="icon-button" type="button" onClick={onClose} aria-label="Cerrar" title="Cerrar">
            <AppIcon name="more" size={16} strokeWidth={2} />
          </button>
        </div>

        {notice && (
          <div
            role="alert"
            style={{
              display: 'flex', alignItems: 'center', gap: '0.5rem',
              padding: '0.75rem 1rem', borderRadius: '8px', marginBottom: '1rem',
              background: notice.tone === 'success' ? '#dff7ef' : '#fff7ed',
              color: notice.tone === 'success' ? '#059669' : '#d97706',
              fontSize: '0.875rem', fontWeight: 500,
            }}
          >
            <AppIcon name={notice.tone === 'success' ? 'checkCircle' : 'warning'} size={16} strokeWidth={2} />
            <span>{notice.message}</span>
          </div>
        )}

        <div className="report-form-grid">
          <label className="report-form-field">
            <span>Sistema de origen</span>
            <select name="sistemaOrigen" value={form.sistemaOrigen} onChange={onChange} required>
              {SISTEMAS_ORIGEN.map((s) => <option value={s} key={s}>{s}</option>)}
            </select>
          </label>
          <label className="report-form-field">
            <span>ID Sucursal</span>
            <input
              name="sucursalId" type="number" min="1" value={form.sucursalId}
              onChange={onChange} required placeholder="Ej: 1"
            />
          </label>
          <label className="report-form-field">
            <span>Tipo de dato</span>
            <input
              name="tipoDato" type="text" value={form.tipoDato}
              onChange={onChange} required placeholder="Ej: Ventas, Inventario"
            />
          </label>
          <label className="report-form-field">
            <span>Valor</span>
            <input
              name="valor" type="text" value={form.valor}
              onChange={onChange} required placeholder="Ej: 450000"
            />
          </label>
        </div>

        <div className="report-modal__actions">
          <button className="secondary-button" type="button" onClick={onClose}>Cancelar</button>
          <button className="primary-action-button" type="submit" disabled={loading}>
            <AppIcon name="export" size={16} strokeWidth={2} />
            {loading ? 'Registrando...' : 'Registrar dato'}
          </button>
        </div>
      </form>
    </div>
  )
}

export default function DataScreen() {
  const [datos, setDatos] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [filterSistema, setFilterSistema] = useState('todos')
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState(INITIAL_FORM)
  const [actionLoading, setActionLoading] = useState(false)
  const [notice, setNotice] = useState(null)
  const [toast, setToast] = useState(null)

  function loadDatos(sistema) {
    setLoading(true)
    setError(null)
    const fetch = sistema === 'todos' ? getDatos() : getDatosBySistema(sistema)
    fetch
      .then(setDatos)
      .catch(setError)
      .finally(() => setLoading(false))
  }

  useEffect(() => { loadDatos('todos') }, [])

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 4000)
    return () => clearTimeout(t)
  }, [toast])

  if (loading) return <DataSkeleton />
  if (error) return <DataError error={error} onRetry={() => loadDatos(filterSistema)} />

  const metrics = buildMetrics(datos)

  const handleFilterChange = (e) => {
    const value = e.target.value
    setFilterSistema(value)
    loadDatos(value)
  }

  const handleFormChange = (e) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    setActionLoading(true)
    setNotice(null)

    const payload = {
      sistemaOrigen: form.sistemaOrigen,
      tipoDato: form.tipoDato.trim(),
      valor: form.valor.trim(),
      sucursalId: Number(form.sucursalId),
    }

    createDato(payload)
      .then(() => {
        setNotice({ message: 'Dato registrado correctamente en Data Service.', tone: 'success' })
        setTimeout(() => {
          setShowModal(false)
          setForm(INITIAL_FORM)
          setNotice(null)
          loadDatos(filterSistema)
          setToast({ message: 'Dato cargado manualmente y sincronizado con Data Service.', tone: 'success' })
        }, 1000)
      })
      .catch((err) => {
        setNotice({ message: err.message || 'No fue posible registrar el dato.', tone: 'warning' })
      })
      .finally(() => setActionLoading(false))
  }

  const handleCloseModal = () => {
    setShowModal(false)
    setForm(INITIAL_FORM)
    setNotice(null)
  }

  return (
    <main className="screen screen--datos">

      {toast && (
        <div className="cb-toast cb-toast--success" role="status">
          <AppIcon name="checkCircle" size={17} strokeWidth={2} />
          <span>{toast.message}</span>
          <button type="button" className="cb-toast__close" onClick={() => setToast(null)} aria-label="Cerrar">
            <AppIcon name="more" size={14} strokeWidth={2} />
          </button>
        </div>
      )}

      <section className="metric-grid metric-grid--four" aria-label="Resumen de datos operacionales">
        {metrics.map((m) => <MetricCard key={m.title} {...m} />)}
      </section>

      <section className="panel datos-control-panel">
        <SectionHeader
          title="Integración de datos operacionales"
          description="Filtra por sistema de origen o registra una nueva entrada manual en Data Service."
        />
        <div className="datos-toolbar">
          <label className="select-field">
            <span>Filtrar por sistema de origen</span>
            <select value={filterSistema} onChange={handleFilterChange}>
              <option value="todos">Todos los sistemas</option>
              {SISTEMAS_ORIGEN.map((s) => <option value={s} key={s}>{s}</option>)}
            </select>
          </label>
          <div className="datos-toolbar__actions">
            <button
              className="secondary-button"
              type="button"
              onClick={() => loadDatos(filterSistema)}
              aria-label="Forzar sincronización"
            >
              <AppIcon name="refresh" size={15} strokeWidth={2} />
              Forzar sincronización
            </button>
            <button
              className="primary-action-button"
              type="button"
              onClick={() => setShowModal(true)}
            >
              <AppIcon name="export" size={15} strokeWidth={2} />
              Carga manual
            </button>
          </div>
        </div>

        {filterSistema !== 'todos' && (
          <div className="datos-filter-badge">
            <StatusBadge status="info" label={`Filtrando: ${filterSistema} · GET /api/v1/datos/sistema/${filterSistema}`} />
          </div>
        )}
      </section>

      <section className="panel panel--table" aria-label="Registros de datos operacionales">
        <SectionHeader
          title="Registros operacionales"
          description={`${datos.length} registro${datos.length !== 1 ? 's' : ''} en Data Service${filterSistema !== 'todos' ? ` — sistema: ${filterSistema}` : ''}`}
        />
        {datos.length === 0 ? (
          <div className="alerts-empty-inline" style={{ padding: '2rem 0' }}>
            <AppIcon name="database" size={22} strokeWidth={2} />
            <strong>Sin registros para este filtro.</strong>
            <span>Usa "Carga manual" para agregar el primer registro.</span>
          </div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Sistema origen</th>
                  <th>Tipo de dato</th>
                  <th>Valor</th>
                  <th>Sucursal ID</th>
                  <th>Fecha registro</th>
                </tr>
              </thead>
              <tbody>
                {datos.map((d) => (
                  <tr key={d.id}>
                    <td style={{ fontFamily: 'monospace', fontSize: '0.8rem', color: '#64748b' }}>{d.id}</td>
                    <td>
                      <span className="datos-origen-badge">{d.sistemaOrigen}</span>
                    </td>
                    <td>{d.tipoDato}</td>
                    <td>{d.valor}</td>
                    <td style={{ textAlign: 'center' }}>{d.sucursalId}</td>
                    <td style={{ color: '#64748b', fontSize: '0.85rem' }}>{formatDate(d.fechaRegistro)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <div className="table-footer">
          <span>Mostrando {datos.length} registro{datos.length !== 1 ? 's' : ''}</span>
          <StatusBadge status="success" label="Fuente: Data Service via BFF" />
        </div>
      </section>

      {showModal && (
        <ManualLoadModal
          form={form}
          loading={actionLoading}
          notice={notice}
          onChange={handleFormChange}
          onClose={handleCloseModal}
          onSubmit={handleSubmit}
        />
      )}
    </main>
  )
}
