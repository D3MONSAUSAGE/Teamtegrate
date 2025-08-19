
import React, { useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { CalendarIcon, Upload, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { toast } from '@/components/ui/sonner';
import { SalesData } from '@/types/sales';
import { parseBrinkPOSReport } from '@/utils/pdfParser';

interface EnhancedSalesUploaderProps {
  onUpload: (data: SalesData) => void;
}

const EnhancedSalesUploader: React.FC<EnhancedSalesUploaderProps> = ({ onUpload }) => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [salesDate, setSalesDate] = useState<Date | undefined>(new Date());
  const [location, setLocation] = useState('Santa Clarita');
  const [files, setFiles] = useState<File[]>([]);
  const [parseStatus, setParseStatus] = useState<'idle' | 'parsing' | 'success' | 'error'>('idle');
  const [parseError, setParseError] = useState<string>('');
  
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx']
    },
    maxFiles: 1,
    onDrop: (acceptedFiles) => {
      setFiles(acceptedFiles);
      setParseStatus('idle');
      setParseError('');
    }
  });
  
  const handleUpload = async () => {
    if (!salesDate) {
      toast.error("Please select a date");
      return;
    }
    
    if (files.length === 0) {
      toast.error("Please select a file");
      return;
    }
    
    setIsUploading(true);
    setParseStatus('parsing');
    setUploadProgress(0);
    
    try {
      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);
      
      // Parse the PDF using our enhanced parser
      const parseResult = await parseBrinkPOSReport(files[0], location, salesDate);
      
      clearInterval(progressInterval);
      setUploadProgress(100);
      
      if (parseResult.success && parseResult.data) {
        setParseStatus('success');
        onUpload(parseResult.data);
        toast.success("Sales data uploaded and parsed successfully!");
        
        // Reset form
        setSalesDate(new Date());
        setFiles([]);
        setUploadProgress(0);
        setTimeout(() => setParseStatus('idle'), 2000);
      } else {
        setParseStatus('error');
        setParseError(parseResult.error || 'Unknown parsing error');
        toast.error(`Failed to parse PDF: ${parseResult.error}`);
      }
      
    } catch (error) {
      console.error('Error processing sales data:', error);
      setParseStatus('error');
      setParseError(error instanceof Error ? error.message : 'Unknown error');
      toast.error("Error processing file");
    } finally {
      setIsUploading(false);
    }
  };

  const getStatusIcon = () => {
    switch (parseStatus) {
      case 'parsing':
        return <Loader2 className="h-5 w-5 animate-spin text-blue-500" />;
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'error':
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Sales Date
          </label>
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
                className="pointer-events-auto"
              />
            </PopoverContent>
          </Popover>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Location
          </label>
          <Input
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="Enter location"
          />
        </div>
      </div>
      
      <div
        {...getRootProps()}
        className={cn(
          "border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors",
          isDragActive ? "border-primary bg-primary/5" : "border-gray-300 hover:border-primary"
        )}
      >
        <input {...getInputProps()} />
        <Upload className="mx-auto h-12 w-12 text-gray-400" />
        <p className="mt-2 text-sm text-gray-600">
          {isDragActive
            ? "Drop the Brink POS report here"
            : "Drag and drop your Brink POS daily sales report (PDF or Excel) here or click to browse"}
        </p>
        <p className="text-xs text-gray-500 mt-1">PDF and Excel (.xlsx) files from Brink POS are supported</p>
      </div>
      
      {files.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="text-sm">
                <p className="font-medium">Selected File:</p>
                <p className="text-gray-600">{files[0].name}</p>
              </div>
              {getStatusIcon()}
            </div>
            
            {isUploading && (
              <div className="mt-4">
                <div className="flex justify-between text-sm mb-2">
                  <span>Processing PDF...</span>
                  <span>{uploadProgress}%</span>
                </div>
                <Progress value={uploadProgress} className="h-2" />
              </div>
            )}
            
            {parseStatus === 'error' && parseError && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-700">{parseError}</p>
              </div>
            )}
            
            {parseStatus === 'success' && (
              <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-md">
                <p className="text-sm text-green-700">Sales data parsed successfully!</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
      
      <div className="flex justify-end">
        <Button 
          onClick={handleUpload} 
          disabled={!salesDate || files.length === 0 || isUploading}
        >
          {isUploading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processing File...
            </>
          ) : (
            <>
              <Upload className="mr-2 h-4 w-4" />
              Upload & Parse Sales Data
            </>
          )}
        </Button>
      </div>
    </div>
  );
};

export default EnhancedSalesUploader;
