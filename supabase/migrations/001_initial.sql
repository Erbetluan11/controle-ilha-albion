create table public.profiles (
 id uuid primary key references auth.users(id) on delete cascade,
 player_name text not null default '',
 created_at timestamptz not null default now()
);
create table public.ledger (
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
 description text not null check (length(description) between 1 and 200),
 category text not null check (category in ('compra','venda','refino','crafting','coleta','despesa','receita')),
 amount numeric(18,2) not null check (amount between -1000000000000 and 1000000000000 and amount <> 0),
 occurred_at timestamptz not null default now(),
 created_at timestamptz not null default now()
);
create table public.favorites (
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
 item_id text not null check (length(item_id) between 1 and 100),
 unique(user_id,item_id)
);
create table public.saved_operations (
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
 title text not null check (length(title) between 1 and 100),
 payload jsonb not null,
 created_at timestamptz not null default now()
);
create index ledger_user_date on public.ledger(user_id,occurred_at desc);
alter table public.profiles enable row level security;
alter table public.ledger enable row level security;
alter table public.favorites enable row level security;
alter table public.saved_operations enable row level security;
create policy profiles_own on public.profiles for all to authenticated using(id=auth.uid()) with check(id=auth.uid());
create policy ledger_own on public.ledger for all to authenticated using(user_id=auth.uid()) with check(user_id=auth.uid());
create policy favorites_own on public.favorites for all to authenticated using(user_id=auth.uid()) with check(user_id=auth.uid());
create policy operations_own on public.saved_operations for all to authenticated using(user_id=auth.uid()) with check(user_id=auth.uid());
grant select,insert,update,delete on public.profiles,public.ledger,public.favorites,public.saved_operations to authenticated;
