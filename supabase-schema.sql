create extension if not exists pgcrypto;
create table if not exists public.employees(id uuid primary key default gen_random_uuid(),name text not null,employee_code text not null unique,designation text,section text,joining_date date,monthly_salary numeric not null default 0,created_at timestamptz not null default now());
create table if not exists public.attendance(id uuid primary key default gen_random_uuid(),employee_id uuid not null references public.employees(id) on delete cascade,work_date date not null,in_time time,out_time time,hours numeric not null default 0,overtime_hours numeric not null default 0,advance numeric not null default 0,status text not null default 'present',note text,created_at timestamptz not null default now());
create table if not exists public.stock_items(id uuid primary key default gen_random_uuid(),name text not null,unit text,quantity numeric not null default 0,low_stock_limit numeric not null default 5,created_at timestamptz not null default now());
alter table public.employees enable row level security; alter table public.attendance enable row level security; alter table public.stock_items enable row level security;
create policy "auth employees all" on public.employees for all to authenticated using(true) with check(true);
create policy "auth attendance all" on public.attendance for all to authenticated using(true) with check(true);
create policy "auth stock all" on public.stock_items for all to authenticated using(true) with check(true);
