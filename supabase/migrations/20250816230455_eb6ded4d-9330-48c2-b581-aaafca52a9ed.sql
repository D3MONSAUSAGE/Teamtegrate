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