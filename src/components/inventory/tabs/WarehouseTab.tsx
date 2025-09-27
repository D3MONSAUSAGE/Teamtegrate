import React, { useState, useEffect, useCallback } from 'react';
import { WarehouseStock } from '../warehouse/WarehouseStock';
import { NotConfigured } from '../warehouse/NotConfigured';
import { ReceiveStockDrawer } from '../warehouse/ReceiveStockDrawer';

import { ProcessingTab } from '../warehouse/ProcessingTab';
import { OutgoingTab } from '../warehouse/OutgoingTab';
import { ReportsTab } from '../warehouse/ReportsTab';
import { ScrollableTabs, ScrollableTabsList, ScrollableTabsTrigger } from '@/components/ui/ScrollableTabs';
import { Card, CardContent } from '@/components/ui/card';
import { Package } from 'lucide-react';
import { UnifiedTeamSelector } from '@/components/teams/UnifiedTeamSelector';
import { useTeamAccess } from '@/hooks/useTeamAccess';
import { useAuth } from '@/contexts/AuthContext';
import { warehouseApi, type Warehouse } from '@/contexts/warehouse/api/warehouseApi';
import { toast } from 'sonner';

// Lazy load the dashboard component to avoid circular dependencies
const WarehouseOverviewDashboard = React.lazy(() => 
  import('../warehouse/WarehouseOverviewDashboard').then(module => ({
    default: module.WarehouseOverviewDashboard
  }))
);

