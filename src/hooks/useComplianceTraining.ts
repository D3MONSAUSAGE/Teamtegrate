import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/auth/AuthProvider';

export interface ComplianceTemplate {
  id: string;
  title: string;
  description: string;
  jurisdiction: string;
  external_base_url: string;
  url_parameters: any;
  language_options: string[];
  role_classifications: string[];
  completion_method: string;
  is_required: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ComplianceRecord {
  id: string;
  user_id: string;
  template_id: string;
  course_id?: string;
  language_selected: string;
  role_classification: string;
  external_training_url?: string;
  completion_date?: string;
  certificate_url?: string;
  is_completed: boolean;
  completion_notes?: string;
  created_at: string;
  updated_at: string;
  template?: ComplianceTemplate | null;
}

export const useComplianceTraining = () => {
  const { user } = useAuth();
  const [templates, setTemplates] = useState<ComplianceTemplate[]>([]);
  const [userRecords, setUserRecords] = useState<ComplianceRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTemplates = async () => {
    try {
      const { data, error } = await supabase
        .from('compliance_training_templates')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTemplates(data || []);
    } catch (err) {
      console.error('Error fetching compliance templates:', err);
      setError('Failed to load compliance training templates');
    }
  };

  const fetchUserRecords = async () => {
    if (!user) return;

    try {
      // First get the records
      const { data: records, error: recordsError } = await supabase
        .from('compliance_training_records')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (recordsError) throw recordsError;

      // Then get templates separately and join them
      const templateIds = records?.map(r => r.template_id).filter(Boolean) || [];
      let templatesMap: Record<string, ComplianceTemplate> = {};

      if (templateIds.length > 0) {
        const { data: templates, error: templatesError } = await supabase
          .from('compliance_training_templates')
          .select('*')
          .in('id', templateIds);

        if (!templatesError && templates) {
          templatesMap = templates.reduce((acc, template) => ({
            ...acc,
            [template.id]: template
          }), {});
        }
      }

      // Combine records with templates
      const recordsWithTemplates: ComplianceRecord[] = (records || []).map(record => ({
        ...record,
        template: templatesMap[record.template_id] || null
      }));

      setUserRecords(recordsWithTemplates);
    } catch (err) {
      console.error('Error fetching user compliance records:', err);
      setError('Failed to load compliance training records');
    }
  };

  const fetchAllRecords = async () => {
    try {
      // Get all records
      const { data: records, error: recordsError } = await supabase
        .from('compliance_training_records')
        .select('*')
        .order('created_at', { ascending: false });

      if (recordsError) throw recordsError;

      // Get templates and users separately
      const templateIds = records?.map(r => r.template_id).filter(Boolean) || [];
      const userIds = records?.map(r => r.user_id).filter(Boolean) || [];

      let templatesMap: Record<string, ComplianceTemplate> = {};
      let usersMap: Record<string, { name: string; email: string }> = {};

      if (templateIds.length > 0) {
        const { data: templates } = await supabase
          .from('compliance_training_templates')
          .select('*')
          .in('id', templateIds);

        if (templates) {
          templatesMap = templates.reduce((acc, template) => ({
            ...acc,
            [template.id]: template
          }), {});
        }
      }

      if (userIds.length > 0) {
        const { data: users } = await supabase
          .from('users')
          .select('id, name, email')
          .in('id', userIds);

        if (users) {
          usersMap = users.reduce((acc, user) => ({
            ...acc,
            [user.id]: { name: user.name, email: user.email }
          }), {});
        }
      }

      // Combine data
      const enrichedRecords = (records || []).map(record => ({
        ...record,
        template: templatesMap[record.template_id] || null,
        user: usersMap[record.user_id] || null
      }));

      return enrichedRecords;
    } catch (err) {
      console.error('Error fetching all compliance records:', err);
      setError('Failed to load compliance training records');
      return [];
    }
  };

  const getRequiredTrainings = () => {
    if (!user) return [];

    const requiredTemplates = templates.filter(t => t.is_required);
    const completedTemplateIds = userRecords
      .filter(r => r.is_completed)
      .map(r => r.template_id);

    return requiredTemplates.filter(t => !completedTemplateIds.includes(t.id));
  };

  const getCompletedTrainings = () => {
    return userRecords.filter(r => r.is_completed);
  };

  const getInProgressTrainings = () => {
    return userRecords.filter(r => !r.is_completed && r.external_training_url);
  };

  const createComplianceRecord = async (
    templateId: string,
    language: string,
    roleClassification: string,
    externalUrl: string
  ) => {
    if (!user) throw new Error('User not authenticated');

    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase
        .from('compliance_training_records')
        .insert([{
          user_id: user.id,
          organization_id: user.organizationId,
          template_id: templateId,
          language_selected: language,
          role_classification: roleClassification,
          external_training_url: externalUrl,
          is_completed: false
        }])
        .select()
        .single();

      if (error) throw error;
      
      await fetchUserRecords();
      return data;
    } catch (err) {
      console.error('Error creating compliance record:', err);
      setError('Failed to create compliance training record');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateComplianceRecord = async (
    recordId: string,
    updates: Partial<ComplianceRecord>
  ) => {
    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase
        .from('compliance_training_records')
        .update(updates)
        .eq('id', recordId)
        .select()
        .single();

      if (error) throw error;
      
      await fetchUserRecords();
      return data;
    } catch (err) {
      console.error('Error updating compliance record:', err);
      setError('Failed to update compliance training record');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const markTrainingCompleted = async (
    recordId: string,
    certificateUrl?: string,
    completionNotes?: string
  ) => {
    return updateComplianceRecord(recordId, {
      is_completed: true,
      completion_date: new Date().toISOString(),
      certificate_url: certificateUrl,
      completion_notes: completionNotes
    });
  };

  const getComplianceStats = () => {
    const total = templates.filter(t => t.is_required).length;
    const completed = getCompletedTrainings().length;
    const inProgress = getInProgressTrainings().length;
    const pending = getRequiredTrainings().length;

    return {
      total,
      completed,
      inProgress,
      pending,
      completionRate: total > 0 ? (completed / total) * 100 : 0
    };
  };

  useEffect(() => {
    fetchTemplates();
  }, []);

  useEffect(() => {
    if (user) {
      fetchUserRecords();
    }
  }, [user]);

  return {
    templates,
    userRecords,
    loading,
    error,
    fetchTemplates,
    fetchUserRecords,
    fetchAllRecords,
    getRequiredTrainings,
    getCompletedTrainings,
    getInProgressTrainings,
    createComplianceRecord,
    updateComplianceRecord,
    markTrainingCompleted,
    getComplianceStats
  };
};