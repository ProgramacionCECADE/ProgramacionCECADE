import { useState, useCallback, useRef, useEffect } from 'react';
import { GeminiAIService } from '../services/ai/geminiAIService';
import {
  GeminiConfig,
  AIResponse,
  AIAnalysis,
  AIInput,
  AIProcessingResult,
  AIServiceStatus,
  AIMetrics,
  UserProfile
} from '../types/aiTypes';
import { ConversationContext } from '../types/contextTypes';
import { ChatMessage } from '../types/index';

/**
 * Configuración por defecto para Gemini AI
 */
const defaultConfig: GeminiConfig = {
  apiKey: import.meta.env.VITE_GEMINI_API_KEY || '',
  model: 'gemini-2.5-flash-lite',
  temperature: 0.7,
  maxTokens: 1000,
  contextWindow: 4000
};

/**
 * Estado del hook useGeminiAI
 */
interface UseGeminiAIState {
  isLoading: boolean;
  isInitialized: boolean;
  isProcessing: boolean;
  error: string | null;
  lastResponse: AIResponse | null;
  lastAnalysis: AIAnalysis | null;
  serviceStatus: AIServiceStatus;
  metrics: AIMetrics;
  config: GeminiConfig;
}

/**
 * Opciones para el hook useGeminiAI
 */
interface UseGeminiAIOptions {
  config?: Partial<GeminiConfig>;
  autoInitialize?: boolean;
  enableRealTimeAnalysis?: boolean;
  onResponse?: (response: AIResponse) => void;
  onAnalysis?: (analysis: AIAnalysis) => void;
  onError?: (error: Error) => void;
}

/**
 * Hook personalizado para integrar Gemini AI en componentes React
 * Proporciona funcionalidades de procesamiento de lenguaje natural,
 * análisis de sentimientos y generación de respuestas inteligentes
 */
