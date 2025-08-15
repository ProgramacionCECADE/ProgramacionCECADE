import { useState, useEffect, useCallback } from 'react';
import { ChatMessage, AssistantConfig, AssistantResponse } from '../types';
import { useSpeechRecognition } from './useSpeechRecognition';
import { useSpeechSynthesis } from './useSpeechSynthesis';
import { ResponseService } from '../lib/responseService';
import { ConfigService } from '../lib/configService';
import { SoundEffectsService } from '../lib/soundEffectsService';

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
}

export const useAssistant = (): UseAssistantReturn => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [config, setConfig] = useState<AssistantConfig | null>(null);
  const [currentEmotion, setCurrentEmotion] = useState<AssistantResponse['emotion']>('neutral');
  const [error, setError] = useState<string | null>(null);

  const {
    transcript,
    isListening,
    startListening: startSpeechRecognition,
    stopListening: stopSpeechRecognition,
    resetTranscript,
    error: speechError
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

  // Manejar errores de voz
  useEffect(() => {
    if (speechError || synthesisError) {
      setError(speechError || synthesisError);
    }
  }, [speechError, synthesisError]);

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
      // Obtener respuesta del asistente
      const response = await ResponseService.getResponse(content);
      
      const assistantMessage: ChatMessage = {
        id: `assistant_${Date.now()}`,
        type: 'assistant',
        content: response.response,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);
      setCurrentEmotion(response.emotion);

      // Reproducir respuesta si está habilitado
      if (config.behavior.autoSpeak) {
        setTimeout(() => {
          speak(response.response, {
            volume: config.voice.volume,
            rate: config.voice.rate,
            pitch: config.voice.pitch
          });
          
          // Reproducir efecto de tambor para chistes
          if (response.category === 'joke' && config.behavior.soundEffects) {
            // Calcular duración aproximada de la síntesis de voz
            const speechDuration = (response.response.length / 10) * (1 / config.voice.rate) * 1000;
            setTimeout(() => {
              SoundEffectsService.playDrumRoll();
            }, speechDuration + 300); // 300ms de pausa antes del efecto
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
  }, [config, speak]);

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
  }, []);

  return {
    messages,
    config: config || {
      voice: { rate: 1.0, pitch: 1.0, volume: 0.8, voiceIndex: 0 },
      theme: { mode: 'light', primaryColor: '#1E3A8A', avatarStyle: 'friendly' },
      behavior: { autoSpeak: true, micSensitivity: 0.7, responseDelay: 500 }
    },
    isListening,
    isSpeaking,
    currentEmotion,
    sendMessage,
    startListening,
    stopListening,
    updateConfig,
    clearMessages,
    error
  };
};