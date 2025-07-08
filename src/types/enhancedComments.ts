
export interface EnhancedTaskComment {
  id: string;
  userId: string;
  userName: string;
  text: string;
  createdAt: Date;
  updatedAt?: Date;
  organizationId?: string;
  category?: string;
  isPinned?: boolean;
  metadata?: any;
}

export interface ProjectCommentStats {
  total_comments: number;
  recent_comments: number;
  pinned_comments: number;
  categories: string[];
}

export interface CommentFilter {
  category?: string;
  author?: string;
  dateRange?: {
    start: Date;
    end: Date;
  };
  searchQuery?: string;
  showPinnedOnly?: boolean;
}
