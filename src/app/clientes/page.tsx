import { AppShell } from "@/components/app-shell";
import { createCustomer } from "@/app/actions";
import { createClient } from "@/lib/supabase/server";
import { Plus } from "lucide-react";

export default async function Page() {
  const supabase = await createClient();
  const { data: customers = [] } = await supabase.from("customers").select("*").order("created_at", { ascending: false });
  return <AppShell>
    <section className="page-head">
      <div><p className="eyebrow">CRM</p><h1>Clientes</h1><p>Historial, preferencias, segmentación y valor de cada cliente.</p></div>
      <details className="action-popover"><summary className="primary-btn"><Plus size={17}/> Nuevo cliente</summary>
        <form action={createCustomer} className="popover-form"><h3>Nuevo cliente</h3>
          <div className="form-grid">
            <label>Nombre<input name="full_name" required /></label><label>WhatsApp<input name="whatsapp" placeholder="+593..." /></label>
            <label>Instagram<input name="instagram" placeholder="@usuario" /></label><label>Talla<input name="shoe_size" /></label>
            <label>Marca preferida<input name="preferred_brand" /></label>
            <label>Segmento<select name="segment" defaultValue="Cliente nuevo"><option>Cliente nuevo</option><option>Cliente recurrente</option><option>Cliente VIP</option><option>Interesado sin compra</option></select></label>
          </div><label>Notas<textarea name="notes" rows={3}/></label><button className="primary-btn" type="submit">Guardar cliente</button>
        </form>
      </details>
    </section>
    <div className="card module-card"><div className="table-scroll"><table><thead><tr><th>Nombre</th><th>WhatsApp</th><th>Compras</th><th>Total gastado</th><th>Última compra</th><th>Talla</th><th>Segmento</th></tr></thead><tbody>
      {customers.length === 0 ? <tr><td colSpan={7} className="empty-cell">Aún no hay clientes. Crea el primero.</td></tr> :
        customers.map((c:any)=><tr key={c.id}><td><b>{c.full_name}</b></td><td>{c.whatsapp ?? "—"}</td><td>{c.purchases_count}</td><td>{"$"+Number(c.total_spent).toFixed(2)}</td><td>{c.last_purchase_at ? new Date(c.last_purchase_at).toLocaleDateString("es-EC") : "—"}</td><td>{c.shoe_size ?? "—"}</td><td><span className="badge blue">{c.segment}</span></td></tr>)}
    </tbody></table></div></div>
  </AppShell>;
}
