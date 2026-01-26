'use client';

import { useState, useRef } from 'react';
import { useToast } from './ui/toast';

interface ImageUploaderProps {
  onUploadComplete: (key: string, url: string, blurhash?: string) => void;
  id?: string;
}

export function ImageUploader({ onUploadComplete, id }: ImageUploaderProps) {
  const { error: toastError } = useToast();
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  const handleFile = async (file: File) => {
    // Validate file type
    if (!file.type.match(/^image\/(jpeg|jpg|webp)$/)) {
      toastError('Only JPG and WEBP images are allowed');
      return;
    }

    // Validate file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      toastError('File size must be less than 10MB');
      return;
    }

    // Show preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    // Upload
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('image', file);

      const res = await fetch('/api/upload/header-image', {
        method: 'POST',
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        onUploadComplete(data.key, data.url, data.blurhash);
      } else {
        toastError('Failed to upload image');
      }
    } catch (error) {
      console.error('Upload error', error);
      toastError('Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div 
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`relative rounded-lg transition-all ${isDragging ? 'ring-2 ring-primary ring-offset-2 ring-offset-ink scale-[1.02] bg-primary/5' : ''}`}
    >
      <input
        ref={fileInputRef}
        id={id}
        type="file"
        accept="image/jpeg,image/jpg,image/webp"
        onChange={handleFileSelect}
        className="hidden"
      />
      <button
        onClick={() => fileInputRef.current?.click()}
        disabled={uploading}
        className={`size-10 flex items-center justify-center rounded-lg transition-colors disabled:opacity-50 ${isDragging ? 'text-primary' : 'text-tertiary hover:text-paper hover:bg-white/5'}`}
        title="Header photo"
      >
        {uploading ? (
          <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        ) : (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        )}
      </button>
      {preview && (
        <div className="mt-2 relative">
          <img src={preview} alt="Preview" className="w-full h-48 object-cover rounded-lg" />
          <button
            onClick={() => {
              setPreview(null);
              if (fileInputRef.current) fileInputRef.current.value = '';
            }}
            className="absolute top-2 right-2 p-1 bg-ink/80 rounded-full text-white hover:bg-ink"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
}
