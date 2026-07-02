import { useEffect, useState } from 'react'
import AppIcon from '../ui/AppIcon'
import KpiCard from '../dashboard/KpiCard'
import MetricCard from '../ui/MetricCard'
import SectionHeader from '../ui/SectionHeader'
import StatusBadge from '../ui/StatusBadge'
import { useDashboardContext } from '../../context/DashboardContext'
import { createKpi, deleteKpi } from '../../services/kpisApi'

const KPI_CATEGORIAS = ['Ventas', 'Inventario', 'Logistica', 'Rentabilidad']
const KPI_ESTADOS = ['Activo', 'Advertencia', 'Crítico', 'En objetivo']

// Mapeo de categoría → unidad por defecto
const UNIT_BY_CATEGORY = {
  'Ventas': 'CLP',
  'Inventario': 'unidades',
  'Logistica': 'unidades',
  'Rentabilidad': '%',
}

// Mapeo de categoría/unidad → placeholder de ejemplo
const VALUE_PLACEHOLDER_BY_CATEGORY = {
  'Ventas_CLP': 'Ej: 1.500.000',
  'Inventario_unidades': 'Ej: 250',
  'Logistica_unidades': 'Ej: 95.5',
  'Rentabilidad_%': 'Ej: 18.5',
}

const INITIAL_KPI_FORM = {
  nombre: '',
  valor: '',
  unidad: 'CLP',  // Unidad inicial basada en categoría Ventas
  categoria: 'Ventas',
  estado: 'Activo',
}

// Función helper para obtener el placeholder de valor
function getValuePlaceholder(categoria, unidad) {
  const key = `${categoria}_${unidad}`
  return VALUE_PLACEHOLDER_BY_CATEGORY[key] || 'Ej: 100'
}

// Parsea números en formato chileno (1.500.000 o 1500000 o 1.500.000,50)
function parseChileanNumber(value) {
  if (!value) return '';

  const str = String(value).trim();

  // Si contiene coma, es el separador decimal - convertir a punto
  if (str.includes(',')) {
    return str.replace(/\./g, '').replace(',', '.');
  }

  // Si contiene puntos, podrían ser separadores de miles
  // Mantener solo el último punto si lo hay (después del 3er dígito desde atrás)
  const parts = str.split('.');
  if (parts.length > 1) {
    // Si el último grupo tiene 1-3 dígitos, es probablemente decimal
    const lastPart = parts[parts.length - 1];
    if (lastPart.length <= 3 && lastPart.length > 0) {
      return parts.slice(0, -1).join('') + '.' + lastPart;
    }
    // Si no, todos son separadores de miles
    return parts.join('');
  }

  return str;
}

function KpisSkeleton() {
  return (
    <main className="screen screen--kpis">
      <section className="metric-grid metric-grid--four" aria-label="Cargando resumen de KPIs">
        {Array.from({ length: 4 }).map((_, index) => (
          <article className="metric-card dashboard-skeleton" key={index} />
        ))}
      </section>
      <section className="kpi-grid" aria-label="Cargando KPIs principales">
        {Array.from({ length: 3 }).map((_, index) => (
          <article className="kpi-card dashboard-skeleton dashboard-skeleton--large" key={index} />
        ))}
      </section>
      <section className="content-grid content-grid--table">
        <article className="panel dashboard-skeleton dashboard-skeleton--large" />
        <article className="panel dashboard-skeleton dashboard-skeleton--large" />
      </section>
    </main>
  )
}

function KpisError({ error, onRetry }) {
  return (
    <main className="screen screen--kpis">
      <section className="integration-error-state" aria-live="polite">
        <span className="icon-box icon-box--warning">
          <AppIcon name="warning" size={24} strokeWidth={2.1} />
        </span>
        <div>
          <span className="integration-status-badge integration-status-badge--danger">Endpoint pendiente</span>
          <h2>KPIs estratégicos pendientes de conexión</h2>
          <p>El frontend está operativo, pero aún no recibe indicadores desde el BFF Gateway.</p>
          <small>Endpoint esperado: GET /api/v1/kpis</small>
          {error?.message && (
            <details>
              <summary>Detalle técnico</summary>
              <span>{error.message}</span>
            </details>
          )}
        </div>
        <button type="button" onClick={onRetry} aria-label="Reintentar carga de KPIs desde BFF Gateway">
          <AppIcon name="refresh" size={17} strokeWidth={2.1} />
          Reintentar
        </button>
      </section>
    </main>
  )
}

