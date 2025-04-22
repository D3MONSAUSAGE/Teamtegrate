
import { format } from 'date-fns';

export const formatDuration = (ms: number): string => {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const pad = (n: number) => (n < 10 ? '0' + n : n.toString());
  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
};

export const downloadCSV = (entries: any[], weekStart: Date, weekEnd: Date) => {
  if (!entries || !entries.length) return;
  const cols = ["Day", "Clock In", "Clock Out", "Duration (mins)", "Notes"];
  let csv = cols.join(",") + "\n";
  entries.forEach((entry) => {
    const day = format(new Date(entry.clock_in), "yyyy-MM-dd (EEEE)");
    const clockIn = format(new Date(entry.clock_in), "HH:mm");
    const clockOut = entry.clock_out ? format(new Date(entry.clock_out), "HH:mm") : "";
    const duration = entry.duration_minutes ?? "";
    const notes = entry.notes ? `"${(entry.notes + "").replace(/"/g, '""')}"` : "";
    csv += [day, clockIn, clockOut, duration, notes].join(",") + "\n";
  });
  const fileName = `Weekly_Time_Report_${format(weekStart, "yyyyMMdd")}_${format(weekEnd, "yyyyMMdd")}.csv`;
  const blob = new Blob([csv], { type: 'text/csv' });
  const link = document.createElement('a');
  link.href = window.URL.createObjectURL(blob);
  link.download = fileName;
  link.click();
};
