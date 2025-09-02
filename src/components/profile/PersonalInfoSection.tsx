import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Edit, Save, X } from 'lucide-react';
import { EnhancedUserProfile } from '@/hooks/useEnhancedProfile';

interface PersonalInfoSectionProps {
  user: EnhancedUserProfile;
  onUpdate: (updates: Partial<EnhancedUserProfile>) => Promise<any>;
  canEdit: boolean;
}

const PersonalInfoSection: React.FC<PersonalInfoSectionProps> = ({
  user,
  onUpdate,
  canEdit
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    preferred_name: user.preferred_name || '',
    phone: user.phone || '',
    address: user.address || '',
    employee_id: user.employee_id || '',
  });

  const handleSave = async () => {
    try {
      await onUpdate(formData);
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to update personal info:', error);
    }
  };

  const handleCancel = () => {
    setFormData({
      preferred_name: user.preferred_name || '',
      phone: user.phone || '',
      address: user.address || '',
      employee_id: user.employee_id || '',
    });
    setIsEditing(false);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-xl font-semibold">Personal Information</CardTitle>
        {canEdit && (
          <div className="flex gap-2">
            {isEditing ? (
              <>
                <Button size="sm" onClick={handleSave} className="gap-2">
                  <Save className="h-4 w-4" />
                  Save
                </Button>
                <Button size="sm" variant="outline" onClick={handleCancel} className="gap-2">
                  <X className="h-4 w-4" />
                  Cancel
                </Button>
              </>
            ) : (
              <Button size="sm" variant="outline" onClick={() => setIsEditing(true)} className="gap-2">
                <Edit className="h-4 w-4" />
                Edit
              </Button>
            )}
          </div>
        )}
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="name">Full Name</Label>
            <Input
              id="name"
              value={user.name}
              disabled
              className="bg-muted"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="preferred_name">Preferred Name</Label>
            <Input
              id="preferred_name"
              value={isEditing ? formData.preferred_name : (user.preferred_name || 'Not specified')}
              onChange={(e) => setFormData(prev => ({ ...prev, preferred_name: e.target.value }))}
              disabled={!isEditing}
              className={!isEditing ? "bg-muted" : ""}
              placeholder="How would you like to be called?"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              value={user.email}
              disabled
              className="bg-muted"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number</Label>
            <Input
              id="phone"
              value={isEditing ? formData.phone : (user.phone || 'Not specified')}
              onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
              disabled={!isEditing}
              className={!isEditing ? "bg-muted" : ""}
              placeholder="+1 (555) 123-4567"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="employee_id">Employee ID</Label>
            <Input
              id="employee_id"
              value={isEditing ? formData.employee_id : (user.employee_id || 'Not assigned')}
              onChange={(e) => setFormData(prev => ({ ...prev, employee_id: e.target.value }))}
              disabled={!isEditing}
              className={!isEditing ? "bg-muted" : ""}
              placeholder="EMP-001"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="hire_date">Hire Date</Label>
            <Input
              id="hire_date"
              value={user.hire_date ? new Date(user.hire_date).toLocaleDateString() : 'Not specified'}
              disabled
              className="bg-muted"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="address">Address</Label>
          <Textarea
            id="address"
            value={isEditing ? formData.address : (user.address || 'Not specified')}
            onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
            disabled={!isEditing}
            className={!isEditing ? "bg-muted" : ""}
            placeholder="123 Main St, City, State, ZIP"
            rows={3}
          />
        </div>
      </CardContent>
    </Card>
  );
};

export default PersonalInfoSection;