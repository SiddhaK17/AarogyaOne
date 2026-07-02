"use client";

import React, { useState, useEffect, useRef } from "react";
import { Mic, Square, Play, Trash2, CheckCircle2, Sparkles } from "lucide-react";

interface VoiceRecorderProps {
  onTranscriptionComplete: (text: string) => void;
}

export default function VoiceRecorder({ onTranscriptionComplete }: VoiceRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [duration, setDuration] = useState(0);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [transcribing, setTranscribing] = useState(false);
  const [transcribedText, setTranscribedText] = useState("");
  const timerRef = useRef<NodeJS.Timeout | null>(null);

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

  const startRecording = () => {
    setIsRecording(true);
    setDuration(0);
    setAudioUrl(null);
    setTranscribedText("");
  };

  const stopRecording = () => {
    setIsRecording(false);
    // Simulate recording save and speech-to-text transcriptions
    setAudioUrl("mock-audio-blob-url");
    setTranscribing(true);

    setTimeout(() => {
      setTranscribing(false);
      const mockTranscripts = [
        "दवाखाने मध्ये औषध उपलब्ध नाही, मी तीन दिवसांपासून हेलपाटे मारत आहे.", // Marathi
        "अस्पताल में डॉक्टर उपस्थित नहीं थे और ओपीडी में बहुत भीड़ थी।", // Hindi
        "The ceiling in the pediatric ward is leaking water and the floor is very slippery.", // English
        "No stretchers were available at the main gate when the ambulance arrived.", // English
      ];
      // Pick a random mock transcript
      const selectedText = mockTranscripts[Math.floor(Math.random() * mockTranscripts.length)];
      setTranscribedText(selectedText);
      onTranscriptionComplete(selectedText);
    }, 2000); // 2 seconds transcribing
  };

  const deleteRecording = () => {
    setAudioUrl(null);
    setDuration(0);
    setTranscribedText("");
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
            <div className="flex items-center gap-1.5 h-10 mb-5 justify-center">
              {[...Array(9)].map((_, i) => (
                <span
                  key={i}
                  className="w-1.5 bg-teal-500 rounded-full animate-pulse"
                  style={{
                    height: `${Math.floor(10 + Math.random() * 30)}px`,
                    animationDelay: `${i * 0.1}s`,
                    animationDuration: "0.6s",
                  }}
                ></span>
              ))}
            </div>
            
            <div className="text-xl font-black text-slate-800 tabular-nums mb-3">
              {formatTime(duration)}
            </div>

            <button
              type="button"
              onClick={stopRecording}
              className="h-14 w-14 rounded-full bg-rose-600 hover:bg-rose-700 text-white flex items-center justify-center shadow-lg hover:shadow-rose-500/20 hover:-translate-y-0.5 transition-all duration-300"
            >
              <Square className="h-5 w-5" />
            </button>
            <p className="text-xs text-slate-500 font-bold mt-3">Click to stop and analyze voice</p>
          </>
        )}

        {audioUrl && !transcribing && (
          <div className="w-full">
            <div className="flex items-center gap-4 justify-center bg-white border border-slate-100 p-3 rounded-xl shadow-sm max-w-sm mx-auto mb-4">
              <div className="bg-teal-50 text-teal-600 p-2 rounded-lg">
                <Play className="h-4 w-4" />
              </div>
              <div className="flex-1 text-left">
                <p className="text-xs font-bold text-slate-700">VoiceRecording.wav</p>
                <p className="text-[10px] text-slate-400">Duration: {formatTime(duration)}</p>
              </div>
              <button
                type="button"
                onClick={deleteRecording}
                className="text-rose-500 hover:text-rose-700 p-1.5 hover:bg-rose-50 rounded-lg transition-colors"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>

            {transcribedText && (
              <div className="bg-white border border-teal-100 rounded-xl p-4 text-left shadow-sm max-w-md mx-auto relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-teal-500/5 to-transparent -z-10"></div>
                <div className="flex items-center gap-1.5 text-[10px] font-bold text-teal-600 uppercase tracking-wider mb-2">
                  <Sparkles className="h-3 w-3 animate-spin" /> Speech Recognition Result
                </div>
                <p className="text-xs text-slate-700 leading-relaxed italic font-medium">
                  "{transcribedText}"
                </p>
                <div className="flex items-center gap-1 text-[9px] text-emerald-600 font-bold mt-3 bg-emerald-50 px-2 py-0.5 rounded-full w-max">
                  <CheckCircle2 className="h-3 w-3" /> Transcribed via IndicWhisper
                </div>
              </div>
            )}
          </div>
        )}

        {transcribing && (
          <div className="flex flex-col items-center justify-center">
            <div className="h-8 w-8 rounded-full border-4 border-teal-500 border-t-transparent animate-spin mb-3"></div>
            <p className="text-xs text-slate-600 font-bold">Transcribing & Translating...</p>
            <p className="text-[10px] text-slate-400 mt-1">Executing IndicWhisper + IndicTrans2 Pipeline</p>
          </div>
        )}
      </div>
    </div>
  );
}
