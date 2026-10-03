import { AppShell } from "@/components/app-shell";
import { Plus, Search } from "lucide-react";

export function ModulePage({ title, subtitle, columns, rows, action }: {
  title: string; subtitle: string; columns: string[]; rows: string[][]; action?: string;
}) {
  return <AppShell>
    <section className="page-head">
      <div><p className="eyebrow">WAVESS</p><h1>{title}</h1><p>{subtitle}</p></div>
      {action && <button className="primary-btn"><Plus size={17}/>{action}</button>}
    </section>
    <div className="card module-card">
      <div className="toolbar"><div className="search inner"><Search size={17}/><input placeholder={"Buscar en "+title.toLowerCase()+"..."}/></div><button className="filter-btn">Todos</button></div>
      <div className="table-scroll"><table><thead><tr>{columns.map(c=><th key={c}>{c}</th>)}</tr></thead><tbody>
        {rows.map((r,i)=><tr key={i}>{r.map((v,j)=><td key={j}>{j===0?<b>{v}</b>:v}</td>)}</tr>)}
      </tbody></table></div>
    </div>
  </AppShell>
}
