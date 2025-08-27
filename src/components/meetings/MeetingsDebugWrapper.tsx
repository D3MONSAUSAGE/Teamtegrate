import React from 'react';

const MeetingsDebugWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  console.log('MeetingsDebugWrapper: Component rendered');
  
  React.useEffect(() => {
    console.log('MeetingsDebugWrapper: Component mounted');
    return () => {
      console.log('MeetingsDebugWrapper: Component unmounted');
    };
  }, []);

  return (
    <div data-testid="meetings-debug-wrapper">
      {children}
    </div>
  );
};

export default MeetingsDebugWrapper;