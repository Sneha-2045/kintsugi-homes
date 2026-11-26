create table if not exists public.rent_reward_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  payment_reference text,
  kind text not null check (kind in ('earned', 'redeemed')),
  points integer not null check (points > 0),
  description text not null,
  created_at timestamptz not null default now(),
  constraint rent_reward_payment_once unique (payment_reference)
);

create index if not exists rent_reward_transactions_user_created_idx
  on public.rent_reward_transactions (user_id, created_at desc);

alter table public.rent_reward_transactions enable row level security;
create policy "Tenants can view their reward history"
  on public.rent_reward_transactions for select to authenticated
  using (auth.uid() = user_id);

-- Call only after the payment provider has confirmed a successful rent payment.
-- Unique payment references make retries safe and award points exactly once.
create or replace function public.award_rent_reward_points(
  p_user_id uuid, p_payment_reference text, p_rent_amount numeric
) returns integer language plpgsql security definer set search_path = '' as $$
declare
  awarded integer;
begin
  if p_payment_reference is null or length(trim(p_payment_reference)) = 0 or p_rent_amount <= 0 then
    raise exception 'A payment reference and positive rent amount are required';
  end if;
  awarded := greatest(1, floor(p_rent_amount)::integer);
  insert into public.rent_reward_transactions(user_id, payment_reference, kind, points, description)
  values (p_user_id, p_payment_reference, 'earned', awarded, 'Rent payment reward')
  on conflict (payment_reference) do nothing;
  if not found then return 0; end if;
  return awarded;
end;
$$;

revoke all on function public.award_rent_reward_points(uuid, text, numeric) from public, anon, authenticated;
grant execute on function public.award_rent_reward_points(uuid, text, numeric) to service_role;

create or replace function public.redeem_rent_reward(p_reward text, p_points integer)
returns void language plpgsql security definer set search_path = '' as $$
declare current_user_id uuid := auth.uid();
begin
  if current_user_id is null then raise exception 'Authentication required'; end if;
  if p_points not in (500, 1000, 2000) then raise exception 'Invalid reward option'; end if;
  if p_reward not in ('Rent discount', 'Cashback', 'Gift card', 'Exclusive offer') then raise exception 'Invalid reward'; end if;
  perform pg_advisory_xact_lock(hashtext(current_user_id::text));
  if coalesce((select sum(case when kind = 'earned' then points else -points end)
    from public.rent_reward_transactions where user_id = current_user_id), 0) < p_points then
    raise exception 'Not enough points';
  end if;
  insert into public.rent_reward_transactions(user_id, kind, points, description)
  values (current_user_id, 'redeemed', p_points, p_reward);
end;
$$;
revoke all on function public.redeem_rent_reward(text, integer) from public, anon;
grant execute on function public.redeem_rent_reward(text, integer) to authenticated;
