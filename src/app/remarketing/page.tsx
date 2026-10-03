import { AppShell } from "@/components/app-shell";
import { createClient } from "@/lib/supabase/server";
import { Megaphone } from "lucide-react";

export default async function Page() {
  const supabase = await createClient();
  const { data: customers = [] } = await supabase.from("customers").select("id,full_name,whatsapp,segment,last_purchase_at,total_spent,purchases_count").order("last_purchase_at",{ascending:true,nullsFirst:true});
  const now = Date.now();
  const days = (date:string|null) => date ? Math.floor((now-new Date(date).getTime())/86400000) : 9999;
  const segments = [
    ["Clientes VIP", customers.filter((c:any)=>c.segment==="Cliente VIP")],
    ["Recurrentes", customers.filter((c:any)=>c.purchases_count>=2)],
    ["Inactivos 30 días", customers.filter((c:any)=>days(c.last_purchase_at)>=30 && days(c.last_purchase_at)<60)],
    ["Inactivos 60 días", customers.filter((c:any)=>days(c.last_purchase_at)>=60 && days(c.last_purchase_at)<90)],
    ["Inactivos 90+ días", customers.filter((c:any)=>days(c.last_purchase_at)>=90)],
  ];
  return <AppShell>
    <section className="page-head"><div><p className="eyebrow">CRM</p><h1>Remarketing</h1><p>Segmentos listos para reactivar clientes y aumentar recurrencia.</p></div></section>
    <section className="remarketing-grid">
      {segments.map(([label,list]:any)=><div className="card segment-card" key={label}><div className="metric-icon"><Megaphone size={19}/></div><div><span className="kicker">SEGMENTO</span><h3>{label}</h3><strong>{list.length}</strong><small> clientes</small></div></div>)}
    </section>
    <div className="card module-card"><div className="table-scroll"><table><thead><tr><th>Cliente</th><th>WhatsApp</th><th>Compras</th><th>Total gastado</th><th>Última compra</th><th>Segmento</th></tr></thead><tbody>
      {customers.length===0?<tr><td colSpan={6} className="empty-cell">No hay clientes para remarketing todavía.</td></tr>:customers.map((c:any)=><tr key={c.id}><td><b>{c.full_name}</b></td><td>{c.whatsapp ?? "—"}</td><td>{c.purchases_count}</td><td>{"$"+Number(c.total_spent).toFixed(2)}</td><td>{c.last_purchase_at?new Date(c.last_purchase_at).toLocaleDateString("es-EC"):"Sin compra"}</td><td><span className="badge blue">{c.segment}</span></td></tr>)}
    </tbody></table></div></div>
  </AppShell>;
}
