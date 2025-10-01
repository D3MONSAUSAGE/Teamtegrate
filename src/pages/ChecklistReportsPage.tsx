import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/auth/AuthProvider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, ChevronLeft, Download } from "lucide-react";
import { format, startOfWeek, addDays } from "date-fns";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { DailyChecklistReport } from "@/components/reports/checklist/DailyChecklistReport";
import { WeeklyChecklistReport } from "@/components/reports/checklist/WeeklyChecklistReport";
import { TeamComparisonReport } from "@/components/reports/checklist/TeamComparisonReport";
import {
  getDailyChecklistScores,
  getWeeklyChecklistSummary,
  getTeamComparison,
} from "@/services/checklistReportsService";
import { useNavigate } from "react-router-dom";
import { useIsMobile } from "@/hooks/use-mobile";

export default function ChecklistReportsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedTeam, setSelectedTeam] = useState<string>("all");
  const [activeTab, setActiveTab] = useState<"daily" | "weekly" | "comparison">("daily");

  const isAdmin = user?.role === "admin" || user?.role === "superadmin";
  const isManager = user?.role === "manager" || isAdmin;

  // Get user's team if they're a manager
  const { data: userTeam } = useQuery({
    queryKey: ["user-team", user?.id],
    queryFn: async () => {
      if (!user?.id || isAdmin) return null;
      const { data } = await supabase
        .from("teams")
        .select("id")
        .eq("manager_id", user.id)
        .single();
      return data;
    },
    enabled: !!user && isManager && !isAdmin,
  });

  // Get teams for admin selector
  const { data: teams } = useQuery({
    queryKey: ["teams", user?.organizationId],
    queryFn: async () => {
      if (!user?.organizationId) return [];
      const { data } = await supabase
        .from("teams")
        .select("id, name")
        .eq("organization_id", user.organizationId)
        .eq("is_active", true)
        .order("name");
      return data || [];
    },
    enabled: !!user?.organizationId && isAdmin,
  });

  const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 });
  const dateString = format(selectedDate, "yyyy-MM-dd");
  const weekStartString = format(weekStart, "yyyy-MM-dd");

  const effectiveTeamId = selectedTeam === "all" ? undefined : selectedTeam;

  // Daily report data
  const { data: dailyData, isLoading: dailyLoading } = useQuery({
    queryKey: ["checklist-daily-report", user?.organizationId, effectiveTeamId, dateString],
    queryFn: () =>
      getDailyChecklistScores(
        user!.organizationId,
        effectiveTeamId || (userTeam?.id as string),
        dateString,
        user?.timezone || "UTC"
      ),
    enabled: !!user?.organizationId && activeTab === "daily",
  });

  // Weekly report data
  const { data: weeklyData, isLoading: weeklyLoading } = useQuery({
    queryKey: ["checklist-weekly-report", user?.organizationId, effectiveTeamId, weekStartString],
    queryFn: () =>
      getWeeklyChecklistSummary(
        user!.organizationId,
        effectiveTeamId || (userTeam?.id as string),
        weekStartString,
        user?.timezone || "UTC"
      ),
    enabled: !!user?.organizationId && activeTab === "weekly",
  });

  // Team comparison data (admin only)
  const { data: comparisonData, isLoading: comparisonLoading } = useQuery({
    queryKey: ["checklist-team-comparison", user?.organizationId, weekStartString],
    queryFn: () => getTeamComparison(user!.organizationId, weekStartString, user?.timezone || "UTC"),
    enabled: !!user?.organizationId && isAdmin && activeTab === "comparison",
  });

  if (!user || !isManager) {
    return (
      <div className="container mx-auto p-4">
        <Card>
          <CardContent className="p-6">
            <p className="text-center text-muted-foreground">
              You don't have permission to view this page.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className={cn("container mx-auto", isMobile ? "p-4" : "p-6")}>
      {/* Header */}
      <div className="mb-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("/dashboard/reports")}
          className="mb-4"
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          Back to Reports
        </Button>
        <h1 className="text-3xl font-bold mb-2">Checklist Reports</h1>
        <p className="text-muted-foreground">
          {isAdmin
            ? "View and compare checklist performance across all teams"
            : "Monitor your team's checklist execution and verification scores"}
        </p>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className={cn("pt-6", isMobile ? "space-y-4" : "flex items-center gap-4")}>
          <div className={cn("flex items-center gap-4", isMobile && "flex-col w-full")}>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className={cn("justify-start", isMobile && "w-full")}>
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {format(selectedDate, "MMM d, yyyy")}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar mode="single" selected={selectedDate} onSelect={(date) => date && setSelectedDate(date)} />
              </PopoverContent>
            </Popover>

            {isAdmin && (
              <Select value={selectedTeam} onValueChange={setSelectedTeam}>
                <SelectTrigger className={cn("w-[200px]", isMobile && "w-full")}>
                  <SelectValue placeholder="Select team" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Teams</SelectItem>
                  {teams?.map((team) => (
                    <SelectItem key={team.id} value={team.id}>
                      {team.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          <div className="flex-1" />

          <Button variant="outline" size={isMobile ? "sm" : "default"} className={isMobile ? "w-full" : ""}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </CardContent>
      </Card>

      {/* Reports Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="space-y-4">
        <TabsList className={cn("grid", isAdmin ? "grid-cols-3" : "grid-cols-2", isMobile && "w-full")}>
          <TabsTrigger value="daily">Daily Report</TabsTrigger>
          <TabsTrigger value="weekly">Weekly Summary</TabsTrigger>
          {isAdmin && <TabsTrigger value="comparison">Team Rankings</TabsTrigger>}
        </TabsList>

        <TabsContent value="daily" className="space-y-4">
          <DailyChecklistReport data={dailyData || []} isLoading={dailyLoading} date={dateString} />
        </TabsContent>

        <TabsContent value="weekly" className="space-y-4">
          <WeeklyChecklistReport data={weeklyData || []} isLoading={weeklyLoading} weekStart={weekStartString} />
        </TabsContent>

        {isAdmin && (
          <TabsContent value="comparison" className="space-y-4">
            <TeamComparisonReport
              data={comparisonData || []}
              isLoading={comparisonLoading}
              weekStart={weekStartString}
            />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
