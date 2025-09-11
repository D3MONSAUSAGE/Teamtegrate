import React from 'react';
import SmartUploadCenter from '@/components/finance/dashboard/SmartUploadCenter';

const UploadCenterTab: React.FC = () => {
  return (
    <div className="space-y-6">
      <SmartUploadCenter onBackToDashboard={() => {}} />
    </div>
  );
};

export default UploadCenterTab;