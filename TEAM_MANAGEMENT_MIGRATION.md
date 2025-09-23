# Team Management System Migration Guide

## Overview
The team management system has been standardized to use a unified approach across the application. All team-related components now use consistent data sources, prop interfaces, and behavior patterns.

## Key Changes

### 1. Unified Data Source
- **Before**: Multiple hooks (`useTeams`, `useTeamsByOrganization`, `useTeamQueries`)  
- **After**: Single `useTeamAccess` hook (wraps `useTeamQueries`)

### 2. Consistent Props Interface
- **Before**: Mixed prop patterns (`selectedTeam`, `selectedTeamId`, different change handlers)
- **After**: Standardized interface:
  ```typescript
  selectedTeamId: string | null;
  onTeamChange: (teamId: string | null) => void;
  ```

### 3. Role-Based Filtering
- **Superadmins/Admins**: See all teams, default to "All Teams" (`null`)
- **Managers**: See only teams they manage, auto-select if single team
- **Other roles**: See teams they're members of

### 4. "All Teams" Standardization
- **Before**: Mixed handling (`'all'`, `''`, `undefined`)
- **After**: Always use `null` for "All Teams"

## Migration Map

### Components
| Old Component | New Component | From Package |
|---------------|---------------|--------------|
| `TeamSelector` | `StandardTeamSelector` | `@/components/teams` |
| `TeamScheduleSelector` | `InlineTeamSelector` | `@/components/teams` |
| `EnhancedTeamSelector` | `CardTeamSelector` | `@/components/teams` |
| `ui/team-select` | `StandardTeamSelector` | `@/components/teams` |
| `reports/TeamSelector` | `CardTeamSelector` | `@/components/teams` |

### Hooks
| Old Hook | New Hook | From Package |
|----------|----------|--------------|
| `useTeams()` | `useTeamAccess()` | `@/hooks/useTeamAccess` |
| `useTeamsByOrganization()` | `useTeamAccess()` | `@/hooks/useTeamAccess` |
| Keep: `useTeamQueries()` | `useTeamQueries()` | `@/hooks/organization/team/useTeamQueries` |

## Component Variants

### Available Variants
```typescript
import { 
  StandardTeamSelector,    // Default selector
  SimpleTeamSelector,      // Simple dropdown only  
  InlineTeamSelector,      // Compact inline version
  CardTeamSelector,        // Card-based layout
  EnhancedTeamSelector     // Feature-rich version
} from '@/components/teams';
```

### Usage Examples

#### Basic Usage
```typescript
<StandardTeamSelector
  selectedTeamId={selectedTeamId}
  onTeamChange={setSelectedTeamId}
/>
```

#### Card Layout (for dashboards)
```typescript
<CardTeamSelector
  selectedTeamId={selectedTeamId}
  onTeamChange={setSelectedTeamId}
  title="Team Analytics"
/>
```

#### Inline (for filters/headers)
```typescript
<InlineTeamSelector
  selectedTeamId={selectedTeamId}
  onTeamChange={setSelectedTeamId}
/>
```

## Auto-Selection Logic

### Before
- Inconsistent auto-selection
- Some components always auto-selected first team
- Mixed handling for different roles

### After  
- **Managers with 1 team**: Auto-select their team
- **Managers with multiple teams**: No auto-selection, show selector
- **Admins/Superadmins**: Default to "All Teams" (`null`)

## Filter State Management

### Session Storage Versioning
- Added version control to clear corrupted filter states
- Superadmins/admins default to "All Teams" view
- Proper null handling for teamIds in filter objects

### useReportFilters Updates
```typescript
// Before
teamIds: selectedTeamId ? [selectedTeamId] : undefined

// After  
teamIds: selectedTeamId ? [selectedTeamId] : undefined
// Where selectedTeamId is null for "All Teams"
```

## Backward Compatibility

All old components are maintained as thin wrappers around the new unified system:
- Existing imports continue to work
- Props are mapped to new interface
- Deprecation warnings added for future migration

## Benefits

1. **Consistency**: All team selectors behave the same way
2. **Maintainability**: Single source of truth for team logic  
3. **Performance**: Unified caching and data fetching
4. **Type Safety**: Consistent TypeScript interfaces
5. **Role-Based Security**: Proper filtering based on user permissions
6. **Future-Proof**: Easy to add new features across all selectors

## Testing

- All existing functionality preserved
- Role-based filtering working correctly
- Auto-selection logic verified for different user types
- "All Teams" handling standardized across application

## Next Steps

1. **Phase 1**: ✅ Core system implemented
2. **Phase 2**: Monitor for issues, gather feedback  
3. **Phase 3**: Remove deprecated components (future release)
4. **Phase 4**: Add enhanced features to unified system