// Tipos de datos para el manejo de contexto conversacional

import { ChatMessage } from './index';
import { UserProfile } from './aiTypes';

/**
 * Contexto completo de una conversación
 */
export interface ConversationContext {
  sessionId: string;
  messages: ChatMessage[];
  userProfile: UserProfile;
  lastInteraction: Date;
  activeTopics: string[];
  conversationFlow: ConversationFlow;
  metadata: ConversationMetadata;
  conversationSummary?: string;
  messageHistory?: Array<{ content: string; timestamp: Date; isUser: boolean }>;
}

/**
 * Flujo de la conversación para mantener coherencia
 */
export interface ConversationFlow {
  currentTopic: string;
  topicHistory: TopicTransition[];
  expectedNextTopics: string[];
  conversationStage: 'greeting' | 'exploration' | 'deep_dive' | 'conclusion';
  userEngagementLevel: 'low' | 'medium' | 'high';
}

/**
 * Transición entre temas en la conversación
 */
export interface TopicTransition {
  fromTopic: string;
  toTopic: string;
  timestamp: Date;
  transitionReason: 'user_request' | 'natural_flow' | 'ai_suggestion';
  confidence: number;
}

/**
 * Metadatos adicionales de la conversación
 */
export interface ConversationMetadata {
  startTime: Date;
  duration: number;
  messageCount: number;
  topicCount: number;
  averageResponseTime: number;
  userSatisfactionIndicators: SatisfactionIndicator[];
}

/**
 * Indicadores de satisfacción del usuario
 */
export interface SatisfactionIndicator {
  type: 'positive_feedback' | 'follow_up_question' | 'topic_continuation' | 'explicit_thanks';
  timestamp: Date;
  confidence: number;
  relatedMessageId: string;
}

/**
 * Memoria a corto plazo para la conversación actual
 */
export interface ShortTermMemory {
  recentTopics: string[];
  mentionedConcepts: ConceptMention[];
  userPreferences: TemporaryPreference[];
  conversationGoals: string[];
  unresolved: UnresolvedItem[];
}

/**
 * Mención de conceptos en la conversación
 */
export interface ConceptMention {
  concept: string;
  category: 'programming_language' | 'technology' | 'concept' | 'tool' | 'methodology';
  firstMentioned: Date;
  mentionCount: number;
  context: string;
  userUnderstandingLevel: 'unknown' | 'beginner' | 'intermediate' | 'advanced';
}

/**
 * Preferencias temporales detectadas durante la conversación
 */
export interface TemporaryPreference {
  type: 'explanation_style' | 'detail_level' | 'example_preference' | 'interaction_pace';
  value: string;
  confidence: number;
  detectedAt: Date;
  reinforcementCount: number;
}

/**
 * Elementos no resueltos en la conversación
 */
export interface UnresolvedItem {
  id: string;
  type: 'question' | 'clarification_needed' | 'follow_up_required';
  content: string;
  priority: 'low' | 'medium' | 'high';
  createdAt: Date;
  relatedMessageId: string;
}

/**
 * Memoria a largo plazo para múltiples sesiones
 */
export interface LongTermMemory {
  userId: string;
  totalSessions: number;
  cumulativeProfile: UserProfile;
  learnedPreferences: LearnedPreference[];
  topicMastery: TopicMastery[];
  conversationPatterns: ConversationPattern[];
}

/**
 * Preferencias aprendidas a lo largo del tiempo
 */
export interface LearnedPreference {
  category: string;
  preference: string;
  confidence: number;
  learnedFrom: number; // número de sesiones
  lastReinforced: Date;
  stability: number; // qué tan estable es esta preferencia
}

/**
 * Dominio de temas por parte del usuario
 */
export interface TopicMastery {
  topic: string;
  masteryLevel: 'novice' | 'beginner' | 'intermediate' | 'advanced' | 'expert';
  confidence: number;
  lastAssessed: Date;
  progressionRate: number;
  strugglingAreas: string[];
}

/**
 * Patrones de conversación identificados
 */
export interface ConversationPattern {
  patternId: string;
  description: string;
  frequency: number;
  effectiveness: number;
  contexts: string[];
  lastObserved: Date;
}

/**
 * Configuración del contexto
 */
export interface ContextConfig {
  maxShortTermMemory: number;
  maxLongTermMemory: number;
  contextRetentionDays: number;
  autoSaveInterval: number;
  compressionThreshold: number;
  privacyLevel: 'minimal' | 'standard' | 'detailed';
}

/**
 * Estado del servicio de contexto
 */
export interface ContextServiceState {
  isInitialized: boolean;
  activeContexts: number;
  memoryUsage: number;
  lastCleanup: Date;
  compressionRatio: number;
  errorCount: number;
}

/**
 * Evento de contexto para logging y análisis
 */
export interface ContextEvent {
  eventId: string;
  type: 'context_created' | 'context_updated' | 'context_compressed' | 'context_expired' | 'context_service_initialized' | 'all_contexts_cleared';
  timestamp: Date;
  sessionId: string;
  details: Record<string, any>;
  impact: 'low' | 'medium' | 'high';
}