alter table public.orders
 add column if not exists delivery_type text check (delivery_type in ('Local','Nacional','Retiro')),
 add column if not exists delivery_city text,
 add column if not exists delivery_address text,
 add column if not exists delivery_recipient text,
 add column if not exists delivery_phone text,
 add column if not exists delivery_notes text,
 add column if not exists delivery_carrier text,
 add column if not exists tracking_number text;

create or replace function public.validate_payment() returns trigger language plpgsql security invoker set search_path=public as $$
declare o public.orders; already_paid numeric;
begin
 if tg_op='UPDATE' and (new.order_id is distinct from old.order_id or new.owner_id is distinct from old.owner_id) then raise exception 'No se puede cambiar el pedido de un pago'; end if;
 select * into o from public.orders where id=new.order_id for update;
 if o.id is null or o.owner_id is distinct from new.owner_id or o.owner_id is distinct from auth.uid() then raise exception 'Pedido no disponible'; end if;
 if o.commercial_status='Cancelado' and (tg_op='INSERT' or new.amount is distinct from old.amount) then raise exception 'No se puede cobrar un pedido cancelado'; end if;
 select coalesce(sum(amount),0) into already_paid from public.payments where order_id=new.order_id and id<>new.id;
 if new.amount<=0 or already_paid+new.amount>o.total then raise exception 'El pago supera el saldo pendiente'; end if;
 if new.method is null or length(trim(new.method))=0 then raise exception 'Selecciona un método de pago'; end if;
 if new.method in ('Transferencia','Depósito') and coalesce(trim(new.bank),'')='' then raise exception 'Selecciona el banco receptor'; end if;
 return new;
end $$;
create function public.lock_payment_deletion() returns trigger language plpgsql security invoker set search_path=public as $$
declare o public.orders;
begin
 select * into o from public.orders where id=old.order_id for update;
 if o.id is null or o.owner_id is distinct from auth.uid() then raise exception 'Pago no disponible'; end if;
 return old;
end $$;
create trigger payments_lock_delete before delete on public.payments for each row execute function public.lock_payment_deletion();
revoke all on function public.lock_payment_deletion() from public,anon;

create or replace function public.guard_dispatch() returns trigger language plpgsql security invoker set search_path=public as $$
begin
 if new.logistics_status in ('Despachado','Entregado') and old.logistics_status is distinct from new.logistics_status then
  if new.paid_amount<new.total or new.commercial_status='Cancelado' then raise exception 'No despachar: saldo pendiente o pedido cancelado'; end if;
  if new.logistics_status='Despachado' and old.logistics_status not in ('Recibido','Listo para despacho') then raise exception 'Primero registra el producto como recibido'; end if;
  if new.logistics_status='Entregado' and old.logistics_status<>'Despachado' then raise exception 'Primero registra el despacho'; end if;
  if new.delivery_type is null or coalesce(trim(new.delivery_city),'')='' or coalesce(trim(new.delivery_recipient),'')='' or coalesce(trim(new.delivery_phone),'')='' then raise exception 'Completa tipo, ciudad, destinatario y teléfono'; end if;
  if new.delivery_type<>'Retiro' and coalesce(trim(new.delivery_address),'')='' then raise exception 'Completa la dirección'; end if;
  if new.delivery_type='Nacional' and coalesce(trim(new.delivery_carrier),'')='' then raise exception 'Selecciona el transportista'; end if;
 end if;
 return new;
end $$;
