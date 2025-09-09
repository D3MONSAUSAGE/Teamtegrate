import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ActivityItem, useRequestActivityFeed } from '@/hooks/requests/useRequestActivityFeed';
import { Loader2 } from 'lucide-react';
import { format } from 'date-fns';

interface RequestActivityFeedProps {
  requestId: string;
}

const iconForType = (type: string) => {
  // Simple emoji icons to avoid importing many icons; can be extended later
  const map: Record<string, string> = {
    status_change: '🔄',
    comment_added: '💬',
    approver_assigned: '👤',
    file_uploaded: '📎',
    submitted: '📤',
    approved: '✅',
    rejected: '❌',
    completed: '🏁',
  };
  return map[type] || '•';
};

export default function RequestActivityFeed({ requestId }: RequestActivityFeedProps) {
  const { items, loading, error } = useRequestActivityFeed(requestId);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Activity</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-8 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin mr-2" /> Loading activity...
          </div>
        ) : error ? (
          <div className="text-destructive">{error}</div>
        ) : items.length === 0 ? (
          <p className="text-muted-foreground">No recent activity.</p>
        ) : (
          <div className="space-y-4">
            {items.map((item: ActivityItem) => (
              <div key={item.id} className="flex items-start gap-3">
                <div className="text-lg leading-none mt-0.5">{iconForType(item.activity_type)}</div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 text-sm">
                    <span className="font-medium">{item.activity_type.replace(/_/g, ' ')}</span>
                    <span className="text-muted-foreground">{format(new Date(item.created_at), 'PPp')}</span>
                  </div>
                  {item.activity_data && (
                    <pre className="text-xs text-muted-foreground bg-muted/50 rounded p-2 mt-1 overflow-x-auto">
                      {JSON.stringify(item.activity_data, null, 2)}
                    </pre>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
