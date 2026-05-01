/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Mic, 
  Settings, 
  Play, 
  Square, 
  Download, 
  AudioLines, 
  Volume2, 
  Loader2, 
  RotateCcw,
  AlertCircle
} from 'lucide-react';
import { generateHondurasAudio } from './services/geminiService';
import { base64ToUint8Array, createWavBlob } from './lib/audioUtils';

export default function App() {
  const [text, setText] = useState('');
  const [speed, setSpeed] = useState(5); // 1 to 10
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Map speed slider (1-10) to playbackRate (0.5-2.0)
  const playbackRate = 0.5 + (speed - 1) * (1.5 / 9);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.playbackRate = playbackRate;
    }
  }, [playbackRate]);

  useEffect(() => {
    if (audioRef.current && audioUrl) {
      audioRef.current.src = audioUrl;
      audioRef.current.load();
    }
  }, [audioUrl]);

  const handleGenerate = async () => {
    if (!text.trim()) {
      setError('Por favor, ingresa un guion para generar el audio.');
      return;
    }

    setIsGenerating(true);
    setError(null);
    setAudioUrl(null);
    setIsPlaying(false);

    try {
      const result = await generateHondurasAudio(text);
      if (result.error) {
        setError(result.error);
      } else if (result.audioBase64) {
        const audioBytes = base64ToUint8Array(result.audioBase64);
        const blob = createWavBlob(audioBytes);
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);
      }
    } catch (err) {
      setError('Error al conectar con la IA. Inténtalo de nuevo.');
    } finally {
      setIsGenerating(false);
    }
  };

  const togglePlay = () => {
    if (!audioRef.current || !audioUrl) return;

    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play().catch(err => {
        console.error("Error playing audio:", err);
        setError("Error al reproducir el audio. Verifica tu conexión.");
      });
    }
  };

  const handleStop = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setIsPlaying(false);
    }
  };

  const handleDownload = () => {
    if (!audioUrl) return;
    const a = document.createElement('a');
    a.href = audioUrl;
    a.download = `locucion_hondurena_${Date.now()}.wav`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 font-sans">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-2xl bg-white rounded-[3rem] shadow-[0_32px_64px_-12px_rgba(0,0,0,0.5)] overflow-hidden border border-slate-100"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-700 via-blue-600 to-indigo-800 p-8 text-white relative">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 backdrop-blur-md rounded-2xl">
                <Mic className="w-6 h-6" />
              </div>
              <h1 className="text-2xl font-bold tracking-tight">Honduras Voice AI</h1>
            </div>
            <div className="flex items-center gap-2 px-3 py-1 bg-white/10 backdrop-blur-sm rounded-full text-xs font-medium uppercase tracking-wider">
              <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
              Voz Grave & Dinámica
            </div>
          </div>
          <p className="text-indigo-100 text-sm font-medium ml-12 opacity-80">Locuciones profesionales con acento catracho</p>
          
          {/* Decorative wave */}
          <div className="absolute bottom-0 left-0 w-full opacity-10">
            <AudioLines className="w-full h-12 stroke-[1px]" />
          </div>
        </div>

        {/* Content */}
        <div className="p-10 space-y-8">
          {/* Text Editor */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                Editor de Guion
              </label>
              <span className="text-[10px] bg-slate-100 text-slate-400 px-2 py-0.5 rounded-full">
                {text.length} caracteres
              </span>
            </div>
            <textarea
              id="script-editor"
              className="w-full h-40 p-6 bg-slate-50 border border-slate-200 rounded-[2rem] text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-indigo-100 focus:bg-white focus:border-indigo-400 transition-all resize-none shadow-inner"
              placeholder="Escribe el guion aquí..."
              value={text}
              onChange={(e) => setText(e.target.value)}
            />
          </div>

          {/* Controls */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            {/* Speed Slider */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                  <RotateCcw className="w-3 h-3" /> Velocidad
                </label>
                <span className="text-sm font-mono font-bold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full">
                  {playbackRate.toFixed(2)}x
                </span>
              </div>
              <input
                id="speed-range"
                type="range"
                min="1"
                max="10"
                step="0.5"
                value={speed}
                onChange={(e) => setSpeed(parseFloat(e.target.value))}
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600 hover:accent-indigo-700 transition-colors"
              />
              <div className="flex justify-between text-[10px] text-slate-400 font-bold uppercase tracking-tighter">
                <span>Lento (0.5x)</span>
                <span>Normal (1.0x)</span>
                <span>Rápido (2.0x)</span>
              </div>
            </div>

            {/* Generate Button */}
            <div className="flex justify-end">
              <button
                id="generate-btn"
                onClick={handleGenerate}
                disabled={isGenerating}
                className={`group relative w-full h-16 flex items-center justify-center gap-3 bg-indigo-600 active:bg-indigo-700 disabled:bg-indigo-400 text-white rounded-3xl font-bold transition-all shadow-xl shadow-indigo-200 hover:shadow-indigo-300 hover:scale-[1.02] active:scale-[0.98] overflow-hidden`}
              >
                {isGenerating ? (
                  <Loader2 className="w-6 h-6 animate-spin" />
                ) : (
                  <>
                    <Volume2 className="w-6 h-6 group-hover:animate-bounce" />
                    Generar Locución
                  </>
                )}
                
                {/* Pulsing overlay for active generation */}
                {isGenerating && (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: [0.1, 0.3, 0.1] }}
                    transition={{ repeat: Infinity, duration: 1.5 }}
                    className="absolute inset-0 bg-white"
                  />
                )}
              </button>
            </div>
          </div>

          {/* Error Message */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="flex items-center gap-3 p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl text-sm"
              >
                <AlertCircle className="w-5 h-5 shrink-0" />
                <p className="font-medium">{error}</p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Audio Player Card */}
          <AnimatePresence>
            {audioUrl && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="p-8 bg-slate-900 rounded-[2.5rem] text-white shadow-2xl border border-slate-800"
              >
                <div className="flex flex-col md:flex-row items-center gap-8">
                  <div className="flex-1 space-y-4 w-full">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Resultado de Audio</p>
                      <div className="flex gap-2">
                        <span className="text-[10px] font-mono text-indigo-400">24kHz</span>
                        <span className="text-[10px] font-mono text-indigo-400">PCM 16-bit</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4 bg-slate-800/50 p-4 rounded-3xl border border-slate-700">
                      <div className="flex items-center gap-3">
                        <button
                          id="play-pause-btn"
                          onClick={togglePlay}
                          className="w-12 h-12 flex items-center justify-center bg-indigo-500 hover:bg-indigo-400 rounded-2xl transition-colors shadow-lg shadow-indigo-500/20"
                        >
                          {isPlaying ? <Square className="w-5 h-5 fill-white" /> : <Play className="w-5 h-5 fill-white" />}
                        </button>
                        <button
                          id="stop-btn"
                          onClick={handleStop}
                          className="w-12 h-12 flex items-center justify-center bg-slate-700 hover:bg-slate-600 rounded-2xl transition-colors"
                        >
                          <RotateCcw className="w-5 h-5" />
                        </button>
                      </div>
                      
                      <div className="flex-1 flex flex-col gap-1 px-2">
                        <div className="h-1 bg-slate-700 rounded-full overflow-hidden">
                          <motion.div 
                            className="h-full bg-indigo-500"
                            animate={{ width: isPlaying ? '100%' : '0%' }}
                            transition={{ duration: audioRef.current?.duration || 1, ease: "linear" }}
                          />
                        </div>
                        <div className="flex justify-between text-[8px] font-bold text-slate-500 uppercase">
                          <span>0:00</span>
                          <span>Audio Listo</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="shrink-0 w-full md:w-auto">
                    <button
                      id="download-btn"
                      onClick={handleDownload}
                      className="w-full md:w-auto px-8 h-16 flex items-center justify-center gap-3 bg-white text-slate-900 rounded-3xl font-bold hover:bg-slate-100 transition-all active:scale-95 shadow-xl shadow-black/20"
                    >
                      <Download className="w-5 h-5" />
                      Descargar .WAV
                    </button>
                  </div>
                </div>

                <audio
                  ref={audioRef}
                  onPlay={() => setIsPlaying(true)}
                  onPause={() => setIsPlaying(false)}
                  onEnded={() => setIsPlaying(false)}
                  className="hidden"
                />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Empty state or processing skeleton */}
          {!audioUrl && !isGenerating && !error && (
            <div className="py-12 border-2 border-dashed border-slate-100 rounded-[2.5rem] flex flex-col items-center justify-center gap-4 text-slate-300">
              <AudioLines className="w-12 h-12 opacity-30" />
              <p className="text-sm font-medium">Ingresa un texto y haz clic en Generar para escuchar la magia</p>
            </div>
          )}

          {isGenerating && (
            <div className="p-8 bg-slate-50 rounded-[2.5rem] animate-pulse space-y-4">
              <div className="h-4 w-32 bg-slate-200 rounded-full" />
              <div className="h-16 w-full bg-slate-200 rounded-3xl" />
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-10 py-6 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            <Settings className="w-3 h-3" /> Engine: Gemini 2.5 TTS
          </div>
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            Made with • HN Pride
          </div>
        </div>
      </motion.div>
    </div>
  );
}
