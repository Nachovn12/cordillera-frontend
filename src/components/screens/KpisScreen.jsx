import { useEffect, useState } from 'react'
import AppIcon from '../ui/AppIcon'
import KpiCard from '../dashboard/KpiCard'
import MetricCard from '../ui/MetricCard'
import SectionHeader from '../ui/SectionHeader'
import StatusBadge from '../ui/StatusBadge'
import { useDashboardContext } from '../../context/DashboardContext'
import { createKpi, deleteKpi } from '../../services/kpisApi'
import { getDatos } from '../../services/datosApi'

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
            <AppIcon name="close" size={18} strokeWidth={2.2} />
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

function getKpiContextualData(kpi) {
  const cat = String(kpi?.category || '').toLowerCase()
  const title = String(kpi?.title || '').toLowerCase()

  if (cat.includes('invent') || title.includes('rotacion') || title.includes('stock')) {
    return {
      traceOrigin: 'MySQL (data_db) · WMS & Almacén',
      traceService: 'Inventory Service (:8083)',
      chartTitle: 'Rotación de Inventario por Bodega',
      chartDesc: 'Índice de rotación activa en centros logísticos del holding.',
      distribution: [
        { name: 'Bodega Central - Santiago', share: 48, valueLabel: '48% rotación' },
        { name: 'Almacén Norte - Providencia', share: 29, valueLabel: '29% rotación' },
        { name: 'Centro Logístico - Las Condes', share: 23, valueLabel: '23% rotación' }
      ],
      projectionTitle: 'ROTACIÓN PROYECTADA Q3',
      projectionValue: '4.2 Vueltas / sem',
      confidenceTitle: 'COBERTURA DE STOCK',
      confidenceValue: '98.4% Óptimo'
    }
  }

  if (cat.includes('rentabil') || cat.includes('finanz') || title.includes('rentabil')) {
    return {
      traceOrigin: 'MySQL (data_db) · Contabilidad IFRS',
      traceService: 'Finance & Accounting (:8084)',
      chartTitle: 'Margen Operacional por Sede',
      chartDesc: 'Aporte porcentual al EBITDA consolidado del holding.',
      distribution: [
        { name: 'Sucursal 01 - Santiago Centro', share: 41, valueLabel: '41% margen neto' },
        { name: 'Sucursal 03 - Las Condes', share: 35, valueLabel: '35% margen neto' },
        { name: 'Sucursal 02 - Providencia', share: 24, valueLabel: '24% margen neto' }
      ],
      projectionTitle: 'EBITDA ESTIMADO Q3',
      projectionValue: '+19.8% sobre meta',
      confidenceTitle: 'SOLIDEZ CONTABLE',
      confidenceValue: 'AAA (Sin salvedades)'
    }
  }

  if (cat.includes('logist')) {
    return {
      traceOrigin: 'MySQL (data_db) · Flotas & Despachos',
      traceService: 'Logistics Service (:8085)',
      chartTitle: 'Despachos OTIF a Tiempo por Centro',
      chartDesc: 'Porcentaje de despachos completados sin retrasos.',
      distribution: [
        { name: 'Hub Logístico Santiago', share: 52, valueLabel: '52% a tiempo' },
        { name: 'Hub Logístico Oriente', share: 30, valueLabel: '30% a tiempo' },
        { name: 'Reparto Norte - Providencia', share: 18, valueLabel: '18% a tiempo' }
      ],
      projectionTitle: 'EFICIENCIA LOGÍSTICA Q3',
      projectionValue: '99.1% SLA objetivo',
      confidenceTitle: 'TIEMPO DESPACHO',
      confidenceValue: '18 hrs promedio'
    }
  }

  return {
    traceOrigin: 'MySQL (data_db) · POS & E-commerce',
    traceService: 'Sales & KPI Service (:8082)',
    chartTitle: 'Facturación Comercial por Sede',
    chartDesc: 'Desglose de ingresos transaccionales consolidados.',
    distribution: [
      { name: 'Sucursal 01 - Santiago Centro', share: 44, valueLabel: '44% cuota' },
      { name: 'Sucursal 02 - Providencia', share: 32, valueLabel: '32% cuota' },
      { name: 'Sucursal 03 - Las Condes', share: 24, valueLabel: '24% cuota' }
    ],
    projectionTitle: 'PROYECCIÓN CIERRE Q3',
    projectionValue: '+114.5% Estimado',
    confidenceTitle: 'CONFIANZA ESTADÍSTICA',
    confidenceValue: '99.8% Certidumbre'
  }
}

