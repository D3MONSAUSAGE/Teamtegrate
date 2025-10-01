import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Wand2, Check, AlertCircle } from 'lucide-react';
import { generateSKU, validateSKUUniqueness } from '@/utils/skuGenerator';
import { InventoryCategory } from '@/contexts/inventory/types';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface SKUGeneratorButtonProps {
  categoryId?: string;
  categories: InventoryCategory[];
  currentSKU?: string;
  onSKUGenerated: (sku: string) => void;
  excludeId?: string;
  className?: string;
  disabled?: boolean;
}

export const SKUGeneratorButton: React.FC<SKUGeneratorButtonProps> = ({
  categoryId,
  categories,
  currentSKU,
  onSKUGenerated,
  excludeId,
  className,
  disabled
}) => {
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerateSKU = async () => {
    if (isGenerating || disabled) return;
    
    setIsGenerating(true);
    
    try {
      const newSKU = await generateSKU(categoryId, categories);
      onSKUGenerated(newSKU);
      toast.success('SKU generated successfully');
    } catch (error) {
      console.error('Error generating SKU:', error);
      toast.error('Failed to generate SKU. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Button
      type="button"
      variant="outline"
      size="icon"
      onClick={handleGenerateSKU}
      disabled={disabled || isGenerating}
      className={cn(
        "shrink-0 transition-colors",
        isGenerating && "animate-pulse",
        className
      )}
      title="Generate unique SKU"
    >
      <Wand2 className={cn(
        "h-4 w-4",
        isGenerating ? "animate-spin" : ""
      )} />
    </Button>
  );
};

interface SKUValidationIndicatorProps {
  sku?: string;
  excludeId?: string;
  className?: string;
}

export const SKUValidationIndicator: React.FC<SKUValidationIndicatorProps> = ({
  sku,
  excludeId,
  className
}) => {
  const [validationState, setValidationState] = useState<{
    isValidating: boolean;
    isValid?: boolean;
    message?: string;
  }>({ isValidating: false });

  React.useEffect(() => {
    if (!sku || sku.trim() === '') {
      setValidationState({ isValidating: false });
      return;
    }

    const validateSKU = async () => {
      setValidationState({ isValidating: true });
      
      try {
        const result = await validateSKUUniqueness(sku, excludeId);
        setValidationState({
          isValidating: false,
          isValid: result.isUnique,
          message: result.message
        });
      } catch (error) {
        setValidationState({
          isValidating: false,
          isValid: false,
          message: 'Validation error'
        });
      }
    };

    // Debounce validation
    const timeoutId = setTimeout(validateSKU, 500);
    return () => clearTimeout(timeoutId);
  }, [sku, excludeId]);

  if (!sku || sku.trim() === '' || validationState.isValidating) {
    return null;
  }

  if (validationState.isValid) {
    return (
      <div className={cn("flex items-center gap-1 text-green-600", className)}>
        <Check className="h-3 w-3" />
        <span className="text-xs">Available</span>
      </div>
    );
  }

  if (validationState.isValid === false) {
    return (
      <div className={cn("flex items-center gap-1 text-red-600", className)}>
        <AlertCircle className="h-3 w-3" />
        <span className="text-xs">{validationState.message || 'Not available'}</span>
      </div>
    );
  }

  return null;
};