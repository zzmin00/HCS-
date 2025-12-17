import React, { useRef, useState } from 'react';
import { Upload, FileSpreadsheet, X, CheckCircle } from 'lucide-react';

interface FileUploadProps {
  label: string;
  description: string;
  onFileSelect: (file: File | null) => void;
  accept?: string;
}

export const FileUpload: React.FC<FileUploadProps> = ({ 
  label, 
  description, 
  onFileSelect,
  accept = ".xlsx, .xls"
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      onFileSelect(selectedFile);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      setFile(droppedFile);
      onFileSelect(droppedFile);
    }
  };

  const clearFile = () => {
    setFile(null);
    onFileSelect(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="w-full h-full flex flex-col">
      <label className="block text-xs font-bold text-stone-500 uppercase tracking-wider mb-2">
        {label}
      </label>
      
      {!file ? (
        <div
          onClick={() => fileInputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          className={`
            flex-1 relative flex flex-col items-center justify-center p-6
            border-2 border-dashed rounded-xl cursor-pointer transition-all duration-200 min-h-[140px]
            ${isDragging 
              ? 'border-yellow-500 bg-yellow-50 shadow-inner' 
              : 'border-stone-300 hover:border-yellow-400 hover:bg-yellow-50/50 bg-stone-50'}
          `}
        >
          <div className="flex flex-col items-center justify-center pointer-events-none">
            <Upload className={`w-10 h-10 mb-3 ${isDragging ? 'text-yellow-600' : 'text-stone-400'}`} />
            <p className="mb-1 text-sm font-bold text-stone-700 text-center">
              Click to Upload
            </p>
            <p className="text-xs text-stone-500 text-center px-4 leading-relaxed">
              {description}
            </p>
          </div>
          <input 
            ref={fileInputRef}
            type="file" 
            className="hidden" 
            accept={accept} 
            onChange={handleFileChange} 
          />
        </div>
      ) : (
        <div className="flex-1 relative flex items-center p-4 bg-yellow-50 border-2 border-yellow-400 rounded-xl shadow-sm min-h-[140px]">
          <div className="p-3 bg-white rounded-lg border border-yellow-200 mr-4">
            <FileSpreadsheet className="w-8 h-8 text-yellow-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-stone-900 truncate">
              {file.name}
            </p>
            <p className="text-xs text-stone-500 font-medium mt-0.5">
              {(file.size / 1024).toFixed(1)} KB
            </p>
          </div>
          <button 
            onClick={clearFile}
            className="p-2 hover:bg-red-100 rounded-lg transition-colors text-stone-400 hover:text-red-600 absolute top-2 right-2"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="absolute -top-3 -right-3 bg-white rounded-full shadow-sm">
             <CheckCircle className="w-7 h-7 text-green-500 bg-white rounded-full border-2 border-white" fill="currentColor" color="white" />
          </div>
        </div>
      )}
    </div>
  );
};