import {
  ConversationContext,
  ConversationFlow,
  ShortTermMemory,
  LongTermMemory,
  ContextConfig,
  ContextServiceState,
  ContextEvent,
  ConceptMention,
  TemporaryPreference,
  UnresolvedItem,
  TopicTransition
} from '../types/contextTypes';
import { ChatMessage } from '../types/index';
import { UserProfile, AIAnalysis } from '../types/aiTypes';

/**
 * Servicio para manejo de contexto conversacional
 * Gestiona memoria a corto y largo plazo, patrones de conversación
 * y comprensión contextual para mejorar las respuestas de la IA
 */
export class ContextService {
  private contexts: Map<string, ConversationContext> = new Map();
  private shortTermMemory: Map<string, ShortTermMemory> = new Map();
  private longTermMemory: Map<string, LongTermMemory> = new Map();
  private config: ContextConfig;
  private state: ContextServiceState;
  private eventLog: ContextEvent[] = [];

  constructor(config: ContextConfig) {
    this.config = config;
    this.state = {
      isInitialized: false,
      activeContexts: 0,
      memoryUsage: 0,
      lastCleanup: new Date(),
      compressionRatio: 1.0,
      errorCount: 0
    };
    this.initialize();
  }

  /**
   * Inicializa el servicio de contexto
   */
  private async initialize(): Promise<void> {
    try {
      // Cargar contextos persistidos desde localStorage
      await this.loadPersistedContexts();
      
      // Configurar limpieza automática
      this.setupAutoCleanup();
      
      this.state.isInitialized = true;
      this.logEvent('context_service_initialized', {}, 'low');
    } catch (error) {
      console.error('Error initializing ContextService:', error);
      this.state.errorCount++;
    }
  }

  /**
   * Crea un nuevo contexto de conversación
   */
  createContext(sessionId: string, initialUserProfile?: Partial<UserProfile>): ConversationContext {
    const defaultProfile: UserProfile = {
      detectedLevel: 'intermediate',
      interests: [],
      sentiment: 'neutral',
      preferredTopics: [],
      interactionCount: 0,
      lastInteraction: new Date()
    };

    const context: ConversationContext = {
      sessionId,
      messages: [],
      userProfile: { ...defaultProfile, ...initialUserProfile },
      lastInteraction: new Date(),
      activeTopics: [],
      conversationFlow: {
        currentTopic: 'greeting',
        topicHistory: [],
        expectedNextTopics: ['programming', 'cecade_info'],
        conversationStage: 'greeting',
        userEngagementLevel: 'medium'
      },
      metadata: {
        startTime: new Date(),
        duration: 0,
        messageCount: 0,
        topicCount: 0,
        averageResponseTime: 0,
        userSatisfactionIndicators: []
      }
    };

    this.contexts.set(sessionId, context);
    this.initializeShortTermMemory(sessionId);
    this.state.activeContexts++;
    
    this.logEvent('context_created', { sessionId }, 'medium');
    return context;
  }

  /**
   * Obtiene el contexto de una sesión
   */
  getContext(sessionId: string): ConversationContext | null {
    return this.contexts.get(sessionId) || null;
  }

  /**
   * Actualiza el contexto con un nuevo mensaje
   */
  updateContext(
    sessionId: string,
    message: ChatMessage,
    analysis?: AIAnalysis
  ): ConversationContext {
    const context = this.contexts.get(sessionId);
    if (!context) {
      throw new Error(`Context not found for session: ${sessionId}`);
    }

    // Actualizar mensajes
    context.messages.push(message);
    context.lastInteraction = new Date();
    context.metadata.messageCount++;
    context.metadata.duration = Date.now() - context.metadata.startTime.getTime();

    // Actualizar flujo de conversación si hay análisis
    if (analysis) {
      this.updateConversationFlow(context, analysis, message);
      this.updateShortTermMemory(sessionId, message, analysis);
      this.updateUserProfile(context, analysis);
    }

    // Mantener solo los últimos N mensajes para optimizar memoria
    if (context.messages.length > this.config.maxShortTermMemory) {
      const removedMessages = context.messages.splice(0, context.messages.length - this.config.maxShortTermMemory);
      this.compressOldMessages(sessionId, removedMessages);
    }

    this.contexts.set(sessionId, context);
    this.persistContext(sessionId);
    
    this.logEvent('context_updated', { sessionId, messageId: message.id }, 'low');
    return context;
  }

