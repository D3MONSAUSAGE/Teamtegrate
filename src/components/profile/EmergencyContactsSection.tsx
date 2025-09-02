import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Plus, Edit, Trash2, Star, Phone, Mail, MapPin } from 'lucide-react';
import { useEmergencyContacts, EmergencyContact } from '@/hooks/useEmergencyContacts';

interface EmergencyContactsSectionProps {
  canEdit: boolean;
}

const EmergencyContactsSection: React.FC<EmergencyContactsSectionProps> = ({ canEdit }) => {
  const { contacts, loading, addContact, updateContact, deleteContact, setPrimaryContact } = useEmergencyContacts();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<EmergencyContact | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    relationship: '',
    phone_primary: '',
    phone_secondary: '',
    email: '',
    address: '',
    is_primary: false,
  });

  const relationshipOptions = [
    'Spouse',
    'Parent',
    'Child',
    'Sibling',
    'Friend',
    'Colleague',
    'Other Family Member',
    'Other'
  ];

  const resetForm = () => {
    setFormData({
      name: '',
      relationship: '',
      phone_primary: '',
      phone_secondary: '',
      email: '',
      address: '',
      is_primary: false,
    });
    setEditingContact(null);
  };

  const handleOpenDialog = (contact?: EmergencyContact) => {
    if (contact) {
      setEditingContact(contact);
      setFormData({
        name: contact.name,
        relationship: contact.relationship,
        phone_primary: contact.phone_primary,
        phone_secondary: contact.phone_secondary || '',
        email: contact.email || '',
        address: contact.address || '',
        is_primary: contact.is_primary,
      });
    } else {
      resetForm();
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    resetForm();
  };

  const handleSubmit = async () => {
    try {
      if (editingContact) {
        await updateContact(editingContact.id, formData);
      } else {
        await addContact(formData);
      }
      handleCloseDialog();
    } catch (error) {
      console.error('Failed to save emergency contact:', error);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteContact(id);
    } catch (error) {
      console.error('Failed to delete emergency contact:', error);
    }
  };

  const handleSetPrimary = async (id: string) => {
    try {
      await setPrimaryContact(id);
    } catch (error) {
      console.error('Failed to set primary contact:', error);
    }
  };

  if (loading && contacts.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Emergency Contacts</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            Loading emergency contacts...
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-xl font-semibold">Emergency Contacts</CardTitle>
        {canEdit && (
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => handleOpenDialog()} className="gap-2">
                <Plus className="h-4 w-4" />
                Add Contact
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>
                  {editingContact ? 'Edit Emergency Contact' : 'Add Emergency Contact'}
                </DialogTitle>
                <DialogDescription>
                  Add someone who can be contacted in case of an emergency.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="John Doe"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="relationship">Relationship *</Label>
                    <Select
                      value={formData.relationship}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, relationship: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select relationship" />
                      </SelectTrigger>
                      <SelectContent>
                        {relationshipOptions.map(option => (
                          <SelectItem key={option} value={option}>{option}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="phone_primary">Primary Phone *</Label>
                    <Input
                      id="phone_primary"
                      value={formData.phone_primary}
                      onChange={(e) => setFormData(prev => ({ ...prev, phone_primary: e.target.value }))}
                      placeholder="+1 (555) 123-4567"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone_secondary">Secondary Phone</Label>
                    <Input
                      id="phone_secondary"
                      value={formData.phone_secondary}
                      onChange={(e) => setFormData(prev => ({ ...prev, phone_secondary: e.target.value }))}
                      placeholder="+1 (555) 987-6543"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="john.doe@email.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address">Address</Label>
                  <Input
                    id="address"
                    value={formData.address}
                    onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                    placeholder="123 Main St, City, State, ZIP"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={handleCloseDialog}>
                  Cancel
                </Button>
                <Button onClick={handleSubmit} disabled={!formData.name || !formData.relationship || !formData.phone_primary}>
                  {editingContact ? 'Update' : 'Add'} Contact
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </CardHeader>
      <CardContent>
        {contacts.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-muted-foreground mb-4">
              No emergency contacts added yet.
            </div>
            {canEdit && (
              <Button onClick={() => handleOpenDialog()} variant="outline" className="gap-2">
                <Plus className="h-4 w-4" />
                Add Your First Emergency Contact
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {contacts.map((contact) => (
              <div key={contact.id} className="border rounded-lg p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="font-semibold">{contact.name}</h4>
                      {contact.is_primary && (
                        <Badge variant="secondary" className="gap-1">
                          <Star className="h-3 w-3" />
                          Primary
                        </Badge>
                      )}
                      <Badge variant="outline">{contact.relationship}</Badge>
                    </div>
                    <div className="space-y-1 text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4" />
                        {contact.phone_primary}
                        {contact.phone_secondary && (
                          <span className="text-xs">• {contact.phone_secondary}</span>
                        )}
                      </div>
                      {contact.email && (
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4" />
                          {contact.email}
                        </div>
                      )}
                      {contact.address && (
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4" />
                          {contact.address}
                        </div>
                      )}
                    </div>
                  </div>
                  {canEdit && (
                    <div className="flex gap-1">
                      {!contact.is_primary && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleSetPrimary(contact.id)}
                          className="gap-1"
                        >
                          <Star className="h-3 w-3" />
                          Set Primary
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleOpenDialog(contact)}
                        className="gap-1"
                      >
                        <Edit className="h-3 w-3" />
                        Edit
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button size="sm" variant="outline" className="gap-1 text-destructive hover:text-destructive">
                            <Trash2 className="h-3 w-3" />
                            Delete
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Emergency Contact</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete {contact.name} from your emergency contacts? 
                              This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDelete(contact.id)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default EmergencyContactsSection;