
import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { format, subDays, subWeeks, startOfWeek, endOfWeek } from 'date-fns';
import { Calendar as CalendarIcon, Download, FileText, Filter } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from '@/components/ui/badge';
import { ChecklistReport } from '@/types/checklist';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import {
  ToggleGroup,
  ToggleGroupItem
} from '@/components/ui/toggle-group';
import { toast } from '@/components/ui/sonner';

// Mock data
const mockReports: ChecklistReport[] = [
  {
    id: '1',
    title: 'Weekly Store Audit Report',
    period: 'week',
    startDate: subDays(new Date(), 7),
    endDate: new Date(),
    checklists: [], // Would contain actual checklist references
    createdAt: new Date(),
    createdBy: 'user-1',
    completionRate: 92,
    failureCount: 3,
    branches: ['Main Street Branch', 'Downtown Branch']
  },
  {
    id: '2',
    title: 'Monthly Safety Inspection Report',
    period: 'month',
    startDate: subDays(new Date(), 30),
    endDate: new Date(),
    checklists: [], // Would contain actual checklist references
    createdAt: subDays(new Date(), 2),
    createdBy: 'user-2',
    completionRate: 87,
    failureCount: 8,
    branches: ['All Branches']
  },
  {
    id: '3',
    title: 'Weekly Kitchen Checklist',
    period: 'week',
    startDate: subDays(new Date(), 7),
    endDate: new Date(),
    checklists: [],
    createdAt: new Date(),
    createdBy: 'user-1',
    completionRate: 100,
    failureCount: 0,
    branches: ['Main Street Branch']
  },
  {
    id: '4',
    title: 'Weekly Customer Service Checklist',
    period: 'week',
    startDate: subDays(new Date(), 7),
    endDate: new Date(),
    checklists: [],
    createdAt: new Date(),
    createdBy: 'user-3',
    completionRate: 95,
    failureCount: 2,
    branches: ['Downtown Branch']
  },
];

// Summary statistics
const summaryStats = {
  completionRate: 89,
  totalChecklists: 42,
  failedItems: 11,
  branchPerformance: [
    { branch: 'Main Street Branch', completionRate: 94 },
    { branch: 'Downtown Branch', completionRate: 89 },
    { branch: 'Mall Location', completionRate: 82 },
  ]
};

