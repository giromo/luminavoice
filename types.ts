export enum AppLanguage {
  ENGLISH = 'en',
  PERSIAN = 'fa'
}

export enum ThemeColor {
  NEON_BLUE = 'blue',
  NEON_PURPLE = 'purple',
  NEON_GREEN = 'green',
  NEON_RED = 'red',
  NEON_AMBER = 'amber'
}

export interface VoiceOption {
  id: string;
  name: string;
  gender: 'Male' | 'Female';
  description: string;
}

export interface TranslationTarget {
  code: string;
  name: string; // Display name
  nativeName: string;
}

export interface HistoryItem {
  id: number;
  originalText: string;
  translatedText: string;
  language: string;
  audioBase64: string;
  timestamp: number;
  isFavorite: boolean;
}

export interface AppSettings {
  language: AppLanguage;
  theme: ThemeColor;
  voiceName: string;
  bgStyle: 'dark' | 'light';
  customApiKey: string;
  playbackSpeed: number; // 0.5 to 2.0
  conversationMode: boolean; // Dual speaker toggle
}

export type UIContent = {
  [key in AppLanguage]: {
    title: string;
    subtitle: string;
    inputPlaceholder: string;
    translateAndPlay: string;
    download: string;
    settings: string;
    voice: string;
    background: string;
    theme: string;
    targetLanguage: string;
    generating: string;
    extracting: string;
    playing: string;
    error: string;
    selectLanguage: string;
    darkMode: string;
    lightMode: string;
    uploadDoc: string;
    apiKeyLabel: string;
    apiKeyPlaceholder: string;
    apiKeyHelp: string;
    save: string;
    history: string;
    noHistory: string;
    speed: string;
    conversationMode: string;
    conversationHelp: string;
    clear: string;
  };
};