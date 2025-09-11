import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Calendar, 
  MapPin, 
  DollarSign, 
  ShoppingCart,
  Users,
  TrendingUp,
  Receipt,
  CreditCard,
  FileText
} from 'lucide-react';
import { SalesData } from '@/types/sales';
import { format } from 'date-fns';

interface DataViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  salesData: SalesData | null;
}

export const DataViewModal: React.FC<DataViewModalProps> = ({
  isOpen,
  onClose,
  salesData
}) => {
  if (!salesData) return null;

  const formatCurrency = (amount: number) => `$${amount.toFixed(2)}`;

  const getStatusColor = () => {
    if (salesData.netSales <= 0) return 'bg-red-100 text-red-700';
    if (salesData.grossSales > 5000) return 'bg-emerald-100 text-emerald-700';
    return 'bg-blue-100 text-blue-700';
  };

  const getStatusText = () => {
    if (salesData.netSales <= 0) return 'Needs Review';
    if (salesData.grossSales > 5000) return 'High Performance';
    return 'Normal';
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Sales Data Details
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-6">
          {/* Header Information */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Calendar className="w-8 h-8 text-blue-600" />
                  <div>
                    <p className="text-sm text-muted-foreground">Date</p>
                    <p className="font-semibold">
                      {format(new Date(salesData.date), 'MMM dd, yyyy')}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <MapPin className="w-8 h-8 text-emerald-600" />
                  <div>
                    <p className="text-sm text-muted-foreground">Location</p>
                    <p className="font-semibold">{salesData.location}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Badge className={getStatusColor()}>
                    {getStatusText()}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="payments">Payments</TabsTrigger>
              <TabsTrigger value="labor">Labor</TabsTrigger>
              <TabsTrigger value="details">Details</TabsTrigger>
            </TabsList>
            
            <TabsContent value="overview" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                      <DollarSign className="w-4 h-4" />
                      Gross Sales
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold">{formatCurrency(salesData.grossSales)}</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                      <TrendingUp className="w-4 h-4" />
                      Net Sales
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold">{formatCurrency(salesData.netSales)}</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                      <ShoppingCart className="w-4 h-4" />
                      Orders
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold">{salesData.orderCount}</p>
                    <p className="text-xs text-muted-foreground">
                      Avg: {formatCurrency(salesData.orderAverage)}
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      Team
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-lg font-semibold">{salesData.team_id || 'N/A'}</p>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
            
            <TabsContent value="payments" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <CreditCard className="w-5 h-5" />
                      Payment Breakdown
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Total Cash</span>
                      <span className="font-semibold">
                        {formatCurrency(salesData.paymentBreakdown?.totalCash || 0)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Non-Cash</span>
                      <span className="font-semibold">
                        {formatCurrency(salesData.paymentBreakdown?.nonCash || 0)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Calculated Cash</span>
                      <span className="font-semibold">
                        {formatCurrency(salesData.paymentBreakdown?.calculatedCash || 0)}
                      </span>
                    </div>
                    <div className="border-t pt-2">
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Tips</span>
                        <span className="font-semibold text-emerald-600">
                          {formatCurrency(salesData.paymentBreakdown?.tips || 0)}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Receipt className="w-5 h-5" />
                      Transaction Summary
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Voids</span>
                      <span className="font-semibold">{formatCurrency(salesData.voids || 0)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Refunds</span>
                      <span className="font-semibold">{formatCurrency(salesData.refunds || 0)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Surcharges</span>
                      <span className="font-semibold">{formatCurrency(salesData.surcharges || 0)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Expenses</span>
                      <span className="font-semibold">{formatCurrency(salesData.expenses || 0)}</span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
            
            <TabsContent value="labor" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    Labor Information
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Labor Cost</span>
                        <span className="font-semibold">
                          {formatCurrency(salesData.labor?.cost || 0)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Labor Hours</span>
                        <span className="font-semibold">{salesData.labor?.hours || 0} hrs</span>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Labor Percentage</span>
                        <span className="font-semibold">
                          {(salesData.labor?.percentage || 0).toFixed(1)}%
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Sales per Labor Hour</span>
                        <span className="font-semibold">
                          {formatCurrency(salesData.labor?.salesPerLaborHour || 0)}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="details" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Gift Cards</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Issue Amount</span>
                      <span>{formatCurrency(salesData.giftCards?.issueAmount || 0)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Issue Count</span>
                      <span>{salesData.giftCards?.issueCount || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Reload Amount</span>
                      <span>{formatCurrency(salesData.giftCards?.reloadAmount || 0)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Reload Count</span>
                      <span>{salesData.giftCards?.reloadCount || 0}</span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Cash Management</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Deposits Accepted</span>
                      <span>{formatCurrency(salesData.cashManagement?.depositsAccepted || 0)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Deposits Redeemed</span>
                      <span>{formatCurrency(salesData.cashManagement?.depositsRedeemed || 0)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Paid In</span>
                      <span>{formatCurrency(salesData.cashManagement?.paidIn || 0)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Paid Out</span>
                      <span>{formatCurrency(salesData.cashManagement?.paidOut || 0)}</span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
};