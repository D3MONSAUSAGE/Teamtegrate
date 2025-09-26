import React, { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Search, Package, Barcode } from 'lucide-react';
import { warehouseApi } from '@/contexts/warehouse/api/warehouseApi';

export interface InventoryItemOption {
  id: string;
  name: string;
  sku?: string;
  barcode?: string;
  unit_cost?: number;
  category?: {
    name: string;
  };
  base_unit?: {
    name: string;
    abbreviation: string;
  };
}

interface ItemSelectorProps {
  open: boolean;
  onSelect: (item: InventoryItemOption) => void;
  onClose: () => void;
  placeholder?: string;
}

export const ItemSelector: React.FC<ItemSelectorProps> = ({
  open,
  onSelect,
  onClose,
  placeholder = "Search items by name, SKU, or barcode..."
}) => {
  const [query, setQuery] = useState('');
  const [items, setItems] = useState<InventoryItemOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout>();

  // Auto-focus when opened
  useEffect(() => {
    if (open && inputRef.current) {
      inputRef.current.focus();
      setQuery('');
      setSelectedIndex(0);
    }
  }, [open]);

  // Debounced search
  useEffect(() => {
    if (!open) return;

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (query.length < 2) {
      setItems([]);
      return;
    }

    searchTimeoutRef.current = setTimeout(async () => {
      await searchItems(query);
    }, 300);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [query, open]);

  const searchItems = async (searchQuery: string) => {
    if (!searchQuery.trim()) return;

    try {
      setLoading(true);
      const results = await warehouseApi.searchInventoryItems(searchQuery);
      setItems(results);
      setSelectedIndex(0);

      // Auto-select if exact barcode match (barcode scanning behavior)
      if (searchQuery.length >= 6 && /^\d+$/.test(searchQuery)) {
        const exactMatch = results.find(item => item.barcode === searchQuery);
        if (exactMatch && results.length === 1) {
          handleSelect(exactMatch);
          return;
        }
      }
    } catch (error) {
      console.error('Error searching items:', error);
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (item: InventoryItemOption) => {
    onSelect(item);
    setQuery('');
    setItems([]);
    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!items.length) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => Math.min(prev + 1, items.length - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => Math.max(prev - 1, 0));
        break;
      case 'Enter':
        e.preventDefault();
        if (items[selectedIndex]) {
          handleSelect(items[selectedIndex]);
        }
        break;
      case 'Escape':
        e.preventDefault();
        onClose();
        break;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-start justify-center pt-20 z-50">
      <Card className="w-full max-w-2xl mx-4 max-h-[70vh] flex flex-col">
        <CardContent className="p-4 flex-1 flex flex-col">
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              className="pl-10"
            />
          </div>

          <div className="flex-1 overflow-auto" ref={listRef}>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="text-muted-foreground">Searching...</div>
              </div>
            ) : query.length < 2 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="rounded-full bg-muted p-4 mb-4">
                  <Package className="h-8 w-8 text-muted-foreground" />
                </div>
                <p className="text-muted-foreground">
                  Start typing to search for items...
                </p>
              </div>
            ) : items.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="rounded-full bg-muted p-4 mb-4">
                  <Search className="h-8 w-8 text-muted-foreground" />
                </div>
                <p className="text-muted-foreground">
                  No items found for "{query}"
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {items.map((item, index) => (
                  <div
                    key={item.id}
                    className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                      index === selectedIndex
                        ? 'bg-accent border-accent-foreground'
                        : 'hover:bg-muted border-border'
                    }`}
                    onClick={() => handleSelect(item)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">{item.name}</div>
                        <div className="flex items-center gap-2 mt-1">
                          {item.sku && (
                            <Badge variant="outline" className="text-xs">
                              SKU: {item.sku}
                            </Badge>
                          )}
                          {item.barcode && (
                            <Badge variant="outline" className="text-xs flex items-center gap-1">
                              <Barcode className="h-3 w-3" />
                              {item.barcode}
                            </Badge>
                          )}
                          {item.category && (
                            <Badge variant="secondary" className="text-xs">
                              {item.category.name}
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="text-right ml-4">
                        {item.unit_cost && (
                          <div className="text-sm font-medium">
                            {formatCurrency(item.unit_cost)}
                          </div>
                        )}
                        {item.base_unit && (
                          <div className="text-xs text-muted-foreground">
                            per {item.base_unit.abbreviation}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 mt-4 pt-4 border-t">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};