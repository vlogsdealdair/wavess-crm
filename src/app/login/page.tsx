
import {login,signup} from "./actions";
export default async function LoginPage({searchParams}:{searchParams:Promise<{error?:string;success?:string}>}){
 const p=await searchParams;
 return <main className="login-page"><section className="login-brand"><div className="login-logo"><span/><span/><span/></div><div><strong>WAVESS</strong><small>Commerce Management System</small></div><h1>Control total de tu operación.</h1><p>Ventas. Clientes. Operaciones. Finanzas.</p></section><section className="login-panel"><form className="login-card"><span className="kicker">ACCESO ADMINISTRATIVO</span><h2>Entrar a WAVESS</h2>
 {p.error&&<div role="alert" className="form-alert error">{p.error}</div>}{p.success&&<div role="status" className="form-alert success">{p.success}</div>}
 <label>Usuario o correo<input name="identity" autoComplete="username" defaultValue="leandroaldair" required/></label>
 <label>Contraseña<input name="password" type="password" minLength={8} autoComplete="current-password" required/></label>
 <button className="primary-btn login-submit" formAction={login}>Iniciar sesión</button>
 <details><summary>Primer acceso del administrador</summary><p>Si todavía no existe la cuenta, escribe tu contraseña y pulsa Activar. Confirma el correo si Supabase lo solicita.</p><button className="secondary-btn login-submit" formAction={signup}>Activar cuenta administrativa</button></details>
 </form></section></main>;
}
