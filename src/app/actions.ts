"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

async function auth() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) redirect("/login");
  return { supabase, user: data.user };
}

const text = (fd: FormData, key: string) => String(fd.get(key) ?? "").trim();
const number = (fd: FormData, key: string) => Number(fd.get(key) ?? 0) || 0;
const nullable = (value: string) => value || null;

export async function createCustomer(formData: FormData) {
  const { supabase, user } = await auth();
  const { error } = await supabase.from("customers").insert({
    owner_id: user.id,
    full_name: text(formData, "full_name"),
    whatsapp: nullable(text(formData, "whatsapp")),
    instagram: nullable(text(formData, "instagram")),
    shoe_size: nullable(text(formData, "shoe_size")),
    preferred_brand: nullable(text(formData, "preferred_brand")),
    segment: text(formData, "segment") || "Cliente nuevo",
    notes: nullable(text(formData, "notes")),
  });
  if (error) throw new Error(error.message);
  revalidatePath("/clientes");
  revalidatePath("/dashboard");
}

export async function createSupplier(formData: FormData) {
  const { supabase, user } = await auth();
  const { error } = await supabase.from("suppliers").insert({
    owner_id: user.id,
    name: text(formData, "name"),
    contact_name: nullable(text(formData, "contact_name")),
    whatsapp: nullable(text(formData, "whatsapp")),
    quality: nullable(text(formData, "quality")),
    average_delivery_days: number(formData, "average_delivery_days") || null,
  });
  if (error) throw new Error(error.message);
  revalidatePath("/proveedores");
}

export async function createProduct(formData: FormData) {
  const { supabase, user } = await auth();
  const sizes = text(formData, "sizes").split(",").map(v => v.trim()).filter(Boolean);
  const { error } = await supabase.from("products").insert({
    owner_id: user.id,
    sku: nullable(text(formData, "sku")),
    model: text(formData, "model"),
    brand: text(formData, "brand"),
    quality: text(formData, "quality") || "TOP QUALITY",
    sizes,
    sale_price: number(formData, "sale_price"),
  });
  if (error) throw new Error(error.message);
  revalidatePath("/productos");
}

export async function createOrder(formData: FormData) {
  const { supabase, user } = await auth();
  const productId = text(formData, "product_id");
  const supplierId = text(formData, "supplier_id");
  const customerId = text(formData, "customer_id");

  const { data: product, error: productError } = await supabase
    .from("products").select("id,model,sale_price").eq("id", productId).single();
  if (productError || !product) throw new Error("Producto inválido");

  let unitCost = number(formData, "unit_cost");
  if (!unitCost && supplierId) {
    const { data: supplierProduct } = await supabase
      .from("supplier_products").select("cost")
      .eq("supplier_id", supplierId).eq("product_id", productId).maybeSingle();
    unitCost = Number(supplierProduct?.cost ?? 0);
  }

  const { count } = await supabase
    .from("orders").select("*", { count: "exact", head: true }).eq("owner_id", user.id);
  const orderNumber = "WV-" + String((count ?? 0) + 1).padStart(5, "0");

  const { error } = await supabase.rpc("create_order", {
    p_order_number: orderNumber,
    p_customer_id: customerId || null,
    p_supplier_id: supplierId || null,
    p_product_id: productId,
    p_product_name: product.model,
    p_size: text(formData, "size"),
    p_quantity: Math.max(1, number(formData, "quantity")),
    p_unit_price: number(formData, "unit_price") || Number(product.sale_price),
    p_unit_cost: unitCost,
    p_shipping_cost: number(formData, "shipping_cost"),
    p_notes: nullable(text(formData, "notes")),
  });
  if (error) throw new Error(error.message);
  revalidatePath("/pedidos");
  revalidatePath("/clientes");
  revalidatePath("/dashboard");
  revalidatePath("/finanzas");
}

export async function registerPayment(formData: FormData) {
  const { supabase, user } = await auth();
  const { error } = await supabase.from("payments").insert({
    owner_id: user.id,
    order_id: text(formData, "order_id"),
    amount: number(formData, "amount"),
    method: nullable(text(formData, "method")),
    reference: nullable(text(formData, "reference")),
  });
  if (error) throw new Error(error.message);
  revalidatePath("/pagos");
  revalidatePath("/pedidos");
  revalidatePath("/dashboard");
  revalidatePath("/finanzas");
}

export async function updateOrderStatus(formData: FormData) {
  const { supabase } = await auth();
  const id = text(formData, "order_id");
  const field = text(formData, "field");
  const allowed = ["commercial_status", "logistics_status"];
  if (!allowed.includes(field)) throw new Error("Estado inválido");
  const { error } = await supabase.from("orders").update({ [field]: text(formData, "value") }).eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/pedidos");
  revalidatePath("/dashboard");
}