  /**
   * Actualiza el flujo de conversación
   */
  private updateConversationFlow(
    context: ConversationContext,
    analysis: AIAnalysis,
    message: ChatMessage
  ): void {
    const flow = context.conversationFlow;
    const newTopic = this.extractTopicFromAnalysis(analysis);

    // Registrar transición de tema si cambió
    if (newTopic !== flow.currentTopic) {
      const transition: TopicTransition = {
        fromTopic: flow.currentTopic,
        toTopic: newTopic,
        timestamp: new Date(),
        transitionReason: message.type === 'user' ? 'user_request' : 'ai_suggestion',
        confidence: analysis.confidence
      };
      
      flow.topicHistory.push(transition);
      flow.currentTopic = newTopic;
      
      // Actualizar temas activos
      if (!context.activeTopics.includes(newTopic)) {
        context.activeTopics.push(newTopic);
        context.metadata.topicCount++;
      }
    }

    // Actualizar etapa de conversación
    flow.conversationStage = this.determineConversationStage(context);
    
    // Actualizar nivel de engagement
    flow.userEngagementLevel = this.calculateEngagementLevel(context, analysis);
    
    // Predecir próximos temas
    flow.expectedNextTopics = this.predictNextTopics(context, analysis);
  }

  /**
   * Inicializa la memoria a corto plazo para una sesión
   */
  private initializeShortTermMemory(sessionId: string): void {
    const memory: ShortTermMemory = {
      recentTopics: [],
      mentionedConcepts: [],
      userPreferences: [],
      conversationGoals: [],
      unresolved: []
    };
    
    this.shortTermMemory.set(sessionId, memory);
  }

  /**
   * Actualiza la memoria a corto plazo
   */
  private updateShortTermMemory(
    sessionId: string,
    message: ChatMessage,
    analysis: AIAnalysis
  ): void {
    const memory = this.shortTermMemory.get(sessionId);
    if (!memory) return;

    // Actualizar temas recientes
    const topic = this.extractTopicFromAnalysis(analysis);
    if (!memory.recentTopics.includes(topic)) {
      memory.recentTopics.push(topic);
      if (memory.recentTopics.length > 5) {
        memory.recentTopics.shift();
      }
    }

    // Actualizar conceptos mencionados
    analysis.keywords.forEach(keyword => {
      const existingConcept = memory.mentionedConcepts.find(c => c.concept === keyword);
      if (existingConcept) {
        existingConcept.mentionCount++;
        existingConcept.context = message.content;
      } else {
        const concept: ConceptMention = {
          concept: keyword,
          category: this.categorizeKeyword(keyword),
          firstMentioned: new Date(),
          mentionCount: 1,
          context: message.content,
          userUnderstandingLevel: analysis.userLevel
        };
        memory.mentionedConcepts.push(concept);
      }
    });

    // Detectar preferencias temporales
    const preferences = this.detectTemporaryPreferences(message, analysis);
    preferences.forEach(pref => {
      const existing = memory.userPreferences.find(p => p.type === pref.type);
      if (existing) {
        existing.reinforcementCount++;
        existing.confidence = Math.min(1.0, existing.confidence + 0.1);
      } else {
        memory.userPreferences.push(pref);
      }
    });

    this.shortTermMemory.set(sessionId, memory);
  }

  /**
   * Actualiza el perfil del usuario basado en el análisis
   */
  private updateUserProfile(context: ConversationContext, analysis: AIAnalysis): void {
    const profile = context.userProfile;
    
    // Actualizar nivel detectado con suavizado
    if (analysis.userLevel !== profile.detectedLevel) {
      // Solo cambiar si hay alta confianza o múltiples indicaciones
      if (analysis.confidence > 0.8) {
        profile.detectedLevel = analysis.userLevel;
      }
    }

    // Actualizar sentimiento
    profile.sentiment = analysis.sentiment;
    
    // Actualizar intereses
    analysis.keywords.forEach(keyword => {
      if (!profile.interests.includes(keyword)) {
        profile.interests.push(keyword);
      }
    });
    
    // Mantener solo los últimos 10 intereses
    if (profile.interests.length > 10) {
      profile.interests = profile.interests.slice(-10);
    }

    // Actualizar temas preferidos
    if (!profile.preferredTopics.includes(analysis.category)) {
      profile.preferredTopics.push(analysis.category);
    }
    
    profile.interactionCount++;
    profile.lastInteraction = new Date();
  }

