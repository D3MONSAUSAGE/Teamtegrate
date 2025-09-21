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
import { Plus, Package, FileText, Users } from 'lucide-react';

export const InventoryManagementTab: React.FC = () => {
  const { items } = useInventory();
  const { hasRoleAccess } = useAuth();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [selectedTeam, setSelectedTeam] = useState<string>('');

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
          <InventoryTemplatesPanel selectedTeam={selectedTeam} />
        </TabsContent>

        <TabsContent value="items" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="h-5 w-5" />
                    Inventory Items
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {items.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50"
                      >
                        <div>
                          <h3 className="font-medium">{item.name}</h3>
                          <p className="text-sm text-muted-foreground">
                            Stock: {item.current_stock} {item.unit_of_measure}
                          </p>
                        </div>
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
                    ))}
                  </div>
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