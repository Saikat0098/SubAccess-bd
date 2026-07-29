import React, { useState, useRef } from 'react';
import { Upload, X, Image as ImageIcon, Loader2, RefreshCw, Eye, Check, AlertCircle } from 'lucide-react';
import api from '../lib/api';

export interface ImageUploaderProps {
  value?: string | string[];
  onChange: (url: any) => void;
  label?: string;
  helperText?: string;
  multiple?: boolean;
  maxFiles?: number;
  compact?: boolean;
  className?: string;
  disabled?: boolean;
}

const ALLOWED_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp'];
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

// Client-side image compression helper
const compressImageIfNeeded = async (file: File): Promise<File | Blob> => {
  // If file is already smaller than 400KB, skip canvas compression
  if (file.size <= 400 * 1024) return file;

  return new Promise((resolve) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      const canvas = document.createElement('canvas');
      let { width, height } = img;
      const maxDim = 1920;

      if (width > maxDim || height > maxDim) {
        if (width > height) {
          height = Math.round((height * maxDim) / width);
          width = maxDim;
        } else {
          width = Math.round((width * maxDim) / height);
          height = maxDim;
        }
      }

      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(file);
        return;
      }

      ctx.drawImage(img, 0, 0, width, height);
      canvas.toBlob(
        (blob) => {
          if (blob && blob.size < file.size) {
            resolve(new File([blob], file.name.replace(/\.[^/.]+$/, '') + '.jpg', { type: 'image/jpeg' }));
          } else {
            resolve(file);
          }
        },
        'image/jpeg',
        0.85
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(file);
    };

    img.src = objectUrl;
  });
};

