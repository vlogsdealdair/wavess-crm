import { login, signup } from "./actions";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; success?: string }>;
}) {
  const params = await searchParams;
  return (
    <main className="login-page">
      <section className="login-brand">
        <div className="login-logo"><span/><span/><span/></div>
        <div>
          <strong>WAVESS</strong>
          <small>Commerce Management System</small>
        </div>
        <h1>Control total de tu operación.</h1>
        <p>Ventas. Clientes. Operaciones. Finanzas.</p>
      </section>
      <section className="login-panel">
        <form className="login-card">
          <div>
            <span className="kicker">ACCESO ADMINISTRATIVO</span>
            <h2>Entrar a WAVESS</h2>
            <p>Gestiona pedidos, clientes, proveedores y rentabilidad desde un solo lugar.</p>
          </div>
          {params.error && <div className="form-alert error">{decodeURIComponent(params.error)}</div>}
          {params.success && <div className="form-alert success">{decodeURIComponent(params.success)}</div>}
          <label>Nombre <input name="full_name" placeholder="Leandro" /></label>
          <label>Correo <input name="email" type="email" placeholder="admin@wavess.com" required /></label>
          <label>Contraseña <input name="password" type="password" minLength={6} required /></label>
          <button className="primary-btn login-submit" formAction={login}>Iniciar sesión</button>
          <button className="secondary-btn login-submit" formAction={signup}>Crear cuenta administrativa</button>
        </form>
      </section>
    </main>
  );
}
