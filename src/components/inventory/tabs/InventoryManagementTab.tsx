import React, { useState, useMemo } from 'react';
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
import { InventoryCategoryDialog } from '../InventoryCategoryDialog';
import { InventoryUnitDialog } from '../InventoryUnitDialog';
import { ItemCard } from '../ItemCard';
import { ItemTableRow } from '../ItemTableRow';
import { LoadingState, LoadingSpinner } from '@/components/ui/loading-state';
import { Plus, Package, FileText, Users, Search, Filter, Grid, List, FolderOpen, Ruler, Edit2, Trash2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';
import { DEFAULT_CATEGORIES, DEFAULT_UNITS, shouldSeedDefaults } from '@/utils/inventorySeeds';

export const InventoryManagementTab: React.FC = () => {
  const { hasRoleAccess } = useAuth();
  const { 
    items, 
    loading, 
    itemsLoading,
    categories, 
    categoriesLoading,
    units, 
    unitsLoading,
    deleteCategory, 
    deleteUnit, 
    createCategory, 
    createUnit 
  } = useInventory();
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'name' | 'stock' | 'category'>('name');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  
  // Category dialog states
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  
  // Unit dialog states
  const [isUnitDialogOpen, setIsUnitDialogOpen] = useState(false);
  const [selectedUnitId, setSelectedUnitId] = useState<string | null>(null);

  // Check if we should seed default data
  React.useEffect(() => {
    if (shouldSeedDefaults(categories, units) && hasRoleAccess('manager')) {
      // Only suggest seeding if user can manage inventory
      console.log('No categories or units found. Consider seeding default data.');
    }
  }, [categories, units, hasRoleAccess]);

  const handleSeedDefaults = async () => {
    try {
      if (categories.length === 0) {
        for (const category of DEFAULT_CATEGORIES) {
          await createCategory({
            ...category,
            is_active: true,
          });
        }
      }
      
      if (units.length === 0) {
        for (const unit of DEFAULT_UNITS) {
          await createUnit({
            ...unit,
            is_active: true,
          });
        }
      }
      
      toast.success('Default categories and units created successfully!');
    } catch (error) {
      console.error('Error seeding defaults:', error);
      toast.error('Failed to create default data');
    }
  };

  // Filter and sort items with memoization for performance
  const filteredAndSortedItems = useMemo(() => {
    let filtered = items.filter((item) => {
      const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           (item.sku || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                           (item.description || '').toLowerCase().includes(searchTerm.toLowerCase());
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

  // Get unique categories from items for filtering
  const itemCategories = useMemo(() => {
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

  const handleAddCategory = () => {
    setSelectedCategoryId(null);
    setIsCategoryDialogOpen(true);
  };

  const handleEditCategory = (categoryId: string) => {
    setSelectedCategoryId(categoryId);
    setIsCategoryDialogOpen(true);
  };

  const handleDeleteCategory = async (categoryId: string) => {
    if (confirm('Are you sure you want to delete this category?')) {
      try {
        await deleteCategory(categoryId);
        toast.success('Category deleted successfully');
      } catch (error) {
        toast.error('Failed to delete category');
      }
    }
  };

  const handleAddUnit = () => {
    setSelectedUnitId(null);
    setIsUnitDialogOpen(true);
  };

  const handleEditUnit = (unitId: string) => {
    setSelectedUnitId(unitId);
    setIsUnitDialogOpen(true);
  };

  const handleDeleteUnit = async (unitId: string) => {
    if (confirm('Are you sure you want to delete this unit?')) {
      try {
        await deleteUnit(unitId);
        toast.success('Unit deleted successfully');
      } catch (error) {
        toast.error('Failed to delete unit');
      }
    }
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
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="items" className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            Items
          </TabsTrigger>
          <TabsTrigger value="categories" className="flex items-center gap-2">
            <FolderOpen className="h-4 w-4" />
            Item Types
          </TabsTrigger>
          <TabsTrigger value="units" className="flex items-center gap-2">
            <Ruler className="h-4 w-4" />
            Units
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
                    <SelectItem value="all">All Item Types</SelectItem>
                    {itemCategories.map((category) => (
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
                    <SelectItem value="category">Item Type</SelectItem>
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

            {loading || itemsLoading ? (
              <LoadingState type="cards" rows={6} />
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
              <div className={viewMode === 'grid' ? 'flex gap-4 overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-border scrollbar-track-background' : 'space-y-4'}>
                {viewMode === 'grid' ? (
                  filteredAndSortedItems.map((item) => (
                    <div key={item.id} className="flex-shrink-0 w-80">
                      <ItemCard item={item} onClick={handleEditItem} />
                    </div>
                  ))
                ) : (
                  <Card>
                    <div className="max-h-[600px] overflow-y-auto">
                      <Table>
                        <TableHeader>
                           <TableRow>
                             <TableHead>Name</TableHead>
                             <TableHead>SKU</TableHead>
                             <TableHead>Description</TableHead>
                             <TableHead>Item Type</TableHead>
                             <TableHead>Units</TableHead>
                             <TableHead>Package Price</TableHead>
                             <TableHead>Cost per Item</TableHead>
                           </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredAndSortedItems.map((item) => (
                            <ItemTableRow key={item.id} item={item} onClick={handleEditItem} />
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </Card>
                )}
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="categories" className="mt-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <FolderOpen className="h-5 w-5" />
                Item Types
              </CardTitle>
              <Button onClick={handleAddCategory}>
                <Plus className="h-4 w-4 mr-2" />
                Add Item Type
              </Button>
            </CardHeader>
            <CardContent>
              {categoriesLoading ? (
                <LoadingState rows={3} showHeader={false} />
              ) : categories.length === 0 ? (
                <div className="text-center py-12">
                  <FolderOpen className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">No item types yet</h3>
                  <p className="text-muted-foreground mb-4">
                    Create item types to organize your inventory items
                  </p>
                  <div className="flex gap-2 justify-center">
                    <Button onClick={handleAddCategory}>
                      <Plus className="h-4 w-4 mr-2" />
                      Create First Item Type
                    </Button>
                    {units.length === 0 && (
                      <Button variant="outline" onClick={handleSeedDefaults}>
                        Create Defaults
                      </Button>
                    )}
                  </div>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead className="w-[100px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {categories.map((category) => (
                      <TableRow key={category.id}>
                        <TableCell className="font-medium">{category.name}</TableCell>
                        <TableCell>{category.description || 'No description'}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditCategory(category.id)}
                            >
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteCategory(category.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="units" className="mt-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Ruler className="h-5 w-5" />
                Units
              </CardTitle>
              <Button onClick={handleAddUnit}>
                <Plus className="h-4 w-4 mr-2" />
                Add Unit
              </Button>
            </CardHeader>
            <CardContent>
              {unitsLoading ? (
                <LoadingState rows={3} showHeader={false} />
              ) : units.length === 0 ? (
                <div className="text-center py-12">
                  <Ruler className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">No units yet</h3>
                  <p className="text-muted-foreground mb-4">
                    Create units for your inventory items (Box of bottles, Case of cans, etc.)
                  </p>
                  <div className="flex gap-2 justify-center">
                    <Button onClick={handleAddUnit}>
                      <Plus className="h-4 w-4 mr-2" />
                      Create First Unit
                    </Button>
                    {categories.length === 0 && (
                      <Button variant="outline" onClick={handleSeedDefaults}>
                        Create Defaults
                      </Button>
                    )}
                  </div>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Abbreviation</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead className="w-[100px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {units.map((unit) => (
                      <TableRow key={unit.id}>
                        <TableCell className="font-medium">{unit.name}</TableCell>
                        <TableCell>{unit.abbreviation}</TableCell>
                        <TableCell className="capitalize">{unit.unit_type}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditUnit(unit.id)}
                            >
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteUnit(unit.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="templates" className="mt-6">
          <InventoryTemplatesPanel selectedTeam={null} />
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

      <InventoryCategoryDialog
        open={isCategoryDialogOpen}
        onOpenChange={setIsCategoryDialogOpen}
        categoryId={selectedCategoryId}
      />

      <InventoryUnitDialog
        open={isUnitDialogOpen}
        onOpenChange={setIsUnitDialogOpen}
        unitId={selectedUnitId}
      />
    </div>
  );
};