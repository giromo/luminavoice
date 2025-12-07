import React, { useState, useEffect, useRef } from 'react';
import { Github } from 'lucide-react';
import { AppSettings, AppLanguage, ThemeColor } from './types';
import ParticleBackground from './components/ParticleBackground';
import Header from './components/Header';
import MainConverter from './components/MainConverter';
import SettingsModal from './components/SettingsModal';
import HistoryModal from './components/HistoryModal';
import { UI_TEXT } from './constants';
import { decodeBase64Audio } from './services/audioUtils';

const App: React.FC = () => {
  // Default Settings
  const [settings, setSettings] = useState<AppSettings>({
    language: AppLanguage.ENGLISH,
    theme: ThemeColor.NEON_BLUE,
    voiceName: 'Kore',
    bgStyle: 'dark',
    customApiKey: '',
    playbackSpeed: 1.0,
    conversationMode: false
  });

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  
  // Ref to access audio context globally for history playback
  const audioContextRef = useRef<AudioContext | null>(null);

  useEffect(() => {
      const savedKey = localStorage.getItem('lumina_api_key');
      if (savedKey) {
          setSettings(prev => ({ ...prev, customApiKey: savedKey }));
      }
  }, []);

  const t = UI_TEXT[settings.language];

  // Theme Colors for Particles
  const getParticleColor = () => {
      switch(settings.theme) {
          case ThemeColor.NEON_BLUE: return '#06b6d4';
          case ThemeColor.NEON_PURPLE: return '#d946ef';
          case ThemeColor.NEON_GREEN: return '#10b981';
          case ThemeColor.NEON_RED: return '#ef4444';
          case ThemeColor.NEON_AMBER: return '#f59e0b';
          default: return '#ffffff';
      }
  };

  const handleHistoryPlay = async (base64: string) => {
      if (!audioContextRef.current) {
          const Ctx = (window.AudioContext || (window as any).webkitAudioContext);
          audioContextRef.current = new Ctx();
      }
      if (audioContextRef.current.state === 'suspended') {
          await audioContextRef.current.resume();
      }
      
      const buffer = await decodeBase64Audio(base64, audioContextRef.current);
      const source = audioContextRef.current.createBufferSource();
      source.buffer = buffer;
      source.playbackRate.value = settings.playbackSpeed;
      source.connect(audioContextRef.current.destination);
      source.start(0);
  };

  return (
    <div className={`relative min-h-screen w-full overflow-hidden transition-colors duration-500 ${settings.bgStyle === 'dark' ? 'bg-[#050505]' : 'bg-gray-50'}`}>
      
      {/* Background Effects */}
      <div className={`absolute inset-0 transition-opacity duration-1000 ${settings.bgStyle === 'dark' ? 'opacity-100' : 'opacity-20'}`}>
        <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-transparent to-primary/5" />
      </div>
      
      <ParticleBackground themeColor={getParticleColor()} darkMode={settings.bgStyle === 'dark'} />

      {/* Content Layer */}
      <div className="relative z-10 flex flex-col min-h-screen">
        <Header 
          settings={settings} 
          setSettings={setSettings} 
          onOpenSettings={() => setIsSettingsOpen(true)}
          onOpenHistory={() => setIsHistoryOpen(true)}
        />

        <main className="flex-grow flex flex-col items-center justify-center px-4 pt-28 pb-16">
            
            {/* Hero Text */}
            <div className="text-center mb-12 space-y-4 max-w-4xl mx-auto">
                <h2 className={`text-5xl md:text-7xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r ${settings.theme === 'blue' ? 'from-cyan-300 via-blue-500 to-purple-600' : settings.theme === 'purple' ? 'from-fuchsia-300 via-purple-500 to-indigo-600' : settings.theme === 'green' ? 'from-emerald-300 via-green-500 to-teal-600' : settings.theme === 'red' ? 'from-orange-300 via-red-500 to-pink-600' : 'from-yellow-200 via-amber-500 to-orange-600'} animate-gradient-x py-2`}>
                    {t.title}
                </h2>
                <p className={`text-xl md:text-2xl font-light max-w-2xl mx-auto ${settings.bgStyle === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                    {t.subtitle}
                </p>
            </div>

            <MainConverter settings={settings} setSettings={setSettings} />

        </main>
        
        {/* Footer */}
        <footer className="py-8 text-center">
            <a 
                href="https://github.com/Argh94" 
                target="_blank" 
                rel="noopener noreferrer"
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-full transition-all duration-300 group ${
                    settings.bgStyle === 'dark' 
                    ? 'text-gray-500 hover:text-white hover:bg-white/5' 
                    : 'text-gray-400 hover:text-black hover:bg-gray-100'
                }`}
            >
                <Github className="w-5 h-5 transition-transform group-hover:scale-110" />
                <span className="text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity -ml-2 group-hover:ml-0">
                    Argh94
                </span>
            </a>
        </footer>
      </div>

      {/* Modals */}
      <SettingsModal 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)} 
        settings={settings}
        setSettings={setSettings}
      />
      
      <HistoryModal
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        settings={settings}
        onPlay={handleHistoryPlay}
      />
    </div>
  );
};

export default App;
