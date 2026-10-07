
create extension if not exists pg_net with schema extensions;
create extension if not exists pg_cron;
create schema if not exists wavess_private;
revoke all on schema wavess_private from public,anon;
grant usage on schema wavess_private to authenticated;
alter table public.orders add column if not exists scheduled_ship_date date;
create table wavess_private.telegram_connections(
 owner_id uuid primary key references auth.users(id) on delete cascade,
 secret_id uuid not null references vault.secrets(id),
 chat_id text not null, chat_title text not null, enabled boolean not null default true
);
alter table wavess_private.telegram_connections enable row level security;
create policy deny_direct_connection_access on wavess_private.telegram_connections for all to authenticated using(false) with check(false);
create table public.dispatch_notifications(
 id uuid primary key default gen_random_uuid(), owner_id uuid not null references auth.users(id) on delete cascade,
 order_id uuid references public.orders(id) on delete cascade,
 event_key text not null, kind text not null,
 status text not null default 'pending' check(status in ('pending','sending','sent','failed','uncertain','skipped')),
 request_id bigint, attempted_at timestamptz, sent_at timestamptz, created_at timestamptz not null default now(),
 unique(owner_id,event_key)
);
alter table public.dispatch_notifications enable row level security;
grant select on public.dispatch_notifications to authenticated;
create policy own_notifications on public.dispatch_notifications for select to authenticated using((select auth.uid())=owner_id);
create index notifications_pending on public.dispatch_notifications(status,created_at);
create index notifications_order on public.dispatch_notifications(order_id);
create function wavess_private.delivery_ready(o public.orders) returns boolean language sql stable set search_path='' as $$
 select o.commercial_status<>'Cancelado' and o.logistics_status in ('Recibido','Listo para despacho')
 and o.paid_amount>=o.total and o.delivery_type in ('Local','Nacional','Retiro')
 and nullif(trim(o.delivery_recipient),'') is not null and nullif(trim(o.delivery_phone),'') is not null
 and nullif(trim(o.delivery_city),'') is not null
 and (o.delivery_type='Retiro' or nullif(trim(o.delivery_address),'') is not null)
 and (o.delivery_type<>'Nacional' or nullif(trim(o.delivery_carrier),'') is not null);
$$;
create function wavess_private.queue_order_notice() returns trigger language plpgsql security definer set search_path='' as $$
begin
 if not exists(select 1 from wavess_private.telegram_connections where owner_id=new.owner_id and enabled) then return new; end if;
 if new.commercial_status='Cancelado' or new.logistics_status in ('Despachado','Entregado') then return new; end if;
 if wavess_private.delivery_ready(new) then
 insert into public.dispatch_notifications(owner_id,order_id,event_key,kind) values(new.owner_id,new.id,new.id||':ready','ready') on conflict(owner_id,event_key) do update set status='pending' where dispatch_notifications.status='skipped';
 elsif new.total>0 and new.paid_amount>=new.total then
 insert into public.dispatch_notifications(owner_id,order_id,event_key,kind) values(new.owner_id,new.id,new.id||':paid','paid') on conflict do nothing;
 end if;
 return new;
end $$;
create trigger order_telegram_notice after insert or update on public.orders for each row execute function wavess_private.queue_order_notice();
create function wavess_private.connect_telegram(p_token text,p_chat_id text,p_title text) returns void language plpgsql security definer set search_path='' as $$
declare v_owner uuid:=auth.uid(); v_secret uuid;
begin
 if v_owner is null then raise exception 'Inicia sesión'; end if;
 if p_token !~ '^[0-9]{5,20}:[A-Za-z0-9_-]{20,100}$' or p_chat_id !~ '^-[0-9]{1,20}$' or length(p_title)>200 then raise exception 'Conexión inválida'; end if;
 select secret_id into v_secret from wavess_private.telegram_connections where owner_id=v_owner for update;
 if v_secret is null then v_secret:=vault.create_secret(p_token); else perform vault.update_secret(v_secret,p_token); end if;
 insert into wavess_private.telegram_connections(owner_id,secret_id,chat_id,chat_title) values(v_owner,v_secret,p_chat_id,p_title)
 on conflict(owner_id) do update set chat_id=excluded.chat_id,chat_title=excluded.chat_title,enabled=true;
 insert into public.dispatch_notifications(owner_id,event_key,kind) values(v_owner,'test:'||gen_random_uuid(),'test');
 -- Current orders are queued only when the owner explicitly activates the connection.
 insert into public.dispatch_notifications(owner_id,order_id,event_key,kind)
 select v_owner,o.id,o.id||':ready','ready' from public.orders o where o.owner_id=v_owner and wavess_private.delivery_ready(o) on conflict do nothing;
end $$;
create function public.connect_telegram(p_token text,p_chat_id text,p_title text) returns void language sql security invoker set search_path='' as $$ select wavess_private.connect_telegram(p_token,p_chat_id,p_title); $$;
create function wavess_private.telegram_status() returns jsonb language sql security definer set search_path='' as $$
 select coalesce((select jsonb_build_object('enabled',enabled,'chat_title',chat_title) from wavess_private.telegram_connections where owner_id=auth.uid()),'{"enabled":false}'::jsonb);
$$;
create function public.telegram_status() returns jsonb language sql security invoker set search_path='' as $$ select wavess_private.telegram_status(); $$;
create function wavess_private.pause_telegram() returns void language sql security definer set search_path='' as $$ update wavess_private.telegram_connections set enabled=false where owner_id=auth.uid(); $$;
create function public.pause_telegram() returns void language sql security invoker set search_path='' as $$ select wavess_private.pause_telegram(); $$;
create function wavess_private.retry_telegram(p_id uuid) returns void language sql security definer set search_path='' as $$
 update public.dispatch_notifications set status='pending',request_id=null,attempted_at=null where id=p_id and owner_id=auth.uid() and status in ('failed','uncertain');
