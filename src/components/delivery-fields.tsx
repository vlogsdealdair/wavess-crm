"use client";
import {useState} from "react";import {ECUADOR_CAPITALS} from "@/lib/ecuador";
type Delivery={scheduled_ship_date?:string|null;delivery_type:string|null;delivery_city:string|null;delivery_sector:string|null;delivery_address:string|null;delivery_recipient:string|null;delivery_phone:string|null;delivery_notes:string|null;delivery_carrier:string|null;tracking_number:string|null;shipping_cost:number|string;customers?:{full_name:string;whatsapp:string|null}};
export function DeliveryFields({order:o}:{order:Delivery}){
 const known=ECUADOR_CAPITALS.some(([,c])=>c===o.delivery_city);const [city,setCity]=useState(known?o.delivery_city??"":"Otra ciudad");const [shipping,setShipping]=useState(Number(o.shipping_cost)>0);
 return <><div className="form-grid"><label>Tipo de entrega<select name="delivery_type" defaultValue={o.delivery_type??"Local"}><option value="Local">Entrega cercana</option><option value="Nacional">Envío a distancia</option><option value="Retiro">Retiro acordado</option></select></label>
 <label>Capital provincial<select name={city==="Otra ciudad"?undefined:"delivery_city"} value={city} onChange={e=>setCity(e.target.value)}>{ECUADOR_CAPITALS.map(([p,c])=><option key={p} value={c}>{c+" · "+p}</option>)}<option>Otra ciudad</option></select></label>
 {city==="Otra ciudad"&&<label>Ciudad<input name="delivery_city" defaultValue={known?"":o.delivery_city??""} maxLength={100} required/></label>}
 <label>Fecha prevista de envío<input type="date" name="scheduled_ship_date" defaultValue={o.scheduled_ship_date??""}/></label>
 <label>Sector / barrio<input name="delivery_sector" defaultValue={o.delivery_sector??""} placeholder="Escribe el sector manualmente" maxLength={150}/></label>
 <label>Destinatario<input name="delivery_recipient" defaultValue={o.delivery_recipient??o.customers?.full_name??""} maxLength={150} required/></label>
 <label>Teléfono<input name="delivery_phone" defaultValue={o.delivery_phone??o.customers?.whatsapp??""} maxLength={40} required/></label></div>
 <label>Dirección / punto de retiro<input name="delivery_address" defaultValue={o.delivery_address??""} placeholder="Calle, número y referencia" maxLength={400}/></label>
 <div className="shipping-editor"><label>¿Tuviste gasto de envío?<select value={shipping?"yes":"no"} onChange={e=>setShipping(e.target.value==="yes")}><option value="no">No · $0</option><option value="yes">Sí · registrar costo</option></select></label>
 {shipping?<label>Costo de envío para WAVESS<input name="shipping_cost" type="number" min="0" step="0.01" defaultValue={o.shipping_cost} required/></label>:<input type="hidden" name="shipping_cost" value="0"/>}<p>Este costo se descuenta de la ganancia; no aumenta el total cobrado al cliente.</p></div>
 <div className="form-grid"><label>Transportista / mensajero<input name="delivery_carrier" defaultValue={o.delivery_carrier??""} placeholder="Para envíos a distancia" maxLength={100}/></label><label>Número de guía<input name="tracking_number" defaultValue={o.tracking_number??""} maxLength={100}/></label></div>
 <label>Instrucciones<textarea name="delivery_notes" defaultValue={o.delivery_notes??""} maxLength={600}/></label></>;
}
