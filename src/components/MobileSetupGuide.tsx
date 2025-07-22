
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Circle, Smartphone, Bell, Zap } from 'lucide-react';

const MobileSetupGuide = () => {
  const steps = [
    {
      title: "Export to GitHub",
      description: "Export your project to GitHub using the export button",
      completed: false,
      icon: <Circle className="h-5 w-5" />
    },
    {
      title: "Git Clone & Setup", 
      description: "Clone the repository and run npm install",
      completed: false,
      icon: <Circle className="h-5 w-5" />
    },
    {
      title: "Add Mobile Platform",
      description: "Run: npx cap add android (or ios)",
      completed: false,
      icon: <Circle className="h-5 w-5" />
    },
    {
      title: "Build & Sync",
      description: "Run: npm run build && npx cap sync",
      completed: false,
      icon: <Circle className="h-5 w-5" />
    },
    {
      title: "Run on Device",
      description: "Run: npx cap run android (or ios)",
      completed: false,
      icon: <Circle className="h-5 w-5" />
    }
  ];

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="text-center space-y-2">
        <Smartphone className="h-12 w-12 mx-auto text-primary" />
        <h1 className="text-3xl font-bold">Mobile App Setup</h1>
        <p className="text-muted-foreground">
          Get your TeamTegrate app running on mobile devices with native capabilities
        </p>
      </div>

      {/* Notification System Status */}
      <Card className="border-green-200 bg-green-50/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-700">
            <Zap className="h-5 w-5" />
            Notification System Ready
          </CardTitle>
          <CardDescription>
            Your app is configured with Supabase Realtime notifications - no external services needed!
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex items-center gap-2 text-sm text-green-600">
            <CheckCircle className="h-4 w-4" />
            Real-time updates via Supabase
          </div>
          <div className="flex items-center gap-2 text-sm text-green-600">
            <CheckCircle className="h-4 w-4" />
            Local notifications with sounds & haptics
          </div>
          <div className="flex items-center gap-2 text-sm text-green-600">
            <CheckCircle className="h-4 w-4" />
            Background sync for missed notifications
          </div>
        </CardContent>
      </Card>

      {/* Setup Steps */}
      <Card>
        <CardHeader>
          <CardTitle>Setup Steps</CardTitle>
          <CardDescription>
            Follow these steps to get your mobile app running
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {steps.map((step, index) => (
            <div key={index} className="flex items-start gap-3 p-3 rounded-lg border">
              <div className="flex-shrink-0 mt-0.5">
                {step.completed ? (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                ) : (
                  <Circle className="h-5 w-5 text-muted-foreground" />
                )}
              </div>
              <div className="flex-1">
                <h3 className="font-medium">{step.title}</h3>
                <p className="text-sm text-muted-foreground mt-1">{step.description}</p>
              </div>
              <Badge variant={step.completed ? "default" : "secondary"}>
                Step {index + 1}
              </Badge>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Features Card */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Native Features
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div>✅ Push notifications (Supabase Realtime)</div>
            <div>✅ Haptic feedback</div>
            <div>✅ Local notifications</div>
            <div>✅ Background app refresh</div>
            <div>✅ Native sound alerts</div>
            <div>✅ Deep linking</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Requirements</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div>📱 Android Studio (for Android)</div>
            <div>🍎 Xcode (for iOS)</div>
            <div>⚡ Node.js 16+</div>
            <div>📦 Capacitor CLI</div>
            <div>🔄 No Firebase setup needed!</div>
          </CardContent>
        </Card>
      </div>

      {/* Help Section */}
      <Card className="border-blue-200 bg-blue-50/50">
        <CardHeader>
          <CardTitle className="text-blue-700">Need Help?</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-blue-600">
          <p>
            Your notification system is now powered entirely by Supabase! This means:
          </p>
          <ul className="mt-2 space-y-1 list-disc list-inside">
            <li>No external service configuration needed</li>
            <li>Real-time updates work automatically</li>
            <li>Notifications are delivered instantly when the app is open</li>
            <li>Local notifications handle backgrounded app states</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
};

export default MobileSetupGuide;
