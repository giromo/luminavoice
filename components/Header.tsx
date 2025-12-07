import React from 'react';
import { Settings, AudioWaveform, Languages, Clock } from 'lucide-react';
import { AppLanguage, AppSettings } from '../types';
import { UI_TEXT } from '../constants';

interface HeaderProps {
  settings: AppSettings;
  setSettings: React.Dispatch<React.SetStateAction<AppSettings>>;
  onOpenSettings: () => void;
  onOpenHistory: () => void;
}

const Header: React.FC<HeaderProps> = ({ settings, setSettings, onOpenSettings, onOpenHistory }) => {
  const t = UI_TEXT[settings.language];
  const isRTL = settings.language === AppLanguage.PERSIAN;

  const toggleLanguage = () => {
    setSettings(prev => ({
      ...prev,
      language: prev.language === AppLanguage.ENGLISH ? AppLanguage.PERSIAN : AppLanguage.ENGLISH
    }));
  };

  return (
    <header className={`fixed top-0 left-0 w-full z-50 transition-all duration-300 ${isRTL ? 'rtl' : 'ltr'}`}>
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-24">
          
          <div className="flex items-center gap-4 group cursor-default">
            <div className="relative">
                <div className="absolute inset-0 bg-cyan-500 blur-xl opacity-20 group-hover:opacity-40 transition-opacity duration-500 rounded-full"></div>
                <div className="relative w-12 h-12 rounded-xl bg-gradient-to-br from-gray-900 to-black border border-white/10 flex items-center justify-center shadow-2xl">
                    <AudioWaveform className="text-cyan-400 w-6 h-6" />
                </div>
            </div>
            <div className="flex flex-col">
              <h1 className="text-2xl font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-white via-gray-200 to-gray-500">
                LuminaVoice
              </h1>
              <span className="text-[10px] uppercase tracking-[0.2em] text-cyan-500 font-bold">Pro Edition</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={toggleLanguage}
              className="px-4 py-2 rounded-lg backdrop-blur-md bg-white/5 hover:bg-white/10 border border-white/10 text-white transition-all duration-200 flex items-center gap-2 text-sm font-medium"
            >
              <Languages className="w-4 h-4 text-gray-400" />
              <span>{settings.language === 'en' ? 'FA' : 'EN'}</span>
            </button>

            <button
              onClick={onOpenHistory}
              className="p-3 rounded-lg backdrop-blur-md bg-white/5 hover:bg-white/10 border border-white/10 text-white transition-all duration-200 group"
              title={t.history}
            >
              <Clock className="w-5 h-5 text-gray-300 group-hover:text-cyan-400 transition-colors" />
            </button>

            <button
              onClick={onOpenSettings}
              className="p-3 rounded-lg backdrop-blur-md bg-white/5 hover:bg-white/10 border border-white/10 text-white transition-all duration-200 group relative"
              title={t.settings}
            >
              <Settings className="w-5 h-5 text-gray-300 group-hover:text-white group-hover:rotate-90 transition-transform duration-500" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
