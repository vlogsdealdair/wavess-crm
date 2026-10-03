import { AppShell } from "@/components/app-shell";
import { createClient } from "@/lib/supabase/server";
import { ArrowRight, CircleDollarSign, Clock3, ShoppingBag, TrendingUp, UsersRound } from "lucide-react";

export default async function DashboardPage() {
  const supabase = await createClient();
  const [{data:orders=[]},{data:customers=[]},{data:leads=[]}] = await Promise.all([
    supabase.from("orders").select("id,order_number,total,paid_amount,supplier_cost,shipping_cost,commission_cost,advertising_cost,other_cost,payment_status,logistics_status,commercial_status,ordered_at,customers(full_name),order_items(product_name)").order("ordered_at",{ascending:false}),
    supabase.from("customers").select("id,created_at"),
    supabase.from("leads").select("id,status,last_contact_at,created_at"),
  ]);
  const valid=(orders ?? []).filter((o:any)=>o.commercial_status!=="Cancelado");
  const sales=valid.reduce((s:number,o:any)=>s+Number(o.total),0);
  const profit=valid.reduce((s:number,o:any)=>s+Number(o.total)-Number(o.supplier_cost)-Number(o.shipping_cost)-Number(o.commission_cost)-Number(o.advertising_cost)-Number(o.other_cost),0);
  const receivable=valid.reduce((s:number,o:any)=>s+Math.max(0,Number(o.total)-Number(o.paid_amount)),0);
  const payable=valid.filter((o:any)=>["Pendiente de compra","Comprado","En tránsito"].includes(o.logistics_status)).reduce((s:number,o:any)=>s+Number(o.supplier_cost),0);
  const available=valid.reduce((s:number,o:any)=>s+Number(o.paid_amount)-Number(o.supplier_cost)-Number(o.shipping_cost)-Number(o.commission_cost)-Number(o.advertising_cost)-Number(o.other_cost),0);
  const attention={
    payments:valid.filter((o:any)=>o.payment_status!=="Pagado").length,
    purchase:valid.filter((o:any)=>o.logistics_status==="Pendiente de compra" && o.payment_status!=="Pendiente").length,
    received:valid.filter((o:any)=>o.logistics_status==="Recibido").length,
    followup:(leads ?? []).filter((l:any)=>l.status!=="Ganado"&&l.status!=="Perdido").length,
  };
  const money=(n:number)=>new Intl.NumberFormat("en-US",{style:"currency",currency:"USD"}).format(n);

  return <AppShell>
    <section className="page-head">
      <div><p className="eyebrow">RESUMEN DEL NEGOCIO</p><h1>Buenos días, Leandro 👋</h1><p>Datos actualizados desde tu operación en WAVESS.</p></div>
    </section>
    <section className="metrics">
      <Metric title="Ventas" value={money(sales)} note="ventas acumuladas" icon={<TrendingUp/>}/>
      <Metric title="Utilidad" value={money(profit)} note={sales?("Margen "+((profit/sales)*100).toFixed(1)+"%"):"Sin ventas"} icon={<CircleDollarSign/>}/>
      <Metric title="Pedidos" value={String(valid.length)} note="pedidos activos" icon={<ShoppingBag/>}/>
      <Metric title="Clientes" value={String((customers ?? []).length)} note="registrados en CRM" icon={<UsersRound/>}/>
    </section>
    <section className="grid-2">
      <div className="money-card"><div><p>Dinero disponible estimado</p><h2>{money(available)}</h2><div className="money-row"><span><small>Por cobrar</small><b>{money(receivable)}</b></span><span><small>Compras comprometidas</small><b>{money(payable)}</b></span></div></div><a href="/finanzas" className="money-link">Ver finanzas <ArrowRight size={16}/></a></div>
      <div className="card attention"><div className="card-title"><div><span className="kicker">OPERACIONES</span><h3>Requiere atención</h3></div><Clock3 size={20}/></div>
        <Attention color="red" value={attention.payments} label="Pedidos con saldo pendiente"/>
        <Attention color="orange" value={attention.purchase} label="Pagados/abonados sin comprar"/>
        <Attention color="yellow" value={attention.received} label="Productos recibidos"/>
        <Attention color="blue" value={attention.followup} label="Leads para seguimiento"/>
      </div>
    </section>
    <section className="card table-card"><div className="card-title"><div><span className="kicker">VENTAS</span><h3>Pedidos recientes</h3></div><a className="text-btn" href="/pedidos">Ver todos <ArrowRight size={15}/></a></div>
      <div className="table-scroll"><table><thead><tr><th>Pedido</th><th>Cliente</th><th>Producto</th><th>Total</th><th>Pago</th><th>Logística</th></tr></thead><tbody>
        {(orders ?? []).slice(0,8).map((o:any)=><tr key={o.id}><td><b>{o.order_number}</b></td><td>{o.customers?.full_name??"—"}</td><td>{o.order_items?.[0]?.product_name??"—"}</td><td><b>{money(Number(o.total))}</b></td><td><span className={"badge "+(o.payment_status==="Pagado"?"green":"amber")}>{o.payment_status}</span></td><td><span className="badge blue">{o.logistics_status}</span></td></tr>)}
        {(orders ?? []).length===0&&<tr><td colSpan={6} className="empty-cell">Tu dashboard se llenará automáticamente cuando registres pedidos.</td></tr>}
      </tbody></table></div>
    </section>
  </AppShell>
}

function Metric({title,value,note,icon}:{title:string,value:string,note:string,icon:React.ReactNode}) {
  return <div className="metric card"><div className="metric-icon">{icon}</div><div><p>{title}</p><h2>{value}</h2><div><b>En vivo</b><span>{note}</span></div></div></div>
}
function Attention({color,value,label}:{color:string,value:number,label:string}) {
  return <a href={label.includes("Leads")?"/leads":"/pedidos"} className="attention-row"><span className={"attention-num "+color}>{value}</span><span>{label}</span><ArrowRight size={15}/></a>
}
