import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus } from 'lucide-react';
import { useCreateRecipe } from '@/hooks/useRecipes';
import { useRecipeIngredients } from '@/hooks/useRecipeIngredients';
import { AddIngredientDialog } from './AddIngredientDialog';
import { IngredientsTable } from './IngredientsTable';
import { AddOtherCostDialog } from './costs/AddOtherCostDialog';
import { OtherCostsTable } from './costs/OtherCostsTable';
import { useWarehouseSelection } from '@/contexts/inventory';
import { toast } from 'sonner';

interface CreateRecipeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const CreateRecipeDialog: React.FC<CreateRecipeDialogProps> = ({
  open,
  onOpenChange,
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [outputQuantity, setOutputQuantity] = useState('');
  const [outputUnit, setOutputUnit] = useState('');
  const [notes, setNotes] = useState('');
  const [addIngredientOpen, setAddIngredientOpen] = useState(false);
  const [addOtherCostOpen, setAddOtherCostOpen] = useState(false);
  const [tempRecipeId, setTempRecipeId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('info');

  const { selectedWarehouse } = useWarehouseSelection();
  const { mutate: createRecipe, isPending } = useCreateRecipe();
  const { data: ingredients } = useRecipeIngredients(tempRecipeId || '');

  const handleCreate = async () => {
    if (!name || !outputQuantity || !outputUnit) return;

    if (!selectedWarehouse?.team_id) {
      toast.error('Please select a warehouse first');
      return;
    }

    createRecipe(
      {
        name,
        description: description || undefined,
        output_quantity: parseFloat(outputQuantity),
        output_unit: outputUnit,
        notes: notes || undefined,
        is_active: true,
        team_id: selectedWarehouse.team_id,
      },
      {
        onSuccess: (newRecipe) => {
          setTempRecipeId(newRecipe.id);
          setActiveTab('ingredients');
        },
      }
    );
  };

  const handleClose = () => {
    setName('');
    setDescription('');
    setOutputQuantity('');
    setOutputUnit('');
    setNotes('');
    setTempRecipeId(null);
    setActiveTab('info');
    onOpenChange(false);
  };

  const canCreateRecipe = name && outputQuantity && outputUnit;

  return (
    <>
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Recipe</DialogTitle>
          </DialogHeader>

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="info">Recipe Info</TabsTrigger>
              <TabsTrigger value="ingredients" disabled={!tempRecipeId}>
                Ingredients {ingredients && `(${ingredients.length})`}
              </TabsTrigger>
              <TabsTrigger value="other-costs" disabled={!tempRecipeId}>
                Other Costs
              </TabsTrigger>
            </TabsList>

            <TabsContent value="info" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Recipe Name *</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., Seasoned Taco Meat"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Brief description of this recipe"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="outputQuantity">Output Quantity *</Label>
                  <Input
                    id="outputQuantity"
                    type="number"
                    step="0.01"
                    value={outputQuantity}
                    onChange={(e) => setOutputQuantity(e.target.value)}
                    placeholder="10"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="outputUnit">Output Unit *</Label>
                  <Input
                    id="outputUnit"
                    value={outputUnit}
                    onChange={(e) => setOutputUnit(e.target.value)}
                    placeholder="lbs"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Additional notes or instructions"
                  rows={3}
                />
              </div>

              <Button
                onClick={handleCreate}
                disabled={!canCreateRecipe || isPending}
                className="w-full"
              >
                {isPending ? 'Creating...' : 'Create Recipe & Add Ingredients'}
              </Button>
            </TabsContent>

            <TabsContent value="ingredients" className="space-y-4">
              {tempRecipeId && (
                <>
                  <Button
                    onClick={() => setAddIngredientOpen(true)}
                    className="w-full"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Add Ingredient
                  </Button>

                  <IngredientsTable recipeId={tempRecipeId} />

                  <div className="flex gap-2">
                    <Button variant="outline" onClick={handleClose} className="flex-1">
                      Close
                    </Button>
                    <Button onClick={handleClose} className="flex-1">
                      Done
                    </Button>
                  </div>
                </>
              )}
            </TabsContent>

            <TabsContent value="other-costs" className="space-y-4">
              {tempRecipeId && (
                <>
                  <Button
                    onClick={() => setAddOtherCostOpen(true)}
                    className="w-full"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Add Other Cost
                  </Button>

                  <OtherCostsTable recipeId={tempRecipeId} />

                  <div className="flex gap-2">
                    <Button variant="outline" onClick={handleClose} className="flex-1">
                      Close
                    </Button>
                    <Button onClick={handleClose} className="flex-1">
                      Done
                    </Button>
                  </div>
                </>
              )}
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      {tempRecipeId && (
        <>
          <AddIngredientDialog
            recipeId={tempRecipeId}
            open={addIngredientOpen}
            onOpenChange={setAddIngredientOpen}
          />
          <AddOtherCostDialog
            recipeId={tempRecipeId}
            open={addOtherCostOpen}
            onOpenChange={setAddOtherCostOpen}
          />
        </>
      )}
    </>
  );
};
