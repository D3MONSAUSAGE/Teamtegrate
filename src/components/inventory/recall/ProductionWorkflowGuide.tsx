import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Factory, Zap, Package, CheckCircle2, ArrowRight } from 'lucide-react';

export const ProductionWorkflowGuide: React.FC = () => {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Factory className="h-5 w-5 text-primary" />
            <CardTitle>Production Workflow Integration</CardTitle>
          </div>
          <CardDescription>
            Automated manufacturing batch creation with smart triggers
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <Zap className="h-4 w-4 text-primary" />
              Auto-Generation Triggers
            </h3>
            <div className="grid gap-3">
              <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg border">
                <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5" />
                <div>
                  <p className="font-medium">Production Receive</p>
                  <p className="text-sm text-muted-foreground">
                    When finished goods are received, batches auto-generate with production details
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg border">
                <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5" />
                <div>
                  <p className="font-medium">Smart Batch Numbering</p>
                  <p className="text-sm text-muted-foreground">
                    Format: BATCH-YYYY-MM-XXXX-[LINE] with automatic sequencing
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg border">
                <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5" />
                <div>
                  <p className="font-medium">Auto-Shift Detection</p>
                  <p className="text-sm text-muted-foreground">
                    Morning (6am-2pm), Afternoon (2pm-10pm), Night (10pm-6am)
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg border">
                <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5" />
                <div>
                  <p className="font-medium">Quantity Thresholds</p>
                  <p className="text-sm text-muted-foreground">
                    Configure minimum quantities to trigger batch creation
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <Package className="h-4 w-4 text-primary" />
              Production Workflow
            </h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Badge variant="outline" className="w-8 h-8 flex items-center justify-center">1</Badge>
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
                <p className="text-sm">Raw materials moved to production area</p>
              </div>
              <div className="flex items-center gap-3">
                <Badge variant="outline" className="w-8 h-8 flex items-center justify-center">2</Badge>
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
                <p className="text-sm">Production completes (auto-detects shift & line)</p>
              </div>
              <div className="flex items-center gap-3">
                <Badge variant="outline" className="w-8 h-8 flex items-center justify-center">3</Badge>
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
                <p className="text-sm">Use "Production Receive" to record finished goods</p>
              </div>
              <div className="flex items-center gap-3">
                <Badge variant="outline" className="w-8 h-8 flex items-center justify-center">4</Badge>
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
                <p className="text-sm">Batch auto-generates with full traceability</p>
              </div>
              <div className="flex items-center gap-3">
                <Badge variant="outline" className="w-8 h-8 flex items-center justify-center">5</Badge>
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
                <p className="text-sm">Print labels linked to batch for distribution</p>
              </div>
            </div>
          </div>

          <div className="p-4 bg-primary/10 rounded-lg border border-primary/20">
            <h4 className="font-semibold mb-2">Benefits</h4>
            <ul className="text-sm space-y-1 text-muted-foreground">
              <li>✓ Eliminates manual batch entry for routine production</li>
              <li>✓ Ensures consistent batch numbering across operations</li>
              <li>✓ Automatic shift and time tracking for compliance</li>
              <li>✓ Complete traceability for recall readiness</li>
              <li>✓ Reduces human error in production documentation</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
