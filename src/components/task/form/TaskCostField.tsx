
import React from 'react';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DollarSign } from 'lucide-react';
import { UseFormReturn } from 'react-hook-form';

interface TaskCostFieldProps {
  form: UseFormReturn<any>;
}

const TaskCostField: React.FC<TaskCostFieldProps> = ({ form }) => {
  return (
    <div className="space-y-2">
      <Label htmlFor="cost" className="text-base font-medium">Cost (Optional)</Label>
      <div className="relative">
        <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
        <Input
          id="cost"
          type="number"
          step="0.01"
          placeholder="0.00"
          className="pl-10 h-12 border-2 focus:border-primary"
          {...form.register('cost')}
        />
      </div>
    </div>
  );
};

export default TaskCostField;
