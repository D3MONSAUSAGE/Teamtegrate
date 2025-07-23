
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Smartphone, Download } from 'lucide-react';

const AndroidAppBanner: React.FC = () => {
  const handleDownload = () => {
    // Open the Google Play Store link
    window.open('https://play.google.com/store/apps/details?id=com.taskmanager.app', '_blank');
  };

  return (
    <Card className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 border-green-200 dark:border-green-800 shadow-lg">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-green-100 dark:bg-green-800 rounded-lg">
              <Smartphone className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                Download our Android App
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Get the full experience on your mobile device
              </p>
            </div>
          </div>
          <Button 
            onClick={handleDownload}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            <Download className="h-4 w-4 mr-2" />
            Download
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default AndroidAppBanner;