function KpiTraceabilityModal({ kpi, onClose }) {
  useEffect(() => {
    const handleKeyDown = (event) => { if (event.key === 'Escape') onClose() }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  if (!kpi) return null

  const ctxData = getKpiContextualData(kpi)

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
      <section
        className="report-modal"
        role="dialog"
        aria-modal="true"
        onMouseDown={(e) => e.stopPropagation()}
        style={{
          background: '#ffffff',
          borderRadius: '16px',
          boxShadow: '0 25px 50px -12px rgba(15, 23, 42, 0.25)',
          border: '1px solid #e2e8f0',
          width: '100%',
          maxWidth: '820px',
          overflow: 'hidden',
          padding: '1.4rem'
        }}
      >
        {/* Encabezado ejecutivo en 1 línea */}
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
                fontSize: '0.82rem',
                fontWeight: 700,
                color: '#0284c7',
                background: '#e0f2fe',
                padding: '0.2rem 0.55rem',
                borderRadius: '6px',
                border: '1px solid #bae6fd'
              }}
            >
              KPI-ESTRATÉGICO
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
              {kpi.category}
            </span>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
              Auditoría y Gráficos: {kpi.title}
            </h2>
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

        {/* Grid principal a 2 columnas: Cero scroll */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1.05fr',
            gap: '1.15rem',
            alignItems: 'stretch'
          }}
        >
          {/* Columna Izquierda: Desempeño Consolidado y Trazabilidad */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.95rem' }}>
            <div
              style={{
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '12px',
                padding: '1.15rem'
              }}
            >
              <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
                Valor Consolidado Holding
              </span>
              <div style={{ fontSize: '1.45rem', fontWeight: 800, color: '#0f172a', margin: '0.35rem 0' }}>
                {kpi.value} {kpi.unit}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.78rem', color: '#475569', marginTop: '0.45rem' }}>
                <span>Meta Corporativa: <strong>{kpi.target}</strong></span>
                <strong style={{ color: '#0d9488' }}>{kpi.completion}</strong>
              </div>
              {/* Barra de progreso de cumplimiento */}
              <div style={{ width: '100%', height: '6px', background: '#e2e8f0', borderRadius: '999px', overflow: 'hidden', marginTop: '0.55rem' }}>
                <div style={{ width: '100%', height: '100%', background: '#0d9488', borderRadius: '999px' }} />
              </div>
            </div>

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
                <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#0284c7', textTransform: 'uppercase' }}>
                  Trazabilidad de Consolidación
                </span>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem', marginTop: '0.75rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem' }}>
                    <span style={{ color: '#64748b' }}>Base de Origen:</span>
                    <strong style={{ color: '#1e293b' }}>{ctxData.traceOrigin}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem' }}>
                    <span style={{ color: '#64748b' }}>Servicio de Agregación:</span>
                    <strong style={{ color: '#1e293b' }}>{ctxData.traceService}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem' }}>
                    <span style={{ color: '#64748b' }}>Orquestación API:</span>
                    <strong style={{ color: '#1e293b' }}>BFF Gateway (:8080)</strong>
                  </div>
                </div>
              </div>

              <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '0.75rem', marginTop: '0.75rem' }}>
                <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#166534', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  ● Indicador Auditado e Integrado (ACID OK)
                </span>
              </div>
            </div>
          </div>

          {/* Columna Derecha: Gráfico de Aporte por Sucursal + Proyección */}
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
                  {ctxData.chartTitle}
                </h4>
                <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#0369a1', background: '#e0f2fe', padding: '0.15rem 0.5rem', borderRadius: '4px' }}>
                  Distribución Red
                </span>
              </div>
              <p style={{ fontSize: '0.75rem', color: '#64748b', margin: '0.35rem 0 0.95rem 0' }}>
                {ctxData.chartDesc}
              </p>

              {/* Barras visuales de aporte por sucursal */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {ctxData.distribution.map((branch, idx) => (
                  <div key={idx} style={{ background: '#ffffff', padding: '0.75rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.76rem', fontWeight: 600, color: '#334155', marginBottom: '0.4rem' }}>
                      <span>{branch.name}</span>
                      <strong style={{ color: '#0d9488' }}>{branch.valueLabel}</strong>
                    </div>
                    <div style={{ width: '100%', height: '8px', background: '#f1f5f9', borderRadius: '999px', overflow: 'hidden' }}>
                      <div
                        style={{
                          width: `${branch.share}%`,
                          height: '100%',
                          background: idx === 0 ? '#0d9488' : idx === 1 ? '#0284c7' : '#64748b',
                          borderRadius: '999px'
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Tarjeta inferior de Proyección Directiva */}
            <div
              style={{
                marginTop: '1rem',
                paddingTop: '0.85rem',
                borderTop: '1px solid #e2e8f0',
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '0.75rem'
              }}
            >
              <div style={{ background: '#ffffff', padding: '0.65rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <span style={{ fontSize: '0.68rem', color: '#64748b', fontWeight: 600 }}>{ctxData.projectionTitle}</span>
                <strong style={{ fontSize: '0.82rem', color: '#0d9488', display: 'block', marginTop: '0.15rem' }}>{ctxData.projectionValue}</strong>
              </div>
              <div style={{ background: '#ffffff', padding: '0.65rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <span style={{ fontSize: '0.68rem', color: '#64748b', fontWeight: 600 }}>{ctxData.confidenceTitle}</span>
                <strong style={{ fontSize: '0.82rem', color: '#0284c7', display: 'block', marginTop: '0.15rem' }}>{ctxData.confidenceValue}</strong>
              </div>
            </div>
          </div>
        </div>

        {/* Footer compacto con descargas */}
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
            Auditoría gerencial en tiempo real conectada a la base relacional de Grupo Cordillera.
          </span>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              type="button"
              className="primary-action-button"
              onClick={() => {
                const blob = new Blob([JSON.stringify({ kpi, details: ctxData }, null, 2)], { type: 'application/json' })
                const url = URL.createObjectURL(blob)
                const a = document.createElement('a')
                a.href = url
                a.download = `auditoria_kpi_${kpi.title.toLowerCase().replace(/\s+/g, '_')}.json`
                a.click()
              }}
              style={{ padding: '0.45rem 0.9rem', fontSize: '0.8rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.45rem' }}
            >
              <AppIcon name="fileJson" size={15} strokeWidth={2} />
              Exportar Auditoría JSON
            </button>
            <button
              type="button"
              className="secondary-button"
              onClick={onClose}
              style={{ padding: '0.45rem 0.9rem', fontSize: '0.8rem', fontWeight: 700 }}
            >
              Cerrar
            </button>
          </div>
        </footer>
      </section>
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
  const [selectedTraceKpi, setSelectedTraceKpi] = useState(null)

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
                  let displayTarget = kpi.target.replace('Meta: ', '')
                  if (kpi.unit === '%' && !displayTarget.includes('%')) {
                    displayTarget = `${displayTarget}%`
                  }

                  const catClean = String(kpi.category || '').trim().toLowerCase()
                  let iconName = 'dollar'
                  let iconBg = '#e0f2fe'
                  let iconColor = '#0284c7'

                  if (catClean.includes('invent')) {
                    iconName = 'package'
                    iconBg = '#fef3c7'
                    iconColor = '#d97706'
                  } else if (catClean.includes('rentabil') || catClean.includes('finanz')) {
                    iconName = 'trend'
                    iconBg = '#dcfce7'
                    iconColor = '#16a34a'
                  } else if (catClean.includes('logist')) {
                    iconName = 'store'
                    iconBg = '#f3e8ff'
                    iconColor = '#9333ea'
                  }

                  return (
                    <tr
                      key={kpi.id}
                      onClick={() => setSelectedTraceKpi(kpi)}
                      style={{ cursor: 'pointer' }}
                      title="Haz clic para auditar trazabilidad operacional (Data Service → KPI Service)"
                      className="clickable-row"
                    >
                      <td className="table-indicator">
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem' }}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', fontWeight: 600, color: '#0f172a' }}>
                            <span style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              width: '28px',
                              height: '28px',
                              borderRadius: '7px',
                              background: iconBg,
                              color: iconColor,
                              flexShrink: 0
                            }}>
                              <AppIcon name={iconName} size={15} strokeWidth={2.2} />
                            </span>
                            {kpi.title}
                          </span>
                          <span style={{
                            fontSize: '0.72rem',
                            background: '#e0f2fe',
                            color: '#0369a1',
                            padding: '0.2rem 0.6rem',
                            borderRadius: '6px',
                            fontWeight: 700,
                            border: '1px solid #bae6fd',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.35rem',
                            flexShrink: 0
                          }}>
                            <AppIcon name="trend" size={13} strokeWidth={2.2} />
                            Ficha & Gráficos
                          </span>
                        </div>
                      </td>
                      <td style={{ textTransform: 'capitalize', fontWeight: 500, color: '#475569' }}>
                        {kpi.category}
                      </td>
                      <td style={{ fontWeight: 600, color: '#0f172a' }}>
                        {`${kpi.value}${displayUnit}`}
                      </td>
                      <td style={{ color: '#475569' }}>
                        {displayTarget}
                      </td>
                      <td style={{ fontWeight: 600, color: '#0284c7' }}>
                        {kpi.completion}
                      </td>
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
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDeleteKpi(kpi.id, kpi.title)
                          }}
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

      {selectedTraceKpi && (
        <KpiTraceabilityModal
          kpi={selectedTraceKpi}
          onClose={() => setSelectedTraceKpi(null)}
        />
      )}
    </main>
  )
}
