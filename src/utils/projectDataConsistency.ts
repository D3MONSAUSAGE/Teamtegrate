
import { supabase } from '@/integrations/supabase/client';

export interface ProjectConsistencyReport {
  projectId: string;
  title: string;
  consistent: boolean;
  tableMemberIds: string[];
  arrayMemberIds: string[];
  missingInTable: string[];
  missingInArray: string[];
}

/**
 * Check data consistency between project_team_members table and projects.team_members array
 */
export const checkProjectTeamMemberConsistency = async (
  projectId: string
): Promise<ProjectConsistencyReport> => {
  try {
    console.log('Checking team member consistency for project:', projectId);

    // Get team members from both storage locations
    const [tableMembersResult, projectResult] = await Promise.all([
      supabase
        .from('project_team_members')
        .select('user_id')
        .eq('project_id', projectId),
      supabase
        .from('projects')
        .select('title, team_members')
        .eq('id', projectId)
        .single()
    ]);

    const { data: tableMembers, error: tableError } = tableMembersResult;
    const { data: projectData, error: projectError } = projectResult;

    if (tableError || projectError) {
      console.error('Error checking consistency:', { tableError, projectError });
      throw new Error('Failed to fetch project data for consistency check');
    }

    const tableMemberIds = (tableMembers || []).map(m => m.user_id.toString()).sort();
    const arrayMemberIds = (projectData?.team_members || []).map(id => id.toString()).sort();

    const missingInTable = arrayMemberIds.filter(id => !tableMemberIds.includes(id));
    const missingInArray = tableMemberIds.filter(id => !arrayMemberIds.includes(id));

    const consistent = missingInTable.length === 0 && missingInArray.length === 0;

    const report: ProjectConsistencyReport = {
      projectId,
      title: projectData?.title || 'Unknown Project',
      consistent,
      tableMemberIds,
      arrayMemberIds,
      missingInTable,
      missingInArray
    };

    console.log('Consistency check result:', report);

    return report;
  } catch (error) {
    console.error('Error in checkProjectTeamMemberConsistency:', error);
    throw error;
  }
};

/**
 * Fix data inconsistencies by syncing project_team_members table with projects.team_members array
 */
export const fixProjectTeamMemberConsistency = async (
  projectId: string
): Promise<boolean> => {
  try {
    console.log('Fixing team member consistency for project:', projectId);

    const report = await checkProjectTeamMemberConsistency(projectId);

    if (report.consistent) {
      console.log('Project team members are already consistent');
      return true;
    }

    console.log('Fixing inconsistencies:', {
      missingInTable: report.missingInTable,
      missingInArray: report.missingInArray
    });

    const operations = [];

    // Add missing members to table
    if (report.missingInTable.length > 0) {
      const membersToAdd = report.missingInTable.map(userId => ({
        project_id: projectId,
        user_id: userId
      }));

      operations.push(
        supabase
          .from('project_team_members')
          .insert(membersToAdd)
      );
    }

    // Remove extra members from table
    if (report.missingInArray.length > 0) {
      for (const userId of report.missingInArray) {
        operations.push(
          supabase
            .from('project_team_members')
            .delete()
            .eq('project_id', projectId)
            .eq('user_id', userId)
        );
      }
    }

    // Execute all operations
    const results = await Promise.all(operations);

    // Check for errors
    for (const result of results) {
      if (result.error) {
        console.error('Error fixing consistency:', result.error);
        throw result.error;
      }
    }

    console.log('Successfully fixed team member consistency for project:', projectId);
    return true;
  } catch (error) {
    console.error('Error in fixProjectTeamMemberConsistency:', error);
    return false;
  }
};

/**
 * Check and optionally fix consistency for all projects in an organization
 */
export const checkAllProjectsConsistency = async (
  organizationId: string,
  autoFix: boolean = false
): Promise<ProjectConsistencyReport[]> => {
  try {
    console.log('Checking consistency for all projects in organization:', organizationId);

    // Get all projects in the organization
    const { data: projects, error } = await supabase
      .from('projects')
      .select('id, title')
      .eq('organization_id', organizationId);

    if (error) {
      console.error('Error fetching projects:', error);
      throw error;
    }

    const reports: ProjectConsistencyReport[] = [];

    for (const project of projects || []) {
      try {
        const report = await checkProjectTeamMemberConsistency(project.id);
        reports.push(report);

        if (!report.consistent && autoFix) {
          console.log('Auto-fixing inconsistency for project:', project.id);
          await fixProjectTeamMemberConsistency(project.id);
        }
      } catch (error) {
        console.error('Error checking project:', project.id, error);
      }
    }

    const inconsistentCount = reports.filter(r => !r.consistent).length;
    console.log(`Consistency check complete. ${inconsistentCount} of ${reports.length} projects have inconsistencies.`);

    return reports;
  } catch (error) {
    console.error('Error in checkAllProjectsConsistency:', error);
    throw error;
  }
};
