
import { ProjectAccessInfo } from './types';

export const checkProjectAccess = (project: any, userId: string, projectsUserIsTeamMemberOf: string[]): ProjectAccessInfo => {
  const isManager = project.manager_id === userId;
  
  // Check team membership from project.team_members array with string comparison
  let isTeamMemberFromArray = false;
  if (Array.isArray(project.team_members)) {
    isTeamMemberFromArray = project.team_members.some(memberId => 
      String(memberId) === String(userId)
    );
  }
  
  // Check team membership from project_team_members table
  const isTeamMemberFromTable = projectsUserIsTeamMemberOf.includes(project.id);
  
  const hasAccess = isManager || isTeamMemberFromArray || isTeamMemberFromTable;
  
  return {
    isManager,
    isTeamMemberFromArray,
    isTeamMemberFromTable,
    hasAccess
  };
};

export const logProjectAccess = (project: any, userId: string, accessInfo: ProjectAccessInfo): void => {
  console.log(`DB Project: ${project.id}, "${project.title}"`);
  console.log(`  Manager: ${project.manager_id}`);
  console.log(`  Team Members Array: ${JSON.stringify(project.team_members)}`);
  console.log(`  User ID: ${userId} (type: ${typeof userId})`);
  console.log(`  Is Manager: ${accessInfo.isManager}`);
  console.log(`  Is Team Member (from array): ${accessInfo.isTeamMemberFromArray}`);
  console.log(`  Is Team Member (from table): ${accessInfo.isTeamMemberFromTable}`);
  console.log(`  Final Access Decision: ${accessInfo.hasAccess}`);
  
  if (accessInfo.hasAccess) {
    console.log(`✓ User has access to project "${project.title}" - ${accessInfo.isManager ? 'Manager' : 'Team Member'}`);
  } else {
    console.log(`✗ User does NOT have access to project "${project.title}"`);
  }
};

export const filterUserProjects = (allProjects: any[], userId: string, projectsUserIsTeamMemberOf: string[]): any[] => {
  return allProjects?.filter(project => {
    const accessInfo = checkProjectAccess(project, userId, projectsUserIsTeamMemberOf);
    logProjectAccess(project, userId, accessInfo);
    return accessInfo.hasAccess;
  }) || [];
};
