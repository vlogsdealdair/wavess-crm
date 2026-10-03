"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

function message(value: unknown) {
  return encodeURIComponent(value instanceof Error ? value.message : String(value));
}

export async function login(formData: FormData) {
  const supabase = await createClient();
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) redirect("/login?error=" + message(error.message));
  redirect("/dashboard");
}

export async function signup(formData: FormData) {
  const supabase = await createClient();
  const fullName = String(formData.get("full_name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name: fullName || "Administrador WAVESS" } },
  });

  if (error) redirect("/login?error=" + message(error.message));
  if (!data.session) redirect("/login?success=" + message("Cuenta creada. Revisa tu correo para confirmar el acceso."));
  redirect("/dashboard");
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