  /**
   * Extrae el tema principal del análisis
   */
  private extractTopicFromAnalysis(analysis: AIAnalysis): string {
    // Mapear categorías a temas más específicos
    const topicMap: Record<string, string> = {
      'programming': 'programming_concepts',
      'greeting': 'social_interaction',
      'joke': 'entertainment',
      'general': 'general_inquiry',
      'cecade_info': 'institutional_info'
    };
    
    return topicMap[analysis.category] || analysis.category;
  }

  /**
   * Determina la etapa actual de la conversación
   */
  private determineConversationStage(
    context: ConversationContext
  ): 'greeting' | 'exploration' | 'deep_dive' | 'conclusion' {
    const messageCount = context.metadata.messageCount;
    const topicCount = context.metadata.topicCount;
    
    if (messageCount <= 2) return 'greeting';
    if (topicCount <= 2) return 'exploration';
    if (messageCount > 10) return 'conclusion';
    return 'deep_dive';
  }

  /**
   * Calcula el nivel de engagement del usuario
   */
  private calculateEngagementLevel(
    context: ConversationContext,
    analysis: AIAnalysis
  ): 'low' | 'medium' | 'high' {
    let score = 0;
    
    // Factores que aumentan engagement
    if (analysis.sentiment === 'positive') score += 2;
    if (analysis.confidence > 0.8) score += 1;
    if (context.metadata.messageCount > 5) score += 1;
    if (context.activeTopics.length > 2) score += 1;
    
    // Factores que disminuyen engagement
    if (analysis.sentiment === 'negative') score -= 1;
    if (analysis.confidence < 0.5) score -= 1;
    
    if (score >= 3) return 'high';
    if (score >= 1) return 'medium';
    return 'low';
  }

  /**
   * Predice los próximos temas probables
   */
  private predictNextTopics(context: ConversationContext, analysis: AIAnalysis): string[] {
    const currentTopic = context.conversationFlow.currentTopic;
    const userLevel = analysis.userLevel;
    
    // Lógica de predicción basada en patrones comunes
    const topicTransitions: Record<string, string[]> = {
      'social_interaction': ['programming_concepts', 'institutional_info'],
      'programming_concepts': ['specific_languages', 'projects', 'career_advice'],
      'institutional_info': ['programming_concepts', 'admission_process'],
      'entertainment': ['programming_concepts', 'social_interaction']
    };
    
    return topicTransitions[currentTopic] || ['programming_concepts', 'general_inquiry'];
  }

  /**
   * Categoriza una palabra clave
   */
  private categorizeKeyword(keyword: string): 'programming_language' | 'technology' | 'concept' | 'tool' | 'methodology' {
    const categories = {
      programming_language: ['python', 'javascript', 'java', 'react', 'node'],
      technology: ['web', 'mobile', 'database', 'api', 'framework'],
      concept: ['algorithm', 'data structure', 'oop', 'functional'],
      tool: ['vscode', 'git', 'npm', 'webpack'],
      methodology: ['agile', 'scrum', 'tdd', 'ci/cd']
    };
    
    for (const [category, keywords] of Object.entries(categories)) {
      if (keywords.some(k => keyword.toLowerCase().includes(k))) {
        return category as any;
      }
    }
    
    return 'concept';
  }

  /**
   * Detecta preferencias temporales del usuario
   */
  private detectTemporaryPreferences(
    message: ChatMessage,
    analysis: AIAnalysis
  ): TemporaryPreference[] {
    const preferences: TemporaryPreference[] = [];
    
    // Detectar preferencia por nivel de detalle
    if (message.content.length > 100) {
      preferences.push({
        type: 'detail_level',
        value: 'detailed',
        confidence: 0.7,
        detectedAt: new Date(),
        reinforcementCount: 1
      });
    }
    
    // Detectar preferencia por ejemplos
    if (message.content.toLowerCase().includes('ejemplo')) {
      preferences.push({
        type: 'example_preference',
        value: 'examples_preferred',
        confidence: 0.8,
        detectedAt: new Date(),
        reinforcementCount: 1
      });
    }
    
    return preferences;
  }

  /**
   * Comprime mensajes antiguos para optimizar memoria
   */
  private compressOldMessages(sessionId: string, messages: ChatMessage[]): void {
    // Crear resumen de mensajes antiguos
    const summary = this.createMessagesSummary(messages);
    
    // Guardar en memoria a largo plazo si existe
    const longTerm = this.longTermMemory.get(sessionId);
    if (longTerm) {
      // Actualizar resumen acumulativo
      longTerm.cumulativeProfile.interactionCount += messages.length;
    }
    
    this.logEvent('context_compressed', { 
      sessionId, 
      compressedMessages: messages.length,
      summary 
    }, 'low');
  }

