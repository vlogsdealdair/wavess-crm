import { AppShell } from "@/components/app-shell";
import { createExpense } from "@/app/actions";
import { createClient } from "@/lib/supabase/server";
import { Plus } from "lucide-react";

export default async function Page(){
  const supabase=await createClient();
  const {data:expenses=[]}=await supabase.from("expenses").select("*").order("expense_date",{ascending:false});
  const total=(expenses ?? []).reduce((s:number,e:any)=>s+Number(e.amount),0);
  return <AppShell><section className="page-head"><div><p className="eyebrow">FINANZAS</p><h1>Gastos</h1><p>Publicidad, envíos, comisiones y otros costos operativos.</p></div>
  <details className="action-popover"><summary className="primary-btn"><Plus size={17}/> Nuevo gasto</summary><form action={createExpense} className="popover-form"><h3>Registrar gasto</h3><div className="form-grid"><label>Categoría<select name="category"><option>Publicidad</option><option>Envío</option><option>Comisión</option><option>Operación</option><option>Otro</option></select></label><label>Fecha<input name="expense_date" type="date"/></label><label>Monto<input name="amount" type="number" min="0" step="0.01" required/></label></div><label>Descripción<input name="description" required/></label><button className="primary-btn" type="submit">Guardar gasto</button></form></details></section>
  <div className="card finance-placeholder"><span className="kicker">TOTAL REGISTRADO</span><h2>{"$"+total.toFixed(2)}</h2></div>
  <div className="card module-card"><div className="table-scroll"><table><thead><tr><th>Fecha</th><th>Categoría</th><th>Descripción</th><th>Monto</th></tr></thead><tbody>{(expenses ?? []).length===0?<tr><td colSpan={4} className="empty-cell">Aún no hay gastos.</td></tr>:(expenses ?? []).map((e:any)=><tr key={e.id}><td>{new Date(e.expense_date+"T12:00:00").toLocaleDateString("es-EC")}</td><td>{e.category}</td><td>{e.description}</td><td className="loss">{"$"+Number(e.amount).toFixed(2)}</td></tr>)}</tbody></table></div></div></AppShell>
}
