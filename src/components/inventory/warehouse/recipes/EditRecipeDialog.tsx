import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus } from 'lucide-react';
import { useUpdateRecipe, RecipeWithCosts } from '@/hooks/useRecipes';
import { useRecipeIngredients } from '@/hooks/useRecipeIngredients';
import { AddIngredientDialog } from './AddIngredientDialog';
import { IngredientsTable } from './IngredientsTable';
import { AddOtherCostDialog } from './costs/AddOtherCostDialog';
import { OtherCostsTable } from './costs/OtherCostsTable';

interface EditRecipeDialogProps {
  recipe: RecipeWithCosts;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const EditRecipeDialog: React.FC<EditRecipeDialogProps> = ({
  recipe,
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
  const [activeTab, setActiveTab] = useState('info');

  const { mutate: updateRecipe, isPending } = useUpdateRecipe();
  const { data: ingredients } = useRecipeIngredients(recipe.id);

  // Initialize form with recipe data when dialog opens
  useEffect(() => {
    if (open && recipe) {
      setName(recipe.name);
      setDescription(recipe.description || '');
      setOutputQuantity(recipe.output_quantity.toString());
      setOutputUnit(recipe.output_unit);
      setNotes(recipe.notes || '');
      setActiveTab('info');
    }
  }, [open, recipe]);

  const handleUpdate = () => {
    if (!name || !outputQuantity || !outputUnit) return;

    updateRecipe(
      {
        id: recipe.id,
        updates: {
          name,
          description: description || undefined,
          output_quantity: parseFloat(outputQuantity),
          output_unit: outputUnit,
          notes: notes || undefined,
        },
      },
      {
        onSuccess: () => {
          onOpenChange(false);
        },
      }
    );
  };

  const handleClose = () => {
    setActiveTab('info');
    onOpenChange(false);
  };

  const canUpdate = name && outputQuantity && outputUnit;

  return (
    <>
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Recipe</DialogTitle>
          </DialogHeader>

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="info">Recipe Info</TabsTrigger>
              <TabsTrigger value="ingredients">
                Ingredients {ingredients && `(${ingredients.length})`}
              </TabsTrigger>
              <TabsTrigger value="other-costs">
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

              <div className="flex gap-2">
                <Button variant="outline" onClick={handleClose} className="flex-1">
                  Cancel
                </Button>
                <Button
                  onClick={handleUpdate}
                  disabled={!canUpdate || isPending}
                  className="flex-1"
                >
                  {isPending ? 'Updating...' : 'Update Recipe'}
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="ingredients" className="space-y-4">
              <Button
                onClick={() => setAddIngredientOpen(true)}
                className="w-full"
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Ingredient
              </Button>

              <IngredientsTable recipeId={recipe.id} />

              <Button onClick={handleClose} className="w-full">
                Done
              </Button>
            </TabsContent>

            <TabsContent value="other-costs" className="space-y-4">
              <Button
                onClick={() => setAddOtherCostOpen(true)}
                className="w-full"
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Other Cost
              </Button>

              <OtherCostsTable recipeId={recipe.id} />

              <Button onClick={handleClose} className="w-full">
                Done
              </Button>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      <AddIngredientDialog
        recipeId={recipe.id}
        open={addIngredientOpen}
        onOpenChange={setAddIngredientOpen}
      />
      <AddOtherCostDialog
        recipeId={recipe.id}
        open={addOtherCostOpen}
        onOpenChange={setAddOtherCostOpen}
      />
    </>
  );
};
