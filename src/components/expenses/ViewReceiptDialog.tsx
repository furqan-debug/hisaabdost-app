import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { FileImage, Download, RefreshCw } from "lucide-react";
import { refreshReceiptUrl, isSupabaseStorageUrl } from "@/utils/receipt/signedUrlService";

interface ViewReceiptDialogProps {
  receiptUrl: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ViewReceiptDialog({ 
  receiptUrl,
  open,
  onOpenChange
}: ViewReceiptDialogProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [imageError, setImageError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [displayUrl, setDisplayUrl] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Check URL validity
  const hasValidUrl = receiptUrl && receiptUrl.trim() !== '';
  const isBlobUrl = receiptUrl?.startsWith('blob:');
  const isHttpUrl = receiptUrl?.startsWith('http');
  const isSupabaseUrl = isSupabaseStorageUrl(receiptUrl);
  
  const isValidImageUrl = hasValidUrl && (isBlobUrl || isHttpUrl);
  const isPermanentUrl = isSupabaseUrl || (isHttpUrl && !isBlobUrl);

  // Refresh signed URL for Supabase storage URLs
  useEffect(() => {
    async function getSignedUrl() {
      if (!open || !receiptUrl) return;
      
      if (isSupabaseUrl) {
        setIsRefreshing(true);
        setIsLoading(true);
        
        try {
          const signedUrl = await refreshReceiptUrl(receiptUrl);
          if (signedUrl) {
            setDisplayUrl(signedUrl);
          } else {
            // Fallback to original URL if refresh fails
            setDisplayUrl(receiptUrl);
          }
        } catch (error) {
          console.error("Error refreshing signed URL:", error);
          setDisplayUrl(receiptUrl);
        } finally {
          setIsRefreshing(false);
        }
      } else {
        setDisplayUrl(receiptUrl);
        setIsLoading(false);
      }
    }
    
    getSignedUrl();
  }, [open, receiptUrl, isSupabaseUrl, retryCount]);

  const handleImageLoad = () => {
    setIsLoading(false);
    setImageError(false);
  };

  const handleImageError = () => {
    setIsLoading(false);
    setImageError(true);
  };

  const handleRetry = async () => {
    if (!isValidImageUrl) return;
    
    setIsLoading(true);
    setImageError(false);
    setRetryCount(prev => prev + 1);
  };

  const handleDownload = () => {
    if (!displayUrl || !isPermanentUrl) return;
    
    try {
      const a = document.createElement('a');
      a.href = displayUrl;
      a.download = 'receipt-image.jpg';
      a.target = '_blank';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (error) {
      console.error("Download failed:", error);
      window.open(displayUrl, '_blank');
    }
  };

  // Reset states when dialog opens
  useEffect(() => {
    if (open) {
      setIsLoading(true);
      setImageError(false);
      setRetryCount(0);
      setDisplayUrl(null);
    }
  }, [open]);

  const handleClose = () => {
    setIsLoading(true);
    setImageError(false);
    setRetryCount(0);
    setDisplayUrl(null);
    onOpenChange(false);
  };

  const getErrorMessage = () => {
    if (!hasValidUrl) {
      return "No receipt image available.";
    }
    if (isBlobUrl) {
      return "Receipt image URL is temporary and may have expired. Please re-upload the receipt.";
    }
    return "Failed to load receipt image. Please try again.";
  };

  const canRetry = isValidImageUrl;
  const canDownload = isPermanentUrl && displayUrl;
  const shouldShowImage = displayUrl && !imageError;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md md:max-w-lg lg:max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <FileImage className="mr-2 h-5 w-5" />
            Receipt Image
          </DialogTitle>
        </DialogHeader>
        
        <div className="relative flex flex-col items-center justify-center min-h-[200px]">
          {(isLoading || isRefreshing) && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
            </div>
          )}
          
          {shouldShowImage ? (
            <img
              key={`${displayUrl}-${retryCount}`}
              src={displayUrl}
              alt="Receipt"
              className="max-h-[60vh] max-w-full object-contain rounded-md border"
              onLoad={handleImageLoad}
              onError={handleImageError}
              style={{ opacity: isLoading ? 0.3 : 1 }}
            />
          ) : !isLoading && !isRefreshing ? (
            <div className="p-8 text-center border border-dashed rounded-md bg-muted/30">
              <FileImage className="mx-auto h-10 w-10 text-muted-foreground mb-4" />
              <p className="text-sm text-muted-foreground mb-4">
                {getErrorMessage()}
              </p>
              {canRetry && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleRetry}
                  className="flex items-center gap-2"
                >
                  <RefreshCw className="h-4 w-4" />
                  Try Again
                </Button>
              )}
            </div>
          ) : null}
          
          {!isLoading && !isRefreshing && shouldShowImage && (
            <p className="mt-2 text-sm text-muted-foreground">
              Click outside or press ESC to close
            </p>
          )}
        </div>
        
        <DialogFooter className="flex flex-row justify-between sm:justify-between">
          <Button variant="outline" onClick={handleClose}>
            Close
          </Button>
          
          {canDownload && !imageError && (
            <Button 
              variant="secondary" 
              onClick={handleDownload}
              className="ml-2"
            >
              <Download className="mr-2 h-4 w-4" />
              Download
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
