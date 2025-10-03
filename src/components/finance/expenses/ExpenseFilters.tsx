import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ExpenseCategory } from '@/types/expenses';

interface ExpenseFiltersProps {
  filters: {
    startDate?: string;
    endDate?: string;
    categoryId?: string;
    status?: string;
  };
  onFiltersChange: (filters: any) => void;
  categories: ExpenseCategory[];
}

export function ExpenseFilters({ filters, onFiltersChange, categories }: ExpenseFiltersProps) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="grid grid-cols-4 gap-4">
          <div className="space-y-2">
            <Label>Start Date</Label>
            <Input
              type="date"
              value={filters.startDate}
              onChange={(e) => onFiltersChange({ ...filters, startDate: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label>End Date</Label>
            <Input
              type="date"
              value={filters.endDate}
              onChange={(e) => onFiltersChange({ ...filters, endDate: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label>Category</Label>
            <Select
              value={filters.categoryId}
              onValueChange={(value) => onFiltersChange({ ...filters, categoryId: value === 'all' ? undefined : value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="All categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Status</Label>
            <Select
              value={filters.status}
              onValueChange={(value) => onFiltersChange({ ...filters, status: value === 'all' ? undefined : value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="All statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
