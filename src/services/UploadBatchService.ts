import { supabase } from '@/integrations/supabase/client';
import { SalesData } from '@/types/sales';
import { ValidationError } from '@/utils/universalPdfParser';

export interface UploadBatch {
  id: string;
  batch_name?: string;
  total_files: number;
  processed_files: number;
  failed_files: number;
  status: 'processing' | 'completed' | 'failed' | 'cancelled';
  created_at: string;
  completed_at?: string;
}

export interface StagedData {
  id: string;
  batch_id: string;
  file_name: string;
  pos_system: string;
  confidence_score: number;
  extracted_data: SalesData;
  validation_errors: ValidationError[];
  user_corrections: Record<string, any>;
  status: 'pending' | 'approved' | 'rejected' | 'needs_review';
  created_at: string;
}

export interface ValidationLog {
  id: string;
  batch_id?: string;
  sales_data_id?: string;
  validation_type: 'anomaly' | 'missing_field' | 'format_error' | 'business_rule';
  severity: 'info' | 'warning' | 'error' | 'critical';
  field_name?: string;
  expected_value?: string;
  actual_value?: string;
  message: string;
  is_resolved: boolean;
  created_at: string;
}

class UploadBatchService {
  private static instance: UploadBatchService;

  static getInstance(): UploadBatchService {
    if (!UploadBatchService.instance) {
      UploadBatchService.instance = new UploadBatchService();
    }
    return UploadBatchService.instance;
  }

  async getCurrentUser() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('No authenticated user');
    
    const { data: profile } = await supabase
      .from('users')
      .select('organization_id, name, email')
      .eq('id', user.id)
      .single();
    
