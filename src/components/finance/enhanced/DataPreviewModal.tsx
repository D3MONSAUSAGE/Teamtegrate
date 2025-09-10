import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  CheckCircle, 
  AlertTriangle, 
  AlertCircle, 
  FileText, 
  DollarSign,
  ShoppingCart,
  TrendingUp,
  Clock,
  Edit3,
  Save,
  X,
  Loader2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { StagedData, uploadBatchService } from '@/services/UploadBatchService';
import { toast } from '@/hooks/use-toast';
import { format } from 'date-fns';

interface DataPreviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  stagedData: StagedData[];
  onApprove: (approvedData: StagedData[]) => Promise<void>;
  onUpdateData: (updatedData: StagedData[]) => void;
}

interface EditableField {
  key: string;
  label: string;
  type: 'number' | 'text';
  format?: 'currency' | 'integer';
}

const editableFields: EditableField[] = [
  { key: 'grossSales', label: 'Gross Sales', type: 'number', format: 'currency' },
  { key: 'netSales', label: 'Net Sales', type: 'number', format: 'currency' },
  { key: 'orderCount', label: 'Order Count', type: 'number', format: 'integer' },
  { key: 'orderAverage', label: 'Order Average', type: 'number', format: 'currency' },
  { key: 'paymentBreakdown.totalCash', label: 'Total Cash', type: 'number', format: 'currency' },
  { key: 'paymentBreakdown.nonCash', label: 'Non-Cash', type: 'number', format: 'currency' },
  { key: 'paymentBreakdown.tips', label: 'Tips', type: 'number', format: 'currency' },
  { key: 'labor.hours', label: 'Labor Hours', type: 'number' },
  { key: 'labor.cost', label: 'Labor Cost', type: 'number', format: 'currency' }
];

