import {DeleteRecord} from "@/components/record-controls";

import {AppShell} from "@/components/app-shell";
import {ProductEditor,type CatalogProduct} from "@/components/product-editor";
import {createClient} from "@/lib/supabase/server";
export default async function Page(){
 const s=await createClient();const {data,error}=await s.from("products").select("*").order("created_at",{ascending:false});if(error) throw new Error(error.message);
 const products=(data??[]) as CatalogProduct[];
 return <AppShell><section className="page-head"><div><p className="eyebrow">CATÁLOGO</p><h1>Productos</h1><p>Agrega calzado, ropa, accesorios u otros productos. Registra costo y precio para ver tu margen.</p></div><a href="/combos" className="secondary-btn">Crear combos</a></section>
 <details className="card editor-card"><summary className="primary-btn">Nuevo producto</summary><ProductEditor/></details>
 <div className="card module-card"><div className="table-scroll"><table><thead><tr>{["Producto","Categoría","Costo","Venta","Ganancia est.","Margen","Estado","Acción"].map(t=><th key={t}>{t}</th>)}</tr></thead><tbody>
 {products.length===0?<tr><td colSpan={8} className="empty-cell">Crea tu primer producto con “Nuevo producto”.</td></tr>:products.map(p=><tr key={p.id}><td><b>{p.model}</b><small className="cell-sub">{p.sku??p.brand}</small></td><td>{p.category}</td><td>{"$"+Number(p.cost_price).toFixed(2)}</td><td>{"$"+Number(p.sale_price).toFixed(2)}</td><td>{"$"+(Number(p.sale_price)-Number(p.cost_price)).toFixed(2)}</td><td>{Number(p.sale_price)>0?((Number(p.sale_price)-Number(p.cost_price))/Number(p.sale_price)*100).toFixed(1)+"%":"—"}</td><td>{p.status}</td><td><details><summary className="text-btn">Editar</summary><ProductEditor product={p}/></details><DeleteRecord table="products" id={p.id} label={p.model} warning="Los pedidos anteriores conservan el nombre y costo. Si este producto forma parte de un combo, revisa su composición."/></td></tr>)}
 </tbody></table></div></div><p>Estos márgenes son estimados antes de envío y gastos. Los pedidos guardan el costo real de cada venta.</p></AppShell>;
}