export const ImageUploader: React.FC<ImageUploaderProps> = ({
  value,
  onChange,
  label,
  helperText = 'JPG, JPEG, PNG, or WEBP (Max 10MB)',
  multiple = false,
  maxFiles = 5,
  compact = false,
  className = '',
  disabled = false,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [errorMessage, setErrorMessage] = useState('');
  const [previewModalUrl, setPreviewModalUrl] = useState<string | null>(null);

  // Normalizing value as list or single
  const imageList: string[] = multiple
    ? Array.isArray(value)
      ? value.filter(Boolean)
      : value
      ? [value]
      : []
    : typeof value === 'string' && value.trim()
    ? [value.trim()]
    : [];

  const validateFile = (file: File): string | null => {
    const ext = file.name.split('.').pop()?.toLowerCase() || '';
    if (!ALLOWED_EXTENSIONS.includes(ext) && !ALLOWED_MIME_TYPES.includes(file.type)) {
      return `Invalid image format (${ext}). Only JPG, JPEG, PNG, and WEBP files are allowed.`;
    }
    if (file.size > MAX_FILE_SIZE) {
      return `File size exceeds 10MB limit (${(file.size / (1024 * 1024)).toFixed(1)}MB).`;
    }
    return null;
  };

  const uploadSingleFileToImgBB = async (file: File): Promise<string> => {
    // 1. Compress image if needed
    const fileToUpload = await compressImageIfNeeded(file);

    const apiKey = (import.meta as any).env?.VITE_IMGBB_API_KEY;

    // Try direct upload to ImgBB if key exists in env
    if (apiKey && apiKey.trim() && apiKey !== 'YOUR_IMGBB_API_KEY') {
      try {
        const formData = new FormData();
        formData.append('image', fileToUpload);

        const response = await fetch(`https://api.imgbb.com/1/upload?key=${apiKey.trim()}`, {
          method: 'POST',
          body: formData,
        });

        const data = await response.json();
        if (data && data.success && data.data?.url) {
          return data.data.url;
        }
      } catch (err) {
        console.warn('Direct ImgBB upload failed, falling back to backend upload proxy:', err);
      }
    }

    // Fallback: Upload via backend Express proxy
    const formData = new FormData();
    formData.append('image', fileToUpload);

    const res = await api.post('/upload/imgbb', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });

    if (res.data && res.data.success && res.data.url) {
      return res.data.url;
    }

    throw new Error(res.data?.message || 'Failed to upload image to ImgBB.');
  };

  const handleFiles = async (files: FileList | File[]) => {
    const fileArray = Array.from(files);
    if (fileArray.length === 0) return;

    setErrorMessage('');

    // Filter valid files
    const validFiles: File[] = [];
    for (const f of fileArray) {
      const err = validateFile(f);
      if (err) {
        setErrorMessage(err);
        return;
      }
      validFiles.push(f);
    }

    if (multiple && imageList.length + validFiles.length > maxFiles) {
      setErrorMessage(`Maximum ${maxFiles} images allowed.`);
      return;
    }

    try {
      setUploading(true);
      setProgress(20);

      const uploadedUrls: string[] = [];
      const total = validFiles.length;

      for (let i = 0; i < total; i++) {
        const file = validFiles[i];
        const url = await uploadSingleFileToImgBB(file);
        uploadedUrls.push(url);
        setProgress(Math.round(((i + 1) / total) * 100));
      }

      if (multiple) {
        const nextList = [...imageList, ...uploadedUrls];
        onChange(nextList);
      } else {
        onChange(uploadedUrls[0] || '');
      }
    } catch (err: any) {
      console.error('Image upload error:', err);
      setErrorMessage(err.message || 'Upload failed. Please verify ImgBB API key and internet connection.');
    } finally {
      setUploading(false);
      setProgress(0);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (disabled || uploading) return;
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleRemoveIndex = (indexToRemove: number) => {
    if (multiple) {
      const nextList = imageList.filter((_, idx) => idx !== indexToRemove);
      onChange(nextList);
    } else {
      onChange('');
    }
  };

  return (
    <div className={`space-y-2 ${className}`}>
      {label && (
        <div className="flex items-center justify-between">
          <label className="block text-xs font-semibold text-slate-300">{label}</label>
          {multiple && (
            <span className="text-[10px] text-slate-400 font-mono">
              {imageList.length} / {maxFiles} images
            </span>
          )}
        </div>
      )}

      {/* Upload Box / Drag & Drop Area */}
      {(!multiple && imageList.length === 0) || (multiple && imageList.length < maxFiles) ? (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => !disabled && !uploading && fileInputRef.current?.click()}
          className={`relative border-2 border-dashed rounded-2xl p-4 transition-all duration-200 cursor-pointer flex flex-col items-center justify-center text-center ${
            isDragging
              ? 'border-sky-500 bg-sky-500/10 scale-[1.01]'
              : 'border-slate-800 bg-slate-950/80 hover:border-slate-700 hover:bg-slate-900/50'
          } ${disabled || uploading ? 'opacity-60 cursor-not-allowed' : ''} ${
            compact ? 'py-3 px-3 min-h-[90px]' : 'min-h-[130px]'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
            multiple={multiple}
            onChange={(e) => e.target.files && handleFiles(e.target.files)}
            disabled={disabled || uploading}
            className="hidden"
          />

          {uploading ? (
            <div className="flex flex-col items-center gap-2 py-2 w-full max-w-xs">
              <Loader2 className="w-6 h-6 text-sky-400 animate-spin" />
              <p className="text-xs font-bold text-sky-400">Uploading to ImgBB...</p>
              <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                <div
                  className="bg-sky-500 h-full transition-all duration-300 rounded-full"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-1.5">
              <div className="w-9 h-9 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-400 flex items-center justify-center">
                <Upload className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-white">
                  Click or drag & drop to upload image
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5">{helperText}</p>
              </div>
            </div>
          )}
        </div>
      ) : null}

      {/* Error Message */}
      {errorMessage && (
        <div className="p-2.5 bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs rounded-xl flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMessage}</span>
          <button
            type="button"
            onClick={() => setErrorMessage('')}
            className="ml-auto text-slate-400 hover:text-white"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Uploaded Image Previews */}
      {imageList.length > 0 && (
        <div className={multiple ? 'grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-1' : 'pt-1'}>
          {imageList.map((imgUrl, idx) => (
            <div
              key={idx}
              className="relative group bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden p-2 flex items-center gap-3"
            >
              <img
                src={imgUrl}
                alt={`Uploaded ${idx + 1}`}
                className="w-14 h-14 object-cover rounded-xl border border-slate-800 bg-slate-950 shrink-0 cursor-pointer"
                onClick={() => setPreviewModalUrl(imgUrl)}
                onError={(e) => {
                  (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=300&auto=format&fit=crop&q=80';
                }}
              />

              <div className="flex-1 min-w-0 pr-1">
                <div className="flex items-center gap-1.5 text-emerald-400 text-[10px] font-extrabold uppercase tracking-wide">
                  <Check className="w-3 h-3" /> ImgBB Uploaded
                </div>
                <p className="text-xs text-slate-300 font-mono truncate mt-0.5" title={imgUrl}>
                  {imgUrl}
                </p>
              </div>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setPreviewModalUrl(imgUrl)}
                  className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
                  title="View full size"
                >
                  <Eye className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="p-1.5 text-slate-400 hover:text-sky-400 hover:bg-slate-800 rounded-lg transition"
                  title="Replace image"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={() => handleRemoveIndex(idx)}
                  className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition"
                  title="Remove image"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Lightbox Modal */}
      {previewModalUrl && (
        <div
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4"
          onClick={() => setPreviewModalUrl(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh] bg-slate-900 border border-slate-800 rounded-2xl p-2 overflow-hidden shadow-2xl flex flex-col items-center">
            <button
              onClick={() => setPreviewModalUrl(null)}
              className="absolute top-4 right-4 p-2 bg-slate-950/80 text-white hover:bg-slate-800 rounded-full z-10"
            >
              <X className="w-5 h-5" />
            </button>
            <img
              src={previewModalUrl}
              alt="Full Preview"
              className="max-h-[80vh] w-auto object-contain rounded-xl"
            />
            <div className="p-3 w-full text-center">
              <a
                href={previewModalUrl}
                target="_blank"
                rel="noreferrer"
                className="text-xs text-sky-400 font-mono hover:underline truncate inline-block max-w-full"
              >
                {previewModalUrl}
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
