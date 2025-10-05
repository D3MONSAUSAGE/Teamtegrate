import React, { useState } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Building2 } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { vendorsApi } from '@/contexts/inventory/api/vendors';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';

interface VendorSelectorProps {
  value: string;
  onValueChange: (value: string) => void;
  disabled?: boolean;
}

export const VendorSelector: React.FC<VendorSelectorProps> = ({
  value,
  onValueChange,
  disabled
}) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newVendorName, setNewVendorName] = useState('');
  const [newVendorEmail, setNewVendorEmail] = useState('');
  const [newVendorPhone, setNewVendorPhone] = useState('');

  const { data: vendors, isLoading } = useQuery({
    queryKey: ['vendors'],
    queryFn: () => vendorsApi.getAll()
  });

  const createVendor = useMutation({
    mutationFn: (vendor: { name: string; email?: string; phone?: string; is_active: boolean }) => 
      vendorsApi.create(vendor),
    onSuccess: (newVendor) => {
      queryClient.invalidateQueries({ queryKey: ['vendors'] });
      toast.success('Vendor created successfully');
      onValueChange(newVendor.id);
      setIsDialogOpen(false);
      setNewVendorName('');
      setNewVendorEmail('');
      setNewVendorPhone('');
    },
    onError: (error: Error) => {
      toast.error(`Failed to create vendor: ${error.message}`);
    }
  });

  const handleCreateVendor = () => {
    if (!newVendorName.trim()) {
      toast.error('Vendor name is required');
      return;
    }

    createVendor.mutate({
      name: newVendorName.trim(),
      email: newVendorEmail.trim() || undefined,
      phone: newVendorPhone.trim() || undefined,
      is_active: true
    });
  };

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <Select value={value} onValueChange={onValueChange} disabled={disabled || isLoading}>
          <SelectTrigger className="flex-1 border-2">
            <SelectValue placeholder={isLoading ? "Loading vendors..." : "Select vendor"} />
          </SelectTrigger>
          <SelectContent>
            {vendors?.map((vendor) => (
              <SelectItem key={vendor.id} value={vendor.id}>
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  <span>{vendor.name}</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button type="button" variant="outline" size="icon" disabled={disabled}>
              <Plus className="h-4 w-4" />
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Vendor</DialogTitle>
              <DialogDescription>
                Create a new vendor to associate with this invoice
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="vendorName">Vendor Name *</Label>
                <Input
                  id="vendorName"
                  value={newVendorName}
                  onChange={(e) => setNewVendorName(e.target.value)}
                  placeholder="Enter vendor name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="vendorEmail">Email</Label>
                <Input
                  id="vendorEmail"
                  type="email"
                  value={newVendorEmail}
                  onChange={(e) => setNewVendorEmail(e.target.value)}
                  placeholder="vendor@company.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="vendorPhone">Phone</Label>
                <Input
                  id="vendorPhone"
                  type="tel"
                  value={newVendorPhone}
                  onChange={(e) => setNewVendorPhone(e.target.value)}
                  placeholder="+1 (555) 000-0000"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateVendor} disabled={createVendor.isPending}>
                {createVendor.isPending ? 'Creating...' : 'Create Vendor'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};
