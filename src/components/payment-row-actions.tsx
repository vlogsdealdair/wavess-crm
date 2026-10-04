"use client";
import {useState} from "react";import {ActionForm} from "./action-form";import {EditorDialog} from "./editor-dialog";import {PaymentFields} from "./payment-fields";import {updatePayment,deletePayment} from "@/app/actions";
type Payment={id:string;amount:number;method:string;bank:string|null;reference:string|null;paid_date:string};
export function PaymentRowActions({payment:p,methods}:{payment:Payment;methods:string[]}){
 const [mode,setMode]=useState<"edit"|"delete"|null>(null);
 return <div className="record-actions"><button type="button" className="secondary-btn compact" onClick={()=>setMode("edit")}>Editar pago</button><button type="button" className="danger-link" onClick={()=>setMode("delete")}>Eliminar pago</button>
 {mode&&<EditorDialog title={mode==="edit"?"Corregir pago":"Eliminar pago"} onClose={()=>setMode(null)}>
 {mode==="edit"?<ActionForm action={updatePayment} className="popover-form inline-form" submitLabel="Guardar cambios"><input type="hidden" name="payment_id" value={p.id}/><PaymentFields methods={methods} payment={p}/><p>Puedes corregir este registro aunque el método ya no esté disponible para nuevos cobros. Si el monto supera el total del pedido, el exceso queda visible para revisión.</p></ActionForm>:<ActionForm action={deletePayment} className="popover-form inline-form" submitLabel="Eliminar pago"><input type="hidden" name="payment_id" value={p.id}/><p>Se eliminará el abono de {"$"+p.amount.toFixed(2)} y se recalculará el saldo. El registro no podrá recuperarse.</p><label className="confirmation"><input type="checkbox" name="confirm_delete" value="yes" required/> Confirmo eliminar este pago</label></ActionForm>}
 </EditorDialog>}</div>;
}
