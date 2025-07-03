
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Search, X, Plus, Users, AlertCircle, Loader2, RefreshCw } from "lucide-react";

interface SimpleMultiSelectProps {
  onChange: (value: string[]) => void;
  placeholder?: string;
  options?: { value: string; label: string; }[];
  isLoading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  label?: string;
}

const SimpleMultiSelect: React.FC<SimpleMultiSelectProps> = ({ 
  onChange, 
  placeholder = "Select team members...",
  options = [],
  isLoading = false,
  error = null,
  onRetry,
  label = "Team Members"
}) => {
  const [selectedValues, setSelectedValues] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  const handleSelect = (value: string) => {
    if (!value) return;
    
    const newValues = selectedValues.includes(value)
      ? selectedValues.filter(v => v !== value)
      : [...selectedValues, value];
    
    setSelectedValues(newValues);
    onChange(newValues);
  };

  const handleRemove = (value: string) => {
    const newValues = selectedValues.filter(v => v !== value);
    setSelectedValues(newValues);
    onChange(newValues);
  };

  // Ensure options is always a valid array with proper validation
  const safeOptions = Array.isArray(options) ? options.filter(option => 
    option && 
    typeof option === 'object' && 
    option.value && 
    option.label &&
    typeof option.value === 'string' &&
    typeof option.label === 'string' &&
    option.value.trim() !== ''
  ) : [];

  // Filter options based on search query
  const filteredOptions = safeOptions.filter(option => {
    const searchLower = searchQuery.toLowerCase();
    return option.label.toLowerCase().includes(searchLower) && 
           !selectedValues.includes(option.value);
  });

  const selectedOptions = safeOptions.filter(option => 
    selectedValues.includes(option.value)
  );

  // Show error state with retry option
  if (error) {
    return (
      <div className="grid gap-2">
        <Label>{label}</Label>
        <div className="flex items-center gap-2 p-3 border border-destructive/50 rounded-md bg-destructive/10">
          <AlertCircle className="h-4 w-4 text-destructive flex-shrink-0" />
          <div className="flex-1">
            <span className="text-sm text-destructive">Failed to load team members</span>
          </div>
          {onRetry && (
            <Button
              variant="outline"
              size="sm"
              onClick={onRetry}
              className="flex items-center gap-1"
            >
              <RefreshCw className="h-3 w-3" />
              Retry
            </Button>
          )}
        </div>
      </div>
    );
  }

  // Show loading state
  if (isLoading) {
    return (
      <div className="grid gap-2">
        <Label>{label}</Label>
        <div className="flex items-center gap-2 p-3 border rounded-md">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className="text-sm text-muted-foreground">Loading team members...</span>
        </div>
      </div>
    );
  }

  // Show empty state if no options available
  if (safeOptions.length === 0) {
    return (
      <div className="grid gap-2">
        <Label>{label}</Label>
        <div className="p-3 border rounded-md bg-muted/10">
          <p className="text-sm text-muted-foreground">No team members available to select.</p>
        </div>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          {label}
        </CardTitle>
        <CardDescription>
          Select team members for this project
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search team members..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Currently Selected */}
        {selectedOptions.length > 0 && (
          <div>
            <h4 className="text-sm font-medium mb-2">Selected Members ({selectedOptions.length})</h4>
            <div className="flex flex-wrap gap-2">
              {selectedOptions.map((option) => (
                <Badge
                  key={option.value}
                  variant="default"
                  className="flex items-center gap-2 pr-1"
                >
                  <Avatar className="h-4 w-4">
                    <AvatarFallback className="text-xs">
                      {option.label.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-xs">{option.label}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-4 w-4 p-0 hover:bg-destructive hover:text-destructive-foreground"
                    onClick={() => handleRemove(option.value)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Available Members */}
        {filteredOptions.length > 0 && (
          <div>
            <h4 className="text-sm font-medium mb-2">Available Members</h4>
            <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto">
              {filteredOptions.map((option) => (
                <div
                  key={option.value}
                  className="flex items-center justify-between p-2 rounded-lg border hover:bg-muted transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <Avatar className="h-6 w-6">
                      <AvatarFallback className="text-xs">
                        {option.label.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm">{option.label}</span>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => handleSelect(option.value)}
                    className="h-7 w-7 p-0"
                  >
                    <Plus className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {filteredOptions.length === 0 && searchQuery && (
          <div className="text-center py-4 text-muted-foreground">
            <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No members found matching "{searchQuery}"</p>
          </div>
        )}

        {selectedValues.length === 0 && (
          <div className="text-center py-4 text-muted-foreground">
            <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No members selected yet</p>
            <p className="text-xs">Search and click + to select members</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SimpleMultiSelect;
