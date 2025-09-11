import React from 'react';
import AdvancedAnalyticsDashboard from '@/components/finance/analytics/AdvancedAnalyticsDashboard';

const AnalyticsTab: React.FC = () => {
  return (
    <div className="space-y-6">
      <AdvancedAnalyticsDashboard onBackToDashboard={() => {}} />
    </div>
  );
};

export default AnalyticsTab;