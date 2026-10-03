import { AppShell } from "@/components/app-shell";
import { createProduct } from "@/app/actions";
import { createClient } from "@/lib/supabase/server";
import { Plus } from "lucide-react";

export default async function Page() {
  const supabase = await createClient();
  const { data: products = [] } = await supabase.from("products").select("*").order("created_at", { ascending: false });
  return <AppShell>
    <section className="page-head"><div><p className="eyebrow">CATÁLOGO</p><h1>Productos</h1><p>Catálogo, precios, calidades y tallas disponibles.</p></div>
      <details className="action-popover"><summary className="primary-btn"><Plus size={17}/> Nuevo producto</summary>
        <form action={createProduct} className="popover-form"><h3>Nuevo producto</h3><div className="form-grid">
          <label>SKU<input name="sku" placeholder="NK-DNK-PND"/></label><label>Modelo<input name="model" required /></label>
          <label>Marca<input name="brand" required /></label><label>Calidad<select name="quality"><option>TOP QUALITY</option><option>CALIDAD 1:1</option></select></label>
          <label>Tallas<input name="sizes" placeholder="36,37,38,39,40,41,42"/></label><label>Precio de venta<input name="sale_price" type="number" min="0" step="0.01" required /></label>
        </div><button className="primary-btn" type="submit">Guardar producto</button></form>
      </details>
    </section>
    <div className="card module-card"><div className="table-scroll"><table><thead><tr><th>SKU</th><th>Modelo</th><th>Marca</th><th>Calidad</th><th>Tallas</th><th>Precio</th><th>Estado</th></tr></thead><tbody>
      {(products ?? []).length===0?<tr><td colSpan={7} className="empty-cell">Aún no hay productos.</td></tr>:(products ?? []).map((p:any)=><tr key={p.id}><td><b>{p.sku ?? "—"}</b></td><td>{p.model}</td><td>{p.brand}</td><td>{p.quality}</td><td>{(p.sizes ?? []).join(", ") || "—"}</td><td>{"$"+Number(p.sale_price).toFixed(2)}</td><td><span className="badge green">{p.status}</span></td></tr>)}
    </tbody></table></div></div>
  </AppShell>;
}
