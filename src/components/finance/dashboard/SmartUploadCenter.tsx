import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
  Upload, 
  FileText, 
  CheckCircle, 
  AlertCircle,
  Download,
  Camera,
  FolderOpen,
  Zap,
  Clock,
  Activity
} from 'lucide-react';
import SalesUploadManager from '../SalesUploadManager';
import EnhancedSalesUploadManager from '../enhanced/EnhancedSalesUploadManager';

interface SmartUploadCenterProps {
  onBackToDashboard: () => void;
}

const SmartUploadCenter: React.FC<SmartUploadCenterProps> = ({ onBackToDashboard }) => {
  const [uploadMode, setUploadMode] = useState<'quick' | 'enhanced'>('quick');

  const supportedSystems = [
    { name: 'Brink POS', status: 'active', icon: '🟢' },
    { name: 'Square', status: 'coming-soon', icon: '🟡' },
    { name: 'Toast', status: 'coming-soon', icon: '🟡' },
    { name: 'Lightspeed', status: 'coming-soon', icon: '🟡' },
    { name: 'Clover', status: 'coming-soon', icon: '🟡' }
  ];

  const uploadOptions = [
    {
      id: 'quick',
      title: 'Quick Upload',
      description: 'Fast single file upload with auto-detection',
      icon: Zap,
      recommended: true,
      features: ['Auto POS detection', 'Smart validation', 'Instant preview']
    },
    {
      id: 'enhanced',
      title: 'Batch Upload',
      description: 'Upload multiple files with advanced processing',
      icon: FolderOpen,
      recommended: false,
      features: ['Batch processing', 'OCR support', 'Advanced validation']
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Button 
            variant="ghost" 
            onClick={onBackToDashboard}
            className="mb-4 -ml-4"
          >
            ← Back to Dashboard
          </Button>
          <h1 className="text-2xl font-bold">Smart Upload Center</h1>
          <p className="text-muted-foreground">Upload and process your sales data with intelligent parsing</p>
        </div>
      </div>

      {/* Upload Mode Selection */}
      <Card className="glass-card border-0">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5 text-primary" />
            Choose Upload Method
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {uploadOptions.map((option) => (
              <Button
                key={option.id}
                variant={uploadMode === option.id ? "default" : "outline"}
                onClick={() => setUploadMode(option.id as 'quick' | 'enhanced')}
                className="h-auto p-6 flex flex-col items-start gap-3 relative"
              >
                {option.recommended && (
                  <Badge className="absolute -top-2 -right-2 bg-gradient-to-r from-primary to-accent text-white border-0">
                    Recommended
                  </Badge>
                )}
                <div className="flex items-center gap-3 w-full">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <option.icon className="w-5 h-5 text-primary" />
                  </div>
                  <div className="text-left flex-1">
                    <h4 className="font-semibold">{option.title}</h4>
                    <p className="text-sm text-muted-foreground">{option.description}</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 w-full">
                  {option.features.map((feature) => (
                    <Badge key={feature} variant="secondary" className="text-xs">
                      {feature}
                    </Badge>
                  ))}
                </div>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Supported POS Systems */}
      <Card className="glass-card border-0">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-emerald-600" />
            Supported POS Systems
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {supportedSystems.map((system) => (
              <div key={system.name} className="flex flex-col items-center p-4 rounded-lg border border-border/50 hover:bg-muted/20 transition-colors">
                <span className="text-2xl mb-2">{system.icon}</span>
                <span className="text-sm font-medium text-center">{system.name}</span>
                <Badge 
                  variant={system.status === 'active' ? 'default' : 'secondary'}
                  className="mt-2 text-xs"
                >
                  {system.status === 'active' ? 'Active' : 'Coming Soon'}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Upload Interface */}
      <Card className="glass-card border-0">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-primary" />
            Upload Interface
          </CardTitle>
        </CardHeader>
        <CardContent>
          {uploadMode === 'quick' ? (
            <SalesUploadManager 
              onUpload={async (data, replaceExisting) => {
                // TODO: Implement upload logic or pass through from props
                console.log('Upload triggered:', data, replaceExisting);
              }}
            />
          ) : (
            <EnhancedSalesUploadManager 
              onUpload={async (data, replaceExisting) => {
                // TODO: Implement upload logic or pass through from props
                console.log('Enhanced upload triggered:', data, replaceExisting);
              }}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default SmartUploadCenter;