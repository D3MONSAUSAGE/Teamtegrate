-- 1) Restrict direct updates to protected fields on public.users
-- Create a trigger function that blocks changes to role, organization_id, and email
-- unless the request JWT role is service_role (i.e., performed by trusted backend)

create or replace function public.prevent_privileged_user_field_changes()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'UPDATE' then
    if (new.role is distinct from old.role)
       or (new.organization_id is distinct from old.organization_id)
       or (new.email is distinct from old.email) then
      -- Check JWT role claim; only allow service_role to modify protected fields
      if coalesce((auth.jwt() ->> 'role'), '') <> 'service_role' then
        raise exception 'Changing protected fields (role, organization_id, email) is not allowed from client';
      end if;
    end if;
  end if;
  return new;
end;
$$;

-- Create trigger (idempotent: drop if exists first)
drop trigger if exists trg_prevent_privileged_user_field_changes on public.users;
create trigger trg_prevent_privileged_user_field_changes
before update on public.users
for each row
execute function public.prevent_privileged_user_field_changes();

-- 2) Enforce self-only updates at RLS level explicitly (defensive)
-- This policy is RESTRICTIVE so it must be satisfied in addition to other policies
-- Create only if doesn't exist

do $$
begin
  if not exists (
    select 1 from pg_policies 
    where schemaname = 'public' and tablename = 'users' and policyname = 'users_self_update_only_restrictive'
  ) then
    execute 'create policy users_self_update_only_restrictive
      as restrictive
      on public.users
      for update
      to authenticated
      using (auth.uid() = id)
      with check (auth.uid() = id)';
  end if;
end;
$$;