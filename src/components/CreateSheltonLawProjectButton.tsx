
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { createSheltonLawProject } from '@/utils/projectCopy';
import { useNavigate } from 'react-router-dom';
import { FolderPlus, Loader2 } from 'lucide-react';

const CreateSheltonLawProjectButton: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isCreating, setIsCreating] = useState(false);

  const handleCreateProject = async () => {
    if (!user) return;

    setIsCreating(true);
    try {
      const projectId = await createSheltonLawProject(user.id);
      if (projectId) {
        // Navigate to the new project
        navigate(`/dashboard/projects/${projectId}/tasks`);
      }
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Button 
      onClick={handleCreateProject}
      disabled={isCreating || !user}
      className="gap-2"
    >
      {isCreating ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <FolderPlus className="h-4 w-4" />
      )}
      {isCreating ? 'Creating Project...' : 'Create Shelton & Law Project'}
    </Button>
  );
};

export default CreateSheltonLawProjectButton;
