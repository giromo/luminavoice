import { AppLanguage, ThemeColor, TranslationTarget, UIContent, VoiceOption } from './types';

export const APP_NAME = "LuminaVoice";

export const VOICES: VoiceOption[] = [
  { id: 'Kore', name: 'Kore', gender: 'Female', description: 'Calm' },
  { id: 'Puck', name: 'Puck', gender: 'Male', description: 'Energetic' },
  { id: 'Fenrir', name: 'Fenrir', gender: 'Male', description: 'Deep' },
  { id: 'Charon', name: 'Charon', gender: 'Male', description: 'Steady' },
  { id: 'Aoede', name: 'Aoede', gender: 'Female', description: 'Bright' },
];

export const TARGET_LANGUAGES: TranslationTarget[] = [
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'fa', name: 'Persian', nativeName: 'فارسی' },
  { code: 'es', name: 'Spanish', nativeName: 'Español' },
  { code: 'fr', name: 'French', nativeName: 'Français' },
  { code: 'de', name: 'German', nativeName: 'Deutsch' },
  { code: 'ja', name: 'Japanese', nativeName: '日本語' },
  { code: 'ar', name: 'Arabic', nativeName: 'العربية' },
  { code: 'ru', name: 'Russian', nativeName: 'Русский' },
  { code: 'it', name: 'Italian', nativeName: 'Italiano' },
  { code: 'zh', name: 'Chinese', nativeName: '中文' },
  { code: 'ko', name: 'Korean', nativeName: '한국어' },
  { code: 'tr', name: 'Turkish', nativeName: 'Türkçe' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी' },
  { code: 'pt', name: 'Portuguese', nativeName: 'Português' },
];

export const UI_TEXT: UIContent = {
  [AppLanguage.ENGLISH]: {
    title: 'LuminaVoice',
    subtitle: 'Professional AI Neural TTS & Translation',
    inputPlaceholder: 'Type text here...',
    translateAndPlay: 'Generate Audio',
    download: 'Download',
    settings: 'Configuration',
    voice: 'Neural Voice Model',
    background: 'Interface Mode',
    theme: 'Accent Color',
    targetLanguage: 'Target Language',
    generating: 'Synthesizing...',
    extracting: 'Reading Document...',
    playing: 'Playing...',
    error: 'An error occurred',
    selectLanguage: 'Language',
    darkMode: 'Midnight',
    lightMode: 'Daylight',
    uploadDoc: 'Upload File',
    apiKeyLabel: 'Custom Gemini API Key',
    apiKeyPlaceholder: 'Paste your API key here...',
    apiKeyHelp: 'IMPORTANT: To ensure correct functionality, your API Key must have access to "Gemini 2.5 Flash" and "Gemini 2.5 Flash TTS" models.',
    save: 'Save Key',
    history: 'Library & History',
    noHistory: 'No history yet. Generate audio to save automatically.',
    speed: 'Playback Speed',
    conversationMode: 'Conversation Mode (Dual Speaker)',
    conversationHelp: 'Use format "Name: text". Example:\nAli: Hello!\nSara: Hi there!',
    clear: 'Clear',
  },
  [AppLanguage.PERSIAN]: {
    title: 'لومینا ویس',
    subtitle: 'مبدل متن به گفتار و مترجم حرفه‌ای هوش مصنوعی',
    inputPlaceholder: 'متن خود را اینجا وارد کنید...',
    translateAndPlay: 'تولید صدا',
    download: 'دانلود',
    settings: 'پیکربندی',
    voice: 'مدل صدای عصبی',
    background: 'حالت رابط کاربری',
    theme: 'رنگ اصلی',
    targetLanguage: 'زبان مقصد',
    generating: 'در حال ساخت...',
    extracting: 'خواندن سند...',
    playing: 'در حال پخش...',
    error: 'خطایی رخ داد',
    selectLanguage: 'زبان',
    darkMode: 'نیمه شب',
    lightMode: 'روز',
    uploadDoc: 'آپلود فایل',
    apiKeyLabel: 'کلید API جمینای شخصی',
    apiKeyPlaceholder: 'کلید API خود را اینجا وارد کنید...',
    apiKeyHelp: 'مهم: برای عملکرد صحیح، مطمئن شوید کلید API شما به مدل‌های "Gemini 2.5 Flash" و "Gemini 2.5 Flash TTS" دسترسی دارد.',
    save: 'ذخیره کلید',
    history: 'کتابخانه و تاریخچه',
    noHistory: 'هنوز تاریخچه‌ای وجود ندارد.',
    speed: 'سرعت پخش',
    conversationMode: 'حالت مکالمه (دو گوینده)',
    conversationHelp: 'از فرمت "نام: متن" استفاده کنید. مثال:\nعلی: سلام!\nسارا: چطوری؟',
    clear: 'پاک کردن',
  }
};

export const THEME_STYLES = {
  [ThemeColor.NEON_BLUE]: 'from-cyan-500 to-blue-500 shadow-cyan-500/50',
  [ThemeColor.NEON_PURPLE]: 'from-fuchsia-500 to-purple-600 shadow-fuchsia-500/50',
  [ThemeColor.NEON_GREEN]: 'from-emerald-400 to-green-500 shadow-emerald-500/50',
  [ThemeColor.NEON_RED]: 'from-red-500 to-orange-500 shadow-red-500/50',
  [ThemeColor.NEON_AMBER]: 'from-amber-400 to-yellow-500 shadow-amber-500/50',
};

export const TEXT_HIGHLIGHT = {
  [ThemeColor.NEON_BLUE]: 'text-cyan-400',
  [ThemeColor.NEON_PURPLE]: 'text-fuchsia-400',
  [ThemeColor.NEON_GREEN]: 'text-emerald-400',
  [ThemeColor.NEON_RED]: 'text-red-400',
  [ThemeColor.NEON_AMBER]: 'text-amber-400',
};