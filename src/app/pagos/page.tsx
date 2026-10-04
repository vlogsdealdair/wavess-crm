import {PaymentRowActions} from "@/components/payment-row-actions";
import {AppShell} from "@/components/app-shell";
import {ActionForm} from "@/components/action-form";
import {PaymentFields} from "@/components/payment-fields";
import {registerPayment,updatePayment,deletePayment} from "@/app/actions";
import {createClient} from "@/lib/supabase/server";
import {DEFAULT_METHODS} from "@/lib/payment-methods";
import Link from "next/link";
export default async function Page(){
 const s=await createClient();const [pr,or,mr]=await Promise.all([
 s.from("payments").select("id,amount,method,bank,reference,paid_at,orders(order_number,total,paid_amount,customers(full_name))").order("paid_at",{ascending:false}),
 s.from("orders").select("id,order_number,total,paid_amount,customers(full_name)").neq("payment_status","Pagado").neq("commercial_status","Cancelado").order("created_at",{ascending:false}),
 s.from("payment_methods").select("name").order("name")]);
 if(pr.error||or.error||mr.error)throw new Error("No se pudieron cargar los pagos");
 const methods=(mr.data??[]).map(m=>m.name);
 return <AppShell><section className="page-head"><div><p className="eyebrow">VENTAS</p><h1>Pagos</h1><p>Registra cobros y corrige pagos desde su fila. El saldo se recalcula automáticamente.</p></div><Link className="secondary-btn" href="/configuracion">Configurar métodos</Link></section>
 <section className="card editor-card"><h3>Registrar pago</h3><ActionForm action={registerPayment} className="popover-form inline-form" submitLabel="Registrar pago">
 <label>Pedido<select name="order_id" required><option value="">Seleccionar pedido</option>{(or.data??[]).map((o:any)=><option key={o.id} value={o.id}>{o.order_number+" · "+(o.customers?.full_name??"Cliente")+" · Saldo $"+(Number(o.total)-Number(o.paid_amount)).toFixed(2)}</option>)}</select></label>{methods.length?<PaymentFields methods={methods}/>:<p>Agrega un método en Configuración antes de registrar un cobro.</p>}</ActionForm></section>
 <div className="card module-card"><div className="table-scroll"><table><thead><tr>{["Fecha","Pedido","Cliente","Monto","Cómo se recibió","Banco","Acciones"].map(t=><th key={t}>{t}</th>)}</tr></thead><tbody>
 {(pr.data??[]).length===0?<tr><td colSpan={7} className="empty-cell">Aún no hay pagos.</td></tr>:(pr.data??[]).map((p:any)=>{
 const date=new Intl.DateTimeFormat("en-CA",{timeZone:"America/Guayaquil"}).format(new Date(p.paid_at));
 const opts=methods.includes(p.method)?methods:[...methods,p.method];
 return <tr key={p.id}><td>{date}</td><td>{p.orders?.order_number}{Number(p.orders?.paid_amount)>Number(p.orders?.total)&&<small className="cell-sub loss">Exceso cobrado: {"$"+(Number(p.orders.paid_amount)-Number(p.orders.total)).toFixed(2)}</small>}</td><td>{p.orders?.customers?.full_name}</td><td>{"$"+Number(p.amount).toFixed(2)}</td><td>{p.method}<small className="cell-sub">{p.reference}</small></td><td>{p.bank??"—"}</td><td>
 <PaymentRowActions methods={opts} payment={{id:p.id,amount:Number(p.amount),method:p.method,bank:p.bank,reference:p.reference,paid_date:date}}/> </td></tr>;})}</tbody></table></div></div></AppShell>;
}
