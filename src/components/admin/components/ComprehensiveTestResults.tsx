
import React from 'react';
import { getStatusIcon, getStatusBadge } from './TestStatusHelpers';

interface ComprehensiveTestResultsProps {
  results: any;
}

const ComprehensiveTestResults: React.FC<ComprehensiveTestResultsProps> = ({ results }) => {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="font-medium">Comprehensive Test Suite</span>
        {getStatusBadge(results)}
      </div>
      <div className="text-sm text-gray-600 pl-4">
        <div>Overall Success: {results.overallSuccess ? 'Yes' : 'No'}</div>
        {results.projects && (
          <div className="flex items-center gap-2">
            {getStatusIcon(results.projects)}
            Projects: {results.projects.success ? 'Passed' : 'Failed'}
          </div>
        )}
        {results.tasks && (
          <div className="flex items-center gap-2">
            {getStatusIcon(results.tasks)}
            Tasks: {results.tasks.success ? 'Passed' : 'Failed'}
          </div>
        )}
        {results.users && (
          <div className="flex items-center gap-2">
            {getStatusIcon(results.users)}
            Users: {results.users.success ? 'Passed' : 'Failed'}
          </div>
        )}
        {results.isolation && (
          <div className="flex items-center gap-2">
            {getStatusIcon(results.isolation)}
            Isolation: {results.isolation.success ? 'Passed' : 'Failed'}
          </div>
        )}
      </div>
    </div>
  );
};

export default ComprehensiveTestResults;
