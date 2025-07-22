
import React from 'react';
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Project } from '@/types';
import { UseFormReturn } from 'react-hook-form';
import { Flag, Briefcase, DollarSign } from 'lucide-react';

interface MobileTaskDetailsProps {
  form: UseFormReturn<any>;
  projects: Project[];
}

const MobileTaskDetails: React.FC<MobileTaskDetailsProps> = ({ form, projects }) => {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label className="text-sm font-medium text-foreground flex items-center gap-1">
            <Flag className="h-3 w-3" />
            Priority
          </Label>
          <Select 
            value={form.watch('priority')} 
            onValueChange={(value) => form.setValue('priority', value)}
          >
            <SelectTrigger className="mobile-touch-target border-2 focus:border-primary">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Low">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-500"></div>
                  Low
                </div>
              </SelectItem>
              <SelectItem value="Medium">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                  Medium
                </div>
              </SelectItem>
              <SelectItem value="High">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-red-500"></div>
                  High
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label className="text-sm font-medium text-foreground flex items-center gap-1">
            <DollarSign className="h-3 w-3" />
            Cost
          </Label>
          <Input
            type="number"
            step="0.01"
            placeholder="0.00"
            className="mobile-touch-target border-2 focus:border-primary"
            {...form.register('cost')}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label className="text-sm font-medium text-foreground flex items-center gap-1">
          <Briefcase className="h-3 w-3" />
          Project
        </Label>
        <Select 
          value={form.watch('projectId')} 
          onValueChange={(value) => form.setValue('projectId', value)}
        >
          <SelectTrigger className="mobile-touch-target border-2 focus:border-primary">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">No Project</SelectItem>
            {projects.map((project) => (
              <SelectItem key={project.id} value={project.id}>
                <div className="flex items-center gap-2">
                  <div 
                    className="w-2 h-2 rounded-full" 
                    style={{ backgroundColor: project.color || '#6366f1' }}
                  ></div>
                  {project.name}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};

export default MobileTaskDetails;
