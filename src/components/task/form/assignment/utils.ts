
export const getUserInitials = (name: string) => {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
};

export const getUserStatus = (userId: string) => {
  // Mock status for demo - in real app, this would come from your user status system
  const statuses = ['online', 'busy', 'away', 'offline'];
  return statuses[Math.floor(Math.random() * statuses.length)];
};

export const getStatusColor = (status: string) => {
  switch(status) {
    case 'online': return 'bg-green-500';
    case 'busy': return 'bg-red-500';
    case 'away': return 'bg-yellow-500';
    default: return 'bg-gray-400';
  }
};
