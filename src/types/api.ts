
export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

export interface FilterOptions {
  search?: string;
  status?: string;
  priority?: string;
  assignedTo?: string;
  projectId?: string;
  startDate?: string;
  endDate?: string;
}

export interface SortOptions {
  field: string;
  direction: 'asc' | 'desc';
}
