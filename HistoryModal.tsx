import React, { useEffect, useState } from 'react';
import { X, Play, Download, Star, Trash2, Clock } from 'lucide-react';
import { HistoryItem, AppSettings } from '../types';
import { getHistory, toggleFavorite, deleteHistoryItem } from '../services/db';
import { UI_TEXT } from '../constants';

interface HistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  onPlay: (base64: string) => void;
}

const HistoryModal: React.FC<HistoryModalProps> = ({ isOpen, onClose, settings, onPlay }) => {
  const [items, setItems] = useState<HistoryItem[]>([]);
  const t = UI_TEXT[settings.language];
  const isRTL = settings.language === 'fa';

  const loadHistory = async () => {
    try {
      const data = await getHistory();
      setItems(data);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadHistory();
    }
  }, [isOpen]);

  const handleToggleFav = async (id: number) => {
    await toggleFavorite(id);
    loadHistory();
  };

  const handleDelete = async (id: number) => {
    await deleteHistoryItem(id);
    loadHistory();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex justify-end">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Sidebar Content */}
      <div className={`relative w-full max-w-md h-full bg-[#0a0a0a] border-l border-white/10 shadow-2xl flex flex-col transform transition-transform duration-300 ${isRTL ? 'text-right' : 'text-left'}`}
        dir={isRTL ? 'rtl' : 'ltr'}>
        
        <div className="flex items-center justify-between p-6 border-b border-white/10 bg-white/5">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Clock className="w-5 h-5 text-cyan-400" />
            {t.history}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-500 gap-4">
               <Clock className="w-12 h-12 opacity-20" />
               <p className="text-sm">{t.noHistory}</p>
            </div>
          ) : (
            items.map(item => (
              <div key={item.id} className="bg-white/5 border border-white/10 rounded-xl p-4 hover:bg-white/10 transition-colors group">
                <div className="flex justify-between items-start mb-2">
                   <div className="text-[10px] uppercase font-bold tracking-wider text-cyan-500 bg-cyan-900/20 px-2 py-1 rounded">
                      {item.language}
                   </div>
                   <div className="flex gap-2">
                      <button onClick={() => handleToggleFav(item.id)} className={`${item.isFavorite ? 'text-yellow-400' : 'text-gray-600 hover:text-yellow-400'}`}>
                         <Star className="w-4 h-4" fill={item.isFavorite ? "currentColor" : "none"} />
                      </button>
                      <button onClick={() => handleDelete(item.id)} className="text-gray-600 hover:text-red-400">
                         <Trash2 className="w-4 h-4" />
                      </button>
                   </div>
                </div>
                
                <p className="text-gray-300 text-sm line-clamp-2 mb-3 font-light">
                  {item.translatedText}
                </p>

                <button 
                  onClick={() => onPlay(item.audioBase64)}
                  className="w-full py-2 bg-white/5 hover:bg-white/10 rounded-lg flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-wider text-white transition-colors"
                >
                   <Play className="w-3 h-3" />
                   Play
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default HistoryModal;
