import { toast } from "sonner";

export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

export function validateReceiptFile(file: File): ValidationResult {
  // Check file type
  if (!file.type.startsWith('image/')) {
    return {
      isValid: false,
      error: 'Please upload an image file (JPG, PNG, etc.)'
    };
  }
  
  // Check file size (50MB limit)
  const maxSize = 50 * 1024 * 1024; // 50MB
  if (file.size > maxSize) {
    return {
      isValid: false,
      error: 'File size exceeds 50MB limit. Please choose a smaller image.'
    };
  }
  
  // Check if file is too small (likely corrupted or empty)
  const minSize = 1024; // 1KB
  if (file.size < minSize) {
    return {
      isValid: false,
      error: 'Image file is too small. Please upload a clear receipt image.'
    };
  }
  
  return { isValid: true };
}

export function analyzeReceiptQuality(scanResult: any): ValidationResult {
  // Check if the scan result indicates poor image quality
  if (scanResult?.error) {
    const errorMessage = scanResult.error.toLowerCase();
    
    if (errorMessage.includes('blurry') || errorMessage.includes('unclear')) {
      return {
        isValid: false,
        error: 'Image appears blurry. Please upload a clear, well-lit receipt image.'
      };
    }
    
    if (errorMessage.includes('not a receipt') || errorMessage.includes('no receipt')) {
      return {
        isValid: false,
        error: 'This doesn\'t appear to be a receipt. Please upload a clear photo of your receipt.'
      };
    }
    
    if (errorMessage.includes('no text') || errorMessage.includes('unreadable')) {
      return {
        isValid: false,
        error: 'Unable to read text from image. Please ensure the receipt is clearly visible and well-lit.'
      };
    }
  }
  
  // Check if we got minimal or no useful data
  if (scanResult?.items && Array.isArray(scanResult.items)) {
    if (scanResult.items.length === 0) {
      return {
        isValid: false,
        error: 'No items found on the receipt. Please ensure the image is clear and contains a valid receipt.'
      };
    }
    
    // Check if items have meaningful data
    const validItems = scanResult.items.filter((item: any) => 
      item.description && item.description.trim().length > 2 &&
      item.amount && !isNaN(parseFloat(item.amount))
    );
    
    if (validItems.length === 0) {
      return {
        isValid: false,
        error: 'Unable to extract valid items from receipt. Please upload a clearer image.'
      };
    }
  }
  
  return { isValid: true };
}

export function showReceiptError(error: string) {
  toast.error(error, {
    duration: 5000,
    action: {
      label: 'Try Again',
      onClick: () => console.log('User chose to try again')
    }
  });
}

export function showReceiptWarning(warning: string) {
  toast.warning(warning, {
    duration: 4000
  });
}

export function showReceiptSuccess(message: string) {
  toast.success(message, {
    duration: 3000
  });
}

// Enhanced error messages for specific scenarios
export const ERROR_MESSAGES = {
  FILE_TYPE: 'Please upload an image file (JPG, PNG, etc.)',
  FILE_SIZE: 'File size exceeds 50MB limit. Please choose a smaller image.',
  FILE_TOO_SMALL: 'Image file is too small. Please upload a clear receipt image.',
  BLURRY_IMAGE: 'Image appears blurry. Please upload a clear, well-lit receipt image.',
  NOT_A_RECEIPT: 'This doesn\'t appear to be a receipt. Please upload a clear photo of your receipt.',
  NO_TEXT_FOUND: 'Unable to read text from image. Please ensure the receipt is clearly visible and well-lit.',
  NO_ITEMS: 'No items found on the receipt. Please ensure the image is clear and contains a valid receipt.',
  PROCESSING_FAILED: 'Failed to process receipt. Please try again with a clearer image.',
  NETWORK_ERROR: 'Network error occurred. Please check your connection and try again.',
  TIMEOUT_ERROR: 'Processing timed out. Please try again or enter details manually.'
} as const;