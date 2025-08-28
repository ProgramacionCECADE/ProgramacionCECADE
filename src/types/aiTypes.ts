// Tipos de datos para la integración de Gemini AI

/**
 * Configuración para el servicio de Gemini AI
 */
export interface GeminiConfig {
  apiKey: string;
  model: string;
  temperature: number;
  maxTokens: number;
  contextWindow: number;
}

/**
 * Análisis realizado por la IA sobre una consulta del usuario
 */
export interface AIAnalysis {
  intent: string;
  sentiment: 'positive' | 'neutral' | 'negative';
  confidence: number;
  suggestedResponse: string;
  context: string[];
  userLevel: 'beginner' | 'intermediate' | 'advanced';
  urgency: 'low' | 'medium' | 'high';
  keywords?: string[];
  category?: 'programming' | 'greeting' | 'joke' | 'general' | 'cecade_info';
}

/**
 * Respuesta generada por la IA
 */
export interface AIResponse {
  content: string;
  confidence: number;
  reasoning: string;
  suggestedFollowUp?: string[];
  emotion: 'happy' | 'neutral' | 'excited' | 'thinking' | 'empathetic';
  adaptedLevel: 'beginner' | 'intermediate' | 'advanced';
}

/**
 * Perfil del usuario detectado por la IA
 */
export interface UserProfile {
  detectedLevel: 'beginner' | 'intermediate' | 'advanced';
  interests: string[];
  sentiment: 'positive' | 'neutral' | 'negative';
  preferredTopics: string[];
  interactionCount: number;
  lastInteraction: Date;
}

/**
 * Contexto de una sesión de conversación
 */
export interface ConversationSession {
  sessionId: string;
  startTime: Date;
  lastActivity: Date;
  messageCount: number;
  userProfile: UserProfile;
  conversationSummary: string;
  activeTopics: string[];
}

/**
 * Entrada para el procesamiento de IA
 */
export interface AIInput {
  query: string;
  sessionId: string;
  timestamp: Date;
  audioInput?: boolean;
  previousContext?: string[];
}

/**
 * Resultado completo del procesamiento de IA
 */
export interface AIProcessingResult {
  analysis: AIAnalysis;
  response: AIResponse;
  updatedProfile: UserProfile;
  contextUpdates: string[];
  processingTime: number;
}

/**
 * Configuración de comportamiento de la IA
 */
export interface AIBehaviorConfig {
  responseStyle: 'formal' | 'casual' | 'friendly' | 'professional';
  adaptToUserLevel: boolean;
  maintainContext: boolean;
  maxContextLength: number;
  enableSentimentAnalysis: boolean;
  enableLearning: boolean;
}

/**
 * Métricas de rendimiento de la IA
 */
export interface AIMetrics {
  totalQueries: number;
  totalRequests: number;
  successfulRequests: number;
  averageResponseTime: number;
  accuracyScore: number;
  userSatisfactionScore: number;
  contextRetentionRate: number;
  lastUpdated: Date;
}

/**
 * Estado del servicio de IA
 */
export interface AIServiceStatus {
  isConnected: boolean;
  isProcessing: boolean;
  lastError?: string;
  apiQuotaRemaining?: number;
  modelVersion: string;
  uptime: number;
  behaviorConfig: AIBehaviorConfig;
  promptTemplatesCount: number;
  responseTime: number;
}

/**
 * Prompt template para diferentes tipos de consultas
 */
export interface PromptTemplate {
  id: string;
  name: string;
  category: string;
  template: string;
  variables: string[];
  description: string;
}

/**
 * Cache de respuestas de IA para optimización
 */
export interface AIResponseCache {
  queryHash: string;
  response: AIResponse;
  timestamp: Date;
  hitCount: number;
  expiresAt: Date;
}

/**
 * Configuración de logging para IA
 */
export interface AILoggingConfig {
  level: 'debug' | 'info' | 'warn' | 'error';
  enableConsole: boolean;
  enableFile: boolean;
  maxLogSize: number;
  retentionDays: number;
}

// Tipos para análisis de sentimientos
export interface SentimentAnalysis {
  sentiment: {
    label: 'positive' | 'negative' | 'neutral';
    confidence: number;
  };
  emotions: string[];
  intensity: number;
  context: string;
  timestamp: Date;
  messageId?: string;
}

export interface EmotionalState {
  dominantEmotion: string;
  emotionScores: Record<string, number>;
  overallMood: 'positive' | 'negative' | 'neutral';
  moodIntensity: number;
  lastUpdated: Date;
}

export interface EmotionalShift {
  previousState: EmotionalState;
  currentState: EmotionalState;
  shiftMagnitude: number;
  shiftDirection: 'positive' | 'negative' | 'stable';
  triggerMessage?: string;
  timestamp: Date;
}

export interface SentimentConfig {
  enableRealtime: boolean;
  analysisInterval: number;
  emotionThreshold: number;
  moodUpdateFrequency: number;
  cacheSize: number;
}