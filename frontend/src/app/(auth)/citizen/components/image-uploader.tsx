"use client";

import React, { useState } from "react";
import { Upload, X, Check, Image as ImageIcon, Sparkles } from "lucide-react";

interface ImageUploaderProps {
  onImageUploaded: (url: string) => void;
}

export default function ImageUploader({ onImageUploaded }: ImageUploaderProps) {
  const [dragActive, setDragActive] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<{
    damageDetected: boolean;
    objects: string[];
    severity: string;
    description: string;
  } | null>(null);

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
    if (!file.type.startsWith("image/")) {
      alert("Only image uploads are allowed.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      setSelectedImage(dataUrl);
      onImageUploaded(dataUrl);
      
      // Trigger mock Vision Intelligence (YOLOv11 / LLaVA)
      setAnalyzing(true);
      setAiAnalysis(null);

      setTimeout(() => {
        setAnalyzing(false);
        const fileName = file.name.toLowerCase();
        let objects = ["Structural Damage", "General Clinic"];
        let severity = "Medium";
        let description = "Unstructured area inspected. Minor discrepancies identified.";

        if (fileName.includes("leak") || fileName.includes("water") || fileName.includes("pipe")) {
          objects = ["Water Leakage", "Damp Ceiling", "Piping Anomaly"];
          severity = "High";
          description = "Water leakage on ceilings / walls detected. High risk of slip hazards and infrastructure deterioration.";
        } else if (fileName.includes("dirty") || fileName.includes("garbage") || fileName.includes("dust") || fileName.includes("trash")) {
          objects = ["Overflowing Waste", "Garbage Pile", "Sanitation Neglect"];
          severity = "Medium";
          description = "Piles of unmanaged waste detected in public transit corridor. Sanitation compliance violation.";
        } else if (fileName.includes("broken") || fileName.includes("mri") || fileName.includes("wheelchair") || fileName.includes("bed")) {
          objects = ["Broken Equipment", "Damaged Support Asset"];
          severity = "High";
          description = "Broken clinical support assets detected. Immediate repair needed to ensure operational throughput.";
        }

        setAiAnalysis({
          damageDetected: true,
          objects,
          severity,
          description
        });
      }, 2500); // 2.5s analysis time
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
    setSelectedImage(null);
    setAiAnalysis(null);
  };

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-2">
        <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
          Photo Evidence Upload
        </label>
        <span className="text-[10px] text-slate-400 font-bold">Max file size: 5MB</span>
      </div>

      {!selectedImage ? (
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
      ) : (
        <div className="space-y-4">
          <div className="relative rounded-2xl border border-slate-200 overflow-hidden bg-slate-50 flex items-center justify-center p-2 max-w-md mx-auto">
            <img
              src={selectedImage}
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

          {analyzing && (
            <div className="bg-slate-900/90 text-white p-4 rounded-xl border border-slate-800 flex items-center gap-4 max-w-md mx-auto shadow-lg">
              <div className="h-6 w-6 rounded-full border-2 border-teal-400 border-t-transparent animate-spin shrink-0"></div>
              <div>
                <p className="text-xs font-bold flex items-center gap-1.5 text-teal-400">
                  <Sparkles className="h-3.5 w-3.5 animate-pulse" /> AI Vision Engine Analysis
                </p>
                <p className="text-[10px] text-slate-400 mt-0.5">Running YOLOv11 + LLaVA object detection...</p>
              </div>
            </div>
          )}

          {aiAnalysis && (
            <div className="bg-white border border-teal-100 rounded-xl p-4 shadow-sm max-w-md mx-auto relative overflow-hidden text-left">
              <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-teal-500/5 to-transparent -z-10"></div>
              
              <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-2">
                <span className="text-[10px] font-black text-teal-600 uppercase tracking-wider flex items-center gap-1">
                  <Sparkles className="h-3 w-3 text-teal-500" /> AI Visual Diagnostics
                </span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  aiAnalysis.severity === "Critical" 
                    ? "bg-rose-50 text-rose-700 border border-rose-100" 
                    : aiAnalysis.severity === "High"
                    ? "bg-amber-50 text-amber-700 border border-amber-100"
                    : "bg-slate-50 text-slate-600 border border-slate-100"
                }`}>
                  Severity: {aiAnalysis.severity}
                </span>
              </div>

              <div className="space-y-2">
                <div className="flex flex-wrap gap-1.5 items-center">
                  <span className="text-[10px] font-bold text-slate-400 mr-1">Objects Identified:</span>
                  {aiAnalysis.objects.map((obj, i) => (
                    <span key={i} className="text-[10px] font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md">
                      {obj}
                    </span>
                  ))}
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 mb-0.5">Summary:</p>
                  <p className="text-xs text-slate-600 leading-relaxed font-semibold">
                    {aiAnalysis.description}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1 text-[9px] text-emerald-600 font-bold mt-3.5 bg-emerald-50 px-2 py-0.5 rounded-full w-max border border-emerald-100">
                <Check className="h-3 w-3" /> Image scan parsed successfully
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
