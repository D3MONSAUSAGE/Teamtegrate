
import React, { useState, useEffect } from 'react';
import { 
  Table, 
  TableHeader, 
  TableBody, 
  TableRow, 
  TableHead, 
  TableCell 
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { format, addDays, startOfWeek } from 'date-fns';
import { Checklist, ChecklistItem, ChecklistSection } from '@/types/checklist';
import { useChecklists } from '@/contexts/checklists';
import { Download, Save } from 'lucide-react';
import { toast } from '@/components/ui/sonner';

interface ChecklistExecutionViewProps {
  checklist: Checklist;
  onUpdate: () => void;
}

const ChecklistExecutionView: React.FC<ChecklistExecutionViewProps> = ({ checklist, onUpdate }) => {
  const { canExecuteChecklist } = useChecklists();
  const [sections, setSections] = useState<ChecklistSection[]>(checklist.sections);
  const [weekStart, setWeekStart] = useState<Date>(() => startOfWeek(new Date(), { weekStartsOn: 1 }));
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  
  // Split items between Core (C) and Required (R)
  const itemTypes = ['C', 'R'];

  // Update the completion status
  const handleCheckItem = (sectionIndex: number, itemIndex: number, status: 'completed' | 'pending') => {
    const newSections = [...sections];
    newSections[sectionIndex].items[itemIndex].status = status === 'completed' ? 'completed' : 'pending';
    setSections(newSections);
  };

  // Calculate the completion percentage for each day
  const calculateDailyPercentage = (day: Date, type: 'C' | 'R') => {
    let total = 0;
    let completed = 0;
    
    sections.forEach(section => {
      section.items.forEach(item => {
        // In a real implementation, we would check if this item is required for this specific day
        // and if it's a core (C) or required (R) item
        const isRelevantType = type === 'C'; // Simplified logic - assume 'C' for demo
        
        if (isRelevantType) {
          total++;
          if (item.status === 'completed') {
            completed++;
          }
        }
      });
    });
    
    return total === 0 ? 100 : Math.round((completed / total) * 100);
  };

  // Save changes to the backend
  const saveChanges = async () => {
    try {
      // In a real implementation, we would make an API call to update the checklist
      toast.success("Checklist progress saved successfully");
      onUpdate();
    } catch (error) {
      console.error("Error saving checklist progress:", error);
      toast.error("Failed to save checklist progress");
    }
  };

  // Generate and download a report in CSV format
  const downloadReport = () => {
    // Create CSV content
    let csvContent = "data:text/csv;charset=utf-8,";
    
    // Add header
    csvContent += `Checklist: ${checklist.title}\n`;
    csvContent += `Branch: ${checklist.branch || 'All'}\n`;
    csvContent += `Week of: ${format(weekStart, 'MMM d, yyyy')}\n\n`;
    
    // Days header
    csvContent += "Task,";
    weekDays.forEach(day => {
      csvContent += `${format(day, 'E (MM/dd)')},`;
    });
    csvContent += "Complete,Incomplete\n";
    
    // Add sections and items
    sections.forEach(section => {
      csvContent += `${section.title},,,,,,,,\n`;
      
      section.items.forEach(item => {
        csvContent += `${item.text},`;
        
        // Add status for each day (simplified - using same status for all days)
        weekDays.forEach(() => {
          csvContent += `${item.status === 'completed' ? 'TRUE' : 'FALSE'},`;
        });
        
        // Complete/incomplete count
        csvContent += `${item.status === 'completed' ? '1' : '0'},`;
        csvContent += `${item.status === 'completed' ? '0' : '1'}\n`;
      });
    });
    
    // Add percentages
    csvContent += `\nPercentages,,,,,,,,\n`;
    csvContent += `By Day,`;
    
    weekDays.forEach(day => {
      csvContent += `${calculateDailyPercentage(day, 'C')}%,`;
    });
    csvContent += `${calculateDailyPercentage(weekStart, 'C')}%\n`;
    
    // Create download link and trigger download
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${checklist.title}_Report_${format(weekStart, 'yyyy-MM-dd')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success("Report downloaded successfully");
  };

  const isExecutable = canExecuteChecklist(checklist);
  
  if (!isExecutable) {
    return (
      <div className="p-4 text-center bg-yellow-50 border border-yellow-200 rounded-md">
        <p className="text-yellow-700">This checklist cannot be executed at this time due to its execution window constraints.</p>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">{checklist.title}</h2>
        <div className="space-x-2">
          <Button variant="outline" onClick={saveChanges}>
            <Save className="h-4 w-4 mr-2" /> Save Progress
          </Button>
          <Button onClick={downloadReport}>
            <Download className="h-4 w-4 mr-2" /> Export Report
          </Button>
        </div>
      </div>
      
      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[250px]">Task</TableHead>
              {weekDays.map(day => (
                <TableHead key={day.toString()} className="text-center" colSpan={2}>
                  <div>{format(day, 'E')}</div>
                  <div className="text-xs font-normal">{format(day, 'MM/dd')}</div>
                </TableHead>
              ))}
              <TableHead className="text-center">Complete</TableHead>
              <TableHead className="text-center">Incomplete</TableHead>
            </TableRow>
            <TableRow>
              <TableHead>Status</TableHead>
              {weekDays.map(day => (
                <React.Fragment key={`header-${day.toString()}`}>
                  <TableHead className="text-center">C</TableHead>
                  <TableHead className="text-center">R</TableHead>
                </React.Fragment>
              ))}
              <TableHead className="text-center">TRUE</TableHead>
              <TableHead className="text-center">FALSE</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sections.map((section, sectionIndex) => (
              <React.Fragment key={section.id}>
                {/* Section Header */}
                <TableRow className="bg-muted/50">
                  <TableCell colSpan={16} className="font-medium">
                    {section.title}
                  </TableCell>
                </TableRow>
                
                {/* Section Items */}
                {section.items.map((item, itemIndex) => (
                  <TableRow key={item.id}>
                    <TableCell>{item.text}</TableCell>
                    
                    {/* Checkboxes for each day of the week */}
                    {weekDays.map(day => (
                      <React.Fragment key={`${item.id}-${day.toString()}`}>
                        {itemTypes.map((type) => (
                          <TableCell key={`${item.id}-${day.toString()}-${type}`} className="text-center p-2">
                            <Checkbox 
                              checked={item.status === 'completed'} 
                              onCheckedChange={(checked) => {
                                handleCheckItem(
                                  sectionIndex, 
                                  itemIndex, 
                                  checked ? 'completed' : 'pending'
                                );
                              }}
                            />
                          </TableCell>
                        ))}
                      </React.Fragment>
                    ))}
                    
                    {/* Complete/Incomplete columns */}
                    <TableCell className="text-center">
                      {item.status === 'completed' ? '1' : '0'}
                    </TableCell>
                    <TableCell className="text-center">
                      {item.status === 'completed' ? '0' : '1'}
                    </TableCell>
                  </TableRow>
                ))}
              </React.Fragment>
            ))}
            
            {/* Percentages Section */}
            <TableRow className="bg-muted/50">
              <TableCell colSpan={16} className="font-medium">
                Percentages
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell>Status</TableCell>
              {weekDays.map(day => (
                <React.Fragment key={`percent-${day.toString()}`}>
                  <TableCell className="text-center">C</TableCell>
                  <TableCell className="text-center">R</TableCell>
                </React.Fragment>
              ))}
              <TableCell className="text-center" colSpan={2}>
                Average
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell>By Day</TableCell>
              {weekDays.map(day => (
                <React.Fragment key={`percent-day-${day.toString()}`}>
                  <TableCell className="text-center">
                    {calculateDailyPercentage(day, 'C')}%
                  </TableCell>
                  <TableCell className="text-center">
                    {calculateDailyPercentage(day, 'R')}%
                  </TableCell>
                </React.Fragment>
              ))}
              <TableCell className="text-center" colSpan={2}>
                {calculateDailyPercentage(weekStart, 'C')}%
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default ChecklistExecutionView;
