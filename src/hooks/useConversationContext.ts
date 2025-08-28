import { useState, useCallback, useRef, useEffect } from 'react';
import { ContextService, createContextService, getContextService } from '../services/contextService';
import {
  ConversationContext,
  ConversationFlow,
  ShortTermMemory,
  LongTermMemory,
  ContextConfig,
  ContextServiceState,
  ContextEvent
} from '../types/contextTypes';
import { ChatMessage } from '../types/index';
import { UserProfile, AIAnalysis } from '../types/aiTypes';

/**
 * Configuración por defecto para el contexto conversacional
 */
const defaultContextConfig: ContextConfig = {
  maxShortTermMemory: 20,
  maxLongTermMemory: 100,
  contextRetentionDays: 30,
  autoSaveInterval: 300000, // 5 minutos
  compressionThreshold: 50,
  privacyLevel: 'standard'
};

/**
 * Estado del hook useConversationContext
 */
interface UseConversationContextState {
  currentContext: ConversationContext | null;
  isLoading: boolean;
  error: string | null;
  serviceStats: any;
  activeSessionId: string | null;
  contextHistory: ConversationContext[];
  shortTermMemory: ShortTermMemory | null;
  isInitialized: boolean;
}

/**
 * Opciones para el hook useConversationContext
 */
interface UseConversationContextOptions {
  sessionId?: string;
  config?: Partial<ContextConfig>;
  autoInitialize?: boolean;
  enablePersistence?: boolean;
  onContextUpdate?: (context: ConversationContext) => void;
  onMemoryUpdate?: (memory: ShortTermMemory) => void;
  onError?: (error: Error) => void;
}

/**
 * Hook personalizado para manejar el contexto conversacional
 * Proporciona funcionalidades de memoria a corto y largo plazo,
 * seguimiento de temas y comprensión contextual
 */
