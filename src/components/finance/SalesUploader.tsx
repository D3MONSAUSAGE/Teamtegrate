import React, { useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Card, CardContent } from '@/components/ui/card';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { CalendarIcon, Upload, Loader2 } from 'lucide-react';
import { toast } from '@/components/ui/sonner';
import { v4 as uuidv4 } from 'uuid';
import { SalesData } from '@/types/sales';

interface SalesUploaderProps {
  onUpload: (data: SalesData) => void;
}

const SalesUploader: React.FC<SalesUploaderProps> = ({ onUpload }) => {
  const [isUploading, setIsUploading] = useState(false);
  const [salesDate, setSalesDate] = useState<Date | undefined>(new Date());
  const [location, setLocation] = useState('Santa Clarita');
  const [files, setFiles] = useState<File[]>([]);
  
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      'application/pdf': ['.pdf']
    },
    maxFiles: 1,
    onDrop: (acceptedFiles) => {
      setFiles(acceptedFiles);
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
    
    try {
      // In a real application, we would parse the PDF here
      // For this demo, we'll simulate parsing after a delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Create simulated data based on the sample data with all required properties
      const simulatedData: SalesData = {
        id: uuidv4(),
        date: format(salesDate, 'yyyy-MM-dd'),
        location: location,
        grossSales: 9545.49 + Math.random() * 1000,
        netSales: 8684.61 + Math.random() * 800,
        orderCount: 291 + Math.floor(Math.random() * 50),
        orderAverage: 29.84 + Math.random() * 5,
        labor: {
          cost: 1200.50,
          hours: 45.5,
          percentage: 12.5,
          salesPerLaborHour: 209.9
        },
        cashManagement: {
          depositsAccepted: 500.00,
          depositsRedeemed: 450.00,
          paidIn: 100.00,
          paidOut: 75.00
        },
        giftCards: {
          issueAmount: 250.00,
          issueCount: 5,
          reloadAmount: 100.00,
          reloadCount: 2
        },
        paymentBreakdown: {
          nonCash: 7200.00,
          totalCash: 1484.61,
          calculatedCash: 1484.61,
          tips: 123.28
        },
        destinations: [
          { name: 'Drive Thru', quantity: 257, total: 7642.24, percent: 88.00 },
          { name: 'DoorDash', quantity: 17, total: 590.25, percent: 6.80 },
          { name: 'Online Ordering', quantity: 5, total: 210.20, percent: 2.42 },
          { name: 'Dine In', quantity: 7, total: 129.59, percent: 1.49 },
          { name: 'KIOSK- Dine In', quantity: 4, total: 95.88, percent: 1.10 },
          { name: 'KIOSK- Take Out', quantity: 1, total: 16.45, percent: 0.19 }
        ],
        revenueItems: [
          { name: 'COMBO', quantity: 111, total: 1675.84, percent: 19.30 },
          { name: 'TACOS', quantity: 360, total: 1192.05, percent: 13.73 },
          { name: 'RED TACOS', quantity: 175, total: 868.72, percent: 10.00 },
          { name: 'FRIES GUANATOS', quantity: 67, total: 786.57, percent: 9.06 },
          { name: 'GUANATOS TACOS', quantity: 127, total: 643.89, percent: 7.41 },
          { name: 'DRINKS', quantity: 193, total: 616.70, percent: 7.10 }
        ],
        tenders: [
          { name: 'Visa', quantity: 136, payments: 4273.02, tips: 91.30, total: 4364.32, percent: 45.24 },
          { name: 'Cash', quantity: 62, payments: 1471.74, tips: 0.00, total: 1471.74, percent: 15.26 },
          { name: 'MasterCard', quantity: 40, payments: 1417.79, tips: 31.98, total: 1449.77, percent: 15.03 },
          { name: 'UberEats', quantity: 22, payments: 700.34, tips: 0.00, total: 700.34, percent: 7.26 },
          { name: 'EXT DoorDash', quantity: 17, payments: 646.32, tips: 0.00, total: 646.32, percent: 6.70 }
        ],
        discounts: [
          { name: '% Discount', quantity: 1, total: 11.95, percent: 38.74 },
          { name: '$ Discount', quantity: 1, total: 10.00, percent: 32.41 },
          { name: 'Employee 30%', quantity: 2, total: 6.26, percent: 20.29 },
          { name: 'Employee 10%', quantity: 1, total: 2.64, percent: 8.56 }
        ],
        promotions: [
          { name: '$5 OFF over $30', quantity: 1, total: 5.00, percent: 100.00 }
        ],
        taxes: [
          { name: 'Sales Tax', quantity: 1379, total: 825.03, percent: 100.00 }
        ],
        voids: 25.50,
        refunds: 15.75,
        surcharges: 45.20,
        expenses: 125.00
      };
      
      onUpload(simulatedData);
      
      // Reset the form
      setSalesDate(new Date());
      setFiles([]);
    } catch (error) {
      console.error('Error uploading sales data:', error);
      toast.error("Error processing file");
    } finally {
      setIsUploading(false);
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
            ? "Drop the file here"
            : "Drag and drop your sales report PDF here or click to browse"}
        </p>
        <p className="text-xs text-gray-500 mt-1">Only PDF files are supported</p>
      </div>
      
      {files.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <div className="text-sm">
              <p className="font-medium">Selected File:</p>
              <p className="text-gray-600">{files[0].name}</p>
            </div>
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
              Processing...
            </>
          ) : (
            <>
              <Upload className="mr-2 h-4 w-4" />
              Upload Sales Data
            </>
          )}
        </Button>
      </div>
    </div>
  );
};

export default SalesUploader;
