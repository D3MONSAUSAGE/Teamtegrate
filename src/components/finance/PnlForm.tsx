
import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { PnlItem } from './ProfitAndLoss';

interface PnlFormProps {
  onSubmit: (data: PnlItem) => void;
  onCancel: () => void;
}

const pnlFormSchema = z.object({
  title: z.string().min(2, {
    message: "Title must be at least 2 characters.",
  }),
  period: z.string().min(2, {
    message: "Period must be specified.",
  }),
  revenue: z.object({
    foodSales: z.coerce.number().min(0),
    beverageSales: z.coerce.number().min(0),
    merchandiseSales: z.coerce.number().min(0),
    cateringEvents: z.coerce.number().min(0),
    otherIncome: z.coerce.number().min(0),
  }),
  cogs: z.object({
    foodCosts: z.coerce.number().min(0),
    beverageCosts: z.coerce.number().min(0),
    merchandiseCosts: z.coerce.number().min(0),
    packagingSupplies: z.coerce.number().min(0),
  }),
  operatingExpenses: z.object({
    wagesSalaries: z.coerce.number().min(0),
    benefitsPayrollTaxes: z.coerce.number().min(0),
    rentLease: z.coerce.number().min(0),
    utilities: z.coerce.number().min(0),
    marketingAdvertising: z.coerce.number().min(0),
    royaltyFees: z.coerce.number().min(0),
    advertisingFees: z.coerce.number().min(0),
    otherFranchiseFees: z.coerce.number().min(0),
    insurance: z.coerce.number().min(0),
    maintenanceRepairs: z.coerce.number().min(0),
    nonFoodSupplies: z.coerce.number().min(0),
    technology: z.coerce.number().min(0),
    professionalFees: z.coerce.number().min(0),
    otherOperatingExpenses: z.coerce.number().min(0),
  }),
  otherExpenses: z.object({
    depreciationAmortization: z.coerce.number().min(0),
    interestExpense: z.coerce.number().min(0),
    taxes: z.coerce.number().min(0),
  }),
  notes: z.string(),
});

type FormData = z.infer<typeof pnlFormSchema>;

