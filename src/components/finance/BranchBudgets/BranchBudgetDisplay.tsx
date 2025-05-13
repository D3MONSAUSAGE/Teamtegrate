import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Pencil, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { Branch, BranchBudget } from "./types";

type Props = {
  branch: Branch;
  budgets: BranchBudget[];
  onEdit: (budget: BranchBudget) => void;
  onDelete: (budget: BranchBudget) => void;
};

const BranchBudgetDisplay: React.FC<Props> = ({ branch, budgets, onEdit, onDelete }) => (
  <Card className="shadow-none">
    <CardHeader>
      <CardTitle className="flex items-center gap-3">
        <span className="font-semibold">{branch.name}</span>
        {branch.location && <Badge variant="secondary">{branch.location}</Badge>}
      </CardTitle>
      <div className="text-xs text-gray-500 mt-1">
        Branch ID: <span className="select-all">{branch.id}</span>
      </div>
    </CardHeader>
    <CardContent>
      <div className="flex flex-col gap-4">
        {budgets.length === 0 ? (
          <div className="text-muted-foreground text-sm mb-4">
            No budget set for this branch yet.
          </div>
        ) : (
          <div className="flex flex-col gap-2 w-full">
            {budgets.map((budget) => (
              <div key={budget.id} className="bg-muted/70 px-4 py-3 rounded">
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div>
                    <span className="font-medium text-sm">{budget.period}</span>
                    <span className="ml-3 text-xs text-gray-500">
                      Budget: <span className="font-bold">${Number(budget.total_budget).toLocaleString()}</span>
                    </span>
                    <span className="ml-3 text-xs text-gray-500">
                      Last change: {format(new Date(budget.updated_at), 'yyyy-MM-dd')}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <Button size="icon" variant="outline" onClick={() => onEdit(budget)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button size="icon" variant="destructive" onClick={() => onDelete(budget)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                {budget.categories && budget.categories.length > 0 && (
                  <div className="mt-3 border-t border-gray-200 pt-2">
                    <p className="text-xs font-medium text-gray-500 mb-1">Budget Categories</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                      {budget.categories.map((category, idx) => (
                        <div key={idx} className="flex justify-between bg-background p-2 rounded text-xs">
                          <span>{category.name}</span>
                          <div className="flex gap-2">
                            <span>${category.amount?.toLocaleString()}</span>
                            <Badge variant="outline" className="text-xs h-5 px-1">
                              {category.percentage}%
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {budget.notes && (
                  <div className="text-xs italic text-gray-400 mt-2">
                    Note: {budget.notes}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </CardContent>
  </Card>
);

export default BranchBudgetDisplay;
