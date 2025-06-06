
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { createSheltonLawProject } from '@/utils/projectCopy';
import { useNavigate } from 'react-router-dom';
import { FolderPlus, Loader2 } from 'lucide-react';
import { toast } from '@/components/ui/sonner';

const CreateSheltonLawProjectButton: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isCreating, setIsCreating] = useState(false);

  const handleCreateProject = async () => {
    if (!user) {
      toast.error('You must be logged in to create a project');
      return;
    }

    setIsCreating(true);
    console.log('Starting to create Shelton & Law project for user:', user.id);
    
    try {
      const projectId = await createSheltonLawProject(user.id);
      console.log('Project creation result:', projectId);
      
      if (projectId) {
        toast.success('Successfully created Shelton & Law project!');
        // Navigate to the new project after a short delay to ensure it's created
        setTimeout(() => {
          navigate(`/dashboard/projects/${projectId}/tasks`);
        }, 1000);
      } else {
        toast.error('Failed to create project - please try again');
      }
    } catch (error) {
      console.error('Error in handleCreateProject:', error);
      toast.error('Failed to create project - please check the console for details');
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
