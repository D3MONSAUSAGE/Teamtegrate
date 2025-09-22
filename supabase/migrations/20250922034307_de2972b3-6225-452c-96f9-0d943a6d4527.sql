-- Add team + shift linkage, geo, and approvals to time entries
alter table public.time_entries
  add column if not exists team_id uuid null,
  add column if not exists shift_id uuid null,
  add column if not exists clock_in_lat numeric null,
  add column if not exists clock_in_lng numeric null,
  add column if not exists clock_out_lat numeric null,
  add column if not exists clock_out_lng numeric null,
  add column if not exists approved_by uuid null,
  add column if not exists approved_at timestamptz null;

-- Add indexes for performance
create index if not exists idx_time_entries_team on public.time_entries (team_id, clock_in_at);
create index if not exists idx_time_entries_shift on public.time_entries (shift_id);

-- Add team_id index to employee_schedules for faster team filtering
create index if not exists idx_employee_schedules_team on public.employee_schedules (team_id, scheduled_date);