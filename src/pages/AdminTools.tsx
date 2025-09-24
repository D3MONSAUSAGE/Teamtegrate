import React from 'react';
import UserEmailUpdate from '@/components/admin/UserEmailUpdate';

const AdminTools = () => {
  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Admin Tools</h1>
      <div className="grid gap-6">
        <UserEmailUpdate />
      </div>
    </div>
  );
};

export default AdminTools;