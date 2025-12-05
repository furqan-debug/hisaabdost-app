import { supabase } from '@/integrations/supabase/client';

const BUCKET_NAME = 'receipts';
const SIGNED_URL_EXPIRY = 3600; // 1 hour in seconds

/**
 * Creates a signed URL for accessing a receipt image
 * @param filePath The storage path of the file (e.g., "users/{userId}/{filename}")
 * @returns Signed URL or null if failed
 */
export async function getSignedReceiptUrl(filePath: string): Promise<string | null> {
  if (!filePath) {
    console.error("No file path provided for signed URL");
    return null;
  }

  try {
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .createSignedUrl(filePath, SIGNED_URL_EXPIRY);

    if (error) {
      console.error("Error creating signed URL:", error);
      return null;
    }

    return data.signedUrl;
  } catch (error) {
    console.error("Error in getSignedReceiptUrl:", error);
    return null;
  }
}

/**
 * Extracts the storage path from a Supabase storage URL
 * @param url The full Supabase storage URL
 * @returns The storage path (e.g., "users/{userId}/{filename}")
 */
export function extractStoragePathFromUrl(url: string): string | null {
  if (!url) return null;

  try {
    // Handle both public and signed URL formats
    // Public: https://xxx.supabase.co/storage/v1/object/public/receipts/users/xxx/file.jpg
    // Signed: https://xxx.supabase.co/storage/v1/object/sign/receipts/users/xxx/file.jpg?token=xxx
    
    const urlObj = new URL(url);
    const pathname = urlObj.pathname;
    
    // Match patterns like /storage/v1/object/public/receipts/ or /storage/v1/object/sign/receipts/
    const publicMatch = pathname.match(/\/storage\/v1\/object\/public\/receipts\/(.+)/);
    const signedMatch = pathname.match(/\/storage\/v1\/object\/sign\/receipts\/(.+)/);
    
    if (publicMatch) {
      return publicMatch[1];
    }
    if (signedMatch) {
      return signedMatch[1];
    }
    
    // Try to extract from any receipts bucket path
    const genericMatch = pathname.match(/\/receipts\/(.+)/);
    if (genericMatch) {
      return genericMatch[1];
    }
    
    return null;
  } catch (error) {
    console.error("Error extracting storage path from URL:", error);
    return null;
  }
}

/**
 * Converts an old public URL or signed URL to a fresh signed URL
 * @param url The existing receipt URL (public or signed)
 * @returns A fresh signed URL or null if failed
 */
export async function refreshReceiptUrl(url: string): Promise<string | null> {
  const storagePath = extractStoragePathFromUrl(url);
  
  if (!storagePath) {
    console.error("Could not extract storage path from URL:", url);
    return null;
  }
  
  return getSignedReceiptUrl(storagePath);
}

/**
 * Checks if a URL is a Supabase storage URL
 */
export function isSupabaseStorageUrl(url: string): boolean {
  return url?.includes('supabase.co/storage/');
}

/**
 * Checks if a signed URL has expired or is about to expire
 * Note: This is a best-effort check based on URL structure
 */
export function isSignedUrlExpired(url: string): boolean {
  if (!url) return true;
  
  try {
    const urlObj = new URL(url);
    const token = urlObj.searchParams.get('token');
    
    if (!token) {
      // Not a signed URL, might be an old public URL
      return true;
    }
    
    // Try to decode the JWT to check expiry (basic check)
    const parts = token.split('.');
    if (parts.length !== 3) return false;
    
    const payload = JSON.parse(atob(parts[1]));
    const exp = payload.exp;
    
    if (exp) {
      // Add 5 minute buffer before expiry
      return Date.now() / 1000 > (exp - 300);
    }
    
    return false;
  } catch {
    // If we can't parse, assume it might need refresh
    return false;
  }
}
