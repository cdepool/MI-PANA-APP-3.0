import React, { useCallback, useState } from 'react';
import { UploadCloud, FileText, CheckCircle, AlertCircle, Trash2 } from 'lucide-react';

interface DocumentUploadZoneProps {
    label: string;
    onFileSelect: (file: File) => void;
    acceptedFormats?: string; // ".pdf,.jpg,.png"
    currentFileUrl?: string;
    status?: 'pending' | 'verified' | 'rejected' | 'none';
}

export const DocumentUploadZone: React.FC<DocumentUploadZoneProps> = ({
    label,
    onFileSelect,
    acceptedFormats = ".pdf,.jpg,.jpeg,.png",
    currentFileUrl,
    status = 'none'
}) => {
    const [dragActive, setDragActive] = useState(false);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);

    const handleDrag = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    }, []);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFile(e.dataTransfer.files[0]);
        }
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        e.preventDefault();
        if (e.target.files && e.target.files[0]) {
            handleFile(e.target.files[0]);
        }
    };

    const handleFile = (file: File) => {
        setSelectedFile(file);
        onFileSelect(file);
    };

    return (
        <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>

            {/* Current File Status */}
            {currentFileUrl && !selectedFile && (
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200 mb-2">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                        <FileText size={16} />
                        <span className="truncate max-w-[200px]">Documento Actual</span>
                        {status === 'verified' && <CheckCircle size={14} className="text-green-500" />}
                        {status === 'pending' && <AlertCircle size={14} className="text-yellow-500" />}
                    </div>
                    <a href={currentFileUrl} target="_blank" rel="noreferrer" className="text-xs text-blue-600 hover:underline">Ver</a>
                </div>
            )}

            {/* Upload Zone */}
            <div
                className={`relative border-2 border-dashed rounded-xl p-6 transition-all text-center ${dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50'
                    }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
            >
                <input
                    type="file"
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    accept={acceptedFormats}
                    onChange={handleChange}
                />

                {selectedFile ? (
                    <div className="flex flex-col items-center text-blue-600">
                        <FileText size={32} className="mb-2" />
                        <p className="font-medium text-sm">{selectedFile.name}</p>
                        <p className="text-xs text-gray-500">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
                        <button
                            onClick={(e) => { e.preventDefault(); setSelectedFile(null); }}
                            className="mt-2 text-xs text-red-500 flex items-center gap-1 hover:underline z-10 relative"
                        >
                            <Trash2 size={12} /> Eliminar
                        </button>
                    </div>
                ) : (
                    <div className="flex flex-col items-center text-gray-500">
                        <UploadCloud size={32} className="mb-2 text-gray-400" />
                        <p className="text-sm font-medium">Arrastra tu archivo aquí</p>
                        <p className="text-xs mt-1">o haz click para seleccionar</p>
                        <p className="text-[10px] mt-2 text-gray-400 uppercase">{acceptedFormats.replace(/\./g, ' ')}</p>
                    </div>
                )}
            </div>
        </div>
    );
};
