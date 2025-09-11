import React from 'react';
import DailySales from '@/components/finance/DailySales';

const DataBrowserTab: React.FC = () => {
  return (
    <div className="space-y-6">
      <DailySales />
    </div>
  );
};

export default DataBrowserTab;