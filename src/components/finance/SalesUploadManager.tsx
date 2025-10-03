import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { 
  CalendarIcon, 
  Upload, 
  Loader2, 
  CheckCircle, 
  AlertCircle, 
  FileText,
  X,
  Sparkles,
  AlertTriangle
} from 'lucide-react';
import { toast } from '@/components/ui/sonner';
import { SalesData } from '@/types/sales';
import { Team } from '@/types/teams';
import { parseUniversalPDF } from '@/utils/universalPdfParser';
import { parseCSVExcel } from '@/utils/csvExcelParser';
import { salesDataService } from '@/services/SalesDataService';
import { TeamScheduleSelector } from '@/components/schedule/TeamScheduleSelector';
import { useTeamQueries } from '@/hooks/organization/team/useTeamQueries';
import ChannelSalesInput, { ChannelSalesEntry } from './ChannelSalesInput';

interface SalesUploadManagerProps {
  onUpload: (data: SalesData, replaceExisting?: boolean) => Promise<void>;
  onDateExtracted?: (date: Date) => void;
  isUploading?: boolean;
}

type UploadStatus = 'idle' | 'processing' | 'success' | 'error';

interface FileWithPreview extends File {
  preview?: string;
  extractedDate?: Date;
}

const SalesUploadManager: React.FC<SalesUploadManagerProps> = ({ 
  onUpload, 
  onDateExtracted, 
  isUploading = false 
}) => {
  const [uploadStatus, setUploadStatus] = useState<UploadStatus>('idle');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [salesDate, setSalesDate] = useState<Date | undefined>(new Date());
  const [teamId, setTeamId] = useState<string | null>(null);
  const [files, setFiles] = useState<FileWithPreview[]>([]);
  const [error, setError] = useState<string>('');
  const [isDateExtracted, setIsDateExtracted] = useState(false);
  const [showDuplicateDialog, setShowDuplicateDialog] = useState(false);
  const [existingData, setExistingData] = useState<any>(null);
  const [pendingUpload, setPendingUpload] = useState<SalesData | null>(null);
  const [channelSales, setChannelSales] = useState<ChannelSalesEntry[]>([]);
  const [extractedDestinations, setExtractedDestinations] = useState<any[]>([]);
  
  // Fetch teams data
  const { teams, isLoading: teamsLoading, error: teamsError } = useTeamQueries();
  
  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const newFiles: FileWithPreview[] = acceptedFiles.map(file => 
      Object.assign(file, {
        preview: URL.createObjectURL(file)
      })
    );
    
    setFiles(newFiles);
    setUploadStatus('idle');
    setError('');
    setIsDateExtracted(false);
    setChannelSales([]);
    setExtractedDestinations([]);
    
    // Auto-extract date from PDF
    if (newFiles.length > 0) {
      await extractDateFromPDF(newFiles[0]);
    }
  }, []);
  
  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    accept: {
      'application/pdf': ['.pdf'],
      'text/csv': ['.csv'],
      'application/vnd.ms-excel': ['.xls'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx']
    },
    maxFiles: 1,
    onDrop,
    onDropRejected: (fileRejections) => {
      const rejection = fileRejections[0];
      if (rejection.errors[0]?.code === 'file-invalid-type') {
        setError('Please select a PDF, CSV, or Excel file');
        toast.error('Only PDF, CSV, and Excel files are supported');
      }
    }
  });
  
  const extractDateFromPDF = async (file: FileWithPreview) => {
    try {
      setUploadStatus('processing');
      setUploadProgress(25);
      
      // Check file type and use appropriate parser
      const isCSVOrExcel = file.name.match(/\.(csv|xls|xlsx)$/i);
      const result = isCSVOrExcel 
        ? await parseCSVExcel(file, 'temp', new Date())
        : await parseUniversalPDF(file, 'temp', new Date());
      
      setUploadProgress(50);
      
      if (result.success && result.extractedDate) {
        setUploadProgress(75);
        
        file.extractedDate = result.extractedDate;
        setSalesDate(result.extractedDate);
        setIsDateExtracted(true);
        onDateExtracted?.(result.extractedDate);
        
        // Extract destinations for channel sales auto-fill
        if (result.data?.destinations) {
          setExtractedDestinations(result.data.destinations);
        }
        
        toast.success(
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4" />
            Date auto-detected: {format(result.extractedDate, "PPP")}
          </div>
        );
      }
      
      setUploadProgress(100);
      setTimeout(() => {
        setUploadStatus('idle');
        setUploadProgress(0);
      }, 1000);
    } catch (error) {
      console.warn('Could not extract date from PDF:', error);
      setUploadStatus('idle');
      setUploadProgress(0);
      // Don't show error for date extraction failure
    }
  };
  
  const handleUpload = async (replaceExisting: boolean = false) => {
    if (!salesDate) {
      setError('Please select a date');
      toast.error("Please select a date");
      return;
    }
    
    if (!teamId) {
      setError('Please select a team');
      toast.error("Please select a team");
      return;
    }
    
    if (files.length === 0) {
      setError('Please select a file');
      toast.error("Please select a file");
      return;
    }
    
    setUploadStatus('processing');
    setError('');
    setUploadProgress(0);
    
    try {
      // First check for existing data if not replacing
      if (!replaceExisting) {
        const existingCheck = await salesDataService.checkForExistingSalesData(
          salesDate.toISOString().split('T')[0], 
          teamId
        );
        
        if (existingCheck.exists) {
          // Parse the file first to show comparison
          const isCSVOrExcel = files[0].name.match(/\.(csv|xls|xlsx)$/i);
          const parseResult = isCSVOrExcel
            ? await parseCSVExcel(files[0], teamId!, salesDate)
            : await parseUniversalPDF(files[0], teamId!, salesDate);
          if (parseResult.success && parseResult.data) {
            setExistingData(existingCheck.data);
            setPendingUpload(parseResult.data);
            setShowDuplicateDialog(true);
            setUploadStatus('idle');
            return;
          }
        }
      }
      
      // Simulate realistic progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 85) {
            clearInterval(progressInterval);
            return 85;
          }
          return prev + 15;
        });
      }, 300);
      
      // Parse the file with appropriate parser and team ID
      const isCSVOrExcel = files[0].name.match(/\.(csv|xls|xlsx)$/i);
      const parseResult = isCSVOrExcel
        ? await parseCSVExcel(files[0], teamId!, salesDate)
        : await parseUniversalPDF(files[0], teamId!, salesDate);
      
      clearInterval(progressInterval);
      setUploadProgress(90);
      
      if (parseResult.success && parseResult.data) {
        // Merge manual channel sales into destinations for automatic processing
        if (channelSales.length > 0) {
          // Add manual channel entries to destinations so SalesChannelService picks them up
          const manualDestinations = channelSales.map(cs => ({
            name: cs.channelName,
            total: cs.amount,
            quantity: 1, // Default quantity
            percent: parseResult.data!.grossSales > 0 
              ? (cs.amount / parseResult.data!.grossSales) * 100 
              : 0
          }));
          
          parseResult.data.destinations = [
            ...parseResult.data.destinations,
            ...manualDestinations
          ];
        }
        
        // Upload to database with replace flag
        // Channel transactions will be automatically created by SalesChannelService
        await onUpload(parseResult.data, replaceExisting);
        
        setUploadProgress(100);
        setUploadStatus('success');
        
        // Reset form after success
        setTimeout(() => {
          setSalesDate(new Date());
          setTeamId(null);
          setFiles([]);
          setChannelSales([]);
          setExtractedDestinations([]);
          setUploadProgress(0);
          setUploadStatus('idle');
          setIsDateExtracted(false);
        }, 2000);
        
      } else {
        setUploadStatus('error');
        setError(parseResult.error || 'Unknown parsing error');
        toast.error(`Failed to parse PDF: ${parseResult.error}`);
      }
      
    } catch (error) {
      console.error('Error processing sales data:', error);
      
      if (error instanceof Error && error.message.startsWith('DUPLICATE_EXISTS:')) {
        // This shouldn't happen with our new logic, but just in case
        const message = error.message.replace('DUPLICATE_EXISTS:', '');
        setError(message);
        toast.error(message);
      } else {
        setUploadStatus('error');
        setError(error instanceof Error ? error.message : 'Unknown error');
        toast.error('Upload failed');
      }
    }
  };

  const handleDuplicateReplace = async () => {
    setShowDuplicateDialog(false);
    if (pendingUpload) {
      try {
        await onUpload(pendingUpload, true);
        toast.success('Sales data replaced successfully');
        
        // Reset form
        setSalesDate(new Date());
        setTeamId(null);
        setFiles([]);
        setIsDateExtracted(false);
        setExistingData(null);
        setPendingUpload(null);
      } catch (error) {
        console.error('Error replacing data:', error);
        toast.error('Failed to replace existing data');
      }
    }
  };

  const handleDuplicateCancel = () => {
    setShowDuplicateDialog(false);
    setExistingData(null);
    setPendingUpload(null);
    setUploadStatus('idle');
  };

  const removeFile = () => {
    setFiles([]);
    setUploadStatus('idle');
    setError('');
    setIsDateExtracted(false);
    setUploadProgress(0);
    setChannelSales([]);
    setExtractedDestinations([]);
  };

  const getStatusIcon = () => {
    switch (uploadStatus) {
      case 'processing':
        return <Loader2 className="h-5 w-5 animate-spin text-primary" />;
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'error':
        return <AlertCircle className="h-5 w-5 text-destructive" />;
      default:
        return <FileText className="h-5 w-5 text-muted-foreground" />;
    }
  };

  const getStatusText = () => {
    switch (uploadStatus) {
      case 'processing':
        return 'Processing PDF...';
      case 'success':
        return 'Upload successful!';
      case 'error':
        return 'Upload failed';
      default:
        return 'Ready to upload';
    }
  };

  const getStatusColor = () => {
    switch (uploadStatus) {
      case 'processing':
        return 'bg-primary/10 text-primary';
      case 'success':
        return 'bg-green-50 text-green-700';
      case 'error':
        return 'bg-destructive/10 text-destructive';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <div className="space-y-6">
      {/* Form Inputs */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <label className="text-sm font-medium">Sales Date</label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !salesDate && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {salesDate ? format(salesDate, "PPP") : <span>Pick a date</span>}
                {isDateExtracted && (
                  <Badge variant="secondary" className="ml-auto">
                    Auto-detected
                  </Badge>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={salesDate}
                onSelect={(date) => {
                  setSalesDate(date);
                  setIsDateExtracted(false);
                }}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>
        
        <div className="space-y-2">
          <label className="text-sm font-medium">Team</label>
          <TeamScheduleSelector
            teams={teams}
            selectedTeamId={teamId}
            onTeamChange={setTeamId}
            disabled={teamsLoading || uploadStatus === 'processing'}
            showAllOption={false}
          />
          {teamsError && (
            <p className="text-sm text-red-500">Failed to load teams</p>
          )}
        </div>
      </div>
      
      {/* Upload Zone */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Upload POS Report
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div
            {...getRootProps()}
            className={cn(
              "border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all duration-200",
              isDragActive && !isDragReject && "border-primary bg-primary/5 scale-105",
              isDragReject && "border-destructive bg-destructive/5",
              !isDragActive && "border-muted-foreground/25 hover:border-primary hover:bg-primary/5"
            )}
          >
            <input {...getInputProps()} />
            
            {files.length === 0 ? (
              <div className="space-y-4">
                <div className={cn(
                  "mx-auto h-16 w-16 rounded-full flex items-center justify-center transition-colors",
                  isDragActive ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"
                )}>
                  <Upload className="h-8 w-8" />
                </div>
                
                <div>
                  <p className="text-lg font-medium">
                    {isDragActive
                      ? "Drop your PDF file here"
                      : "Drag & drop your POS report here"}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    or click to browse files
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">
                    Supports PDF, CSV, and Excel files from Toast, Brink, Square, Lightspeed, and Clover
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-background rounded-lg border">
                  <div className="flex items-center gap-3">
                    {getStatusIcon()}
                    <div className="text-left">
                      <p className="font-medium text-sm truncate max-w-48">
                        {files[0].name}
                      </p>
                      <p className={cn("text-xs", getStatusColor().split(' ')[1])}>
                        {getStatusText()}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Badge className={getStatusColor()}>
                      {uploadStatus === 'idle' ? 'Ready' : uploadStatus}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeFile();
                      }}
                      disabled={uploadStatus === 'processing'}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                
                {uploadStatus === 'processing' && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Processing...</span>
                      <span>{uploadProgress}%</span>
                    </div>
                    <Progress value={uploadProgress} className="h-2" />
                  </div>
                )}
              </div>
            )}
          </div>
          
          {error && (
            <Alert className="mt-4" variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
      
      {/* Manual Channel Sales Entry */}
      {files.length > 0 && salesDate && teamId && (
        <ChannelSalesInput
          teamId={teamId}
          value={channelSales}
          onChange={setChannelSales}
          grossSales={0} // Will be calculated after PDF parsing
          destinationsData={extractedDestinations}
        />
      )}
      
      {/* Upload Button */}
      <div className="flex justify-end">
        <Button 
          onClick={() => handleUpload()} 
          disabled={!salesDate || !teamId || files.length === 0 || uploadStatus === 'processing' || isUploading || teamsLoading}
          size="lg"
        >
          {uploadStatus === 'processing' || isUploading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {uploadStatus === 'processing' ? 'Processing PDF...' : 'Uploading...'}
            </>
          ) : (
            <>
              <Upload className="mr-2 h-4 w-4" />
              Upload Sales Data
            </>
          )}
        </Button>
      </div>

      {/* Duplicate Detection Dialog */}
      <Dialog open={showDuplicateDialog} onOpenChange={setShowDuplicateDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              Duplicate Sales Data Detected
            </DialogTitle>
            <DialogDescription>
              Sales data for {salesDate && format(salesDate, "PPP")} for this team already exists. 
              Would you like to replace it with the new data?
            </DialogDescription>
          </DialogHeader>
          
          {existingData && pendingUpload && (
            <div className="grid grid-cols-2 gap-4 py-4">
              <div className="space-y-3">
                <h4 className="font-medium text-sm">Existing Data</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Gross Sales:</span>
                    <span>${Number(existingData.gross_sales).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Net Sales:</span>
                    <span>${Number(existingData.net_sales).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Non-Cash:</span>
                    <span>${Number(existingData.non_cash).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Orders:</span>
                    <span>{existingData.order_count}</span>
                  </div>
                </div>
              </div>
              
              <div className="space-y-3">
                <h4 className="font-medium text-sm">New Data (from PDF)</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Gross Sales:</span>
                    <span>${pendingUpload.grossSales.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Net Sales:</span>
                    <span>${pendingUpload.netSales.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Non-Cash:</span>
                    <span>${pendingUpload.paymentBreakdown.nonCash.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Orders:</span>
                    <span>{pendingUpload.orderCount}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={handleDuplicateCancel}>
              Cancel Upload
            </Button>
            <Button onClick={handleDuplicateReplace} className="bg-amber-600 hover:bg-amber-700">
              Replace Existing Data
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SalesUploadManager;