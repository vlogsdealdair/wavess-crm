
import {AppShell} from "@/components/app-shell";
import {ActionForm} from "@/components/action-form";
import {createPaymentMethod} from "@/app/actions";
import {createClient} from "@/lib/supabase/server";
import {DEFAULT_METHODS} from "@/lib/payment-methods";
export default async function Page(){const s=await createClient();const {data:{user}}=await s.auth.getUser();const {data:methods,error}=await s.from("payment_methods").select("name").order("name");if(error) throw new Error(error.message);
return <AppShell><section className="page-head"><div><p className="eyebrow">SISTEMA</p><h1>Configuración</h1><p>Cuenta, métodos de pago y ayuda.</p></div></section><section className="grid-2"><div className="card editor-card"><h3>Administrador</h3><p>Usuario: leandroaldair</p><p>Correo: {user?.email}</p><p>Moneda: USD · Zona horaria: Ecuador</p><a href="/ayuda" className="secondary-btn">Cómo usar cada módulo</a></div><div className="card editor-card"><h3>Métodos de pago</h3><p>{[...DEFAULT_METHODS,...(methods??[]).map(m=>m.name)].join(" · ")}</p><ActionForm action={createPaymentMethod} className="popover-form inline-form"><label>Agregar método<input name="name" maxLength={80} required placeholder="Ej. DeUna"/></label></ActionForm></div></section></AppShell>;}