$$;
create function public.retry_telegram(p_id uuid) returns void language sql security invoker set search_path='' as $$ select wavess_private.retry_telegram(p_id); $$;
create function wavess_private.telegram_tick() returns void language plpgsql security definer set search_path='' as $$
declare n record; o public.orders; resp record; token text; msg text; client_name text; products text; request bigint; payload jsonb;
begin
 if not pg_try_advisory_xact_lock(82730491) then return; end if;
 for n in select * from public.dispatch_notifications where status='sending' for update loop
 select * into resp from net._http_response where id=n.request_id;
 if found then
  if resp.status_code=200 and resp.content::jsonb->>'ok'='true' then
   update public.dispatch_notifications set status='sent',sent_at=now() where id=n.id;
  elsif resp.timed_out or resp.error_msg is not null or resp.status_code is null then
   update public.dispatch_notifications set status='uncertain' where id=n.id;
  else update public.dispatch_notifications set status='failed' where id=n.id;
  end if;
 elsif n.attempted_at<now()-interval '5 minutes' then
  update public.dispatch_notifications set status='uncertain' where id=n.id;
 end if;
 end loop;
 -- One reminder per order and local date, at or after 09:00 Ecuador.
 if (now() at time zone 'America/Guayaquil')::time>='09:00'::time then
 insert into public.dispatch_notifications(owner_id,order_id,event_key,kind)
 select ord.owner_id,ord.id,ord.id||':reminder:'||(now() at time zone 'America/Guayaquil')::date,'reminder'
 from public.orders ord join wavess_private.telegram_connections c on c.owner_id=ord.owner_id and c.enabled
 where wavess_private.delivery_ready(ord) and ord.scheduled_ship_date<=(now() at time zone 'America/Guayaquil')::date
 on conflict do nothing;
 end if;
 for n in select q.*,c.chat_id,c.secret_id from public.dispatch_notifications q join wavess_private.telegram_connections c using(owner_id)
 where q.status='pending' and c.enabled order by q.created_at limit 20 for update of q skip locked loop
 if n.kind='test' then msg:='✅ WAVESS conectado. Aquí recibirán los pedidos pagados y listos para despachar.';
 else
  select * into o from public.orders where id=n.order_id and owner_id=n.owner_id;
  if not found or o.commercial_status='Cancelado' or o.logistics_status in ('Despachado','Entregado')
   or (n.kind in ('ready','reminder') and not wavess_private.delivery_ready(o))
   or (n.kind='paid' and o.paid_amount<o.total) then
   update public.dispatch_notifications set status='skipped' where id=n.id; continue;
  end if;
  select full_name into client_name from public.customers where id=o.customer_id and owner_id=o.owner_id;
  select string_agg(quantity||' × '||product_name||coalesce(' · '||nullif(size,''),''),E'\n') into products from public.order_items where order_id=o.id;
  msg:=case n.kind when 'ready' then '📦 LISTO PARA DESPACHAR' when 'reminder' then '⏰ ENVÍO PENDIENTE' else '💰 PAGO COMPLETO' end
   ||E'\nPedido: '||o.order_number||E'\nCliente: '||coalesce(client_name,o.delivery_recipient,'Sin cliente')
   ||E'\nProductos: '||coalesce(products,'Revisar pedido')
   ||E'\nFecha de envío: '||coalesce(to_char(o.scheduled_ship_date,'DD/MM/YYYY'),'Por programar')
   ||E'\nDestino: '||coalesce(o.delivery_city,'Pendiente')||' · '||coalesce(o.delivery_sector,'')
   ||E'\nDirección: '||coalesce(o.delivery_address,'Pendiente')
   ||E'\nDestinatario: '||coalesce(o.delivery_recipient,'Pendiente')
   ||E'\nTeléfono: '||coalesce(o.delivery_phone,'Pendiente')
   ||E'\nEntrega: '||coalesce(o.delivery_type,'Por configurar')
   ||E'\nCosto de envío: $'||o.shipping_cost
   ||E'\n'||case when n.kind='paid' then 'Revisar recepción del producto y completar destino antes de despachar.' else 'Pago completo y destino verificado.' end;
 end if;
 select decrypted_secret into token from vault.decrypted_secrets where id=n.secret_id;
 payload:=jsonb_build_object('chat_id',n.chat_id,'text',left(msg,4000),'reply_markup',jsonb_build_object('inline_keyboard',jsonb_build_array(jsonb_build_array(jsonb_build_object('text','Ver despachos en WAVESS','url','https://wavess-crm.vercel.app/despachos')))));
 request:=net.http_post(url:='https://api.telegram.org/bot'||token||'/sendMessage',body:=payload,timeout_milliseconds:=10000);
 update public.dispatch_notifications set status='sending',request_id=request,attempted_at=now() where id=n.id;
 end loop;
end $$;
revoke all on all functions in schema wavess_private from public,anon,authenticated;
grant execute on function wavess_private.connect_telegram(text,text,text),wavess_private.telegram_status(),wavess_private.pause_telegram(),wavess_private.retry_telegram(uuid) to authenticated;
revoke all on function public.connect_telegram(text,text,text),public.telegram_status(),public.pause_telegram(),public.retry_telegram(uuid) from public,anon;
grant execute on function public.connect_telegram(text,text,text),public.telegram_status(),public.pause_telegram(),public.retry_telegram(uuid) to authenticated;
select cron.schedule('wavess-telegram-dispatch','* * * * *','select wavess_private.telegram_tick()');
