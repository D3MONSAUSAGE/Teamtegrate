import { supabase } from "@/integrations/supabase/client";
import type { ReportFilter } from "@/types/reports";

const DEBUG_REPORTS = false;

const join = (arr?: string[]) => arr && arr.length ? arr : null;

export async function getUserDailyReport(filter: ReportFilter) {
  if (DEBUG_REPORTS) {
    console.info("[reports] getUserDailyReport filter", filter);
  }

  // RPC accepts timezone-aware anchors:
  // p_org, p_user, p_day, p_team (csv or null), p_tz
  const { data, error } = await supabase.rpc("rpc_task_report_user_day", {
    p_org: filter.orgId,
    p_user: filter.userId ?? null,
    p_day: filter.dateISO,
    p_team: join(filter.teamIds),
    p_tz: filter.timezone,
  });

  if (error) {
    console.error("[reports] getUserDailyReport error:", error);
    throw error;
  }

  if (DEBUG_REPORTS) {
    console.info("[reports] getUserDailyReport result counts", {
      current_due: data?.[0]?.current_due || 0,
      overdue: data?.[0]?.overdue || 0,
      completed: data?.[0]?.completed || 0,
      created: data?.[0]?.created || 0,
      assigned: data?.[0]?.assigned || 0,
      daily_score: data?.[0]?.daily_score || 0,
    });
  }

  return data?.[0] || {
    current_due: 0,
    overdue: 0, 
    completed: 0,
    created: 0,
    assigned: 0,
    daily_score: 100,
    total_due_today: 0,
  };
}

export async function getUserWeeklyReport(filter: ReportFilter) {
  if (DEBUG_REPORTS) {
    console.info("[reports] getUserWeeklyReport filter", filter);
  }

  // Use rpc_task_report_user_week for weekly data
  const { data, error } = await supabase.rpc("rpc_task_report_user_week", {
    p_org: filter.orgId,
    p_user: filter.userId ?? null,
    p_week_start: filter.weekStartISO || filter.dateISO,
    p_team: join(filter.teamIds),
    p_tz: filter.timezone,
  });

  if (error) {
    console.error("[reports] getUserWeeklyReport error:", error);
    throw error;
  }

  if (DEBUG_REPORTS) {
    console.info("[reports] getUserWeeklyReport result", {
      records: data?.length || 0,
      sample: data?.[0],
    });
  }

  return data || [];
}