export function useConversationContext(options: UseConversationContextOptions = {}) {
  const {
    sessionId: initialSessionId,
    config: userConfig = {},
    autoInitialize = true,
    enablePersistence = true,
    onContextUpdate,
    onMemoryUpdate,
    onError
  } = options;

  // Estado del hook
  const [state, setState] = useState<UseConversationContextState>({
    currentContext: null,
    isLoading: false,
    error: null,
    serviceStats: null,
    activeSessionId: initialSessionId || null,
    contextHistory: [],
    shortTermMemory: null,
    isInitialized: false
  });

  // Referencias
  const serviceRef = useRef<ContextService | null>(null);
  const configRef = useRef<ContextConfig>({ ...defaultContextConfig, ...userConfig });
  const autoSaveIntervalRef = useRef<NodeJS.Timeout | null>(null);

  /**
   * Inicializa el servicio de contexto
   */
  const initialize = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      
      // Crear o obtener instancia del servicio
      serviceRef.current = getContextService() || createContextService(configRef.current);
      
      // Obtener estadísticas del servicio
      const stats = serviceRef.current.getServiceStats();
      
      setState(prev => ({
        ...prev,
        isLoading: false,
        isInitialized: true,
        serviceStats: stats
      }));
      
      // Configurar auto-guardado si está habilitado
      if (enablePersistence) {
        setupAutoSave();
      }
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error al inicializar contexto';
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
        isInitialized: false
      }));
      
      onError?.(error instanceof Error ? error : new Error(errorMessage));
    }
  }, [enablePersistence, onError]);

  /**
   * Crea un nuevo contexto de conversación
   */
  const createContext = useCallback((
    sessionId: string,
    userProfile?: Partial<UserProfile>
  ): ConversationContext | null => {
    if (!serviceRef.current) {
      setState(prev => ({ ...prev, error: 'Servicio no inicializado' }));
      return null;
    }

    try {
      const context = serviceRef.current.createContext(sessionId, userProfile);
      
      setState(prev => ({
        ...prev,
        currentContext: context,
        activeSessionId: sessionId,
        error: null
      }));
      
      onContextUpdate?.(context);
      return context;
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error al crear contexto';
      setState(prev => ({ ...prev, error: errorMessage }));
      onError?.(error instanceof Error ? error : new Error(errorMessage));
      return null;
    }
  }, [onContextUpdate, onError]);

  /**
   * Obtiene un contexto existente
   */
  const getContext = useCallback((sessionId: string): ConversationContext | null => {
    if (!serviceRef.current) return null;
    
    try {
      const context = serviceRef.current.getContext(sessionId);
      
      if (context) {
        setState(prev => ({
          ...prev,
          currentContext: context,
          activeSessionId: sessionId
        }));
      }
      
      return context;
    } catch (error) {
      console.warn('Error obteniendo contexto:', error);
      return null;
    }
  }, []);

  /**
   * Actualiza el contexto con un nuevo mensaje
   */
  const updateContext = useCallback((
    message: ChatMessage,
    analysis?: AIAnalysis,
    sessionId?: string
  ): ConversationContext | null => {
    if (!serviceRef.current) {
      setState(prev => ({ ...prev, error: 'Servicio no inicializado' }));
      return null;
    }

    const targetSessionId = sessionId || state.activeSessionId;
    if (!targetSessionId) {
      setState(prev => ({ ...prev, error: 'No hay sesión activa' }));
      return null;
    }

    try {
      const updatedContext = serviceRef.current.updateContext(
        targetSessionId,
        message,
        analysis
      );
      
      setState(prev => ({
        ...prev,
        currentContext: updatedContext,
        error: null
      }));
      
      // Actualizar memoria a corto plazo
      updateShortTermMemory(targetSessionId);
      
      onContextUpdate?.(updatedContext);
      return updatedContext;
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error al actualizar contexto';
      setState(prev => ({ ...prev, error: errorMessage }));
      onError?.(error instanceof Error ? error : new Error(errorMessage));
      return null;
    }
  }, [state.activeSessionId, onContextUpdate, onError]);

  /**
   * Actualiza la memoria a corto plazo
   */
  const updateShortTermMemory = useCallback((sessionId: string) => {
    if (!serviceRef.current) return;
    
    try {
      // Acceder a la memoria a corto plazo del servicio
      const memory = (serviceRef.current as any).shortTermMemory?.get(sessionId);
      
      if (memory) {
        setState(prev => ({ ...prev, shortTermMemory: memory }));
        onMemoryUpdate?.(memory);
      }
    } catch (error) {
      console.warn('Error actualizando memoria a corto plazo:', error);
    }
  }, [onMemoryUpdate]);

  /**
   * Cambia a una sesión diferente
   */
  const switchSession = useCallback((sessionId: string): ConversationContext | null => {
    const context = getContext(sessionId);
    
    if (context) {
      setState(prev => ({
        ...prev,
        activeSessionId: sessionId,
        currentContext: context
      }));
      
      updateShortTermMemory(sessionId);
    }
    
    return context;
  }, [getContext, updateShortTermMemory]);

  /**
   * Obtiene el historial de contextos
   */
  const getContextHistory = useCallback((): ConversationContext[] => {
    if (!serviceRef.current) return [];
    
    try {
      // Obtener todos los contextos del servicio
      const contexts = Array.from((serviceRef.current as any).contexts.values()) as ConversationContext[];
      
      setState(prev => ({ ...prev, contextHistory: contexts }));
      return contexts;
    } catch (error) {
      console.warn('Error obteniendo historial:', error);
      return [];
    }
  }, []);

  /**
   * Obtiene temas activos de la conversación actual
   */
  const getActiveTopics = useCallback((): string[] => {
    return state.currentContext?.activeTopics || [];
  }, [state.currentContext]);

  /**
   * Obtiene el flujo de conversación actual
   */
  const getConversationFlow = useCallback((): ConversationFlow | null => {
    return state.currentContext?.conversationFlow || null;
  }, [state.currentContext]);

  /**
   * Obtiene el perfil del usuario actual
   */
  const getUserProfile = useCallback((): UserProfile | null => {
    return state.currentContext?.userProfile || null;
  }, [state.currentContext]);

  /**
   * Actualiza el perfil del usuario
   */
  const updateUserProfile = useCallback((
    updates: Partial<UserProfile>,
    sessionId?: string
  ): boolean => {
    const targetSessionId = sessionId || state.activeSessionId;
    if (!targetSessionId || !state.currentContext) return false;
    
    try {
      const updatedContext = {
        ...state.currentContext,
        userProfile: {
          ...state.currentContext.userProfile,
          ...updates
        }
      };
      
      setState(prev => ({ ...prev, currentContext: updatedContext }));
      onContextUpdate?.(updatedContext);
      
      return true;
    } catch (error) {
      console.warn('Error actualizando perfil de usuario:', error);
      return false;
    }
  }, [state.activeSessionId, state.currentContext, onContextUpdate]);

  /**
   * Limpia el contexto actual
   */
  const clearCurrentContext = useCallback(() => {
    setState(prev => ({
      ...prev,
      currentContext: null,
      activeSessionId: null,
      shortTermMemory: null,
      error: null
    }));
  }, []);

  /**
   * Limpia todos los contextos
   */
  const clearAllContexts = useCallback(() => {
    if (!serviceRef.current) return;
    
    try {
      serviceRef.current.clearAllContexts();
      
      setState(prev => ({
        ...prev,
        currentContext: null,
        activeSessionId: null,
        contextHistory: [],
        shortTermMemory: null,
        error: null
      }));
    } catch (error) {
      console.warn('Error limpiando contextos:', error);
    }
  }, []);

  /**
   * Obtiene estadísticas del servicio
   */
  const getServiceStats = useCallback(() => {
    if (!serviceRef.current) return null;
    
    try {
      const stats = serviceRef.current.getServiceStats();
      setState(prev => ({ ...prev, serviceStats: stats }));
      return stats;
    } catch (error) {
      console.warn('Error obteniendo estadísticas:', error);
      return null;
    }
  }, []);

  /**
   * Actualiza la configuración del servicio
   */
  const updateConfig = useCallback((newConfig: Partial<ContextConfig>) => {
    if (!serviceRef.current) return;
    
    try {
      configRef.current = { ...configRef.current, ...newConfig };
      serviceRef.current.updateConfig(configRef.current);
    } catch (error) {
      console.warn('Error actualizando configuración:', error);
    }
  }, []);

  /**
   * Configura el auto-guardado
   */
  const setupAutoSave = useCallback(() => {
    if (autoSaveIntervalRef.current) {
      clearInterval(autoSaveIntervalRef.current);
    }
    
    autoSaveIntervalRef.current = setInterval(() => {
      if (state.currentContext && state.activeSessionId) {
        // El servicio ya maneja la persistencia automática
        getServiceStats();
      }
    }, configRef.current.autoSaveInterval);
  }, [state.currentContext, state.activeSessionId, getServiceStats]);

  /**
   * Obtiene métricas de la conversación actual
   */
  const getConversationMetrics = useCallback(() => {
    if (!state.currentContext) return null;
    
    const context = state.currentContext;
    const now = Date.now();
    const startTime = context.metadata.startTime.getTime();
    
    return {
      duration: now - startTime,
      messageCount: context.metadata.messageCount,
      topicCount: context.metadata.topicCount,
      averageResponseTime: context.metadata.averageResponseTime,
      activeTopics: context.activeTopics.length,
      userEngagement: context.conversationFlow.userEngagementLevel,
      conversationStage: context.conversationFlow.conversationStage
    };
  }, [state.currentContext]);

  /**
   * Predice el próximo tema de conversación
   */
  const predictNextTopic = useCallback((): string[] => {
    return state.currentContext?.conversationFlow.expectedNextTopics || [];
  }, [state.currentContext]);

  // Efectos
  useEffect(() => {
    if (autoInitialize && !state.isInitialized && !state.isLoading) {
      initialize();
    }
  }, [autoInitialize, state.isInitialized, state.isLoading, initialize]);

  // Crear contexto automáticamente si se proporciona sessionId
  useEffect(() => {
    if (state.isInitialized && initialSessionId && !state.currentContext) {
      const existingContext = getContext(initialSessionId);
      if (!existingContext) {
        createContext(initialSessionId);
      }
    }
  }, [state.isInitialized, initialSessionId, state.currentContext, getContext, createContext]);

  // Cleanup al desmontar
  useEffect(() => {
    return () => {
      if (autoSaveIntervalRef.current) {
        clearInterval(autoSaveIntervalRef.current);
      }
    };
  }, []);

  return {
    // Estado
    currentContext: state.currentContext,
    isLoading: state.isLoading,
    error: state.error,
    isInitialized: state.isInitialized,
    activeSessionId: state.activeSessionId,
    contextHistory: state.contextHistory,
    shortTermMemory: state.shortTermMemory,
    serviceStats: state.serviceStats,
    
    // Métodos principales
    initialize,
    createContext,
    getContext,
    updateContext,
    switchSession,
    
    // Métodos de información
    getActiveTopics,
    getConversationFlow,
    getUserProfile,
    getContextHistory,
    getConversationMetrics,
    predictNextTopic,
    
    // Métodos de actualización
    updateUserProfile,
    updateConfig,
    
    // Métodos de limpieza
    clearCurrentContext,
    clearAllContexts,
    
    // Utilidades
    getServiceStats,
    
    // Estado derivado
    hasActiveContext: !!state.currentContext,
    messageCount: state.currentContext?.metadata.messageCount || 0,
    conversationDuration: state.currentContext 
      ? Date.now() - state.currentContext.metadata.startTime.getTime()
      : 0,
    userEngagement: state.currentContext?.conversationFlow.userEngagementLevel || 'medium',
    currentTopic: state.currentContext?.conversationFlow.currentTopic || null,
    userLevel: state.currentContext?.userProfile.detectedLevel || 'intermediate'
  };
}

/**
 * Hook simplificado para contexto básico
 */
export function useBasicContext(sessionId: string) {
  const {
    currentContext,
    updateContext,
    isInitialized,
    createContext,
    getContext
  } = useConversationContext({
    sessionId,
    autoInitialize: true
  });
  
  useEffect(() => {
    if (isInitialized && !currentContext) {
      const existing = getContext(sessionId);
      if (!existing) {
        createContext(sessionId);
      }
    }
  }, [isInitialized, currentContext, sessionId, getContext, createContext]);
  
  return {
    context: currentContext,
    updateContext: (message: ChatMessage, analysis?: AIAnalysis) => 
      updateContext(message, analysis, sessionId),
    isReady: isInitialized && !!currentContext
  };
}

/**
 * Hook para métricas de conversación
 */
export function useConversationMetrics(sessionId?: string) {
  const { getConversationMetrics, currentContext, activeSessionId } = useConversationContext({
    sessionId,
    autoInitialize: true
  });
  
  const metrics = getConversationMetrics();
  
  return {
    metrics,
    isActive: !!(sessionId ? sessionId === activeSessionId : currentContext),
    hasMetrics: !!metrics
  };
}