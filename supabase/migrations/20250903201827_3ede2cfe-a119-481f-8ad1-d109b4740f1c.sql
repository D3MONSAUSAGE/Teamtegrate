
-- 1) Table for manual quiz answer overrides
create table if not exists public.quiz_answer_overrides (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  quiz_attempt_id uuid not null references public.quiz_attempts(id) on delete cascade,
  question_id uuid not null references public.quiz_questions(id) on delete restrict,
  original_score integer not null default 0,
  override_score integer not null,
  reason text not null,
  overridden_by uuid not null references public.users(id) on delete restrict,
  overridden_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint uq_override_per_question unique (quiz_attempt_id, question_id)
);

-- Helpful indexes
create index if not exists idx_overrides_attempt on public.quiz_answer_overrides(quiz_attempt_id);
create index if not exists idx_overrides_org on public.quiz_answer_overrides(organization_id);

-- 2) RLS and policies (admin/superadmin/manager in the same org)
alter table public.quiz_answer_overrides enable row level security;

-- Read
drop policy if exists "org admins can read overrides" on public.quiz_answer_overrides;
create policy "org admins can read overrides"
  on public.quiz_answer_overrides
  for select
  using (
    exists (
      select 1
      from public.users u
      where u.id = auth.uid()
        and u.organization_id = quiz_answer_overrides.organization_id
        and u.role in ('admin','superadmin','manager')
    )
  );

-- Insert
drop policy if exists "org admins can insert overrides" on public.quiz_answer_overrides;
create policy "org admins can insert overrides"
  on public.quiz_answer_overrides
  for insert
  with check (
    exists (
      select 1
      from public.users u
      where u.id = auth.uid()
        and u.organization_id = quiz_answer_overrides.organization_id
        and u.role in ('admin','superadmin','manager')
    )
    and overridden_by = auth.uid()
  );

-- Update
drop policy if exists "org admins can update overrides" on public.quiz_answer_overrides;
create policy "org admins can update overrides"
  on public.quiz_answer_overrides
  for update
  using (
    exists (
      select 1
      from public.users u
      where u.id = auth.uid()
        and u.organization_id = quiz_answer_overrides.organization_id
        and u.role in ('admin','superadmin','manager')
    )
  )
  with check (
    exists (
      select 1
      from public.users u
      where u.id = auth.uid()
        and u.organization_id = quiz_answer_overrides.organization_id
        and u.role in ('admin','superadmin','manager')
    )
  );

-- Delete
drop policy if exists "org admins can delete overrides" on public.quiz_answer_overrides;
create policy "org admins can delete overrides"
  on public.quiz_answer_overrides
  for delete
  using (
    exists (
      select 1
      from public.users u
      where u.id = auth.uid()
        and u.organization_id = quiz_answer_overrides.organization_id
        and u.role in ('admin','superadmin','manager')
    )
  );

-- 3) Timestamps: updated_at and overridden_at
create or replace function public.set_quiz_override_audit_fields()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    if new.overridden_by is null then
      new.overridden_by := auth.uid();
    end if;
    new.overridden_at := coalesce(new.overridden_at, now());
  elsif tg_op = 'UPDATE' then
    -- keep who did the original override; only touch timestamp
    new.overridden_at := now();
  end if;
  return new;
end;
$$;

drop trigger if exists trg_quiz_override_audit on public.quiz_answer_overrides;
create trigger trg_quiz_override_audit
before insert or update on public.quiz_answer_overrides
for each row execute function public.set_quiz_override_audit_fields();

-- Reuse existing generic updated_at trigger
drop trigger if exists trg_quiz_override_updated_at on public.quiz_answer_overrides;
create trigger trg_quiz_override_updated_at
before update on public.quiz_answer_overrides
for each row execute function public.update_updated_at_column();

-- 4) Recalculate attempt score and pass/fail when overrides change
create or replace function public.apply_quiz_override_delta()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_attempt_id uuid;
  v_delta int := 0;
  v_cur_score int;
  v_max_score int;
  v_quiz_id uuid;
  v_new_score int;
  v_passing_percent int;
  v_pass bool;
begin
  if tg_op = 'INSERT' then
    v_attempt_id := new.quiz_attempt_id;
    v_delta := new.override_score - new.original_score;
  elsif tg_op = 'UPDATE' then
    v_attempt_id := new.quiz_attempt_id;
    v_delta := new.override_score - old.override_score;
  elsif tg_op = 'DELETE' then
    v_attempt_id := old.quiz_attempt_id;
    v_delta := old.original_score - old.override_score;
  end if;

  -- Load current attempt values
  select score, max_score, quiz_id
  into v_cur_score, v_max_score, v_quiz_id
  from public.quiz_attempts
  where id = v_attempt_id;

  -- If attempt not found, nothing to do
  if v_cur_score is null then
    if tg_op = 'DELETE' then
      return old;
    else
      return new;
    end if;
  end if;

  -- New bounded score
  v_new_score := greatest(0, least(v_max_score, v_cur_score + v_delta));

  -- Compute pass based on quiz passing_score (percentage)
  select coalesce(passing_score, 0) into v_passing_percent
  from public.quizzes
  where id = v_quiz_id;

  v_pass := ((v_new_score::numeric / nullif(v_max_score,0)::numeric) * 100) >= v_passing_percent;

  update public.quiz_attempts
    set score = v_new_score,
        passed = coalesce(v_pass, passed)
  where id = v_attempt_id;

  if tg_op = 'DELETE' then
    return old;
  else
    return new;
  end if;
end;
$$;

drop trigger if exists trg_apply_override_delta on public.quiz_answer_overrides;
create trigger trg_apply_override_delta
after insert or update or delete on public.quiz_answer_overrides
for each row execute function public.apply_quiz_override_delta();
