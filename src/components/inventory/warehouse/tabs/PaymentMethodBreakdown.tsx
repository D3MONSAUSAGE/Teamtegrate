import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, CreditCard, Banknote, Smartphone } from "lucide-react";

interface PaymentMethodBreakdown {
  payment_method: string;
  is_cash_equivalent: boolean;
  payment_count: number;
  total_amount: number;
}

interface PaymentMethodBreakdownProps {
  paymentMethods: PaymentMethodBreakdown[];
  totalCollected: number;
}

const getPaymentIcon = (method: string, isCash: boolean) => {
  if (isCash) return DollarSign;
  if (method.toLowerCase().includes('card') || method.toLowerCase().includes('credit')) return CreditCard;
  if (method.toLowerCase().includes('check')) return Banknote;
  return Smartphone;
};

export function PaymentMethodBreakdownComponent({ paymentMethods, totalCollected }: PaymentMethodBreakdownProps) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Payment Method Breakdown</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {paymentMethods.map((method) => {
          const Icon = getPaymentIcon(method.payment_method, method.is_cash_equivalent);
          const percentage = totalCollected > 0 ? (method.total_amount / totalCollected * 100).toFixed(1) : 0;
          
          return (
            <Card key={method.payment_method} className={method.is_cash_equivalent ? "border-primary/20" : ""}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {method.payment_method}
                </CardTitle>
                <Icon className={`h-4 w-4 ${method.is_cash_equivalent ? 'text-primary' : 'text-muted-foreground'}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  ${method.total_amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
                <div className="flex items-center justify-between mt-2">
                  <p className="text-xs text-muted-foreground">
                    {method.payment_count} payment{method.payment_count !== 1 ? 's' : ''}
                  </p>
                  <p className="text-xs font-medium text-primary">
                    {percentage}%
                  </p>
                </div>
                <div className="mt-2 h-1 bg-muted rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-primary rounded-full transition-all"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
      {paymentMethods.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          No payments recorded for this week
        </div>
      )}
    </div>
  );
}
