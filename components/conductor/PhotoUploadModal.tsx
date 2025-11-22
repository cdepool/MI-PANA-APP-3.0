import React, { useState, useRef } from 'react';
import { Camera, Upload, X, Check, RotateCw } from 'lucide-react';

interface PhotoUploadModalProps {
    isOpen: boolean;
    onClose: () => void;
    onUpload: (file: File) => Promise<void>;
    currentPhotoUrl?: string;
}

export const PhotoUploadModal: React.FC<PhotoUploadModalProps> = ({ isOpen, onClose, onUpload, currentPhotoUrl }) => {
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    if (!isOpen) return null;

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setSelectedFile(file);
            setPreviewUrl(URL.createObjectURL(file));
        }
    };

    const handleUpload = async () => {
        if (!selectedFile) return;
        setLoading(true);
        try {
            await onUpload(selectedFile);
            onClose();
        } catch (error) {
            alert('Error al subir foto');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
                <div className="p-4 border-b flex justify-between items-center bg-gray-50">
                    <h3 className="font-bold text-lg text-gray-800">Actualizar Foto de Perfil</h3>
                    <button onClick={onClose} className="p-1 hover:bg-gray-200 rounded-full transition-colors">
                        <X size={20} className="text-gray-500" />
                    </button>
                </div>

                <div className="p-6 flex flex-col items-center gap-6">
                    {/* Preview Area */}
                    <div className="relative w-64 h-64 rounded-full overflow-hidden border-4 border-blue-100 shadow-inner group">
                        <img
                            src={previewUrl || currentPhotoUrl || 'https://via.placeholder.com/400'}
                            alt="Preview"
                            className="w-full h-full object-cover"
                        />
                        {!previewUrl && (
                            <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                                <Camera className="text-white w-12 h-12" />
                            </div>
                        )}
                    </div>

                    {/* Controls */}
                    <div className="w-full space-y-3">
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleFileSelect}
                            accept="image/*"
                            className="hidden"
                        />

                        {!selectedFile ? (
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                className="w-full py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
                            >
                                <Upload size={20} /> Seleccionar Nueva Foto
                            </button>
                        ) : (
                            <div className="flex gap-2">
                                <button
                                    onClick={() => { setSelectedFile(null); setPreviewUrl(null); }}
                                    className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={handleUpload}
                                    disabled={loading}
                                    className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 shadow-lg shadow-blue-200 disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    {loading ? 'Subiendo...' : <><Check size={20} /> Guardar Foto</>}
                                </button>
                            </div>
                        )}
                    </div>

                    <p className="text-xs text-center text-gray-400">
                        Asegúrate de que tu rostro esté bien iluminado y centrado.
                        <br />Formatos: JPG, PNG. Máx 5MB.
                    </p>
                </div>
            </div>
        </div>
    );
};
