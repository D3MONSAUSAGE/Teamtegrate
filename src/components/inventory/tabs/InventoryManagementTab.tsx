import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useInventory } from '@/contexts/inventory';
import { useAuth } from '@/contexts/AuthContext';
import { useTeamAccess } from '@/hooks/useTeamAccess';
import { UnifiedTeamSelector } from '@/components/teams';
import { InventoryItemDialog } from '../InventoryItemDialog';


import { InventoryTemplatesPanel } from '../InventoryTemplatesPanel';
import { SimpleTeamSelector } from '@/components/teams';
import { InventoryCategoryDialog } from '../InventoryCategoryDialog';
import { InventoryUnitDialog } from '../InventoryUnitDialog';
import { VendorDialog } from '../dialogs/VendorDialog';
import { ItemCard } from '../ItemCard';
import { ItemTableRow } from '../ItemTableRow';
import { ProductGrid } from '../ProductGrid';
import { ProductCardItem } from '../ProductCard';
import { LayoutGrid, List } from 'lucide-react';
import { LoadingState, LoadingSpinner } from '@/components/ui/loading-state';
import { Plus, Package, FileText, Search, Filter, FolderOpen, Ruler, Edit2, Trash2, Building2, Mail, Phone, Globe, QrCode, TruckIcon } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { LabelsAndBarcodesTab } from '../labels/LabelsAndBarcodesTab';
import { toast } from 'sonner';
import { DEFAULT_CATEGORIES, DEFAULT_UNITS, shouldSeedDefaults } from '@/utils/inventorySeeds';
import { supabase } from '@/integrations/supabase/client';

