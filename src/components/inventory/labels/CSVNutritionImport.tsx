import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { nutritionalInfoApi } from '@/contexts/inventory/api/nutritionalInfo';
import { useEnhancedInventoryManagement } from '@/hooks/useEnhancedInventoryManagement';
import { toast } from 'sonner';
import { Upload, Download, CheckCircle2, AlertTriangle } from 'lucide-react';

interface CSVNutritionImportProps {
  onImportComplete: () => void;
}

export const CSVNutritionImport: React.FC<CSVNutritionImportProps> = ({
  onImportComplete
}) => {
  const { items } = useEnhancedInventoryManagement();
  const [isImporting, setIsImporting] = useState(false);
  const [importResults, setImportResults] = useState<{
    success: number;
    errors: Array<{ row: number; error: string; }>;
  } | null>(null);

  const downloadTemplate = () => {
    const headers = [
      'item_name', 'item_sku', 'serving_size', 'servings_per_container',
      'calories', 'total_fat', 'saturated_fat', 'sodium', 'total_carbohydrates',
      'dietary_fiber', 'protein', 'ingredients', 'allergens'
    ];
    
    const sampleRow = [
      'Sample Product', 'SKU-001', '1 cup (240ml)', '2',
      '250', '12', '5', '350', '28',
      '3', '15', 'Water, Organic flour, Salt', 'Wheat, May contain nuts'
    ];

    const csvContent = [
      headers.join(','),
      sampleRow.join(','),
      // Add empty rows for actual data entry
      ...items.slice(0, 5).map(item => 
        `"${item.name}","${item.sku || ''}",,,,,,,,,,,,""`
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'nutritional-data-template.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    toast.success('Template downloaded successfully!');
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    setImportResults(null);

    try {
      const text = await file.text();
      const lines = text.split('\n').filter(line => line.trim());
      const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim());
      
      const results = { success: 0, errors: [] as Array<{ row: number; error: string; }> };

      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.replace(/"/g, '').trim());
        
        try {
          // Find item by name or SKU
          const itemName = values[headers.indexOf('item_name')];
          const itemSku = values[headers.indexOf('item_sku')];
          
          const item = items.find(item => 
            item.name === itemName || 
            item.sku === itemSku ||
            item.name.toLowerCase().includes(itemName.toLowerCase())
          );

          if (!item) {
            results.errors.push({ 
              row: i + 1, 
              error: `Item not found: "${itemName}" (SKU: ${itemSku})` 
            });
            continue;
          }

          // Parse nutritional data
          const nutritionalData = {
            item_id: item.id,
            serving_size: values[headers.indexOf('serving_size')] || undefined,
            servings_per_container: parseInt(values[headers.indexOf('servings_per_container')]) || undefined,
            calories: parseInt(values[headers.indexOf('calories')]) || undefined,
            total_fat: parseFloat(values[headers.indexOf('total_fat')]) || undefined,
            saturated_fat: parseFloat(values[headers.indexOf('saturated_fat')]) || undefined,
            sodium: parseInt(values[headers.indexOf('sodium')]) || undefined,
            total_carbohydrates: parseFloat(values[headers.indexOf('total_carbohydrates')]) || undefined,
            dietary_fiber: parseFloat(values[headers.indexOf('dietary_fiber')]) || undefined,
            protein: parseFloat(values[headers.indexOf('protein')]) || undefined,
            ingredients: values[headers.indexOf('ingredients')] || undefined,
            allergens: values[headers.indexOf('allergens')] 
              ? values[headers.indexOf('allergens')].split(',').map(a => a.trim()).filter(Boolean)
              : []
          };

          // Only save if there's actual data
          if (nutritionalData.serving_size || nutritionalData.calories || nutritionalData.ingredients) {
            await nutritionalInfoApi.upsert(nutritionalData as any);
            results.success++;
          } else {
            results.errors.push({ 
              row: i + 1, 
              error: `No nutritional data provided for "${itemName}"` 
            });
          }

        } catch (error) {
          results.errors.push({ 
            row: i + 1, 
            error: `Error processing row: ${error instanceof Error ? error.message : 'Unknown error'}` 
          });
        }
      }

      setImportResults(results);
      
      if (results.success > 0) {
        toast.success(`Successfully imported ${results.success} nutritional records!`);
        onImportComplete();
      }
      
      if (results.errors.length > 0) {
        toast.warning(`${results.errors.length} rows had errors. Check the results below.`);
      }

    } catch (error) {
      console.error('CSV import error:', error);
      toast.error('Failed to process CSV file');
    } finally {
      setIsImporting(false);
      // Reset file input
      event.target.value = '';
    }
  };

  return (
    <Card className="border-primary/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          Bulk Import Nutritional Data
        </CardTitle>
        <CardDescription>
          Import nutritional information for multiple products from a CSV file
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        
        {/* Template Download */}
        <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
          <div>
            <p className="font-medium">1. Download Template</p>
            <p className="text-sm text-muted-foreground">Get a CSV template with your current products</p>
          </div>
          <Button variant="outline" onClick={downloadTemplate}>
            <Download className="h-4 w-4 mr-2" />
            Download Template
          </Button>
        </div>

        {/* File Upload */}
        <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
          <div>
            <p className="font-medium">2. Upload Completed File</p>
            <p className="text-sm text-muted-foreground">Upload your filled CSV file</p>
          </div>
          <div className="relative">
            <Input
              type="file"
              accept=".csv"
              onChange={handleFileUpload}
              disabled={isImporting}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            <Button disabled={isImporting}>
              <Upload className="h-4 w-4 mr-2" />
              {isImporting ? 'Importing...' : 'Choose CSV File'}
            </Button>
          </div>
        </div>

        {/* Import Results */}
        {importResults && (
          <div className="space-y-3">
            {importResults.success > 0 && (
              <Alert>
                <CheckCircle2 className="h-4 w-4" />
                <AlertDescription>
                  Successfully imported {importResults.success} nutritional records.
                </AlertDescription>
              </Alert>
            )}
            
            {importResults.errors.length > 0 && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <div className="space-y-1">
                    <p className="font-medium">{importResults.errors.length} errors occurred:</p>
                    <ul className="text-sm space-y-1 max-h-32 overflow-y-auto">
                      {importResults.errors.slice(0, 5).map((error, index) => (
                        <li key={index}>Row {error.row}: {error.error}</li>
                      ))}
                      {importResults.errors.length > 5 && (
                        <li>... and {importResults.errors.length - 5} more errors</li>
                      )}
                    </ul>
                  </div>
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}

        {/* Help Text */}
        <div className="text-xs text-muted-foreground space-y-1">
          <p><strong>CSV Format:</strong> Match products by name or SKU</p>
          <p><strong>Required:</strong> At least serving_size OR calories OR ingredients</p>
          <p><strong>Allergens:</strong> Separate multiple allergens with commas</p>
        </div>
      </CardContent>
    </Card>
  );
};