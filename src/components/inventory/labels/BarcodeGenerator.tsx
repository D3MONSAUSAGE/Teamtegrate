import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { BarcodeGenerator as BarcodeGen, BarcodeFormat } from '@/lib/barcode/barcodeGenerator';
import { Download, Copy } from 'lucide-react';
import { toast } from 'sonner';

interface BarcodeGeneratorProps {
  initialValue?: string;
  onGenerate?: (barcode: string, format: string) => void;
}

export const BarcodeGenerator: React.FC<BarcodeGeneratorProps> = ({
  initialValue = '',
  onGenerate
}) => {
  console.log('BarcodeGenerator: Component rendered');
  const [value, setValue] = useState(initialValue);
  const [format, setFormat] = useState<BarcodeFormat>('CODE128');
  const [width, setWidth] = useState(2);
  const [height, setHeight] = useState(100);
  const [displayValue, setDisplayValue] = useState(true);
  const [barcodeImage, setBarcodeImage] = useState<string>('');
  const [qrImage, setQrImage] = useState<string>('');

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

  const generateBarcode = () => {
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
    onGenerate?.(barcodeImg, format);
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
      onGenerate?.(qrImg, 'QR');
    } catch (error) {
      toast.error('Failed to generate QR code');
    }
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
          <CardTitle>Barcode Generator</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
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

          <div className="flex gap-2">
            <Button onClick={generateBarcode}>Generate Barcode</Button>
            <Button variant="outline" onClick={generateQR}>Generate QR Code</Button>
          </div>
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