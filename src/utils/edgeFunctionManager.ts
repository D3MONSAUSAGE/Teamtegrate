
interface EdgeFunctionOptions {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
  timeout: number;
}

interface EdgeFunctionCall {
  functionName: string;
  body: any;
  options?: Partial<EdgeFunctionOptions>;
}

class EdgeFunctionManager {
  private readonly DEFAULT_OPTIONS: EdgeFunctionOptions = {
    maxRetries: 3,
    baseDelay: 1000,
    maxDelay: 8000,
    timeout: 30000
  };

  async invoke<T>(
    supabase: any,
    functionName: string,
    body: any,
    options: Partial<EdgeFunctionOptions> = {}
  ): Promise<{ data: T | null; error: Error | null }> {
    const config = { ...this.DEFAULT_OPTIONS, ...options };
    let lastError: Error;

    console.log(`EdgeFunction: Starting ${functionName} with config:`, config);

    for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
      try {
        console.log(`EdgeFunction: Attempt ${attempt + 1}/${config.maxRetries + 1} for ${functionName}`);
        
        // Create timeout promise
        const timeoutPromise = new Promise<never>((_, reject) => 
          setTimeout(() => reject(new Error(`Request timeout after ${config.timeout}ms`)), config.timeout)
        );

        // Validate request body
        if (!body || typeof body !== 'object') {
          throw new Error('Invalid request body - must be a valid object');
        }

        // Make the Edge Function call
        const requestPromise = supabase.functions.invoke(functionName, { body });
        
        const result = await Promise.race([requestPromise, timeoutPromise]);

        console.log(`EdgeFunction: ${functionName} response:`, result);

        // Check for Edge Function errors
        if (result.error) {
          throw new Error(`Edge Function error: ${result.error.message || 'Unknown error'}`);
        }

        // Validate response data
        if (!result.data) {
          throw new Error('No data returned from Edge Function');
        }

        return { data: result.data, error: null };
      } catch (error: any) {
        lastError = error;
        console.error(`EdgeFunction: Attempt ${attempt + 1} failed for ${functionName}:`, error);

        // Don't retry on certain error types
        if (this.isNonRetryableError(error)) {
          console.log(`EdgeFunction: Non-retryable error for ${functionName}, stopping retries`);
          break;
        }

        // Don't wait after the last attempt
        if (attempt < config.maxRetries) {
          const delay = Math.min(config.baseDelay * Math.pow(2, attempt), config.maxDelay);
          const jitter = Math.random() * 0.1 * delay;
          const finalDelay = delay + jitter;
          
          console.log(`EdgeFunction: Retrying ${functionName} in ${finalDelay}ms...`);
          await this.sleep(finalDelay);
        }
      }
    }

    console.error(`EdgeFunction: All attempts failed for ${functionName}:`, lastError);
    return { data: null, error: lastError };
  }

  private isNonRetryableError(error: Error): boolean {
    const message = error.message.toLowerCase();
    return message.includes('unauthorized') ||
           message.includes('forbidden') ||
           message.includes('invalid request body') ||
           message.includes('permission');
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Validate connection to Edge Functions
  async validateConnection(supabase: any): Promise<boolean> {
    try {
      console.log('EdgeFunction: Validating connection...');
      const result = await this.invoke(supabase, 'admin-create-user', {}, { 
        maxRetries: 1, 
        timeout: 5000 
      });
      
      // We expect this to fail with validation error, which means the function is accessible
      const isAccessible = result.error?.message?.includes('Missing required fields') || 
                          result.error?.message?.includes('authorization') ||
                          result.data !== null;
      
      console.log('EdgeFunction: Connection validation result:', isAccessible);
      return isAccessible;
    } catch (error) {
      console.error('EdgeFunction: Connection validation failed:', error);
      return false;
    }
  }
}

export const edgeFunctionManager = new EdgeFunctionManager();
