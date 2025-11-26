
import { supabase } from '@/integrations/supabase/client';
import { toast } from "sonner";

// Cache to track uploads in progress
const uploadCache = new Map<string, Promise<string | null>>();

/**
 * Generate a unique fingerprint for a file to detect duplicates
 */
export function generateFileFingerprint(file: File): string {
  return `${file.name}-${file.size}-${file.lastModified}`;
}

/**
 * Compress image file to reduce size
 */
async function compressImage(file: File, maxSizeKB: number = 1536): Promise<File> {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = () => {
      // Calculate new dimensions to keep aspect ratio
      let { width, height } = img;
      const maxDimension = 1920; // Max width or height
      
      if (width > height && width > maxDimension) {
        height = (height * maxDimension) / width;
        width = maxDimension;
      } else if (height > maxDimension) {
        width = (width * maxDimension) / height;
        height = maxDimension;
      }
      
      canvas.width = width;
      canvas.height = height;
      
      // Draw and compress
      ctx?.drawImage(img, 0, 0, width, height);
      
      canvas.toBlob(
        (blob) => {
          if (blob) {
            const compressedFile = new File([blob], file.name, {
              type: 'image/jpeg',
              lastModified: Date.now(),
            });
            resolve(compressedFile);
          } else {
            resolve(file);
          }
        },
        'image/jpeg',
        0.8 // 80% quality
      );
    };
    
    img.onerror = () => resolve(file);
    img.src = URL.createObjectURL(file);
  });
}

/**
 * Upload a file to Supabase storage and return permanent URL
 */
export async function uploadToSupabase(
  file: File,
  userId: string | undefined
): Promise<string | null> {
  try {
    if (!file) {
      console.error("No file provided to uploadToSupabase");
      return null;
    }
    
    // Only allow images
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return null;
    }
    
    // Check file size - 50MB limit
    const maxSizeBytes = 50 * 1024 * 1024; // 50MB
    if (file.size > maxSizeBytes) {
      const fileSizeMB = (file.size / 1024 / 1024).toFixed(1);
      toast.error(`File size exceeds 50MB limit. Your file is ${fileSizeMB}MB. Please choose a smaller image.`);
      return null;
    }
    
    const fileFingerprint = generateFileFingerprint(file);
    console.log(`Starting upload: ${file.name} (${fileFingerprint})`);
    
    // Check if this file is already being uploaded
    if (uploadCache.has(fileFingerprint)) {
      console.log(`File already being uploaded: ${fileFingerprint}`);
      return uploadCache.get(fileFingerprint)!;
    }
    
    // Create upload promise and store in cache
    const uploadPromise = performUpload(file, userId, fileFingerprint);
    uploadCache.set(fileFingerprint, uploadPromise);
    
    // Clean up cache after upload
    setTimeout(() => {
      uploadCache.delete(fileFingerprint);
    }, 60000);
    
    return uploadPromise;
  } catch (error) {
    console.error("Error in uploadToSupabase:", error);
    toast.error('Failed to upload receipt file');
    return null;
  }
}

/**
 * Perform the actual upload to Supabase storage
 */
async function performUpload(
  file: File, 
  userId: string | undefined,
  fileFingerprint: string
): Promise<string | null> {
  console.log(`Uploading to Supabase: ${file.name} (${fileFingerprint})`);
  
  try {
    // Compress the image if it's larger than 40MB to ensure it stays under 50MB
    let fileToUpload = file;
    const maxSizeKB = 40960; // 40MB
    if (file.size > maxSizeKB * 1024) {
      console.log(`Compressing file from ${(file.size / 1024 / 1024).toFixed(1)}MB`);
      toast.info('Compressing large image...');
      fileToUpload = await compressImage(file, maxSizeKB);
      console.log(`Compressed to ${(fileToUpload.size / 1024 / 1024).toFixed(1)}MB`);
    }
    
    // Final size check after compression
    if (fileToUpload.size > 50 * 1024 * 1024) { // 50MB hard limit
      const fileSizeMB = (fileToUpload.size / 1024 / 1024).toFixed(1);
      toast.error(`File size exceeds 50MB limit even after compression (${fileSizeMB}MB). Please use a smaller image.`);
      return null;
    }
    
    // Create a unique file name
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 10);
    const fileExt = 'jpg'; // Always use jpg after compression
    const fileName = `${timestamp}-${randomString}.${fileExt}`;
    
    // Create storage path
    const storagePath = userId ? `users/${userId}/${fileName}` : `public/${fileName}`;
    const bucketName = 'receipts';
    
    console.log(`Uploading to bucket: ${bucketName}, path: ${storagePath}`);
    
    // Upload file directly - bucket should exist now
    const { data, error } = await supabase.storage
      .from(bucketName)
      .upload(storagePath, fileToUpload, {
        cacheControl: '3600',
        upsert: false // Don't overwrite existing files
      });
      
    if (error) {
      console.error('Supabase upload error:', error);
      
      // Handle specific error cases
      if (error.message.includes('The resource already exists')) {
        // Try with a different filename
        const newFileName = `${timestamp}-${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
        const newStoragePath = userId ? `users/${userId}/${newFileName}` : `public/${newFileName}`;
        
        const { data: retryData, error: retryError } = await supabase.storage
          .from(bucketName)
          .upload(newStoragePath, fileToUpload, {
            cacheControl: '3600',
            upsert: false
          });
          
        if (retryError) {
          toast.error(`Upload failed: ${retryError.message}`);
          return null;
        }
        
        // Get the public URL for the retry upload
        const { data: { publicUrl } } = supabase.storage
          .from(bucketName)
          .getPublicUrl(newStoragePath);
          
        console.log(`Retry upload successful! Public URL: ${publicUrl}`);
        return publicUrl;
      } else if (error.message.includes('Payload too large')) {
        toast.error('File size exceeds 50MB limit. Please choose a smaller image.');
      } else {
        toast.error(`Upload failed: ${error.message}`);
      }
      return null;
    }
    
    // Get the public URL
    const { data: { publicUrl } } = supabase.storage
      .from(bucketName)
      .getPublicUrl(storagePath);
      
    console.log(`Upload successful! Public URL: ${publicUrl}`);
    return publicUrl;
  } catch (error) {
    console.error("Upload error:", error);
    toast.error('Failed to upload to storage');
    return null;
  }
}

/**
 * Ensure bucket exists and create if necessary
 */
async function ensureBucketExists(bucketName: string): Promise<boolean> {
  try {
    // First check if bucket exists by trying to list files
    const { data, error: listError } = await supabase.storage
      .from(bucketName)
      .list('', { limit: 1 });
    
    if (!listError) {
      console.log(`Bucket ${bucketName} exists and is accessible`);
      return true; // Bucket exists and is accessible
    }
    
    console.log(`Bucket ${bucketName} may not exist, attempting to create...`);
    
    // Try to create the bucket
    const { data: bucketData, error: createError } = await supabase.storage.createBucket(bucketName, {
      public: true,
      fileSizeLimit: 52428800, // 50MB limit
      allowedMimeTypes: ['image/jpeg', 'image/png', 'image/jpg', 'image/heic', 'image/heif', 'image/webp']
    });
    
    if (createError) {
      if (createError.message.includes('already exists')) {
        console.log(`Bucket ${bucketName} already exists`);
        return true;
      } else {
        console.error(`Failed to create bucket: ${createError.message}`);
        return false;
      }
    }
    
    console.log(`Successfully created bucket: ${bucketName}`);
    return true;
  } catch (error) {
    console.error(`Error with bucket ${bucketName}:`, error);
    return false;
  }
}
