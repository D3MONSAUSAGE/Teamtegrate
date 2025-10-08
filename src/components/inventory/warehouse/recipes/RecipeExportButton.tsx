import React from 'react';
import { Button } from '@/components/ui/button';
import { FileDown } from 'lucide-react';
import { RecipeWithCosts } from '@/hooks/useRecipes';
import { useRecipeIngredients } from '@/hooks/useRecipeIngredients';
import { useRecipeOtherCosts } from '@/hooks/useRecipeOtherCosts';
import { exportRecipeToPDF } from '@/utils/recipeExportToPDF';
import { toast } from 'sonner';

interface RecipeExportButtonProps {
  recipe: RecipeWithCosts;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg' | 'icon';
}

export const RecipeExportButton: React.FC<RecipeExportButtonProps> = ({
  recipe,
  variant = 'outline',
  size = 'default',
}) => {
  const { data: ingredients = [] } = useRecipeIngredients(recipe.id);
  const { data: otherCosts = [] } = useRecipeOtherCosts(recipe.id);

  const handleExport = () => {
    try {
      exportRecipeToPDF(recipe, ingredients, otherCosts);
      toast.success('Recipe exported to PDF');
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export recipe');
    }
  };

  return (
    <Button variant={variant} size={size} onClick={handleExport}>
      <FileDown className="h-4 w-4 mr-2" />
      Export PDF
    </Button>
  );
};
