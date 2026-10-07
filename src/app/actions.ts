"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { DEFAULT_METHODS } from "@/lib/payment-methods";

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


function money(fd:FormData,key:string) {
 const value=Number(fd.get(key) ?? 0);
 if(!Number.isFinite(value)||value<0) throw new Error("El precio o costo no es válido");
 return Math.round(value*100)/100;
}
export async function createProduct(fd:FormData) {
 const {supabase,user}=await auth();
 if(!text(fd,"model")) throw new Error("Escribe el nombre del producto");
 const {error}=await supabase.from("products").insert({
 owner_id:user.id,sku:nullable(text(fd,"sku")),model:text(fd,"model"),brand:text(fd,"brand")||"Sin marca",
 quality:text(fd,"quality")||"TOP QUALITY",category:text(fd,"category")||"Otros",
 sizes:text(fd,"sizes").split(",").map(v=>v.trim()).filter(Boolean),
 sale_price:money(fd,"sale_price"),cost_price:money(fd,"cost_price")
 });
 if(error) throw new Error(error.message);
 revalidatePath("/productos");revalidatePath("/combos");revalidatePath("/pedidos");
}
export async function updateProduct(fd:FormData) {
 const {supabase,user}=await auth();
 const {data:old}=await supabase.from("products").select("combo_items").eq("id",text(fd,"product_id")).eq("owner_id",user.id).single();
 if(!old) throw new Error("Producto no disponible");
 const row:Record<string,unknown>={model:text(fd,"model"),brand:text(fd,"brand")||"Sin marca",category:text(fd,"category")||"Otros",sku:nullable(text(fd,"sku")),quality:text(fd,"quality"),sale_price:money(fd,"sale_price"),status:text(fd,"status"),sizes:text(fd,"sizes").split(",").map(v=>v.trim()).filter(Boolean)};
 if(!text(fd,"model") || !["Activo","Inactivo"].includes(String(row.status))) throw new Error("Datos del producto inválidos");
 if(!old.combo_items?.length) row.cost_price=money(fd,"cost_price");
 const {error}=await supabase.from("products").update(row).eq("id",text(fd,"product_id")).eq("owner_id",user.id);
 if(error) throw new Error(error.message);
 revalidatePath("/productos");revalidatePath("/combos");revalidatePath("/pedidos");
}
async function saveCombo(fd:FormData,updating=false) {
 const {supabase,user}=await auth();
 const ids=fd.getAll("component_id").map(String);
 const quantities=fd.getAll("component_quantity").map(Number);
 if(!text(fd,"model")||ids.length<2||new Set(ids).size!==ids.length||quantities.some(q=>!Number.isInteger(q)||q<1||q>100)) throw new Error("Selecciona al menos dos productos distintos y cantidades de 1 a 100");
 const {data:products,error:readError}=await supabase.from("products").select("id,model,cost_price,combo_items").eq("owner_id",user.id).eq("status","Activo").in("id",ids);
 if(readError||!products||products.length!==ids.length||products.some(p=>p.combo_items?.length)) throw new Error("El combo solo admite productos individuales activos");
 const items=ids.map((id,i)=>{const p=products.find(p=>p.id===id)!;return {product_id:id,name:p.model,quantity:quantities[i],unit_cost:Number(p.cost_price)};});
 const cost=Math.round(items.reduce((s,i)=>s+i.quantity*i.unit_cost,0)*100)/100;
 const row={owner_id:user.id,model:text(fd,"model"),sku:nullable(text(fd,"sku")),brand:"WAVESS",category:"Combo",quality:"TOP QUALITY",sale_price:money(fd,"sale_price"),cost_price:cost,combo_items:items,sizes:[]};
 let result;
 if(updating){
  const {data:existing}=await supabase.from("products").select("combo_items").eq("id",text(fd,"product_id")).eq("owner_id",user.id).single();
  if(!existing?.combo_items?.length)throw new Error("Combo no disponible");
  result=await supabase.from("products").update(row).eq("id",text(fd,"product_id")).eq("owner_id",user.id).select("id").single();
 }else result=await supabase.from("products").insert(row);
 const {error}=result;
 if(error) throw new Error(error.message);
 revalidatePath("/combos");revalidatePath("/productos");revalidatePath("/pedidos");
}
export async function refreshComboCost(fd:FormData) {
 const {supabase,user}=await auth();
 const {data:combo}=await supabase.from("products").select("id,combo_items").eq("id",text(fd,"product_id")).eq("owner_id",user.id).single();
 if(!combo?.combo_items?.length) throw new Error("Combo no disponible");
 const items=combo.combo_items as {product_id:string;name:string;quantity:number;unit_cost:number}[];
 const {data:products}=await supabase.from("products").select("id,model,cost_price").eq("owner_id",user.id).in("id",items.map(i=>i.product_id));
 if(!products||products.length!==items.length) throw new Error("Falta un producto del combo");
 const updated=items.map(i=>{const p=products.find(p=>p.id===i.product_id)!;return {...i,name:p.model,unit_cost:Number(p.cost_price)};});
 const {error}=await supabase.from("products").update({combo_items:updated,cost_price:Math.round(updated.reduce((s,i)=>s+i.quantity*i.unit_cost,0)*100)/100}).eq("id",combo.id);
 if(error) throw new Error(error.message);
 revalidatePath("/combos");revalidatePath("/productos");revalidatePath("/pedidos");
}
export async function createPaymentMethod(fd:FormData) {
 const {supabase,user}=await auth();
 const name=text(fd,"name");
 if(!name||name.length>80) throw new Error("Escribe un método nuevo de hasta 80 caracteres");
 const {error}=await supabase.from("payment_methods").insert({owner_id:user.id,name});
 if(error) throw new Error(error.code==="23505"?"Este método ya existe":error.message);
 revalidatePath("/pagos");revalidatePath("/configuracion");
}

