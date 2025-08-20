export interface ArchiveSettings {
  id: string;
  organizationId?: string;
  userId?: string;
  thresholdDays: number;
  autoArchiveEnabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ArchiveAction {
  id: string;
  taskId: string;
  userId: string;
  organizationId: string;
  action: 'archived' | 'unarchived';
  timestamp: Date;
  metadata?: {
    reason?: string;
    batchId?: string;
    autoArchived?: boolean;
  };
}

export type ArchiveThresholdOption = 30 | 60 | 90 | 180;

export interface ArchiveFilters {
  dateFrom?: Date;
  dateTo?: Date;
  userId?: string;
  projectId?: string;
  search?: string;
}