
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { CheckCircle, Circle, ExternalLink, Smartphone, Bell, Download } from 'lucide-react';

const MobileSetupGuide = () => {
  const steps = [
    {
      id: 1,
      title: 'Export to GitHub',
      description: 'Click "Export to GitHub" button and clone the repository to your local machine',
      completed: false,
      icon: <Download className="h-5 w-5" />,
    },
    {
      id: 2,
      title: 'Install Dependencies',
      description: 'Run "npm install" in your project directory',
      completed: false,
      icon: <Circle className="h-5 w-5" />,
    },
    {
      id: 3,
      title: 'Create Firebase Project',
      description: 'Set up Firebase project and configure FCM for push notifications',
      completed: false,
      icon: <Bell className="h-5 w-5" />,
      link: 'https://console.firebase.google.com/',
    },
    {
      id: 4,
      title: 'Download google-services.json',
      description: 'Add Android app to Firebase and download google-services.json to android/app/',
      completed: false,
      icon: <Smartphone className="h-5 w-5" />,
    },
    {
      id: 5,
      title: 'Add FCM Server Key',
      description: 'Get FCM Server Key and add it to Supabase project secrets as "FCM_SERVER_KEY"',
      completed: false,
      icon: <CheckCircle className="h-5 w-5" />,
    },
    {
      id: 6,
      title: 'Build Mobile App',
      description: 'Run the build commands to create your mobile app',
      completed: false,
      icon: <Circle className="h-5 w-5" />,
    },
  ];

  const commands = [
    'npx cap add android',
    'npm run build',
    'npx cap sync',
    'npx cap run android'
  ];

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">Mobile App Setup Guide</h1>
        <p className="text-muted-foreground">
          Follow these steps to build and run your TeamTegrate mobile app with push notifications
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Smartphone className="h-6 w-6" />
            Setup Steps
          </CardTitle>
          <CardDescription>
            Complete these steps in order to enable mobile functionality
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {steps.map((step, index) => (
            <div key={step.id} className="flex items-start gap-4 p-4 rounded-lg border">
              <div className="flex-shrink-0 mt-1">
                {step.completed ? (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                ) : (
                  step.icon
                )}
              </div>
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-3">
                  <Badge variant="outline">Step {step.id}</Badge>
                  <h3 className="font-semibold">{step.title}</h3>
                  {step.link && (
                    <Button variant="ghost" size="sm" asChild>
                      <a href={step.link} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    </Button>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">{step.description}</p>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Terminal Commands</CardTitle>
          <CardDescription>
            Run these commands in your project directory after completing the setup steps
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {commands.map((command, index) => (
            <div key={index} className="flex items-center gap-3">
              <Badge variant="secondary">{index + 1}</Badge>
              <code className="flex-1 bg-muted px-3 py-2 rounded text-sm font-mono">
                {command}
              </code>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Firebase Configuration</CardTitle>
          <CardDescription>
            Detailed steps for setting up Firebase Cloud Messaging
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <h4 className="font-semibold">1. Create Firebase Project</h4>
            <p className="text-sm text-muted-foreground">
              Go to Firebase Console and create a new project or use an existing one.
            </p>
          </div>
          
          <Separator />
          
          <div className="space-y-2">
            <h4 className="font-semibold">2. Add Android App</h4>
            <p className="text-sm text-muted-foreground">
              Add an Android app to your Firebase project with package name: <code>com.teamtegrate.app</code>
            </p>
          </div>
          
          <Separator />
          
          <div className="space-y-2">
            <h4 className="font-semibold">3. Download Configuration</h4>
            <p className="text-sm text-muted-foreground">
              Download the <code>google-services.json</code> file and place it in the <code>android/app/</code> directory.
            </p>
          </div>
          
          <Separator />
          
          <div className="space-y-2">
            <h4 className="font-semibold">4. Get Server Key</h4>
            <p className="text-sm text-muted-foreground">
              In Firebase Console, go to Project Settings → Cloud Messaging → Server key. Copy this key and add it to your Supabase project secrets as <code>FCM_SERVER_KEY</code>.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card className="border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950">
        <CardHeader>
          <CardTitle className="text-amber-800 dark:text-amber-200">Important Notes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-amber-700 dark:text-amber-300">
          <p>• Make sure you have Android Studio installed for Android development</p>
          <p>• The app will run in hot-reload mode connected to this Lovable project</p>
          <p>• Push notifications require the FCM_SERVER_KEY to be configured in Supabase</p>
          <p>• Test notifications work even without FCM setup for local testing</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default MobileSetupGuide;
