
// Generate consistent colors from project names/IDs
export const generateProjectColor = (projectId: string | undefined, projectName?: string): string => {
  if (!projectId && !projectName) return 'bg-gray-100 text-gray-800 border-gray-200';
  
  const input = projectId || projectName || '';
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    hash = input.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  const colors = [
    'bg-blue-100 text-blue-800 border-blue-200',
    'bg-green-100 text-green-800 border-green-200', 
    'bg-purple-100 text-purple-800 border-purple-200',
    'bg-pink-100 text-pink-800 border-pink-200',
    'bg-indigo-100 text-indigo-800 border-indigo-200',
    'bg-teal-100 text-teal-800 border-teal-200',
    'bg-orange-100 text-orange-800 border-orange-200',
    'bg-cyan-100 text-cyan-800 border-cyan-200',
  ];
  
  return colors[Math.abs(hash) % colors.length];
};

export const generateProjectBadgeColor = (projectId: string | undefined, projectName?: string): string => {
  if (!projectId && !projectName) return 'bg-gray-500';
  
  const input = projectId || projectName || '';
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    hash = input.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  const colors = [
    'bg-blue-500',
    'bg-green-500', 
    'bg-purple-500',
    'bg-pink-500',
    'bg-indigo-500',
    'bg-teal-500',
    'bg-orange-500',
    'bg-cyan-500',
  ];
  
  return colors[Math.abs(hash) % colors.length];
};
