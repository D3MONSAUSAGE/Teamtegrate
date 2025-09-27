import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarcodeGenerator } from './BarcodeGenerator';
import { LabelTemplateManager } from './LabelTemplateManager';
import { LabelPrintDialog } from './LabelPrintDialog';
import { BatchLabelGenerator } from './BatchLabelGenerator';
import { Button } from '@/components/ui/button';
import { QrCode, Tag, Printer, Layers } from 'lucide-react';

export const LabelsAndBarcodesTab: React.FC = () => {
  const [printDialogOpen, setPrintDialogOpen] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Labels & Barcodes</h2>
          <p className="text-muted-foreground">
            Generate barcodes, QR codes, and print labels for your inventory items
          </p>
        </div>
      </div>

      <Tabs defaultValue="generator" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="generator" className="flex items-center gap-2">
            <QrCode className="h-4 w-4" />
            Generator
          </TabsTrigger>
          <TabsTrigger value="templates" className="flex items-center gap-2">
            <Layers className="h-4 w-4" />
            Templates
          </TabsTrigger>
          <TabsTrigger value="batch" className="flex items-center gap-2">
            <Tag className="h-4 w-4" />
            Batch Print
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center gap-2">
            <Printer className="h-4 w-4" />
            History
          </TabsTrigger>
        </TabsList>

        <TabsContent value="generator" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Barcode & QR Code Generator</CardTitle>
              <CardDescription>
                Generate individual barcodes and QR codes for testing and standalone use
              </CardDescription>
            </CardHeader>
            <CardContent>
              <BarcodeGenerator />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="templates" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Label Templates</CardTitle>
              <CardDescription>
                Create and manage label templates for different types of inventory items
              </CardDescription>
            </CardHeader>
            <CardContent>
              <LabelTemplateManager />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="batch" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Batch Label Generation</CardTitle>
              <CardDescription>
                Generate labels for multiple inventory items at once
              </CardDescription>
            </CardHeader>
            <CardContent>
              <BatchLabelGenerator />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Label History</CardTitle>
              <CardDescription>
                View previously generated labels and reprint if needed
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                Label history feature coming soon...
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <LabelPrintDialog
        open={printDialogOpen}
        onOpenChange={setPrintDialogOpen}
      />
    </div>
  );
};