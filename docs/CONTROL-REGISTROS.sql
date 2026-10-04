alter table public.orders add column if not exists delivery_sector text;
insert into public.payment_methods(owner_id,name)
select u.id,m.name from auth.users u cross join (values ('Transferencia'),('Depósito'),('Efectivo'),('Tarjeta'),('Otro')) m(name)
where not exists(select 1 from public.payment_methods p where p.owner_id=u.id and lower(p.name)=lower(m.name))
on conflict(owner_id,name) do nothing;
create or replace function public.validate_payment() returns trigger language plpgsql security invoker set search_path=public as $$
declare o public.orders;
begin
 if tg_op='UPDATE' and (new.order_id is distinct from old.order_id or new.owner_id is distinct from old.owner_id) then raise exception 'No se puede cambiar el pedido de un pago'; end if;
 select * into o from public.orders where id=new.order_id for update;
 if o.id is null or o.owner_id is distinct from new.owner_id or o.owner_id is distinct from auth.uid() then raise exception 'Pedido no disponible'; end if;
 if new.amount<=0 then raise exception 'El monto debe ser mayor a cero'; end if;
 if new.method is null or length(trim(new.method)) not between 1 and 80 then raise exception 'Indica cómo se recibió el pago'; end if;
 return new;
end $$;
create or replace function public.lock_payment_deletion() returns trigger language plpgsql security invoker set search_path=public as $$
declare o public.orders;
begin
 if old.owner_id is distinct from auth.uid() then raise exception 'Pago no disponible'; end if;
 select * into o from public.orders where id=old.order_id for update;
 if o.id is not null and o.owner_id is distinct from auth.uid() then raise exception 'Pago no disponible'; end if;
 return old;
end $$;

create function public.edit_order_details(p_order_id uuid,p_order_number text,p_customer_id uuid,p_supplier_id uuid,p_notes text,p_shipping_cost numeric,p_items jsonb) returns void language plpgsql security invoker set search_path=public as $$
declare o public.orders; item jsonb; n integer; subtotal_v numeric; cost_v numeric; paid_v numeric; modified integer;
begin
 select * into o from public.orders where id=p_order_id and owner_id=auth.uid() for update;
 if o.id is null then raise exception 'Pedido no disponible';end if;
 if coalesce(trim(p_order_number),'')='' or p_shipping_cost<0 then raise exception 'Número o costo inválido';end if;
 if p_customer_id is not null and not exists(select 1 from public.customers where id=p_customer_id and owner_id=auth.uid()) then raise exception 'Cliente no disponible';end if;
 if p_supplier_id is not null and not exists(select 1 from public.suppliers where id=p_supplier_id and owner_id=auth.uid()) then raise exception 'Proveedor no disponible';end if;
 if jsonb_typeof(p_items)<>'array' or jsonb_array_length(p_items)=0 then raise exception 'Faltan productos';end if;
 select count(*) into n from public.order_items where order_id=o.id;
 if n<>jsonb_array_length(p_items) or n<>(select count(distinct value->>'id') from jsonb_array_elements(p_items)) then raise exception 'Partidas inválidas';end if;
 for item in select value from jsonb_array_elements(p_items) loop
  if (item->>'quantity')::numeric<>trunc((item->>'quantity')::numeric) or (item->>'quantity')::integer<1 or (item->>'unit_price')::numeric<0 or (item->>'unit_cost')::numeric<0 or coalesce(trim(item->>'product_name'),'')='' then raise exception 'Datos del producto inválidos';end if;
  update public.order_items set quantity=(item->>'quantity')::integer,unit_price=(item->>'unit_price')::numeric,unit_cost=(item->>'unit_cost')::numeric,product_name=trim(item->>'product_name'),size=item->>'size' where id=(item->>'id')::uuid and order_id=o.id and owner_id=auth.uid();
  get diagnostics modified=row_count;if modified<>1 then raise exception 'Producto no disponible';end if;
 end loop;
 select sum(quantity*unit_price),sum(quantity*unit_cost) into subtotal_v,cost_v from public.order_items where order_id=o.id;
 select coalesce(sum(amount),0) into paid_v from public.payments where order_id=o.id;
 update public.orders set order_number=trim(p_order_number),customer_id=p_customer_id,supplier_id=p_supplier_id,notes=p_notes,shipping_cost=p_shipping_cost,subtotal=subtotal_v,total=subtotal_v,supplier_cost=cost_v,paid_amount=paid_v,payment_status=case when paid_v<=0 then 'Pendiente' when paid_v>=subtotal_v then 'Pagado' else '50% pagado' end where id=o.id;
end $$;
revoke all on function public.edit_order_details(uuid,text,uuid,uuid,text,numeric,jsonb) from public,anon;
grant execute on function public.edit_order_details(uuid,text,uuid,uuid,text,numeric,jsonb) to authenticated;

create or replace function public.refresh_customer_metrics() returns trigger language plpgsql security invoker set search_path=public as $$
declare ids uuid[]; cid uuid;
begin
 if tg_op='DELETE' then ids:=array[old.customer_id];elsif tg_op='INSERT' then ids:=array[new.customer_id];else ids:=array[old.customer_id,new.customer_id];end if;
 for cid in select distinct unnest(ids) loop
  if cid is null then continue;end if;
  update public.customers set purchases_count=(select count(*) from public.orders where customer_id=cid and commercial_status<>'Cancelado'),total_spent=(select coalesce(sum(total),0) from public.orders where customer_id=cid and commercial_status<>'Cancelado'),last_purchase_at=(select max(ordered_at) from public.orders where customer_id=cid and commercial_status<>'Cancelado') where id=cid;
 end loop;
 return coalesce(new,old);
end $$;