const PnlForm: React.FC<PnlFormProps> = ({ onSubmit, onCancel }) => {
  const form = useForm<FormData>({
    resolver: zodResolver(pnlFormSchema),
    defaultValues: {
      title: "Guanatos Tacos Franchise P&L",
      period: `${new Date().toLocaleString('default', { month: 'long' })} ${new Date().getFullYear()}`,
      revenue: {
        foodSales: 0,
        beverageSales: 0,
        merchandiseSales: 0,
        cateringEvents: 0,
        otherIncome: 0,
      },
      cogs: {
        foodCosts: 0,
        beverageCosts: 0,
        merchandiseCosts: 0,
        packagingSupplies: 0,
      },
      operatingExpenses: {
        wagesSalaries: 0,
        benefitsPayrollTaxes: 0,
        rentLease: 0,
        utilities: 0,
        marketingAdvertising: 0,
        royaltyFees: 0,
        advertisingFees: 0,
        otherFranchiseFees: 0,
        insurance: 0,
        maintenanceRepairs: 0,
        nonFoodSupplies: 0,
        technology: 0,
        professionalFees: 0,
        otherOperatingExpenses: 0,
      },
      otherExpenses: {
        depreciationAmortization: 0,
        interestExpense: 0,
        taxes: 0,
      },
      notes: "",
    }
  });

  const handleSubmit = (values: FormData) => {
    const newPnl: PnlItem = {
      id: uuidv4(),
      title: values.title,
      period: values.period,
      data: {
        revenue: values.revenue,
        cogs: values.cogs,
        operatingExpenses: values.operatingExpenses,
        otherExpenses: values.otherExpenses,
        notes: values.notes,
      },
      createdAt: new Date(),
    };
    
    onSubmit(newPnl);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Title</FormLabel>
                <FormControl>
                  <Input placeholder="P&L Statement Title" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="period"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Period</FormLabel>
                <FormControl>
                  <Input placeholder="e.g. January 2025" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div>
          <h3 className="font-medium text-lg mb-2">Revenue</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="revenue.foodSales"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Food Sales</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                        <span className="text-gray-500">$</span>
                      </div>
                      <Input type="number" min="0" step="0.01" className="pl-7" {...field} />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="revenue.beverageSales"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Beverage Sales</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                        <span className="text-gray-500">$</span>
                      </div>
                      <Input type="number" min="0" step="0.01" className="pl-7" {...field} />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="revenue.merchandiseSales"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Merchandise Sales</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                        <span className="text-gray-500">$</span>
                      </div>
                      <Input type="number" min="0" step="0.01" className="pl-7" {...field} />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="revenue.cateringEvents"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Catering/Events</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                        <span className="text-gray-500">$</span>
                      </div>
                      <Input type="number" min="0" step="0.01" className="pl-7" {...field} />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="revenue.otherIncome"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Other Income</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                        <span className="text-gray-500">$</span>
                      </div>
                      <Input type="number" min="0" step="0.01" className="pl-7" {...field} />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        <Separator />

        <div>
          <h3 className="font-medium text-lg mb-2">Cost of Goods Sold</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="cogs.foodCosts"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Food Costs</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                        <span className="text-gray-500">$</span>
                      </div>
                      <Input type="number" min="0" step="0.01" className="pl-7" {...field} />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="cogs.beverageCosts"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Beverage Costs</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                        <span className="text-gray-500">$</span>
                      </div>
                      <Input type="number" min="0" step="0.01" className="pl-7" {...field} />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="cogs.merchandiseCosts"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Merchandise Costs</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                        <span className="text-gray-500">$</span>
                      </div>
                      <Input type="number" min="0" step="0.01" className="pl-7" {...field} />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="cogs.packagingSupplies"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Packaging/Supplies</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                        <span className="text-gray-500">$</span>
                      </div>
                      <Input type="number" min="0" step="0.01" className="pl-7" {...field} />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        <Separator />

        <div>
          <h3 className="font-medium text-lg mb-2">Operating Expenses</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="operatingExpenses.wagesSalaries"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Wages/Salaries</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                        <span className="text-gray-500">$</span>
                      </div>
                      <Input type="number" min="0" step="0.01" className="pl-7" {...field} />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="operatingExpenses.benefitsPayrollTaxes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Benefits/Payroll Taxes</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                        <span className="text-gray-500">$</span>
                      </div>
                      <Input type="number" min="0" step="0.01" className="pl-7" {...field} />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
            <FormField
              control={form.control}
              name="operatingExpenses.rentLease"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Rent/Lease</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                        <span className="text-gray-500">$</span>
                      </div>
                      <Input type="number" min="0" step="0.01" className="pl-7" {...field} />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="operatingExpenses.utilities"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Utilities</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                        <span className="text-gray-500">$</span>
                      </div>
                      <Input type="number" min="0" step="0.01" className="pl-7" {...field} />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="operatingExpenses.marketingAdvertising"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Marketing/Advertising</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                        <span className="text-gray-500">$</span>
                      </div>
                      <Input type="number" min="0" step="0.01" className="pl-7" {...field} />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
            <FormField
              control={form.control}
              name="operatingExpenses.royaltyFees"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Royalty Fees</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                        <span className="text-gray-500">$</span>
                      </div>
                      <Input type="number" min="0" step="0.01" className="pl-7" {...field} />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="operatingExpenses.advertisingFees"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Advertising Fees</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                        <span className="text-gray-500">$</span>
                      </div>
                      <Input type="number" min="0" step="0.01" className="pl-7" {...field} />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="operatingExpenses.otherFranchiseFees"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Other Franchise Fees</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                        <span className="text-gray-500">$</span>
                      </div>
                      <Input type="number" min="0" step="0.01" className="pl-7" {...field} />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <FormField
              control={form.control}
              name="operatingExpenses.insurance"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Insurance</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                        <span className="text-gray-500">$</span>
                      </div>
                      <Input type="number" min="0" step="0.01" className="pl-7" {...field} />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="operatingExpenses.maintenanceRepairs"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Maintenance/Repairs</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                        <span className="text-gray-500">$</span>
                      </div>
                      <Input type="number" min="0" step="0.01" className="pl-7" {...field} />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="operatingExpenses.nonFoodSupplies"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Non-Food Supplies</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                        <span className="text-gray-500">$</span>
                      </div>
                      <Input type="number" min="0" step="0.01" className="pl-7" {...field} />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="operatingExpenses.technology"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Technology</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                        <span className="text-gray-500">$</span>
                      </div>
                      <Input type="number" min="0" step="0.01" className="pl-7" {...field} />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="operatingExpenses.professionalFees"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Professional Fees</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                        <span className="text-gray-500">$</span>
                      </div>
                      <Input type="number" min="0" step="0.01" className="pl-7" {...field} />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="operatingExpenses.otherOperatingExpenses"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Other Operating Expenses</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                        <span className="text-gray-500">$</span>
                      </div>
                      <Input type="number" min="0" step="0.01" className="pl-7" {...field} />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        <Separator />

        <div>
          <h3 className="font-medium text-lg mb-2">Other Expenses</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <FormField
              control={form.control}
              name="otherExpenses.depreciationAmortization"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Depreciation/Amortization</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                        <span className="text-gray-500">$</span>
                      </div>
                      <Input type="number" min="0" step="0.01" className="pl-7" {...field} />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="otherExpenses.interestExpense"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Interest Expense</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                        <span className="text-gray-500">$</span>
                      </div>
                      <Input type="number" min="0" step="0.01" className="pl-7" {...field} />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="otherExpenses.taxes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Taxes</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                        <span className="text-gray-500">$</span>
                      </div>
                      <Input type="number" min="0" step="0.01" className="pl-7" {...field} />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        <Separator />

        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notes</FormLabel>
              <FormControl>
                <Textarea placeholder="Add any additional notes about this P&L statement" className="min-h-32" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit">
            Create P&L Statement
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default PnlForm;
