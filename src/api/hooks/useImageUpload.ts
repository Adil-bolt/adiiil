import { useState, useCallback } from 'react';
import { validateImage, resizeImage } from '../utils/imageUtils';

interface UseImageUploadOptions {
  maxSize?: number;
  maxWidth?: number;
  maxHeight?: number;
  onImageSelected?: (file: File) => Promise<void>;
  onError?: (error: Error) => void;
}

export function useImageUpload({
  maxSize = 5 * 1024 * 1024, // 5MB
  maxWidth = 800,
  maxHeight = 800,
  onImageSelected,
  onError
}: UseImageUploadOptions = {}) {
  const [isUploading, setIsUploading] = useState(false);

  const handleImageSelect = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setIsUploading(true);

      // Validate image
      if (!validateImage(file, maxSize)) {
        throw new Error('Invalid image file. Please use JPG, PNG or GIF under 5MB.');
      }

      // Resize image
      const resizedImage = await resizeImage(file, maxWidth, maxHeight);
      const finalFile = new File([resizedImage], file.name, { type: resizedImage.type });

      // Call onImageSelected callback
      if (onImageSelected) {
        await onImageSelected(finalFile);
      }
    } catch (error) {
      if (onError && error instanceof Error) {
        onError(error);
      }
      console.error('Error processing image:', error);
    } finally {
      setIsUploading(false);
      // Reset input value to allow selecting the same file again
      event.target.value = '';
    }
  }, [maxSize, maxWidth, maxHeight, onImageSelected, onError]);

  return {
    handleImageSelect,
    isUploading
  };
}