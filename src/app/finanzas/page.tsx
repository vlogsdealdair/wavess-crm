import { AppShell } from "@/components/app-shell";
import { createClient } from "@/lib/supabase/server";
import { ArrowDownRight, ArrowUpRight, CircleDollarSign, WalletCards } from "lucide-react";

export default async function Page(){
  const supabase=await createClient();
  const [{data:orders=[]},{data:expenses=[]}]=await Promise.all([
    supabase.from("orders").select("total,paid_amount,supplier_cost,shipping_cost,commission_cost,advertising_cost,other_cost,commercial_status"),
    supabase.from("expenses").select("amount")
  ]);
  const valid=(orders ?? []).filter((o:any)=>o.commercial_status!=="Cancelado");
  const sales=valid.reduce((s:number,o:any)=>s+Number(o.total),0);
  const collected=valid.reduce((s:number,o:any)=>s+Number(o.paid_amount),0);
  const direct=valid.reduce((s:number,o:any)=>s+Number(o.supplier_cost)+Number(o.shipping_cost)+Number(o.commission_cost)+Number(o.advertising_cost)+Number(o.other_cost),0);
  const expensesTotal=(expenses ?? []).reduce((s:number,e:any)=>s+Number(e.amount),0);
  const costs=direct+expensesTotal;
  const profit=sales-costs;
  const receivable=valid.reduce((s:number,o:any)=>s+Math.max(0,Number(o.total)-Number(o.paid_amount)),0);
  const cash=collected-costs;
  const money=(n:number)=>new Intl.NumberFormat("en-US",{style:"currency",currency:"USD"}).format(n);
  return <AppShell><section className="page-head"><div><p className="eyebrow">FINANZAS</p><h1>Resumen financiero</h1><p>Ingresos, costos, gastos, utilidad y caja calculados desde la operación.</p></div></section>
  <section className="metrics"><Metric title="Ventas" value={money(sales)} note="facturado" icon={<ArrowUpRight/>}/><Metric title="Costos + gastos" value={money(costs)} note="operación acumulada" icon={<ArrowDownRight/>}/><Metric title="Utilidad neta" value={money(profit)} note={sales?("Margen "+((profit/sales)*100).toFixed(1)+"%"):"Sin ventas"} icon={<CircleDollarSign/>}/><Metric title="Caja estimada" value={money(cash)} note={"Por cobrar "+money(receivable)} icon={<WalletCards/>}/></section>
  <div className="card finance-placeholder"><span className="kicker">FÓRMULA WAVESS</span><h3>Ventas − costo producto − envíos − comisiones − publicidad − gastos = utilidad neta</h3><div className="formula"><span>{money(sales)}</span><i>−</i><span>{money(costs)}</span><i>=</i><strong>{money(profit)}</strong></div></div>
  </AppShell>
}
function Metric({title,value,note,icon}:{title:string,value:string,note:string,icon:React.ReactNode}){return <div className="metric card"><div className="metric-icon">{icon}</div><div><p>{title}</p><h2>{value}</h2><div><b>En vivo</b><span>{note}</span></div></div></div>}
