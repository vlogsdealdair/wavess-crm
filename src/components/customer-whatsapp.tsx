import {whatsappLink} from "@/lib/whatsapp";
type Order={order_number:string;paid_amount:string|number;total:string|number;logistics_status:string;delivery_type:string|null;delivery_city:string|null;delivery_address:string|null;delivery_phone:string|null;scheduled_ship_date?:string|null;delivery_carrier:string|null;tracking_number:string|null;customers?:{full_name?:string;whatsapp?:string|null}|null};
export function CustomerWhatsApp({order:o,ready}:{order:Order;ready:boolean}){
 const name=o.customers?.full_name??"";
 const intro="Hola "+name+", te escribimos de WAVESS sobre tu pedido "+o.order_number+". ";
 const messages:{label:string;message:string}[]=[];
 if(Number(o.total)>0&&Number(o.paid_amount)>=Number(o.total))messages.push({label:"Confirmar pago",message:intro+"Recibimos tu pago completo. ¡Gracias! Te avisaremos cuando coordinemos la entrega."});
 if(ready)messages.push({label:"Coordinar entrega",message:intro+(o.delivery_type==="Retiro"?"Tu pedido está listo para retirar.":"Tu pedido está listo para enviar.")+(o.scheduled_ship_date?" Fecha prevista: "+o.scheduled_ship_date.split("-").reverse().join("/")+".":"")+" ¿Nos confirmas el destino "+(o.delivery_address??"acordado")+", "+o.delivery_city+" y tu disponibilidad?"});
 if(["Despachado","Entregado"].includes(o.logistics_status))messages.push({label:"Avisar envío",message:intro+(o.delivery_type==="Retiro"?"Tu retiro ha sido registrado.":"Tu pedido fue despachado.")+(o.delivery_carrier?" Transportista: "+o.delivery_carrier+".":"")+(o.tracking_number?" Guía: "+o.tracking_number+".":"")+" ¡Gracias por comprar en WAVESS!"});
 const phone=o.customers?.whatsapp||o.delivery_phone;
 if(!messages.length)return null;
 return <details><summary>Avisar al cliente por WhatsApp</summary><p>Elige un aviso, revisa el mensaje en WhatsApp y pulsa enviar. No se envía automáticamente.</p><div className="record-actions">{messages.map(m=>{const url=whatsappLink(phone,m.message);return url?<a key={m.label} href={url} className="secondary-btn" target="_blank" rel="noopener noreferrer">{m.label}</a>:null;})}</div>{!whatsappLink(phone,"")&&<p>Completa un teléfono válido del cliente, con código de país si no es de Ecuador.</p>}</details>;
}
