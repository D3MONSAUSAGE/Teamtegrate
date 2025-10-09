import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { RecipeWithCosts } from '@/hooks/useRecipes';
import { RecipeIngredient } from '@/contexts/inventory/api/productionRecipes';
import { RecipeOtherCostWithCategory } from '@/contexts/inventory/api/recipeOtherCosts';
import { supabase } from '@/integrations/supabase/client';

export const exportRecipeToPDF = async (
  recipe: RecipeWithCosts,
  ingredients: RecipeIngredient[],
  otherCosts: RecipeOtherCostWithCategory[]
) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  let yPosition = 20;

  // Title
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text(recipe.name, pageWidth / 2, yPosition, { align: 'center' });
  yPosition += 10;

  // Description
  if (recipe.description) {
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    const descLines = doc.splitTextToSize(recipe.description, pageWidth - 40);
    doc.text(descLines, pageWidth / 2, yPosition, { align: 'center' });
    yPosition += descLines.length * 5 + 5;
  }

  // Output Info
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Output:', 20, yPosition);
  doc.setFont('helvetica', 'normal');
  doc.text(`${recipe.output_quantity} ${recipe.output_unit}`, 45, yPosition);
  yPosition += 10;

  // Ingredients Table
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Ingredients', 20, yPosition);
  yPosition += 5;

  const ingredientsData = await Promise.all(
    ingredients.map(async (ing) => {
      // Fetch item name and SKU
      const { data: item } = await supabase
        .from('inventory_items')
        .select('name, sku')
        .eq('id', ing.item_id)
        .single();

      const itemDisplay = item 
        ? `${item.sku ? `[${item.sku}] ` : ''}${item.name}` 
        : ing.item_id;

      const unitCost = ing.manual_unit_cost || ing.cost_per_base_unit || 0;
      const total = ing.quantity_needed * unitCost;
      return [
        itemDisplay,
        `${ing.quantity_needed} ${ing.unit}`,
        `$${unitCost.toFixed(4)}`,
        `$${total.toFixed(2)}`,
        ing.notes || '',
      ];
    })
  );

  const ingredientTotal = ingredients.reduce((sum, ing) => {
    const unitCost = ing.manual_unit_cost || ing.cost_per_base_unit || 0;
    return sum + (ing.quantity_needed * unitCost);
  }, 0);

  autoTable(doc, {
    startY: yPosition,
    head: [['Item [SKU]', 'Quantity', 'Unit Cost', 'Total', 'Notes']],
    body: ingredientsData,
    theme: 'grid',
    headStyles: { fillColor: [59, 130, 246] },
    foot: [[
      'Ingredient Total',
      '',
      '',
      `$${ingredientTotal.toFixed(2)}`,
      '',
    ]],
    footStyles: { fillColor: [229, 231, 235], textColor: [0, 0, 0], fontStyle: 'bold' },
  });

  yPosition = doc.lastAutoTable.finalY + 15;

  // Other Costs Table
  if (otherCosts.length > 0) {
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Other Costs', 20, yPosition);
    yPosition += 5;

    const otherCostsData = otherCosts.map((cost) => [
      cost.category_name || 'Unknown',
      `$${cost.cost_amount.toFixed(2)}`,
      cost.notes || '',
    ]);

    const totalOtherCosts = otherCosts.reduce((sum, cost) => sum + cost.cost_amount, 0);

    autoTable(doc, {
      startY: yPosition,
      head: [['Category', 'Cost', 'Notes']],
      body: otherCostsData,
      theme: 'grid',
      headStyles: { fillColor: [59, 130, 246] },
      foot: [[
        'Other Costs Total',
        `$${totalOtherCosts.toFixed(2)}`,
        '',
      ]],
      footStyles: { fillColor: [229, 231, 235], textColor: [0, 0, 0], fontStyle: 'bold' },
    });

    yPosition = doc.lastAutoTable.finalY + 15;
  }

  // Total Cost Summary
  const totalCost = recipe.total_cost || 0;
  const costPerUnit = recipe.cost_per_unit || 0;

  doc.setFillColor(240, 240, 240);
  doc.rect(20, yPosition, pageWidth - 40, 25, 'F');
  
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  yPosition += 8;
  doc.text('Total Recipe Cost:', 25, yPosition);
  doc.setTextColor(59, 130, 246);
  doc.text(`$${totalCost.toFixed(2)}`, pageWidth - 25, yPosition, { align: 'right' });
  
  yPosition += 8;
  doc.setTextColor(0, 0, 0);
  doc.text('Cost Per Unit:', 25, yPosition);
  doc.setTextColor(59, 130, 246);
  doc.text(`$${costPerUnit.toFixed(4)} / ${recipe.output_unit}`, pageWidth - 25, yPosition, { align: 'right' });
  
  yPosition += 15;

  // Notes
  if (recipe.notes) {
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Notes:', 20, yPosition);
    yPosition += 5;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    const notesLines = doc.splitTextToSize(recipe.notes, pageWidth - 40);
    doc.text(notesLines, 20, yPosition);
  }

  // Footer
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(128, 128, 128);
    doc.text(
      `Generated: ${new Date().toLocaleDateString()} | Page ${i} of ${pageCount}`,
      pageWidth / 2,
      doc.internal.pageSize.getHeight() - 10,
      { align: 'center' }
    );
  }

  // Save the PDF
  doc.save(`recipe-${recipe.name.replace(/\s+/g, '-').toLowerCase()}.pdf`);
};

