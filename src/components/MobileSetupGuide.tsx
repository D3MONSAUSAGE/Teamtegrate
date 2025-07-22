
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Smartphone, 
  Download, 
  Bell, 
  Settings, 
  CheckCircle, 
  AlertCircle,
  ExternalLink,
  Copy
} from 'lucide-react';
import { Capacitor } from '@capacitor/core';
import { toast } from 'sonner';

const MobileSetupGuide: React.FC = () => {
  const [step, setStep] = useState(1);
  const isNative = Capacitor.isNativePlatform();

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard!');
  };

  const steps = [
    {
      title: 'Export to GitHub',
      description: 'Transfer your project to GitHub for mobile development',
      action: 'Export Project',
      completed: false,
    },
    {
      title: 'Setup Development Environment',
      description: 'Install Android Studio and required tools',
      action: 'Install Tools',
      completed: false,
    },
    {
      title: 'Configure Firebase',
      description: 'Setup push notifications with Firebase',
      action: 'Setup Firebase',
      completed: false,
    },
    {
      title: 'Build Mobile App',
      description: 'Build and test on your device',
      action: 'Build App',
      completed: false,
    },
  ];

  if (isNative) {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-600">
            <CheckCircle className="h-5 w-5" />
            Mobile App Active
          </CardTitle>
          <CardDescription>
            You're running the native mobile app! Push notifications should work automatically.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Badge variant="secondary">
                Platform: {Capacitor.getPlatform()}
              </Badge>
              <Badge variant="secondary">
                Native: {Capacitor.isNativePlatform() ? 'Yes' : 'No'}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              If you're not receiving push notifications, check your device settings 
              and make sure notifications are enabled for this app.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Smartphone className="h-5 w-5" />
            Mobile App Setup Guide
          </CardTitle>
          <CardDescription>
            Follow these steps to build and deploy your app as a native mobile application 
            with push notifications, sounds, and vibration.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6">
            {/* Step 1: Export to GitHub */}
            <Card className={step >= 1 ? 'border-primary' : 'border-muted'}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-sm">
                    1
                  </span>
                  Export to GitHub
                </CardTitle>
                <CardDescription>
                  Export your Lovable project to GitHub so you can build the mobile app locally.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <Button 
                    onClick={() => window.open('https://github.com', '_blank')}
                    className="w-full"
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Go to GitHub
                  </Button>
                  <div className="text-sm text-muted-foreground">
                    1. Click "Export to GitHub" in your Lovable project<br/>
                    2. Create a new repository<br/>
                    3. Clone the repository to your local machine
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Step 2: Setup Development Environment */}
            <Card className={step >= 2 ? 'border-primary' : 'border-muted'}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-sm">
                    2
                  </span>
                  Setup Development Environment
                </CardTitle>
                <CardDescription>
                  Install the required tools for mobile development.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <h4 className="font-medium">Install Required Tools:</h4>
                    <div className="bg-muted p-3 rounded-lg font-mono text-sm space-y-1">
                      <div>npm install</div>
                      <div>npx cap add android</div>
                      <div>npx cap add ios  # For iOS development</div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-medium">Download Android Studio:</h4>
                    <Button 
                      variant="outline" 
                      onClick={() => window.open('https://developer.android.com/studio', '_blank')}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download Android Studio
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Step 3: Configure Firebase */}
            <Card className={step >= 3 ? 'border-primary' : 'border-muted'}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-sm">
                    3
                  </span>
                  Configure Firebase
                </CardTitle>
                <CardDescription>
                  Setup Firebase for push notifications.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <h4 className="font-medium">Create Firebase Project:</h4>
                    <Button 
                      variant="outline" 
                      onClick={() => window.open('https://console.firebase.google.com', '_blank')}
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Go to Firebase Console
                    </Button>
                  </div>
                  
                  <div className="space-y-2">
                    <h4 className="font-medium">Add Android App:</h4>
                    <div className="bg-muted p-3 rounded-lg">
                      <div className="text-sm space-y-1">
                        <div><strong>Package Name:</strong> com.teamtegrate.app</div>
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          onClick={() => copyToClipboard('com.teamtegrate.app')}
                        >
                          <Copy className="h-3 w-3 mr-1" />
                          Copy
                        </Button>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <h4 className="font-medium">Download Config Files:</h4>
                    <div className="text-sm text-muted-foreground">
                      1. Download <code>google-services.json</code><br/>
                      2. Place it in <code>android/app/google-services.json</code><br/>
                      3. Get your FCM Server Key from Project Settings → Cloud Messaging
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Step 4: Build and Test */}
            <Card className={step >= 4 ? 'border-primary' : 'border-muted'}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-sm">
                    4
                  </span>
                  Build and Test
                </CardTitle>
                <CardDescription>
                  Build the app and test on your device.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <h4 className="font-medium">Build Commands:</h4>
                    <div className="bg-muted p-3 rounded-lg font-mono text-sm space-y-1">
                      <div>npm run build</div>
                      <div>npx cap sync</div>
                      <div>npx cap run android</div>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-2 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                    <AlertCircle className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                    <div className="text-sm text-blue-700 dark:text-blue-300">
                      <strong>Important:</strong> Make sure to add the FCM Server Key 
                      to your Supabase project secrets for push notifications to work.
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>

      {/* Features Preview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Mobile App Features
          </CardTitle>
          <CardDescription>
            What you'll get with the native mobile app:
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h4 className="font-medium flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                Push Notifications
              </h4>
              <p className="text-sm text-muted-foreground">
                Receive notifications even when the app is closed
              </p>
            </div>
            
            <div className="space-y-2">
              <h4 className="font-medium flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                Custom Sounds
              </h4>
              <p className="text-sm text-muted-foreground">
                Different notification sounds for different types of messages
              </p>
            </div>
            
            <div className="space-y-2">
              <h4 className="font-medium flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                Vibration Patterns
              </h4>
              <p className="text-sm text-muted-foreground">
                Haptic feedback and custom vibration patterns
              </p>
            </div>
            
            <div className="space-y-2">
              <h4 className="font-medium flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                Badge Counting
              </h4>
              <p className="text-sm text-muted-foreground">
                App icon shows unread notification count
              </p>
            </div>
            
            <div className="space-y-2">
              <h4 className="font-medium flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                Deep Linking
              </h4>
              <p className="text-sm text-muted-foreground">
                Tap notifications to go directly to relevant content
              </p>
            </div>
            
            <div className="space-y-2">
              <h4 className="font-medium flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                Background Processing
              </h4>
              <p className="text-sm text-muted-foreground">
                Notifications work even when app is not running
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default MobileSetupGuide;
