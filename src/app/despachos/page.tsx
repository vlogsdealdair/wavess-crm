import {AppShell} from "@/components/app-shell";
import {ActionForm} from "@/components/action-form";
import {updateDelivery,dispatchOrder} from "@/app/actions";
import {createClient} from "@/lib/supabase/server";
import Link from "next/link";
function missing(o:any){
 const fields=[];
 if(!o.delivery_type)fields.push("tipo de entrega");
 if(!o.delivery_recipient?.trim())fields.push("destinatario");
 if(!o.delivery_phone?.trim())fields.push("teléfono");
 if(!o.delivery_city?.trim())fields.push("ciudad");
 if(o.delivery_type!=="Retiro"&&!o.delivery_address?.trim())fields.push("dirección");
 if(o.delivery_type==="Nacional"&&!o.delivery_carrier?.trim())fields.push("transportista");
 return fields;
}
export default async function Page({searchParams}:{searchParams:Promise<{estado?:string;ciudad?:string;tipo?:string}>}){
 const params=await searchParams;const s=await createClient();
 const {data,error}=await s.from("orders").select("id,order_number,payment_status,paid_amount,total,logistics_status,delivery_type,delivery_city,delivery_address,delivery_recipient,delivery_phone,delivery_notes,delivery_carrier,tracking_number,customers(full_name,whatsapp),order_items(product_name,size,quantity)").neq("commercial_status","Cancelado").order("created_at",{ascending:false});
 if(error)throw new Error("No se pudieron cargar los despachos");
 const all=data??[];const classify=(o:any)=>o.logistics_status==="Entregado"?"entregados":o.logistics_status==="Despachado"?"enviados":!["Recibido","Listo para despacho"].includes(o.logistics_status)?"por-recibir":Number(o.paid_amount)<Number(o.total)||missing(o).length?"bloqueados":"listos";
 const state=params.estado??"pendientes";
 const orders=all.filter(o=>(state==="todos"||state==="pendientes"?!["enviados","entregados"].includes(classify(o))||state==="todos":classify(o)===state)&&(!params.ciudad||o.delivery_city===params.ciudad)&&(!params.tipo||o.delivery_type===params.tipo));
 const cities=[...new Set(all.map(o=>o.delivery_city).filter(Boolean))].sort();
 return <AppShell><section className="page-head"><div><p className="eyebrow">VENTAS Y ENTREGAS</p><h1>Despachos</h1><p>Completa dónde entregar. Despacha desde aquí cuando el producto esté recibido y pagado.</p></div></section>
 <form className="form-grid card editor-card"><label>Mostrar<select name="estado" defaultValue={state}><option value="pendientes">Pendientes</option><option value="listos">Listos para salir</option><option value="bloqueados">Falta pago o dirección</option><option value="por-recibir">Producto por recibir</option><option value="enviados">Enviados</option><option value="entregados">Entregados</option><option value="todos">Todos</option></select></label><label>Ciudad<select name="ciudad" defaultValue={params.ciudad??""}><option value="">Todas</option>{cities.map(c=><option key={c} value={c!}>{c}</option>)}</select></label><label>Entrega<select name="tipo" defaultValue={params.tipo??""}><option value="">Todas</option><option value="Local">Cercana / local</option><option value="Nacional">A distancia / otra ciudad</option><option value="Retiro">Retiro</option></select></label><button className="primary-btn">Filtrar</button></form>
 <section className="help-grid">{orders.length===0?<div className="card editor-card">No hay pedidos con estos filtros.</div>:orders.map((o:any)=>{
 const debt=Math.max(0,Number(o.total)-Number(o.paid_amount));const gaps=missing(o);const received=["Recibido","Listo para despacho"].includes(o.logistics_status);
 const ready=received&&debt===0&&gaps.length===0;const sent=["Despachado","Entregado"].includes(o.logistics_status);
 return <article key={o.id} className="card editor-card"><h3>{o.order_number+" · "+(o.customers?.full_name??"Cliente")}</h3><p>{o.order_items?.map((i:any)=>i.quantity+" × "+i.product_name+(i.size?" · "+i.size:"")).join(", ")}</p>
 <span className={"badge "+(ready?"green":sent?"blue":"amber")}>{sent?o.logistics_status:ready?"LISTO PARA SALIR":!received?"PRODUCTO POR RECIBIR":"NO DESPACHAR"}</span>
 <p>{o.delivery_type??"Entrega sin configurar"} · {o.delivery_city??"Ciudad pendiente"}</p><p>{o.delivery_address??"Dirección pendiente"} · {o.delivery_recipient??o.customers?.full_name} · {o.delivery_phone??o.customers?.whatsapp??"Sin teléfono"}</p>
 {debt>0&&<p role="status">Saldo pendiente: {"$"+debt.toFixed(2)}. <Link href="/pagos">Registrar cobro</Link></p>}{gaps.length>0&&<p>Completar: {gaps.join(", ")}.</p>}
 <details><summary>Configurar entrega</summary><ActionForm key={JSON.stringify(o)} action={updateDelivery} className="popover-form inline-form" submitLabel="Guardar entrega">
 <input type="hidden" name="order_id" value={o.id}/><div className="form-grid">
 <label>Tipo<select name="delivery_type" defaultValue={o.delivery_type??""} required><option value="">Seleccionar</option><option value="Local">Cercana / local</option><option value="Nacional">A distancia / otra ciudad</option><option value="Retiro">Retiro en punto acordado</option></select></label>
 <label>Ciudad<input name="delivery_city" defaultValue={o.delivery_city??""} maxLength={100} required/></label>
 <label>Destinatario<input name="delivery_recipient" defaultValue={o.delivery_recipient??o.customers?.full_name??""} maxLength={150} required/></label>
 <label>Teléfono<input name="delivery_phone" defaultValue={o.delivery_phone??o.customers?.whatsapp??""} maxLength={40} required/></label></div>
 <label>Dirección / punto de retiro<input name="delivery_address" defaultValue={o.delivery_address??""} maxLength={400}/></label>
 <div className="form-grid"><label>Transportista / mensajero<input name="delivery_carrier" defaultValue={o.delivery_carrier??""} placeholder="Obligatorio para envío a distancia" maxLength={100}/></label><label>Número de guía<input name="tracking_number" defaultValue={o.tracking_number??""} maxLength={100}/></label></div>
 <label>Referencia / instrucciones<textarea name="delivery_notes" defaultValue={o.delivery_notes??""} maxLength={600}/></label></ActionForm></details>
 {o.tracking_number&&<p>Guía: {o.tracking_number} · {o.delivery_carrier}</p>}{o.delivery_notes&&<p>{o.delivery_notes}</p>}
 {ready&&<ActionForm action={dispatchOrder} submitLabel="Marcar despachado"><input type="hidden" name="order_id" value={o.id}/><input type="hidden" name="next_status" value="Despachado"/></ActionForm>}
 {o.logistics_status==="Despachado"&&debt===0&&gaps.length===0&&<ActionForm action={dispatchOrder} submitLabel="Confirmar entrega"><input type="hidden" name="order_id" value={o.id}/><input type="hidden" name="next_status" value="Entregado"/></ActionForm>}
 </article>;})}</section></AppShell>;
}
