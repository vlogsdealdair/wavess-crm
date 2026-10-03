
import { AppShell } from "@/components/app-shell";
import { ActionForm } from "@/components/action-form";
import { registerPayment,createPaymentMethod } from "@/app/actions";
import { createClient } from "@/lib/supabase/server";
import { DEFAULT_METHODS } from "@/lib/payment-methods";
export default async function Page(){
 const s=await createClient();
 const [pr,or,mr]=await Promise.all([
 s.from("payments").select("id,amount,method,bank,reference,paid_at,orders(order_number,customers(full_name))").order("paid_at",{ascending:false}),
 s.from("orders").select("id,order_number,total,paid_amount,customers(full_name)").neq("payment_status","Pagado").neq("commercial_status","Cancelado").order("created_at",{ascending:false}),
 s.from("payment_methods").select("name").order("name")]);
 if(pr.error||or.error||mr.error) throw new Error("No se pudieron cargar los pagos");
 const methods=[...DEFAULT_METHODS,...(mr.data??[]).map(m=>m.name)];
 return <AppShell><section className="page-head"><div><p className="eyebrow">VENTAS</p><h1>Pagos</h1><p>Registra abonos, identifica el método y consulta el saldo actualizado.</p></div></section>
 <section className="grid-2"><div className="card editor-card"><h3>Registrar pago</h3>
 <ActionForm action={registerPayment} className="popover-form inline-form">
 <label>Pedido<select name="order_id" required><option value="">Seleccionar pedido</option>{(or.data??[]).map((o:any)=><option key={o.id} value={o.id}>{o.order_number+" · "+(o.customers?.full_name??"Cliente")+" · Saldo $"+(Number(o.total)-Number(o.paid_amount)).toFixed(2)}</option>)}</select></label>
 <div className="form-grid"><label>Monto<input name="amount" type="number" min="0.01" step="0.01" required/></label><label>Método<select name="method" required>{methods.map(m=><option key={m}>{m}</option>)}</select></label>
 <label>Banco / entidad<input name="bank" placeholder="Banco Pichincha, Guayaquil…"/></label><label>Fecha del pago<input name="paid_date" type="date" defaultValue={new Intl.DateTimeFormat("en-CA",{timeZone:"America/Guayaquil"}).format(new Date())} required/></label></div>
 <label>Referencia / comprobante<input name="reference" placeholder="Número de transferencia o depósito"/></label><p>Para transferencias y depósitos, banco y referencia son obligatorios. El monto no puede superar el saldo.</p>
 </ActionForm></div><div className="card editor-card"><h3>Métodos de pago</h3><p>{methods.join(" · ")}</p><ActionForm action={createPaymentMethod} className="popover-form inline-form"><label>Nuevo método<input name="name" maxLength={80} required placeholder="Ej. DeUna"/></label></ActionForm></div></section>
 <div className="card module-card"><div className="table-scroll"><table><thead><tr>{["Fecha","Pedido","Cliente","Monto","Método","Banco","Referencia"].map(t=><th key={t}>{t}</th>)}</tr></thead><tbody>
 {(pr.data??[]).length===0?<tr><td colSpan={7} className="empty-cell">Aún no hay pagos registrados.</td></tr>:(pr.data??[]).map((p:any)=><tr key={p.id}><td>{new Date(p.paid_at).toLocaleDateString("es-EC",{timeZone:"America/Guayaquil"})}</td><td>{p.orders?.order_number}</td><td>{p.orders?.customers?.full_name}</td><td>{"$"+Number(p.amount).toFixed(2)}</td><td>{p.method}</td><td>{p.bank??"—"}</td><td>{p.reference??"—"}</td></tr>)}</tbody></table></div></div></AppShell>;
}
