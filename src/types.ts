export type SimulatedAppId = 'gemini' | 'search' | 'whatsapp' | 'notes' | 'sandbox';

export interface DictationSettings {
  watermarkOpacity: number; // 0.15 to 0.90
  autoPunctuation: boolean;
  smartCapitalization: boolean;
  showWaveform: boolean;
  hapticFeedback: boolean;
  edgeSnapping: boolean;
  triggerMode: 'auto-focus' | 'always-on' | 'manual';
  selectedModel: 'whisper-tiny-en' | 'sherpa-onnx-int8' | 'vosk-small-en' | 'android-native-offline';
}

export interface AndroidFile {
  path: string;
  filename: string;
  category: 'kotlin' | 'manifest' | 'xml' | 'gradle' | 'docs';
  description: string;
  content: string;
}

export interface DictationHistoryItem {
  id: string;
  text: string;
  timestamp: string;
  targetApp: string;
  durationMs: number;
  wordCount: number;
}
