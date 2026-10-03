
"use server";
import {createClient} from "@/lib/supabase/server";
import {redirect} from "next/navigation";
function msg(v:string){return encodeURIComponent(v);}
function resolveEmail(fd:FormData){
 const identity=String(fd.get("identity")??"").trim().toLowerCase();
 const admin=process.env.ADMIN_LOGIN_EMAIL?.trim().toLowerCase();
 if(identity==="leandroaldair"){if(!admin) redirect("/login?error="+msg("Falta vincular el correo del administrador"));return admin;}
 return identity;
}
export async function login(fd:FormData){
 const s=await createClient();const email=resolveEmail(fd);const password=String(fd.get("password")??"");
 const {error}=await s.auth.signInWithPassword({email,password});
 if(error) redirect("/login?error="+msg("Usuario o contraseña incorrectos, o correo pendiente de confirmar."));
 redirect("/dashboard");
}
export async function signup(fd:FormData){
 const s=await createClient();const email=resolveEmail(fd);const allowed=process.env.ADMIN_LOGIN_EMAIL?.trim().toLowerCase();
 if(!allowed||email!==allowed) redirect("/login?error="+msg("Solo puedes activar la cuenta del administrador configurado."));
 const password=String(fd.get("password")??"");
 const {data,error}=await s.auth.signUp({email,password,options:{data:{full_name:"Leandro Aldair"}}});
 if(error) redirect("/login?error="+msg(error.message));
 if(!data.session) redirect("/login?success="+msg("Revisa tu correo para confirmar la cuenta. Después vuelve aquí e inicia sesión con leandroaldair."));
 await s.from("profiles").upsert({id:data.user!.id,full_name:"Leandro Aldair",role:"administrator"});
 redirect("/dashboard");
}
export async function logout(){const s=await createClient();await s.auth.signOut();redirect("/login");}
