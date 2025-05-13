
import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useBranchBudgets } from "@/hooks/finance/useBranchBudgets";
import BranchBudgetForm from "./BranchBudgetForm";
import BranchBudgetDisplay from "./BranchBudgetDisplay";
import BranchBudgetsHeader from "./BranchBudgetsHeader";
import EmptyState from "./EmptyState";

const BranchBudgets: React.FC = () => {
  const {
    branches,
    loading,
    open,
    setOpen,
    editBudgetId,
    formDefault,
    handleOpenNew,
    handleEdit,
    handleDelete,
    handleSave,
    getBudgetsForBranch
  } = useBranchBudgets();

  return (
    <div className="space-y-6">
      <BranchBudgetsHeader onAddBudget={handleOpenNew} />
      
      {loading ? (
        <div className="text-muted-foreground text-center py-12">Loading...</div>
      ) : branches.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="space-y-5">
          {branches.map((branch) => (
            <BranchBudgetDisplay
              key={branch.id}
              branch={branch}
              budgets={getBudgetsForBranch(branch.id)}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {/* Form Modal */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>{editBudgetId ? "Edit Budget" : "Add Budget"}</DialogTitle>
          </DialogHeader>
          <BranchBudgetForm
            branches={branches}
            initialState={formDefault}
            editBudgetId={editBudgetId}
            onCancel={() => { setOpen(false); }}
            onSave={handleSave}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BranchBudgets;