  /**
   * Crea un resumen de mensajes
   */
  private createMessagesSummary(messages: ChatMessage[]): string {
    const topics = new Set<string>();
    const userMessages = messages.filter(m => m.type === 'user');
    
    userMessages.forEach(msg => {
      // Extraer temas principales de cada mensaje
      const words = msg.content.toLowerCase().split(' ');
      words.forEach(word => {
        if (word.length > 4) topics.add(word);
      });
    });
    
    return `Discussed topics: ${Array.from(topics).slice(0, 5).join(', ')}`;
  }

  /**
   * Persiste el contexto en localStorage
   */
  private persistContext(sessionId: string): void {
    try {
      const context = this.contexts.get(sessionId);
      if (context) {
        const serialized = JSON.stringify(context);
        localStorage.setItem(`context_${sessionId}`, serialized);
      }
    } catch (error) {
      console.warn('Failed to persist context:', error);
    }
  }

  /**
   * Carga contextos persistidos
   */
  private async loadPersistedContexts(): Promise<void> {
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith('context_')) {
          const sessionId = key.replace('context_', '');
          const serialized = localStorage.getItem(key);
          if (serialized) {
            const context = JSON.parse(serialized);
            // Convertir fechas de string a Date
            context.lastInteraction = new Date(context.lastInteraction);
            context.metadata.startTime = new Date(context.metadata.startTime);
            this.contexts.set(sessionId, context);
            this.state.activeContexts++;
          }
        }
      }
    } catch (error) {
      console.warn('Failed to load persisted contexts:', error);
    }
  }

  /**
   * Configura limpieza automática
   */
  private setupAutoCleanup(): void {
    setInterval(() => {
      this.cleanupExpiredContexts();
    }, this.config.autoSaveInterval);
  }

  /**
   * Limpia contextos expirados
   */
  private cleanupExpiredContexts(): void {
    const now = Date.now();
    const retentionMs = this.config.contextRetentionDays * 24 * 60 * 60 * 1000;
    
    for (const [sessionId, context] of this.contexts.entries()) {
      const age = now - context.lastInteraction.getTime();
      if (age > retentionMs) {
        this.contexts.delete(sessionId);
        this.shortTermMemory.delete(sessionId);
        localStorage.removeItem(`context_${sessionId}`);
        this.state.activeContexts--;
        
        this.logEvent('context_expired', { sessionId, age }, 'low');
      }
    }
    
    this.state.lastCleanup = new Date();
  }

  /**
   * Registra un evento del contexto
   */
  private logEvent(
    type: ContextEvent['type'],
    details: Record<string, any>,
    impact: ContextEvent['impact']
  ): void {
    const event: ContextEvent = {
      eventId: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      timestamp: new Date(),
      sessionId: details.sessionId || 'system',
      details,
      impact
    };
    
    this.eventLog.push(event);
    
    // Mantener solo los últimos 100 eventos
    if (this.eventLog.length > 100) {
      this.eventLog.shift();
    }
  }

  /**
   * Obtiene estadísticas del servicio
   */
  getServiceStats() {
    return {
      ...this.state,
      totalContexts: this.contexts.size,
      totalShortTermMemories: this.shortTermMemory.size,
      totalLongTermMemories: this.longTermMemory.size,
      recentEvents: this.eventLog.slice(-10)
    };
  }

  /**
   * Actualiza la configuración del servicio
   */
  updateConfig(newConfig: Partial<ContextConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Limpia todos los contextos (útil para testing)
   */
  clearAllContexts(): void {
    this.contexts.clear();
    this.shortTermMemory.clear();
    this.longTermMemory.clear();
    this.state.activeContexts = 0;
    
    // Limpiar localStorage
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const key = localStorage.key(i);
      if (key?.startsWith('context_')) {
        localStorage.removeItem(key);
      }
    }
    
    this.logEvent('all_contexts_cleared', {}, 'high');
  }
}

// Instancia singleton del servicio
let contextServiceInstance: ContextService | null = null;

/**
 * Factory function para crear o obtener la instancia del servicio
 */
export function createContextService(config: ContextConfig): ContextService {
  if (!contextServiceInstance) {
    contextServiceInstance = new ContextService(config);
  }
  return contextServiceInstance;
}

/**
 * Obtiene la instancia actual del servicio
 */
export function getContextService(): ContextService | null {
  return contextServiceInstance;
}