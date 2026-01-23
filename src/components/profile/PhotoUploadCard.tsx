import React, { useState } from 'react';
import { Camera, Upload, X, Loader2, CheckCircle } from 'lucide-react';
import Button from '../Button';
import { validateImage, formatBytes } from '../../utils/imageUtils';
import { passengerService } from '../../services/passengerService';
import { toast } from 'sonner';

interface PhotoUploadCardProps {
    userId: string;
    currentPhotoUrl?: string;
    currentThumbnailUrl?: string;
    onPhotoUploaded?: (photoUrl: string, thumbnailUrl: string) => void;
}

const PhotoUploadCard: React.FC<PhotoUploadCardProps> = ({
    userId,
    currentPhotoUrl,
    currentThumbnailUrl,
    onPhotoUploaded,
}) => {
    const [isDragging, setIsDragging] = useState(false);
    const [preview, setPreview] = useState<string | null>(currentPhotoUrl || null);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);

    const handleFileSelect = (file: File) => {
        const validation = validateImage(file);

        if (!validation.valid) {
            toast.error(validation.error);
            return;
        }

        setSelectedFile(file);

        // Create preview
        const reader = new FileReader();
        reader.onloadend = () => {
            setPreview(reader.result as string);
        };
        reader.readAsDataURL(file);
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragging(false);

        const file = e.dataTransfer.files[0];
        if (file) {
            handleFileSelect(file);
        }
    };

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = () => {
        setIsDragging(false);
    };

    const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            handleFileSelect(file);
        }
    };

    const handleUpload = async () => {
        if (!selectedFile) return;

        setIsUploading(true);
        setUploadProgress(0);

        try {
            // Simulate progress
            const progressInterval = setInterval(() => {
                setUploadProgress(prev => Math.min(prev + 10, 90));
            }, 200);

            const photoProfile = await passengerService.uploadPhoto(userId, selectedFile);

            clearInterval(progressInterval);
            setUploadProgress(100);

            // Update preview
            setPreview(photoProfile.url || null);

            toast.success('Foto de perfil actualizada exitosamente');

            if (onPhotoUploaded && photoProfile.url && photoProfile.thumbnailUrl) {
                onPhotoUploaded(photoProfile.url, photoProfile.thumbnailUrl);
            }

            // Reset
            setTimeout(() => {
                setSelectedFile(null);
                setUploadProgress(0);
            }, 1000);

        } catch (error: any) {
            toast.error(error.message || 'Error al subir la foto');
        } finally {
            setIsUploading(false);
        }
    };

    const handleCancel = () => {
        setSelectedFile(null);
        setPreview(currentPhotoUrl || null);
    };

    return (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
            <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                <Camera size={20} className="text-mipana-mediumBlue" />
                Foto de Perfil
            </h3>

            {/* Current Photo or Upload Area */}
            <div
                className={`
          relative border-2 border-dashed rounded-xl overflow-hidden
          transition-all duration-200
          ${isDragging
                        ? 'border-mipana-mediumBlue bg-blue-50 dark:bg-blue-900/20'
                        : 'border-gray-300 dark:border-gray-600'}
        `}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
            >
                {preview ? (
                    <div className="relative">
                        <img
                            src={preview}
                            alt="Profile Preview"
                            className="w-full h-64 object-cover"
                        />
                        {!isUploading && selectedFile && (
                            <div className="absolute top-2 right-2">
                                <button
                                    onClick={handleCancel}
                                    className="bg-red-500 text-white p-2 rounded-full hover:bg-red-600 shadow-lg"
                                >
                                    <X size={16} />
                                </button>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                        <div className="w-20 h-20 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mb-4">
                            <Upload size={32} className="text-gray-400" />
                        </div>
                        <p className="text-gray-600 dark:text-gray-400 font-medium mb-2">
                            Arrastra tu foto aquí
                        </p>
                        <p className="text-sm text-gray-500 mb-4">
                            o haz clic para seleccionar
                        </p>
                        <label htmlFor="photo-upload" className="cursor-pointer">
                            <span className="inline-block bg-mipana-mediumBlue text-white px-4 py-2 rounded-lg hover:bg-mipana-darkBlue transition-colors">
                                Seleccionar Archivo
                            </span>
                            <input
                                id="photo-upload"
                                type="file"
                                accept="image/*"
                                capture="user"
                                onChange={handleFileInputChange}
                                className="hidden"
                            />
                        </label>
                    </div>
                )}

                {/* Upload Progress */}
                {isUploading && (
                    <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center">
                        <Loader2 size={48} className="text-white animate-spin mb-4" />
                        <div className="w-64 bg-gray-200 rounded-full h-2 mb-2">
                            <div
                                className="bg-mipana-mediumBlue h-2 rounded-full transition-all duration-300"
                                style={{ width: `${uploadProgress}%` }}
                            />
                        </div>
                        <p className="text-white text-sm">
                            {uploadProgress < 90 ? 'Procesando imagen...' : 'Detectando rostro...'}
                        </p>
                    </div>
                )}
            </div>

            {/* File Info */}
            {selectedFile && !isUploading && (
                <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-800 dark:text-white">
                                {selectedFile.name}
                            </p>
                            <p className="text-xs text-gray-500">
                                {formatBytes(selectedFile.size)}
                            </p>
                        </div>
                        <CheckCircle size={20} className="text-green-500" />
                    </div>
                </div>
            )}

            {/* Requirements */}
            <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Requisitos de la foto:
                </p>
                <ul className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
                    <li>• Formato: JPG, PNG o WebP</li>
                    <li>• Tamaño máximo: 5MB</li>
                    <li>• Debe mostrar claramente tu rostro</li>
                    <li>• Fondo visible y buena iluminación</li>
                </ul>
            </div>

            {/* Action Buttons */}
            {selectedFile && !isUploading && (
                <div className="mt-4 flex gap-3">
                    <Button
                        onClick={handleCancel}
                        variant="outline"
                        fullWidth
                    >
                        Cancelar
                    </Button>
                    <Button
                        onClick={handleUpload}
                        fullWidth
                    >
                        <Upload size={16} className="mr-2" />
                        Subir Foto
                    </Button>
                </div>
            )}
        </div>
    );
};

export default PhotoUploadCard;
