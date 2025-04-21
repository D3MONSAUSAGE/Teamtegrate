
import React from 'react';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';

interface ChecklistBranchSelectorProps {
  branches: string[];
  allBranches: string[];
  selectedBranchDropdown: string;
  newBranch: string;
  onAddBranch: () => void;
  onAddBranchFromDropdown: (branch: string) => void;
  onRemoveBranch: (branch: string) => void;
  onChangeNewBranch: (branch: string) => void;
  onChangeDropdown: (branch: string) => void;
}

const ChecklistBranchSelector: React.FC<ChecklistBranchSelectorProps> = ({
  branches,
  allBranches,
  selectedBranchDropdown,
  newBranch,
  onAddBranch,
  onAddBranchFromDropdown,
  onRemoveBranch,
  onChangeNewBranch,
  onChangeDropdown,
}) => (
  <div className="space-y-2">
    <Label>Branch Selection</Label>
    <p className="text-sm text-muted-foreground">
      Add branches where this checklist can be used
    </p>

    <div className="flex flex-wrap gap-2 mb-4">
      {branches.map(branch => (
        <div
          key={branch}
          className="flex items-center bg-green-100 text-green-700 py-1 px-2 rounded-md text-sm font-medium border border-green-300"
        >
          <span>{branch}</span>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 ml-1"
            onClick={() => onRemoveBranch(branch)}
          >
            <span className="sr-only">Remove</span>
            ×
          </Button>
        </div>
      ))}
    </div>

    <div className="flex gap-2 flex-wrap w-full">
      {allBranches.length > 0 && (
        <div className="w-44">
          <Select
            value={selectedBranchDropdown}
            onValueChange={onAddBranchFromDropdown}
          >
            <SelectTrigger className="w-full" aria-label="Select existing branch">
              <SelectValue placeholder="Select existing..." />
            </SelectTrigger>
            <SelectContent>
              {allBranches.map((b) => (
                <SelectItem key={b} value={b}>{b}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
      <span className="hidden sm:inline-block w-2" />
      <Input
        placeholder="Add new branch"
        value={newBranch}
        onChange={e => onChangeNewBranch(e.target.value)}
        className="max-w-xs"
      />
      <Button
        type="button"
        variant="outline"
        onClick={onAddBranch}
        disabled={!newBranch.trim()}
      >
        +
      </Button>
    </div>
  </div>
);

export default ChecklistBranchSelector;
