import { AppShell } from "@/components/app-shell";
import { createOrder, updateOrderStatus } from "@/app/actions";
import { createClient } from "@/lib/supabase/server";
import { ActionForm } from "@/components/action-form";
import { Plus } from "lucide-react";

export default async function Page() {
  const supabase = await createClient();
  const [{ data: orders = [] }, { data: customers = [] }, { data: products = [] }, { data: suppliers = [] }] = await Promise.all([
    supabase.from("orders").select("id,order_number,commercial_status,payment_status,logistics_status,total,paid_amount,supplier_cost,shipping_cost,customers(full_name),suppliers(name),order_items(product_name,size)").order("created_at",{ascending:false}),
    supabase.from("customers").select("id,full_name").order("full_name"),
    supabase.from("products").select("id,model,sale_price,sizes,cost_price,combo_items").eq("status","Activo").order("model"),
    supabase.from("suppliers").select("id,name").eq("status","Activo").order("name"),
  ]);

  return <AppShell>
    <section className="page-head">
      <div><p className="eyebrow">VENTAS</p><h1>Pedidos</h1><p>Estado comercial, pago y logística siempre separados.</p></div>
      <details className="action-popover"><summary className="primary-btn"><Plus size={17}/> Nuevo pedido</summary>
        <ActionForm action={createOrder} className="popover-form wide"><h3>Crear pedido</h3>
          <div className="form-grid">
            <label>Cliente<select name="customer_id" required><option value="">Seleccionar</option>{(customers ?? []).map((c:any)=><option key={c.id} value={c.id}>{c.full_name}</option>)}</select></label>
            <label>Producto<select name="product_id" required><option value="">Seleccionar</option>{(products ?? []).map((p:any)=><option key={p.id} value={p.id}>{p.model+(p.combo_items?.length?" [Combo]":"")} — {"$"+Number(p.sale_price).toFixed(2)}</option>)}</select></label>
            <label>Proveedor<select name="supplier_id"><option value="">Sin asignar</option>{(suppliers ?? []).map((s:any)=><option key={s.id} value={s.id}>{s.name}</option>)}</select></label>
            <label>Talla / variantes<input name="size" placeholder="Opcional: tenis 42, camiseta M"/></label>
            <label>Cantidad<input name="quantity" type="number" min="1" defaultValue="1"/></label>
            <label>Precio venta<input name="unit_price" type="number" min="0" step="0.01" placeholder="Usa precio del producto"/></label>
            <label>Costo por unidad<input name="unit_cost" type="number" min="0" step="0.01" placeholder="Usa costo del producto o combo"/></label>
            <label>Envío<input name="shipping_cost" type="number" min="0" step="0.01" defaultValue="0"/></label>
          </div>
          <label>Notas<textarea name="notes" rows={2}/></label>
          </ActionForm>
      </details>
    </section>

    <div className="card module-card"><div className="table-scroll"><table><thead><tr>
      <th>Pedido</th><th>Cliente</th><th>Producto</th><th>Total</th><th>Pago</th><th>Comercial</th><th>Logística</th><th>Utilidad est.</th>
    </tr></thead><tbody>
      {(orders ?? []).length===0?<tr><td colSpan={8} className="empty-cell">Aún no hay pedidos. Crea clientes, productos y luego tu primer pedido.</td></tr>:
      (orders ?? []).map((o:any)=>{
        const item=o.order_items?.[0];
        const profit=Number(o.total)-Number(o.supplier_cost)-Number(o.shipping_cost);
        return <tr key={o.id}>
          <td><b>{o.order_number}</b></td><td>{o.customers?.full_name ?? "—"}</td><td>{item?.product_name ?? "—"} {item?.size ? "· "+item.size : ""}</td>
          <td><b>{"$"+Number(o.total).toFixed(2)}</b><small className="cell-sub">{"Saldo $"+Math.max(0,Number(o.total)-Number(o.paid_amount)).toFixed(2)}</small></td>
          <td><span className={"badge "+(o.payment_status==="Pagado"?"green":o.payment_status==="Pendiente"?"amber":"blue")}>{o.payment_status}</span></td>
          <td>
            <ActionForm action={updateOrderStatus} className="status-form"><input type="hidden" name="order_id" value={o.id}/><input type="hidden" name="field" value="commercial_status"/>
              <select name="value" defaultValue={o.commercial_status}><option>Nuevo</option><option>Confirmado</option><option>Cancelado</option><option>Completado</option></select>
            </ActionForm>
          </td>
          <td>
            <ActionForm action={updateOrderStatus} className="status-form"><input type="hidden" name="order_id" value={o.id}/><input type="hidden" name="field" value="logistics_status"/>
              <select name="value" defaultValue={o.logistics_status}><option>Pendiente de compra</option><option>Comprado</option><option>En tránsito</option><option>Recibido</option><option>Listo para despacho</option><option>Despachado</option><option>Entregado</option></select>
            </ActionForm>
          </td>
          <td className={profit>=0?"profit":"loss"}>{"$"+profit.toFixed(2)}</td>
        </tr>
      })}
    </tbody></table></div></div>
  </AppShell>;
}
