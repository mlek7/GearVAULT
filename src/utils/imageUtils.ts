/**
 * Utilities for image manipulation, cropping, resizing and compression.
 */

export function processProfilePhoto(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Failed to read image file'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('Failed to parse image'));
      img.onload = () => {
        const canvas = document.createElement('canvas');
        // Find square bounding box for center crop
        const minDimension = Math.min(img.width, img.height);
        const targetSize = Math.min(minDimension, 512);
        canvas.width = targetSize;
        canvas.height = targetSize;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Could not create canvas 2D context'));
          return;
        }

        const sx = (img.width - minDimension) / 2;
        const sy = (img.height - minDimension) / 2;

        ctx.drawImage(img, sx, sy, minDimension, minDimension, 0, 0, targetSize, targetSize);
        // Compress to JPEG with 0.85 quality
        const jpegDataUrl = canvas.toDataURL('image/jpeg', 0.85);
        resolve(jpegDataUrl);
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}