    if (!profile) throw new Error('User profile not found');
    return { ...user, ...profile };
  }

  async createBatch(batchName?: string, totalFiles: number = 0): Promise<string> {
    try {
      const user = await this.getCurrentUser();

      const { data, error } = await supabase
        .from('upload_batches')
        .insert({
          organization_id: user.organization_id,
          uploaded_by: user.id,
          batch_name: batchName,
          total_files: totalFiles,
          status: 'processing'
        })
        .select('id')
        .single();

      if (error) {
        console.error('[UploadBatchService] Create batch error:', error);
        throw new Error(`Failed to create batch: ${error.message}`);
      }

      console.log('[UploadBatchService] Created batch:', data.id);
      return data.id;
    } catch (error) {
      console.error('[UploadBatchService] Error creating batch:', error);
      throw error;
    }
  }

  async updateBatchProgress(batchId: string, processedFiles: number, failedFiles: number): Promise<void> {
    try {
      const { error } = await supabase
        .from('upload_batches')
        .update({
          processed_files: processedFiles,
          failed_files: failedFiles
        })
        .eq('id', batchId);

      if (error) {
        console.error('[UploadBatchService] Update batch progress error:', error);
        throw new Error(`Failed to update batch progress: ${error.message}`);
      }
    } catch (error) {
      console.error('[UploadBatchService] Error updating batch progress:', error);
      throw error;
    }
  }

  async completeBatch(batchId: string, status: 'completed' | 'failed' | 'cancelled'): Promise<void> {
    try {
      const { error } = await supabase
        .from('upload_batches')
        .update({
          status,
          completed_at: new Date().toISOString()
        })
        .eq('id', batchId);

      if (error) {
        console.error('[UploadBatchService] Complete batch error:', error);
        throw new Error(`Failed to complete batch: ${error.message}`);
      }

      console.log('[UploadBatchService] Completed batch:', batchId, 'with status:', status);
    } catch (error) {
      console.error('[UploadBatchService] Error completing batch:', error);
      throw error;
    }
  }

  async stageData(
    batchId: string, 
    fileName: string, 
    posSystem: string, 
    confidenceScore: number,
    extractedData: SalesData, 
    validationErrors: ValidationError[]
  ): Promise<string> {
    try {
      const user = await this.getCurrentUser();

      const { data, error } = await supabase
        .from('parsed_data_staging')
        .insert({
          organization_id: user.organization_id,
          batch_id: batchId,
          file_name: fileName,
          pos_system: posSystem,
          confidence_score: confidenceScore,
          extracted_data: extractedData as any,
          validation_errors: validationErrors as any,
          status: this.determineStatus(confidenceScore, validationErrors)
        })
        .select('id')
        .single();

      if (error) {
        console.error('[UploadBatchService] Stage data error:', error);
        throw new Error(`Failed to stage data: ${error.message}`);
      }

      // Log validation errors
      if (validationErrors.length > 0) {
        await this.logValidationErrors(batchId, data.id, validationErrors);
      }

      console.log('[UploadBatchService] Staged data:', data.id);
      return data.id;
    } catch (error) {
      console.error('[UploadBatchService] Error staging data:', error);
      throw error;
    }
  }

  private determineStatus(confidenceScore: number, validationErrors: ValidationError[]): 'pending' | 'needs_review' | 'approved' {
    const criticalErrors = validationErrors.filter(e => e.severity === 'critical').length;
    const errors = validationErrors.filter(e => e.severity === 'error').length;
    
    if (criticalErrors > 0 || errors > 2) {
      return 'needs_review';
    }
    
    if (confidenceScore < 70) {
      return 'needs_review';
    }
    
    if (confidenceScore > 90 && validationErrors.length === 0) {
      return 'approved';
    }
    
    return 'pending';
  }

  async logValidationErrors(batchId: string, stagedDataId: string, validationErrors: ValidationError[]): Promise<void> {
    try {
      const user = await this.getCurrentUser();
      
      const logEntries = validationErrors.map(error => ({
        organization_id: user.organization_id,
        batch_id: batchId,
        validation_type: this.mapValidationType(error),
        severity: error.severity,
        field_name: error.field,
        actual_value: error.suggestedValue?.toString(),
        message: error.message
      }));

      const { error } = await supabase
        .from('data_validation_log')
        .insert(logEntries);

      if (error) {
        console.error('[UploadBatchService] Log validation errors error:', error);
        // Don't throw here as this is not critical
      }
    } catch (error) {
      console.error('[UploadBatchService] Error logging validation errors:', error);
      // Don't throw here as this is not critical
    }
  }

  private mapValidationType(error: ValidationError): string {
    if (error.message.includes('not found') || error.message.includes('missing')) {
      return 'missing_field';
    }
    if (error.message.includes('cannot be greater') || error.message.includes('business rule')) {
      return 'business_rule';
    }
    if (error.message.includes('unusually') || error.message.includes('anomaly')) {
      return 'anomaly';
    }
    return 'format_error';
  }

  async getStagedData(batchId: string): Promise<StagedData[]> {
    try {
      const { data, error } = await supabase
        .from('parsed_data_staging')
        .select('*')
        .eq('batch_id', batchId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('[UploadBatchService] Get staged data error:', error);
        throw new Error(`Failed to get staged data: ${error.message}`);
      }

      return (data || []).map(item => ({
        ...item,
        extracted_data: (item.extracted_data as any) || {},
        validation_errors: (item.validation_errors as any) || [],
        user_corrections: (item.user_corrections as any) || {},
        status: item.status as 'pending' | 'approved' | 'rejected' | 'needs_review'
      })) as StagedData[];
    } catch (error) {
      console.error('[UploadBatchService] Error getting staged data:', error);
      throw error;
    }
  }

  async updateStagedData(stagedId: string, corrections: Record<string, any>, status?: 'approved' | 'rejected' | 'needs_review'): Promise<void> {
    try {
      const updateData: any = {
        user_corrections: corrections,
        reviewed_at: new Date().toISOString()
      };

      if (status) {
        updateData.status = status;
        const user = await this.getCurrentUser();
        updateData.reviewed_by = user.id;
      }

      const { error } = await supabase
        .from('parsed_data_staging')
        .update(updateData)
        .eq('id', stagedId);

      if (error) {
        console.error('[UploadBatchService] Update staged data error:', error);
        throw new Error(`Failed to update staged data: ${error.message}`);
      }

      console.log('[UploadBatchService] Updated staged data:', stagedId);
    } catch (error) {
      console.error('[UploadBatchService] Error updating staged data:', error);
      throw error;
    }
  }

  async getBatches(limit: number = 50): Promise<UploadBatch[]> {
    try {
      const { data, error } = await supabase
        .from('upload_batches')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('[UploadBatchService] Get batches error:', error);
        throw new Error(`Failed to get batches: ${error.message}`);
      }

      return (data || []).map(batch => ({
        ...batch,
        status: batch.status as 'processing' | 'completed' | 'failed' | 'cancelled'
      })) as UploadBatch[];
    } catch (error) {
      console.error('[UploadBatchService] Error getting batches:', error);
      throw error;
    }
  }

  async getValidationLogs(batchId?: string, limit: number = 100): Promise<ValidationLog[]> {
    try {
      let query = supabase
        .from('data_validation_log')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (batchId) {
        query = query.eq('batch_id', batchId);
      }

      const { data, error } = await query;

      if (error) {
        console.error('[UploadBatchService] Get validation logs error:', error);
        throw new Error(`Failed to get validation logs: ${error.message}`);
      }

      return (data || []).map(log => ({
        ...log,
        validation_type: log.validation_type as 'anomaly' | 'missing_field' | 'format_error' | 'business_rule',
        severity: log.severity as 'info' | 'warning' | 'error' | 'critical'
      })) as ValidationLog[];
    } catch (error) {
      console.error('[UploadBatchService] Error getting validation logs:', error);
      throw error;
    }
  }

  async resolveValidationError(logId: string): Promise<void> {
    try {
      const user = await this.getCurrentUser();

      const { error } = await supabase
        .from('data_validation_log')
        .update({
          is_resolved: true,
          resolved_by: user.id,
          resolved_at: new Date().toISOString()
        })
        .eq('id', logId);

      if (error) {
        console.error('[UploadBatchService] Resolve validation error error:', error);
        throw new Error(`Failed to resolve validation error: ${error.message}`);
      }

      console.log('[UploadBatchService] Resolved validation error:', logId);
    } catch (error) {
      console.error('[UploadBatchService] Error resolving validation error:', error);
      throw error;
    }
  }

  // Real-time subscription for batch updates
  subscribeToBatchUpdates(callback: (payload: any) => void) {
    const channel = supabase
      .channel('batch-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'upload_batches'
        },
        callback
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'parsed_data_staging'
        },
        callback
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }
}

export const uploadBatchService = UploadBatchService.getInstance();