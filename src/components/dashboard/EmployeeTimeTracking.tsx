
import React from 'react';
import { useEmployeeTimeTracking } from '@/hooks/useEmployeeTimeTracking';
import EmployeeTimeControls from './employee-time/EmployeeTimeControls';
import EmployeeDailySummary from './employee-time/EmployeeDailySummary';
import EmployeeComplianceAlert from './employee-time/EmployeeComplianceAlert';
import EmployeeWeeklyReport from './employee-time/EmployeeWeeklyReport';
import ConnectionStatus from './ConnectionStatus';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Clock, AlertTriangle, CheckCircle } from 'lucide-react';

const EmployeeTimeTracking: React.FC = () => {
  const {
    currentSession,
    dailySummary,
    weeklyEntries,
    isLoading,
    lastError,
    clockIn,
    clockOut,
    startBreak,
    endBreak,
    autoCloseStaleSessionsAPI
  } = useEmployeeTimeTracking();

  const hasComplianceIssues = dailySummary?.compliance_notes;
  const isOvertime = (dailySummary?.overtime_minutes || 0) > 0;

  return (
    <div className="space-y-6">
      {/* Connection Status */}
      <ConnectionStatus 
        lastError={lastError}
        onRetry={autoCloseStaleSessionsAPI}
        isLoading={isLoading}
      />

      {/* Header with Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-r from-primary/20 to-accent/20 rounded-xl flex items-center justify-center">
              <Clock className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-semibold">Employee Time Tracking</h2>
              <p className="text-sm text-muted-foreground">
                Professional time management with compliance monitoring
              </p>
            </div>
            <div className="ml-auto flex items-center gap-2">
              {hasComplianceIssues ? (
                <div className="flex items-center gap-1 text-amber-600">
                  <AlertTriangle className="h-4 w-4" />
                  <span className="text-xs">Compliance Issues</span>
                </div>
              ) : (
                <div className="flex items-center gap-1 text-green-600">
                  <CheckCircle className="h-4 w-4" />
                  <span className="text-xs">Compliant</span>
                </div>
              )}
              {isOvertime && (
                <div className="flex items-center gap-1 text-orange-600">
                  <Clock className="h-4 w-4" />
                  <span className="text-xs">Overtime: {Math.floor((dailySummary?.overtime_minutes || 0) / 60)}h {(dailySummary?.overtime_minutes || 0) % 60}m</span>
                </div>
              )}
            </div>
          </CardTitle>
        </CardHeader>
      </Card>

      {/* Time Controls */}
      <EmployeeTimeControls
        currentSession={currentSession}
        onClockIn={clockIn}
        onClockOut={clockOut}
        onStartBreak={startBreak}
        onEndBreak={endBreak}
        isLoading={isLoading}
      />

      {/* Compliance Alert */}
      {hasComplianceIssues && (
        <EmployeeComplianceAlert
          complianceNotes={dailySummary.compliance_notes}
          totalWorkMinutes={dailySummary.total_work_minutes}
          totalBreakMinutes={dailySummary.total_break_minutes}
        />
      )}

      {/* Daily Summary */}
      <EmployeeDailySummary
        dailySummary={dailySummary}
        currentSession={currentSession}
      />

      {/* Weekly Report */}
      <EmployeeWeeklyReport
        weeklyEntries={weeklyEntries}
      />
    </div>
  );
};

export default EmployeeTimeTracking;
