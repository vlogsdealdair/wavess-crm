import { AppShell } from "@/components/app-shell";
import { registerPayment } from "@/app/actions";
import { createClient } from "@/lib/supabase/server";
import { Plus } from "lucide-react";

export default async function Page() {
  const supabase = await createClient();
  const [{data:payments=[]},{data:orders=[]}] = await Promise.all([
    supabase.from("payments").select("id,amount,method,reference,paid_at,orders(order_number,customers(full_name))").order("paid_at",{ascending:false}),
    supabase.from("orders").select("id,order_number,total,paid_amount,customers(full_name)").neq("payment_status","Pagado").neq("commercial_status","Cancelado").order("created_at",{ascending:false})
  ]);

  return <AppShell>
    <section className="page-head"><div><p className="eyebrow">VENTAS</p><h1>Pagos</h1><p>Registra abonos y WAVESS actualiza automáticamente el saldo del pedido.</p></div>
      <details className="action-popover"><summary className="primary-btn"><Plus size={17}/> Registrar pago</summary>
        <form action={registerPayment} className="popover-form"><h3>Nuevo pago</h3>
          <label>Pedido<select name="order_id" required><option value="">Seleccionar</option>{(orders ?? []).map((o:any)=><option key={o.id} value={o.id}>{o.order_number+" · "+(o.customers?.full_name ?? "Cliente")+" · Saldo $"+Math.max(0,Number(o.total)-Number(o.paid_amount)).toFixed(2)}</option>)}</select></label>
          <div className="form-grid"><label>Monto<input name="amount" type="number" min="0.01" step="0.01" required/></label>
          <label>Método<select name="method"><option>Transferencia</option><option>Efectivo</option><option>Tarjeta</option><option>Otro</option></select></label></div>
          <label>Referencia<input name="reference"/></label><button className="primary-btn" type="submit">Registrar pago</button>
        </form>
      </details>
    </section>
    <div className="card module-card"><div className="table-scroll"><table><thead><tr><th>Fecha</th><th>Pedido</th><th>Cliente</th><th>Monto</th><th>Método</th><th>Referencia</th></tr></thead><tbody>
      {(payments ?? []).length===0?<tr><td colSpan={6} className="empty-cell">Aún no hay pagos registrados.</td></tr>:(payments ?? []).map((p:any)=><tr key={p.id}><td>{new Date(p.paid_at).toLocaleString("es-EC")}</td><td><b>{p.orders?.order_number ?? "—"}</b></td><td>{p.orders?.customers?.full_name ?? "—"}</td><td className="profit">{"$"+Number(p.amount).toFixed(2)}</td><td>{p.method ?? "—"}</td><td>{p.reference ?? "—"}</td></tr>)}
    </tbody></table></div></div>
  </AppShell>;
}
