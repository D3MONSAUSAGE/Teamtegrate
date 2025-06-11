
// Type definitions for flat task structures
export interface FlatTask {
  id: string;
  title: string;
  description?: string;
  status: string;
  priority: string;
  deadline: string;
  userId: string;
  projectId?: string;
  assignedToId?: string;
  assignedToName?: string;
  createdAt: string;
  updatedAt: string;
  organizationId: string;
}

export interface FlatProject {
  id: string;
  title: string;
  description?: string;
  status: string;
  managerId: string;
  organizationId: string;
  createdAt: string;
  updatedAt: string;
}
