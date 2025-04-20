
import { TaskPriority } from '@/types';

export interface FormValues {
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  budget: string | number;
  teamMembers: { memberId: string }[];
  tasks: {
    title: string;
    description: string;
    priority: string;
    deadline: string;
  }[];
}

export interface ProjectFormProps {
  register: any;
  errors: any;
  editingProject?: any;
  setValue?: any;
  watch?: any;
  control?: any;
}

export interface ProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingProject?: any;
}
