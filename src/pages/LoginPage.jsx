import { useState } from "react";
import { loginApi } from "../services/api";
import AppIcon from "../components/ui/AppIcon";
import "../styles/login.css";

export default function LoginPage({ onLoginSuccess }) {
  const [usuario, setUsuario] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showPassword, setShowPassword] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const data = await loginApi(usuario, contrasena);

      localStorage.setItem("authToken", data.token);
      localStorage.setItem(
        "authUser",
        JSON.stringify({ nombre: data.nombre, rol: data.rol, area: data.area })
      );

      onLoginSuccess(data);
    } catch (err) {
      setError(err.message || "No fue posible iniciar sesión.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-root">
      <div className="login-card">

        <div className="login-brand">
          <div className="login-brand__icon">
            <AppIcon name="gateway" size={28} strokeWidth={1.8} />
          </div>
          <div>
            <span className="login-brand__label">GRUPO CORDILLERA</span>
            <h1 className="login-brand__title">Plataforma Ejecutiva</h1>
          </div>
        </div>

        <p className="login-subtitle">
          Acceso restringido a personal autorizado. Ingresa tus credenciales corporativas.
        </p>

        <form className="login-form" onSubmit={handleSubmit} noValidate>
          <div className="login-field">
            <label className="login-field__label" htmlFor="usuario">
              Usuario corporativo
            </label>
            <div className="login-field__input-wrap">
              <AppIcon className="login-field__icon" name="document" size={16} strokeWidth={2} />
              <input
                id="usuario"
                className="login-field__input"
                type="email"
                placeholder="nombre@cordillera.cl"
                value={usuario}
                onChange={(e) => setUsuario(e.target.value)}
                autoComplete="username"
                required
                disabled={loading}
              />
            </div>
          </div>

          <div className="login-field">
            <label className="login-field__label" htmlFor="contrasena">
              Contraseña
            </label>
            <div className="login-field__input-wrap">
              <AppIcon className="login-field__icon" name="shield" size={16} strokeWidth={2} />
              <input
                id="contrasena"
                className="login-field__input"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••••"
                value={contrasena}
                onChange={(e) => setContrasena(e.target.value)}
                autoComplete="current-password"
                required
                disabled={loading}
              />
              <button
                type="button"
                className="login-field__toggle"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                tabIndex={-1}
              >
                <AppIcon name={showPassword ? "more" : "more"} size={15} strokeWidth={2} />
              </button>
            </div>
          </div>

          {error && (
            <div className="login-error" role="alert">
              <AppIcon name="warning" size={15} strokeWidth={2} />
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            className="login-submit"
            disabled={loading || !usuario || !contrasena}
          >
            {loading ? (
              <>
                <span className="login-submit__spinner" aria-hidden="true" />
                Autenticando…
              </>
            ) : (
              <>
                <AppIcon name="gateway" size={16} strokeWidth={2} />
                Iniciar sesión
              </>
            )}
          </button>
        </form>

        <footer className="login-footer">
          <span>BFF Gateway · Puerto 8081</span>
          <span>©2026 Grupo Cordillera</span>
        </footer>
      </div>
    </div>
  );
}
