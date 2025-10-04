import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useRecruitmentPositions } from '@/hooks/recruitment/useRecruitmentPositions';
import { Plus } from 'lucide-react';
import type { EmploymentType, PositionStatus } from '@/types/recruitment';

interface CreatePositionDialogProps {
  children?: React.ReactNode;
}

export function CreatePositionDialog({ children }: CreatePositionDialogProps) {
  const [open, setOpen] = useState(false);
  const { createPosition, isCreating } = useRecruitmentPositions();

  const [formData, setFormData] = useState({
    job_title: '',
    department: '',
    location: '',
    employment_type: 'full_time' as EmploymentType,
    job_description: '',
    requirements: '',
    salary_range_min: '',
    salary_range_max: '',
    status: 'open' as PositionStatus,
    posted_date: new Date().toISOString().split('T')[0],
    target_hire_date: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const positionData = {
      ...formData,
      salary_range_min: formData.salary_range_min ? parseFloat(formData.salary_range_min) : undefined,
      salary_range_max: formData.salary_range_max ? parseFloat(formData.salary_range_max) : undefined,
      target_hire_date: formData.target_hire_date || undefined,
    };

    createPosition(positionData, {
      onSuccess: () => {
        setOpen(false);
        setFormData({
          job_title: '',
          department: '',
          location: '',
          employment_type: 'full_time',
          job_description: '',
          requirements: '',
          salary_range_min: '',
          salary_range_max: '',
          status: 'open',
          posted_date: new Date().toISOString().split('T')[0],
          target_hire_date: '',
        });
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Create Position
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Position</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="job_title">Job Title *</Label>
              <Input
                id="job_title"
                value={formData.job_title}
                onChange={(e) => setFormData({ ...formData, job_title: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="department">Department</Label>
              <Input
                id="department"
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="employment_type">Employment Type *</Label>
              <Select
                value={formData.employment_type}
                onValueChange={(value: EmploymentType) => setFormData({ ...formData, employment_type: value })}
              >
                <SelectTrigger id="employment_type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="full_time">Full Time</SelectItem>
                  <SelectItem value="part_time">Part Time</SelectItem>
                  <SelectItem value="contract">Contract</SelectItem>
                  <SelectItem value="temporary">Temporary</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="job_description">Job Description</Label>
            <Textarea
              id="job_description"
              value={formData.job_description}
              onChange={(e) => setFormData({ ...formData, job_description: e.target.value })}
              rows={4}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="requirements">Requirements</Label>
            <Textarea
              id="requirements"
              value={formData.requirements}
              onChange={(e) => setFormData({ ...formData, requirements: e.target.value })}
              rows={4}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="salary_range_min">Min Salary</Label>
              <Input
                id="salary_range_min"
                type="number"
                value={formData.salary_range_min}
                onChange={(e) => setFormData({ ...formData, salary_range_min: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="salary_range_max">Max Salary</Label>
              <Input
                id="salary_range_max"
                type="number"
                value={formData.salary_range_max}
                onChange={(e) => setFormData({ ...formData, salary_range_max: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="posted_date">Posted Date *</Label>
              <Input
                id="posted_date"
                type="date"
                value={formData.posted_date}
                onChange={(e) => setFormData({ ...formData, posted_date: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="target_hire_date">Target Hire Date</Label>
              <Input
                id="target_hire_date"
                type="date"
                value={formData.target_hire_date}
                onChange={(e) => setFormData({ ...formData, target_hire_date: e.target.value })}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isCreating}>
              {isCreating ? 'Creating...' : 'Create Position'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
