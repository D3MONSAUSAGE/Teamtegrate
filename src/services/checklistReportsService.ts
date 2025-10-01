import { supabase } from "@/integrations/supabase/client";

export interface DailyChecklistScore {
  team_id: string;
  team_name: string;
  user_id: string;
  user_name: string;
  total_checklists: number;
  completed_checklists: number;
  pending_checklists: number;
  submitted_checklists: number;
  approved_checklists: number;
  rejected_checklists: number;
  execution_score: number;
  verification_score: number;
  avg_execution_score: number;
  avg_verification_score: number;
  completion_rate: number;
}

export interface WeeklyChecklistSummary {
  week_start: string;
  team_id: string;
  team_name: string;
  total_checklists: number;
  completed_checklists: number;
  pending_checklists: number;
  approved_checklists: number;
  rejected_checklists: number;
  avg_execution_score: number;
  avg_verification_score: number;
  completion_rate: number;
  on_time_rate: number;
  daily_breakdown: any;
}

export interface TeamComparison {
  team_id: string;
  team_name: string;
  total_score: number;
  execution_score: number;
  verification_score: number;
  completion_rate: number;
  on_time_rate: number;
  team_rank: number;
  week_over_week_change: number;
}

export async function getDailyChecklistScores(
  orgId: string,
  teamId?: string,
  date?: string,
  timezone: string = 'UTC'
): Promise<DailyChecklistScore[]> {
  const { data, error } = await supabase.rpc("rpc_checklist_report_daily_scores", {
    p_org: orgId,
    p_team: teamId || null,
    p_date: date || new Date().toISOString().split('T')[0],
    p_tz: timezone,
  });

  if (error) {
    console.error("[checklistReports] getDailyChecklistScores error:", error);
    throw error;
  }

  return data || [];
}

export async function getWeeklyChecklistSummary(
  orgId: string,
  teamId?: string,
  weekStart?: string,
  timezone: string = 'UTC'
): Promise<WeeklyChecklistSummary[]> {
  const { data, error } = await supabase.rpc("rpc_checklist_report_weekly_summary", {
    p_org: orgId,
    p_team: teamId || null,
    p_week_start: weekStart || new Date().toISOString().split('T')[0],
    p_tz: timezone,
  });

  if (error) {
    console.error("[checklistReports] getWeeklyChecklistSummary error:", error);
    throw error;
  }

  return data || [];
}

export async function getTeamComparison(
  orgId: string,
  weekStart?: string,
  timezone: string = 'UTC'
): Promise<TeamComparison[]> {
  const { data, error } = await supabase.rpc("rpc_checklist_report_team_comparison", {
    p_org: orgId,
    p_week_start: weekStart || new Date().toISOString().split('T')[0],
    p_tz: timezone,
  });

  if (error) {
    console.error("[checklistReports] getTeamComparison error:", error);
    throw error;
  }

  return data || [];
}
