import { useEffect, useState } from 'react'
import AppIcon from '../ui/AppIcon'
import StatusBadge from '../ui/StatusBadge'
import useLocalSettings from '../../hooks/useLocalSettings'
import useRemoteSettings from '../../hooks/useRemoteSettings'

const selectOptions = {
  defaultPeriod: [
    ['Julio 2026', 'Julio 2026'],
    ['Mes actual', 'Mes actual'],
  ],
  defaultBranch: [
    ['todas', 'Todas las sucursales'],
    ['1', 'Casa matriz (Santiago)'],
  ],
}

function LocalSelectRow({ id, label, value, options, onChange }) {
  return (
    <label className="settings-row" htmlFor={id}>
      <span>{label}</span>
      <select id={id} value={value} onChange={(event) => onChange(id, event.target.value)}>
        {options.map(([optionValue, optionLabel]) => (
          <option value={optionValue} key={optionValue}>{optionLabel}</option>
        ))}
      </select>
    </label>
  )
}

function SettingsOverview() {
  return (
    <section className="settings-overview">
      <div>
        <span className="settings-overview__eyebrow">CONFIGURACIÓN</span>
        <h2>Centro de configuración ejecutiva</h2>
        <p>Gestiona preferencias locales, parámetros de integración y disponibilidad administrativa de Cordillera Platform.</p>
      </div>
      <aside className="settings-overview__status">
        <span className="icon-box icon-box--teal">
          <AppIcon name="settings" size={20} strokeWidth={2} />
        </span>
        <div>
          <strong>Preferencias locales</strong>
          <small>Guardadas en este navegador</small>
        </div>
        <StatusBadge status="info" label="Local" />
      </aside>
    </section>
  )
}

function SettingsGroup({ title, icon, children }) {
  return (
    <section className="settings-field-group">
      <div className="settings-field-group__title">
        <AppIcon name={icon} size={16} strokeWidth={2} />
        <h3>{title}</h3>
      </div>
      <div className="settings-field-group__body">
        {children}
      </div>
    </section>
  )
}

function RemoteLoadingBlock() {
  return (
    <div className="settings-remote-stack">
      <div className="panel settings-panel dashboard-skeleton settings-remote-card" aria-label="Cargando configuración remota" />
      <div className="settings-locked-grid">
        {['a', 'b', 'c'].map((item) => (
          <div className="settings-module-card dashboard-skeleton" key={item} />
        ))}
      </div>
    </div>
  )
}

function RemotePendingCard({ error, onRetry, empty = false }) {
  return (
    <section className={`settings-remote-pending${empty ? ' settings-remote-pending--empty' : ''}`} role={error ? 'alert' : undefined} aria-live={error ? 'polite' : undefined}>
      <span className={`icon-box ${empty ? 'icon-box--info' : 'icon-box--warning'}`}>
        <AppIcon name={empty ? 'settings' : 'gatewayOff'} size={22} strokeWidth={2} />
      </span>
      <div className="settings-remote-pending__body">
        <StatusBadge status={empty ? 'info' : 'warning'} label={empty ? 'Sin configuración remota' : 'Endpoint pendiente'} />
        <h2>{empty ? 'No hay configuración remota disponible' : 'Configuración remota pendiente'}</h2>
        <p>
          {empty
            ? 'Cuando el BFF exponga parámetros administrativos, aparecerán en este panel.'
            : 'El frontend está operativo, pero aún no recibe parámetros administrativos desde el BFF Gateway.'}
        </p>
        <small>GET /api/configuracion</small>
        {error && (
          <details>
            <summary>Ver detalle técnico</summary>
            <span>{error.message || 'No fue posible conectar con BFF Gateway.'}</span>
          </details>
        )}
      </div>
      <button type="button" onClick={onRetry} aria-label="Reintentar configuración remota">
        <AppIcon name="refresh" size={16} strokeWidth={2} />
        Reintentar
      </button>
    </section>
  )
}

function RemoteSuccessBlock({ data, onRetry, onSave, saving }) {
  const hasRemoteData = Boolean(data?.parameters)

  if (!hasRemoteData) {
    return (
      <div className="settings-remote-stack">
        <RemotePendingCard onRetry={onRetry} empty />
      </div>
    )
  }

  return (
    <div className="settings-remote-stack">
      <section className="panel settings-panel">
        <div className="settings-section-heading">
          <AppIcon name="gateway" size={18} strokeWidth={2} />
          <div>
            <h2>Integración con BFF Gateway</h2>
            <p>Configuración remota recibida desde el BFF. Última lectura: {data.fetchedAt}</p>
          </div>
        </div>
        {data.parameters && (
          <pre className="settings-remote-json">{JSON.stringify(data.parameters, null, 2)}</pre>
        )}
        <button className="primary-button" type="button" onClick={() => onSave(data.raw)} disabled={saving}>
          <AppIcon name="refresh" size={16} strokeWidth={2} />
          {saving ? 'Guardando' : 'Sincronizar configuración remota'}
        </button>
      </section>
    </div>
  )
}

export default function SettingsScreen() {
  const { settings, updateSetting, resetSettings } = useLocalSettings()
  const { data, loading, error, refetch, save, saving } = useRemoteSettings()
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (!saved) return undefined
    const timeoutId = window.setTimeout(() => setSaved(false), 2200)
    return () => window.clearTimeout(timeoutId)
  }, [saved])

  const handleLocalSave = () => {
    setSaved(true)
  }

  const handleRemoteSave = (payload) => {
    void save(payload).catch(() => {})
  }

  return (
    <main className="screen screen--settings">
      <SettingsOverview />

      <section className="settings-layout">
        <div className="panel settings-panel settings-panel--local">
          <div className="settings-section-heading">
            <AppIcon name="filter" size={18} strokeWidth={2} />
            <div>
              <h2>Preferencias locales</h2>
              <p>Ajustes visuales guardados en este navegador.</p>
            </div>
          </div>



          <SettingsGroup title="Contexto inicial" icon="calendar">
            <LocalSelectRow id="defaultPeriod" label="Periodo por defecto" value={settings.defaultPeriod} options={selectOptions.defaultPeriod} onChange={updateSetting} />
            <LocalSelectRow id="defaultBranch" label="Sucursal por defecto" value={settings.defaultBranch} options={selectOptions.defaultBranch} onChange={updateSetting} />
          </SettingsGroup>

          <div className="settings-actions">
            <button className="primary-button" type="button" onClick={handleLocalSave} aria-label="Guardar preferencias locales">
              <AppIcon name="checkCircle" size={16} strokeWidth={2} />
              Guardar preferencias
            </button>
            <button className="secondary-button" type="button" onClick={resetSettings} aria-label="Restaurar preferencias locales">
              <AppIcon name="refresh" size={16} strokeWidth={2} />
              Restaurar
            </button>
            {saved && <span className="settings-save-feedback">Preferencias guardadas</span>}
          </div>
        </div>

        <div className="settings-remote-column">
          {loading && <RemoteLoadingBlock />}
          {!loading && error && (
            <div className="settings-remote-stack">
              <RemotePendingCard error={error} onRetry={refetch} />
            </div>
          )}
          {!loading && !error && data && (
            <RemoteSuccessBlock data={data} onRetry={refetch} onSave={handleRemoteSave} saving={saving} />
          )}
        </div>
      </section>


    </main>
  )
}