const ChecklistReports: React.FC = () => {
  const [reportPeriod, setReportPeriod] = useState('week');
  const [date, setDate] = useState<Date>(new Date());
  const [selectedBranch, setSelectedBranch] = useState<string>("all");
  
  const weekStart = startOfWeek(date, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(date, { weekStartsOn: 1 });
  
  const availableBranches = useMemo(() => {
    const branches = new Set<string>();
    mockReports.forEach(report => {
      report.branches.forEach(branch => {
        branches.add(branch);
      });
    });
    return Array.from(branches);
  }, []);

  const filteredReports = useMemo(() => {
    return mockReports.filter(report => {
      // Filter by period
      if (reportPeriod !== 'all' && report.period !== reportPeriod) {
        return false;
      }
      
      // Filter by date range (simplified for demo)
      const reportStart = report.startDate;
      const reportEnd = report.endDate;
      
      // Filter by branch
      if (selectedBranch !== 'all' && !report.branches.includes(selectedBranch)) {
        return false;
      }
      
      return true;
    });
  }, [reportPeriod, date, selectedBranch]);
  
  const generateReport = () => {
    toast.success("Generating report for the selected period");
    // In a real application, this would trigger a process to generate a new report
  };
  
  const handleDownload = (reportId: string) => {
    // In a real application, this would download the actual report
    toast.success(`Downloading report ${reportId}`);
  };
  
  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Overall Completion</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summaryStats.completionRate}%</div>
            <p className="text-xs text-muted-foreground">Average completion rate</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Checklists</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summaryStats.totalChecklists}</div>
            <p className="text-xs text-muted-foreground">Past 30 days</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Failed Items</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summaryStats.failedItems}</div>
            <p className="text-xs text-muted-foreground">Issues requiring attention</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Top Performing</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summaryStats.branchPerformance[0].branch}</div>
            <p className="text-xs text-muted-foreground">
              {summaryStats.branchPerformance[0].completionRate}% completion rate
            </p>
          </CardContent>
        </Card>
      </div>
      
      {/* Report Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Report Filters</CardTitle>
          <CardDescription>Filter and generate reports based on different criteria</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium mb-1 block">Report Period</label>
              <Select defaultValue={reportPeriod} onValueChange={setReportPeriod}>
                <SelectTrigger>
                  <SelectValue placeholder="Select period" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Reports</SelectItem>
                  <SelectItem value="day">Daily Reports</SelectItem>
                  <SelectItem value="week">Weekly Reports</SelectItem>
                  <SelectItem value="month">Monthly Reports</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="text-sm font-medium mb-1 block">Date Range</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    id="date"
                    variant="outline"
                    className="w-full justify-start text-left font-normal"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {format(weekStart, "MMM d")} - {format(weekEnd, "MMM d, yyyy")}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={(date) => date && setDate(date)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            
            <div>
              <label className="text-sm font-medium mb-1 block">Branch</label>
              <Select value={selectedBranch} onValueChange={setSelectedBranch}>
                <SelectTrigger>
                  <SelectValue placeholder="Select branch" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Branches</SelectItem>
                  {availableBranches.map(branch => (
                    <SelectItem key={branch} value={branch}>{branch}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 sm:items-end">
            <div className="flex-1">
              <label className="text-sm font-medium mb-1 block">Report Types</label>
              <ToggleGroup type="multiple" className="justify-start">
                <ToggleGroupItem value="kitchen">Kitchen</ToggleGroupItem>
                <ToggleGroupItem value="customer-service">Customer Service</ToggleGroupItem>
                <ToggleGroupItem value="safety">Safety</ToggleGroupItem>
              </ToggleGroup>
            </div>
            <Button onClick={generateReport}>
              <FileText className="h-4 w-4 mr-2" /> Generate Report
            </Button>
          </div>
        </CardContent>
      </Card>
      
      {/* Reports Table */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Reports</CardTitle>
          <CardDescription>
            {reportPeriod === 'day' ? 'Daily' : reportPeriod === 'week' ? 'Weekly' : reportPeriod === 'month' ? 'Monthly' : 'All'} checklist reports
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Report Title</TableHead>
                <TableHead>Period</TableHead>
                <TableHead>Completion</TableHead>
                <TableHead>Branches</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredReports.length > 0 ? filteredReports.map(report => (
                <TableRow key={report.id}>
                  <TableCell className="font-medium">{report.title}</TableCell>
                  <TableCell>
                    {format(report.startDate, 'MMM d')} - {format(report.endDate, 'MMM d, yyyy')}
                  </TableCell>
                  <TableCell>
                    <span 
                      className={
                        report.completionRate > 90 ? 'text-green-600 font-medium' : 
                        report.completionRate > 75 ? 'text-amber-600 font-medium' : 
                        'text-red-600 font-medium'
                      }
                    >
                      {report.completionRate}%
                    </span>
                  </TableCell>
                  <TableCell>
                    {report.branches.map(branch => (
                      <Badge key={branch} variant="outline" className="mr-1">
                        {branch}
                      </Badge>
                    ))}
                  </TableCell>
                  <TableCell>{format(report.createdAt, 'MMM d, yyyy')}</TableCell>
                  <TableCell className="text-right">
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => handleDownload(report.id)}
                    >
                      <Download className="h-4 w-4" />
                      <span className="sr-only">Download</span>
                    </Button>
                  </TableCell>
                </TableRow>
              )) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-6 text-muted-foreground">
                    No reports found matching the selected filters
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default ChecklistReports;