function EmptyKpis({ onRetry, onCreateKpi }) {
  return (
    <main className="screen screen--kpis">
      <section className="integration-empty-state">
        <span className="icon-box icon-box--info">
          <AppIcon name="kpis" size={24} strokeWidth={2.1} />
        </span>
        <div>
          <h2>No hay KPIs registrados desde el backend.</h2>
          <p>Cuando el KPI Service entregue indicadores, se visualizarán en este panel.</p>
          <small>Fuente esperada: BFF Gateway · GET /api/v1/kpis</small>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button type="button" onClick={onRetry}>
            <AppIcon name="refresh" size={17} strokeWidth={2.1} />
            Actualizar
          </button>
          <button type="button" className="primary-action-button" onClick={onCreateKpi}>
            <AppIcon name="kpis" size={17} strokeWidth={2.1} />
            Crear KPI
          </button>
        </div>
      </section>
    </main>
  )
}

function getSummaryMetrics(kpis) {
  const activeCount = kpis.filter((kpi) => kpi.status === 'success').length
  const alertCount = kpis.filter((kpi) => kpi.status === 'warning' || kpi.status === 'danger').length
  const completionValues = kpis
    .map((kpi) => Number(kpi.progress))
    .filter((value) => Number.isFinite(value) && value > 0)
  const variationValues = kpis
    .map((kpi) => kpi.rawVariation)
    .filter((value) => Number.isFinite(value))
  const averageCompletion = completionValues.length
    ? Math.round(completionValues.reduce((sum, value) => sum + value, 0) / completionValues.length)
    : null
  const averageVariation = variationValues.length
    ? variationValues.reduce((sum, value) => sum + value, 0) / variationValues.length
    : null

  return [
    {
      title: 'KPIs activos',
      value: String(activeCount),
      detail: `${kpis.length} indicadores recibidos`,
      icon: 'kpis',
    },
    {
      title: 'KPIs en alerta',
      value: String(alertCount),
      detail: alertCount === 1 ? 'Requiere atención' : 'Requieren atención',
      icon: 'alerts',
      tone: alertCount > 0 ? 'warning' : 'success',
    },
    {
      title: 'Meta cumplida',
      value: averageCompletion === null ? 'Sin meta' : `${averageCompletion}%`,
      detail: 'Promedio informado por KPIs',
      icon: 'target',
    },
    {
      title: 'Tendencia mensual',
      value:
        averageVariation === null
          ? 'Sin datos'
          : `${averageVariation > 0 ? '+' : ''}${averageVariation.toLocaleString('es-CL', { maximumFractionDigits: 1 })}%`,
      detail: 'Promedio de variación',
      icon: 'trend',
      tone: averageVariation !== null && averageVariation < 0 ? 'warning' : 'success',
    },
  ]
}

function statusForTable(kpi) {
  if (kpi.status === 'warning') return 'warning'
  if (kpi.status === 'danger') return 'danger'
  return 'objective'
}

