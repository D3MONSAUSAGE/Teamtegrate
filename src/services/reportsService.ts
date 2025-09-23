import { supabase } from "@/integrations/supabase/client";
import type { ReportFilter } from "@/types/reports";

const DEBUG_REPORTS = false;

const asArrayOrNull = (a?: string[]) => (a && a.length ? a : null);

export async function getDailyLists(filter: ReportFilter) {
  if (DEBUG_REPORTS) {
    console.info("[reports] getDailyLists filter", filter);
  }

  const { data, error } = await supabase.rpc("rpc_task_report_user_day_lists", {
    p_org: filter.orgId,
    p_user: filter.userId ?? null,
    p_day: filter.dateISO,
    p_team: asArrayOrNull(filter.teamIds),
    p_tz: filter.timezone,
  });

  if (error) {
    console.error("[reports] getDailyLists error:", error);
    throw error;
  }

  if (DEBUG_REPORTS) {
    console.info("[reports] getDailyLists result", {
      total_rows: data?.length || 0,
      buckets: data?.reduce((acc: any, row: any) => {
        acc[row.bucket] = (acc[row.bucket] || 0) + 1;
        return acc;
      }, {}) || {},
    });
  }

  return data ?? [];
}

export async function getWeeklyLists(filter: ReportFilter) {
  if (DEBUG_REPORTS) {
    console.info("[reports] getWeeklyLists filter", filter);
  }

  const { data, error } = await supabase.rpc("rpc_task_report_user_week_lists", {
    p_org: filter.orgId,
    p_user: filter.userId ?? null,
    p_week_start: filter.weekStartISO || filter.dateISO,
    p_team: asArrayOrNull(filter.teamIds),
    p_tz: filter.timezone,
  });

  if (error) {
    console.error("[reports] getWeeklyLists error:", error);
    throw error;
  }

  if (DEBUG_REPORTS) {
    console.info("[reports] getWeeklyLists result", {
      total_rows: data?.length || 0,
      days: [...new Set(data?.map((row: any) => row.day_date) || [])],
    });
  }

  return data ?? [];
}