
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { format, subDays } from 'date-fns';
import { Calendar as CalendarIcon, Download } from 'lucide-react';
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
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <div className="w-full sm:w-auto">
          <Select defaultValue="week" onValueChange={setReportPeriod}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Select period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="day">Daily Reports</SelectItem>
              <SelectItem value="week">Weekly Reports</SelectItem>
              <SelectItem value="month">Monthly Reports</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <Button variant="outline" size="sm" className="w-full sm:w-auto">
          <CalendarIcon className="h-4 w-4 mr-2" /> Date Range
        </Button>
        
        <Button variant="outline" size="sm" className="w-full sm:w-auto">
          <Download className="h-4 w-4 mr-2" /> Export Reports
        </Button>
      </div>
      
      {/* Reports Table */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Reports</CardTitle>
          <CardDescription>
            {reportPeriod === 'day' ? 'Daily' : reportPeriod === 'week' ? 'Weekly' : 'Monthly'} checklist reports
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
              {mockReports.map(report => (
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
                    <Button variant="ghost" size="sm">
                      <Download className="h-4 w-4" />
                      <span className="sr-only">Download</span>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default ChecklistReports;
