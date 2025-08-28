import { useState, useEffect, useCallback, useRef } from 'react';
import {
  SentimentAnalysis,
  EmotionalState,
  EmotionalShift,
  GeminiConfig,
  AIBehaviorConfig
} from '../types/aiTypes';
import { SentimentAnalysisService } from '../services/ai/sentimentAnalysisService';
import { GeminiAIService } from '../services/ai/geminiAIService';

interface UseSentimentAnalysisOptions {
  enableRealtime?: boolean;
  cacheResults?: boolean;
  analysisDelay?: number; // ms
  userId?: string;
}

interface SentimentAnalysisState {
  currentAnalysis: SentimentAnalysis | null;
  conversationMood: EmotionalState | null;
  isAnalyzing: boolean;
  analysisHistory: SentimentAnalysis[];
  sessionMetrics: {
    averageSentiment: number;
    sentimentTrend: 'improving' | 'declining' | 'stable';
    emotionalVolatility: number;
    dominantEmotions: string[];
  } | null;
  error: string | null;
}

interface SentimentAnalysisActions {
  analyzeMessage: (message: string) => Promise<SentimentAnalysis | null>;
  analyzeConversationMood: (messages: Array<{ content: string; timestamp: Date; isUser: boolean }>) => Promise<EmotionalState | null>;
  detectEmotionalShift: (previousAnalysis: SentimentAnalysis, currentAnalysis: SentimentAnalysis) => Promise<any>;
  clearAnalysisHistory: () => void;
  getSessionMetrics: () => void;
  setRealtimeEnabled: (enabled: boolean) => void;
}

/**
 * Hook personalizado para análisis de sentimientos en tiempo real
 * Proporciona capacidades avanzadas de análisis emocional para conversaciones
 */
