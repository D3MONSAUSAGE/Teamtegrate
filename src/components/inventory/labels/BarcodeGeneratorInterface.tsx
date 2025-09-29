import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { BarcodeGenerator as BarcodeGen, BarcodeFormat } from '@/lib/barcode/barcodeGenerator';
import { useEnhancedInventoryManagement } from '@/hooks/useEnhancedInventoryManagement';
import { inventoryItemsApi } from '@/contexts/inventory/api/inventoryItems';
import { InventoryItem } from '@/contexts/inventory/types';
import { Download, Copy, Package, CheckCircle, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

interface BarcodeGeneratorProps {
  initialValue?: string;
  onGenerate?: (barcode: string, format: string, selectedItems?: InventoryItem[]) => void;
}

export const BarcodeGeneratorInterface: React.FC<BarcodeGeneratorProps> = ({
  initialValue = '',
  onGenerate
}) => {
  console.log('BarcodeGenerator: Component rendered');
  const { items } = useEnhancedInventoryManagement();
  const [value, setValue] = useState(initialValue);
  const [format, setFormat] = useState<BarcodeFormat>('CODE128');
  const [width, setWidth] = useState(2);
  const [height, setHeight] = useState(100);
  const [displayValue, setDisplayValue] = useState(true);
  const [barcodeImage, setBarcodeImage] = useState<string>('');
  const [qrImage, setQrImage] = useState<string>('');
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [autoAssign, setAutoAssign] = useState(true);
  const [batchMode, setBatchMode] = useState(false);
  const [filteredItems, setFilteredItems] = useState<InventoryItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  const formats: { value: BarcodeFormat; label: string }[] = [
    { value: 'CODE128', label: 'Code 128' },
    { value: 'CODE39', label: 'Code 39' },
    { value: 'EAN13', label: 'EAN-13' },
    { value: 'EAN8', label: 'EAN-8' },
    { value: 'UPC', label: 'UPC' },
    { value: 'ITF14', label: 'ITF-14' },
    { value: 'MSI', label: 'MSI' },
    { value: 'pharmacode', label: 'Pharmacode' },
    { value: 'codabar', label: 'Codabar' },
  ];

  useEffect(() => {
    // Filter items for batch selection - only show items without barcodes or with matching search
    let filtered = items.filter(item => !item.barcode || batchMode);
    
    if (searchTerm) {
      filtered = filtered.filter(item =>
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.sku?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    setFilteredItems(filtered);
  }, [items, batchMode, searchTerm]);

  const assignBarcodeToItem = async (itemId: string, barcode: string) => {
    try {
      await inventoryItemsApi.update(itemId, { barcode });
      return true;
    } catch (error) {
      console.error('Error assigning barcode:', error);
      throw error;
    }
  };

  const generateBarcode = async () => {
    if (!value.trim()) {
      toast.error('Please enter a value to generate barcode');
      return;
    }

    if (!BarcodeGen.validateBarcodeValue(value, format)) {
      toast.error(`Invalid value for ${format} format`);
      return;
    }

    const barcodeImg = BarcodeGen.generateBarcode(value, {
      format,
      width,
      height,
      displayValue,
      background: '#ffffff',
      lineColor: '#000000'
    });

    setBarcodeImage(barcodeImg);
    
    // Auto-assign to selected items if enabled
    if (autoAssign && selectedItems.size > 0) {
      try {
        const itemsToUpdate = items.filter(item => selectedItems.has(item.id));
        let successCount = 0;
        
        for (const item of itemsToUpdate) {
          if (item.barcode) {
            toast.warning(`Skipping ${item.name} - already has barcode`);
            continue;
          }
          
          await assignBarcodeToItem(item.id, value);
          successCount++;
        }
        
        if (successCount > 0) {
          toast.success(`Barcode assigned to ${successCount} item(s)`);
          setSelectedItems(new Set()); // Clear selection
          window.location.reload(); // Refresh to show updated items
        }
      } catch (error) {
        toast.error('Failed to assign barcode to some items');
      }
    }
    
    onGenerate?.(barcodeImg, format, items.filter(item => selectedItems.has(item.id)));
  };

  const generateBatchBarcodes = async () => {
    if (selectedItems.size === 0) {
      toast.error('Please select items for batch generation');
      return;
    }

    try {
      const itemsToUpdate = items.filter(item => selectedItems.has(item.id));
      let successCount = 0;
      
      for (const item of itemsToUpdate) {
        if (item.barcode) {
          toast.warning(`Skipping ${item.name} - already has barcode`);
          continue;
        }
        
        const barcode = item.sku || BarcodeGen.generateRandomSKU();
        await assignBarcodeToItem(item.id, barcode);
        successCount++;
      }
      
      if (successCount > 0) {
        toast.success(`Generated and assigned barcodes for ${successCount} item(s)`);
        setSelectedItems(new Set());
        window.location.reload();
      }
    } catch (error) {
      toast.error('Failed to generate batch barcodes');
    }
  };

  const generateQR = async () => {
    if (!value.trim()) {
      toast.error('Please enter a value to generate QR code');
      return;
    }

    try {
      const qrImg = await BarcodeGen.generateQRCode(value, {
        width: 200,
        margin: 4,
        color: { dark: '#000000', light: '#ffffff' }
      });
      setQrImage(qrImg);
      onGenerate?.(qrImg, 'QR', items.filter(item => selectedItems.has(item.id)));
    } catch (error) {
      toast.error('Failed to generate QR code');
    }
  };

  const handleItemSelect = (itemId: string, checked: boolean) => {
    const newSelected = new Set(selectedItems);
    if (checked) {
      newSelected.add(itemId);
    } else {
      newSelected.delete(itemId);
    }
    setSelectedItems(newSelected);
  };

  const downloadImage = (imageData: string, filename: string) => {
    const link = document.createElement('a');
    link.download = filename;
    link.href = imageData;
    link.click();
  };

  const copyToClipboard = (imageData: string) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      canvas.width = img.width;
      canvas.height = img.height;
      ctx?.drawImage(img, 0, 0);
      
      canvas.toBlob((blob) => {
        if (blob) {
          navigator.clipboard.write([
            new ClipboardItem({ 'image/png': blob })
          ]).then(() => {
            toast.success('Image copied to clipboard');
          }).catch(() => {
            toast.error('Failed to copy image to clipboard');
          });
        }
      });
    };
    img.src = imageData;
  };

  const generateRandomSKU = () => {
    const sku = BarcodeGen.generateRandomSKU();
    setValue(sku);
  };

  useEffect(() => {
    if (value && BarcodeGen.validateBarcodeValue(value, format)) {
      generateBarcode();
    }
  }, [value, format, width, height, displayValue]);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Product Barcode & QR Generator
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Mode Selection */}
          <div className="flex items-center justify-between p-3 border rounded-lg bg-muted/50">
            <div className="flex items-center space-x-2">
              <Switch
                checked={batchMode}
                onCheckedChange={setBatchMode}
              />
              <Label>Batch Mode</Label>
            </div>
            <Badge variant={batchMode ? "default" : "secondary"}>
              {batchMode ? "Multiple Items" : "Single Item"}
            </Badge>
          </div>

          {/* Product Selection */}
          {(batchMode || autoAssign) && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Package className="h-4 w-4" />
                  Select Products ({selectedItems.size} selected)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <Input
                    placeholder="Search products..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                  <div className="max-h-48 overflow-y-auto space-y-2">
                    {filteredItems.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50"
                      >
                        <div className="flex items-center space-x-3">
                          <Checkbox
                            checked={selectedItems.has(item.id)}
                            onCheckedChange={(checked) => handleItemSelect(item.id, checked as boolean)}
                          />
                          <div className="flex-1">
                            <div className="font-medium">{item.name}</div>
                            <div className="text-sm text-muted-foreground">
                              SKU: {item.sku || 'N/A'}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {item.barcode ? (
                            <Badge variant="outline" className="text-xs bg-green-50">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Has Barcode
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-xs bg-yellow-50">
                              <AlertCircle className="h-3 w-3 mr-1" />
                              No Barcode
                            </Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {batchMode && (
                    <Button 
                      onClick={generateBatchBarcodes}
                      disabled={selectedItems.size === 0}
                      className="w-full"
                    >
                      Generate Barcodes for Selected ({selectedItems.size} items)
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="barcode-value">Value</Label>
              <div className="flex gap-2">
                <Input
                  id="barcode-value"
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  placeholder="Enter value to encode"
                />
                <Button variant="outline" onClick={generateRandomSKU}>
                  Random SKU
                </Button>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="barcode-format">Format</Label>
              <Select value={format} onValueChange={(value) => setFormat(value as BarcodeFormat)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {formats.map((fmt) => (
                    <SelectItem key={fmt.value} value={fmt.value}>
                      {fmt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="barcode-width">Width</Label>
              <Input
                id="barcode-width"
                type="number"
                min="1"
                max="10"
                value={width}
                onChange={(e) => setWidth(Number(e.target.value))}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="barcode-height">Height</Label>
              <Input
                id="barcode-height"
                type="number"
                min="50"
                max="300"
                value={height}
                onChange={(e) => setHeight(Number(e.target.value))}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="display-value">Show Text</Label>
              <div className="flex items-center space-x-2 pt-2">
                <Switch
                  id="display-value"
                  checked={displayValue}
                  onCheckedChange={setDisplayValue}
                />
              </div>
            </div>
          </div>

          {!batchMode && (
            <>
              <div className="flex items-center space-x-2 p-3 border rounded-lg">
                <Switch
                  checked={autoAssign}
                  onCheckedChange={setAutoAssign}
                />
                <Label>Auto-assign to selected products</Label>
              </div>

              <div className="flex gap-2">
                <Button onClick={generateBarcode}>Generate Barcode</Button>
                <Button variant="outline" onClick={generateQR}>Generate QR Code</Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {(barcodeImage || qrImage) && (
        <Card>
          <CardHeader>
            <CardTitle>Generated Codes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {barcodeImage && (
              <div className="space-y-2">
                <Label>Barcode ({format})</Label>
                <div className="flex flex-col items-center space-y-2 p-4 border rounded-lg bg-white">
                  <img src={barcodeImage} alt="Generated barcode" className="max-w-full" />
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => downloadImage(barcodeImage, `barcode-${value}.png`)}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(barcodeImage)}
                    >
                      <Copy className="h-4 w-4 mr-2" />
                      Copy
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {qrImage && (
              <div className="space-y-2">
                <Label>QR Code</Label>
                <div className="flex flex-col items-center space-y-2 p-4 border rounded-lg bg-white">
                  <img src={qrImage} alt="Generated QR code" className="max-w-full" />
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => downloadImage(qrImage, `qr-${value}.png`)}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(qrImage)}
                    >
                      <Copy className="h-4 w-4 mr-2" />
                      Copy
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};