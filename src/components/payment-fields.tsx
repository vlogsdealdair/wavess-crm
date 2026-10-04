"use client";
import {useState} from "react";
import {BANKS} from "@/lib/payment-methods";
export function PaymentFields({methods,payment}:{methods:string[];payment?:{amount:number;method:string;bank:string|null;reference:string|null;paid_date:string}}){
 const [method,setMethod]=useState(payment?.method??methods[0]);
 const bankNeeded=["Transferencia","Depósito"].includes(method);
 const banks=[...BANKS]; if(payment?.bank&&!banks.includes(payment.bank))banks.push(payment.bank);
 return <><div className="form-grid">
 <label>Monto<input name="amount" type="number" min="0.01" step="0.01" defaultValue={payment?.amount} required/></label>
 <label>Cómo recibimos el pago<select name="method" value={method} onChange={e=>setMethod(e.target.value)}>{methods.map(m=><option key={m}>{m}</option>)}</select></label>
 {<label>Banco receptor<select name="bank" defaultValue={payment?.bank??""} required={!payment&&bankNeeded}><option value="">Seleccionar banco</option>{banks.map(b=><option key={b}>{b}</option>)}</select></label>}
 <label>Fecha<input name="paid_date" type="date" defaultValue={payment?.paid_date??new Intl.DateTimeFormat("en-CA",{timeZone:"America/Guayaquil"}).format(new Date())} required/></label></div>
 <details><summary>Referencia del comprobante (opcional)</summary><label>Referencia<input name="reference" defaultValue={payment?.reference??""} maxLength={150}/></label></details>
 </>;
}