export const WarehouseTab: React.FC = () => {
  const { user } = useAuth();
  const { isAdmin, isSuperAdmin, isManager, availableTeams } = useTeamAccess();
  const [warehouse, setWarehouse] = useState<Warehouse | null>(null);
  const [loading, setLoading] = useState(true);
  const [teamSwitching, setTeamSwitching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [activeTab, setActiveTab] = useState('stock');
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);
  const [showOverview, setShowOverview] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);

  // For admins, show overview by default unless team is selected
  const shouldLoadWarehouse = (isAdmin || isSuperAdmin) ? selectedTeamId !== null : true;
  const shouldShowOverview = (isAdmin || isSuperAdmin) && selectedTeamId === null;

  const loadWarehouse = useCallback(async (retryCount = 0) => {
    if (!shouldLoadWarehouse) {
      setLoading(false);
      setWarehouse(null);
      setError(null);
      setTeamSwitching(false);
      setIsRetrying(false);
      setShowOverview(true); // Show overview when no team is selected
      return;
    }

    // Prevent parallel loading attempts (but allow retries)
    if (loading && retryCount === 0) {
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setShowOverview(false); // Hide overview when loading specific warehouse
      if (retryCount > 0) {
        setIsRetrying(true);
      }
      // SECURITY: Immediately clear warehouse data to prevent cross-team data leakage
      setWarehouse(null);
      
      let data: Warehouse | null = null;
      
      // For admins/superadmins with team selected, get warehouse by team
      if ((isAdmin || isSuperAdmin) && selectedTeamId) {
        data = await warehouseApi.getWarehouseByTeam(selectedTeamId);
      } else if (isManager && availableTeams.length === 1) {
        // Managers with single team - get their team's warehouse
        data = await warehouseApi.getWarehouseByTeam(availableTeams[0].id);
      } else if (availableTeams.length > 0) {
        // Regular users - get their first team's warehouse
        data = await warehouseApi.getWarehouseByTeam(availableTeams[0].id);
      }
      
      if (data) {
        // SECURITY: Validate warehouse belongs to selected team
        if ((isAdmin || isSuperAdmin) && selectedTeamId && data.team_id !== selectedTeamId) {
          console.error('SECURITY ALERT: Warehouse team mismatch', {
            expectedTeamId: selectedTeamId,
            actualTeamId: data.team_id,
            warehouseId: data.id,
            userId: user?.id
          });
          toast.error('Security error: Warehouse team mismatch');
          setError('Access denied: Invalid warehouse access');
          setWarehouse(null);
          return;
        }
        
        console.log('Warehouse loaded:', data);
        setWarehouse(data);
      } else {
        // No warehouse exists - but if we just created one, retry a few times
        if (retryCount < 3 && !isRetrying) {
          console.log(`No warehouse found - retrying (${retryCount + 1}/3)...`);
          setIsRetrying(true);
          // Use exponential backoff: 1s, 2s, 4s
          const delay = Math.pow(2, retryCount) * 1000;
          setTimeout(() => {
            setIsRetrying(false);
            loadWarehouse(retryCount + 1);
          }, delay);
          return;
        }
        // After retries, show setup screen
        console.log('No warehouse found - showing setup screen');
        setWarehouse(null);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      // Check if the error is due to missing warehouse tables
      if (errorMessage.includes('relation') && errorMessage.includes('does not exist')) {
        // Tables don't exist yet - this is a system configuration issue
        setError('Warehouse system not installed. Please contact system administrator.');
        setWarehouse(null);
      } else if (errorMessage.includes('permission') || errorMessage.includes('RLS')) {
        // Permission/RLS issue
        setError('Access denied. You don\'t have permission to view warehouses.');
        setWarehouse(null);
      } else {
        // General error - retry if we haven't exhausted retries
        if (retryCount < 3 && !isRetrying) {
          console.log(`Error loading warehouse - retrying (${retryCount + 1}/3)...`);
          setIsRetrying(true);
          // Use exponential backoff: 1s, 2s, 4s
          const delay = Math.pow(2, retryCount) * 1000;
          setTimeout(() => {
            setIsRetrying(false);
            loadWarehouse(retryCount + 1);
          }, delay);
          return;
        }
        // After retries, show setup screen
        console.log('Error persists after retries - showing setup screen');
        setWarehouse(null);
        setError(null);
      }
    } finally {
      setLoading(false);
      setTeamSwitching(false);
      setIsRetrying(false);
    }
  }, [shouldLoadWarehouse, selectedTeamId, isAdmin, isSuperAdmin, isManager, availableTeams, user?.id]);

  // Handle team changes for all users
  useEffect(() => {
    if (isAdmin || isSuperAdmin) {
      if (selectedTeamId !== null) {
        // Team selected - load warehouse
        setTeamSwitching(true);
        setWarehouse(null); // Immediately clear to prevent cross-team data leakage
        setError(null);
        setShowOverview(false);
        loadWarehouse();
      } else {
        // No team selected - show overview
        setTeamSwitching(false);
        setWarehouse(null);
        setError(null);
        setShowOverview(true);
        setLoading(false);
      }
    }
  }, [selectedTeamId, isAdmin, isSuperAdmin, loadWarehouse]);

  // Initial load for non-admin users and admin overview
  useEffect(() => {
    if (!isAdmin && !isSuperAdmin) {
      // Non-admin users always load their warehouse
      loadWarehouse();
    } else {
      // Admin users show overview initially
      setShowOverview(true);
      setLoading(false);
    }
  }, [isAdmin, isSuperAdmin, loadWarehouse]);

  const handleRefresh = useCallback(() => {
    setRefreshKey(prev => prev + 1);
  }, []);

  const handleSelectWarehouse = (teamId: string | null) => {
    // Set the selected team and hide the overview to show warehouse details
    if (teamId) {
      setSelectedTeamId(teamId);
    }
    setShowOverview(false);
  };

  const tabs = [
    { id: 'stock', label: 'Warehouse Stock' },
    { id: 'processing', label: 'Processing' },
    { id: 'outgoing', label: 'Outgoing' },
    { id: 'reports', label: 'Reports' }
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'stock':
        return <WarehouseStock key={refreshKey} warehouseId={warehouse.id} />;
      case 'processing':
        return <ProcessingTab />;
      case 'outgoing':
        return <OutgoingTab warehouseId={warehouse.id} />;
      case 'reports':
        return <ReportsTab />;
      default:
        return <WarehouseStock key={refreshKey} warehouseId={warehouse.id} />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        {/* Team Selector for Admins/Superadmins - Always visible */}
        {(isAdmin || isSuperAdmin) && (
        <div className="flex items-center gap-4">
            <UnifiedTeamSelector
              selectedTeamId={selectedTeamId}
              onTeamChange={(teamId) => {
                setSelectedTeamId(teamId);
                setShowOverview(teamId === null);
              }}
              variant="simple"
              placeholder="Select team warehouse..."
              showAllOption={true}
            />
          </div>
        )}
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold">
              {warehouse ? (
                warehouse.team?.name 
                  ? `${warehouse.team.name} Warehouse Stock`
                  : warehouse.name
              ) : (isAdmin || isSuperAdmin) && !selectedTeamId ? (
                'Warehouse Management'
              ) : (
                'Warehouse Stock'
              )}
            </h2>
            <p className="text-muted-foreground">
              {warehouse ? (
                <>Manage {warehouse.name} stock levels{warehouse.team?.name && ` (${warehouse.team.name})`}, receive inventory, and manage outgoing inventory including sales and transfers</>
              ) : (isAdmin || isSuperAdmin) && !selectedTeamId ? (
                <>Select a team to view and manage their warehouse</>
              ) : (
                <>Set up your warehouse to start managing inventory</>
              )}
            </p>
          </div>
          {warehouse && (
            <div className="flex flex-col sm:flex-row gap-2">
              <ReceiveStockDrawer 
                warehouseId={warehouse.id}
                onReceiptPosted={handleRefresh}
              />
            </div>
          )}
        </div>
      </div>

      {/* Content based on state */}
      {loading || teamSwitching ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-muted-foreground">
            {teamSwitching 
              ? 'Switching teams...' 
              : isRetrying 
                ? 'Retrying connection...' 
                : 'Loading warehouse...'
            }
          </div>
        </div>
      ) : error ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="text-destructive font-medium mb-2">System Error</div>
            <div className="text-sm text-muted-foreground">{error}</div>
          </div>
        </div>
      ) : shouldShowOverview || showOverview ? (
        <React.Suspense fallback={<div className="flex items-center justify-center py-12">Loading dashboard...</div>}>
          <WarehouseOverviewDashboard onSelectWarehouse={handleSelectWarehouse} />
        </React.Suspense>
      ) : !warehouse ? (
        <NotConfigured onConfigured={loadWarehouse} selectedTeamId={selectedTeamId} />
      ) : (
        <ScrollableTabs>
          <ScrollableTabsList>
            {tabs.map((tab) => (
              <ScrollableTabsTrigger
                key={tab.id}
                isActive={activeTab === tab.id}
                onClick={() => setActiveTab(tab.id)}
              >
                {tab.label}
              </ScrollableTabsTrigger>
            ))}
          </ScrollableTabsList>

          <div className="mt-6">
            {renderTabContent()}
          </div>
        </ScrollableTabs>
      )}
    </div>
  );
};