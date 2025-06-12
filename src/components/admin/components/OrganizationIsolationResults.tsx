
import React from 'react';
import { getStatusBadge } from './TestStatusHelpers';
import { TestResult } from '../types';

interface OrganizationIsolationResultsProps {
  results: TestResult;
}

const OrganizationIsolationResults: React.FC<OrganizationIsolationResultsProps> = ({ results }) => {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="font-medium">Organization Isolation</span>
        {getStatusBadge(results)}
      </div>
      <div className="text-sm text-gray-600 pl-4">
        {results.organizationId && (
          <div>Organization ID: {results.organizationId}</div>
        )}
        {results.totalAccessibleProjects !== undefined && (
          <div>Accessible Projects: {results.totalAccessibleProjects}</div>
        )}
        {results.totalAccessibleTasks !== undefined && (
          <div>Accessible Tasks: {results.totalAccessibleTasks}</div>
        )}
        {results.totalAccessibleUsers !== undefined && (
          <div>Accessible Users: {results.totalAccessibleUsers}</div>
        )}
      </div>
    </div>
  );
};

export default OrganizationIsolationResults;
