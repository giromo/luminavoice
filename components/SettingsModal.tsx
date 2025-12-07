import React, { useState, useEffect } from 'react';
import { X, Mic2, Palette, Monitor, Key, Sparkles, Sliders, Moon, Sun } from 'lucide-react';
import { AppSettings, ThemeColor } from '../types';
import { UI_TEXT, VOICES } from '../constants';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  setSettings: React.Dispatch<React.SetStateAction<AppSettings>>;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, settings, setSettings }) => {
  const [localApiKey, setLocalApiKey] = useState(settings.customApiKey || '');
  
  useEffect(() => {
    if (isOpen) {
        setLocalApiKey(settings.customApiKey || '');
    }
  }, [isOpen, settings.customApiKey]);

  if (!isOpen) return null;

  const t = UI_TEXT[settings.language];
  const isRTL = settings.language === 'fa';

  const handleSaveApiKey = () => {
    setSettings(prev => ({ ...prev, customApiKey: localApiKey }));
    localStorage.setItem('lumina_api_key', localApiKey);
  };

  const handleVoiceChange = (voiceName: string) => {
    setSettings(prev => ({ ...prev, voiceName }));
  };

  const handleThemeChange = (color: ThemeColor) => {
    setSettings(prev => ({ ...prev, theme: color }));
  };

  const setBgMode = (mode: 'dark' | 'light') => {
    setSettings(prev => ({ ...prev, bgStyle: mode }));
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-black/80 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      <div 
        className={`relative w-full max-w-2xl bg-[#0a0a0a] border border-white/10 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] ${isRTL ? 'text-right' : 'text-left'}`}
        dir={isRTL ? 'rtl' : 'ltr'}
      >
        <div className="flex items-center justify-between p-6 border-b border-white/10 bg-white/5">
          <h2 className="text-xl font-bold text-white tracking-wide flex items-center gap-2">
            <Sliders className="w-5 h-5 text-gray-400" />
            {t.settings}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white hover:bg-white/10 p-2 rounded-full transition-all">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-8 overflow-y-auto custom-scrollbar">
          
          {/* API Key Section */}
          <div className="space-y-4 bg-white/5 p-5 rounded-2xl border border-dashed border-white/10 relative overflow-hidden">
             <div className="absolute top-0 right-0 p-4 opacity-10">
                <Key className="w-24 h-24 text-white" />
             </div>
             <div className="relative z-10 space-y-3">
                <label className="flex items-center gap-2 text-sm font-bold text-cyan-400 uppercase tracking-wider">
                <Key className="w-4 h-4" />
                {t.apiKeyLabel}
                </label>
                <div className="text-xs text-gray-400 leading-relaxed bg-black/40 p-3 rounded-lg border-l-2 border-cyan-500">
                    {t.apiKeyHelp}
                </div>
                <div className="flex gap-2">
                    <input 
                        type="password"
                        value={localApiKey}
                        onChange={(e) => setLocalApiKey(e.target.value)}
                        placeholder={t.apiKeyPlaceholder}
                        className="flex-1 bg-black/50 border border-white/10 text-white text-sm rounded-lg px-4 py-3 focus:outline-none focus:border-cyan-500/50 transition-all"
                    />
                    <button 
                        onClick={handleSaveApiKey}
                        className="px-6 py-2 bg-cyan-500 text-black font-bold rounded-lg text-sm hover:bg-cyan-400 transition-colors shadow-lg shadow-cyan-500/20"
                    >
                        {t.save}
                    </button>
                </div>
            </div>
          </div>
          
          {/* Audio Controls (Speed) */}
          <div className="space-y-4">
             <label className="flex items-center gap-2 text-sm font-bold text-gray-300 uppercase tracking-wider">
                <Sliders className="w-4 h-4" />
                {t.speed}: {settings.playbackSpeed}x
             </label>
             <div className="bg-white/5 p-4 rounded-xl border border-white/5">
                 <input 
                    type="range" 
                    min="0.5" 
                    max="2.0" 
                    step="0.1"
                    value={settings.playbackSpeed}
                    onChange={(e) => setSettings(prev => ({...prev, playbackSpeed: parseFloat(e.target.value)}))}
                    className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                 />
                 <div className="flex justify-between text-xs text-gray-500 mt-2">
                     <span>Slow (0.5x)</span>
                     <span>Normal (1.0x)</span>
                     <span>Fast (2.0x)</span>
                 </div>
             </div>
          </div>

          {/* Appearance Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Theme Color */}
              <div className="space-y-4">
                <label className="flex items-center gap-2 text-sm font-bold text-gray-300 uppercase tracking-wider">
                    <Palette className="w-4 h-4" />
                    {t.theme}
                </label>
                <div className="flex flex-wrap gap-3">
                    {Object.values(ThemeColor).map((color) => (
                        <button
                        key={color}
                        onClick={() => handleThemeChange(color)}
                        className={`w-10 h-10 rounded-full border-2 transition-all duration-300 relative overflow-hidden group ${
                            settings.theme === color 
                            ? 'border-white scale-110 shadow-lg ring-2 ring-white/20' 
                            : 'border-transparent opacity-60 hover:opacity-100 hover:scale-105'
                        }`}
                        >
                            <div className="absolute inset-0" style={{
                                background: color === ThemeColor.NEON_BLUE ? 'linear-gradient(135deg, #06b6d4, #3b82f6)' : 
                                            color === ThemeColor.NEON_PURPLE ? 'linear-gradient(135deg, #d946ef, #8b5cf6)' : 
                                            color === ThemeColor.NEON_GREEN ? 'linear-gradient(135deg, #10b981, #059669)' :
                                            color === ThemeColor.NEON_RED ? 'linear-gradient(135deg, #ef4444, #f97316)' :
                                            'linear-gradient(135deg, #f59e0b, #eab308)'
                            }} />
                        </button>
                    ))}
                </div>
              </div>

              {/* Background Mode */}
              <div className="space-y-4">
                <label className="flex items-center gap-2 text-sm font-bold text-gray-300 uppercase tracking-wider">
                    <Monitor className="w-4 h-4" />
                    {t.background}
                </label>
                <div className="flex gap-4">
                    <button 
                        onClick={() => setBgMode('dark')}
                        className={`flex-1 p-4 rounded-xl border transition-all relative overflow-hidden group ${
                            settings.bgStyle === 'dark' 
                            ? 'bg-gray-800 border-cyan-500/50 shadow-lg shadow-cyan-900/20' 
                            : 'bg-black/40 border-white/10 hover:border-white/30'
                        }`}
                    >
                        <div className="flex flex-col items-center gap-2 relative z-10">
                            <Moon className={`w-6 h-6 ${settings.bgStyle === 'dark' ? 'text-cyan-400' : 'text-gray-400'}`} />
                            <span className={`text-xs font-bold ${settings.bgStyle === 'dark' ? 'text-white' : 'text-gray-400'}`}>{t.darkMode}</span>
                        </div>
                    </button>
                    <button 
                        onClick={() => setBgMode('light')}
                        className={`flex-1 p-4 rounded-xl border transition-all relative overflow-hidden group ${
                            settings.bgStyle === 'light' 
                            ? 'bg-gray-100 border-orange-500/50 shadow-lg shadow-orange-500/20' 
                            : 'bg-black/40 border-white/10 hover:border-white/30'
                        }`}
                    >
                        <div className="flex flex-col items-center gap-2 relative z-10">
                            <Sun className={`w-6 h-6 ${settings.bgStyle === 'light' ? 'text-orange-500' : 'text-gray-400'}`} />
                            <span className={`text-xs font-bold ${settings.bgStyle === 'light' ? 'text-gray-900' : 'text-gray-400'}`}>{t.lightMode}</span>
                        </div>
                    </button>
                </div>
              </div>
          </div>

          {/* Voice Selection */}
          <div className="space-y-4">
            <label className="flex items-center gap-2 text-sm font-bold text-gray-300 uppercase tracking-wider">
              <Mic2 className="w-4 h-4" />
              {t.voice}
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {VOICES.map(voice => (
                <button
                  key={voice.id}
                  onClick={() => handleVoiceChange(voice.name)}
                  className={`relative px-3 py-3 rounded-xl border text-left transition-all duration-200 group flex items-center gap-3 overflow-hidden ${
                    settings.voiceName === voice.name 
                    ? 'bg-white/10 border-cyan-500/50 shadow-[0_0_15px_rgba(6,182,212,0.15)]' 
                    : 'bg-black/40 border-white/5 hover:border-white/20 hover:bg-white/5'
                  }`}
                >
                  <div className={`w-1 h-8 rounded-full transition-colors ${settings.voiceName === voice.name ? 'bg-cyan-500' : 'bg-gray-700 group-hover:bg-gray-500'}`} />
                  <div className="flex-1 min-w-0">
                        <div className={`font-bold text-sm truncate ${settings.voiceName === voice.name ? 'text-white' : 'text-gray-400 group-hover:text-gray-200'}`}>
                            {voice.name}
                        </div>
                        <div className="text-[10px] text-gray-500 truncate">{voice.gender}</div>
                  </div>
                  {settings.voiceName === voice.name && (
                    <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-black/50 to-transparent flex items-center justify-center">
                        <Sparkles className="w-3 h-3 text-cyan-400" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default SettingsModal;
