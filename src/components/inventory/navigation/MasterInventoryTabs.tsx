import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ScrollableTabs, ScrollableTabsList, ScrollableTabsTrigger } from '@/components/ui/ScrollableTabs';
import { LayoutDashboard, Package, FileText, Warehouse, Settings, AlertTriangle } from 'lucide-react';

interface MasterInventoryTabsProps {
  className?: string;
}

export const MasterInventoryTabs: React.FC<MasterInventoryTabsProps> = ({ className }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const tabs = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard, path: '/dashboard/inventory/overview' },
    { id: 'count', label: 'Count', icon: Package, path: '/dashboard/inventory/count' },
    { id: 'records', label: 'Records', icon: FileText, path: '/dashboard/inventory/records' },
    { id: 'warehouse', label: 'Warehouse', icon: Warehouse, path: '/dashboard/inventory/warehouse' },
    { id: 'recall', label: 'Recall & Tracking', icon: AlertTriangle, path: '/dashboard/inventory/recall' },
    { id: 'management', label: 'Management', icon: Settings, path: '/dashboard/inventory/management' },
  ];

  const isActive = (path: string) => {
    return location.pathname.startsWith(path);
  };

  return (
    <ScrollableTabs className={className}>
      <ScrollableTabsList>
        {tabs.map((tab) => (
          <ScrollableTabsTrigger
            key={tab.id}
            isActive={isActive(tab.path)}
            onClick={() => navigate(tab.path)}
          >
            <tab.icon className="h-4 w-4 mr-2" />
            {tab.label}
          </ScrollableTabsTrigger>
        ))}
      </ScrollableTabsList>
    </ScrollableTabs>
  );
};
