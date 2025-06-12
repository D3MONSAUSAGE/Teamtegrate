
import React from 'react';
import { getStatusBadge } from './TestStatusHelpers';
import { TestResult } from '../types';

interface BasicRLSTestResultsProps {
  results: TestResult;
}

const BasicRLSTestResults: React.FC<BasicRLSTestResultsProps> = ({ results }) => {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="font-medium">Basic RLS Tests</span>
        {getStatusBadge(results)}
      </div>
      <div className="text-sm text-gray-600 pl-4">
        {results.tests && (
          <div>
            <div>Tasks: {results.tests.tasks ? 'Passed' : 'Failed'}</div>
            <div>Projects: {results.tests.projects ? 'Passed' : 'Failed'}</div>
            <div>Users: {results.tests.users ? 'Passed' : 'Failed'}</div>
            <div>Chat Rooms: {results.tests.chatRooms ? 'Passed' : 'Failed'}</div>
            <div>Notifications: {results.tests.notifications ? 'Passed' : 'Failed'}</div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BasicRLSTestResults;
