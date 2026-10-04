"use client";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
export function ActionForm({action,children,className,submitLabel="Guardar"}:{action:(fd:FormData)=>Promise<void>;children:React.ReactNode;className?:string;submitLabel?:string}) {
 const router=useRouter();
 const [state,submit]=useActionState(async (_: {error:string;ok:boolean;version:number},fd:FormData)=>{
  try { await action(fd); return {error:"",ok:true,version:Date.now()}; }
  catch(e) { if(e instanceof Error && e.message==="NEXT_REDIRECT") throw e; return {error:e instanceof Error ? e.message : "No se pudo guardar. Intenta nuevamente.",ok:false,version:0}; }
 },{error:"",ok:false,version:0});
 useEffect(()=>{if(state.ok) router.refresh();},[state.version,state.ok,router]);
 return <form action={submit} className={className}>{children}{state.error&&<p role="alert" className="form-alert error">{state.error}</p>}{state.ok&&<p role="status" className="form-alert success">Guardado correctamente.</p>}<Submit label={submitLabel}/></form>;
}
function Submit({label}:{label:string}){const {pending}=useFormStatus();return <button className="primary-btn" disabled={pending}>{pending?"Guardando…":label}</button>;}
