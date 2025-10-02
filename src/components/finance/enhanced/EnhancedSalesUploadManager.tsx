import React, { useState, useCallback, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
  AlertTriangle,
  Eye,
  Settings,
  Zap,
  Info
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { SalesData } from '@/types/sales';
import { Team } from '@/types/teams';
import { parseUniversalPDF, ParsedPDFData } from '@/utils/universalPdfParser';
import { uploadBatchService, StagedData } from '@/services/UploadBatchService';
import { TeamScheduleSelector } from '@/components/schedule/TeamScheduleSelector';
import { useTeamQueries } from '@/hooks/organization/team/useTeamQueries';
import { DataPreviewModal } from './DataPreviewModal';
import { BatchProgressCard } from './BatchProgressCard';
import { useBatchUpload } from '@/hooks/useBatchUpload';

interface EnhancedSalesUploadManagerProps {
  onUpload: (data: SalesData, replaceExisting?: boolean) => Promise<void>;
  onDateExtracted?: (date: Date) => void;
  isUploading?: boolean;
}

type UploadStatus = 'idle' | 'processing' | 'reviewing' | 'success' | 'error';

interface FileWithPreview extends File {
  preview?: string;
  extractedDate?: Date;
  posSystem?: string;
  confidenceScore?: number;
  stagedId?: string;
  parseResult?: ParsedPDFData;
}

const EnhancedSalesUploadManager: React.FC<EnhancedSalesUploadManagerProps> = ({ 
  onUpload, 
  onDateExtracted, 
  isUploading = false 
}) => {
  const [uploadStatus, setUploadStatus] = useState<UploadStatus>('idle');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [salesDate, setSalesDate] = useState<Date | undefined>(new Date());
  const [teamId, setTeamId] = useState<string | null>(null);
  const [forcedPosSystem, setForcedPosSystem] = useState<string>('auto');
  const [files, setFiles] = useState<FileWithPreview[]>([]);
  const [error, setError] = useState<string>('');
  const [currentBatchId, setCurrentBatchId] = useState<string | null>(null);
  const [stagedData, setStagedData] = useState<StagedData[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const [batchMode, setBatchMode] = useState(false);
  
  // Fetch teams data
  const { teams, isLoading: teamsLoading, error: teamsError } = useTeamQueries();
  
  // Batch upload optimization
  const batchUpload = useBatchUpload({
    maxConcurrent: 3,
    maxFileSize: 50,
    maxTotalSize: 200,
    chunkSize: 5
  });
  
  const posSystemOptions = [
    { value: 'auto', label: 'Auto Detect' },
    { value: 'brink', label: 'Brink POS' },
    { value: 'square', label: 'Square' },
    { value: 'toast', label: 'Toast POS' },
    { value: 'lightspeed', label: 'Lightspeed' },
    { value: 'clover', label: 'Clover' }
  ];
  
  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    // Validate batch before adding
    const allFiles = [...files, ...acceptedFiles];
    const validation = batchUpload.validateBatch(allFiles);
    
    if (!validation.valid) {
      setError(validation.errors.join('. '));
      toast({
        title: "Batch Validation Failed",
        description: validation.errors[0],
        variant: "destructive",
      });
      return;
    }
    
    // Analyze files and show recommendations
    const analysis = batchUpload.analyzeFiles(allFiles);
    if (analysis.warningMessage) {
      toast({
        title: "Batch Size Recommendation",
        description: analysis.warningMessage,
        variant: "default",
      });
    }
    
    const newFiles: FileWithPreview[] = acceptedFiles.map(file => 
      Object.assign(file, {
        preview: URL.createObjectURL(file)
      })
    );
    
    setFiles(prev => [...prev, ...newFiles]);
    setUploadStatus('idle');
    setError('');
    
    // Enable batch mode if multiple files
    if (acceptedFiles.length > 1 || files.length > 0) {
      setBatchMode(true);
    }
    
    // Auto-extract date from first PDF if single file mode
    if (acceptedFiles.length === 1 && files.length === 0) {
      await extractDateFromPDF(newFiles[0]);
    }
  }, [files, batchUpload]);
  
  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    accept: {
      'application/pdf': ['.pdf']
    },
    maxFiles: 25,
    onDrop,
    onDropRejected: (fileRejections) => {
      const rejection = fileRejections[0];
      if (rejection.errors[0]?.code === 'file-invalid-type') {
        setError('Please select PDF files only');
        toast({
          title: "Invalid File Type",
          description: "Only PDF files are supported",
          variant: "destructive",
        });
      } else if (rejection.errors[0]?.code === 'too-many-files') {
        setError('Maximum 25 files allowed per batch');
        toast({
          title: "Too Many Files",
          description: "Please upload a maximum of 25 files at once",
          variant: "destructive",
        });
      }
    }
  });
  
  const extractDateFromPDF = async (file: FileWithPreview) => {
    try {
      setUploadStatus('processing');
      setUploadProgress(25);
      
      const result = await parseUniversalPDF(
        file, 
        teamId || 'temp', 
        salesDate || new Date(), 
        forcedPosSystem === 'auto' ? undefined : forcedPosSystem
      );
      
      setUploadProgress(100);
      
      if (result.success && result.extractedDate) {
        file.extractedDate = result.extractedDate;
        setSalesDate(result.extractedDate);
        onDateExtracted?.(result.extractedDate);
        
        toast({
          title: "Date Auto-Detected",
          description: (
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4" />
              {format(result.extractedDate, "PPP")}
            </div>
          ),
        });
      }
      
      if (result.posSystem) {
        file.posSystem = result.posSystem;
        file.confidenceScore = result.confidenceScore;
        
        toast({
          title: "POS System Detected",
          description: `${result.posSystem.toUpperCase()} (${result.confidenceScore?.toFixed(0)}% confidence)`,
        });
      }
      
      setTimeout(() => {
        setUploadStatus('idle');
        setUploadProgress(0);
      }, 1000);
    } catch (error) {
      console.warn('Could not extract metadata from PDF:', error);
      setUploadStatus('idle');
      setUploadProgress(0);
    }
  };
  
  const handleProcessFiles = async () => {
    if (!salesDate) {
      setError('Please select a date');
      toast({
        title: "Date Required",
        description: "Please select a date",
        variant: "destructive",
      });
      return;
    }
    
    if (!teamId) {
      setError('Please select a team');
      toast({
        title: "Team Required",
        description: "Please select a team",
        variant: "destructive",
      });
      return;
    }
    
    if (files.length === 0) {
      setError('Please select PDF files');
      toast({
        title: "Files Required",
        description: "Please select PDF files",
        variant: "destructive",
      });
      return;
    }
    
    setUploadStatus('processing');
    setError('');
    setUploadProgress(0);
    
    try {
      // Create batch
      const batchId = await uploadBatchService.createBatch(
        `Upload ${format(salesDate, 'yyyy-MM-dd')}`,
        files.length
      );
      setCurrentBatchId(batchId);
      
      let processed = 0;
      let failed = 0;
      const staged: StagedData[] = [];
      
      // Process files in chunks with concurrency
      const results = await batchUpload.processInChunks(
        files,
        async (file, index) => {
          try {
            // Parse PDF with universal parser
            const result = await parseUniversalPDF(
              file,
              teamId,
              salesDate,
              forcedPosSystem === 'auto' ? undefined : forcedPosSystem
            );
            
            if (result.success && result.data) {
              // Stage the data for review
              // Channel transactions will be automatically created by SalesChannelService
              const stagedId = await uploadBatchService.stageData(
                batchId,
                file.name,
                result.posSystem || 'unknown',
                result.confidenceScore || 0,
                result.data,
                result.validationErrors || []
              );
              
              file.stagedId = stagedId;
              file.parseResult = result;
              
              // Add to staged data for preview
              staged.push({
                id: stagedId,
                batch_id: batchId,
                file_name: file.name,
                pos_system: result.posSystem || 'unknown',
                confidence_score: result.confidenceScore || 0,
                extracted_data: result.data,
                validation_errors: result.validationErrors || [],
                user_corrections: {},
                status: 'pending',
                created_at: new Date().toISOString()
              });
            } else {
              throw new Error(result.error || 'Failed to parse file');
            }
          } catch (fileError) {
            console.error('Error processing file:', file.name, fileError);
            throw fileError;
          }
        },
        (currentProcessed, total) => {
          processed = currentProcessed;
          setUploadProgress((currentProcessed / total) * 80);
          uploadBatchService.updateBatchProgress(batchId, currentProcessed, failed);
        }
      );
      
      processed = results.successful;
      failed = results.failed;
      
      setUploadProgress(100);
      setStagedData(staged);
      
      if (processed > 0) {
        setUploadStatus('reviewing');
        setShowPreview(true);
        
        toast({
          title: "Files Processed",
          description: `${processed} files processed successfully. ${failed > 0 ? `${failed} files failed.` : ''}`,
        });
      } else {
        setUploadStatus('error');
        setError('No files could be processed successfully');
        await uploadBatchService.completeBatch(batchId, 'failed');
      }
      
    } catch (error) {
      console.error('Error processing files:', error);
      setUploadStatus('error');
      setError(error instanceof Error ? error.message : 'Processing failed');
      
      if (currentBatchId) {
        await uploadBatchService.completeBatch(currentBatchId, 'failed');
      }
      
      toast({
        title: "Processing Failed",
        description: error instanceof Error ? error.message : 'Processing failed',
        variant: "destructive",
      });
    }
  };

  const handleApproveAndUpload = async (approvedData: StagedData[]) => {
    if (!currentBatchId) return;
    
    try {
      setUploadStatus('processing');
      
      let uploaded = 0;
      for (const staged of approvedData) {
        if (staged.status === 'approved') {
          // Apply any user corrections
          const finalData = { ...staged.extracted_data, ...staged.user_corrections };
          await onUpload(finalData, true); // Replace if exists
          uploaded++;
        }
      }
      
      await uploadBatchService.completeBatch(currentBatchId, 'completed');
      
      setUploadStatus('success');
      setShowPreview(false);
      
      toast({
        title: "Upload Complete",
        description: `${uploaded} sales records uploaded successfully`,
      });
      
      // Reset form
      setTimeout(() => {
        resetForm();
      }, 2000);
      
    } catch (error) {
      console.error('Error uploading approved data:', error);
      setUploadStatus('error');
      setError(error instanceof Error ? error.message : 'Upload failed');
      
      toast({
        title: "Upload Failed",
        description: error instanceof Error ? error.message : 'Upload failed',
        variant: "destructive",
      });
    }
  };
  
  const resetForm = () => {
    setFiles([]);
    setUploadStatus('idle');
    setUploadProgress(0);
    setError('');
    setCurrentBatchId(null);
    setStagedData([]);
    setShowPreview(false);
    setBatchMode(false);
    setSalesDate(new Date());
    setTeamId(null);
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
    if (files.length === 1) {
      setBatchMode(false);
    }
  };

  const getStatusIcon = (file?: FileWithPreview) => {
    if (uploadStatus === 'processing') {
      return <Loader2 className="h-5 w-5 animate-spin text-primary" />;
    }
    if (file?.parseResult?.success) {
      return <CheckCircle className="h-5 w-5 text-green-500" />;
    }
    if (uploadStatus === 'error') {
      return <AlertCircle className="h-5 w-5 text-destructive" />;
    }
    return <FileText className="h-5 w-5 text-muted-foreground" />;
  };

  const getStatusText = (file?: FileWithPreview) => {
    if (uploadStatus === 'processing') return 'Processing...';
    if (uploadStatus === 'reviewing') return 'Ready for review';
    if (file?.parseResult?.success) return 'Parsed successfully';
    if (uploadStatus === 'error') return 'Processing failed';
    return 'Ready to process';
  };

  return (
    <div className="space-y-6">
      {/* Configuration Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={salesDate}
                onSelect={setSalesDate}
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
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">POS System</label>
          <Select value={forcedPosSystem} onValueChange={setForcedPosSystem}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {posSystemOptions.map(option => (
                <SelectItem key={option.value} value={option.value}>
                  <div className="flex items-center gap-2">
                    {option.value === 'auto' && <Zap className="h-4 w-4" />}
                    <Settings className="h-4 w-4" />
                    {option.label}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      
      {/* Batch Size Recommendations */}
      {files.length > 0 && (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-2">
              <p className="font-medium">Batch Upload Guidelines:</p>
              <ul className="text-sm space-y-1 ml-4 list-disc">
                <li><strong>Small files (&lt;2MB):</strong> Up to 15-20 files recommended</li>
                <li><strong>Medium files (2-10MB):</strong> Up to 8-10 files recommended</li>
                <li><strong>Large files (&gt;10MB):</strong> Up to 3-5 files recommended</li>
                <li><strong>Total batch size:</strong> Maximum 200MB</li>
              </ul>
              {(() => {
                const analysis = batchUpload.analyzeFiles(files);
                return (
                  <div className="mt-2 text-sm">
                    <p>Current batch: {files.length} files ({analysis.totalSize.toFixed(1)}MB total)</p>
                    <p>Estimated processing time: ~{analysis.estimatedTime} seconds</p>
                    {analysis.warningMessage && (
                      <p className="text-yellow-600 dark:text-yellow-500 mt-1">
                        ⚠️ {analysis.warningMessage}
                      </p>
                    )}
                  </div>
                );
              })()}
            </div>
          </AlertDescription>
        </Alert>
      )}
      
      {/* Upload Zone */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Enhanced PDF Upload
            {batchMode && <Badge variant="secondary">Batch Mode (Max 25 files)</Badge>}
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
                      ? "Drop your PDF files here"
                      : "Drag & drop your POS reports here"}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    or click to browse files
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">
                    Supports multiple POS systems • Batch upload (max 25 files) • Auto-detection
                  </p>
                  <p className="text-xs text-primary mt-2 font-medium">
                    💡 Recommended: 5-10 files per batch for optimal performance
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {files.map((file, index) => (
                  <div key={index} className="flex items-center justify-between p-4 bg-background rounded-lg border">
                    <div className="flex items-center gap-3">
                      {getStatusIcon(file)}
                      <div className="text-left">
                        <p className="font-medium text-sm truncate max-w-48">
                          {file.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {getStatusText(file)}
                          {file.posSystem && (
                            <span className="ml-2">
                              • {file.posSystem} ({file.confidenceScore?.toFixed(0)}%)
                            </span>
                          )}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {file.parseResult?.validationErrors && file.parseResult.validationErrors.length > 0 && (
                        <Badge variant="destructive" className="text-xs">
                          {file.parseResult.validationErrors.length} issues
                        </Badge>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeFile(index);
                        }}
                        disabled={uploadStatus === 'processing'}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
                
                {uploadStatus === 'processing' && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>
                        Processing files...
                        {batchUpload.totalChunks > 0 && (
                          <span className="ml-2 text-muted-foreground">
                            (Chunk {batchUpload.processingChunk}/{batchUpload.totalChunks})
                          </span>
                        )}
                      </span>
                      <span>{uploadProgress}%</span>
                    </div>
                    <Progress value={uploadProgress} className="h-2" />
                  </div>
                )}

                <Button 
                  variant="outline" 
                  onClick={(e) => {
                    e.stopPropagation();
                    setBatchMode(true);
                  }}
                  className="w-full"
                >
                  Add More Files
                </Button>
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
      
      {/* Action Buttons */}
      <div className="flex justify-between">
        <Button 
          variant="outline"
          onClick={resetForm}
          disabled={uploadStatus === 'processing'}
        >
          Reset
        </Button>

        <div className="flex gap-3">
          {uploadStatus === 'reviewing' && (
            <Button 
              variant="outline"
              onClick={() => setShowPreview(true)}
            >
              <Eye className="mr-2 h-4 w-4" />
              Review Data
            </Button>
          )}
          
          <Button 
            onClick={handleProcessFiles} 
            disabled={
              !salesDate || 
              !teamId || 
              files.length === 0 || 
              uploadStatus === 'processing' || 
              isUploading || 
              teamsLoading
            }
            size="lg"
          >
            {uploadStatus === 'processing' || isUploading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                Process Files
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Processing Status */}
      {currentBatchId && (
        <div className="text-center p-4 bg-primary/5 rounded-lg">
          <p className="text-sm text-muted-foreground">Batch ID: {currentBatchId}</p>
          <p className="text-sm">Processing files...</p>
        </div>
      )}

      {/* Data Preview Modal */}
      <DataPreviewModal
        isOpen={showPreview}
        onClose={() => setShowPreview(false)}
        stagedData={stagedData}
        onApprove={handleApproveAndUpload}
        onReject={() => setShowPreview(false)}
      />
    </div>
  );
};

export default EnhancedSalesUploadManager;