import { useState, useEffect, useCallback } from 'react';
import { ChatMessage, AssistantConfig, AssistantResponse } from '../types';
import { useSpeechRecognition } from './useSpeechRecognition';
import { useSpeechSynthesis } from './useSpeechSynthesis';
import { useGeminiAI } from './useGeminiAI';
import { useConversationContext } from './useConversationContext';
import { useSentimentAnalysis } from './useSentimentAnalysis';
import { ResponseService } from '../lib/responseService';
import { ConfigService } from '../lib/configService';
import { SoundEffectsService } from '../lib/soundEffectsService';
import { AIInput, AIAnalysis, SentimentAnalysis, EmotionalState } from '../types/aiTypes';

interface UseAssistantReturn {
  messages: ChatMessage[];
  config: AssistantConfig;
  isListening: boolean;
  isSpeaking: boolean;
  currentEmotion: AssistantResponse['emotion'];
  sendMessage: (content: string) => void;
  startListening: () => void;
  stopListening: () => void;
  updateConfig: (newConfig: Partial<AssistantConfig>) => void;
  clearMessages: () => void;
  error: string | null;
  // Propiedades de IA
  aiAnalysis: AIAnalysis | null;
  contextSummary: string;
  isProcessingAI: boolean;
  // Propiedades de análisis de sentimientos
  currentSentiment: SentimentAnalysis | null;
  conversationMood: EmotionalState | null;
  sentimentHistory: SentimentAnalysis[];
  emotionalShift: any | null;
  // Nuevas propiedades de compatibilidad de reconocimiento de voz
  speechRecognitionCompatibility: {
    hasKnownIssues: boolean;
    recommendedBrowser: string;
    systemInfo: {
      browser: string;
      os: string;
    };
  };
}

