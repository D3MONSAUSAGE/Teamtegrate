
import { ProjectAccessInfo } from './types';
import { supabase } from '@/integrations/supabase/client';

export const checkProjectAccess = async (project: any, userId: string, projectsUserIsTeamMemberOf: string[]): Promise<ProjectAccessInfo> => {
  console.log(`Checking access for project: ${project.id} - "${project.title}"`);
  console.log(`User ID: ${userId}`);
  console.log(`Manager ID: ${project.manager_id}`);
  console.log(`Team Members Array: ${JSON.stringify(project.team_members)}`);

  // Check 1: Is user the manager?
  const isManager = String(project.manager_id) === String(userId);
  console.log(`Is Manager: ${isManager}`);
  
  // Check 2: Is user in team_members array?
  let isTeamMemberFromArray = false;
  if (Array.isArray(project.team_members)) {
    isTeamMemberFromArray = project.team_members.some(memberId => 
      String(memberId) === String(userId)
    );
  }
  console.log(`Is Team Member (from array): ${isTeamMemberFromArray}`);
  
  // Check 3: Is user in project_team_members table?
  const isTeamMemberFromTable = projectsUserIsTeamMemberOf.includes(project.id);
  console.log(`Is Team Member (from table): ${isTeamMemberFromTable}`);
  
  const hasAccess = isManager || isTeamMemberFromArray || isTeamMemberFromTable;
  console.log(`Final Access Decision: ${hasAccess}`);
  
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

export const filterUserProjects = async (allProjects: any[], userId: string, projectsUserIsTeamMemberOf: string[]): Promise<any[]> => {
  if (!allProjects || allProjects.length === 0) {
    return [];
  }

  const accessibleProjects = [];
  
  for (const project of allProjects) {
    const accessInfo = await checkProjectAccess(project, userId, projectsUserIsTeamMemberOf);
    logProjectAccess(project, userId, accessInfo);
    
    if (accessInfo.hasAccess) {
      accessibleProjects.push(project);
    }
  }
  
  return accessibleProjects;
};
