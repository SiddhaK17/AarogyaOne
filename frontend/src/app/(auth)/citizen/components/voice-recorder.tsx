"use client";

import React, { useState, useEffect, useRef } from "react";
import { Mic, Square, Play, Trash2, CheckCircle2, Sparkles, AlertCircle } from "lucide-react";

interface VoiceRecorderProps {
  onAudioReady: (blob: Blob | null) => void;
}

export default function VoiceRecorder({ onAudioReady }: VoiceRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [duration, setDuration] = useState(0);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    if (isRecording) {
      timerRef.current = setInterval(() => {
        setDuration((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRecording]);

  const startRecording = async () => {
    try {
      setError(null);
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(chunksRef.current, { type: "audio/webm" });
        const url = URL.createObjectURL(audioBlob);
        setAudioUrl(url);
        onAudioReady(audioBlob);
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setDuration(0);
      setAudioUrl(null);
      onAudioReady(null);
    } catch (err) {
      console.error("Failed to start recording:", err);
      setError("Microphone access denied or not available.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const deleteRecording = () => {
    setAudioUrl(null);
    setDuration(0);
    onAudioReady(null);
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60).toString().padStart(2, "0");
    const s = (secs % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  return (
    <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-5 shadow-inner">
      <div className="flex items-center justify-between mb-4">
        <h4 className="font-extrabold text-xs text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
          <Mic className="h-4 w-4 text-teal-600" /> Voice Complaint Intake
        </h4>
        {isRecording && (
          <span className="flex h-2.5 w-2.5 rounded-full bg-rose-500 animate-pulse"></span>
        )}
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 mb-4 text-xs font-bold text-red-700 bg-red-100 rounded-lg">
          <AlertCircle className="h-4 w-4" />
          {error}
        </div>
      )}

      <div className="flex flex-col items-center justify-center py-6 text-center">
        {!isRecording && !audioUrl && (
          <>
            <button
              type="button"
              onClick={startRecording}
              className="h-16 w-16 rounded-full bg-teal-600 hover:bg-teal-700 text-white flex items-center justify-center shadow-lg hover:shadow-teal-500/20 hover:-translate-y-0.5 transition-all duration-300"
            >
              <Mic className="h-7 w-7" />
            </button>
            <p className="text-xs text-slate-500 font-bold mt-3">Click to start recording voice memo</p>
            <p className="text-[10px] text-slate-400 mt-1">Supports speech in English, Hindi, and Marathi</p>
          </>
        )}

        {isRecording && (
          <>
            {/* Audio Wave Visualizer Simulation */}
            <div className="flex items-center justify-center gap-1.5 mb-6 h-12">
              {[...Array(12)].map((_, i) => (
                <div
                  key={i}
                  className="w-1.5 bg-teal-500 rounded-full animate-pulse"
                  style={{
                    height: `${Math.max(10, Math.random() * 40)}px`,
                    animationDelay: `${i * 0.05}s`,
                    animationDuration: '0.5s'
                  }}
                ></div>
              ))}
            </div>

            <p className="text-3xl font-black text-slate-800 mb-6 font-mono tracking-tight">
              {formatTime(duration)}
            </p>
            <button
              type="button"
              onClick={stopRecording}
              className="h-14 w-14 rounded-full bg-rose-500 hover:bg-rose-600 text-white flex items-center justify-center shadow-lg hover:shadow-rose-500/20 hover:-translate-y-0.5 transition-all duration-300"
            >
              <Square className="h-5 w-5 fill-current" />
            </button>
            <p className="text-xs text-slate-500 font-bold mt-3">Stop Recording</p>
          </>
        )}

        {audioUrl && !isRecording && (
          <div className="w-full mt-4">
            <div className="flex flex-col sm:flex-row items-center gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm max-w-sm mx-auto">
              <div className="bg-teal-50 text-teal-600 p-2 rounded-lg">
                <Play className="h-4 w-4" />
              </div>
              <div className="flex-1 text-left w-full">
                <p className="text-xs font-bold text-slate-700">Voice Recording</p>
                <p className="text-[10px] text-slate-400">Duration: {formatTime(duration)}</p>
                <audio src={audioUrl} controls className="w-full h-8 mt-2" />
              </div>
              <button
                type="button"
                onClick={deleteRecording}
                className="text-rose-500 hover:text-rose-700 p-2 hover:bg-rose-50 rounded-lg transition-colors flex-shrink-0"
              >
                <Trash2 className="h-5 w-5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
