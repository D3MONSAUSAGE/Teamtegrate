import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useRecruitmentPositions } from '@/hooks/recruitment/useRecruitmentPositions';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { UserPlus } from 'lucide-react';
import type { CandidateSource } from '@/types/recruitment';

interface CreateCandidateDialogProps {
  positionId?: string;
  children?: React.ReactNode;
}

export function CreateCandidateDialog({ positionId, children }: CreateCandidateDialogProps) {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { positions } = useRecruitmentPositions();

  const [formData, setFormData] = useState({
    position_id: positionId || '',
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    source: 'direct' as CandidateSource,
    source_details: '',
    resume_url: '',
    cover_letter_url: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('Not authenticated');

      const { data: userData } = await supabase
        .from('users')
        .select('organization_id')
        .eq('id', user.user.id)
        .single();

      if (!userData) throw new Error('User data not found');

      const { error } = await supabase.from('recruitment_candidates').insert({
        organization_id: userData.organization_id,
        position_id: formData.position_id,
        first_name: formData.first_name,
        last_name: formData.last_name,
        email: formData.email,
        phone: formData.phone || null,
        source: formData.source,
        source_details: formData.source_details || null,
        resume_url: formData.resume_url || null,
        cover_letter_url: formData.cover_letter_url || null,
        applied_date: new Date().toISOString(),
        status: 'active',
        created_by: user.user.id,
      });

      if (error) throw error;

      toast.success('Candidate added successfully');
      setOpen(false);
      setFormData({
        position_id: positionId || '',
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
        source: 'direct',
        source_details: '',
        resume_url: '',
        cover_letter_url: '',
      });
    } catch (error: any) {
      toast.error(error.message || 'Failed to add candidate');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button>
            <UserPlus className="w-4 h-4 mr-2" />
            Add Candidate
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Candidate</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="position_id">Position *</Label>
            <Select
              value={formData.position_id}
              onValueChange={(value) => setFormData({ ...formData, position_id: value })}
              required
            >
              <SelectTrigger id="position_id">
                <SelectValue placeholder="Select position" />
              </SelectTrigger>
              <SelectContent>
                {positions.map((position) => (
                  <SelectItem key={position.id} value={position.id}>
                    {position.job_title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="first_name">First Name *</Label>
              <Input
                id="first_name"
                value={formData.first_name}
                onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="last_name">Last Name *</Label>
              <Input
                id="last_name"
                value={formData.last_name}
                onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="source">Source *</Label>
              <Select
                value={formData.source}
                onValueChange={(value: CandidateSource) => setFormData({ ...formData, source: value })}
              >
                <SelectTrigger id="source">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="indeed">Indeed</SelectItem>
                  <SelectItem value="linkedin">LinkedIn</SelectItem>
                  <SelectItem value="referral">Referral</SelectItem>
                  <SelectItem value="direct">Direct Apply</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="source_details">Source Details</Label>
              <Input
                id="source_details"
                value={formData.source_details}
                onChange={(e) => setFormData({ ...formData, source_details: e.target.value })}
                placeholder="e.g., John Smith referred"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="resume_url">Resume URL</Label>
            <Input
              id="resume_url"
              type="url"
              value={formData.resume_url}
              onChange={(e) => setFormData({ ...formData, resume_url: e.target.value })}
              placeholder="https://"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="cover_letter_url">Cover Letter URL</Label>
            <Input
              id="cover_letter_url"
              type="url"
              value={formData.cover_letter_url}
              onChange={(e) => setFormData({ ...formData, cover_letter_url: e.target.value })}
              placeholder="https://"
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Adding...' : 'Add Candidate'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
