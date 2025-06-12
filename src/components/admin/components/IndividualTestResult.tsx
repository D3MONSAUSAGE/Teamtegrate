
import React from 'react';
import { getStatusBadge } from './TestStatusHelpers';
import { TestResult } from '../types';

interface IndividualTestResultProps {
  testType: string;
  result: TestResult;
}

const IndividualTestResult: React.FC<IndividualTestResultProps> = ({ testType, result }) => {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="font-medium capitalize">{testType} Test</span>
        {getStatusBadge(result)}
      </div>
      {result.error && (
        <div className="text-sm text-red-600 pl-4">
          Error: {result.error.message || JSON.stringify(result.error)}
        </div>
      )}
      <div className="text-sm text-gray-600 pl-4">
        {Object.entries(result).map(([key, value]) => {
          if (key === 'success' || key === 'error') return null;
          return (
            <div key={key}>
              {key}: {typeof value === 'boolean' ? (value ? 'Yes' : 'No') : String(value)}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default IndividualTestResult;
