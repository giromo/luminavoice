import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, Square, Rewind, FastForward, RotateCcw, Volume2, Volume1, VolumeX, Download, Loader2, Sparkles, AlertCircle, FileUp, ChevronDown, Check, Trash2, X, Users, MessageSquare } from 'lucide-react';
import { AppSettings, TranslationTarget } from '../types';
import { UI_TEXT, TARGET_LANGUAGES, THEME_STYLES } from '../constants';
import { translateText, generateSpeech, extractTextFromDocument } from '../services/geminiService';
import { decodeBase64Audio, base64ToWavBlob } from '../services/audioUtils';
import { addHistoryItem } from '../services/db';
import AudioVisualizer from './AudioVisualizer';

interface MainConverterProps {
  settings: AppSettings;
  setSettings: React.Dispatch<React.SetStateAction<AppSettings>>;
}

const formatTime = (seconds: number) => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

const MainConverter: React.FC<MainConverterProps> = ({ settings, setSettings }) => {
  const [inputText, setInputText] = useState('');
  const [selectedLang, setSelectedLang] = useState<TranslationTarget>(TARGET_LANGUAGES[0]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [translatedText, setTranslatedText] = useState<string>('');
  const [isLangMenuOpen, setIsLangMenuOpen] = useState(false);
  const [processingState, setProcessingState] = useState<'idle' | 'extracting' | 'translating'>('idle');
  
  // Audio Player State
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null); // For download
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1.0);
  const [analyser, setAnalyser] = useState<AnalyserNode | null>(null);

  // Audio Refs
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<AudioBufferSourceNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const audioBufferRef = useRef<AudioBuffer | null>(null);
  const startTimeRef = useRef<number>(0); // Context time when playback started
  const offsetRef = useRef<number>(0); // Offset in the buffer where playback started
  const rafRef = useRef<number>(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const langMenuRef = useRef<HTMLDivElement>(null);
  
  const t = UI_TEXT[settings.language];
  const isRTL = settings.language === 'fa';
  const activeGradient = THEME_STYLES[settings.theme];

  // Visualizer Color
  const getVisualizerColor = () => {
     switch(settings.theme) {
         case 'blue': return '#06b6d4';
         case 'purple': return '#d946ef';
         case 'green': return '#10b981';
         case 'red': return '#ef4444';
         default: return '#f59e0b';
     }
  };

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
        if (langMenuRef.current && !langMenuRef.current.contains(event.target as Node)) {
            setIsLangMenuOpen(false);
        }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
        if (sourceRef.current) {
            try { sourceRef.current.stop(); } catch(e) {}
        }
        if (rafRef.current) {
            cancelAnimationFrame(rafRef.current);
        }
    };
  }, []);

  // Initialize Audio Context & Graph
  const initAudioSystem = () => {
    if (!audioContextRef.current) {
      const Ctx = (window.AudioContext || (window as any).webkitAudioContext);
      audioContextRef.current = new Ctx();
      
      const gainNode = audioContextRef.current.createGain();
      gainNode.gain.value = volume;
      gainNodeRef.current = gainNode;

      const analyserNode = audioContextRef.current.createAnalyser();
      analyserNode.fftSize = 64;
      setAnalyser(analyserNode);

      // Connect Gain -> Analyser -> Destination
      // Source will be connected to Gain later
      gainNode.connect(analyserNode);
      analyserNode.connect(audioContextRef.current.destination);
    }
    if (audioContextRef.current.state === 'suspended') {
      audioContextRef.current.resume();
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      setProcessingState('extracting');
      setLoading(true);
      setError(null);

      try {
        const reader = new FileReader();
        reader.onloadend = async () => {
            const base64String = (reader.result as string).split(',')[1];
            try {
                const extractedText = await extractTextFromDocument(base64String, file.type, settings.customApiKey);
                setInputText(extractedText);
            } catch (err: any) {
                setError("Failed to extract text. Ensure you have a valid API Key with Flash model access.");
            } finally {
                setLoading(false);
                setProcessingState('idle');
            }
        };
        reader.readAsDataURL(file);
      } catch (err) {
          setError("Error reading file.");
          setLoading(false);
          setProcessingState('idle');
      }
      if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleProcess = async () => {
    if (!inputText.trim()) return;
    initAudioSystem();
    setProcessingState('translating');
    setLoading(true);
    setError(null);
    setAudioUrl(null);
    setTranslatedText('');
    stopAudio(); // Reset player

    try {
      const translation = await translateText(inputText, selectedLang.name, settings.customApiKey);
      setTranslatedText(translation);
      
      const base64Audio = await generateSpeech(translation, settings.voiceName, settings.customApiKey, settings.conversationMode);
      
      // Save to History
      await addHistoryItem({
          originalText: inputText,
          translatedText: translation,
          language: selectedLang.code,
          audioBase64: base64Audio
      });

      const wavBlob = base64ToWavBlob(base64Audio);
      const url = URL.createObjectURL(wavBlob);
      setAudioUrl(url);

      if (audioContextRef.current) {
        const audioBuffer = await decodeBase64Audio(base64Audio, audioContextRef.current);
        audioBufferRef.current = audioBuffer;
        setDuration(audioBuffer.duration);
        playAudio(0);
      }

    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to process request");
    } finally {
      setLoading(false);
      setProcessingState('idle');
    }
  };

  // --- Audio Control Logic ---

  const playAudio = (offset: number) => {
      if (!audioContextRef.current || !audioBufferRef.current || !gainNodeRef.current) return;

      // Stop previous source if any
      if (sourceRef.current) {
          try { sourceRef.current.stop(); } catch(e) {}
      }

      const source = audioContextRef.current.createBufferSource();
      source.buffer = audioBufferRef.current;
      source.playbackRate.value = settings.playbackSpeed;
      source.connect(gainNodeRef.current);

      source.onended = () => {
          // This fires when buffer ends or stop is called
          // We handle stop state manually, so we check if we reached duration
      };

      source.start(0, offset);
      
      startTimeRef.current = audioContextRef.current.currentTime;
      offsetRef.current = offset;
      sourceRef.current = source;
      setIsPlaying(true);

      // Start UI loop
      updateUI();
  };

  const pauseAudio = () => {
      if (sourceRef.current && isPlaying) {
          try { sourceRef.current.stop(); } catch(e) {}
          // Calculate where we stopped
          const elapsed = (audioContextRef.current!.currentTime - startTimeRef.current) * settings.playbackSpeed;
          offsetRef.current = Math.min(offsetRef.current + elapsed, duration);
          setIsPlaying(false);
          if (rafRef.current) cancelAnimationFrame(rafRef.current);
      }
  };

  const stopAudio = () => {
      if (sourceRef.current) {
          try { sourceRef.current.stop(); } catch(e) {}
      }
      setIsPlaying(false);
      offsetRef.current = 0;
      setCurrentTime(0);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
  };

  const updateUI = () => {
      if (!isPlaying || !audioContextRef.current) return;
      
      const elapsed = (audioContextRef.current.currentTime - startTimeRef.current) * settings.playbackSpeed;
      const current = offsetRef.current + elapsed;
      
      if (current >= duration) {
          stopAudio();
          return;
      }
      
      setCurrentTime(current);
      rafRef.current = requestAnimationFrame(updateUI);
  };

  const togglePlayPause = () => {
      if (isPlaying) {
          pauseAudio();
      } else {
          // If we are at the end, restart
          if (Math.abs(duration - offsetRef.current) < 0.1) {
              offsetRef.current = 0;
          }
          playAudio(offsetRef.current);
      }
  };

  const seek = (time: number) => {
      const wasPlaying = isPlaying;
      if (isPlaying) pauseAudio();
      offsetRef.current = Math.max(0, Math.min(time, duration));
      setCurrentTime(offsetRef.current);
      if (wasPlaying) playAudio(offsetRef.current);
  };

  const skipForward = () => seek(currentTime + 5);
  const skipBackward = () => seek(currentTime - 5);
  const replay = () => {
      stopAudio();
      playAudio(0);
  };

  const handleVolumeChange = (newVolume: number) => {
      setVolume(newVolume);
      if (gainNodeRef.current) {
          gainNodeRef.current.gain.value = newVolume;
      }
  };

  const clearAll = () => {
      setInputText('');
      setTranslatedText('');
      setAudioUrl(null);
      setError(null);
      stopAudio();
      setDuration(0);
      audioBufferRef.current = null;
      if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className={`w-full max-w-[1000px] mx-auto p-4 z-10 relative ${isRTL ? 'rtl' : 'ltr'}`} dir={isRTL ? 'rtl' : 'ltr'}>
      
      {/* Main Glass Card */}
      <div className={`backdrop-blur-xl border rounded-[2rem] p-6 md:p-8 shadow-2xl overflow-visible relative transition-colors duration-500 ${settings.bgStyle === 'dark' ? 'bg-black/40 border-white/10' : 'bg-white/70 border-white/40'}`}>
        
        {/* Glow Effects */}
        <div className={`absolute -top-40 -left-40 w-96 h-96 bg-gradient-to-br ${activeGradient} opacity-10 blur-[120px] rounded-full pointer-events-none`}></div>
        
        {/* Content */}
        <div className="space-y-6 relative z-10">
          
          {/* Header Action Bar */}
          <div className="flex flex-wrap gap-4 justify-between items-center px-1">
               <div className="text-xs font-bold opacity-40 uppercase tracking-widest flex items-center gap-2">
                    <Sparkles className="w-3 h-3" />
                    Source Input
               </div>

               {/* Conversation Mode Toggle */}
               <button 
                  onClick={() => setSettings(prev => ({...prev, conversationMode: !prev.conversationMode}))}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-bold uppercase transition-all ${settings.conversationMode ? 'bg-cyan-500/20 text-cyan-400 border-cyan-500/50' : 'bg-white/5 text-gray-400 border-white/10 hover:border-white/20'}`}
               >
                   {settings.conversationMode ? <Users className="w-4 h-4" /> : <MessageSquare className="w-4 h-4" />}
                   {t.conversationMode.split('(')[0]}
               </button>

               <div className="flex gap-2">
                   {inputText && (
                        <button
                            onClick={clearAll}
                            className={`px-3 py-1.5 rounded-lg transition-all duration-200 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider border ${
                                settings.bgStyle === 'dark' 
                                ? 'bg-red-500/10 hover:bg-red-500/20 text-red-400 border-red-500/20' 
                                : 'bg-red-50 hover:bg-red-100 text-red-500 border-red-200'
                            }`}
                        >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">Clear</span>
                        </button>
                   )}
                   <button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={loading}
                        className={`px-3 py-1.5 rounded-lg transition-all duration-200 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider border ${
                            settings.bgStyle === 'dark' 
                            ? 'bg-white/5 hover:bg-white/10 text-cyan-400 border-cyan-500/20' 
                            : 'bg-white hover:bg-gray-50 text-cyan-600 border-cyan-200'
                        }`}
                    >
                        <FileUp className="w-3.5 h-3.5" />
                        <span>{t.uploadDoc}</span>
                    </button>
                    <input 
                        type="file" 
                        ref={fileInputRef} 
                        className="hidden" 
                        accept=".txt,.pdf,.js,.md,.jpg,.png,.jpeg"
                        onChange={handleFileUpload}
                    />
               </div>
          </div>
          
          {settings.conversationMode && (
             <div className="text-[10px] text-gray-500 bg-white/5 p-2 rounded-lg border border-white/5 whitespace-pre-wrap font-mono">
                 {t.conversationHelp}
             </div>
          )}

          {/* Input Area */}
          <div className="relative group">
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={t.inputPlaceholder}
              className={`w-full h-48 md:h-56 rounded-2xl p-5 text-lg leading-relaxed resize-none focus:outline-none focus:ring-2 transition-all shadow-inner backdrop-blur-sm ${
                settings.bgStyle === 'dark' 
                ? 'bg-black/30 text-white placeholder-gray-500 border-white/10 focus:ring-white/20' 
                : 'bg-white/50 text-gray-800 placeholder-gray-400 border-gray-200 focus:ring-gray-300'
              } border`}
            />
          </div>

          {/* Controls Bar */}
          <div className="flex flex-col md:flex-row gap-4 items-stretch justify-between relative isolate">
            
            {/* Custom Language Dropdown */}
            <div className="relative z-50 w-full md:w-64" ref={langMenuRef}>
                <button 
                    onClick={() => setIsLangMenuOpen(!isLangMenuOpen)}
                    className={`w-full flex items-center justify-between px-4 py-4 rounded-xl border transition-all shadow-sm ${
                        settings.bgStyle === 'dark'
                        ? 'bg-[#121212] border-white/10 text-white hover:bg-white/5'
                        : 'bg-white border-gray-200 text-gray-800 hover:border-gray-300'
                    }`}
                >
                    <div className="flex items-center gap-3 overflow-hidden">
                        <span className="text-[10px] font-bold uppercase tracking-wider opacity-60 shrink-0">{t.targetLanguage}</span>
                        <span className="h-3 w-[1px] bg-current opacity-20 shrink-0"></span>
                        <span className="font-semibold truncate">{selectedLang.nativeName}</span>
                    </div>
                    <ChevronDown className={`w-4 h-4 transition-transform shrink-0 ${isLangMenuOpen ? 'rotate-180' : ''}`} />
                </button>

                {isLangMenuOpen && (
                    <div className={`absolute top-full mt-2 left-0 w-full rounded-xl border shadow-2xl overflow-hidden max-h-64 overflow-y-auto custom-scrollbar animate-in fade-in zoom-in-95 duration-200 ${
                         settings.bgStyle === 'dark'
                         ? 'bg-[#1a1a1a] border-white/10'
                         : 'bg-white border-gray-100'
                    }`}>
                        <div className="p-1 grid grid-cols-1">
                            {TARGET_LANGUAGES.map(lang => (
                                <button
                                    key={lang.code}
                                    onClick={() => {
                                        setSelectedLang(lang);
                                        setIsLangMenuOpen(false);
                                    }}
                                    className={`flex items-center justify-between px-3 py-3 rounded-lg text-left transition-colors border-b border-transparent ${
                                        selectedLang.code === lang.code
                                        ? settings.bgStyle === 'dark' ? 'bg-white/10 text-white' : 'bg-gray-100 text-gray-900'
                                        : settings.bgStyle === 'dark' ? 'text-gray-400 hover:text-white hover:bg-white/5' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                                    }`}
                                >
                                    <div className="flex flex-col">
                                        <span className="font-medium text-sm">{lang.nativeName}</span>
                                        <span className="text-[10px] opacity-50">{lang.name}</span>
                                    </div>
                                    {selectedLang.code === lang.code && <Check className="w-3 h-3 text-cyan-400" />}
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Action Button */}
            <button
              onClick={handleProcess}
              disabled={loading || !inputText.trim()}
              className={`flex-1 px-8 py-4 rounded-xl font-bold text-white shadow-xl transition-all duration-300 flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed z-10 ${
                loading ? 'bg-gray-600' : `bg-gradient-to-r ${activeGradient} hover:scale-105 hover:shadow-cyan-500/25`
              }`}
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>{processingState === 'extracting' ? t.extracting : t.generating}</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  {t.translateAndPlay}
                </>
              )}
            </button>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl flex items-center gap-3 animate-pulse">
              <AlertCircle className="w-5 h-5" />
              {error}
            </div>
          )}

          {/* Result Section */}
          {(translatedText || duration > 0) && (
            <div className="mt-8 pt-8 border-t border-white/10 animate-in fade-in slide-in-from-bottom-6 duration-700">
                
                {/* Header for Result */}
                <div className="flex justify-between items-end mb-4 px-1">
                     <span className={`text-[10px] font-bold uppercase tracking-wider py-1 px-2 rounded ${
                        settings.bgStyle === 'dark' ? 'bg-white/10 text-gray-400' : 'bg-black/5 text-gray-600'
                    }`}>
                        {selectedLang.name} Output
                    </span>
                    <button onClick={() => {
                        setTranslatedText('');
                        stopAudio();
                        setDuration(0);
                        audioBufferRef.current = null;
                        setAudioUrl(null);
                    }} className="text-xs opacity-50 hover:opacity-100 transition-opacity">
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* Translated Text Display */}
                {translatedText && (
                    <div className={`mb-8 p-6 rounded-2xl border transition-colors ${
                        settings.bgStyle === 'dark'
                        ? 'bg-white/5 border-white/5 text-gray-100'
                        : 'bg-gray-50 border-gray-200 text-gray-900 shadow-inner'
                    }`}>
                        <p className="text-lg md:text-xl font-light leading-relaxed select-text">
                            {translatedText}
                        </p>
                    </div>
                )}

                {/* Audio Visualizer & Controls */}
                <div className={`rounded-2xl border p-4 sm:p-6 transition-colors ${settings.bgStyle === 'dark' ? 'bg-[#0f0f0f] border-white/10' : 'bg-white border-gray-200'}`}>
                    
                    {/* Visualizer */}
                    <div className="w-full h-24 rounded-xl overflow-hidden bg-black/50 border border-white/5 mb-6 relative">
                         <div className="absolute inset-0 opacity-80">
                            <AudioVisualizer 
                                analyser={analyser} 
                                isPlaying={isPlaying} 
                                color={getVisualizerColor()}
                            />
                         </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="flex items-center gap-3 text-xs font-mono opacity-70 mb-4">
                        <span className="w-10 text-right">{formatTime(currentTime)}</span>
                        <input 
                            type="range"
                            min="0"
                            max={duration || 100}
                            value={currentTime}
                            onChange={(e) => seek(parseFloat(e.target.value))}
                            className="flex-1 h-1.5 bg-gray-700 rounded-full appearance-none cursor-pointer accent-cyan-500 hover:accent-cyan-400"
                            style={{
                                background: `linear-gradient(to right, ${settings.theme === 'blue' ? '#06b6d4' : '#d946ef'} ${(currentTime / (duration || 1)) * 100}%, #374151 ${(currentTime / (duration || 1)) * 100}%)`
                            }}
                        />
                        <span className="w-10">{formatTime(duration)}</span>
                    </div>

                    {/* Controls Row */}
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
                        
                        {/* Playback Controls */}
                        <div className="flex items-center gap-4">
                             <button onClick={() => replay()} className="p-2 rounded-full hover:bg-white/10 text-gray-400 hover:text-white transition-colors" title="Replay">
                                <RotateCcw className="w-5 h-5" />
                             </button>
                             <button onClick={() => skipBackward()} className="p-2 rounded-full hover:bg-white/10 text-gray-400 hover:text-white transition-colors" title="-5s">
                                <Rewind className="w-6 h-6" />
                             </button>
                             
                             <button 
                                onClick={togglePlayPause}
                                className={`w-14 h-14 rounded-full flex items-center justify-center transition-all duration-200 shadow-xl ${
                                    isPlaying 
                                    ? 'bg-cyan-500 text-white hover:bg-cyan-400' 
                                    : settings.bgStyle === 'dark' ? 'bg-white text-black hover:bg-gray-200' : 'bg-gray-900 text-white hover:bg-gray-800'
                                }`}
                             >
                                {isPlaying ? <Pause className="w-6 h-6 fill-current" /> : <Play className="w-6 h-6 ml-1 fill-current" />}
                             </button>

                             <button onClick={() => skipForward()} className="p-2 rounded-full hover:bg-white/10 text-gray-400 hover:text-white transition-colors" title="+5s">
                                <FastForward className="w-6 h-6" />
                             </button>
                             <button onClick={() => stopAudio()} className="p-2 rounded-full hover:bg-white/10 text-gray-400 hover:text-red-400 transition-colors" title="Stop">
                                <Square className="w-5 h-5 fill-current" />
                             </button>
                        </div>

                        {/* Volume & Download */}
                        <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
                             {/* Volume */}
                             <div className="flex items-center gap-2 group bg-white/5 p-2 rounded-full border border-white/5">
                                <button onClick={() => handleVolumeChange(volume === 0 ? 1 : 0)} className="text-gray-400 hover:text-white">
                                    {volume === 0 ? <VolumeX className="w-4 h-4" /> : volume < 0.5 ? <Volume1 className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                                </button>
                                <input 
                                    type="range"
                                    min="0"
                                    max="1"
                                    step="0.05"
                                    value={volume}
                                    onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                                    className="w-20 h-1 bg-gray-600 rounded-full appearance-none cursor-pointer accent-white"
                                />
                             </div>

                             {audioUrl && (
                                <a
                                    href={audioUrl}
                                    download={`lumina_${selectedLang.code}_${Date.now()}.wav`}
                                    className="p-3 rounded-full bg-white/5 hover:bg-white/10 text-cyan-400 hover:text-cyan-300 border border-white/10 transition-colors"
                                    title={t.download}
                                >
                                    <Download className="w-5 h-5" />
                                </a>
                            )}
                        </div>

                    </div>
                </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MainConverter;
