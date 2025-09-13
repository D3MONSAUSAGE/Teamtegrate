import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Calendar as CalendarIcon, 
  Download, 
  ChevronLeft, 
  ChevronRight, 
  TrendingUp,
  Users,
  CalendarDays,
  CheckCircle2,
  ShieldCheck
} from "lucide-react";
import { toast } from "@/components/ui/sonner";
import { format, addWeeks, subWeeks, endOfWeek } from 'date-fns';
import { useWeeklyChecklistReports } from '@/hooks/useWeeklyChecklistReports';
import { DailyScoreCard } from './DailyScoreCard';

const ChecklistTeamReportsTab: React.FC = () => {
  const {
    weeklyData,
    selectedWeek,
    setSelectedWeek,
    selectedTeam,
    setSelectedTeam,
    teams,
    weeksWithData,
    totalChecklists,
    isLoading,
    error
  } = useWeeklyChecklistReports();

  const handleExportWeekly = () => {
    if (!weeklyData) {
      toast.error("No weekly data to export");
      return;
    }
    
    const headers = [
      'Day', 'Date', 'Team', 'Total Checklists', 'Completed', 'Verified', 
      'Execution %', 'Verification %'
    ];
    
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    const csvContent = [
      headers.join(','),
      ...days.map(day => {
        const dailyData = weeklyData.dailyScores.find(score => 
          format(new Date(score.date), 'EEEE') === day
        );
        
        if (!dailyData) {
          return `${day},,${weeklyData.teamName},0,0,0,0,0`;
        }
        
        return [
          day,
          dailyData.date,
          weeklyData.teamName,
          dailyData.totalChecklists,
          dailyData.completedChecklists,
          dailyData.verifiedChecklists,
          dailyData.executionPercentage,
          dailyData.verificationPercentage
        ].join(',');
      }),
      '',
      // Summary
      [
        'SUMMARY',
        `${format(weeklyData.weekStart, 'MMM dd')} - ${format(weeklyData.weekEnd, 'MMM dd')}`,
        weeklyData.teamName,
        weeklyData.totals.totalChecklists,
        weeklyData.totals.completedChecklists,
        weeklyData.totals.verifiedChecklists,
        weeklyData.totals.averageExecutionPercentage,
        weeklyData.totals.averageVerificationPercentage
      ].join(',')
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `checklist-report-${format(weeklyData.weekStart, 'yyyy-MM-dd')}-${weeklyData.teamName.replace(/\s+/g, '-')}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    
    toast.success("Team report exported successfully!");
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-8">
          <div className="flex items-center justify-center space-x-2">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
            <p className="text-muted-foreground">Loading team reports...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Alert>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Data Summary */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="flex flex-wrap gap-6 text-sm">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-primary" />
                <span className="font-medium">Total Checklists:</span>
                <Badge variant="secondary">{totalChecklists}</Badge>
              </div>
              <div className="flex items-center gap-2">
                <CalendarDays className="h-4 w-4 text-primary" />
                <span className="font-medium">Selected Week:</span>
                <span className="text-muted-foreground">
                  {format(selectedWeek, 'MMM dd')} - {format(endOfWeek(selectedWeek, { weekStartsOn: 1 }), 'MMM dd, yyyy')}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-primary" />
                <span className="font-medium">Selected Team:</span>
                <Badge variant="outline">{teams.find(t => t.id === selectedTeam)?.name || 'All Teams'}</Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Controls */}
      <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
          {/* Week Navigation */}
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedWeek(subWeeks(selectedWeek, 1))}
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedWeek(new Date())}
            >
              Current Week
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedWeek(addWeeks(selectedWeek, 1))}
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          
          {/* Team Filter */}
          <Select value={selectedTeam} onValueChange={setSelectedTeam}>
            <SelectTrigger className="w-48">
              <Users className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Select team" />
            </SelectTrigger>
            <SelectContent>
              {teams.map(team => (
                <SelectItem key={team.id} value={team.id}>
                  {team.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        {/* Export Button */}
        <Button 
          onClick={handleExportWeekly} 
          variant="outline" 
          disabled={!weeklyData || weeklyData.dailyScores.length === 0}
        >
          <Download className="h-4 w-4 mr-2" />
          Export Team Report
        </Button>
      </div>

      {/* Weekly Scores Display */}
      {weeklyData && weeklyData.dailyScores.length > 0 ? (
        <div className="space-y-6">
          {/* Daily Score Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-7 gap-4">
            {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(day => {
              const dayData = weeklyData.dailyScores.find(score => 
                format(new Date(score.date), 'EEEE') === day
              );
              return (
                <DailyScoreCard 
                  key={day} 
                  day={day} 
                  data={dayData} 
                />
              );
            })}
          </div>

          {/* Weekly Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Weekly Summary - {weeklyData.teamName}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">{weeklyData.totals.totalChecklists}</div>
                  <div className="text-sm text-muted-foreground">Total Checklists</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{weeklyData.totals.completedChecklists}</div>
                  <div className="text-sm text-muted-foreground">Completed</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{weeklyData.totals.averageExecutionPercentage}%</div>
                  <div className="text-sm text-muted-foreground">Avg Execution</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">{weeklyData.totals.averageVerificationPercentage}%</div>
                  <div className="text-sm text-muted-foreground">Avg Verification</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        <Card>
          <CardContent className="p-8">
            <div className="text-center space-y-4">
              <div className="mx-auto h-16 w-16 rounded-full bg-muted flex items-center justify-center">
                <ShieldCheck className="h-8 w-8 text-muted-foreground" />
              </div>
              
              <div className="space-y-2">
                <h3 className="text-lg font-medium">No Checklist Data Found</h3>
                <p className="text-muted-foreground">
                  No checklist data found for {format(selectedWeek, 'MMM dd')} - {format(endOfWeek(selectedWeek, { weekStartsOn: 1 }), 'MMM dd, yyyy')}
                  {selectedTeam !== 'all' && ` for ${teams.find(t => t.id === selectedTeam)?.name}`}
                </p>
              </div>
              
              {totalChecklists > 0 && (
                <Alert>
                  <TrendingUp className="h-4 w-4" />
                  <AlertDescription>
                    You have {totalChecklists} checklists. Try selecting a different week or team.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ChecklistTeamReportsTab;