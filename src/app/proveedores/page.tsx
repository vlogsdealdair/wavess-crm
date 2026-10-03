import { AppShell } from "@/components/app-shell";
import { createSupplier } from "@/app/actions";
import { createClient } from "@/lib/supabase/server";
import { Plus } from "lucide-react";

export default async function Page() {
  const supabase = await createClient();
  const { data: suppliers = [] } = await supabase.from("suppliers").select("*").order("created_at", { ascending: false });
  return <AppShell>
    <section className="page-head"><div><p className="eyebrow">OPERACIONES</p><h1>Proveedores</h1><p>Controla contactos, calidad y tiempos de entrega.</p></div>
      <details className="action-popover"><summary className="primary-btn"><Plus size={17}/> Nuevo proveedor</summary>
        <form action={createSupplier} className="popover-form"><h3>Nuevo proveedor</h3><div className="form-grid">
          <label>Proveedor<input name="name" required /></label><label>Contacto<input name="contact_name" /></label><label>WhatsApp<input name="whatsapp" /></label>
          <label>Calidad<input name="quality" placeholder="TOP QUALITY / 1:1" /></label><label>Entrega promedio (días)<input name="average_delivery_days" type="number" min="0" /></label>
        </div><button className="primary-btn" type="submit">Guardar proveedor</button></form>
      </details>
    </section>
    <div className="card module-card"><div className="table-scroll"><table><thead><tr><th>Proveedor</th><th>Contacto</th><th>WhatsApp</th><th>Calidad</th><th>Entrega</th><th>Estado</th></tr></thead><tbody>
      {(suppliers ?? []).length===0?<tr><td colSpan={6} className="empty-cell">Aún no hay proveedores.</td></tr>:(suppliers ?? []).map((s:any)=><tr key={s.id}><td><b>{s.name}</b></td><td>{s.contact_name ?? "—"}</td><td>{s.whatsapp ?? "—"}</td><td>{s.quality ?? "—"}</td><td>{s.average_delivery_days ? s.average_delivery_days+" días" : "—"}</td><td><span className="badge green">{s.status}</span></td></tr>)}
    </tbody></table></div></div>
  </AppShell>;
}
