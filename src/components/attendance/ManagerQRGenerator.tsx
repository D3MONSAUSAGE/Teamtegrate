import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { QrCode, Clock, RefreshCw, User, CheckCircle, XCircle } from 'lucide-react';
import QRCode from 'qrcode';
import { useAuth } from '@/contexts/AuthContext';

interface Employee {
  id: string;
  name: string;
  email: string;
  employee_id?: string;
}

interface ManagerQRGeneratorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ManagerQRGenerator: React.FC<ManagerQRGeneratorProps> = ({ open, onOpenChange }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('');
  const [tokenType, setTokenType] = useState<'clock_in' | 'clock_out'>('clock_in');
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [expiresAt, setExpiresAt] = useState<Date | null>(null);
  const [employeeName, setEmployeeName] = useState<string>('');
  const [countdown, setCountdown] = useState<number>(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [hasActiveSession, setHasActiveSession] = useState(false);
  const [hasScheduleToday, setHasScheduleToday] = useState(false);

  // Fetch employees in organization
  useEffect(() => {
    if (open && user) {
      fetchEmployees();
    }
  }, [open, user]);

  // Check employee status when selected
  useEffect(() => {
    if (selectedEmployeeId) {
      checkEmployeeStatus(selectedEmployeeId);
    }
  }, [selectedEmployeeId]);

  // Countdown timer
  useEffect(() => {
    if (!expiresAt) return;

    const timer = setInterval(() => {
      const now = new Date();
      const remaining = Math.max(0, Math.floor((expiresAt.getTime() - now.getTime()) / 1000));
      setCountdown(remaining);

      if (remaining === 0) {
        setQrCodeUrl('');
        setExpiresAt(null);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [expiresAt]);

  const fetchEmployees = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, name, email, employee_id')
        .eq('organization_id', user?.organizationId)
        .order('name');

      if (error) throw error;
      setEmployees(data || []);
    } catch (error) {
      console.error('Error fetching employees:', error);
      toast({
        title: 'Error',
        description: 'Failed to load employees',
        variant: 'destructive',
      });
    }
  };

  const checkEmployeeStatus = async (employeeId: string) => {
    try {
      // Check active time entry
      const { data: activeEntry } = await supabase
        .from('time_entries')
        .select('id')
        .eq('user_id', employeeId)
        .is('clock_out', null)
        .limit(1);

      setHasActiveSession(!!activeEntry && activeEntry.length > 0);

      // Check today's schedule
      const today = new Date().toISOString().split('T')[0];
      const { data: schedules } = await supabase
        .from('employee_schedules')
        .select('id')
        .eq('employee_id', employeeId)
        .eq('scheduled_date', today)
        .eq('status', 'scheduled');

      setHasScheduleToday(!!schedules && schedules.length > 0);
    } catch (error) {
      console.error('Error checking employee status:', error);
    }
  };

  const generateQR = async () => {
    if (!selectedEmployeeId) {
      toast({
        title: 'Error',
        description: 'Please select an employee',
        variant: 'destructive',
      });
      return;
    }

    setIsGenerating(true);

    try {
      const { data, error } = await supabase.functions.invoke('generate-attendance-qr', {
        body: {
          tokenType,
          expirationSeconds: 45,
          targetUserId: selectedEmployeeId,
        },
      });

      if (error) throw error;

      if (!data.success) {
        throw new Error(data.error || data.details || 'Failed to generate QR code');
      }

      // Generate QR code image
      const qrUrl = await QRCode.toDataURL(data.token, {
        width: 400,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF',
        },
      });

      setQrCodeUrl(qrUrl);
      setExpiresAt(new Date(data.expiresAt));
      setEmployeeName(data.userName);
      setCountdown(45);

      toast({
        title: 'QR Code Generated',
        description: `Ready for ${data.userName} to ${tokenType === 'clock_in' ? 'clock in' : 'clock out'}`,
      });
    } catch (error: any) {
      console.error('Error generating QR:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to generate QR code',
        variant: 'destructive',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRegenerateQR = () => {
    generateQR();
  };

  const selectedEmployee = employees.find(e => e.id === selectedEmployeeId);
  const canGenerateClockIn = !hasActiveSession && hasScheduleToday;
  const canGenerateClockOut = hasActiveSession;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <QrCode className="h-5 w-5" />
            Generate QR for Employee
          </DialogTitle>
          <DialogDescription>
            Help employees without phones clock in/out by generating a QR code for them
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Employee Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Select Employee</label>
            <Select value={selectedEmployeeId} onValueChange={setSelectedEmployeeId}>
              <SelectTrigger>
                <SelectValue placeholder="Choose an employee..." />
              </SelectTrigger>
              <SelectContent>
                {employees.map((employee) => (
                  <SelectItem key={employee.id} value={employee.id}>
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      <span>{employee.name}</span>
                      {employee.employee_id && (
                        <span className="text-muted-foreground text-xs">
                          ({employee.employee_id})
                        </span>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Employee Status */}
          {selectedEmployee && (
            <div className="rounded-lg border p-3 space-y-2 bg-muted/50">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Schedule Today:</span>
                <div className="flex items-center gap-1">
                  {hasScheduleToday ? (
                    <CheckCircle className="h-4 w-4 text-success" />
                  ) : (
                    <XCircle className="h-4 w-4 text-destructive" />
                  )}
                  <span className="font-medium">
                    {hasScheduleToday ? 'Yes' : 'No'}
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Currently Clocked In:</span>
                <div className="flex items-center gap-1">
                  {hasActiveSession ? (
                    <CheckCircle className="h-4 w-4 text-success" />
                  ) : (
                    <XCircle className="h-4 w-4 text-muted-foreground" />
                  )}
                  <span className="font-medium">
                    {hasActiveSession ? 'Yes' : 'No'}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Action Type Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Action Type</label>
            <Select 
              value={tokenType} 
              onValueChange={(value) => setTokenType(value as 'clock_in' | 'clock_out')}
              disabled={!selectedEmployeeId}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="clock_in" disabled={!canGenerateClockIn}>
                  Clock In {!hasScheduleToday && '(No Schedule)'}
                </SelectItem>
                <SelectItem value="clock_out" disabled={!canGenerateClockOut}>
                  Clock Out {!hasActiveSession && '(Not Clocked In)'}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Generate Button */}
          {!qrCodeUrl && (
            <Button
              onClick={generateQR}
              disabled={isGenerating || !selectedEmployeeId || 
                (tokenType === 'clock_in' && !canGenerateClockIn) ||
                (tokenType === 'clock_out' && !canGenerateClockOut)}
              className="w-full"
              size="lg"
            >
              <QrCode className="h-4 w-4 mr-2" />
              {isGenerating ? 'Generating...' : 'Generate QR Code'}
            </Button>
          )}

          {/* QR Code Display */}
          {qrCodeUrl && (
            <div className="space-y-4">
              <div className="flex flex-col items-center gap-4 p-6 rounded-lg border bg-white">
                <img src={qrCodeUrl} alt="QR Code" className="w-64 h-64" />
                
                <div className="text-center space-y-2">
                  <p className="font-medium">{employeeName}</p>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    <span>
                      Expires in {countdown}s
                    </span>
                  </div>
                </div>

                <Button
                  onClick={handleRegenerateQR}
                  variant="outline"
                  size="sm"
                  disabled={isGenerating || countdown > 5}
                  className="w-full"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Regenerate
                </Button>
              </div>

              <p className="text-xs text-center text-muted-foreground">
                Hold this QR code up to the scanner station for {selectedEmployee?.name} to {tokenType === 'clock_in' ? 'clock in' : 'clock out'}
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};