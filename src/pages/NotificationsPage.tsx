import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { useNotifications, Notification } from '@/hooks/use-notifications';
import { useNavigate } from 'react-router-dom';
import { 
  Bell, 
  Check, 
  CheckCheck, 
  Search, 
  Trash2, 
  Archive,
  Mail,
  MailOpen,
  Calendar,
  Filter,
  SortDesc,
  AlertTriangle,
  Info,
  Briefcase,
  User,
  Settings,
  ChevronDown,
  ChevronRight
} from 'lucide-react';
import { toast } from 'sonner';

type DateFilter = 'all' | 'today' | 'this-week' | 'this-month';
type ReadFilter = 'all' | 'read' | 'unread';
type SortOption = 'newest' | 'oldest' | 'priority';

const NotificationsPage = () => {
  const { 
    notifications, 
    unreadCount, 
    markAsRead, 
    markAsUnread,
    deleteNotifications,
    archiveNotifications,
    fetchNotifications 
  } = useNotifications();
  
  const navigate = useNavigate();
  
  // State for filters and selections
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [readFilter, setReadFilter] = useState<ReadFilter>('all');
  const [dateFilter, setDateFilter] = useState<DateFilter>('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [expandedCategories, setExpandedCategories] = useState<string[]>(['work', 'personal', 'system']);

  // Helper functions
  const getNotificationPriority = (notification: Notification): 'high' | 'medium' | 'low' => {
    if (notification.priority) return notification.priority;
    
    // Auto-assign priority based on type
    switch (notification.type) {
      case 'correction_request':
      case 'meeting_invitation':
      case 'bug_report':
        return 'high';
      case 'task_assignment':
      case 'project_team_addition':
      case 'schedule_assignment':
      case 'reminder':
        return 'medium';
      case 'chat_message':
      case 'chat_invitation':
      case 'info':
      default:
        return 'low';
    }
  };

  const getNotificationCategory = (notification: Notification): 'work' | 'personal' | 'system' => {
    if (notification.category) return notification.category;
    
    // Auto-assign category based on type
    switch (notification.type) {
      case 'task_assignment':
      case 'project_team_addition':
      case 'correction_request':
      case 'meeting_invitation':
      case 'schedule_assignment':
      case 'reminder':
        return 'work';
      case 'chat_message':
      case 'chat_invitation':
        return 'personal';
      case 'bug_report':
      case 'info':
      default:
        return 'system';
    }
  };

  const formatNotificationTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return 'yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const getNotificationTypeColor = (type: string) => {
    switch (type) {
      case 'chat_message':
      case 'chat_invitation':
        return 'bg-primary/10 text-primary border-primary/20';
      case 'task_assignment':
      case 'reminder':
        return 'bg-accent/10 text-accent border-accent/20';
      case 'project_team_addition':
        return 'bg-secondary/50 text-secondary-foreground border-secondary/30';
      case 'correction_request':
        return 'bg-destructive/10 text-destructive border-destructive/20';
      case 'meeting_invitation':
        return 'bg-warning/10 text-warning border-warning/20';
      case 'bug_report':
        return 'bg-red-100 text-red-700 border-red-200';
      case 'schedule_assignment':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'info':
        return 'bg-gray-100 text-gray-700 border-gray-200';
      default:
        return 'bg-muted text-muted-foreground border-border';
    }
  };

  const getPriorityColor = (priority: 'high' | 'medium' | 'low') => {
    switch (priority) {
      case 'high':
        return 'bg-destructive/10 text-destructive border-destructive/20';
      case 'medium':
        return 'bg-warning/10 text-warning border-warning/20';
      case 'low':
        return 'bg-muted text-muted-foreground border-border';
    }
  };

  const getCategoryIcon = (category: 'work' | 'personal' | 'system') => {
    switch (category) {
      case 'work':
        return <Briefcase className="h-4 w-4" />;
      case 'personal':
        return <User className="h-4 w-4" />;
      case 'system':
        return <Settings className="h-4 w-4" />;
    }
  };

  const getNotificationTypeLabel = (type: string) => {
    switch (type) {
      case 'chat_message':
        return 'Message';
      case 'chat_invitation':
        return 'Chat Invite';
      case 'task_assignment':
        return 'Task';
      case 'project_team_addition':
        return 'Team';
      case 'correction_request':
        return 'Correction';
      case 'meeting_invitation':
        return 'Meeting';
      case 'bug_report':
        return 'Bug Report';
      case 'reminder':
        return 'Reminder';
      case 'schedule_assignment':
        return 'Schedule';
      case 'info':
        return 'Info';
      default:
        return 'Notification';
    }
  };

  const isInDateRange = (timestamp: string, filter: DateFilter): boolean => {
    if (filter === 'all') return true;
    
    const date = new Date(timestamp);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    switch (filter) {
      case 'today':
        return date >= today;
      case 'this-week':
        const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
        return date >= weekAgo;
      case 'this-month':
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        return date >= monthStart;
      default:
        return true;
    }
  };

  // Filtered and sorted notifications
  const filteredNotifications = useMemo(() => {
    let filtered = notifications?.filter(notification => {
      const matchesSearch = 
        notification.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        notification.content?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesType = typeFilter === 'all' || notification.type === typeFilter;
      const matchesRead = 
        readFilter === 'all' || 
        (readFilter === 'read' && notification.read) || 
        (readFilter === 'unread' && !notification.read);
      
      const matchesDate = isInDateRange(notification.created_at, dateFilter);
      
      return matchesSearch && matchesType && matchesRead && matchesDate;
    }) || [];

    // Sort notifications
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'oldest':
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        case 'priority':
          const priorityOrder = { high: 3, medium: 2, low: 1 };
          const aPriority = getNotificationPriority(a);
          const bPriority = getNotificationPriority(b);
          return priorityOrder[bPriority] - priorityOrder[aPriority];
        case 'newest':
        default:
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
    });

    return filtered;
  }, [notifications, searchTerm, typeFilter, readFilter, dateFilter, sortBy]);

  // Group notifications by category
  const categorizedNotifications = useMemo(() => {
    const categories: Record<string, Notification[]> = {
      work: [],
      personal: [],
      system: []
    };

    filteredNotifications.forEach(notification => {
      const category = getNotificationCategory(notification);
      categories[category].push(notification);
    });

    return categories;
  }, [filteredNotifications]);

  // Selection handlers
  const toggleNotificationSelection = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) 
        ? prev.filter(selectedId => selectedId !== id)
        : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredNotifications.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredNotifications.map(n => n.id));
    }
  };

  const toggleCategoryExpansion = (category: string) => {
    setExpandedCategories(prev =>
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  // Bulk actions
  const handleBulkMarkAsRead = async () => {
    if (selectedIds.length === 0) return;
    await markAsRead(selectedIds);
    setSelectedIds([]);
    toast.success(`Marked ${selectedIds.length} notifications as read`);
  };

  const handleBulkMarkAsUnread = async () => {
    if (selectedIds.length === 0) return;
    await markAsUnread(selectedIds);
    setSelectedIds([]);
    toast.success(`Marked ${selectedIds.length} notifications as unread`);
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    await deleteNotifications(selectedIds);
    setSelectedIds([]);
    toast.success(`Deleted ${selectedIds.length} notifications`);
  };

  const handleBulkArchive = async () => {
    if (selectedIds.length === 0) return;
    await archiveNotifications(selectedIds);
    setSelectedIds([]);
    toast.success(`Archived ${selectedIds.length} notifications`);
  };

  const handleNotificationClick = (notification: Notification) => {
    // Mark as read when clicked
    if (!notification.read) {
      markAsRead(notification.id);
    }

    // Navigate based on type
    switch (notification.type) {
      case 'chat_message':
      case 'chat_invitation':
        navigate('/dashboard/chat');
        break;
      case 'task_assignment':
      case 'reminder':
        navigate('/dashboard/tasks');
        break;
      case 'project_team_addition':
        navigate('/dashboard/projects');
        break;
      case 'correction_request':
        navigate('/dashboard/time');
        break;
      case 'meeting_invitation':
        navigate('/dashboard/meetings');
        break;
      case 'bug_report':
        navigate('/dashboard/settings');
        break;
      case 'schedule_assignment':
        navigate('/dashboard/schedule');
        break;
      case 'info':
        navigate('/dashboard');
        break;
      default:
        break;
    }
  };

  const renderNotificationCard = (notification: Notification) => {
    const priority = getNotificationPriority(notification);
    const isSelected = selectedIds.includes(notification.id);

    return (
      <Card
        key={notification.id}
        className={`
          cursor-pointer transition-all duration-200 hover:shadow-md
          ${!notification.read ? 'border-primary/50 bg-primary/5' : ''}
          ${isSelected ? 'ring-2 ring-primary' : ''}
        `}
      >
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Checkbox
              checked={isSelected}
              onCheckedChange={() => toggleNotificationSelection(notification.id)}
              onClick={(e) => e.stopPropagation()}
            />
            
            <div 
              className="flex-1 space-y-2"
              onClick={() => handleNotificationClick(notification)}
            >
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className={`font-medium ${!notification.read ? 'text-primary' : ''}`}>
                  {notification.title}
                </h3>
                {!notification.read && (
                  <span className="w-2 h-2 rounded-full bg-primary" />
                )}
                <Badge className={getNotificationTypeColor(notification.type)}>
                  {getNotificationTypeLabel(notification.type)}
                </Badge>
                <Badge className={getPriorityColor(priority)}>
                  {priority}
                </Badge>
              </div>
              
              {notification.content && (
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {notification.content}
                </p>
              )}
              
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">
                  {formatNotificationTime(notification.created_at)}
                </span>
                
                <div className="flex items-center gap-2">
                  {!notification.read && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 hover:bg-primary/10"
                      onClick={(e) => {
                        e.stopPropagation();
                        markAsRead(notification.id);
                        toast.success('Marked as read');
                      }}
                      title="Mark as read"
                    >
                      <Check className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Bell className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold">Notifications</h1>
            <p className="text-muted-foreground">
              {unreadCount > 0 ? `${unreadCount} unread notifications` : 'All caught up!'}
            </p>
          </div>
        </div>
        
        <div className="flex gap-2">
          {unreadCount > 0 && (
            <Button 
              variant="outline" 
              onClick={() => markAsRead()}
              className="flex items-center gap-2"
            >
              <CheckCheck className="h-4 w-4" />
              Mark all read
            </Button>
          )}
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters & Search
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search notifications..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={readFilter} onValueChange={(value: ReadFilter) => setReadFilter(value)}>
              <SelectTrigger className="w-full md:w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="unread">Unread</SelectItem>
                <SelectItem value="read">Read</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={dateFilter} onValueChange={(value: DateFilter) => setDateFilter(value)}>
              <SelectTrigger className="w-full md:w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Time</SelectItem>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="this-week">This Week</SelectItem>
                <SelectItem value="this-month">This Month</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="chat_message">Messages</SelectItem>
                <SelectItem value="chat_invitation">Chat Invites</SelectItem>
                <SelectItem value="task_assignment">Tasks</SelectItem>
                <SelectItem value="reminder">Reminders</SelectItem>
                <SelectItem value="correction_request">Corrections</SelectItem>
                <SelectItem value="meeting_invitation">Meetings</SelectItem>
                <SelectItem value="project_team_addition">Projects</SelectItem>
                <SelectItem value="bug_report">Bug Reports</SelectItem>
                <SelectItem value="schedule_assignment">Schedule</SelectItem>
                <SelectItem value="info">Info</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={sortBy} onValueChange={(value: SortOption) => setSortBy(value)}>
              <SelectTrigger className="w-full md:w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest</SelectItem>
                <SelectItem value="oldest">Oldest</SelectItem>
                <SelectItem value="priority">Priority</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Bulk Actions */}
      {selectedIds.length > 0 && (
        <Card className="border-primary/50 bg-primary/5">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Checkbox
                  checked={selectedIds.length === filteredNotifications.length}
                  onCheckedChange={toggleSelectAll}
                />
                <span className="font-medium">
                  {selectedIds.length} selected
                </span>
              </div>
              
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleBulkMarkAsRead}
                  className="flex items-center gap-2"
                >
                  <MailOpen className="h-4 w-4" />
                  Mark Read
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleBulkMarkAsUnread}
                  className="flex items-center gap-2"
                >
                  <Mail className="h-4 w-4" />
                  Mark Unread
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleBulkArchive}
                  className="flex items-center gap-2"
                >
                  <Archive className="h-4 w-4" />
                  Archive
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleBulkDelete}
                  className="flex items-center gap-2"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Notifications by Category */}
      <div className="space-y-4">
        {filteredNotifications.length > 0 ? (
          Object.entries(categorizedNotifications).map(([category, categoryNotifications]) => {
            if (categoryNotifications.length === 0) return null;
            
            const isExpanded = expandedCategories.includes(category);
            const categoryName = category.charAt(0).toUpperCase() + category.slice(1);
            
            return (
              <Card key={category}>
                <CardHeader className="pb-3">
                  <Button
                    variant="ghost"
                    onClick={() => toggleCategoryExpansion(category)}
                    className="flex items-center justify-between w-full p-0 h-auto hover:bg-transparent"
                  >
                    <div className="flex items-center gap-2">
                      {getCategoryIcon(category as 'work' | 'personal' | 'system')}
                      <CardTitle className="text-lg">
                        {categoryName} ({categoryNotifications.length})
                      </CardTitle>
                    </div>
                    {isExpanded ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                  </Button>
                </CardHeader>
                
                {isExpanded && (
                  <CardContent className="pt-0">
                    <div className="space-y-2">
                      {categoryNotifications.map(renderNotificationCard)}
                    </div>
                  </CardContent>
                )}
              </Card>
            );
          })
        ) : (
          <Card>
            <CardContent className="p-8 text-center">
              <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No notifications found</h3>
              <p className="text-muted-foreground">
                {searchTerm || readFilter !== 'all' || dateFilter !== 'all' || typeFilter !== 'all'
                  ? 'Try adjusting your search or filter criteria.'
                  : "You're all caught up! New notifications will appear here."
                }
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default NotificationsPage;