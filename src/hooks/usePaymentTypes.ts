import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { PaymentType } from '@/types/invoices';
import { toast } from 'sonner';

export const usePaymentTypes = () => {
  const { user } = useAuth();
  const [paymentTypes, setPaymentTypes] = useState<PaymentType[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchPaymentTypes = async () => {
    if (!user?.organizationId) return;
    
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('payment_types')
        .select('*')
        .eq('organization_id', user.organizationId)
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      setPaymentTypes(data || []);
    } catch (error: any) {
      toast.error('Failed to load payment types');
      console.error('Error fetching payment types:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPaymentTypes();
  }, [user?.organizationId]);

  const createPaymentType = async (data: Omit<PaymentType, 'id' | 'organization_id' | 'created_by' | 'created_at' | 'updated_at'>) => {
    if (!user?.organizationId || !user?.id) return;

    try {
      const { error } = await supabase
        .from('payment_types')
        .insert([{
          organization_id: user.organizationId,
          created_by: user.id,
          ...data
        }]);

      if (error) throw error;
      toast.success('Payment type created successfully');
      fetchPaymentTypes();
    } catch (error: any) {
      toast.error(error.message || 'Failed to create payment type');
      throw error;
    }
  };

  const updatePaymentType = async (id: string, data: Partial<PaymentType>) => {
    try {
      const { error } = await supabase
        .from('payment_types')
        .update(data)
        .eq('id', id);

      if (error) throw error;
      toast.success('Payment type updated successfully');
      fetchPaymentTypes();
    } catch (error: any) {
      toast.error(error.message || 'Failed to update payment type');
      throw error;
    }
  };

  const deletePaymentType = async (id: string) => {
    try {
      const { error } = await supabase
        .from('payment_types')
        .update({ is_active: false })
        .eq('id', id);

      if (error) throw error;
      toast.success('Payment type deleted successfully');
      fetchPaymentTypes();
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete payment type');
      throw error;
    }
  };

  return {
    paymentTypes,
    isLoading,
    createPaymentType,
    updatePaymentType,
    deletePaymentType,
    refetch: fetchPaymentTypes
  };
};