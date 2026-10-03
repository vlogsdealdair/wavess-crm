
alter table public.products add column if not exists category text not null default 'Calzado';
alter table public.products add column if not exists cost_price numeric(12,2) not null default 0 check (cost_price >= 0);
alter table public.products add column if not exists combo_items jsonb not null default '[]'::jsonb check (jsonb_typeof(combo_items)='array');
alter table public.payments add column if not exists bank text;
create table public.payment_methods (
 id uuid primary key default gen_random_uuid(),
 owner_id uuid not null references auth.users(id) on delete cascade,
 name text not null check(length(trim(name)) between 1 and 80),
 created_at timestamptz not null default now(),
 unique(owner_id,name)
);
alter table public.payment_methods enable row level security;
create policy payment_methods_owner_all on public.payment_methods for all to authenticated
using ((select auth.uid())=owner_id) with check ((select auth.uid())=owner_id);
grant select,insert,update,delete on public.payment_methods to authenticated;
create policy profiles_insert_self on public.profiles for insert to authenticated with check ((select auth.uid())=id and role='administrator');

create function public.validate_payment() returns trigger language plpgsql security invoker set search_path=public as $$
declare o public.orders; already_paid numeric;
begin
 select * into o from public.orders where id=new.order_id for update;
 if o.id is null or o.owner_id <> new.owner_id or o.owner_id is distinct from auth.uid() then raise exception 'Pedido no disponible'; end if;
 if o.commercial_status='Cancelado' then raise exception 'No se puede cobrar un pedido cancelado'; end if;
 select coalesce(sum(amount),0) into already_paid from public.payments where order_id=new.order_id and id<>new.id;
 if new.amount<=0 or already_paid+new.amount>o.total then raise exception 'El pago supera el saldo pendiente'; end if;
 if new.method is null or length(trim(new.method))=0 then raise exception 'Selecciona un método de pago'; end if;
 if new.method in ('Transferencia','Depósito') and (new.bank is null or trim(new.bank)='' or new.reference is null or trim(new.reference)='') then raise exception 'Indica banco y referencia del pago'; end if;
 return new;
end $$;
create trigger payments_validate before insert or update on public.payments for each row execute function public.validate_payment();
revoke all on function public.validate_payment() from public,anon;

create function public.guard_dispatch() returns trigger language plpgsql security invoker set search_path=public as $$
begin
 if new.logistics_status in ('Despachado','Entregado') and old.logistics_status is distinct from new.logistics_status
 and (new.paid_amount<new.total or new.commercial_status='Cancelado') then raise exception 'No despachar: saldo pendiente o pedido cancelado'; end if;
 return new;
end $$;
create trigger orders_guard_dispatch before update on public.orders for each row execute function public.guard_dispatch();
revoke all on function public.guard_dispatch() from public,anon;
