
"use client";
import {useState} from "react";
import {ActionForm} from "./action-form";
import {createProduct,updateProduct,createCombo,updateCombo} from "@/app/actions";
export type CatalogProduct={id:string;model:string;brand:string;sku:string|null;category:string;quality:string;sizes:string[];sale_price:number;cost_price:number;status:string;combo_items:{product_id:string;name:string;quantity:number;unit_cost:number}[]};
function Margin({price,cost}:{price:number;cost:number}){return <div className="margin-preview"><span>Costo <b>{"$"+cost.toFixed(2)}</b></span><span>Ganancia estimada <b>{"$"+(price-cost).toFixed(2)}</b></span><span>Margen <b>{price>0?((price-cost)/price*100).toFixed(1)+"%":"—"}</b></span><small>Antes de envío, comisiones, publicidad y gastos.</small></div>;}
export function ProductEditor({product}:{product?:CatalogProduct}){
 const [price,setPrice]=useState(Number(product?.sale_price??0));const [cost,setCost]=useState(Number(product?.cost_price??0));
 const combo=!!product?.combo_items?.length;
 return <ActionForm action={product?updateProduct:createProduct} className="popover-form inline-form">
 {product&&<input type="hidden" name="product_id" value={product.id}/>}
 <div className="form-grid">
 <label>SKU<input name="sku" defaultValue={product?.sku??""}/></label>
 <label>Nombre del producto<input name="model" defaultValue={product?.model} required/></label>
 <label>Marca<input name="brand" defaultValue={product?.brand} placeholder="Opcional"/></label>
 <label>Tipo / categoría<input name="category" defaultValue={product?.category??"Calzado"} placeholder="Calzado, ropa, accesorios…"/></label>
 <label>Calidad<select name="quality" defaultValue={product?.quality??"TOP QUALITY"}><option>TOP QUALITY</option><option>CALIDAD 1:1</option></select></label>
 <label>Tallas / variantes<input name="sizes" defaultValue={product?.sizes?.join(", ")} placeholder="Opcional: 38,39,40 o S,M,L"/></label>
 <label>Precio de venta<input name="sale_price" type="number" min="0" step="0.01" value={price} onChange={e=>setPrice(Number(e.target.value))} required/></label>
 <label>Costo de compra<input name="cost_price" type="number" min="0" step="0.01" value={cost} onChange={e=>setCost(Number(e.target.value))} readOnly={combo} required/></label>
 {product&&<label>Estado<select name="status" defaultValue={product.status}><option>Activo</option><option>Inactivo</option></select></label>}
 </div><Margin price={price} cost={cost}/>{combo&&<p>El costo del combo se calcula a partir de sus productos. Usa “Actualizar costos” en Combos.</p>}
 </ActionForm>;
}
export function ComboEditor({products,combo}:{products:CatalogProduct[];combo?:CatalogProduct}){
 const [items,setItems]=useState(combo?.combo_items.map(i=>({id:i.product_id,quantity:i.quantity}))??[{id:"",quantity:1},{id:"",quantity:1}]);const [price,setPrice]=useState(Number(combo?.sale_price??0));
 const cost=items.reduce((s,i)=>s+Number(products.find(p=>p.id===i.id)?.cost_price??0)*i.quantity,0);
 return <ActionForm action={combo?updateCombo:createCombo} className="popover-form inline-form">{combo&&<input type="hidden" name="product_id" value={combo.id}/>}<div className="form-grid"><label>Nombre del combo<input name="model" defaultValue={combo?.model} required placeholder="Ej. Tenis + medias"/></label><label>SKU<input name="sku" defaultValue={combo?.sku??""}/></label><label>Precio del combo<input name="sale_price" type="number" min="0.01" step="0.01" value={price} onChange={e=>setPrice(Number(e.target.value))} required/></label></div>
 {items.map((i,index)=><div className="combo-row" key={index}><label>Producto {index+1}<select name="component_id" required value={i.id} onChange={e=>setItems(items.map((x,j)=>j===index?{...x,id:e.target.value}:x))}><option value="">Seleccionar</option>{products.map(p=><option key={p.id} value={p.id}>{p.model+" · costo $"+Number(p.cost_price).toFixed(2)}</option>)}</select></label><label>Cantidad<input name="component_quantity" type="number" min="1" max="100" step="1" required value={i.quantity} onChange={e=>setItems(items.map((x,j)=>j===index?{...x,quantity:Number(e.target.value)}:x))}/></label>{items.length>2&&<button type="button" className="secondary-btn" onClick={()=>setItems(items.filter((_,j)=>j!==index))}>Quitar</button>}</div>)}
 <button type="button" className="secondary-btn" onClick={()=>setItems([...items,{id:"",quantity:1}])}>Agregar producto al combo</button><Margin price={price} cost={cost}/><p>Selecciona al menos dos productos distintos. El costo se guarda con los valores actuales.</p></ActionForm>;
}
