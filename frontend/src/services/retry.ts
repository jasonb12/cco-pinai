interface RetryOptions {
  maxRetries?: number;
  baseDelay?: number;
  maxDelay?: number;
  exponentialBackoff?: boolean;
}

export const withRetry = async <T>(
  operation: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> => {
  const {
    maxRetries = 3,
    baseDelay = 1000,
    maxDelay = 10000,
    exponentialBackoff = true,
  } = options;

  let lastError: Error;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error: any) {
      lastError = error;
      
      if (attempt === maxRetries) {
        throw lastError;
      }
      
      const delay = exponentialBackoff 
        ? Math.min(baseDelay * Math.pow(2, attempt), maxDelay)
        : baseDelay;
      
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError!;
};

export const isRetryableError = (error: any): boolean => {
  if (!error) return false;
  
  // Network errors
  if (error.name === 'NetworkError' || error.code === 'NETWORK_ERROR') {
    return true;
  }
  
  // HTTP status codes that are retryable
  if (error.status) {
    const retryableStatusCodes = [408, 429, 500, 502, 503, 504];
    return retryableStatusCodes.includes(error.status);
  }
  
  // Connection errors
  if (error.message?.includes('fetch') || error.message?.includes('network')) {
    return true;
  }
  
  return false;
};

export const withRetryableOperation = async <T>(
  operation: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> => {
  return withRetry(async () => {
    try {
      return await operation();
    } catch (error: any) {
      if (isRetryableError(error)) {
        throw error;
      }
      // For non-retryable errors, don't retry
      throw new Error(`Non-retryable error: ${error.message}`);
    }
  }, options);
};