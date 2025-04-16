
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { useTask } from '@/contexts/TaskContext';
import ProjectCard from '@/components/ProjectCard';
import { Plus, Filter, Search } from 'lucide-react';
import CreateProjectDialog from '@/components/CreateProjectDialog';
import { Project } from '@/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import TaskCard from '@/components/TaskCard';
import CreateTaskDialog from '@/components/CreateTaskDialog';
import AssignTaskDialog from '@/components/AssignTaskDialog';
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Task } from '@/types';

const ProjectsPage = () => {
  const { projects, tasks, addTask } = useTask();
  const [isCreateProjectOpen, setIsCreateProjectOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | undefined>(undefined);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [isViewTasksOpen, setIsViewTasksOpen] = useState(false);
  const [isCreateTaskOpen, setIsCreateTaskOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | undefined>(undefined);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isAssignTaskOpen, setIsAssignTaskOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('date');
  
  const handleEditProject = (project: Project) => {
    setEditingProject(project);
    setIsCreateProjectOpen(true);
  };
  
  const handleViewTasks = (project: Project) => {
    setSelectedProject(project);
    setIsViewTasksOpen(true);
  };
  
  const handleCreateTask = () => {
    setEditingTask(undefined);
    setIsCreateTaskOpen(true);
  };
  
  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setIsCreateTaskOpen(true);
  };
  
  const handleAssignTask = (task: Task) => {
    setSelectedTask(task);
    setIsAssignTaskOpen(true);
  };
  
  // Filter projects based on search query
  const filteredProjects = projects.filter((project) => {
    return (
      project.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.description.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });
  
  // Sort projects based on the selected option
  const sortedProjects = [...filteredProjects].sort((a, b) => {
    switch (sortBy) {
      case 'date':
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      case 'start':
        return new Date(a.startDate).getTime() - new Date(b.startDate).getTime();
      case 'end':
        return new Date(a.endDate).getTime() - new Date(b.endDate).getTime();
      case 'title':
        return a.title.localeCompare(b.title);
      default:
        return 0;
    }
  });
  
  return (
    <div className="p-6">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8">
        <h1 className="text-2xl font-bold">Projects</h1>
        <div className="flex flex-col md:flex-row items-center w-full md:w-auto gap-2">
          <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search projects..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <Filter className="h-4 w-4" /> Sort by
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuRadioGroup value={sortBy} onValueChange={setSortBy}>
                <DropdownMenuRadioItem value="date">Creation Date</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="start">Start Date</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="end">End Date</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="title">Title</DropdownMenuRadioItem>
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>
          
          <Button onClick={() => {
            setEditingProject(undefined);
            setIsCreateProjectOpen(true);
          }}>
            <Plus className="h-4 w-4 mr-2" /> New Project
          </Button>
        </div>
      </div>
      
      {sortedProjects.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sortedProjects.map((project) => (
            <ProjectCard 
              key={project.id} 
              project={project} 
              onEdit={handleEditProject} 
              onViewTasks={() => handleViewTasks(project)}
            />
          ))}
        </div>
      ) : (
        <div className="bg-white p-6 rounded-lg border text-center">
          <p className="text-gray-500">
            {searchQuery ? 'No projects found matching your search' : 'No projects created yet'}
          </p>
          <Button 
            variant="outline" 
            size="sm" 
            className="mt-2" 
            onClick={() => {
              setEditingProject(undefined);
              setIsCreateProjectOpen(true);
            }}
          >
            <Plus className="h-4 w-4 mr-2" /> Create Project
          </Button>
        </div>
      )}
      
      <CreateProjectDialog 
        open={isCreateProjectOpen} 
        onOpenChange={setIsCreateProjectOpen}
        editingProject={editingProject}
      />
      
      {/* Project Tasks Dialog */}
      <Dialog open={isViewTasksOpen} onOpenChange={setIsViewTasksOpen}>
        <DialogContent className="sm:max-w-[800px]">
          <DialogHeader>
            <DialogTitle>{selectedProject?.title} - Tasks</DialogTitle>
          </DialogHeader>
          
          <div className="flex justify-end mb-4">
            <Button onClick={handleCreateTask}>
              <Plus className="h-4 w-4 mr-2" /> Add Task
            </Button>
          </div>
          
          {selectedProject && selectedProject.tasks.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[60vh] overflow-y-auto p-1">
              {selectedProject.tasks.map((task) => (
                <TaskCard 
                  key={task.id} 
                  task={task} 
                  onEdit={handleEditTask} 
                />
              ))}
            </div>
          ) : (
            <div className="bg-gray-50 p-6 rounded-lg text-center">
              <p className="text-gray-500">No tasks added to this project yet</p>
              <Button 
                variant="outline" 
                size="sm" 
                className="mt-2" 
                onClick={handleCreateTask}
              >
                <Plus className="h-4 w-4 mr-2" /> Add Task
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
      
      <CreateTaskDialog 
        open={isCreateTaskOpen} 
        onOpenChange={setIsCreateTaskOpen}
        editingTask={editingTask}
      />
      
      {selectedTask && (
        <AssignTaskDialog 
          open={isAssignTaskOpen} 
          onOpenChange={setIsAssignTaskOpen}
          task={selectedTask}
        />
      )}
    </div>
  );
};

export default ProjectsPage;