export function useGeminiAI(options: UseGeminiAIOptions = {}) {
  const {
    config: userConfig = {},
    autoInitialize = true,
    enableRealTimeAnalysis = true,
    onResponse,
    onAnalysis,
    onError
  } = options;

  // Estado del hook
  const [state, setState] = useState<UseGeminiAIState>({
    isLoading: false,
    isInitialized: false,
    isProcessing: false,
    error: null,
    lastResponse: null,
    lastAnalysis: null,
    serviceStatus: {
       isConnected: false,
       isProcessing: false,
       responseTime: 0,
       modelVersion: 'gemini-2.5-flash-lite',
       uptime: 0,
       behaviorConfig: {
          responseStyle: 'friendly',
          adaptToUserLevel: true,
          maintainContext: true,
          enableSentimentAnalysis: true,
          enableLearning: true,
          maxContextLength: 4000
        },
       promptTemplatesCount: 0
     },
    metrics: {
       totalQueries: 0,
       totalRequests: 0,
       successfulRequests: 0,
       averageResponseTime: 0,
       accuracyScore: 0,
       contextRetentionRate: 0,
       userSatisfactionScore: 0,
       lastUpdated: new Date()
     },
    config: { ...defaultConfig, ...userConfig }
  });

  // Referencias
  const serviceRef = useRef<GeminiAIService | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const requestQueueRef = useRef<Array<() => Promise<void>>>([]);
  const isProcessingRef = useRef(false);

  /**
   * Inicializa el servicio de Gemini AI
   */
  const initialize = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      
      if (!state.config.apiKey) {
        throw new Error('API Key de Gemini no configurada. Verifica la variable VITE_GEMINI_API_KEY.');
      }

      const behaviorConfig = {
        responseStyle: 'friendly' as const,
        adaptToUserLevel: true,
        useEmotionalContext: true,
        maxContextLength: 10,
        maintainContext: true,
        enableSentimentAnalysis: true,
        enableLearning: true
      };
      serviceRef.current = new GeminiAIService(state.config, behaviorConfig);
      
      const status = await serviceRef.current.getServiceStatus();
      
      setState(prev => ({
        ...prev,
        isInitialized: true,
        isLoading: false,
        serviceStatus: status
      }));
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido al inicializar Gemini AI';
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
        isInitialized: false
      }));
      
      onError?.(error instanceof Error ? error : new Error(errorMessage));
    }
  }, [state.config, onError]);

  /**
   * Procesa un mensaje con Gemini AI
   */
  const processMessage = useCallback(async (
    message: string,
    context?: ConversationContext
  ): Promise<AIProcessingResult | null> => {
    if (!serviceRef.current || !state.isInitialized) {
      setState(prev => ({ ...prev, error: 'Servicio no inicializado' }));
      return null;
    }

    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      
      // Cancelar solicitud anterior si existe
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      
      abortControllerRef.current = new AbortController();
      
      const input: AIInput = {
        query: message,
        sessionId: context?.sessionId || 'default',
        timestamp: new Date()
      };

      const defaultContext: ConversationContext = {
        sessionId: context?.sessionId || 'default',
        messages: context?.messages || [],
        userProfile: context?.userProfile || {
          detectedLevel: 'intermediate',
          sentiment: 'neutral',
          interests: [],
          preferredTopics: [],
          interactionCount: 0,
          lastInteraction: new Date()
        },
        lastInteraction: new Date(),
        activeTopics: context?.activeTopics || [],
        conversationFlow: context?.conversationFlow || {
          currentTopic: 'general',
          topicHistory: [],
          expectedNextTopics: [],
          conversationStage: 'exploration',
          userEngagementLevel: 'medium'
        },
        metadata: context?.metadata || {
          startTime: new Date(),
          duration: 0,
          messageCount: 0,
          topicCount: 0,
          averageResponseTime: 0,
          userSatisfactionIndicators: []
        }
      };

      const result = await serviceRef.current.processQuery(input, defaultContext);
      
      setState(prev => ({
        ...prev,
        isLoading: false,
        lastResponse: result.response,
        lastAnalysis: result.analysis
      }));
      
      // Actualizar métricas
      await updateMetrics(true);
      
      // Callbacks
      onResponse?.(result.response);
      onAnalysis?.(result.analysis);
      
      return result;
      
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        return null; // Solicitud cancelada
      }
      
      const errorMessage = error instanceof Error ? error.message : 'Error al procesar mensaje';
      setState(prev => ({ ...prev, isLoading: false, error: errorMessage }));
      
      await updateMetrics(false);
      onError?.(error instanceof Error ? error : new Error(errorMessage));
      
      return null;
    }
  }, [state.isInitialized, onResponse, onAnalysis, onError]);

  /**
   * Procesa una consulta del usuario
   */
  const processQuery = useCallback(async (
    input: AIInput,
    context?: ConversationContext
  ): Promise<string> => {
    if (!serviceRef.current || !state.isInitialized) {
      throw new Error('Servicio no inicializado');
    }

    try {
      setState(prev => ({ ...prev, isProcessing: true, error: null }));
      
      // Crear contexto básico si no se proporciona
      const defaultContext: ConversationContext = {
        sessionId: 'default',
        messages: [],
        userProfile: {
          detectedLevel: 'intermediate',
          interests: [],
          sentiment: 'neutral',
          preferredTopics: [],
          interactionCount: 0,
          lastInteraction: new Date()
        },
        lastInteraction: new Date(),
        activeTopics: [],
        conversationFlow: {
          currentTopic: 'general',
          topicHistory: [],
          expectedNextTopics: [],
          conversationStage: 'exploration',
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
      
      const result = await serviceRef.current.processQuery(input, context || defaultContext);
      
      setState(prev => ({ 
        ...prev, 
        isProcessing: false,
        lastResponse: result.response
      }));
      
      return result.response.content;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      setState(prev => ({ 
        ...prev, 
        isProcessing: false, 
        error: errorMessage 
      }));
      throw error;
    }
  }, [state.isInitialized]);

  /**
   * Analiza el sentimiento de un mensaje
   */
  const analyzeSentiment = useCallback(async (
    message: string
  ): Promise<{
    sentiment: 'positive' | 'neutral' | 'negative';
    confidence: number;
    emotions: string[];
    urgency: 'low' | 'medium' | 'high';
  } | null> => {
    if (!serviceRef.current || !state.isInitialized) {
      return null;
    }

    try {
      const input: AIInput = {
         query: message,
         timestamp: new Date(),
         sessionId: 'sentiment_analysis'
       };
      
      const defaultContext: ConversationContext = {
         sessionId: 'sentiment_analysis',
         messages: [],
         lastInteraction: new Date(),
         conversationFlow: {
           currentTopic: 'sentiment_analysis',
           topicHistory: [],
           expectedNextTopics: [],
           conversationStage: 'exploration',
           userEngagementLevel: 'medium'
         },
         metadata: {
           startTime: new Date(),
           duration: 0,
           messageCount: 0,
           topicCount: 1,
           averageResponseTime: 0,
           userSatisfactionIndicators: []
         },
         activeTopics: ['sentiment_analysis'],
         userProfile: {
           detectedLevel: 'intermediate',
           sentiment: 'neutral',
           interests: [],
           preferredTopics: [],
           interactionCount: 0,
           lastInteraction: new Date()
         }
       };
      
      const result = await serviceRef.current.processQuery(input, defaultContext);
      const analysis = await serviceRef.current.analyzeSentiment(message, defaultContext);
      
      if (enableRealTimeAnalysis) {
        // Convertir a AIAnalysis para el callback
        const aiAnalysis: AIAnalysis = {
          intent: 'sentiment_analysis',
          sentiment: analysis.sentiment,
          confidence: analysis.confidence,
          suggestedResponse: '',
          context: [],
          userLevel: 'intermediate',
          urgency: analysis.urgency
        };
        onAnalysis?.(aiAnalysis);
      }
      
      return analysis;
    } catch (error) {
      console.warn('Error en análisis de sentimiento:', error);
      return null;
    }
  }, [state.isInitialized, enableRealTimeAnalysis, onAnalysis]);

  /**
   * Genera una respuesta basada en un prompt personalizado
   */
  const generateResponse = useCallback(async (
    prompt: string,
    options?: {
      temperature?: number;
      maxTokens?: number;
      context?: ConversationContext;
    }
  ): Promise<AIResponse | null> => {
    if (!serviceRef.current || !state.isInitialized) {
      return null;
    }

    try {
      setState(prev => ({ ...prev, isLoading: true }));
      
      // Crear un análisis básico para el prompt
      const analysis: AIAnalysis = {
        intent: 'general_inquiry',
        sentiment: 'neutral',
        confidence: 0.8,
        suggestedResponse: '',
        context: [],
        userLevel: 'intermediate',
        urgency: 'medium'
      };
      
      // Crear contexto por defecto si no se proporciona
      const context: ConversationContext = options?.context || {
        sessionId: 'default',
        messages: [],
        userProfile: {
          detectedLevel: 'intermediate',
          interests: [],
          sentiment: 'neutral',
          preferredTopics: [],
          interactionCount: 0,
          lastInteraction: new Date()
        },
        lastInteraction: new Date(),
        activeTopics: [],
        conversationFlow: {
          currentTopic: 'general',
          topicHistory: [],
          expectedNextTopics: [],
          conversationStage: 'exploration',
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
      
      const response = await serviceRef.current.generateResponse(
        prompt,
        analysis,
        context
      );
      
      setState(prev => ({
        ...prev,
        isLoading: false,
        lastResponse: response
      }));
      
      onResponse?.(response);
      return response;
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error al generar respuesta';
      setState(prev => ({ ...prev, isLoading: false, error: errorMessage }));
      onError?.(error instanceof Error ? error : new Error(errorMessage));
      return null;
    }
  }, [state.isInitialized, onResponse, onError]);

  /**
   * Actualiza las métricas del servicio
   */
  const updateMetrics = useCallback(async (success: boolean) => {
    if (!serviceRef.current) return;
    
    try {
      const metrics = await serviceRef.current.getMetrics();
      const status = await serviceRef.current.getServiceStatus();
      
      setState(prev => ({
        ...prev,
        metrics,
        serviceStatus: status
      }));
    } catch (error) {
      console.warn('Error actualizando métricas:', error);
    }
  }, []);

  /**
   * Cancela la solicitud actual
   */
  const cancelRequest = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setState(prev => ({ ...prev, isLoading: false }));
    }
  }, []);

  /**
   * Limpia el estado del hook
   */
  const clearState = useCallback(() => {
    setState(prev => ({
      ...prev,
      error: null,
      lastResponse: null,
      lastAnalysis: null,
      isProcessing: false
    }));
  }, []);

  /**
   * Actualiza la configuración del servicio
   */
  const updateConfig = useCallback(async (newConfig: Partial<GeminiConfig>) => {
    const updatedConfig = { ...state.config, ...newConfig };
    
    setState(prev => ({ ...prev, config: updatedConfig }));
    
    if (serviceRef.current) {
      await serviceRef.current.updateConfig(updatedConfig);
    }
  }, [state.config]);

  /**
   * Obtiene el estado de conexión
   */
  const checkConnection = useCallback(async (): Promise<boolean> => {
    if (!serviceRef.current) return false;
    
    try {
      const status = await serviceRef.current.getServiceStatus();
      setState(prev => ({ ...prev, serviceStatus: status }));
      return status.isConnected;
    } catch (error) {
      return false;
    }
  }, []);

  /**
   * Procesa múltiples mensajes en cola
   */
  const processQueue = useCallback(async () => {
    if (isProcessingRef.current || requestQueueRef.current.length === 0) {
      return;
    }
    
    isProcessingRef.current = true;
    
    while (requestQueueRef.current.length > 0) {
      const request = requestQueueRef.current.shift();
      if (request) {
        try {
          await request();
          // Pequeña pausa entre solicitudes para evitar rate limiting
          await new Promise(resolve => setTimeout(resolve, 100));
        } catch (error) {
          console.warn('Error procesando solicitud en cola:', error);
        }
      }
    }
    
    isProcessingRef.current = false;
  }, []);

  /**
   * Añade una solicitud a la cola
   */
  const queueRequest = useCallback((request: () => Promise<void>) => {
    requestQueueRef.current.push(request);
    processQueue();
  }, [processQueue]);

  // Efectos
  useEffect(() => {
    if (autoInitialize && !state.isInitialized && !state.isLoading) {
      initialize();
    }
  }, [autoInitialize, state.isInitialized, state.isLoading, initialize]);

  // Cleanup al desmontar
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  // Actualizar métricas periódicamente
  useEffect(() => {
    if (!state.isInitialized) return;
    
    const interval = setInterval(() => {
      updateMetrics(true);
    }, 30000); // Cada 30 segundos
    
    return () => clearInterval(interval);
  }, [state.isInitialized, updateMetrics]);

  return {
    // Estado
    isLoading: state.isLoading,
    isInitialized: state.isInitialized,
    isProcessing: state.isProcessing,
    error: state.error,
    lastResponse: state.lastResponse,
    lastAnalysis: state.lastAnalysis,
    serviceStatus: state.serviceStatus,
    metrics: state.metrics,
    config: state.config,
    
    // Métodos principales
    initialize,
    processMessage,
    processQuery,
    analyzeSentiment,
    generateResponse,
    
    // Métodos de utilidad
    cancelRequest,
    clearState,
    updateConfig,
    checkConnection,
    queueRequest,
    
    // Estado de conexión
    isConnected: state.serviceStatus.isConnected,
    responseTime: state.serviceStatus.responseTime,
    
    // Métricas útiles
    totalRequests: state.metrics.totalRequests,
    successRate: state.metrics.totalRequests > 0 
      ? (state.metrics.successfulRequests / state.metrics.totalRequests) * 100 
      : 0,
    averageResponseTime: state.metrics.averageResponseTime
  };
}

/**
 * Hook simplificado para análisis rápido de sentimientos
 */
export function useQuickSentiment() {
  const { analyzeSentiment, isInitialized, lastAnalysis } = useGeminiAI({
    autoInitialize: true,
    enableRealTimeAnalysis: false
  });
  
  return {
    analyzeSentiment,
    isReady: isInitialized,
    lastSentiment: lastAnalysis?.sentiment,
    lastConfidence: lastAnalysis?.confidence
  };
}

/**
 * Hook para generación rápida de respuestas
 */
export function useQuickResponse() {
  const { generateResponse, isInitialized, isLoading, lastResponse } = useGeminiAI({
    autoInitialize: true
  });
  
  return {
    generateResponse,
    isReady: isInitialized,
    isGenerating: isLoading,
    lastResponse: lastResponse?.content
  };
}