function KpiCreateModal({ form, loading, notice, onChange, onClose, onSubmit }) {
  useEffect(() => {
    const handleKeyDown = (event) => { if (event.key === 'Escape') onClose() }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  return (
    <div className="report-modal-overlay" role="presentation" onMouseDown={onClose}>
      <form
        className="report-modal report-generate-modal"
        aria-labelledby="kpi-create-title"
        onMouseDown={(event) => event.stopPropagation()}
        onSubmit={onSubmit}
      >
        <div className="report-modal__header">
          <div>
            <StatusBadge status="success" label="KPI Service · POST /api/v1/kpis" />
            <h2 id="kpi-create-title">Crear nuevo KPI</h2>
            <p>
              La <strong>Categoría</strong> determina qué calculador del{' '}
              <code>KpiFactory</code> instancia el backend (VentasCalculator, InventarioCalculator…).
            </p>
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
          <label className="report-form-field" style={{ gridColumn: '1 / -1' }}>
            <span>Nombre del KPI</span>
            <input
              name="nombre" type="text" value={form.nombre} onChange={onChange}
              required minLength={3} placeholder="Ej: Ventas mensuales"
            />
          </label>
          <label className="report-form-field">
            <span>Categoría</span>
            <select name="categoria" value={form.categoria} onChange={onChange} required>
              {KPI_CATEGORIAS.map((cat) => <option value={cat} key={cat}>{cat}</option>)}
            </select>
          </label>
          <label className="report-form-field">
            <span>Estado</span>
            <select name="estado" value={form.estado} onChange={onChange} required>
              {KPI_ESTADOS.map((est) => <option value={est} key={est}>{est}</option>)}
            </select>
          </label>
          <label className="report-form-field">
            <span>Valor</span>
            <input
              name="valor" type="text"
              value={form.valor} onChange={onChange} required
              placeholder={getValuePlaceholder(form.categoria, form.unidad)}
            />
          </label>
          <label className="report-form-field">
            <span>Unidad</span>
            <input
              name="unidad" type="text" value={form.unidad} onChange={onChange}
              required placeholder="%, CLP, unidades"
            />
          </label>
        </div>

        <div className="report-modal__actions">
          <button className="secondary-button" type="button" onClick={onClose}>Cancelar</button>
          <button className="primary-action-button" type="submit" disabled={loading}>
            <AppIcon name="kpis" size={16} strokeWidth={2} />
            {loading ? 'Creando...' : 'Crear KPI'}
          </button>
        </div>
      </form>
    </div>
  )
}

export default function KpisScreen({ onBffStatusChange, sucursal = 'todas' }) {
  const { kpis: kpisState, fetchKpis } = useDashboardContext()
  const { data, loading, error } = kpisState

  const [showCreateModal, setShowCreateModal] = useState(false)
  const [createForm, setCreateForm] = useState(INITIAL_KPI_FORM)
  const [createLoading, setCreateLoading] = useState(false)
  const [createNotice, setCreateNotice] = useState(null)

  const [deleteConfirm, setDeleteConfirm] = useState(null)
  const [deleteLoading, setDeleteLoading] = useState(false)

  useEffect(() => { fetchKpis() }, [fetchKpis])

  useEffect(() => {
    if (data?.kpis && onBffStatusChange) {
      onBffStatusChange({ status: 'success', label: 'Operativo' })
    }
  }, [data, onBffStatusChange])

  if (loading) return <KpisSkeleton />
  if (error) return <KpisError error={error} onRetry={fetchKpis} />

  const kpis = data?.kpis || []

  if (kpis.length === 0) {
    return <EmptyKpis onRetry={fetchKpis} onCreateKpi={() => setShowCreateModal(true)} />
  }

  const summaryMetrics = getSummaryMetrics(kpis)

  const handleFormChange = (event) => {
    const { name, value } = event.target

    setCreateForm((current) => {
      const updated = { ...current, [name]: value }

      // Si cambió la categoría, actualiza la unidad automáticamente
      if (name === 'categoria') {
        updated.unidad = UNIT_BY_CATEGORY[value] || '%'
      }

      return updated
    })
  }

  const handleCreateSubmit = (event) => {
    event.preventDefault()
    setCreateLoading(true)
    setCreateNotice(null)

    const parsedValue = parseChileanNumber(createForm.valor)
    const numericValue = Number(parsedValue)

    if (!parsedValue || Number.isNaN(numericValue) || numericValue < 0) {
      setCreateNotice({
        message: 'El valor debe ser un número válido mayor o igual a 0.',
        tone: 'warning'
      })
      setCreateLoading(false)
      return
    }

    const payload = {
      nombre: createForm.nombre.trim(),
      valor: numericValue,
      unidad: createForm.unidad.trim(),
      categoria: createForm.categoria,
      estado: createForm.estado,
    }

    createKpi(payload)
      .then(() => {
        setCreateNotice({ message: 'KPI creado correctamente en KPI Service.', tone: 'success' })
        setTimeout(() => {
          setShowCreateModal(false)
          // Reinicia el formulario con valores iniciales correctos
          setCreateForm({
            nombre: '',
            valor: '',
            unidad: UNIT_BY_CATEGORY['Ventas'],
            categoria: 'Ventas',
            estado: 'Activo',
          })
          setCreateNotice(null)
          fetchKpis()
        }, 1200)
      })
      .catch((err) => {
        setCreateNotice({ message: err.message || 'No fue posible crear el KPI.', tone: 'warning' })
      })
      .finally(() => setCreateLoading(false))
  }

  const handleCloseModal = () => {
    setShowCreateModal(false)
    setCreateForm(INITIAL_KPI_FORM)
    setCreateNotice(null)
  }

  const handleDeleteKpi = async (kpiId, kpiTitle) => {
    if (!window.confirm(`¿Estás seguro de que deseas eliminar "${kpiTitle}"? Esta acción no se puede deshacer.`)) {
      return
    }

    setDeleteLoading(true)
    setDeleteConfirm(kpiId)

    try {
      await deleteKpi(kpiId)
      setDeleteConfirm(null)
      await fetchKpis()
    } catch (error) {
      alert(`Error al eliminar KPI: ${error.message}`)
      setDeleteConfirm(null)
    } finally {
      setDeleteLoading(false)
    }
  }

  return (
    <main className="screen screen--kpis">
      {(sucursal !== 'todas' && sucursal !== 'Todas las sucursales') && (
        <div style={{
          backgroundColor: '#e0f2fe',
          borderLeft: '4px solid #0284c7',
          padding: '12px 16px',
          marginBottom: '20px',
          borderRadius: '4px',
          color: '#0c4a6e',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          gridColumn: '1 / -1'
        }}>
          <AppIcon name="info" size={20} strokeWidth={2} />
          <div>
            <strong>Métricas Corporativas Consolidadas</strong>
            <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem' }}>
              Los KPIs estratégicos reflejan el desempeño global del Grupo Cordillera y no se filtran por sucursal.
            </p>
          </div>
        </div>
      )}
      <section className="metric-grid metric-grid--four" aria-label="Resumen de KPIs">
        {summaryMetrics.map((metric) => <MetricCard key={metric.title} {...metric} />)}
      </section>

      <section className="kpi-grid" aria-label="KPIs principales">
        {kpis.slice(0, 3).map((kpi) => <KpiCard variant="strategic" kpi={kpi} key={kpi.id} />)}
      </section>

      <section className="content-grid content-grid--table" aria-label="Detalle y filtros">
        <div className="panel panel--table">
          <SectionHeader
            title="Detalle de indicadores"
            description="Resumen de los indicadores estratégicos entregados por el BFF Gateway."
          />
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Indicador</th>
                  <th>Categoría</th>
                  <th>Valor actual</th>
                  <th>Meta</th>
                  <th>Cumplimiento</th>
                  <th>Variación</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {kpis.map((kpi) => {
                  const isNegative = String(kpi.change).trim().startsWith('-')
                  const displayUnit = kpi.unit && kpi.unit !== 'CLP' ? ` ${kpi.unit}` : ''
                  return (
                    <tr key={kpi.id}>
                      <td className="table-indicator">{kpi.title}</td>
                      <td>{kpi.category}</td>
                      <td>{`${kpi.value}${displayUnit}`}</td>
                      <td>{kpi.target.replace('Meta: ', '')}</td>
                      <td>{kpi.completion}</td>
                      <td className={isNegative ? 'table-variation--negative' : 'table-variation--positive'}>
                        {kpi.change}
                      </td>
                      <td>
                        <StatusBadge status={statusForTable(kpi)} label={kpi.statusLabel} />
                      </td>
                      <td>
                        <button
                          className="icon-button"
                          type="button"
                          onClick={() => handleDeleteKpi(kpi.id, kpi.title)}
                          disabled={deleteLoading || deleteConfirm === kpi.id}
                          title="Eliminar KPI"
                          aria-label="Eliminar KPI"
                          style={{ color: '#dc2626' }}
                        >
                          <AppIcon name="trash" size={16} strokeWidth={2} />
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>

        <aside className="panel filters-panel">
          <SectionHeader title="Acciones" />
          <button
            className="primary-action-button"
            type="button"
            style={{ width: '100%', marginBottom: '1.25rem' }}
            onClick={() => setShowCreateModal(true)}
          >
            <AppIcon name="kpis" size={15} strokeWidth={2} />
            Crear nuevo KPI
          </button>
          <SectionHeader title="Filtros rápidos" />
          {['Categoría', 'Estado', 'Rango de cumplimiento'].map((filter) => (
            <label className="select-field" key={filter}>
              <span>{filter}</span>
              <select><option>Todos</option></select>
            </label>
          ))}
          <button className="secondary-button" type="button">
            <AppIcon name="refresh" size={15} strokeWidth={2} />
            Limpiar filtros
          </button>
        </aside>
      </section>

      {showCreateModal && (
        <KpiCreateModal
          form={createForm}
          loading={createLoading}
          notice={createNotice}
          onChange={handleFormChange}
          onClose={handleCloseModal}
          onSubmit={handleCreateSubmit}
        />
      )}
    </main>
  )
}
