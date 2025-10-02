import { useState, useCallback } from 'react';
import { toast } from '@/hooks/use-toast';

export interface BatchUploadConfig {
  maxConcurrent?: number;
  maxFileSize?: number; // in MB
  maxTotalSize?: number; // in MB
  chunkSize?: number;
}

export interface FileAnalysis {
  totalSize: number;
  averageSize: number;
  recommendedBatchSize: number;
  estimatedTime: number; // in seconds
  warningMessage?: string;
}

const DEFAULT_CONFIG: Required<BatchUploadConfig> = {
  maxConcurrent: 3,
  maxFileSize: 50,
  maxTotalSize: 200,
  chunkSize: 5
};

export function useBatchUpload(config: BatchUploadConfig = {}) {
  const [processingChunk, setProcessingChunk] = useState(0);
  const [totalChunks, setTotalChunks] = useState(0);
  
  const finalConfig = { ...DEFAULT_CONFIG, ...config };

  const analyzeFiles = useCallback((files: File[]): FileAnalysis => {
    const totalSize = files.reduce((acc, file) => acc + file.size, 0) / (1024 * 1024); // Convert to MB
    const averageSize = totalSize / files.length;
    
    let recommendedBatchSize: number;
    let warningMessage: string | undefined;
    
    // Smart recommendations based on file sizes
    if (averageSize < 2) {
      recommendedBatchSize = Math.min(20, files.length);
      if (files.length > 20) {
        warningMessage = 'Consider uploading in batches of 15-20 files for optimal performance';
      }
    } else if (averageSize < 10) {
      recommendedBatchSize = Math.min(10, files.length);
      if (files.length > 10) {
        warningMessage = 'For medium-sized files, we recommend batches of 8-10 files';
      }
    } else {
      recommendedBatchSize = Math.min(5, files.length);
      if (files.length > 5) {
        warningMessage = 'Large files detected. Please upload in batches of 3-5 files';
      }
    }
    
    // Check total size limit
    if (totalSize > finalConfig.maxTotalSize) {
      warningMessage = `Total batch size (${totalSize.toFixed(1)}MB) exceeds recommended limit of ${finalConfig.maxTotalSize}MB. Consider splitting into smaller batches.`;
    }
    
    // Estimate processing time (rough estimate: 2 seconds per file)
    const estimatedTime = files.length * 2;
    
    return {
      totalSize,
      averageSize,
      recommendedBatchSize,
      estimatedTime,
      warningMessage
    };
  }, [finalConfig.maxTotalSize]);

  const processInChunks = useCallback(async <T,>(
    items: T[],
    processor: (item: T, index: number) => Promise<void>,
    onProgress?: (processed: number, total: number) => void
  ): Promise<{ successful: number; failed: number }> => {
    const chunks: T[][] = [];
    for (let i = 0; i < items.length; i += finalConfig.chunkSize) {
      chunks.push(items.slice(i, i + finalConfig.chunkSize));
    }
    
    setTotalChunks(chunks.length);
    
    let successful = 0;
    let failed = 0;
    let processedCount = 0;
    
    for (let chunkIndex = 0; chunkIndex < chunks.length; chunkIndex++) {
      setProcessingChunk(chunkIndex + 1);
      const chunk = chunks[chunkIndex];
      
      // Process chunk with concurrency limit
      const chunkPromises: Promise<void>[] = [];
      const concurrentBatch: T[] = [];
      
      for (const item of chunk) {
        concurrentBatch.push(item);
        
        if (concurrentBatch.length >= finalConfig.maxConcurrent || item === chunk[chunk.length - 1]) {
          const batch = [...concurrentBatch];
          concurrentBatch.length = 0;
          
          const batchPromise = Promise.allSettled(
            batch.map((batchItem, idx) => processor(batchItem, processedCount + idx))
          ).then(results => {
            results.forEach(result => {
              if (result.status === 'fulfilled') {
                successful++;
              } else {
                failed++;
                console.error('Processing failed:', result.reason);
              }
            });
            processedCount += results.length;
            onProgress?.(processedCount, items.length);
          });
          
          chunkPromises.push(batchPromise);
        }
      }
      
      await Promise.all(chunkPromises);
      
      // Small delay between chunks to prevent overwhelming the system
      if (chunkIndex < chunks.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }
    
    setProcessingChunk(0);
    setTotalChunks(0);
    
    return { successful, failed };
  }, [finalConfig.chunkSize, finalConfig.maxConcurrent]);

  const validateFileSize = useCallback((file: File): { valid: boolean; error?: string } => {
    const fileSizeMB = file.size / (1024 * 1024);
    
    if (fileSizeMB > finalConfig.maxFileSize) {
      return {
        valid: false,
        error: `File "${file.name}" (${fileSizeMB.toFixed(1)}MB) exceeds maximum size of ${finalConfig.maxFileSize}MB`
      };
    }
    
    return { valid: true };
  }, [finalConfig.maxFileSize]);

  const validateBatch = useCallback((files: File[]): { valid: boolean; errors: string[] } => {
    const errors: string[] = [];
    
    // Validate individual files
    for (const file of files) {
      const validation = validateFileSize(file);
      if (!validation.valid && validation.error) {
        errors.push(validation.error);
      }
    }
    
    // Validate total size
    const analysis = analyzeFiles(files);
    if (analysis.totalSize > finalConfig.maxTotalSize) {
      errors.push(`Total batch size (${analysis.totalSize.toFixed(1)}MB) exceeds limit of ${finalConfig.maxTotalSize}MB`);
    }
    
    return {
      valid: errors.length === 0,
      errors
    };
  }, [analyzeFiles, validateFileSize, finalConfig.maxTotalSize]);

  return {
    analyzeFiles,
    processInChunks,
    validateFileSize,
    validateBatch,
    processingChunk,
    totalChunks,
    config: finalConfig
  };
}
