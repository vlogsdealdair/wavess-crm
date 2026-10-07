"use client";
import {useActionState,useState} from "react";
import {detectTelegram,connectTelegram,type TelegramDetection} from "@/app/notification-actions";
import {ActionForm} from "@/components/action-form";
export function TelegramSetup(){
 const [token,setToken]=useState("");const [state,detect,pending]=useActionState(detectTelegram,{error:"",groups:[]} as TelegramDetection);
 return <div><ol><li>Crea el bot en <a href="https://t.me/BotFather" target="_blank" rel="noopener noreferrer">BotFather</a> con /newbot.</li><li>Agrega ese bot al grupo privado de tu equipo y escribe <strong>/wavess</strong> en el grupo.</li><li>Pega el token aquí, detecta el grupo y confirma la conexión.</li></ol>
 <form action={detect} className="popover-form inline-form"><label>Token privado del bot<input type="password" name="token" autoComplete="off" value={token} onChange={e=>setToken(e.target.value)} required/></label><p>Se guarda cifrado. No lo compartas por chat.</p>{state.error&&<p role="alert" className="form-alert error">{state.error}</p>}<button className="secondary-btn" disabled={pending}>{pending?"Buscando…":"Detectar grupo"}</button></form>
 {state.groups.length>0&&<ActionForm action={connectTelegram} className="popover-form inline-form" submitLabel="Conectar y enviar prueba"><input type="hidden" name="token" value={token}/><label>Grupo del equipo<select name="chat_id">{state.groups.map(g=><option key={g.id} value={g.id}>{g.title}</option>)}</select></label><p>Recibirá una prueba y los pedidos que ya estén listos para salir. Los próximos avisos serán automáticos.</p></ActionForm>}</div>;
}
