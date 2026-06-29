import { useEffect, useState } from "react";
import { getUsuarios, createUsuario, deleteUsuario } from "../../services/usersApi";
import AppIcon from "../ui/AppIcon";
import SectionHeader from "../ui/SectionHeader";

const ROLES = ["GERENTE_GENERAL", "ADMINISTRADOR", "ANALISTA", "OPERADOR"];

const INITIAL_FORM = { usuario: "", contrasena: "", nombre: "", rol: "ANALISTA", area: "" };

function UsuarioRow({ usuario, onDelete }) {
  return (
    <tr>
      <td style={{ fontFamily: "monospace", fontSize: "0.72rem", color: "#64748b" }}>
        {usuario.id.slice(0, 8)}…
      </td>
      <td>{usuario.nombre}</td>
      <td>{usuario.usuario}</td>
      <td>
        <span className={`status-badge status-badge--${rolTone(usuario.rol)}`}>
          {usuario.rol}
        </span>
      </td>
      <td>{usuario.area}</td>
      <td>
        <button
          type="button"
          className="sidebar__logout"
          title="Eliminar usuario"
          onClick={() => onDelete(usuario)}
          style={{ color: "#ef4444" }}
        >
          <AppIcon name="trash" size={14} strokeWidth={2} />
        </button>
      </td>
    </tr>
  );
}

function rolTone(rol) {
  if (rol === "GERENTE_GENERAL") return "success";
  if (rol === "ADMINISTRADOR")   return "warning";
  return "info";
}

export default function UsersScreen() {
  const [usuarios, setUsuarios]     = useState([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState(null);
  const [showModal, setShowModal]   = useState(false);
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
      await createUsuario(form);
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
        <article className="metric-card">
          <div className="metric-card__icon-wrap"><AppIcon name="users" size={20} strokeWidth={2} /></div>
          <div className="metric-card__body">
            <span className="metric-card__title">Total usuarios</span>
            <strong className="metric-card__value">{loading ? "—" : usuarios.length}</strong>
          </div>
        </article>
        <article className="metric-card">
          <div className="metric-card__icon-wrap"><AppIcon name="shield" size={20} strokeWidth={2} /></div>
          <div className="metric-card__body">
            <span className="metric-card__title">Gerentes</span>
            <strong className="metric-card__value">
              {loading ? "—" : usuarios.filter((u) => u.rol === "GERENTE_GENERAL").length}
            </strong>
          </div>
        </article>
        <article className="metric-card">
          <div className="metric-card__icon-wrap"><AppIcon name="settings" size={20} strokeWidth={2} /></div>
          <div className="metric-card__body">
            <span className="metric-card__title">Administradores</span>
            <strong className="metric-card__value">
              {loading ? "—" : usuarios.filter((u) => u.rol === "ADMINISTRADOR").length}
            </strong>
          </div>
        </article>
        <article className="metric-card">
          <div className="metric-card__icon-wrap"><AppIcon name="lock" size={20} strokeWidth={2} /></div>
          <div className="metric-card__body">
            <span className="metric-card__title">Endpoint</span>
            <strong className="metric-card__value" style={{ fontSize: "0.78rem" }}>POST /api/auth/usuarios</strong>
          </div>
        </article>
      </div>

      {/* Tabla */}
      <div className="panel panel--table">
        <SectionHeader
          title="Usuarios registrados"
          description="Listado obtenido desde GET /api/auth/usuarios — store en memoria del BFF."
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
                <th></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} style={{ textAlign: "center", color: "#94a3b8" }}>Cargando…</td></tr>
              ) : usuarios.length === 0 ? (
                <tr><td colSpan={6} style={{ textAlign: "center", color: "#94a3b8" }}>Sin usuarios registrados.</td></tr>
              ) : (
                usuarios.map((u) => <UsuarioRow key={u.id} usuario={u} onDelete={handleDelete} />)
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
              <button type="button" className="report-modal__close" onClick={() => setShowModal(false)}>✕</button>
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

                <div className="user-form__field user-form__field--full">
                  <label htmlFor="uf-area">Área</label>
                  <input id="uf-area" type="text" name="area" value={form.area}
                    onChange={handleField} placeholder="Ej: Gerencia Comercial" required disabled={saving} />
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
    </main>
  );
}
