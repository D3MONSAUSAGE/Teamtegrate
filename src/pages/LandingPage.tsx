
import React from 'react';
import { Link } from 'react-router-dom';

const LandingPage = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 to-secondary/10">
      <div className="text-center space-y-6 p-8">
        <h1 className="text-4xl font-bold">Welcome to TeamTegrate</h1>
        <p className="text-lg text-muted-foreground">Manage your tasks, projects, and team collaboration</p>
        <div className="space-x-4">
          <Link to="/login" className="btn btn-primary">Login</Link>
          <Link to="/signup" className="btn btn-secondary">Sign Up</Link>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;
