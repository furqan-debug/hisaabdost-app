
import { supabase } from "@/integrations/supabase/client";

// The bucket name your project is using for receipts
const bucketName = "receipts";

/**
 * Lists all files in a user's receipt folder
 * @param userId The user ID to check files for
 * @returns Array of file objects
 */
export async function listUserReceipts(userId: string) {
  if (!userId) {
    console.error("No user ID provided");
    return [];
  }
  
  const folderPath = `${userId}/`;
  console.log(`Checking receipts in folder: ${folderPath}`);
  
  try {
    const { data, error } = await supabase.storage
      .from(bucketName)
      .list(folderPath);
      
    if (error) {
      // Handle error but don't block functionality
      console.error("Error fetching files:", error);
      return [];
    }

    console.log(`Found ${data.length} files for user ${userId}`);
    return data;
  } catch (error) {
    console.error("Error listing receipts:", error);
    return [];
  }
}

/**
 * Checks if a specific file exists in Supabase storage
 * @param filePath Full path of the file to check
 * @returns Boolean indicating if file exists
 */
export async function checkFileExists(filePath: string) {
  if (!filePath) {
    console.error("No file path provided");
    return false;
  }
  
  // Extract folder path and file name from the full path
  const lastSlashIndex = filePath.lastIndexOf('/');
  const folderPath = lastSlashIndex > 0 ? filePath.substring(0, lastSlashIndex) : '';
  const fileName = lastSlashIndex > 0 ? filePath.substring(lastSlashIndex + 1) : filePath;
  
  console.log(`Checking if file exists in folder "${folderPath}": ${fileName}`);
  
  try {
    const { data, error } = await supabase.storage
      .from(bucketName)
      .list(folderPath);
      
    if (error) {
      // Handle error but don't block functionality
      console.error("Error fetching files:", error);
      return false;
    }

    // Check if the file exists in the list
    const fileExists = data.some(file => file.name === fileName);
    console.log(`File "${fileName}" exists:`, fileExists);
    return fileExists;
  } catch (error) {
    console.error("Error checking if file exists:", error);
    return false;
  }
}

/**
 * Gets a signed URL for a specific file (secure access)
 * @param filePath Full path of the file
 * @returns Signed URL of the file
 */
export async function getFileUrl(filePath: string) {
  if (!filePath) {
    console.error("No file path provided");
    return null;
  }
  
  const { data, error } = await supabase.storage
    .from(bucketName)
    .createSignedUrl(filePath, 3600); // 1 hour expiry
  
  if (error) {
    console.error(`Error creating signed URL for ${filePath}:`, error);
    return null;
  }
    
  console.log(`Signed URL for ${filePath} created`);
  return data.signedUrl;
}

/**
 * Checks if the receipts bucket exists
 * @returns Boolean indicating if the bucket exists
 */
export async function checkReceiptsBucketExists() {
  try {
    // First try a simple list operation with a very short timeout
    const listPromise = supabase.storage.from(bucketName).list('', { limit: 1 });
    
    // Add a timeout to the request
    const timeoutPromise = new Promise<{data: null, error: Error}>((resolve) => {
      setTimeout(() => {
        resolve({
          data: null, 
          error: new Error('Bucket check timed out')
        });
      }, 3000);
    });
    
    // Use the result of whichever finishes first
    const { error } = await Promise.race([listPromise, timeoutPromise]);
    
    if (!error) {
      console.log(`"${bucketName}" bucket exists and is accessible`);
      return true;
    }
    
    // If the simple check fails, try getting bucket information
    const { data: buckets, error: bucketError } = await supabase.storage.listBuckets();
    
    if (bucketError) {
      console.error("Error listing buckets:", bucketError);
      // Continue anyway to avoid blocking receipt uploads
      return false;
    }
    
    const bucketExists = buckets?.some(bucket => bucket.name === bucketName);
    if (bucketExists) {
      console.log(`"${bucketName}" bucket exists`);
      return true;
    } else {
      console.log(`"${bucketName}" bucket does not exist`);
      return false;
    }
  } catch (error) {
    console.error("Error checking if bucket exists:", error);
    return false;
  }
}

/**
 * Creates the receipts bucket if it doesn't exist
 * @returns Boolean indicating success
 */
export async function createReceiptsBucket() {
  try {
    // Check if bucket exists first
    const exists = await checkReceiptsBucketExists();
    if (exists) {
      console.log(`Bucket "${bucketName}" already exists`);
      return true;
    }
    
    // Create the bucket with private access (RLS policies control access)
    const { error } = await supabase.storage.createBucket(bucketName, {
      public: false,
      fileSizeLimit: 52428800, // 50MB limit
    });
    
    if (error) {
      // Check if error is just that the bucket already exists
      if (error.message && error.message.includes("already exists")) {
        console.log(`Bucket "${bucketName}" already exists`);
        return true;
      }
      
      console.error(`Error creating "${bucketName}" bucket:`, error);
      return false;
    }
    
    console.log(`Successfully created "${bucketName}" bucket`);
    return true;
  } catch (error) {
    console.error(`Error creating "${bucketName}" bucket:`, error);
    return false;
  }
}