export const useAssistant = (): UseAssistantReturn => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [config, setConfig] = useState<AssistantConfig | null>(null);
  const [currentEmotion, setCurrentEmotion] = useState<AssistantResponse['emotion']>('neutral');
  const [error, setError] = useState<string | null>(null);
  const [aiAnalysis, setAiAnalysis] = useState<AIAnalysis | null>(null);
  const [contextSummary, setContextSummary] = useState<string>('');
  const [emotionalShift, setEmotionalShift] = useState<any | null>(null);

  const {
    transcript,
    isListening,
    startListening: startSpeechRecognition,
    stopListening: stopSpeechRecognition,
    resetTranscript,
    error: speechError,
    hasKnownIssues,
    recommendedBrowser,
    systemInfo
  } = useSpeechRecognition({
    continuous: false,
    interimResults: true,
    lang: 'es-ES'
  });

  const {
    speak,
    isSpeaking,
    stop: stopSpeaking,
    error: synthesisError
  } = useSpeechSynthesis();

  // Hooks de IA
  const {
    processMessage,
    analyzeSentiment,
    generateResponse,
    isProcessing: isProcessingAI,
    error: aiError
  } = useGeminiAI();

  const {
    currentContext,
    updateContext
  } = useConversationContext();

  // Hook de análisis de sentimientos
  const {
    currentAnalysis: currentSentiment,
    conversationMood,
    analysisHistory: sentimentHistory,
    analyzeMessage: analyzeSentimentMessage,
    analyzeConversationMood,
    detectEmotionalShift,
    isAnalyzing: isAnalyzingSentiment,
    error: sentimentError
  } = useSentimentAnalysis({
    enableRealtime: true,
    userId: 'default_user'
  });

  // Cargar configuración inicial
  useEffect(() => {
    const loadConfig = async () => {
      try {
        const initialConfig = await ConfigService.getConfig();
        setConfig(initialConfig);
      } catch (err) {
        setError('Error al cargar la configuración');
        console.error('Error loading config:', err);
      }
    };

    loadConfig();
  }, []);

  // Procesar transcript cuando se complete
  useEffect(() => {
    if (transcript && !isListening) {
      sendMessage(transcript);
      resetTranscript();
    }
  }, [transcript, isListening]);

  // Manejar errores de voz, IA y sentimientos
  useEffect(() => {
    if (speechError || synthesisError || aiError || sentimentError) {
      setError(speechError || synthesisError || aiError || sentimentError);
    }
  }, [speechError, synthesisError, aiError, sentimentError]);

  // Actualizar resumen de contexto
  useEffect(() => {
    const summary = currentContext?.conversationSummary || currentContext?.messages?.map(m => m.content).join(' ').slice(0, 100) || '';
    setContextSummary(summary);
  }, [currentContext]);

  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim() || !config) return;

    const userMessage: ChatMessage = {
      id: `user_${Date.now()}`,
      type: 'user',
      content: content.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);

    try {
      // Preparar input para IA
      const aiInput: AIInput = {
        query: content.trim(),
        sessionId: 'default-session',
        timestamp: new Date(),
        audioInput: false
      };

      // Procesar con IA de Gemini
      const aiResult = await processMessage(aiInput.query);
      setAiAnalysis(aiResult.analysis);

      // Análisis de sentimientos en paralelo
      const sentimentAnalysis = await analyzeSentimentMessage(content.trim());
      
      // Detectar cambios emocionales si hay análisis previo
      if (currentSentiment && sentimentAnalysis) {
        const shift = await detectEmotionalShift(currentSentiment, sentimentAnalysis);
        setEmotionalShift(shift);
      }

      // Actualizar contexto conversacional con información de sentimientos
      const contextUpdate = {
        id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        content: content.trim(),
        type: 'user' as const,
        timestamp: new Date()
      };
      updateContext(contextUpdate);

      // Generar respuesta mejorada basada en sentimientos
      let finalResponse: string = typeof aiResult.response === 'string' ? aiResult.response : aiResult.response.content || '';
      
      // Ajustar respuesta basada en análisis de sentimientos
      if (sentimentAnalysis) {
        // Si detectamos sentimiento negativo, usar tono más empático
        if (sentimentAnalysis.sentiment.label === 'negative' && sentimentAnalysis.sentiment.confidence > 0.7) {
          const empathicPrompt = `El usuario parece ${sentimentAnalysis.emotions.join(', ')}. Responde de manera empática: ${finalResponse}`;
          try {
            const empathicResult = await generateResponse(empathicPrompt, {
              temperature: 0.7,
              maxTokens: 200
            });
            if (empathicResult) finalResponse = typeof empathicResult === 'string' ? empathicResult : empathicResult.content || '';
          } catch (err) {
            console.warn('Error generating empathic response:', err);
          }
        }
      }
      
      // Fallback al servicio original si la IA falla
      if (!finalResponse || finalResponse.trim().length === 0) {
        const fallbackResponse = await ResponseService.getResponse(content);
        finalResponse = fallbackResponse.response;
        setCurrentEmotion(fallbackResponse.emotion);
      } else {
        // Mapear emoción basada en análisis de sentimientos
        const emotionMapping: Record<string, AssistantResponse['emotion']> = {
          'positive': 'happy',
          'negative': 'neutral',
          'neutral': 'neutral',
          'excited': 'excited',
          'confused': 'thinking',
          'frustrated': 'thinking',
          'happy': 'happy',
          'angry': 'neutral'
        };
        
        const primaryEmotion = sentimentAnalysis?.sentiment.label || aiResult.analysis.sentiment;
        setCurrentEmotion(emotionMapping[primaryEmotion] || 'neutral');
      }
      
      const assistantMessage: ChatMessage = {
        id: `assistant_${Date.now()}`,
        type: 'assistant',
        content: finalResponse,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);

      // Reproducir respuesta si está habilitado
      if (config.behavior.autoSpeak) {
        setTimeout(() => {
          speak(finalResponse, {
            volume: config.voice.volume,
            rate: config.voice.rate,
            pitch: config.voice.pitch
          });
          
          // Reproducir efectos de sonido basados en sentimientos y temas
          if (config.behavior.soundEffects) {
            const speechDuration = (finalResponse.length / 10) * (1 / config.voice.rate) * 1000;
            
            // Efecto de tambor para chistes
            if (aiResult.analysis.keywords?.includes('humor')) {
              setTimeout(() => {
                SoundEffectsService.playDrumRoll();
              }, speechDuration + 300);
            }
            
            // Efectos basados en sentimientos
            if (sentimentAnalysis?.sentiment.label === 'positive' && sentimentAnalysis.sentiment.confidence > 0.8) {
              // Sonido positivo para respuestas muy positivas
              setTimeout(() => {
                // SoundEffectsService.playPositiveChime(); // Si tienes este efecto
              }, speechDuration + 100);
            }
          }
        }, config.behavior.responseDelay);
      }
    } catch (err) {
      setError('Error al procesar el mensaje');
      console.error('Error processing message:', err);
      
      const errorMessage: ChatMessage = {
        id: `error_${Date.now()}`,
        type: 'assistant',
        content: 'Lo siento, hubo un error al procesar tu mensaje. ¿Podrías intentarlo de nuevo?',
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, errorMessage]);
      setCurrentEmotion('neutral');
    }
  }, [config, speak, currentContext, processMessage, updateContext, messages]);

  const startListening = useCallback(() => {
    if (isSpeaking) {
      stopSpeaking();
    }
    startSpeechRecognition();
    setError(null);
  }, [isSpeaking, stopSpeaking, startSpeechRecognition]);

  const stopListening = useCallback(() => {
    stopSpeechRecognition();
  }, [stopSpeechRecognition]);

  const updateConfig = useCallback(async (newConfig: Partial<AssistantConfig>) => {
    if (!config) return;

    const updatedConfig = {
      ...config,
      ...newConfig,
      voice: { ...config.voice, ...newConfig.voice },
      theme: { ...config.theme, ...newConfig.theme },
      behavior: { ...config.behavior, ...newConfig.behavior }
    };

    setConfig(updatedConfig);
    
    try {
      await ConfigService.saveConfig(updatedConfig);
    } catch (err) {
      setError('Error al guardar la configuración');
      console.error('Error saving config:', err);
    }
  }, [config]);

  const clearMessages = useCallback(() => {
    setMessages([]);
    setCurrentEmotion('neutral');
    setError(null);
    setAiAnalysis(null);
    setEmotionalShift(null);
    // Configuración inicial del asistente
   }, []);

  return {
    messages,
    config: config || {
      voice: { rate: 1.0, pitch: 1.0, volume: 0.8, voiceIndex: 0 },
      theme: { mode: 'light', primaryColor: '#1E3A8A', avatarStyle: 'friendly' },
      behavior: { autoSpeak: true, micSensitivity: 0.7, responseDelay: 500, soundEffects: true }
    },
    isListening,
    isSpeaking,
    currentEmotion,
    sendMessage,
    startListening,
    stopListening,
    updateConfig,
    clearMessages,
    error,
    // Nuevas funcionalidades de IA
    aiAnalysis,
    contextSummary,
    isProcessingAI,
    // Análisis de sentimientos
    currentSentiment,
    conversationMood,
    sentimentHistory,
    emotionalShift,
    // Compatibilidad de reconocimiento de voz
    speechRecognitionCompatibility: {
      hasKnownIssues,
      recommendedBrowser,
      systemInfo
    }
  };
};