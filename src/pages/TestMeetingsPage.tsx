import React from 'react';

const TestMeetingsPage = () => {
  console.log('TestMeetingsPage: Component rendered successfully');
  
  return (
    <div style={{ padding: '20px', background: 'lightblue', border: '2px solid red' }}>
      <h1>TEST MEETINGS PAGE</h1>
      <p>If you can see this, routing is working!</p>
      <p>Current time: {new Date().toLocaleTimeString()}</p>
    </div>
  );
};

export default TestMeetingsPage;