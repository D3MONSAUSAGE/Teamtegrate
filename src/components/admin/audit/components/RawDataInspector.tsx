
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Code } from 'lucide-react';

interface RawDataInspectorProps {
  rawData: any;
}

const RawDataInspector: React.FC<RawDataInspectorProps> = ({ rawData }) => {
  if (Object.keys(rawData).length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm flex items-center gap-2">
          <Code className="h-4 w-4" />
          Raw Data Inspector
        </CardTitle>
      </CardHeader>
      <CardContent>
        <details>
          <summary className="cursor-pointer text-sm font-medium">View Raw Data</summary>
          <pre className="mt-2 p-2 bg-gray-50 rounded overflow-auto max-h-96 text-xs">
            {JSON.stringify(rawData, null, 2)}
          </pre>
        </details>
      </CardContent>
    </Card>
  );
};

export default RawDataInspector;
