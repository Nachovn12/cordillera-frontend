import { useEffect, useState } from "react";
import { getUsuarios, createUsuario, deleteUsuario } from "../../services/usersApi";
import AppIcon from "../ui/AppIcon";
import SectionHeader from "../ui/SectionHeader";
import MetricCard from "../ui/MetricCard";

const ROLES = ["GERENTE_GENERAL", "ADMINISTRADOR", "ANALISTA", "OPERADOR"];

const INITIAL_FORM = { usuario: "", contrasena: "", nombre: "", rol: "ANALISTA", area: "", sucursalId: "" };

const SUCURSALES = [
  { id: '', label: 'Global (Todas)' },
  { id: '1', label: 'Santiago' },
  { id: '2', label: 'Valdivia' },
  { id: '3', label: 'Concepción' },
  { id: '4', label: 'Temuco' },
];

function rolTone(rol) {
  if (rol === "GERENTE_GENERAL") return "success";
  if (rol === "ADMINISTRADOR")   return "warning";
  return "info";
}

function getRolePermissions(rol) {
  if (rol === "GERENTE_GENERAL") {
    return {
      scope: "Corporativo Global (Multi-sucursal)",
      levelDesc: "Acceso ilimitado directivo a toma de decisiones, reportes consolidados y supervisión de microservicios.",
      accessMatrix: [
        { module: "Dashboard Ejecutivo & Ventas", access: "Acceso Total", share: 100 },
        { module: "Monitoreo de KPIs & Metas", access: "Control & Aprobación", share: 100 },
        { module: "Generador de Reportes (PDF/Excel)", access: "Emisión Global", share: 100 },
        { module: "Salud de Arquitectura & Endpoints", access: "Auditoría Técnica", share: 100 }
      ]
    };
  }
  if (rol === "ADMINISTRADOR") {
    return {
      scope: "Administración Operativa Local / Global",
      levelDesc: "Gestión técnica de sucursales, administración de usuarios locales y validación de transacciones POS.",
      accessMatrix: [
        { module: "Dashboard Ejecutivo & Ventas", access: "Lectura Operativa", share: 85 },
        { module: "Monitoreo de KPIs & Metas", access: "Monitoreo", share: 85 },
        { module: "Generador de Reportes (PDF/Excel)", access: "Exportación Estándar", share: 80 },
        { module: "Salud de Arquitectura & Endpoints", access: "Diagnóstico", share: 90 }
      ]
    };
  }
  return {
    scope: "Operativo Comercial / Analítico",
    levelDesc: "Acceso de consulta para análisis transaccional y generación documental de sucursal asignada.",
    accessMatrix: [
      { module: "Dashboard Ejecutivo & Ventas", access: "Consulta de Sucursal", share: 70 },
      { module: "Monitoreo de KPIs & Metas", access: "Lectura de Indicadores", share: 65 },
      { module: "Generador de Reportes (PDF/Excel)", access: "Descarga de Informes", share: 60 },
      { module: "Salud de Arquitectura & Endpoints", access: "Estado de Conexión", share: 50 }
    ]
  };
}

