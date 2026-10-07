"use server";
import {createClient} from "@/lib/supabase/server";
import {revalidatePath} from "next/cache";
async function owner(){const s=await createClient();const {data,error}=await s.auth.getUser();if(error||!data.user)throw new Error("Inicia sesión para conectar Telegram");return s;}
function tokenOf(fd:FormData){const t=String(fd.get("token")??"").trim();if(!/^[0-9]{5,20}:[A-Za-z0-9_-]{20,100}$/.test(t))throw new Error("Revisa el token de BotFather");return t;}
async function telegram(token:string,method:string,body:Record<string,unknown>={}){
 try{const r=await fetch("https://api.telegram.org/bot"+token+"/"+method,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(body),cache:"no-store",signal:AbortSignal.timeout(10000)});
 const data=await r.json();if(!r.ok||!data.ok)throw new Error("telegram");return data.result;
 }catch{throw new Error("Telegram no respondió. Revisa el token y los permisos del bot e intenta de nuevo.");}
}
export type TelegramDetection={error:string;groups:{id:string;title:string}[]};
export async function detectTelegram(_:TelegramDetection,fd:FormData):Promise<TelegramDetection>{
 try{await owner();const token=tokenOf(fd);const hook=await telegram(token,"getWebhookInfo");if(hook.url)throw new Error("Este bot ya está conectado a otro servicio. Crea un bot exclusivo para WAVESS.");
 const updates=await telegram(token,"getUpdates",{limit:100,timeout:0});
 const groups=new Map<string,{id:string;title:string}>();
 for(const u of updates){const m=u.message;if(m&&["group","supergroup"].includes(m.chat.type)&&/^\/wavess(?:@[A-Za-z0-9_]+)?(?:\s|$)/.test(m.text??""))groups.set(String(m.chat.id),{id:String(m.chat.id),title:String(m.chat.title)});}
 if(!groups.size)throw new Error("Agrega el bot al grupo y escribe /wavess en ese grupo. Después vuelve a detectar.");
 return {error:"",groups:[...groups.values()]};
 }catch(e){return {error:e instanceof Error?e.message:"No se pudo detectar el grupo",groups:[]};}
}
export async function connectTelegram(fd:FormData){
 const s=await owner();const token=tokenOf(fd);const id=String(fd.get("chat_id")??"");
 if(!/^-[0-9]{1,20}$/.test(id))throw new Error("Detecta y selecciona un grupo");
 const chat=await telegram(token,"getChat",{chat_id:id});
 if(chat.username)throw new Error("Usa un grupo privado para proteger los datos de tus clientes");
 if(!["group","supergroup"].includes(chat.type))throw new Error("Selecciona el grupo privado de tu equipo");
 const {error}=await s.rpc("connect_telegram",{p_token:token,p_chat_id:id,p_title:String(chat.title).slice(0,200)});
 if(error)throw new Error("No se pudo guardar la conexión. Intenta nuevamente.");
 revalidatePath("/configuracion");
}
export async function pauseTelegram(){const s=await owner();const {error}=await s.rpc("pause_telegram");if(error)throw new Error("No se pudo pausar Telegram");revalidatePath("/configuracion");}
export async function retryTelegram(fd:FormData){const s=await owner();const {error}=await s.rpc("retry_telegram",{p_id:String(fd.get("notification_id")??"")});if(error)throw new Error("No se pudo reintentar");revalidatePath("/configuracion");}
