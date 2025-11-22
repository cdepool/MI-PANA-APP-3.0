/**
 * Image Processing Utilities for MI PANA APP
 * Handles image upload, resize, compression, and thumbnail generation
 */

export interface ImageProcessingOptions {
    maxWidth?: number;
    maxHeight?: number;
    quality?: number; // 0.0 to 1.0
    format?: 'jpeg' | 'png' | 'webp';
}

export interface CropData {
    x: number;
    y: number;
    width: number;
    height: number;
    rotation?: number;
}

export interface ProcessedImage {
    dataUrl: string;
    width: number;
    height: number;
    sizeBytes: number;
    format: string;
}

/**
 * Validate image file
 */
export const validateImage = (file: File): { valid: boolean; error?: string } => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    const maxSize = 5 * 1024 * 1024; // 5MB

    if (!allowedTypes.includes(file.type)) {
        return {
            valid: false,
            error: 'Formato no permitido. Solo JPG, PNG o WebP.',
        };
    }

    if (file.size > maxSize) {
        return {
            valid: false,
            error: 'El archivo excede el tamaño máximo de 5MB.',
        };
    }

    return { valid: true };
};

/**
 * Read file as data URL
 */
export const readFileAsDataURL = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = () => reject(new Error('Error al leer el archivo'));
        reader.readAsDataURL(file);
    });
};

/**
 * Load image from URL or data URL
 */
const loadImage = (src: string): Promise<HTMLImageElement> => {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = () => reject(new Error('Error al cargar la imagen'));
        img.src = src;
    });
};

/**
 * Resize and compress image
 */
export const resizeImage = async (
    imageSource: string | File,
    options: ImageProcessingOptions = {}
): Promise<ProcessedImage> => {
    const {
        maxWidth = 600,
        maxHeight = 600,
        quality = 0.85,
        format = 'jpeg',
    } = options;

    // Get data URL if File was provided
    const dataUrl = typeof imageSource === 'string'
        ? imageSource
        : await readFileAsDataURL(imageSource);

    // Load image
    const img = await loadImage(dataUrl);

    // Calculate new dimensions maintaining aspect ratio
    let { width, height } = img;

    if (width > maxWidth || height > maxHeight) {
        const aspectRatio = width / height;

        if (width > height) {
            width = maxWidth;
            height = width / aspectRatio;
        } else {
            height = maxHeight;
            width = height * aspectRatio;
        }
    }

    // Create canvas and draw resized image
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext('2d');
    if (!ctx) {
        throw new Error('No se pudo crear el contexto del canvas');
    }

    // Draw with better quality
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(img, 0, 0, width, height);

    // Convert to data URL
    const mimeType = `image/${format}`;
    const resultDataUrl = canvas.toBlob
        ? await new Promise<string>((resolve) => {
            canvas.toBlob(
                (blob) => {
                    if (blob) {
                        const reader = new FileReader();
                        reader.onloadend = () => resolve(reader.result as string);
                        reader.readAsDataURL(blob);
                    }
                },
                mimeType,
                quality
            );
        })
        : canvas.toDataURL(mimeType, quality);

    // Calculate size
    const sizeBytes = Math.round((resultDataUrl.length * 3) / 4);

    return {
        dataUrl: resultDataUrl,
        width,
        height,
        sizeBytes,
        format,
    };
};

/**
 * Generate thumbnail (small preview)
 */
export const generateThumbnail = async (
    imageSource: string | File,
    size: number = 150
): Promise<string> => {
    const processed = await resizeImage(imageSource, {
        maxWidth: size,
        maxHeight: size,
        quality: 0.7,
        format: 'jpeg',
    });

    return processed.dataUrl;
};

/**
 * Crop image with specified crop data
 */
export const cropImage = async (
    imageSource: string | File,
    cropData: CropData
): Promise<ProcessedImage> => {
    const dataUrl = typeof imageSource === 'string'
        ? imageSource
        : await readFileAsDataURL(imageSource);

    const img = await loadImage(dataUrl);

    const canvas = document.createElement('canvas');
    canvas.width = cropData.width;
    canvas.height = cropData.height;

    const ctx = canvas.getContext('2d');
    if (!ctx) {
        throw new Error('No se pudo crear el contexto del canvas');
    }

    // Apply rotation if specified
    if (cropData.rotation) {
        ctx.translate(cropData.width / 2, cropData.height / 2);
        ctx.rotate((cropData.rotation * Math.PI) / 180);
        ctx.translate(-cropData.width / 2, -cropData.height / 2);
    }

    // Draw cropped section
    ctx.drawImage(
        img,
        cropData.x,
        cropData.y,
        cropData.width,
        cropData.height,
        0,
        0,
        cropData.width,
        cropData.height
    );

    const croppedDataUrl = canvas.toDataURL('image/jpeg', 0.9);
    const sizeBytes = Math.round((croppedDataUrl.length * 3) / 4);

    return {
        dataUrl: croppedDataUrl,
        width: cropData.width,
        height: cropData.height,
        sizeBytes,
        format: 'jpeg',
    };
};

/**
 * Simulate face detection (mock implementation)
 * In production, this would use ML/AI service
 */
export const detectFace = async (imageSource: string | File): Promise<{
    faceDetected: boolean;
    confidence: number;
    message: string;
}> => {
    // Simulate processing delay
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Mock implementation - always returns success
    // In real implementation, use TensorFlow.js or cloud ML service
    return {
        faceDetected: true,
        confidence: 0.92,
        message: 'Rostro detectado correctamente',
    };
};

/**
 * Calculate image quality score (1-10)
 */
export const assessImageQuality = async (
    imageSource: string | File
): Promise<{
    score: number;
    issues: string[];
}> => {
    const dataUrl = typeof imageSource === 'string'
        ? imageSource
        : await readFileAsDataURL(imageSource);

    const img = await loadImage(dataUrl);
    const issues: string[] = [];
    let score = 10;

    // Check resolution
    if (img.width < 400 || img.height < 400) {
        issues.push('Resolución muy baja');
        score -= 3;
    }

    // Check aspect ratio
    const aspectRatio = img.width / img.height;
    if (aspectRatio < 0.8 || aspectRatio > 1.2) {
        issues.push('Relación de aspecto no óptima');
        score -= 1;
    }

    // Check file size (from data URL)
    const sizeBytes = Math.round((dataUrl.length * 3) / 4);
    if (sizeBytes > 3 * 1024 * 1024) {
        issues.push('Tamaño de archivo grande');
        score -= 1;
    }

    return {
        score: Math.max(1, score),
        issues,
    };
};

/**
 * Convert bytes to human-readable format
 */
export const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
};
