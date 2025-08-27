import React from 'react';

const TestMeetingsPage = () => {
  console.log('🧪 TestMeetingsPage: Simple test component rendered at', new Date().toISOString());
  
  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-primary">TEST MEETINGS PAGE</h1>
      <p className="text-lg mt-4">This is a simple test component to verify routing works.</p>
      <p className="text-sm text-muted-foreground mt-2">If you see this, the route is working correctly.</p>
      <div className="mt-8 p-4 bg-primary/10 rounded-lg">
        <p className="font-semibold">DEBUG INFO:</p>
        <p>Route: /dashboard/meetings</p>
        <p>Component: TestMeetingsPage</p>
        <p>Time: {new Date().toISOString()}</p>
      </div>
    </div>
  );
};

export default TestMeetingsPage;