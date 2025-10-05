import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tag } from "lucide-react";
import { useExpenseCategories } from '@/hooks/useExpenses';

interface ExpenseCategorySelectorProps {
  value: string;
  onValueChange: (value: string) => void;
  disabled?: boolean;
}

export const ExpenseCategorySelector: React.FC<ExpenseCategorySelectorProps> = ({
  value,
  onValueChange,
  disabled
}) => {
  const { data: categories, isLoading } = useExpenseCategories();

  return (
    <Select value={value} onValueChange={onValueChange} disabled={disabled || isLoading}>
      <SelectTrigger className="w-full border-2">
        <SelectValue placeholder={isLoading ? "Loading categories..." : "Select expense category"} />
      </SelectTrigger>
      <SelectContent>
        {categories?.map((category) => (
          <SelectItem key={category.id} value={category.id}>
            <div className="flex items-center gap-2">
              <Tag className="h-4 w-4" />
              <span>{category.name}</span>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};