function UserDetailModal({ usuario, onClose }) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  if (!usuario) return null

  const permissions = getRolePermissions(usuario.rol)
  const sucursalLabel = usuario.sucursalId
    ? SUCURSALES.find(s => s.id === String(usuario.sucursalId))?.label || `Sucursal ${usuario.sucursalId}`
    : "Global (Todas las sucursales)"

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        padding: '1.25rem',
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: '#ffffff',
          borderRadius: '16px',
          width: '100%',
          maxWidth: '820px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          border: '1px solid #e2e8f0',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cabecera del modal */}
        <div
          style={{
            padding: '1.15rem 1.6rem',
            borderBottom: '1px solid #e2e8f0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: '#f8fafc',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            <span
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '12px',
                background: '#e0f2fe',
                color: '#0284c7',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <AppIcon name="users" size={22} strokeWidth={2} />
            </span>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.12rem', fontWeight: 800, color: '#0f172a' }}>
                {usuario.nombre}
              </h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginTop: '0.2rem' }}>
                <span style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 600 }}>
                  {usuario.usuario}
                </span>
                <span style={{ color: '#cbd5e1' }}>•</span>
                <span className={`status-badge status-badge--${rolTone(usuario.rol)}`}>
                  {usuario.rol}
                </span>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{
              background: '#f1f5f9',
              border: 'none',
              borderRadius: '8px',
              padding: '0.45rem',
              cursor: 'pointer',
              color: '#64748b',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            title="Cerrar auditoría de usuario"
          >
            <AppIcon name="close" size={18} strokeWidth={2} />
          </button>
        </div>

        {/* Cuerpo a 2 Columnas sin Scroll */}
        <div
          style={{
            padding: '1.5rem 1.6rem',
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '1.6rem',
          }}
        >
          {/* Columna Izquierda: Identidad & Ubicación */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.15rem' }}>
            <div>
              <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Atribución Directiva
              </span>
              <p style={{ fontSize: '0.86rem', color: '#1e293b', fontWeight: 600, margin: '0.35rem 0 0 0', lineHeight: 1.45 }}>
                {permissions.levelDesc}
              </p>
            </div>

            <div
              style={{
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '12px',
                padding: '1rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.7rem',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                <span style={{ color: '#64748b', fontWeight: 600 }}>ID Corporativo:</span>
                <strong style={{ color: '#0f172a', fontFamily: 'monospace' }}>{usuario.id}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                <span style={{ color: '#64748b', fontWeight: 600 }}>Área de Negocio:</span>
                <strong style={{ color: '#0f172a' }}>{usuario.area || "Administración"}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                <span style={{ color: '#64748b', fontWeight: 600 }}>Asignación de Sucursal:</span>
                <strong style={{ color: '#0284c7' }}>{sucursalLabel}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                <span style={{ color: '#64748b', fontWeight: 600 }}>Alcance de Permisos:</span>
                <strong style={{ color: '#166534' }}>{permissions.scope}</strong>
              </div>
            </div>
          </div>

          {/* Columna Derecha: Matriz de Control de Acceso */}
          <div
            style={{
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '12px',
              padding: '1.2rem',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}
          >
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h4 style={{ margin: 0, fontSize: '0.86rem', fontWeight: 700, color: '#0f172a' }}>
                  Matriz de Control de Accesos
                </h4>
                <span style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600 }}>
                  Rol Activo
                </span>
              </div>
              <p style={{ margin: '0.25rem 0 1.1rem 0', fontSize: '0.78rem', color: '#64748b' }}>
                Autorizaciones validadas vía BFF Gateway.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.95rem' }}>
                {permissions.accessMatrix.map((item) => (
                  <div key={item.module}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem', fontSize: '0.78rem' }}>
                      <span style={{ color: '#334155', fontWeight: 700 }}>{item.module}</span>
                      <strong style={{ color: '#0284c7' }}>{item.access}</strong>
                    </div>
                    <div
                      style={{
                        height: '7px',
                        width: '100%',
                        background: '#e2e8f0',
                        borderRadius: '999px',
                        overflow: 'hidden',
                      }}
                    >
                      <div
                        style={{
                          height: '100%',
                          width: `${item.share}%`,
                          background: item.share === 100 ? '#0284c7' : '#0d9488',
                          borderRadius: '999px',
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div
              style={{
                borderTop: '1px solid #e2e8f0',
                paddingTop: '0.8rem',
                marginTop: '1rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                fontSize: '0.76rem',
                color: '#475569',
              }}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#166534', fontWeight: 700 }}>
                ● Autenticación Integrada en BFF
              </span>
              <span>Estado: Activo</span>
            </div>
          </div>
        </div>

        {/* Pie del modal */}
        <div
          style={{
            padding: '0.95rem 1.6rem',
            borderTop: '1px solid #e2e8f0',
            background: '#f8fafc',
            display: 'flex',
            justifyContent: 'flex-end',
          }}
        >
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: '0.55rem 1.25rem',
              borderRadius: '8px',
              border: 'none',
              background: '#0284c7',
              color: '#ffffff',
              fontSize: '0.82rem',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            Cerrar Ficha del Usuario
          </button>
        </div>
      </div>
    </div>
  )
}

export default function UsersScreen({ onBffStatusChange }) {
  const [usuarios, setUsuarios]     = useState([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState(null);
  const [showModal, setShowModal]   = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [form, setForm]             = useState(INITIAL_FORM);
  const [saving, setSaving]         = useState(false);
  const [notice, setNotice]         = useState(null);

  async function fetchUsuarios() {
    setLoading(true);
    setError(null);
    try {
      const data = await getUsuarios();
      setUsuarios(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchUsuarios(); }, []);

  useEffect(() => {
    if (loading) {
      onBffStatusChange?.({ status: 'info', label: 'Consultando' })
    } else if (error) {
      onBffStatusChange?.({ status: 'danger', label: 'Error' })
    } else {
      onBffStatusChange?.({ status: 'success', label: 'Operativo' })
    }
  }, [loading, error, onBffStatusChange])

  function handleField(e) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleDelete(usuario) {
    if (!window.confirm(`¿Eliminar al usuario ${usuario.nombre} (${usuario.usuario})?`)) return;
    try {
      await deleteUsuario(usuario.id);
      fetchUsuarios();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setNotice(null);
    try {
      const payload = { ...form };
      if (payload.sucursalId === "") {
        payload.sucursalId = null;
      } else {
        payload.sucursalId = parseInt(payload.sucursalId, 10);
      }
      await createUsuario(payload);
      setNotice({ type: "success", text: `Usuario ${form.usuario} creado correctamente.` });
      setForm(INITIAL_FORM);
      fetchUsuarios();
      setTimeout(() => { setShowModal(false); setNotice(null); }, 1500);
    } catch (err) {
      setNotice({ type: "error", text: err.message });
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="screen screen--users">

      {/* Resumen */}
      <div className="metric-grid metric-grid--four">
        <MetricCard
          title="Total usuarios"
          value={loading ? "—" : usuarios.length}
          icon="users"
          tone="primary"
        />
        <MetricCard
          title="Gerentes"
          value={loading ? "—" : usuarios.filter((u) => u.rol === "GERENTE_GENERAL").length}
          icon="shield"
          tone="warning"
        />
        <MetricCard
          title="Administradores"
          value={loading ? "—" : usuarios.filter((u) => u.rol === "ADMINISTRADOR").length}
          icon="settings"
          tone="secondary"
        />
        <MetricCard
          title="Endpoint"
          value="auth/usuarios"
          detail="Método POST"
          icon="lock"
          tone="critical"
        />
      </div>

      {/* Tabla */}
      <div className="panel panel--table">
        <SectionHeader
          title="Usuarios registrados"
          description="Control directivo de accesos, roles y autenticación gestionados vía BFF Gateway (/api/auth/usuarios)."
          action={
            <button type="button" className="primary-action-button" onClick={() => setShowModal(true)}>
              <AppIcon name="users" size={15} strokeWidth={2} />
              Nuevo usuario
            </button>
          }
        />

        {error && (
          <div className="login-error" style={{ margin: "0 0 1rem" }}>
            <AppIcon name="warning" size={15} strokeWidth={2} />
            <span>{error}</span>
          </div>
        )}

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Nombre</th>
                <th>Usuario (email)</th>
                <th>Rol</th>
                <th>Área</th>
                <th>Sucursal</th>
                <th style={{ textAlign: 'right' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} style={{ textAlign: "center", color: "#94a3b8" }}>Cargando…</td></tr>
              ) : usuarios.length === 0 ? (
                <tr><td colSpan={7} style={{ textAlign: "center", color: "#94a3b8" }}>Sin usuarios registrados.</td></tr>
              ) : (
                usuarios.map((u) => (
                  <tr
                    key={u.id}
                    onClick={() => setSelectedUser(u)}
                    style={{ cursor: "pointer", transition: "background 0.15s ease" }}
                    title="Haz clic para ver auditoría del usuario y matriz de permisos"
                  >
                    <td style={{ fontFamily: "monospace", fontSize: "0.72rem", color: "#64748b" }}>
                      {u.id.slice(0, 8)}…
                    </td>
                    <td style={{ fontWeight: 700, color: "#0f172a" }}>{u.nombre}</td>
                    <td>{u.usuario}</td>
                    <td>
                      <span className={`status-badge status-badge--${rolTone(u.rol)}`}>
                        {u.rol}
                      </span>
                    </td>
                    <td>{u.area}</td>
                    <td>
                      <span style={{ fontSize: "0.8rem", color: "#64748b" }}>
                        {u.sucursalId ? SUCURSALES.find(s => s.id === String(u.sucursalId))?.label : "Global"}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }} onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        className="sidebar__logout"
                        title="Eliminar usuario"
                        onClick={() => handleDelete(u)}
                        style={{ color: "#ef4444" }}
                      >
                        <AppIcon name="trash" size={15} strokeWidth={2} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal crear usuario */}
      {showModal && (
        <div className="report-modal-overlay" onClick={() => setShowModal(false)}>
          <div className="report-modal" onClick={(e) => e.stopPropagation()}>
            <div className="report-modal__header">
              <h3>Crear nuevo usuario</h3>
              <button
                type="button"
                className="report-modal__close"
                onClick={() => setShowModal(false)}
                style={{
                  background: '#f1f5f9',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '0.4rem',
                  cursor: 'pointer',
                  color: '#64748b',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <AppIcon name="close" size={18} strokeWidth={2} />
              </button>
            </div>

            <form className="report-modal__body" onSubmit={handleSubmit}>
              <div className="user-form__grid">

                <div className="user-form__field user-form__field--full">
                  <label htmlFor="uf-usuario">Email corporativo</label>
                  <input id="uf-usuario" type="email" name="usuario" value={form.usuario}
                    onChange={handleField} placeholder="nombre@cordillera.cl" required disabled={saving} />
                </div>

                <div className="user-form__field user-form__field--full">
                  <label htmlFor="uf-nombre">Nombre completo</label>
                  <input id="uf-nombre" type="text" name="nombre" value={form.nombre}
                    onChange={handleField} placeholder="Ej: J. Pérez" required disabled={saving} />
                </div>

                <div className="user-form__field">
                  <label htmlFor="uf-contrasena">Contraseña</label>
                  <input id="uf-contrasena" type="password" name="contrasena" value={form.contrasena}
                    onChange={handleField} placeholder="••••••••" required disabled={saving} />
                </div>

                <div className="user-form__field">
                  <label htmlFor="uf-rol">Rol</label>
                  <select id="uf-rol" name="rol" value={form.rol} onChange={handleField} disabled={saving}>
                    {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>

                <div className="user-form__field">
                  <label htmlFor="uf-area">Área</label>
                  <input id="uf-area" type="text" name="area" value={form.area}
                    onChange={handleField} placeholder="Ej: Gerencia Comercial" required disabled={saving} />
                </div>

                <div className="user-form__field">
                  <label htmlFor="uf-sucursal">Sucursal</label>
                  <select id="uf-sucursal" name="sucursalId" value={form.sucursalId} onChange={handleField} disabled={saving}>
                    {SUCURSALES.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
                  </select>
                </div>

              </div>

              {notice && (
                <div className={`login-error${notice.type === "success" ? " login-error--success" : ""}`}>
                  <AppIcon name={notice.type === "success" ? "checkCircle" : "warning"} size={14} strokeWidth={2} />
                  <span>{notice.text}</span>
                </div>
              )}

              <div className="report-modal__actions">
                <button type="button" className="secondary-button" onClick={() => setShowModal(false)} disabled={saving}>
                  Cancelar
                </button>
                <button type="submit" className="primary-action-button" disabled={saving}>
                  {saving ? "Guardando…" : "Crear usuario"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Ficha Directiva de Usuario & Permisos */}
      {selectedUser && (
        <UserDetailModal
          usuario={selectedUser}
          onClose={() => setSelectedUser(null)}
        />
      )}
    </main>
  );
}
