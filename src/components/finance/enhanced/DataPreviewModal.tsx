import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  CheckCircle, 
  AlertTriangle, 
  AlertCircle, 
  Edit3, 
  Save, 
  X,
  FileText,
  TrendingUp,
  DollarSign
} from 'lucide-react';
import { StagedData } from '@/services/UploadBatchService';
import { format } from 'date-fns';

interface DataPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  stagedData: StagedData[];
  onApprove: (approvedData: StagedData[]) => void;
  onReject: () => void;
}

export const DataPreviewModal: React.FC<DataPreviewModalProps> = ({
  isOpen,
  onClose,
  stagedData,
  onApprove,
  onReject
}) => {
  const [selectedData, setSelectedData] = useState<StagedData[]>(stagedData);
  const [editingField, setEditingField] = useState<{ id: string; field: string } | null>(null);
  const [editValue, setEditValue] = useState<string>('');

  const handleToggleApproval = (id: string) => {
    setSelectedData(prev => prev.map(item => 
      item.id === id 
        ? { ...item, status: item.status === 'approved' ? 'pending' : 'approved' }
        : item
    ));
  };

  const handleEditField = (id: string, field: string, currentValue: any) => {
    setEditingField({ id, field });
    setEditValue(String(currentValue || ''));
  };

  const handleSaveEdit = () => {
    if (!editingField) return;

    setSelectedData(prev => prev.map(item => 
      item.id === editingField.id 
        ? { 
            ...item, 
            user_corrections: {
              ...item.user_corrections,
              [editingField.field]: parseFloat(editValue) || editValue
            }
          }
        : item
    ));
    
    setEditingField(null);
    setEditValue('');
  };

  const handleCancelEdit = () => {
    setEditingField(null);
    setEditValue('');
  };

  const getFieldValue = (item: StagedData, field: string) => {
    if (item.user_corrections[field] !== undefined) {
      return item.user_corrections[field];
    }
    
    const data = item.extracted_data as any;
    const fieldPath = field.split('.');
    let value = data;
    
    for (const path of fieldPath) {
      value = value?.[path];
    }
    
    return value;
  };

  const renderEditableField = (item: StagedData, field: string, label: string) => {
    const currentValue = getFieldValue(item, field);
    const isEditing = editingField?.id === item.id && editingField?.field === field;
    const hasCorrection = item.user_corrections[field] !== undefined;

    return (
      <div className="flex items-center justify-between p-2 rounded border">
        <div className="flex-1">
          <span className="text-sm font-medium text-muted-foreground">{label}:</span>
          {isEditing ? (
            <div className="flex items-center gap-2 mt-1">
              <Input
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                className="h-8"
                autoFocus
              />
              <Button size="sm" onClick={handleSaveEdit}>
                <Save className="w-3 h-3" />
              </Button>
              <Button size="sm" variant="ghost" onClick={handleCancelEdit}>
                <X className="w-3 h-3" />
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2 mt-1">
              <span className={hasCorrection ? 'text-primary font-semibold' : ''}>
                {typeof currentValue === 'number' ? currentValue.toFixed(2) : String(currentValue || 'N/A')}
              </span>
              {hasCorrection && <Badge variant="secondary" className="text-xs">Edited</Badge>}
              <Button 
                size="sm" 
                variant="ghost" 
                onClick={() => handleEditField(item.id, field, currentValue)}
              >
                <Edit3 className="w-3 h-3" />
              </Button>
            </div>
          )}
        </div>
      </div>
    );
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-red-600 bg-red-50';
      case 'error': return 'text-red-500 bg-red-50';
      case 'warning': return 'text-amber-600 bg-amber-50';
      default: return 'text-blue-600 bg-blue-50';
    }
  };

  const approvedCount = selectedData.filter(item => item.status === 'approved').length;
  const hasErrors = selectedData.some(item => item.validation_errors.some(e => e.severity === 'critical' || e.severity === 'error'));

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Review Upload Data ({selectedData.length} files)
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-4">
          {/* Summary */}
          <div className="grid grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-emerald-600" />
                  <div>
                    <p className="text-sm text-muted-foreground">Approved</p>
                    <p className="text-xl font-bold">{approvedCount}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-amber-600" />
                  <div>
                    <p className="text-sm text-muted-foreground">Needs Review</p>
                    <p className="text-xl font-bold">
                      {selectedData.filter(item => item.status === 'needs_review').length}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-blue-600" />
                  <div>
                    <p className="text-sm text-muted-foreground">Total Sales</p>
                    <p className="text-xl font-bold">
                      ${selectedData.reduce((sum, item) => sum + (item.extracted_data.grossSales || 0), 0).toFixed(2)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Data Items */}
          <div className="space-y-4">
            {selectedData.map((item, index) => (
              <Card key={item.id} className={`${item.status === 'approved' ? 'ring-2 ring-emerald-200' : ''}`}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Badge variant="outline">{item.pos_system.toUpperCase()}</Badge>
                      <span className="font-medium">{item.file_name}</span>
                      <Badge variant="secondary">{item.confidence_score.toFixed(0)}% confidence</Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge 
                        className={
                          item.status === 'approved' ? 'bg-emerald-100 text-emerald-700' :
                          item.status === 'needs_review' ? 'bg-amber-100 text-amber-700' :
                          'bg-gray-100 text-gray-700'
                        }
                      >
                        {item.status}
                      </Badge>
                      <Button
                        size="sm"
                        variant={item.status === 'approved' ? 'default' : 'outline'}
                        onClick={() => handleToggleApproval(item.id)}
                      >
                        {item.status === 'approved' ? 'Approved' : 'Approve'}
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent>
                  <Tabs defaultValue="data" className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="data">Sales Data</TabsTrigger>
                      <TabsTrigger value="validation">
                        Validation ({item.validation_errors.length})
                      </TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="data" className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-3">
                          {renderEditableField(item, 'date', 'Date')}
                          {renderEditableField(item, 'grossSales', 'Gross Sales')}
                          {renderEditableField(item, 'netSales', 'Net Sales')}
                          {renderEditableField(item, 'orderCount', 'Order Count')}
                        </div>
                        <div className="space-y-3">
                          {renderEditableField(item, 'location', 'Location')}
                          {renderEditableField(item, 'orderAverage', 'Order Average')}
                          {renderEditableField(item, 'paymentBreakdown.totalCash', 'Total Cash')}
                          {renderEditableField(item, 'paymentBreakdown.tips', 'Tips')}
                        </div>
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="validation">
                      {item.validation_errors.length === 0 ? (
                        <div className="text-center py-4 text-muted-foreground">
                          <CheckCircle className="w-8 h-8 mx-auto mb-2 text-emerald-500" />
                          No validation errors
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {item.validation_errors.map((error, errorIndex) => (
                            <Alert key={errorIndex} variant="destructive">
                              <AlertCircle className="h-4 w-4" />
                              <AlertDescription>
                                <div className="flex items-center justify-between">
                                  <div>
                                    <strong>{error.field}:</strong> {error.message}
                                    {error.suggestedValue && (
                                      <div className="text-sm mt-1">
                                        Suggested: {String(error.suggestedValue)}
                                      </div>
                                    )}
                                  </div>
                                  <Badge className={getSeverityColor(error.severity)}>
                                    {error.severity}
                                  </Badge>
                                </div>
                              </AlertDescription>
                            </Alert>
                          ))}
                        </div>
                      )}
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        <DialogFooter className="border-t pt-4">
          <div className="flex items-center justify-between w-full">
            <div className="text-sm text-muted-foreground">
              {approvedCount} of {selectedData.length} files approved
              {hasErrors && (
                <span className="text-amber-600 ml-2">
                  ⚠️ Some files have validation errors
                </span>
              )}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={onReject}>
                Cancel
              </Button>
              <Button 
                onClick={() => onApprove(selectedData)}
                disabled={approvedCount === 0}
              >
                Upload {approvedCount} Approved Files
              </Button>
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};