export async function createOrder(formData: FormData) {
  const { supabase, user } = await auth();
  const productId = text(formData, "product_id");
  const supplierId = text(formData, "supplier_id");
  const customerId = text(formData, "customer_id");
  const {data:customer}=await supabase.from("customers").select("id").eq("id",customerId).eq("owner_id",user.id).single();
  if(!customer) throw new Error("Selecciona un cliente válido");
  if(supplierId){const {data:supplier}=await supabase.from("suppliers").select("id").eq("id",supplierId).eq("owner_id",user.id).single();if(!supplier) throw new Error("Proveedor inválido");}

  const { data: product, error: productError } = await supabase
    .from("products").select("id,model,sale_price,cost_price,combo_items").eq("id", productId).single();
  if (productError || !product) throw new Error("Producto inválido");

  let unitCost = text(formData,"unit_cost")==="" ? Number(product.cost_price) : money(formData,"unit_cost");
  if (text(formData,"unit_cost")==="" && supplierId && !product.combo_items?.length) {
    const { data: supplierProduct } = await supabase
      .from("supplier_products").select("cost")
      .eq("supplier_id", supplierId).eq("product_id", productId).maybeSingle();
    unitCost = Number(supplierProduct?.cost ?? 0);
  }

  const orderNumber = "WV-" + crypto.randomUUID().slice(0,8).toUpperCase();

  const { error } = await supabase.rpc("create_order", {
    p_order_number: orderNumber,
    p_customer_id: customerId || null,
    p_supplier_id: supplierId || null,
    p_product_id: productId,
    p_product_name: product.combo_items?.length ? product.model+" ("+product.combo_items.map((i:{name:string;quantity:number})=>i.quantity+" × "+i.name).join(", ")+")" : product.model,
    p_size: text(formData, "size"),
    p_quantity: (()=>{const q=number(formData,"quantity");if(!Number.isInteger(q)||q<1) throw new Error("Cantidad inválida");return q;})(),
    p_unit_price: text(formData,"unit_price")==="" ? Number(product.sale_price) : money(formData,"unit_price"),
    p_unit_cost: unitCost,
    p_shipping_cost: money(formData, "shipping_cost"),
    p_notes: nullable(text(formData, "notes")),
  });
  if (error) throw new Error(error.message);
  revalidatePath("/pedidos");
  revalidatePath("/clientes");
  revalidatePath("/dashboard");
  revalidatePath("/finanzas");
}

