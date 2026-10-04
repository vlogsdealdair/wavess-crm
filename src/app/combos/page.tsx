import {DeleteRecord} from "@/components/record-controls";

import {AppShell} from "@/components/app-shell";
import {ComboEditor,ProductEditor,type CatalogProduct} from "@/components/product-editor";
import {ActionForm} from "@/components/action-form";
import {refreshComboCost} from "@/app/actions";
import {createClient} from "@/lib/supabase/server";
export default async function Page(){
 const s=await createClient();const {data,error}=await s.from("products").select("*").order("model");if(error) throw new Error(error.message);
 const products=(data??[]) as CatalogProduct[];const combos=products.filter(p=>p.combo_items.length>0);
 return <AppShell><section className="page-head"><div><p className="eyebrow">CATÁLOGO</p><h1>Combos</h1><p>Combina productos, define el precio del paquete y calcula la ganancia.</p></div></section>
 <details className="card editor-card"><summary className="primary-btn">Nuevo combo</summary><ComboEditor products={products.filter(p=>p.status==="Activo"&&!p.combo_items.length)}/></details>
 <section className="grid-2">{combos.map(p=><div className="card editor-card" key={p.id}><h3>{p.model}</h3><ul>{p.combo_items.map(i=><li key={i.product_id}>{i.quantity+" × "+i.name+" · $"+(i.unit_cost*i.quantity).toFixed(2)}</li>)}</ul><p>{"Venta $"+Number(p.sale_price).toFixed(2)+" · Costo $"+Number(p.cost_price).toFixed(2)}</p><h3>{"Ganancia estimada $"+(Number(p.sale_price)-Number(p.cost_price)).toFixed(2)}</h3><p>{"Margen "+(Number(p.sale_price)>0?((Number(p.sale_price)-Number(p.cost_price))/Number(p.sale_price)*100).toFixed(1)+"%":"—")+" · "+p.status}</p><details><summary className="text-btn">Editar composición</summary><ComboEditor combo={p} products={products.filter(p=>p.status==="Activo"&&!p.combo_items.length)}/></details><details><summary className="text-btn">Editar precio y estado</summary><ProductEditor product={p}/></details><details><summary className="text-btn">Actualizar costos desde productos</summary><ActionForm action={refreshComboCost} className="popover-form inline-form"><input type="hidden" name="product_id" value={p.id}/><p>Recalcula con los costos actuales. Los pedidos ya creados conservan sus costos.</p></ActionForm></details><DeleteRecord table="products" id={p.id} label={p.model} warning="Se elimina el combo del catálogo. Los pedidos anteriores conservan su composición y costos."/></div>)}</section>{!combos.length&&<p>Aún no hay combos. Primero crea al menos dos productos individuales.</p>}<p>Para vender un combo, selecciónalo en “Nuevo pedido”. Indica tallas de cada producto en Variantes y notas.</p></AppShell>;
}
