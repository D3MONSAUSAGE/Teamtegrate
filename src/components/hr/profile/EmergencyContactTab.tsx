import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2, AlertCircle } from 'lucide-react';

interface EmergencyContactTabProps {
  userId: string;
}

const EmergencyContactTab: React.FC<EmergencyContactTabProps> = ({ userId }) => {
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    emergency_contact_name: '',
    emergency_contact_phone: '',
    emergency_contact_relationship: '',
  });

  useEffect(() => {
    const fetchData = async () => {
      const { data, error } = await supabase
        .from('users')
        .select('emergency_contact_name, emergency_contact_phone, emergency_contact_relationship')
        .eq('id', userId)
        .single();

      if (data && !error) {
        setFormData({
          emergency_contact_name: data.emergency_contact_name || '',
          emergency_contact_phone: data.emergency_contact_phone || '',
          emergency_contact_relationship: data.emergency_contact_relationship || '',
        });
      }
    };

    fetchData();
  }, [userId]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('users')
        .update(formData)
        .eq('id', userId);

      if (error) throw error;
      toast.success('Emergency contact updated successfully');
    } catch (error) {
      console.error('Error updating emergency contact:', error);
      toast.error('Failed to update emergency contact');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Emergency Contact Information</h3>
        <p className="text-sm text-muted-foreground mb-6">
          This information is kept secure and only used in case of workplace emergencies.
        </p>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="emergency_contact_name">Emergency Contact Name</Label>
          <Input
            id="emergency_contact_name"
            value={formData.emergency_contact_name}
            onChange={(e) =>
              setFormData({ ...formData, emergency_contact_name: e.target.value })
            }
            placeholder="Jane Doe"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="emergency_contact_phone">Emergency Contact Phone</Label>
          <Input
            id="emergency_contact_phone"
            type="tel"
            value={formData.emergency_contact_phone}
            onChange={(e) =>
              setFormData({ ...formData, emergency_contact_phone: e.target.value })
            }
            placeholder="(555) 123-4567"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="emergency_contact_relationship">Relationship to Employee</Label>
          <Input
            id="emergency_contact_relationship"
            value={formData.emergency_contact_relationship}
            onChange={(e) =>
              setFormData({ ...formData, emergency_contact_relationship: e.target.value })
            }
            placeholder="Spouse, Parent, Sibling, Friend, etc."
          />
        </div>
      </div>

      <div className="flex gap-3 p-4 bg-muted rounded-lg">
        <AlertCircle className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
        <div className="text-sm text-muted-foreground">
          <p className="font-medium mb-1">Privacy Notice</p>
          <p>
            Emergency contact information is securely stored and only accessible to authorized HR
            personnel and administrators.
          </p>
        </div>
      </div>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Save Changes
        </Button>
      </div>
    </div>
  );
};

export default EmergencyContactTab;