export const useSentimentAnalysis = (
  options: UseSentimentAnalysisOptions = {}
): SentimentAnalysisState & SentimentAnalysisActions => {
  const {
    enableRealtime = true,
    cacheResults = true,
    analysisDelay = 500,
    userId
  } = options;

  // Estado del análisis de sentimientos
  const [state, setState] = useState<SentimentAnalysisState>({
    currentAnalysis: null,
    conversationMood: null,
    isAnalyzing: false,
    analysisHistory: [],
    sessionMetrics: null,
    error: null
  });

  // Referencias para servicios y timers
  const sentimentServiceRef = useRef<SentimentAnalysisService | null>(null);
  const analysisTimerRef = useRef<NodeJS.Timeout | null>(null);
  const realtimeUnsubscribeRef = useRef<(() => void) | null>(null);

  // Inicializar servicio de análisis de sentimientos
  useEffect(() => {
    const initializeSentimentService = async () => {
      try {
        // Configuración por defecto para GeminiAI
        const defaultConfig: GeminiConfig = {
          apiKey: import.meta.env.VITE_GEMINI_API_KEY || '',
          model: 'gemini-2.5-flash-lite',
          temperature: 0.7,
          maxTokens: 1000,
          contextWindow: 4000
        };
        
        const defaultBehaviorConfig: AIBehaviorConfig = {
          responseStyle: 'friendly',
          adaptToUserLevel: true,
          maintainContext: true,
          maxContextLength: 10,
          enableSentimentAnalysis: true,
          enableLearning: false
        };
        
        const geminiService = new GeminiAIService(defaultConfig, defaultBehaviorConfig);
        sentimentServiceRef.current = new SentimentAnalysisService(geminiService);

        // Configurar callback en tiempo real si está habilitado
        if (enableRealtime && sentimentServiceRef.current) {
          const unsubscribe = sentimentServiceRef.current.onRealtimeAnalysis(
            (analysis: SentimentAnalysis) => {
              setState(prev => ({
                ...prev,
                currentAnalysis: analysis,
                analysisHistory: [...prev.analysisHistory, analysis].slice(-50) // Mantener últimos 50
              }));
            }
          );
          realtimeUnsubscribeRef.current = unsubscribe;
        }
      } catch (error) {
        setState(prev => ({
          ...prev,
          error: 'Error inicializando servicio de análisis de sentimientos'
        }));
      }
    };

    initializeSentimentService();

    // Cleanup
    return () => {
      if (analysisTimerRef.current) {
        clearTimeout(analysisTimerRef.current);
      }
      if (realtimeUnsubscribeRef.current) {
        realtimeUnsubscribeRef.current();
      }
    };
  }, [enableRealtime]);

  // Función para analizar un mensaje
  const analyzeMessage = useCallback(async (message: string): Promise<SentimentAnalysis | null> => {
    if (!sentimentServiceRef.current || !message.trim()) {
      return null;
    }

    setState(prev => ({ ...prev, isAnalyzing: true, error: null }));

    try {
      // Aplicar delay si está configurado
      if (analysisDelay > 0) {
        await new Promise(resolve => {
          analysisTimerRef.current = setTimeout(resolve, analysisDelay);
        });
      }

      const analysis = await sentimentServiceRef.current.analyzeMessageSentiment(message, userId);
      
      setState(prev => {
        const newHistory = [...prev.analysisHistory, analysis].slice(-50);
        return {
          ...prev,
          currentAnalysis: analysis,
          analysisHistory: newHistory,
          isAnalyzing: false
        };
      });

      return analysis;
    } catch (error) {
      setState(prev => ({
        ...prev,
        isAnalyzing: false,
        error: 'Error analizando sentimiento del mensaje'
      }));
      return null;
    }
  }, [analysisDelay, userId]);

  // Función para analizar el estado emocional de la conversación
  const analyzeConversationMood = useCallback(async (
    messages: Array<{ content: string; timestamp: Date; isUser: boolean }>
  ): Promise<EmotionalState | null> => {
    if (!sentimentServiceRef.current || messages.length === 0) {
      return null;
    }

    setState(prev => ({ ...prev, isAnalyzing: true, error: null }));

    try {
      const mood = await sentimentServiceRef.current.analyzeConversationMood(messages);
      
      setState(prev => ({
        ...prev,
        conversationMood: mood,
        isAnalyzing: false
      }));

      return mood;
    } catch (error) {
      setState(prev => ({
        ...prev,
        isAnalyzing: false,
        error: 'Error analizando estado emocional de la conversación'
      }));
      return null;
    }
  }, []);

  // Función para detectar cambios emocionales
  const detectEmotionalShift = useCallback(async (
    previousAnalysis: SentimentAnalysis,
    currentAnalysis: SentimentAnalysis
  ) => {
    if (!sentimentServiceRef.current) {
      return null;
    }

    try {
      return await sentimentServiceRef.current.detectEmotionalShifts(
        previousAnalysis,
        currentAnalysis
      );
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: 'Error detectando cambios emocionales'
      }));
      return null;
    }
  }, []);

  // Función para limpiar historial de análisis
  const clearAnalysisHistory = useCallback(() => {
    setState(prev => ({
      ...prev,
      analysisHistory: [],
      sessionMetrics: null,
      currentAnalysis: null,
      conversationMood: null
    }));

    if (sentimentServiceRef.current) {
      sentimentServiceRef.current.clearCache();
    }
  }, []);

  // Función para obtener métricas de la sesión
  const getSessionMetrics = useCallback(() => {
    if (!sentimentServiceRef.current || state.analysisHistory.length === 0) {
      return;
    }

    try {
      const metrics = sentimentServiceRef.current.getSessionSentimentMetrics(state.analysisHistory);
      setState(prev => ({
        ...prev,
        sessionMetrics: metrics
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: 'Error calculando métricas de sesión'
      }));
    }
  }, [state.analysisHistory]);

  // Función para habilitar/deshabilitar análisis en tiempo real
  const setRealtimeEnabled = useCallback((enabled: boolean) => {
    if (!sentimentServiceRef.current) return;

    if (enabled && !realtimeUnsubscribeRef.current) {
      const unsubscribe = sentimentServiceRef.current.onRealtimeAnalysis(
        (analysis: SentimentAnalysis) => {
          setState(prev => ({
            ...prev,
            currentAnalysis: analysis,
            analysisHistory: [...prev.analysisHistory, analysis].slice(-50)
          }));
        }
      );
      realtimeUnsubscribeRef.current = unsubscribe;
    } else if (!enabled && realtimeUnsubscribeRef.current) {
      realtimeUnsubscribeRef.current();
      realtimeUnsubscribeRef.current = null;
    }
  }, []);

  // Efecto para calcular métricas automáticamente
  useEffect(() => {
    if (state.analysisHistory.length > 0 && state.analysisHistory.length % 5 === 0) {
      getSessionMetrics();
    }
  }, [state.analysisHistory.length, getSessionMetrics]);

  return {
    // Estado
    currentAnalysis: state.currentAnalysis,
    conversationMood: state.conversationMood,
    isAnalyzing: state.isAnalyzing,
    analysisHistory: state.analysisHistory,
    sessionMetrics: state.sessionMetrics,
    error: state.error,

    // Acciones
    analyzeMessage,
    analyzeConversationMood,
    detectEmotionalShift,
    clearAnalysisHistory,
    getSessionMetrics,
    setRealtimeEnabled
  };
};

/**
 * Hook simplificado para análisis básico de sentimientos
 */
export const useBasicSentimentAnalysis = (message: string, delay: number = 1000) => {
  const [analysis, setAnalysis] = useState<SentimentAnalysis | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const { analyzeMessage } = useSentimentAnalysis({
    enableRealtime: false,
    analysisDelay: delay
  });

  useEffect(() => {
    if (!message.trim()) {
      setAnalysis(null);
      return;
    }

    const analyzeWithDelay = async () => {
      setIsLoading(true);
      const result = await analyzeMessage(message);
      setAnalysis(result);
      setIsLoading(false);
    };

    const timer = setTimeout(analyzeWithDelay, delay);
    return () => clearTimeout(timer);
  }, [message, delay, analyzeMessage]);

  return { analysis, isLoading };
};

export default useSentimentAnalysis;