"use client";

import React, { useState } from "react";
import { Upload, X, Check, Image as ImageIcon, Sparkles, AlertCircle } from "lucide-react";

interface ImageUploaderProps {
  onImageReady: (file: File | null) => void;
}

export default function ImageUploader({ onImageReady }: ImageUploaderProps) {
  const [dragActive, setDragActive] = useState(false);
  const [selectedImagePreview, setSelectedImagePreview] = useState<string | null>(null);
  const [fileDetails, setFileDetails] = useState<{name: string, size: string} | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const processFile = (file: File) => {
    setError(null);
    if (!file.type.startsWith("image/") && !file.type.startsWith("video/")) {
      setError("Only image and video uploads are allowed.");
      return;
    }
    if (file.size > 20 * 1024 * 1024) { // 20MB limit
      setError("File size exceeds 20MB limit.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setSelectedImagePreview(reader.result as string);
      setFileDetails({
        name: file.name,
        size: (file.size / (1024 * 1024)).toFixed(2) + " MB"
      });
      onImageReady(file);
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const removeImage = () => {
    setSelectedImagePreview(null);
    setFileDetails(null);
    onImageReady(null);
  };

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-2">
        <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
          Photo Evidence Upload
        </label>
        <span className="text-[10px] text-slate-400 font-bold">Max file size: 5MB</span>
      </div>

      {!selectedImagePreview ? (
        <div
          onDragEnter={handleDrag}
          onDragOver={handleDrag}
          onDragLeave={handleDrag}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-2xl p-8 text-center flex flex-col items-center justify-center transition-all ${
            dragActive 
              ? "border-teal-500 bg-teal-50/50" 
              : "border-slate-300 hover:border-slate-400 bg-slate-50 hover:bg-slate-100/50"
          }`}
        >
          <input
            type="file"
            id="image-upload-input"
            className="hidden"
            accept="image/*"
            onChange={handleChange}
          />
          <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
          <div className="h-12 w-12 bg-white rounded-xl shadow-sm border border-slate-100 flex items-center justify-center text-slate-400 mb-3">
            <Upload className="h-5 w-5" />
          </div>
          <p className="text-sm text-slate-700 font-bold">
            Drag & drop your image here, or{" "}
            <label
              htmlFor="image-upload-input"
              className="text-teal-600 hover:text-teal-700 cursor-pointer underline"
            >
              browse files
            </label>
          </p>
          <p className="text-xs text-slate-400 mt-1">Supports PNG, JPG, JPEG formats</p>
        </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="relative rounded-2xl border border-slate-200 overflow-hidden bg-slate-50 flex items-center justify-center p-2 max-w-md mx-auto">
            <img
              src={selectedImagePreview}
              alt="Evidence preview"
              className="max-h-60 rounded-xl object-contain shadow-sm"
            />
            <button
              type="button"
              onClick={removeImage}
              className="absolute top-4 right-4 bg-slate-900/80 hover:bg-slate-900 text-white rounded-full p-1.5 shadow-md hover:scale-105 transition-all"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          {fileDetails && (
            <div className="bg-white border border-slate-100 p-3 rounded-xl max-w-md mx-auto shadow-sm flex items-center gap-3">
              <div className="bg-slate-50 text-slate-500 p-2 rounded-lg">
                <ImageIcon className="h-4 w-4" />
              </div>
              <div className="text-left">
                <p className="text-xs font-bold text-slate-700 truncate max-w-[200px]">{fileDetails.name}</p>
                <p className="text-[10px] text-slate-400">{fileDetails.size}</p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
