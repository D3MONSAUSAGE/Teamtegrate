import React from 'react';
import { Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useBatchAutoGeneration } from '@/hooks/useBatchAutoGeneration';
import { toast } from '@/hooks/use-toast';

interface QuickBatchCreationButtonProps {
  itemId: string;
  quantity: number;
  productionLine?: string;
  onBatchCreated?: () => void;
}

export const QuickBatchCreationButton: React.FC<QuickBatchCreationButtonProps> = ({
  itemId,
  quantity,
  productionLine,
  onBatchCreated,
}) => {
  const { autoGenerateBatch } = useBatchAutoGeneration();
  const [isCreating, setIsCreating] = React.useState(false);

  const handleQuickCreate = async () => {
    setIsCreating(true);
    try {
      const batch = await autoGenerateBatch(itemId, quantity, { productionLine });
      
      if (batch) {
        toast({
          title: 'Batch Created',
          description: `Manufacturing batch ${batch.batch_number} created automatically`,
        });
        onBatchCreated?.();
      } else {
        throw new Error('Failed to create batch');
      }
    } catch (error) {
      console.error('Quick batch creation failed:', error);
      toast({
        title: 'Error',
        description: 'Failed to auto-create manufacturing batch',
        variant: 'destructive',
      });
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleQuickCreate}
      disabled={isCreating}
      className="gap-2"
    >
      <Package className="h-4 w-4" />
      {isCreating ? 'Creating Batch...' : 'Auto-Create Batch'}
    </Button>
  );
};
