
export interface TestResult {
  success: boolean;
  error?: any;
  [key: string]: any;
}

export interface TestResults {
  comprehensive?: any;
  projects?: TestResult;
  tasks?: TestResult;
  users?: TestResult;
  comments?: TestResult;
  chatRooms?: TestResult;
  chatMessages?: TestResult;
  notifications?: TestResult;
  documents?: TestResult;
  events?: TestResult;
  timeEntries?: TestResult;
  isolation?: TestResult;
  basicRLS?: TestResult;
  orgIsolation?: TestResult;
  error?: TestResult;
}
