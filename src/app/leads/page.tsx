import {RecordControls} from "@/components/record-controls";
import { ActionForm } from "@/components/action-form";
import { AppShell } from "@/components/app-shell";
import { createLead, updateLeadStatus } from "@/app/actions";
import { createClient } from "@/lib/supabase/server";
import { Plus } from "lucide-react";

export default async function Page() {
  const supabase = await createClient();
  const { data: leads = [] } = await supabase.from("leads").select("*").order("created_at",{ascending:false});
  return <AppShell>
    <section className="page-head"><div><p className="eyebrow">CRM</p><h1>Leads</h1><p>Prospectos, seguimiento y próximas acciones comerciales.</p></div>
      <details className="action-popover"><summary className="primary-btn"><Plus size={17}/> Nuevo lead</summary>
        <ActionForm action={createLead} className="popover-form"><h3>Nuevo lead</h3><div className="form-grid">
          <label>Nombre<input name="full_name" required/></label><label>WhatsApp<input name="whatsapp"/></label>
          <label>Instagram<input name="instagram"/></label><label>Origen<input name="source" placeholder="Instagram, WhatsApp..."/></label>
          <label>Producto de interés<input name="interested_product"/></label><label>Talla<input name="shoe_size"/></label>
          <label>Estado<select name="status"><option>Nuevo</option><option>Contactado</option><option>Seguimiento</option><option>Ganado</option><option>Perdido</option></select></label>
          <label>Próximo seguimiento<input name="next_follow_up_at" type="datetime-local"/></label>
        </div></ActionForm>
      </details>
    </section>
    <div className="card module-card"><div className="table-scroll"><table><thead><tr><th>Nombre</th><th>Contacto</th><th>Interés</th><th>Talla</th><th>Origen</th><th>Seguimiento</th><th>Estado</th><th>Acciones</th></tr></thead><tbody>
      {(leads ?? []).length===0?<tr><td colSpan={8} className="empty-cell">Aún no hay leads.</td></tr>:(leads ?? []).map((l:any)=><tr key={l.id}>
        <td><b>{l.full_name}</b></td><td>{l.whatsapp ?? l.instagram ?? "—"}</td><td>{l.interested_product ?? "—"}</td><td>{l.shoe_size ?? "—"}</td><td>{l.source ?? "—"}</td>
        <td>{l.next_follow_up_at ? new Date(l.next_follow_up_at).toLocaleString("es-EC") : "—"}</td>
        <td><ActionForm action={updateLeadStatus} className="status-form"><input type="hidden" name="lead_id" value={l.id}/><select name="status" defaultValue={l.status}><option>Nuevo</option><option>Contactado</option><option>Seguimiento</option><option>Ganado</option><option>Perdido</option></select></ActionForm></td><td><RecordControls table="leads" row={l} label={l.full_name} fields={[{"key":"full_name","label":"Nombre","type":"text","required":true},{"key":"whatsapp","label":"WhatsApp","type":"text","required":false},{"key":"instagram","label":"Instagram","type":"text","required":false},{"key":"source","label":"Origen","type":"text","required":false},{"key":"interested_product","label":"Producto de interés","type":"text","required":false},{"key":"shoe_size","label":"Talla","type":"text","required":false},{"key":"status","label":"Estado","type":"text","required":false,"options":["Nuevo","Contactado","Seguimiento","Ganado","Perdido"]},{"key":"next_follow_up_at","label":"Seguimiento","type":"datetime-local","required":false}]}/></td>
      </tr>)}
    </tbody></table></div></div>
  </AppShell>;
}