async function paymentValues(fd:FormData,supabase:Awaited<ReturnType<typeof createClient>>,ownerId:string,editing=false){
 const method=text(fd,"method");
 const {data:custom,error}=await supabase.from("payment_methods").select("name").eq("owner_id",ownerId);
 if(error) throw new Error("No se pudieron cargar los métodos");
 if(!method||method.length>80||(!editing&&!(custom??[]).some(m=>m.name===method))) throw new Error("Selecciona un método válido");
 const amount=money(fd,"amount"); if(amount<=0) throw new Error("El monto debe ser mayor a cero");
 const date=text(fd,"paid_date");
 if(!/^\d{4}-\d{2}-\d{2}$/.test(date)||Number.isNaN(Date.parse(date+"T12:00:00-05:00")))throw new Error("Fecha inválida");
 const bank=nullable(text(fd,"bank"));
 if(!editing&&["Transferencia","Depósito"].includes(method)&&!bank)throw new Error("Selecciona el banco receptor");
 return {amount,method,bank,reference:nullable(text(fd,"reference")),paid_at:date+"T12:00:00-05:00"};
}
function refreshPayments(){["/pagos","/pedidos","/dashboard","/finanzas","/despachos"].forEach(p=>revalidatePath(p));}
export async function registerPayment(fd:FormData){
 const {supabase,user}=await auth();const values=await paymentValues(fd,supabase,user.id);
 const {error}=await supabase.from("payments").insert({...values,owner_id:user.id,order_id:text(fd,"order_id")});
 if(error)throw new Error(error.message); refreshPayments();
}
export async function updatePayment(fd:FormData){
 const {supabase,user}=await auth();const values=await paymentValues(fd,supabase,user.id,true);
 const {data,error}=await supabase.from("payments").update(values).eq("id",text(fd,"payment_id")).eq("owner_id",user.id).select("id").single();
 if(error||!data)throw new Error(error?.message??"Pago no disponible");refreshPayments();
}
export async function deletePayment(fd:FormData){
 if(text(fd,"confirm_delete")!=="yes")throw new Error("Confirma la eliminación del pago");
 const {supabase,user}=await auth();
 const {data,error}=await supabase.from("payments").delete().eq("id",text(fd,"payment_id")).eq("owner_id",user.id).select("id").single();
 if(error||!data)throw new Error(error?.message??"Pago no disponible");refreshPayments();
}
export async function updateDelivery(fd:FormData){
 const {supabase,user}=await auth();const type=text(fd,"delivery_type");
 const date=text(fd,"scheduled_ship_date");if(date&&(!/^\d{4}-\d{2}-\d{2}$/.test(date)||Number.isNaN(Date.parse(date+"T12:00:00-05:00"))))throw new Error("Fecha de envío inválida");
 if(!["Local","Nacional","Retiro"].includes(type))throw new Error("Selecciona entrega cercana, a distancia o retiro");
 const {data,error}=await supabase.from("orders").update({
 scheduled_ship_date:nullable(text(fd,"scheduled_ship_date")),delivery_sector:nullable(text(fd,"delivery_sector")),shipping_cost:money(fd,"shipping_cost"),delivery_type:type,delivery_city:nullable(text(fd,"delivery_city")),delivery_address:nullable(text(fd,"delivery_address")),
 delivery_recipient:nullable(text(fd,"delivery_recipient")),delivery_phone:nullable(text(fd,"delivery_phone")),
 delivery_notes:nullable(text(fd,"delivery_notes")),delivery_carrier:nullable(text(fd,"delivery_carrier")),tracking_number:nullable(text(fd,"tracking_number"))
 }).eq("id",text(fd,"order_id")).eq("owner_id",user.id).select("id").single();
 if(error||!data)throw new Error(error?.message??"Pedido no disponible");
 revalidatePath("/despachos");revalidatePath("/pedidos");revalidatePath("/finanzas");revalidatePath("/dashboard");
}
export async function dispatchOrder(fd:FormData){
 const {supabase,user}=await auth();const next=text(fd,"next_status");if(!["Despachado","Entregado"].includes(next))throw new Error("Estado inválido");
 const {data,error}=await supabase.from("orders").update({logistics_status:next}).eq("id",text(fd,"order_id")).eq("owner_id",user.id).select("id").single();
 if(error||!data)throw new Error(error?.message??"Pedido no disponible");
 revalidatePath("/despachos");revalidatePath("/pedidos");revalidatePath("/dashboard");
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


export async function createLead(formData: FormData) {
  const { supabase, user } = await auth();
  const { error } = await supabase.from("leads").insert({
    owner_id: user.id,
    full_name: text(formData, "full_name"),
    whatsapp: nullable(text(formData, "whatsapp")),
    instagram: nullable(text(formData, "instagram")),
    source: nullable(text(formData, "source")),
    interested_product: nullable(text(formData, "interested_product")),
    shoe_size: nullable(text(formData, "shoe_size")),
    status: text(formData, "status") || "Nuevo",
    next_follow_up_at: nullable(text(formData, "next_follow_up_at")),
  });
  if (error) throw new Error(error.message);
  revalidatePath("/leads");
  revalidatePath("/dashboard");
}

export async function updateLeadStatus(formData: FormData) {
  const { supabase } = await auth();
  const { error } = await supabase.from("leads").update({
    status: text(formData, "status"),
    last_contact_at: new Date().toISOString(),
  }).eq("id", text(formData, "lead_id"));
  if (error) throw new Error(error.message);
  revalidatePath("/leads");
  revalidatePath("/dashboard");
}


export async function createExpense(formData: FormData) {
  const { supabase, user } = await auth();
  const { error } = await supabase.from("expenses").insert({
    owner_id: user.id,
    category: text(formData, "category"),
    description: text(formData, "description"),
    amount: number(formData, "amount"),
    expense_date: text(formData, "expense_date") || new Date().toISOString().slice(0,10),
  });
  if (error) throw new Error(error.message);
  revalidatePath("/gastos");
  revalidatePath("/finanzas");
  revalidatePath("/dashboard");
}

export async function updatePaymentMethod(fd:FormData){
 const {supabase,user}=await auth();const name=text(fd,"name");if(!name||name.length>80)throw new Error("Escribe un nombre de hasta 80 caracteres");
 const {data,error}=await supabase.from("payment_methods").update({name}).eq("id",text(fd,"method_id")).eq("owner_id",user.id).select("id").single();
 if(error||!data)throw new Error(error?.code==="23505"?"Ya existe este método":error?.message??"Método no disponible");
 revalidatePath("/configuracion");revalidatePath("/pagos");
}
const editableFields:Record<string,string[]>={
 customers:["full_name","whatsapp","instagram","email","shoe_size","preferred_brand","segment","notes"],
 suppliers:["name","contact_name","whatsapp","quality","average_delivery_days","status"],
 leads:["full_name","whatsapp","instagram","source","interested_product","shoe_size","status","next_follow_up_at"],
 expenses:["category","description","amount","expense_date"]
};
export async function updateRecord(fd:FormData){
 const {supabase,user}=await auth();const table=text(fd,"record_table");const fields=editableFields[table];if(!fields)throw new Error("Registro no editable");
 const row:Record<string,unknown>={};
 for(const field of fields){if(!fd.has(field))continue;row[field]=["amount","average_delivery_days"].includes(field)?money(fd,field):nullable(text(fd,field));}
 if(["customers","leads"].includes(table)&&!row.full_name||table==="suppliers"&&!row.name||table==="expenses"&&(!row.description||!row.category||!row.expense_date))throw new Error("Completa los campos obligatorios");
 const {data,error}=await supabase.from(table).update(row).eq("id",text(fd,"record_id")).eq("owner_id",user.id).select("id").single();
 if(error||!data)throw new Error(error?.message??"Registro no disponible");revalidatePath("/","layout");
}
export async function deleteRecord(fd:FormData){
 if(text(fd,"confirm_delete")!=="yes")throw new Error("Confirma qué registro deseas eliminar");
 const {supabase,user}=await auth();const table=text(fd,"record_table");
 if(!["customers","suppliers","leads","products","orders","expenses","payment_methods"].includes(table))throw new Error("Registro no disponible");
 const {data,error}=await supabase.from(table).delete().eq("id",text(fd,"record_id")).eq("owner_id",user.id).select("id").single();
 if(error||!data)throw new Error(error?.message??"Registro no disponible");revalidatePath("/","layout");
}
export async function createCombo(fd:FormData){await saveCombo(fd);}
export async function updateCombo(fd:FormData){await saveCombo(fd,true);}
export async function updateOrderDetails(fd:FormData){
 const {supabase}=await auth();
 const ids=fd.getAll("item_id").map(String),qty=fd.getAll("item_quantity").map(Number),prices=fd.getAll("item_price").map(Number),costs=fd.getAll("item_cost").map(Number),names=fd.getAll("item_name").map(String),sizes=fd.getAll("item_size").map(String);
 if(!ids.length||qty.some(v=>!Number.isInteger(v)||v<1)||[...prices,...costs].some(v=>!Number.isFinite(v)||v<0)||names.some(v=>!v.trim()))throw new Error("Revisa cantidades, precios y nombres");
 const {error}=await supabase.rpc("edit_order_details",{
 p_order_id:text(fd,"order_id"),p_order_number:text(fd,"order_number"),p_customer_id:nullable(text(fd,"customer_id")),p_supplier_id:nullable(text(fd,"supplier_id")),p_notes:nullable(text(fd,"notes")),p_shipping_cost:money(fd,"shipping_cost"),
 p_items:ids.map((id,i)=>({id,quantity:qty[i],unit_price:prices[i],unit_cost:costs[i],product_name:names[i].trim(),size:sizes[i]??""}))
 });
 if(error)throw new Error(error.message);revalidatePath("/","layout");
}
