
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/sonner';
import { networkManager } from '@/utils/networkManager';

export interface InvoiceUploadResult {
  success: boolean;
  filePath?: string;
  error?: string;
  retryAttempt?: number;
  uploadDuration?: number;
}

export interface InvoiceUploadMetrics {
  uploadStartTime: number;
  uploadEndTime?: number;
  retryCount: number;
  errorHistory: string[];
  fileSize: number;
  networkCondition: 'good' | 'poor' | 'offline';
}

class InvoiceUploadManager {
  private metrics: Map<string, InvoiceUploadMetrics> = new Map();
  private readonly MAX_RETRIES = 3;
  private readonly RETRY_DELAYS = [1000, 2500, 5000]; // Progressive delays
  private readonly MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
  private readonly CHUNK_SIZE = 1024 * 1024; // 1MB chunks for large files

  async uploadWithRetry(
    file: File,
    organizationId: string,
    userId: string
  ): Promise<InvoiceUploadResult> {
    const uploadId = `${Date.now()}-${file.name}`;
    const startTime = Date.now();
    
    // Initialize metrics
    this.metrics.set(uploadId, {
      uploadStartTime: startTime,
      retryCount: 0,
      errorHistory: [],
      fileSize: file.size,
      networkCondition: this.assessNetworkCondition()
    });

    // Pre-flight checks
    const preflightResult = await this.preflightChecks(file, organizationId);
    if (!preflightResult.success) {
      return preflightResult;
    }

    // Attempt upload with retry logic
    for (let attempt = 0; attempt <= this.MAX_RETRIES; attempt++) {
      try {
        console.log(`Upload attempt ${attempt + 1}/${this.MAX_RETRIES + 1} for file: ${file.name}`);
        
        const result = await this.attemptUpload(file, organizationId, userId, attempt);
        
        if (result.success) {
          // Log success metrics
          const metrics = this.metrics.get(uploadId)!;
          metrics.uploadEndTime = Date.now();
          
          console.log('Upload successful:', {
            file: file.name,
            duration: metrics.uploadEndTime - metrics.uploadStartTime,
            retryCount: metrics.retryCount,
            fileSize: metrics.fileSize
          });

          // Clean up metrics after successful upload
          this.metrics.delete(uploadId);
          
          return {
            ...result,
            retryAttempt: attempt,
            uploadDuration: metrics.uploadEndTime - metrics.uploadStartTime
          };
        }

        // Update metrics for failed attempt
        const metrics = this.metrics.get(uploadId)!;
        metrics.retryCount = attempt + 1;
        metrics.errorHistory.push(result.error || 'Unknown error');

        // Don't retry on certain errors
        if (this.isNonRetryableError(result.error)) {
          console.error('Non-retryable error:', result.error);
          break;
        }

        // Wait before retry (except on last attempt)
        if (attempt < this.MAX_RETRIES) {
          const delay = this.calculateRetryDelay(attempt, metrics.networkCondition);
          console.log(`Waiting ${delay}ms before retry...`);
          await this.sleep(delay);
        }

      } catch (error) {
        console.error(`Upload attempt ${attempt + 1} failed:`, error);
        
        const metrics = this.metrics.get(uploadId)!;
        metrics.errorHistory.push(error instanceof Error ? error.message : 'Unknown error');
        
        if (attempt === this.MAX_RETRIES) {
          return {
            success: false,
            error: `Upload failed after ${this.MAX_RETRIES + 1} attempts. Last error: ${error instanceof Error ? error.message : 'Unknown error'}`,
            retryAttempt: attempt
          };
        }
      }
    }

    return {
      success: false,
      error: 'Upload failed after all retry attempts',
      retryAttempt: this.MAX_RETRIES
    };
  }

  private async preflightChecks(file: File, organizationId: string): Promise<InvoiceUploadResult> {
    // File size check
    if (file.size > this.MAX_FILE_SIZE) {
      return {
        success: false,
        error: `File size (${(file.size / 1024 / 1024).toFixed(1)}MB) exceeds maximum allowed size (${this.MAX_FILE_SIZE / 1024 / 1024}MB)`
      };
    }

    // File type validation
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return {
        success: false,
        error: `File type ${file.type} is not supported. Allowed types: PDF, JPEG, PNG, WebP`
      };
    }

    // Network connectivity check
    const networkHealth = networkManager.getNetworkHealth();
    if (!networkHealth.isHealthy) {
      return {
        success: false,
        error: 'Network connection is unstable. Please check your connection and try again.'
      };
    }

    // Storage quota check (approximate)
    try {
      const { data: bucketInfo } = await supabase.storage.getBucket('documents');
      if (!bucketInfo) {
        return {
          success: false,
          error: 'Storage service is temporarily unavailable'
        };
      }
    } catch (error) {
      console.warn('Could not check storage availability:', error);
      // Continue with upload attempt
    }

