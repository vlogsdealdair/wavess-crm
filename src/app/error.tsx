"use client";
export default function ErrorPage({reset}:{reset:()=>void}){return <main className="editor-card"><h1>No se pudo cargar este módulo</h1><p>Intenta otra vez. Si persiste, revisa tu sesión y la configuración del proyecto.</p><button onClick={reset} className="primary-btn">Reintentar</button><a className="secondary-btn" href="/login">Ir al acceso</a></main>;}
