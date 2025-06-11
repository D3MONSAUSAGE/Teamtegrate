
// Simplified type definitions for API responses
export interface SimplifiedTask {
  id: string;
  title: string;
  status: string;
  priority: string;
  deadline: string;
  projectId?: string;
  assignedToId?: string;
}

export interface SimplifiedProject {
  id: string;
  title: string;
  status: string;
  managerId: string;
}

export interface SimplifiedUser {
  id: string;
  name: string;
  email: string;
  role: string;
}
