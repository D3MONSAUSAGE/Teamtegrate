import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Eye } from 'lucide-react';
import { ChecklistExecutionItem } from '@/types/checklist';

interface SimpleChecklistItemCardProps {
  item: any;
  index: number;
  onComplete: (itemId: string, isCompleted: boolean, notes?: string) => void;
  onVerify: (itemId: string, isVerified: boolean, notes?: string) => void;
  disabled: boolean;
  isManager: boolean;
}

export const SimpleChecklistItemCard: React.FC<SimpleChecklistItemCardProps> = ({
  item,
  index,
  onComplete,
  onVerify,
  disabled,
  isManager,
}) => {
  const [localNotes, setLocalNotes] = useState(item.notes || '');

  const handleExecuteChange = (checked: boolean) => {
    onComplete(item.id, checked, localNotes);
  };

  const handleVerifyChange = (checked: boolean) => {
    onVerify(item.id, checked, localNotes);
  };

  return (
    <Card className={`transition-all duration-200 ${
      item.is_completed ? 'bg-green-50 border-green-200' : 'hover:shadow-sm'
    }`}>
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          {/* Item Number */}
          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium text-primary">
            {index + 1}
          </div>

          {/* Item Content */}
          <div className="flex-1 space-y-3">
            <div className="space-y-2">
              <h4 className="font-medium text-base leading-tight">
                {item.checklist_item?.title || item.title}
              </h4>
              {(item.checklist_item?.description || item.description) && (
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {item.checklist_item?.description || item.description}
                </p>
              )}
              {item.checklist_item?.is_required && (
                <Badge variant="outline" className="text-xs">Required</Badge>
              )}
            </div>

            {/* Checkboxes */}
            <div className="flex items-center gap-6">
              {/* Execute Checkbox */}
              <div className="flex items-center space-x-2">
                <Checkbox
                  id={`execute-${item.id}`}
                  checked={item.is_completed}
                  onCheckedChange={handleExecuteChange}
                  disabled={disabled}
                  className="data-[state=checked]:bg-green-600 data-[state=checked]:border-green-600"
                />
                <label htmlFor={`execute-${item.id}`} className="text-sm font-medium flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  Execute
                </label>
              </div>

              {/* Verify Checkbox - Only for Managers */}
              {isManager && (
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id={`verify-${item.id}`}
                    checked={item.is_verified}
                    onCheckedChange={handleVerifyChange}
                    disabled={disabled || !item.is_completed}
                    className="data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                  />
                  <label htmlFor={`verify-${item.id}`} className="text-sm font-medium flex items-center gap-2">
                    <Eye className="h-4 w-4 text-blue-600" />
                    Verify
                  </label>
                </div>
              )}
            </div>

            {/* Status Indicators */}
            <div className="flex items-center gap-2">
              {item.is_completed && (
                <Badge variant="default" className="bg-green-600 text-white">
                  Executed
                </Badge>
              )}
              {item.is_verified && (
                <Badge variant="default" className="bg-blue-600 text-white">
                  Verified
                </Badge>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};