export const DataPreviewModal: React.FC<DataPreviewModalProps> = ({
  open,
  onOpenChange,
  stagedData,
  onApprove,
  onUpdateData
}) => {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [editingData, setEditingData] = useState<StagedData[]>(stagedData);
  const [editMode, setEditMode] = useState<Record<string, boolean>>({});
  const [isApproving, setIsApproving] = useState(false);

  React.useEffect(() => {
    setEditingData(stagedData);
  }, [stagedData]);

  const getNestedValue = (obj: any, path: string): any => {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  };

  const setNestedValue = (obj: any, path: string, value: any): any => {
    const keys = path.split('.');
    const lastKey = keys.pop()!;
    const target = keys.reduce((current, key) => {
      if (!current[key]) current[key] = {};
      return current[key];
    }, obj);
    target[lastKey] = value;
    return obj;
  };

  const handleFieldEdit = (dataIndex: number, fieldKey: string, value: string) => {
    const newData = [...editingData];
    const item = newData[dataIndex];
    
    // Parse value based on field type
    const field = editableFields.find(f => f.key === fieldKey);
    let parsedValue: any = value;
    
    if (field?.type === 'number') {
      parsedValue = value === '' ? 0 : parseFloat(value) || 0;
    }
    
    // Update the nested value
    const updatedExtractedData = { ...item.extracted_data };
    setNestedValue(updatedExtractedData, fieldKey, parsedValue);
    
    // Update user corrections
    const updatedCorrections = { ...item.user_corrections };
    setNestedValue(updatedCorrections, fieldKey, parsedValue);
    
    newData[dataIndex] = {
      ...item,
      extracted_data: updatedExtractedData,
      user_corrections: updatedCorrections
    };
    
    setEditingData(newData);
  };

  const handleSaveField = async (dataIndex: number, fieldKey: string) => {
    try {
      const item = editingData[dataIndex];
      await uploadBatchService.updateStagedData(item.id, item.user_corrections);
      
      setEditMode(prev => ({ ...prev, [`${dataIndex}-${fieldKey}`]: false }));
      onUpdateData(editingData);
      
      toast({
        title: "Field Updated",
        description: `${editableFields.find(f => f.key === fieldKey)?.label} has been updated`,
      });
    } catch (error) {
      console.error('Error saving field:', error);
      toast({
        title: "Update Failed",
        description: "Failed to save field changes",
        variant: "destructive",
      });
    }
  };

  const handleStatusChange = async (dataIndex: number, status: 'approved' | 'rejected' | 'needs_review') => {
    try {
      const item = editingData[dataIndex];
      await uploadBatchService.updateStagedData(item.id, item.user_corrections, status);
      
      const newData = [...editingData];
      newData[dataIndex] = { ...item, status };
      setEditingData(newData);
      onUpdateData(newData);
      
      toast({
        title: "Status Updated",
        description: `File ${item.file_name} has been ${status}`,
      });
    } catch (error) {
      console.error('Error updating status:', error);
      toast({
        title: "Update Failed",
        description: "Failed to update status",
        variant: "destructive",
      });
    }
  };

  const handleApproveAll = async () => {
    setIsApproving(true);
    try {
      const approvedData = editingData.filter(item => item.status === 'approved');
      if (approvedData.length === 0) {
        toast({
          title: "No Data to Upload",
          description: "Please approve at least one file before uploading",
          variant: "destructive",
        });
        return;
      }
      
      await onApprove(approvedData);
    } catch (error) {
      console.error('Error approving data:', error);
    } finally {
      setIsApproving(false);
    }
  };

  const formatValue = (value: any, format?: string): string => {
    if (value == null) return '0';
    
    switch (format) {
      case 'currency':
        return new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD'
        }).format(value);
      case 'integer':
        return new Intl.NumberFormat('en-US').format(value);
      default:
        return value.toString();
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" />Approved</Badge>;
      case 'rejected':
        return <Badge variant="destructive"><X className="w-3 h-3 mr-1" />Rejected</Badge>;
      case 'needs_review':
        return <Badge variant="secondary"><AlertTriangle className="w-3 h-3 mr-1" />Needs Review</Badge>;
      default:
        return <Badge variant="outline"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      default:
        return <AlertCircle className="w-4 h-4 text-blue-500" />;
    }
  };

  if (editingData.length === 0) return null;

  const currentItem = editingData[selectedIndex];
  const approvedCount = editingData.filter(item => item.status === 'approved').length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Data Preview & Validation
            <Badge variant="outline">{editingData.length} files</Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="flex gap-6 overflow-hidden">
          {/* File List Sidebar */}
          <div className="w-72 border-r">
            <ScrollArea className="h-[500px]">
              <div className="space-y-2 p-2">
                {editingData.map((item, index) => (
                  <Card 
                    key={item.id}
                    className={cn(
                      "cursor-pointer transition-colors",
                      selectedIndex === index ? "ring-2 ring-primary" : "hover:bg-muted/50"
                    )}
                    onClick={() => setSelectedIndex(index)}
                  >
                    <CardContent className="p-3">
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-medium text-sm truncate">{item.file_name}</h4>
                        {getStatusBadge(item.status)}
                      </div>
                      
                      <div className="space-y-1 text-xs text-muted-foreground">
                        <div className="flex justify-between">
                          <span>POS System:</span>
                          <span className="font-medium">{item.pos_system.toUpperCase()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Confidence:</span>
                          <span className="font-medium">{item.confidence_score.toFixed(0)}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Issues:</span>
                          <span className={cn(
                            "font-medium",
                            item.validation_errors.length > 0 ? "text-red-500" : "text-green-500"
                          )}>
                            {item.validation_errors.length}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          </div>

          {/* Main Content */}
          <div className="flex-1 overflow-hidden">
            <Tabs defaultValue="data" className="h-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="data">
                  <DollarSign className="w-4 h-4 mr-2" />
                  Sales Data
                </TabsTrigger>
                <TabsTrigger value="validation">
                  <AlertTriangle className="w-4 h-4 mr-2" />
                  Validation ({currentItem.validation_errors.length})
                </TabsTrigger>
                <TabsTrigger value="summary">
                  <TrendingUp className="w-4 h-4 mr-2" />
                  Summary
                </TabsTrigger>
              </TabsList>

              <TabsContent value="data" className="mt-4">
                <ScrollArea className="h-[400px]">
                  <div className="space-y-4 pr-4">
                    {editableFields.map((field) => {
                      const value = getNestedValue(currentItem.extracted_data, field.key);
                      const editKey = `${selectedIndex}-${field.key}`;
                      const isEditing = editMode[editKey];

                      return (
                        <div key={field.key} className="flex items-center justify-between p-3 border rounded-lg">
                          <Label className="font-medium min-w-[120px]">{field.label}</Label>
                          
                          <div className="flex items-center gap-2 flex-1 justify-end">
                            {isEditing ? (
                              <>
                                <Input
                                  type={field.type}
                                  value={value || ''}
                                  onChange={(e) => handleFieldEdit(selectedIndex, field.key, e.target.value)}
                                  className="w-32"
                                  step={field.format === 'currency' ? '0.01' : '1'}
                                />
                                <Button
                                  size="sm"
                                  onClick={() => handleSaveField(selectedIndex, field.key)}
                                >
                                  <Save className="w-3 h-3" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => setEditMode(prev => ({ ...prev, [editKey]: false }))}
                                >
                                  <X className="w-3 h-3" />
                                </Button>
                              </>
                            ) : (
                              <>
                                <span className="font-mono text-sm min-w-[100px] text-right">
                                  {formatValue(value, field.format)}
                                </span>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => setEditMode(prev => ({ ...prev, [editKey]: true }))}
                                >
                                  <Edit3 className="w-3 h-3" />
                                </Button>
                              </>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </ScrollArea>
              </TabsContent>

              <TabsContent value="validation" className="mt-4">
                <ScrollArea className="h-[400px]">
                  <div className="space-y-3 pr-4">
                    {currentItem.validation_errors.length === 0 ? (
                      <Alert>
                        <CheckCircle className="h-4 w-4" />
                        <AlertDescription>
                          No validation issues found. This file is ready for upload.
                        </AlertDescription>
                      </Alert>
                    ) : (
                      currentItem.validation_errors.map((error, index) => (
                        <Alert key={index} variant={error.severity === 'critical' || error.severity === 'error' ? 'destructive' : 'default'}>
                          {getSeverityIcon(error.severity)}
                          <AlertDescription>
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <Badge variant="outline" className="text-xs">
                                  {error.field}
                                </Badge>
                                <Badge variant={error.severity === 'critical' ? 'destructive' : 'secondary'} className="text-xs">
                                  {error.severity}
                                </Badge>
                              </div>
                              <p>{error.message}</p>
                              {error.suggestedValue && (
                                <p className="text-sm text-muted-foreground">
                                  Suggested: {formatValue(error.suggestedValue)}
                                </p>
                              )}
                            </div>
                          </AlertDescription>
                        </Alert>
                      ))
                    )}
                  </div>
                </ScrollArea>
              </TabsContent>

              <TabsContent value="summary" className="mt-4">
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm">Sales Overview</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span>Gross Sales:</span>
                            <span className="font-mono">{formatValue(currentItem.extracted_data.grossSales, 'currency')}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Net Sales:</span>
                            <span className="font-mono">{formatValue(currentItem.extracted_data.netSales, 'currency')}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Orders:</span>
                            <span className="font-mono">{formatValue(currentItem.extracted_data.orderCount, 'integer')}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Average:</span>
                            <span className="font-mono">{formatValue(currentItem.extracted_data.orderAverage, 'currency')}</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm">Payment Breakdown</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span>Cash:</span>
                            <span className="font-mono">{formatValue(currentItem.extracted_data.paymentBreakdown.totalCash, 'currency')}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Non-Cash:</span>
                            <span className="font-mono">{formatValue(currentItem.extracted_data.paymentBreakdown.nonCash, 'currency')}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Tips:</span>
                            <span className="font-mono">{formatValue(currentItem.extracted_data.paymentBreakdown.tips, 'currency')}</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="text-sm font-medium">Current Status</p>
                      <div className="flex items-center gap-2">
                        {getStatusBadge(currentItem.status)}
                        <span className="text-xs text-muted-foreground">
                          Confidence: {currentItem.confidence_score.toFixed(0)}%
                        </span>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleStatusChange(selectedIndex, 'rejected')}
                        disabled={currentItem.status === 'rejected'}
                      >
                        <X className="w-3 h-3 mr-1" />
                        Reject
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleStatusChange(selectedIndex, 'approved')}
                        disabled={currentItem.status === 'approved'}
                      >
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Approve
                      </Button>
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>

        <DialogFooter className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            {approvedCount} of {editingData.length} files approved
          </div>
          
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleApproveAll}
              disabled={approvedCount === 0 || isApproving}
            >
              {isApproving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Upload {approvedCount} Files
                </>
              )}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};