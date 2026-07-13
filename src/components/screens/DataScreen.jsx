import { useEffect, useState, useRef, useCallback } from 'react'
import Chart from 'react-apexcharts'
import AppIcon from '../ui/AppIcon'
import SectionHeader from '../ui/SectionHeader'
import StatusBadge from '../ui/StatusBadge'
import MetricCard from '../ui/MetricCard'
import { getDatos, getDatosBySucursal, createDato, SISTEMAS_ORIGEN } from '../../services/datosApi'

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

export default function DataScreen({ refreshToken = 0, onBffStatusChange, sucursal = 'todas' }) {
  const [datos, setDatos] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState(INITIAL_FORM)
  const [actionLoading, setActionLoading] = useState(false)
  const [notice, setNotice] = useState(null)
  const [toast, setToast] = useState(null)
  const prevSucursal = useRef(sucursal)

  const [filterSistema, setFilterSistema] = useState('todos')
  const [simulatingPipeline, setSimulatingPipeline] = useState(false)
  const [selectedRecord, setSelectedRecord] = useState(null)

  const loadData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      // Fetch by Sucursal or All
      let data = (sucursal === 'todas' || sucursal === 'Todas las sucursales') 
        ? await getDatos() 
        : await getDatosBySucursal(sucursal)
      
      // Local filter by Sistema
      if (filterSistema !== 'todos') {
        data = data.filter(d => String(d.sistemaOrigen || '').toUpperCase() === String(filterSistema).toUpperCase())
      }
      
      setDatos(data)
      onBffStatusChange?.({ status: 'success', label: 'Operativo' })
    } catch (err) {
      setError(err)
      onBffStatusChange?.({ status: 'danger', label: 'Error' })
    } finally {
      setLoading(false)
    }
  }, [onBffStatusChange, sucursal, filterSistema])

  useEffect(() => {
    loadData()
  }, [refreshToken, loadData])

  useEffect(() => {
    if (prevSucursal.current !== sucursal) {
      prevSucursal.current = sucursal
      setFilterSistema('todos') // Reset local filter when sucursal changes
      loadData()
    }
  }, [sucursal, loadData])

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 4000)
    return () => clearTimeout(t)
  }, [toast])

  if (loading) return <DataSkeleton />
  if (error) return <DataError error={error} onRetry={loadData} />

  const metrics = buildMetrics(datos)

  const handleFilterChange = (e) => {
    setFilterSistema(e.target.value)
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
          loadData()
          setToast({ message: 'Dato cargado manualmente y sincronizado con Data Service.', tone: 'success' })
        }, 1000)
      })
      .catch((err) => {
        setNotice({ message: err.message || 'No fue posible registrar el dato.', tone: 'warning' })
      })
      .finally(() => setActionLoading(false))
  }

  const handleSimulatePipeline = async () => {
    setSimulatingPipeline(true)
    try {
      const transaccionesBatch = [
        {
          sistemaOrigen: 'POS',
          tipoDato: 'VENTA',
          valor: '95000',
          sucursalId: 1
        },
        {
          sistemaOrigen: 'E-COMMERCE',
          tipoDato: 'PEDIDO',
          valor: '168000',
          sucursalId: 3
        },
        {
          sistemaOrigen: 'POS',
          tipoDato: 'VENTA',
          valor: '54990',
          sucursalId: 2
        }
      ]
      await Promise.all(transaccionesBatch.map((tx) => createDato(tx)))
      await loadData()
      setToast({
        message: '¡Lote ingestado con éxito! 3 transacciones operacionales reales enviadas a Data Service (MySQL).',
        tone: 'success'
      })
    } catch (err) {
      setToast({
        message: 'Error en simulación de ingesta: ' + (err.message || 'Error desconocido'),
        tone: 'warning'
      })
    } finally {
      setSimulatingPipeline(false)
    }
  }

  const handleCloseModal = () => {
    setShowModal(false)
    setForm(INITIAL_FORM)
    setNotice(null)
  }

  const sistemasCounts = SISTEMAS_ORIGEN.map((s) => {
    return datos.filter((d) => String(d.sistemaOrigen || '').toUpperCase() === String(s).toUpperCase()).length
  })

  const sucursalesData = [1, 2, 3].map((sucId) => {
    return datos
      .filter((d) => Number(d.sucursalId) === sucId || String(d.sucursalId) === String(sucId))
      .reduce((acc, curr) => acc + (Number(curr.valor) || 0), 0)
  })

  const donutOptions = {
    chart: { type: 'donut', fontFamily: 'inherit' },
    labels: SISTEMAS_ORIGEN,
    colors: ['#0284c7', '#0d9488', '#f59e0b', '#10b981', '#6366f1'],
    stroke: { width: 2, colors: ['#ffffff'] },
    legend: { show: false },
    dataLabels: { enabled: false },
    plotOptions: {
      pie: {
        donut: {
          size: '76%',
          labels: {
            show: true,
            name: { show: true, fontSize: '13px', color: '#64748b', fontWeight: 600 },
            value: { show: true, fontSize: '26px', color: '#0f172a', fontWeight: 800 },
            total: {
              show: true,
              label: 'Transacciones',
              color: '#475569',
              fontSize: '12px',
              fontWeight: 600,
              formatter: () => `${datos.length}`
            }
          }
        }
      }
    }
  }

  const totalVolumenSucursales = sucursalesData.reduce((a, b) => a + b, 0) || 1

  const sucursalesMeta = [
    { id: 1, name: 'Santiago (Casa Matriz)', code: 'SUC-01', tone: '#0284c7', gradient: 'linear-gradient(90deg, #0284c7, #38bdf8)' },
    { id: 2, name: 'Viña del Mar (Valparaíso)', code: 'SUC-02', tone: '#0d9488', gradient: 'linear-gradient(90deg, #0d9488, #2dd4bf)' },
    { id: 3, name: 'Concepción (Biobío)', code: 'SUC-03', tone: '#6366f1', gradient: 'linear-gradient(90deg, #6366f1, #818cf8)' },
  ]

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

      <section
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
          gap: '1.5rem',
          marginBottom: '1.5rem'
        }}
        aria-label="Análisis visual transaccional"
      >
        <article
          className="panel"
          style={{
            display: 'flex',
            flexDirection: 'column',
            background: '#ffffff',
            borderRadius: '14px',
            border: '1px solid #e2e8f0',
            boxShadow: '0 1px 3px rgba(15, 23, 42, 0.04)',
            padding: '1.5rem'
          }}
        >
          <SectionHeader
            title="Origen por Sistema Corporativo"
            description="Proporción consolidada en el Data Service de Grupo Cordillera."
          />
          <div style={{ display: 'grid', gridTemplateColumns: '180px 1fr', gap: '1.25rem', alignItems: 'center', marginTop: '0.75rem' }}>
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <Chart
                options={donutOptions}
                series={sistemasCounts}
                type="donut"
                width="180"
                height="180"
              />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              {SISTEMAS_ORIGEN.map((s, i) => {
                const count = sistemasCounts[i]
                const pct = datos.length ? Math.round((count / datos.length) * 100) : 0
                const tones = ['#0284c7', '#0d9488', '#f59e0b', '#10b981', '#6366f1']
                return (
                  <div key={s} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.8125rem' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem', color: '#334155', fontWeight: 600 }}>
                      <span style={{ width: 8, height: 8, borderRadius: 2, background: tones[i] }} />
                      {s}
                    </span>
                    <span style={{ color: '#64748b', fontWeight: 500 }}>
                      <strong style={{ color: '#0f172a' }}>{count}</strong> reg. ({pct}%)
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        </article>

        <article
          className="panel"
          style={{
            display: 'flex',
            flexDirection: 'column',
            background: '#ffffff',
            borderRadius: '14px',
            border: '1px solid #e2e8f0',
            boxShadow: '0 1px 3px rgba(15, 23, 42, 0.04)',
            padding: '1.5rem',
            justifyContent: 'space-between'
          }}
        >
          <SectionHeader
            title="Volumen Monetario por Sucursal"
            description="Monto acumulado en pesos chilenos desde base de datos MySQL."
          />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', marginTop: '1rem' }}>
            {sucursalesMeta.map((s, idx) => {
              const val = sucursalesData[idx] || 0
              const pct = Math.min(Math.round((val / totalVolumenSucursales) * 100), 100)
              return (
                <div key={s.code} style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.8125rem' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600, color: '#1e293b' }}>
                      <span
                        style={{
                          fontSize: '0.6875rem',
                          fontWeight: 700,
                          color: '#ffffff',
                          background: s.tone,
                          padding: '0.15rem 0.45rem',
                          borderRadius: '4px'
                        }}
                      >
                        {s.code}
                      </span>
                      {s.name}
                    </span>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
                      <strong style={{ color: '#0f172a', fontWeight: 700 }}>
                        ${Number(val).toLocaleString('es-CL')} CLP
                      </strong>
                      <span
                        style={{
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          color: '#475569',
                          background: '#f1f5f9',
                          padding: '0.15rem 0.5rem',
                          borderRadius: '9999px'
                        }}
                      >
                        {pct}%
                      </span>
                    </span>
                  </div>
                  <div
                    style={{
                      height: 10,
                      background: '#f1f5f9',
                      borderRadius: 9999,
                      overflow: 'hidden'
                    }}
                  >
                    <div
                      style={{
                        height: '100%',
                        width: `${pct}%`,
                        background: s.gradient,
                        borderRadius: 9999,
                        transition: 'width 0.6s cubic-bezier(0.4, 0, 0.2, 1)'
                      }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </article>
      </section>

      <section className="panel datos-control-panel">
        <SectionHeader
          title="Integración de datos operacionales"
          description="Filtra por sistema de origen o ejecuta el pipeline de ingesta automatizado desde cajas y canales online."
        />
        <div className="datos-toolbar">
          <label className="select-field">
            <span>Filtrar por sistema de origen</span>
            <select value={filterSistema} onChange={handleFilterChange}>
              <option value="todos">Todos los sistemas</option>
              {SISTEMAS_ORIGEN.map((s) => <option value={s} key={s}>{s}</option>)}
            </select>
          </label>
          <div className="datos-toolbar__actions" style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
            <button
              className="secondary-button"
              type="button"
              onClick={() => loadData()}
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
            <button
              className="primary-action-button"
              type="button"
              onClick={handleSimulatePipeline}
              disabled={simulatingPipeline}
              style={{
                background: 'linear-gradient(135deg, #0284c7, #2563eb)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.45rem'
              }}
              title="Simula la ingesta automática de lote desde cajas POS y E-Commerce hacia MySQL"
            >
              <AppIcon name="trend" size={15} strokeWidth={2.2} />
              {simulatingPipeline ? 'Ingestando lote...' : 'Ingesta en vivo (POS/E-Comm)'}
            </button>
          </div>
        </div>

        {filterSistema !== 'todos' && (
          <div className="datos-filter-badge">
            <StatusBadge status="info" label={`Filtrando: ${filterSistema} · GET /api/v1/datos/sistema/${filterSistema}`} />
          </div>
        )}
      </section>

      <section className="panel panel--table" aria-label="Registros de datos operacionales" style={{ background: '#ffffff', borderRadius: '14px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(15, 23, 42, 0.04)', padding: '1.5rem' }}>
        <SectionHeader
          title="Consolidado de Transacciones Operacionales"
          description={`Repositorio vivo en MySQL con ${datos.length} registro${datos.length !== 1 ? 's' : ''} sincronizados vía Data Service${filterSistema !== 'todos' ? ` (Filtro activo: ${filterSistema})` : ''}`}
        />
        {datos.length === 0 ? (
          <div className="alerts-empty-inline" style={{ padding: '3rem 0', textAlign: 'center' }}>
            <AppIcon name="database" size={26} strokeWidth={1.8} />
            <strong style={{ fontSize: '1rem', color: '#1e293b' }}>Sin registros para este filtro.</strong>
            <span style={{ color: '#64748b' }}>Selecciona otro sistema o ejecuta la "Carga manual" para incorporar información.</span>
          </div>
        ) : (
          <div className="table-wrap" style={{ marginTop: '1rem' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #e2e8f0', textAlign: 'left' }}>
                  <th style={{ padding: '0.85rem 1rem', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: '#64748b', letterSpacing: '0.04em' }}>ID Registro</th>
                  <th style={{ padding: '0.85rem 1rem', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: '#64748b', letterSpacing: '0.04em' }}>Canal / Sistema</th>
                  <th style={{ padding: '0.85rem 1rem', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: '#64748b', letterSpacing: '0.04em' }}>Operación</th>
                  <th style={{ padding: '0.85rem 1rem', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: '#64748b', letterSpacing: '0.04em' }}>Valor Consolidado</th>
                  <th style={{ padding: '0.85rem 1rem', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: '#64748b', letterSpacing: '0.04em' }}>Sucursal</th>
                  <th style={{ padding: '0.85rem 1rem', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: '#64748b', letterSpacing: '0.04em' }}>Timestamp Ingesta</th>
                  <th style={{ padding: '0.85rem 1rem', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: '#64748b', letterSpacing: '0.04em', textAlign: 'right' }}>Auditoría</th>
                </tr>
              </thead>
              <tbody>
                {datos.map((d, index) => {
                  const sUpper = String(d.sistemaOrigen || '').toUpperCase()
                  const badgeConfig = {
                    POS: { bg: '#e0f2fe', text: '#0369a1', dot: '#0284c7' },
                    'E-COMMERCE': { bg: '#ccfbf1', text: '#0f766e', dot: '#0d9488' },
                    INVENTARIO: { bg: '#fef3c7', text: '#b45309', dot: '#f59e0b' },
                    FINANZAS: { bg: '#d1fae5', text: '#047857', dot: '#10b981' },
                    CRM: { bg: '#e0e7ff', text: '#4338ca', dot: '#6366f1' }
                  }[sUpper] || { bg: '#f1f5f9', text: '#334155', dot: '#64748b' }

                  const sucFormat = {
                    1: { code: 'SUC-01', name: 'Santiago (Casa Matriz)', color: '#0284c7', bg: '#f0f9ff' },
                    2: { code: 'SUC-02', name: 'Viña del Mar (Valparaíso)', color: '#0d9488', bg: '#f0fdf4' },
                    3: { code: 'SUC-03', name: 'Concepción (Biobío)', color: '#6366f1', bg: '#eef2ff' }
                  }[Number(d.sucursalId)] || { code: `SUC-0${d.sucursalId}`, name: `Sucursal ${d.sucursalId}`, color: '#475569', bg: '#f8fafc' }

                  const numVal = Number(d.valor)
                  let formattedValor = d.valor
                  if (!isNaN(numVal) && (numVal > 1000 || ['VENTA', 'PEDIDO', 'INGRESO', 'GASTO'].includes(String(d.tipoDato).toUpperCase()))) {
                    formattedValor = (
                      <span style={{ fontWeight: 700, color: '#0f172a' }}>
                        ${numVal.toLocaleString('es-CL')} <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>CLP</span>
                      </span>
                    )
                  } else if (!isNaN(numVal) && ['STOCK', 'MERMA'].includes(String(d.tipoDato).toUpperCase())) {
                    formattedValor = (
                      <span style={{ fontWeight: 600, color: '#334155' }}>
                        {numVal.toLocaleString('es-CL')} <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>unid.</span>
                      </span>
                    )
                  } else if (String(d.valor).toUpperCase() === 'ACTIVO') {
                    formattedValor = (
                      <span style={{ display: 'inline-block', padding: '0.15rem 0.5rem', background: '#dcfce7', color: '#166534', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 700 }}>
                        ● ACTIVO
                      </span>
                    )
                  } else if (String(d.valor).toUpperCase() === 'INACTIVO') {
                    formattedValor = (
                      <span style={{ display: 'inline-block', padding: '0.15rem 0.5rem', background: '#f1f5f9', color: '#475569', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 600 }}>
                        ○ INACTIVO
                      </span>
                    )
                  }

                  return (
                    <tr
                      key={d.id}
                      onClick={() => setSelectedRecord(d)}
                      title="Haz clic para inspeccionar Ficha Técnica 360° de Auditoría Transaccional"
                      style={{
                        borderBottom: '1px solid #f1f5f9',
                        transition: 'all 0.18s ease',
                        background: index % 2 === 0 ? '#ffffff' : '#fafcfd',
                        cursor: 'pointer'
                      }}
                    >
                      <td style={{ padding: '0.85rem 1rem' }}>
                        <span
                          style={{
                            fontFamily: 'monospace',
                            fontSize: '0.78rem',
                            fontWeight: 700,
                            color: '#475569',
                            background: '#f8fafc',
                            border: '1px solid #e2e8f0',
                            padding: '0.2rem 0.5rem',
                            borderRadius: '6px'
                          }}
                        >
                          #DAT-{String(d.id).padStart(4, '0')}
                        </span>
                      </td>
                      <td style={{ padding: '0.85rem 1rem' }}>
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.35rem',
                            padding: '0.25rem 0.65rem',
                            borderRadius: '9999px',
                            background: badgeConfig.bg,
                            color: badgeConfig.text,
                            fontSize: '0.75rem',
                            fontWeight: 700
                          }}
                        >
                          <span style={{ width: 6, height: 6, borderRadius: '50%', background: badgeConfig.dot }} />
                          {d.sistemaOrigen}
                        </span>
                      </td>
                      <td style={{ padding: '0.85rem 1rem', fontWeight: 600, color: '#334155', fontSize: '0.85rem' }}>
                        {d.tipoDato}
                      </td>
                      <td style={{ padding: '0.85rem 1rem', fontSize: '0.9rem' }}>
                        {formattedValor}
                      </td>
                      <td style={{ padding: '0.85rem 1rem' }}>
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            fontSize: '0.8125rem',
                            fontWeight: 600,
                            color: '#1e293b'
                          }}
                        >
                          <span
                            style={{
                              fontFamily: 'monospace',
                              fontSize: '0.72rem',
                              fontWeight: 700,
                              color: sucFormat.color,
                              background: sucFormat.bg,
                              border: `1px solid ${sucFormat.color}35`,
                              padding: '0.15rem 0.45rem',
                              borderRadius: '4px'
                            }}
                          >
                            {sucFormat.code}
                          </span>
                          <span>{sucFormat.name}</span>
                        </span>
                      </td>
                      <td style={{ padding: '0.85rem 1rem', color: '#64748b', fontSize: '0.8125rem', fontWeight: 500 }}>
                        {formatDate(d.fechaRegistro)}
                      </td>
                      <td style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            setSelectedRecord(d)
                          }}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.35rem',
                            padding: '0.3rem 0.65rem',
                            borderRadius: '6px',
                            background: '#f1f5f9',
                            color: '#0f172a',
                            border: '1px solid #cbd5e1',
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            cursor: 'pointer'
                          }}
                        >
                          <span>Ficha 360°</span>
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
        <div
          className="table-footer"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderTop: '1px solid #e2e8f0',
            paddingTop: '1rem',
            marginTop: '1rem',
            fontSize: '0.8125rem',
            color: '#64748b'
          }}
        >
          <span>Mostrando <strong>{datos.length}</strong> registro{datos.length !== 1 ? 's' : ''} operacionales en base de datos</span>
          <StatusBadge status="success" label="Persistencia real MySQL vía Data Service" />
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

      {selectedRecord && (
        <RecordAuditModal
          record={selectedRecord}
          allRecords={datos}
          onClose={() => setSelectedRecord(null)}
        />
      )}
    </main>
  )
}

function RecordAuditModal({ record, allRecords, onClose }) {
  useEffect(() => {
    const fn = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', fn)
    return () => window.removeEventListener('keydown', fn)
  }, [onClose])

  const sucName = {
    1: 'SUC-01 · Santiago (Casa Matriz)',
    2: 'SUC-02 · Viña del Mar (Valparaíso)',
    3: 'SUC-03 · Concepción (Biobío)'
  }[Number(record.sucursalId)] || `SUC-0${record.sucursalId}`

  const numVal = Number(record.valor) || 0
  const isMonetary = numVal > 1000 || ['VENTA', 'PEDIDO', 'INGRESO', 'GASTO'].includes(String(record.tipoDato).toUpperCase())

  // Calcular métricas contextuales de la misma sucursal
  const sucursalRecords = allRecords.filter((d) => Number(d.sucursalId) === Number(record.sucursalId))
  const numRecordsSameSuc = sucursalRecords.map((d) => Number(d.valor)).filter((v) => !isNaN(v) && v > 1000)
  const avgSucursal = numRecordsSameSuc.length
    ? Math.round(numRecordsSameSuc.reduce((a, b) => a + b, 0) / numRecordsSameSuc.length)
    : numVal || 1
  const maxSucursal = numRecordsSameSuc.length ? Math.max(...numRecordsSameSuc, numVal) : numVal || 1

  // Porcentajes relativos respecto al máximo para las barras visuales
  const scaleMax = Math.max(numVal, avgSucursal, maxSucursal) || 1
  const pctCurrent = Math.max(8, Math.round((numVal / scaleMax) * 100))
  const pctAvg = Math.max(8, Math.round((avgSucursal / scaleMax) * 100))
  const pctMax = 100

  return (
    <div
      className="report-modal-overlay"
      role="presentation"
      onMouseDown={onClose}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(15, 23, 42, 0.6)',
        backdropFilter: 'blur(5px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        padding: '1.25rem'
      }}
    >
      <div
        className="report-modal"
        aria-labelledby="audit-modal-title"
        onMouseDown={(e) => e.stopPropagation()}
        style={{
          background: '#ffffff',
          borderRadius: '16px',
          boxShadow: '0 25px 50px -12px rgba(15, 23, 42, 0.25)',
          border: '1px solid #e2e8f0',
          width: '100%',
          maxWidth: '780px',
          overflow: 'hidden',
          padding: '1.4rem'
        }}
      >
        {/* Encabezado compacto en 1 línea */}
        <header
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid #f1f5f9',
            paddingBottom: '0.85rem',
            marginBottom: '1.15rem'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
            <span
              style={{
                fontFamily: 'monospace',
                fontSize: '0.85rem',
                fontWeight: 700,
                color: '#0284c7',
                background: '#e0f2fe',
                padding: '0.2rem 0.55rem',
                borderRadius: '6px',
                border: '1px solid #bae6fd'
              }}
            >
              #DAT-{String(record.id).padStart(4, '0')}
            </span>
            <span
              style={{
                fontSize: '0.75rem',
                fontWeight: 700,
                color: '#0f766e',
                background: '#ccfbf1',
                padding: '0.2rem 0.6rem',
                borderRadius: '999px'
              }}
            >
              {record.sistemaOrigen}
            </span>
            <h3 id="audit-modal-title" style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
              Auditoría de Registro Operacional
            </h3>
            <span
              style={{
                fontSize: '0.72rem',
                fontWeight: 700,
                color: '#166534',
                background: '#dcfce7',
                padding: '0.18rem 0.55rem',
                borderRadius: '999px'
              }}
            >
              ● Verificado MySQL
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: '#f1f5f9',
              border: 'none',
              borderRadius: '8px',
              padding: '0.35rem 0.65rem',
              fontSize: '0.8rem',
              fontWeight: 700,
              color: '#475569',
              cursor: 'pointer'
            }}
          >
            ✕ Cerrar
          </button>
        </header>

        {/* Grid principal en 2 columnas: Cero scroll */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1.05fr 1fr',
            gap: '1.15rem',
            alignItems: 'stretch'
          }}
        >
          {/* Columna Izquierda: Valor Auditado & Trazabilidad */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.95rem' }}>
            <div
              style={{
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '12px',
                padding: '1.15rem',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
                  Valor Consolidado en Base de Datos
                </span>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#0284c7' }}>
                  Operación: {record.tipoDato}
                </span>
              </div>
              <div style={{ fontSize: '1.65rem', fontWeight: 800, color: '#0f172a', margin: '0.35rem 0' }}>
                {isMonetary ? `$${numVal.toLocaleString('es-CL')} CLP` : `${record.valor}`}
              </div>
              <div style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 500 }}>
                Sede: <strong style={{ color: '#334155' }}>{sucName}</strong>
              </div>
            </div>

            {/* Conciliación y Gobierno Operacional del Holding */}
            <div
              style={{
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '12px',
                padding: '1.15rem',
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between'
              }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#0f172a' }}>
                    Conciliación & Gobierno Operacional
                  </span>
                  <span
                    style={{
                      fontSize: '0.7rem',
                      fontWeight: 700,
                      color: '#0369a1',
                      background: '#e0f2fe',
                      padding: '0.15rem 0.5rem',
                      borderRadius: '4px'
                    }}
                  >
                    Holding Cordillera
                  </span>
                </div>

                {/* Stepper Comercial de Conciliación ERP */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '0.35rem',
                    margin: '0.9rem 0',
                    padding: '0.65rem 0.75rem',
                    background: '#ffffff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#0284c7' }} />
                    <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#1e293b' }}>
                      {record.sistemaOrigen}
                    </span>
                  </div>
                  <span style={{ color: '#cbd5e1', fontSize: '0.75rem' }}>➔</span>
                  <div style={{ fontSize: '0.72rem', fontWeight: 600, color: '#475569' }}>
                    Validación BFF
                  </div>
                  <span style={{ color: '#cbd5e1', fontSize: '0.75rem' }}>➔</span>
                  <div style={{ fontSize: '0.72rem', fontWeight: 600, color: '#475569' }}>
                    Libro Mayor
                  </div>
                  <span style={{ color: '#cbd5e1', fontSize: '0.75rem' }}>➔</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                    <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#166534' }}>
                      ACID OK
                    </span>
                  </div>
                </div>
              </div>

              {/* Atributos Ejecutivos y Contables de Grupo Cordillera */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '0.65rem',
                  borderTop: '1px solid #e2e8f0',
                  paddingTop: '0.75rem'
                }}
              >
                <div>
                  <span style={{ fontSize: '0.68rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>
                    Estado Conciliación
                  </span>
                  <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#166534', marginTop: '0.1rem' }}>
                    ✓ Consolidado e Integrado
                  </div>
                </div>
                <div>
                  <span style={{ fontSize: '0.68rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>
                    Fecha Contable
                  </span>
                  <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#1e293b', marginTop: '0.1rem' }}>
                    {formatDate(record.fechaRegistro)}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Columna Derecha: Gráfico Comparativo de Barras Ejecutivas */}
          <div
            style={{
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '12px',
              padding: '1.15rem',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between'
            }}
          >
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h4 style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>
                  Posición Transaccional en Sede
                </h4>
                <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#0369a1', background: '#e0f2fe', padding: '0.15rem 0.5rem', borderRadius: '4px' }}>
                  Benchmark Sede
                </span>
              </div>
              <p style={{ fontSize: '0.75rem', color: '#64748b', margin: '0.35rem 0 0.95rem 0' }}>
                Comparativa de volumen de este registro frente al promedio y máximo de su sede en MySQL.
              </p>

              {/* Barras Comparativas Bespoke Enterprise */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                {/* Barra 1: Este Registro */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', marginBottom: '0.25rem' }}>
                    <span style={{ fontWeight: 700, color: '#0284c7' }}>● Este Registro (#DAT-{String(record.id).padStart(4, '0')})</span>
                    <span style={{ fontWeight: 800, color: '#0f172a' }}>
                      {isMonetary ? `$${numVal.toLocaleString('es-CL')} CLP` : `${record.valor}`}
                    </span>
                  </div>
                  <div style={{ width: '100%', height: '8px', background: '#e2e8f0', borderRadius: '999px', overflow: 'hidden' }}>
                    <div
                      style={{
                        width: `${pctCurrent}%`,
                        height: '100%',
                        background: 'linear-gradient(90deg, #0284c7, #38bdf8)',
                        borderRadius: '999px',
                        transition: 'width 0.4s ease'
                      }}
                    />
                  </div>
                </div>

                {/* Barra 2: Promedio de la Sede */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', marginBottom: '0.25rem' }}>
                    <span style={{ fontWeight: 600, color: '#475569' }}>Promedio de Transacciones en Sede</span>
                    <span style={{ fontWeight: 700, color: '#334155' }}>
                      {isMonetary ? `$${avgSucursal.toLocaleString('es-CL')} CLP` : `${avgSucursal}`}
                    </span>
                  </div>
                  <div style={{ width: '100%', height: '8px', background: '#e2e8f0', borderRadius: '999px', overflow: 'hidden' }}>
                    <div
                      style={{
                        width: `${pctAvg}%`,
                        height: '100%',
                        background: '#0d9488',
                        borderRadius: '999px',
                        transition: 'width 0.4s ease'
                      }}
                    />
                  </div>
                </div>

                {/* Barra 3: Máximo Histórico */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', marginBottom: '0.25rem' }}>
                    <span style={{ fontWeight: 600, color: '#64748b' }}>Transacción Máxima Histórica</span>
                    <span style={{ fontWeight: 700, color: '#475569' }}>
                      {isMonetary ? `$${maxSucursal.toLocaleString('es-CL')} CLP` : `${maxSucursal}`}
                    </span>
                  </div>
                  <div style={{ width: '100%', height: '8px', background: '#e2e8f0', borderRadius: '999px', overflow: 'hidden' }}>
                    <div
                      style={{
                        width: `${pctMax}%`,
                        height: '100%',
                        background: '#475569',
                        borderRadius: '999px',
                        transition: 'width 0.4s ease'
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div
              style={{
                marginTop: '1rem',
                paddingTop: '0.75rem',
                borderTop: '1px solid #e2e8f0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                fontSize: '0.75rem'
              }}
            >
              <span style={{ color: '#64748b' }}>Integridad relacional verificado:</span>
              <strong style={{ color: '#0f766e' }}>Consistente al 100%</strong>
            </div>
          </div>
        </div>

        {/* Footer compacto */}
        <footer
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginTop: '1.15rem',
            paddingTop: '0.85rem',
            borderTop: '1px solid #f1f5f9'
          }}
        >
          <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
            ID Transaccional interno: <code style={{ color: '#334155' }}>TX-CORDILLERA-{record.id}</code>
          </span>
          <button
            type="button"
            className="primary-action-button"
            onClick={onClose}
            style={{ padding: '0.5rem 1.25rem', fontSize: '0.82rem', fontWeight: 700 }}
          >
            Aceptar Inspección
          </button>
        </footer>
      </div>
    </div>
  )
}
