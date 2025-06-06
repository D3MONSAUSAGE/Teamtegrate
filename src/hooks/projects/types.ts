
export interface ProjectAccessInfo {
  isManager: boolean;
  isTeamMemberFromArray: boolean;
  isTeamMemberFromTable: boolean;
  hasAccess: boolean;
}

export interface ProjectFetchOptions {
  user: any;
  tasks: any[];
}
