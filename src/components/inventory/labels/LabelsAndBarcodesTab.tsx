import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarcodeGenerator } from './BarcodeGenerator';
import { LabelTemplateManager } from './LabelTemplateManager';
import { LabelPrintDialog } from './LabelPrintDialog';
import { BatchLabelGenerator } from './BatchLabelGenerator';
import { Button } from '@/components/ui/button';
import { QrCode, Tag, Printer, Layers, Plus } from 'lucide-react';

export const LabelsAndBarcodesTab: React.FC = () => {
  const [printDialogOpen, setPrintDialogOpen] = useState(false);

  return (
    <div className="space-y-6">
      {/* Quick Actions */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">Barcode & Label Management</h3>
          <p className="text-muted-foreground">
            Generate barcodes, QR codes, and manage label templates
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setPrintDialogOpen(true)}>
            <Printer className="h-4 w-4 mr-2" />
            Print Labels
          </Button>
        </div>
      </div>

      {/* Barcode Generator */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <QrCode className="h-5 w-5" />
            Barcode & QR Code Generator
          </CardTitle>
          <CardDescription>
            Generate individual barcodes and QR codes for testing and standalone use
          </CardDescription>
        </CardHeader>
        <CardContent>
          <BarcodeGenerator />
        </CardContent>
      </Card>

      {/* Label Templates */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Layers className="h-5 w-5" />
            Label Templates
          </CardTitle>
          <CardDescription>
            Create and manage label templates for different types of inventory items
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
            Batch Label Generation
          </CardTitle>
          <CardDescription>
            Generate labels for multiple inventory items at once
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
    </div>
  );
};