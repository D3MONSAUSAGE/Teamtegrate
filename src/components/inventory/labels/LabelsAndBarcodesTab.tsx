import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarcodeGenerator } from './BarcodeGenerator';
import { LabelTemplateManager } from './LabelTemplateManager';
import { LabelPrintDialog } from './LabelPrintDialog';
import { BatchLabelGenerator } from './BatchLabelGenerator';
import { ReprintDialog } from './ReprintDialog';
import { Button } from '@/components/ui/button';
import { QrCode, Tag, Printer, Layers, Plus, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';

export const LabelsAndBarcodesTab: React.FC = () => {
  const [printDialogOpen, setPrintDialogOpen] = useState(false);
  const [reprintDialogOpen, setReprintDialogOpen] = useState(false);

  return (
    <div className="space-y-6">
      {/* Quick Actions */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">Product Barcode & Label Management</h3>
          <p className="text-muted-foreground">
            Complete workflow: Assign barcodes → Generate labels → Print/Reprint
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setPrintDialogOpen(true)}>
            <Printer className="h-4 w-4 mr-2" />
            Generate Labels
          </Button>
          <Button variant="outline" onClick={() => setReprintDialogOpen(true)}>
            <RotateCcw className="h-4 w-4 mr-2" />
            Reprint from Template
          </Button>
        </div>
      </div>

      {/* Workflow Steps */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="flex items-center p-4 border rounded-lg bg-blue-50/50 border-blue-200">
          <div className="flex items-center justify-center w-8 h-8 bg-blue-500 text-white rounded-full mr-3 text-sm font-bold">1</div>
          <div>
            <h4 className="font-medium text-blue-900">Assign Barcodes</h4>
            <p className="text-sm text-blue-700">Generate and assign barcodes to your products</p>
          </div>
        </div>
        <div className="flex items-center p-4 border rounded-lg bg-green-50/50 border-green-200">
          <div className="flex items-center justify-center w-8 h-8 bg-green-500 text-white rounded-full mr-3 text-sm font-bold">2</div>
          <div>
            <h4 className="font-medium text-green-900">Generate Labels</h4>
            <p className="text-sm text-green-700">Create labels with product info and nutritional data</p>
          </div>
        </div>
        <div className="flex items-center p-4 border rounded-lg bg-purple-50/50 border-purple-200">
          <div className="flex items-center justify-center w-8 h-8 bg-purple-500 text-white rounded-full mr-3 text-sm font-bold">3</div>
          <div>
            <h4 className="font-medium text-purple-900">Print & Reprint</h4>
            <p className="text-sm text-purple-700">Print labels and reprint from saved templates</p>
          </div>
        </div>
      </div>

      {/* Barcode Generator */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <QrCode className="h-5 w-5" />
            Step 1: Barcode & QR Code Generator
          </CardTitle>
          <CardDescription>
            Generate and assign barcodes to your inventory items for scanning and tracking
          </CardDescription>
        </CardHeader>
        <CardContent>
          <BarcodeGenerator onGenerate={(barcode, format, items) => {
            if (items?.length) {
              toast.success(`Barcodes assigned! Now you can generate labels for these items.`);
            }
          }} />
        </CardContent>
      </Card>

      {/* Label Templates */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Layers className="h-5 w-5" />
            Step 3: Label Templates & Reprinting
          </CardTitle>
          <CardDescription>
            Manage saved templates and reprint labels with updated lot numbers and expiration dates
          </CardDescription>
        </CardHeader>
        <CardContent>
          <LabelTemplateManager />
        </CardContent>
      </Card>

      {/* Batch Label Generation */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Tag className="h-5 w-5" />
            Step 2: Batch Label Generation
          </CardTitle>
          <CardDescription>
            Generate professional labels with nutritional info, ingredients, and barcode data
          </CardDescription>
        </CardHeader>
        <CardContent>
          <BatchLabelGenerator />
        </CardContent>
      </Card>

      <LabelPrintDialog
        open={printDialogOpen}
        onOpenChange={setPrintDialogOpen}
      />

      <ReprintDialog
        open={reprintDialogOpen}
        onOpenChange={setReprintDialogOpen}
      />
    </div>
  );
};