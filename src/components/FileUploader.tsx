import React, { useState, useRef } from 'react';
import { Upload, File, X, Image as ImageIcon, FileText, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';

interface FileUploaderProps {
  accept?: string;
  maxSizeMB?: number;
  onUpload: (file: File) => Promise<{ success: boolean; error?: string }>;
  disabled?: boolean;
}

const FileUploader: React.FC<FileUploaderProps> = ({
  accept = '.png,.jpg,.jpeg,.webp,.pdf',
  maxSizeMB = 10,
  onUpload,
  disabled = false,
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [status, setStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [progress, setProgress] = useState(0);
  const [isDragOver, setIsDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const allowedTypes = ['image/png', 'image/jpeg', 'image/webp', 'application/pdf'];

  const validateFile = (f: File): string | null => {
    if (!allowedTypes.includes(f.type) && !accept.includes(f.name.split('.').pop() || '')) {
      return 'Tipo de archivo no permitido. Usa PNG, JPG, WebP o PDF.';
    }
    if (f.size > maxSizeMB * 1024 * 1024) {
      return `El archivo excede el límite de ${maxSizeMB}MB.`;
    }
    return null;
  };

  const handleFile = (f: File) => {
    const err = validateFile(f);
    if (err) {
      setErrorMsg(err);
      setStatus('error');
      return;
    }
    setFile(f);
    setErrorMsg('');
    setStatus('idle');
    setProgress(0);

    if (f.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => setPreview(e.target?.result as string);
      reader.readAsDataURL(f);
    } else {
      setPreview(null);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => setIsDragOver(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) handleFile(f);
  };

  const removeFile = () => {
    setFile(null);
    setPreview(null);
    setStatus('idle');
    setProgress(0);
    setErrorMsg('');
    if (inputRef.current) inputRef.current.value = '';
  };

  const handleUpload = async () => {
    if (!file) return;
    setStatus('uploading');
    setProgress(10);
    const result = await onUpload(file);
    if (result.success) {
      setStatus('success');
      setProgress(100);
    } else {
      setStatus('error');
      setErrorMsg(result.error || 'Error al subir el archivo.');
    }
  };

  const isImage = file?.type.startsWith('image/');

  return (
    <div className="space-y-3">
      {status === 'idle' && !file && (
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => inputRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition
            ${isDragOver ? 'border-orange-500 bg-orange-50' : 'border-gray-300 hover:border-orange-400 hover:bg-orange-50/50'}`}
        >
          <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
          <p className="text-sm text-gray-600 font-medium">Arrastra tu comprobante aquí</p>
          <p className="text-xs text-gray-400 mt-1">o haz clic para seleccionar (PNG, JPG, PDF - max {maxSizeMB}MB)</p>
          <input
            ref={inputRef}
            type="file"
            accept={accept}
            onChange={handleChange}
            className="hidden"
            disabled={disabled}
          />
        </div>
      )}

      {file && status !== 'success' && (
        <div className="border border-gray-200 rounded-xl p-4 bg-white">
          <div className="flex items-start gap-3">
            {isImage && preview ? (
              <img src={preview} alt="Preview" className="w-16 h-16 rounded-lg object-cover border" />
            ) : (
              <div className="w-16 h-16 rounded-lg bg-blue-50 flex items-center justify-center">
                <FileText className="w-8 h-8 text-blue-600" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-[#1a2332] truncate">{file.name}</p>
              <p className="text-xs text-gray-500">{(file.size / 1024 / 1024).toFixed(1)} MB</p>
              {status === 'uploading' && (
                <div className="mt-2">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-orange-500 h-2 rounded-full transition-all" style={{ width: `${progress}%` }} />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Subiendo... {progress}%</p>
                </div>
              )}
            </div>
            <button onClick={removeFile} className="p-1 hover:bg-gray-100 rounded" disabled={status === 'uploading'}>
              <X className="w-4 h-4 text-gray-500" />
            </button>
          </div>

          {status === 'error' && (
            <div className="flex items-start gap-2 mt-3 p-2 bg-red-50 rounded-lg">
              <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-red-700">{errorMsg}</p>
            </div>
          )}

          {status === 'idle' && (
            <button
              onClick={handleUpload}
              disabled={disabled}
              className="mt-3 w-full bg-orange-500 hover:bg-orange-600 text-white py-2 rounded-lg text-sm font-semibold disabled:opacity-50"
            >
              Subir Comprobante
            </button>
          )}
        </div>
      )}

      {status === 'success' && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-start gap-3">
          <CheckCircle2 className="w-8 h-8 text-green-600 flex-shrink-0" />
          <div>
            <p className="font-semibold text-green-900">Comprobante recibido</p>
            <p className="text-sm text-green-700">Pendiente de verificacion (24-48h habiles)</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default FileUploader;
