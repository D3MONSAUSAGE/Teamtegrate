import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useInventory } from '@/contexts/inventory';
import { useAuth } from '@/contexts/AuthContext';
import { InventoryItemDialog } from '../InventoryItemDialog';
import { InventoryAlertsPanel } from '../InventoryAlertsPanel';
import { InventoryTemplatesPanel } from '../InventoryTemplatesPanel';
import { TeamAssignmentsPanel } from '../team-assignments/TeamAssignmentsPanel';
import { TeamSelector } from '@/components/team/TeamSelector';
import { Plus, Package, FileText, Users, Search, Filter, Grid, List } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useTeamContext } from '@/hooks/useTeamContext';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export const InventoryManagementTab: React.FC = () => {
  const { hasRoleAccess } = useAuth();
  const { items, loading } = useInventory();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'name' | 'stock' | 'category'>('name');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const teamContext = useTeamContext();

  // Filter and sort items
  const filteredAndSortedItems = React.useMemo(() => {
    let filtered = items.filter((item) => {
      const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           (item.sku || '').toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = !selectedCategory || selectedCategory === 'all' || item.category?.name === selectedCategory;
      
      return matchesSearch && matchesCategory;
    });

    // Sort items
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'stock':
          return a.current_stock - b.current_stock;
        case 'category':
          return (a.category?.name || '').localeCompare(b.category?.name || '');
        default:
          return 0;
      }
    });

    return filtered;
  }, [items, searchTerm, selectedCategory, sortBy]);

  // Get unique categories from items
  const categories = React.useMemo(() => {
    const uniqueCategories = Array.from(new Set(
      items.map(item => item.category?.name).filter(Boolean)
    ));
    return uniqueCategories;
  }, [items]);

  const handleAddItem = () => {
    setSelectedItemId(null);
    setIsDialogOpen(true);
  };

  const handleEditItem = (itemId: string) => {
    setSelectedItemId(itemId);
    setIsDialogOpen(true);
  };

  if (!hasRoleAccess('manager')) {
    return (
      <div className="text-center py-8">
        <Package className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
        <p className="text-muted-foreground">
          You don't have permission to manage inventory items.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="items" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="items" className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            Items
          </TabsTrigger>
          <TabsTrigger value="templates" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Templates
          </TabsTrigger>
          <TabsTrigger value="alerts" className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            Alerts
          </TabsTrigger>
          <TabsTrigger value="assignments" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Team Assignments
          </TabsTrigger>
        </TabsList>

        <TabsContent value="items" className="mt-6">
          <div className="space-y-4">
            <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
              <div className="flex-1 w-full">
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search items..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-8"
                  />
                </div>
              </div>
              
              <div className="flex items-center gap-2 w-full md:w-auto">
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="w-full md:w-[160px]">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {categories.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={sortBy} onValueChange={(value: 'name' | 'stock' | 'category') => setSortBy(value)}>
                  <SelectTrigger className="w-full md:w-[120px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="name">Name</SelectItem>
                    <SelectItem value="stock">Stock</SelectItem>
                    <SelectItem value="category">Category</SelectItem>
                  </SelectContent>
                </Select>

                <div className="flex items-center border rounded-md">
                  <Button
                    variant={viewMode === 'grid' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('grid')}
                  >
                    <Grid className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={viewMode === 'list' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('list')}
                  >
                    <List className="h-4 w-4" />
                  </Button>
                </div>

                <Button onClick={handleAddItem}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Item
                </Button>
              </div>
            </div>

            <TeamSelector />

            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : filteredAndSortedItems.length === 0 ? (
              <div className="text-center py-12">
                <Package className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No items found</h3>
                <p className="text-muted-foreground mb-4">
                  {searchTerm || selectedCategory !== 'all' 
                    ? 'Try adjusting your search or filters.'
                    : 'Get started by adding your first inventory item.'
                  }
                </p>
                {(!searchTerm && selectedCategory === 'all') && (
                  <Button onClick={handleAddItem}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add First Item
                  </Button>
                )}
              </div>
            ) : (
              <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4' : 'space-y-4'}>
                {viewMode === 'grid' ? (
                  filteredAndSortedItems.map((item) => (
                    <Card key={item.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => handleEditItem(item.id)}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Package className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium text-sm">{item.name}</span>
                          </div>
                          <Badge variant={item.current_stock < (item.minimum_threshold || 0) ? 'destructive' : 'secondary'}>
                            {item.current_stock}
                          </Badge>
                        </div>
                        <div className="space-y-1 text-sm text-muted-foreground">
                          <div>SKU: {item.sku || 'N/A'}</div>
                          <div>Category: {item.category?.name || 'Uncategorized'}</div>
                          <div>Min: {item.minimum_threshold || 0} • Max: {item.maximum_threshold || 0}</div>
                        </div>
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium">{item.name}</div>
                            <div className="text-sm text-muted-foreground">
                              SKU: {item.sku || 'N/A'} • Category: {item.category?.name || 'Uncategorized'}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-medium">{item.current_stock} {item.base_unit?.abbreviation || 'units'}</div>
                            <div className="text-sm text-muted-foreground">
                              Min: {item.minimum_threshold || 0}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <Card>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>SKU</TableHead>
                          <TableHead>Category</TableHead>
                          <TableHead>Stock</TableHead>
                          <TableHead>Unit</TableHead>
                          <TableHead>Min</TableHead>
                          <TableHead>Max</TableHead>
                          <TableHead>Cost</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredAndSortedItems.map((item) => (
                          <TableRow 
                            key={item.id} 
                            className="cursor-pointer hover:bg-muted/50" 
                            onClick={() => handleEditItem(item.id)}
                          >
                            <TableCell className="font-medium">{item.name}</TableCell>
                            <TableCell>{item.sku || 'N/A'}</TableCell>
                            <TableCell>{item.category?.name || 'Uncategorized'}</TableCell>
                            <TableCell>
                              <Badge variant={item.current_stock < (item.minimum_threshold || 0) ? 'destructive' : 'secondary'}>
                                {item.current_stock}
                              </Badge>
                            </TableCell>
                            <TableCell>{item.base_unit?.abbreviation || 'units'}</TableCell>
                            <TableCell>{item.minimum_threshold || 0}</TableCell>
                            <TableCell>{item.maximum_threshold || 0}</TableCell>
                            <TableCell>${(item.unit_cost || 0).toFixed(2)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </Card>
                )}
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="templates" className="mt-6">
          <InventoryTemplatesPanel selectedTeam={teamContext?.selectedTeam?.id || null} />
        </TabsContent>

        <TabsContent value="alerts" className="mt-6">
          <InventoryAlertsPanel />
        </TabsContent>

        <TabsContent value="assignments" className="mt-6">
          <TeamAssignmentsPanel />
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