export const InventoryManagementTab: React.FC = () => {
  console.log('InventoryManagementTab: Component rendering');
  const { hasRoleAccess, user } = useAuth();
  const { availableTeams, isAdmin, isSuperAdmin, isManager, isTeamManager } = useTeamAccess();
  console.log('InventoryManagementTab: About to call useInventory');
  const {
    items, 
    loading, 
    itemsLoading,
    categories, 
    categoriesLoading,
    units, 
    unitsLoading,
    vendors,
    vendorsLoading,
    createVendor,
    updateVendor,
    deleteVendor,
    deleteCategory, 
    deleteUnit, 
    deleteItem,
    createCategory, 
    createUnit,
    refreshItems
  } = useInventory();
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'name' | 'stock' | 'category'>('name');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);
  
  // Category dialog states
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  
  // Unit dialog states
  const [isUnitDialogOpen, setIsUnitDialogOpen] = useState(false);
  const [selectedUnitId, setSelectedUnitId] = useState<string | null>(null);
  
  // Vendor dialog states
  const [isVendorDialogOpen, setIsVendorDialogOpen] = useState(false);
  const [selectedVendor, setSelectedVendor] = useState<any | null>(null);
  const [vendorToDelete, setVendorToDelete] = useState<any | null>(null);
  
  // Item delete confirmation states
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{ id: string; name: string } | null>(null);

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
      const matchesTeam = !selectedTeamId || item.team_id === selectedTeamId;
      
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
          return (a.category?.name || '').localeCompare(b.category?.name || '');
        default:
          return 0;
      }
    });

    return filtered;
  }, [items, searchTerm, selectedCategory, sortBy, selectedTeamId]);

  // Get unique categories from items for filtering
  const itemCategories = useMemo(() => {
    const uniqueCategories = Array.from(new Set(
      items.map(item => item.category?.name).filter(name => name && name.trim() !== '')
    ));
    return uniqueCategories;
  }, [items]);

  const handleAddItem = () => {
    setSelectedItemId(null);
    setIsDialogOpen(true);
  };

  const handleEditItem = async (itemId: string) => {
    setSelectedItemId(itemId);
    setIsDialogOpen(true);
  };

  const handleDeleteItem = (itemId: string) => {
    const item = items.find(i => i.id === itemId);
    if (item) {
      setItemToDelete({ id: item.id, name: item.name });
      setIsDeleteDialogOpen(true);
    }
  };

  const confirmDeleteItem = async () => {
    if (!itemToDelete) return;
    
    try {
      await deleteItem(itemToDelete.id);
      toast.success('Item deleted successfully');
    } catch (error) {
      toast.error('Failed to delete item');
    } finally {
      setIsDeleteDialogOpen(false);
      setItemToDelete(null);
    }
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

  const handleAddVendor = () => {
    setSelectedVendor(null);
    setIsVendorDialogOpen(true);
  };

  const handleEditVendor = (vendor: any) => {
    setSelectedVendor(vendor);
    setIsVendorDialogOpen(true);
  };

  const handleDeleteVendor = async () => {
    if (!vendorToDelete) return;
    
    try {
      await deleteVendor(vendorToDelete.id);
      toast.success('Vendor deleted successfully');
    } catch (error) {
      toast.error('Failed to delete vendor');
    } finally {
      setVendorToDelete(null);
    }
  };

  const handleSaveVendor = async (vendorData: any) => {
    try {
      if (selectedVendor) {
        await updateVendor(selectedVendor.id, vendorData);
        toast.success('Vendor updated successfully');
      } else {
        await createVendor(vendorData);
        toast.success('Vendor created successfully');
      }
      setIsVendorDialogOpen(false);
      setSelectedVendor(null);
    } catch (error) {
      toast.error('Failed to save vendor');
      throw error;
    }
  };

  // Check permissions - allow org-wide managers/admins OR team managers
  const canAccessInventory = isAdmin || isSuperAdmin || isManager || isTeamManager;
  
  if (!canAccessInventory) {
    return (
      <div className="text-center py-8">
        <Package className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
        <p className="text-muted-foreground">
          You don't have permission to manage the product catalog.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Team selector for admins/superadmins */}
      {(isAdmin || isSuperAdmin) && (
        <Card>
          <CardContent className="pt-6">
            <UnifiedTeamSelector
              selectedTeamId={selectedTeamId || ''}
              onTeamChange={setSelectedTeamId}
              variant="inline"
              showAllOption={true}
              placeholder="All Teams"
            />
          </CardContent>
        </Card>
      )}
      
      <Tabs defaultValue="items" className="w-full">
        <div className="w-full overflow-x-auto pb-2 -mx-1 px-1">
          <TabsList className="inline-flex w-auto min-w-full">
            <TabsTrigger value="items" className="flex items-center gap-2 whitespace-nowrap">
              <Package className="h-4 w-4" />
              <span className="hidden sm:inline">Product Catalog</span>
              <span className="sm:hidden">Catalog</span>
            </TabsTrigger>
            <TabsTrigger value="labels" className="flex items-center gap-2 whitespace-nowrap">
              <QrCode className="h-4 w-4" />
              Labels
            </TabsTrigger>
            <TabsTrigger value="categories" className="flex items-center gap-2 whitespace-nowrap">
              <FolderOpen className="h-4 w-4" />
              <span className="hidden sm:inline">Item Types</span>
              <span className="sm:hidden">Types</span>
            </TabsTrigger>
            <TabsTrigger value="units" className="flex items-center gap-2 whitespace-nowrap">
              <Ruler className="h-4 w-4" />
              Units
            </TabsTrigger>
            <TabsTrigger value="vendors" className="flex items-center gap-2 whitespace-nowrap">
              <Building2 className="h-4 w-4" />
              Vendors
            </TabsTrigger>
            <TabsTrigger value="templates" className="flex items-center gap-2 whitespace-nowrap">
              <FileText className="h-4 w-4" />
              <span className="hidden sm:inline">Templates</span>
              <span className="sm:hidden">Saved</span>
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="items" className="mt-6">
          <div className="space-y-4">
            <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
              <div className="flex-1 w-full">
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search product catalog..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-8"
                  />
                </div>
              </div>
              
              <div className="flex items-center gap-2 w-full md:w-auto">
                {/* View Toggle */}
                <div className="flex items-center border rounded-lg p-1 bg-muted/50">
                  <Button
                    variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('grid')}
                    className="h-7 px-2"
                  >
                    <LayoutGrid className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={viewMode === 'table' ? 'secondary' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('table')}
                    className="h-7 px-2"
                  >
                    <List className="h-4 w-4" />
                  </Button>
                </div>

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


                {hasRoleAccess('admin') && (
                  <Button onClick={handleAddItem}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Item
                  </Button>
                )}
              </div>
            </div>

            {loading || itemsLoading ? (
              <LoadingState type="table" rows={6} />
            ) : filteredAndSortedItems.length === 0 ? (
              <div className="text-center py-12">
                <Package className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No products found</h3>
                <p className="text-muted-foreground mb-4">
                  {searchTerm || selectedCategory !== 'all' 
                    ? 'Try adjusting your search or filters.'
                    : 'Get started by adding your first inventory item.'
                  }
                </p>
                {(!searchTerm && selectedCategory === 'all') && hasRoleAccess('admin') && (
                  <Button onClick={handleAddItem}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add First Item
                  </Button>
                )}
              </div>
            ) : viewMode === 'grid' ? (
              <ProductGrid
                items={filteredAndSortedItems.map(item => ({
                  id: item.id,
                  name: item.name,
                  sku: item.sku,
                  barcode: item.barcode,
                  description: item.description,
                  category: item.category,
                  base_unit: item.base_unit,
                  vendor: item.vendor,
                  purchase_unit: item.purchase_unit,
                  purchase_price: item.purchase_price,
                  conversion_factor: item.conversion_factor,
                  unit_cost: item.unit_cost,
                  sale_price: item.sale_price,
                  image_url: item.image_url
                } as ProductCardItem))}
                variant="master"
                onEdit={handleEditItem}
                onDelete={handleDeleteItem}
                showActions={true}
              />
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
                            <TableHead>Units/Package</TableHead>
                            <TableHead>Purchase Unit</TableHead>
                            <TableHead>Package Price</TableHead>
                            <TableHead>Sale Price</TableHead>
                            <TableHead>Vendor</TableHead>
                            <TableHead className="w-[80px]">Actions</TableHead>
                         </TableRow>
                      </TableHeader>
                     <TableBody>
                       {filteredAndSortedItems.map((item) => (
                         <ItemTableRow 
                           key={item.id} 
                           item={item} 
                           onClick={handleEditItem}
                           onDelete={handleDeleteItem}
                         />
                       ))}
                     </TableBody>
                   </Table>
                </div>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="labels" className="mt-6">
          <LabelsAndBarcodesTab />
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
                    Create product types to organize your product catalog
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
                    Create units for your products (Box of bottles, Case of cans, etc.)
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

        {/* Vendor Management Tab */}
        <TabsContent value="vendors" className="mt-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Vendors
              </CardTitle>
              <Button onClick={() => setIsVendorDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Vendor
              </Button>
            </CardHeader>
            <CardContent>
              {vendorsLoading ? (
                <LoadingState rows={3} showHeader={false} />
              ) : vendors.length === 0 ? (
                <div className="text-center py-12">
                  <Building2 className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">No vendors yet</h3>
                  <p className="text-muted-foreground mb-4">
                    Add vendors to track supplier information and enhance your inventory management
                  </p>
                  <Button onClick={() => setIsVendorDialogOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create First Vendor
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {vendors.map((vendor) => (
                    <Card key={vendor.id} className="group hover:shadow-md transition-shadow">
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-2">
                            <Building2 className="h-5 w-5 text-primary" />
                            <h4 className="font-medium">{vendor.name}</h4>
                          </div>
                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditVendor(vendor)}
                            >
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setVendorToDelete(vendor)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <div className="space-y-2 text-sm text-muted-foreground">
                          {vendor.contact_email && (
                            <div className="flex items-center gap-2">
                              <Mail className="h-4 w-4" />
                              <span className="truncate">{vendor.contact_email}</span>
                            </div>
                          )}
                          {vendor.contact_phone && (
                            <div className="flex items-center gap-2">
                              <Phone className="h-4 w-4" />
                              <span>{vendor.contact_phone}</span>
                            </div>
                          )}
                          {vendor.website && (
                            <div className="flex items-center gap-2">
                              <Globe className="h-4 w-4" />
                              <span className="truncate">{vendor.website}</span>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="templates" className="mt-6">
          <InventoryTemplatesPanel selectedTeam={null} />
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

      <VendorDialog
        open={isVendorDialogOpen}
        onOpenChange={setIsVendorDialogOpen}
        vendor={selectedVendor}
        onSave={handleSaveVendor}
      />

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Item</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{itemToDelete?.name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteItem}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete Item
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!vendorToDelete} onOpenChange={(open) => !open && setVendorToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Vendor</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{vendorToDelete?.name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteVendor}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete Vendor
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};