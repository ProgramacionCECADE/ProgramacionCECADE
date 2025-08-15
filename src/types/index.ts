// Interfaces TypeScript para el Asistente Virtual CECADE

// Mensaje de Chat
export interface ChatMessage {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  audioUrl?: string;
}

// Configuración del Asistente
export interface AssistantConfig {
  voice: {
    rate: number; // 0.5 - 2.0
    pitch: number; // 0 - 2
    volume: number; // 0 - 1
    voiceIndex: number;
    preferredVoice?: {
      name: string;
      lang: string;
      description: string;
    };
  };
  theme: {
    mode: 'light' | 'dark';
    primaryColor: string;
    avatarStyle: string;
  };
  behavior: {
    autoSpeak: boolean;
    micSensitivity: number;
    responseDelay: number;
    soundEffects: boolean;
  };
}

// Respuesta del Asistente
export interface AssistantResponse {
  id: string;
  keywords: string[];
  response: string;
  category: 'programming' | 'greeting' | 'joke' | 'general';
  emotion: 'happy' | 'neutral' | 'excited' | 'thinking';
}

// Configuración de Reconocimiento de Voz
export interface SpeechRecognitionConfig {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  maxAlternatives: number;
}

// Configuración de Síntesis de Voz
export interface SpeechSynthesisConfig {
  text: string;
  voice: SpeechSynthesisVoice;
  volume: number;
  rate: number;
  pitch: number;
}

// Sesión de Chat
export interface ChatSession {
  sessionId: string;
  startTime: Date;
  lastActivity: Date;
  messageCount: number;
}

// Base de Datos de Respuestas
export interface ResponseDatabase {
  programming: AssistantResponse[];
  greetings: AssistantResponse[];
  jokes: AssistantResponse[];
  general: AssistantResponse[];
}

// Información del Colegio
export interface SchoolInfo {
  name: string;
  specialty: string;
  description: string;
  technologies: string[];
  contact: {
    address: string;
    phone: string;
    email: string;
    website?: string;
    socialMedia: {
      facebook: string;
      instagram: string;
      linkedin?: string;
    };
  };
}

// Configuración Completa
export interface AppConfig {
  defaultConfig: AssistantConfig;
  schoolInfo: SchoolInfo;
}

// Estados de la aplicación
export interface AppState {
  messages: ChatMessage[];
  config: AssistantConfig;
  isListening: boolean;
  isSpeaking: boolean;
  currentEmotion: AssistantResponse['emotion'];
  session: ChatSession;
}

// Props para componentes
export interface AvatarProps {
  emotion: AssistantResponse['emotion'];
  isListening: boolean;
  isSpeaking: boolean;
}

export interface VoiceControlsProps {
  isListening: boolean;
  onStartListening: () => void;
  onStopListening: () => void;
  disabled?: boolean;
}

export interface MessageBubbleProps {
  message: ChatMessage;
  onPlayAudio?: (text: string) => void;
}

export interface ConfigPanelProps {
  config: AssistantConfig;
  onConfigChange: (config: AssistantConfig) => void;
}