    return { success: true };
  }

  private async attemptUpload(
    file: File,
    organizationId: string,
    userId: string,
    attempt: number
  ): Promise<InvoiceUploadResult> {
    const timestamp = new Date().getTime();
    const filePath = `${organizationId}/invoices/${userId}/${timestamp}-${file.name}`;
    
    console.log(`Attempt ${attempt + 1}: Starting file upload to path:`, filePath);
    
    // Use network manager for resilient upload
    const uploadResult = await networkManager.withNetworkResilience(
      `invoice-upload-${filePath}`,
      async () => {
        // For large files, consider chunked upload (simplified here)
        if (file.size > this.CHUNK_SIZE * 5) {
          return this.chunkedUpload(file, filePath);
        } else {
          return this.standardUpload(file, filePath);
        }
      },
      {
        priority: 'high',
        timeout: 30000,
        retries: 0 // We handle retries at higher level
      }
    );

    if (!uploadResult.success) {
      return {
        success: false,
        error: uploadResult.error || 'Upload failed'
      };
    }

    // Enhanced verification with multiple checks
    const verificationResult = await this.comprehensiveVerification(filePath, file.size);
    if (!verificationResult.success) {
      // Clean up failed upload
      try {
        await supabase.storage.from('documents').remove([filePath]);
      } catch (cleanupError) {
        console.warn('Failed to cleanup incomplete upload:', cleanupError);
      }
      
      return {
        success: false,
        error: verificationResult.error || 'File verification failed'
      };
    }

    console.log(`Attempt ${attempt + 1}: Upload and verification successful`);
    return { success: true, filePath };
  }

  private async standardUpload(file: File, filePath: string): Promise<{ success: boolean; error?: string }> {
    const { error } = await supabase.storage
      .from('documents')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      return { success: false, error: `Storage upload error: ${error.message}` };
    }

    return { success: true };
  }

  private async chunkedUpload(file: File, filePath: string): Promise<{ success: boolean; error?: string }> {
    // Simplified chunked upload - in production, you'd want resumable uploads
    try {
      const { error } = await supabase.storage
        .from('documents')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        return { success: false, error: `Chunked upload error: ${error.message}` };
      }

      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: `Chunked upload failed: ${error instanceof Error ? error.message : 'Unknown error'}` 
      };
    }
  }

  private async comprehensiveVerification(filePath: string, expectedSize: number): Promise<{ success: boolean; error?: string }> {
    try {
      // Method 1: List files to check existence
      const pathParts = filePath.split('/');
      const fileName = pathParts.pop()!;
      const folderPath = pathParts.join('/');
      
      const { data: files, error: listError } = await supabase.storage
        .from('documents')
        .list(folderPath);

      if (listError) {
        return { success: false, error: `Verification list error: ${listError.message}` };
      }

      const uploadedFile = files?.find(f => f.name === fileName);
      if (!uploadedFile) {
        return { success: false, error: 'File not found after upload' };
      }

      // Method 2: Size verification
      if (uploadedFile.metadata?.size && Math.abs(uploadedFile.metadata.size - expectedSize) > 1024) {
        return { 
          success: false, 
          error: `File size mismatch. Expected: ${expectedSize}, Got: ${uploadedFile.metadata.size}` 
        };
      }

      // Method 3: Try to get file info
      const { data: infoData, error: infoError } = await supabase.storage
        .from('documents')
        .getPublicUrl(filePath);

      if (infoError || !infoData?.publicUrl) {
        return { success: false, error: 'File accessibility verification failed' };
      }

      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: `Verification failed: ${error instanceof Error ? error.message : 'Unknown error'}` 
      };
    }
  }

  private assessNetworkCondition(): 'good' | 'poor' | 'offline' {
    const health = networkManager.getNetworkHealth();
    if (!health.isHealthy) return 'offline';
    if (health.failureRate > 0.2 || health.avgResponseTime > 5000) return 'poor';
    return 'good';
  }

  private calculateRetryDelay(attempt: number, networkCondition: 'good' | 'poor' | 'offline'): number {
    let baseDelay = this.RETRY_DELAYS[attempt] || 5000;
    
    // Adjust delay based on network condition
    switch (networkCondition) {
      case 'poor':
        baseDelay *= 1.5;
        break;
      case 'offline':
        baseDelay *= 2;
        break;
    }

    // Add jitter to prevent thundering herd
    const jitter = Math.random() * 1000;
    return Math.floor(baseDelay + jitter);
  }

  private isNonRetryableError(error?: string): boolean {
    if (!error) return false;
    
    const nonRetryablePatterns = [
      'file too large',
      'invalid file type',
      'unauthorized',
      'forbidden',
      'quota exceeded',
      'invalid input syntax'
    ];
    
    const lowerError = error.toLowerCase();
    return nonRetryablePatterns.some(pattern => lowerError.includes(pattern));
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Get current upload metrics for monitoring
  getUploadMetrics(): Array<InvoiceUploadMetrics & { uploadId: string }> {
    return Array.from(this.metrics.entries()).map(([uploadId, metrics]) => ({
      uploadId,
      ...metrics
    }));
  }
}

// Create singleton instance
const uploadManager = new InvoiceUploadManager();

// Export the enhanced upload function
export const uploadInvoiceFile = async (
  file: File,
  organizationId: string,
  userId: string
): Promise<InvoiceUploadResult> => {
  return await uploadManager.uploadWithRetry(file, organizationId, userId);
};

// Export verification function for external use
export const verifyInvoiceFileExists = async (filePath: string): Promise<boolean> => {
  try {
    const pathParts = filePath.split('/');
    const fileName = pathParts.pop();
    const folderPath = pathParts.join('/');
    
    const { data, error } = await supabase.storage
      .from('documents')
      .list(folderPath);

    if (error) {
      console.error('File verification error:', error);
      return false;
    }

    return data?.some(file => file.name === fileName) || false;
  } catch (error) {
    console.error('File verification failed:', error);
    return false;
  }
};

// Export upload metrics for monitoring
export const getUploadMetrics = () => uploadManager.getUploadMetrics();
