import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useInventory } from '@/contexts/inventory';
import { useAuth } from '@/contexts/AuthContext';
import { InventoryItemDialog } from '../InventoryItemDialog';
import { InventoryAlertsPanel } from '../InventoryAlertsPanel';
import { InventoryTemplatesPanel } from '../InventoryTemplatesPanel';
import { TeamSelector } from '@/components/team/TeamSelector';
import { Plus, Package, FileText, Users, Search, Filter, Grid, List } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useTeamContext } from '@/hooks/useTeamContext';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export const InventoryManagementTab: React.FC = () => {
  const { items, loading } = useInventory();
  const { hasRoleAccess } = useAuth();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [sortBy, setSortBy] = useState<'name' | 'stock' | 'category'>('name');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const teamContext = useTeamContext();

  // Filter and sort items
  const filteredAndSortedItems = React.useMemo(() => {
    let filtered = items.filter((item) => {
      const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           item.sku.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = !selectedCategory || item.category === selectedCategory;
      const matchesTeam = !teamContext?.selectedTeam || item.team_id === teamContext.selectedTeam.id;
      
      return matchesSearch && matchesCategory && matchesTeam;
    });

    // Sort items
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'stock':
          return a.current_stock - b.current_stock;
        case 'category':
          return a.category.localeCompare(b.category);
        default:
          return 0;
      }
    });

    return filtered;
  }, [items, searchTerm, selectedCategory, sortBy, teamContext?.selectedTeam]);

  // Get unique categories for filter
  const categories = React.useMemo(() => {
    const uniqueCategories = Array.from(new Set(items.map(item => item.category)));
    return uniqueCategories.sort();
  }, [items]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Inventory Management</h2>
          <p className="text-muted-foreground">
            Create templates and manage inventory items for teams
          </p>
        </div>
        
        <div className="flex gap-2">
          {hasRoleAccess('admin') && (
            <TeamSelector 
              showAllOption={true}
              placeholder="Select team"
            />
          )}
          <Button 
            onClick={() => {
              setSelectedItemId(null);
              setIsDialogOpen(true);
            }}
            className="gap-2"
          >
            <Plus className="h-4 w-4" />
            Add Item
          </Button>
        </div>
      </div>

      <Tabs defaultValue="templates" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="templates" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Templates
          </TabsTrigger>
          <TabsTrigger value="items" className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            Items
          </TabsTrigger>
          <TabsTrigger value="assignments" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Team Assignments
          </TabsTrigger>
        </TabsList>

        <TabsContent value="templates" className="mt-6">
          <InventoryTemplatesPanel selectedTeam={teamContext?.selectedTeam?.id || ''} />
        </TabsContent>

        <TabsContent value="items" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">
              {/* Search and Filter Controls */}
              <Card>
                <CardContent className="p-4">
                  <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                        <Input
                          placeholder="Search items by name or SKU..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="pl-10"
                        />
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                        <SelectTrigger className="w-[140px]">
                          <Filter className="h-4 w-4 mr-2" />
                          <SelectValue placeholder="Category" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">All Categories</SelectItem>
                          {categories.map((category) => (
                            <SelectItem key={category} value={category}>
                              {category}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      <Select value={sortBy} onValueChange={(value: 'name' | 'stock' | 'category') => setSortBy(value)}>
                        <SelectTrigger className="w-[120px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="name">Name</SelectItem>
                          <SelectItem value="stock">Stock</SelectItem>
                          <SelectItem value="category">Category</SelectItem>
                        </SelectContent>
                      </Select>

                      <div className="flex border rounded-md">
                        <Button
                          variant={viewMode === 'grid' ? 'default' : 'ghost'}
                          size="sm"
                          onClick={() => setViewMode('grid')}
                          className="px-3"
                        >
                          <Grid className="h-4 w-4" />
                        </Button>
                        <Button
                          variant={viewMode === 'list' ? 'default' : 'ghost'}
                          size="sm"
                          onClick={() => setViewMode('list')}
                          className="px-3"
                        >
                          <List className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Items Display */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Package className="h-5 w-5" />
                      Inventory Items
                      {teamContext?.selectedTeam && (
                        <Badge variant="outline">
                          {teamContext.selectedTeam.name}
                        </Badge>
                      )}
                    </div>
                    <span className="text-sm font-normal text-muted-foreground">
                      {filteredAndSortedItems.length} items
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="text-muted-foreground">Loading items...</div>
                    </div>
                  ) : filteredAndSortedItems.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      {searchTerm || selectedCategory ? 'No items match your filters' : 'No items found'}
                    </div>
                  ) : (
                    <div className={viewMode === 'grid' ? 'grid grid-cols-1 sm:grid-cols-2 gap-4' : 'space-y-2'}>
                      {filteredAndSortedItems.map((item) => (
                        <div
                          key={item.id}
                          className={`${
                            viewMode === 'grid' 
                              ? 'p-4 border rounded-lg hover:bg-muted/50' 
                              : 'flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50'
                          }`}
                        >
                          <div className={viewMode === 'grid' ? 'space-y-2' : 'flex-1'}>
                            <div className="flex items-start justify-between">
                              <div>
                                <h3 className="font-medium">{item.name}</h3>
                                <p className="text-sm text-muted-foreground">SKU: {item.sku}</p>
                              </div>
                              {viewMode === 'grid' && (
                                <Badge variant="outline" className="text-xs">
                                  {item.category}
                                </Badge>
                              )}
                            </div>
                            
                            <div className={`${viewMode === 'grid' ? 'space-y-1' : 'text-sm text-muted-foreground'}`}>
                              <div className="flex items-center justify-between">
                                <span className="text-sm text-muted-foreground">Stock:</span>
                                <span className={`text-sm font-medium ${
                                  item.current_stock <= (item.minimum_threshold || 0) ? 'text-destructive' :
                                  item.current_stock >= (item.maximum_threshold || 100) ? 'text-warning' : 'text-foreground'
                                }`}>
                                  {item.current_stock} {item.unit_of_measure}
                                </span>
                              </div>
                              
                              {viewMode === 'grid' && (
                                <>
                                  <div className="flex items-center justify-between">
                                    <span className="text-sm text-muted-foreground">Range:</span>
                                    <span className="text-sm">{item.minimum_threshold || 0} - {item.maximum_threshold || 100}</span>
                                  </div>
                                  
                                  {(item.unit_cost || 0) > 0 && (
                                    <div className="flex items-center justify-between">
                                      <span className="text-sm text-muted-foreground">Cost:</span>
                                      <span className="text-sm">${(item.unit_cost || 0).toFixed(2)}</span>
                                    </div>
                                  )}
                                  
                                  {item.location && (
                                    <div className="flex items-center justify-between">
                                      <span className="text-sm text-muted-foreground">Location:</span>
                                      <span className="text-sm">{item.location}</span>
                                    </div>
                                  )}
                                </>
                              )}
                            </div>
                            
                            {viewMode === 'list' && (
                              <div className="flex items-center gap-2">
                                <Badge variant="outline" className="text-xs">
                                  {item.category}
                                </Badge>
                                {item.location && (
                                  <span className="text-xs text-muted-foreground">
                                    📍 {item.location}
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                          
                          <div className={viewMode === 'grid' ? 'mt-4' : 'ml-4'}>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedItemId(item.id);
                                setIsDialogOpen(true);
                              }}
                            >
                              Edit
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            <div>
              <InventoryAlertsPanel />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="assignments" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Team Assignments</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                Team assignment management coming soon...
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <InventoryItemDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        itemId={selectedItemId}
      />
    </div>
  );
};