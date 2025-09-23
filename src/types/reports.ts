export type ReportFilter = {
  orgId: string;            // required
  teamIds?: string[];       // optional; undefined => all teams in org
  userId?: string;          // optional; undefined => all users in selected teams
  view: 'daily'|'weekly';
  dateISO: string;          // YYYY-MM-DD (anchor day for daily)
  weekStartISO?: string;    // YYYY-MM-DD (Monday anchor for weekly)
  timezone: string;         // e.g., 'America/Chicago'
};