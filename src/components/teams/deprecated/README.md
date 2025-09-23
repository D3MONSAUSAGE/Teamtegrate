# Deprecated Team Components

This directory contains deprecated team selector components that have been replaced by the unified team management system.

## Migration Guide

### Old Components → New Components

- `TeamSelector` → `StandardTeamSelector` (from `@/components/teams`)
- `TeamScheduleSelector` → `InlineTeamSelector` (from `@/components/teams`)
- `EnhancedTeamSelector` → `CardTeamSelector` or `StandardTeamSelector` (from `@/components/teams`)
- `ui/team-select` → Use appropriate unified component variant

### New Unified System

All team selectors now use:
1. **Unified Data Source**: `useTeamAccess` hook (wraps `useTeamQueries`)
2. **Consistent Props**: `selectedTeamId: string | null`, `onTeamChange: (teamId: string | null) => void`
3. **Role-Based Filtering**: Automatic filtering based on user role
4. **Standardized Behavior**: Consistent auto-selection logic and "All Teams" handling

### Available Components

- `UnifiedTeamSelector` - Base component with variants
- `StandardTeamSelector` - Default selector
- `SimpleTeamSelector` - Simple dropdown variant  
- `InlineTeamSelector` - Compact inline variant
- `CardTeamSelector` - Card-based variant
- `EnhancedTeamSelector` - Feature-rich variant

### Props Interface

```typescript
interface UnifiedTeamSelectorProps {
  selectedTeamId: string | null;
  onTeamChange: (teamId: string | null) => void;
  showAllOption?: boolean;
  disabled?: boolean;
  placeholder?: string;
  variant?: 'card' | 'inline' | 'simple';
  className?: string;
  title?: string;
}
```

### Auto-Selection Logic

- **Superadmins/Admins**: Default to "All Teams" (`null`)
- **Managers with single team**: Auto-select their team
- **Managers with multiple teams**: Show selector, no auto-selection

All deprecated components are now thin wrappers around the unified system for backward compatibility.