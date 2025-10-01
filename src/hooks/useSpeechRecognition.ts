import { useState, useEffect, useRef, useCallback } from 'react';
import { SpeechRecognitionConfig } from '../types';
import { 
  detectBrowser, 
  detectSystem, 
  evaluateSpeechRecognitionCompatibility,
  generateSpeechRecognitionErrorMessage,
  logSpeechRecognitionDebugInfo 
} from '../lib/browserDetection';

// Declaraciones de tipos para SpeechRecognition API
interface SpeechRecognitionEvent extends Event {
  readonly resultIndex: number;
  readonly results: SpeechRecognitionResultList;
}

interface SpeechRecognitionErrorEvent extends Event {
  readonly error: string;
  readonly message: string;
}

interface SpeechRecognitionResult {
  readonly isFinal: boolean;
  readonly length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionResultList {
  readonly length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionAlternative {
  readonly transcript: string;
  readonly confidence: number;
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  grammars: any;
  interimResults: boolean;
  lang: string;
  maxAlternatives: number;
  serviceURI: string;
  start(): void;
  stop(): void;
  abort(): void;
  onstart: ((this: SpeechRecognition, ev: Event) => any) | null;
  onend: ((this: SpeechRecognition, ev: Event) => any) | null;
  onerror: ((this: SpeechRecognition, ev: SpeechRecognitionErrorEvent) => any) | null;
  onresult: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => any) | null;
}

declare var SpeechRecognition: {
  prototype: SpeechRecognition;
  new(): SpeechRecognition;
};

// Declaración global para SpeechRecognition
declare global {
  interface Window {
    SpeechRecognition: typeof SpeechRecognition;
    webkitSpeechRecognition: typeof SpeechRecognition;
  }
}

interface UseSpeechRecognitionReturn {
  transcript: string;
  isListening: boolean;
  isSupported: boolean;
  startListening: () => void;
  stopListening: () => void;
  resetTranscript: () => void;
  error: string | null;
  hasKnownIssues: boolean;
  recommendedBrowser: string;
  systemInfo: {
    browser: string;
    os: string;
  };
}

const defaultConfig: SpeechRecognitionConfig = {
  continuous: false,
  interimResults: true,
  lang: 'es-ES',
  maxAlternatives: 1,
};

export const useSpeechRecognition = (
  config: Partial<SpeechRecognitionConfig> = {}
): UseSpeechRecognitionReturn => {
  const [transcript, setTranscript] = useState<string>('');
  const [isListening, setIsListening] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState<number>(0);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const finalConfig = { ...defaultConfig, ...config };

  // Detectar información del sistema y navegador
  const browserInfo = detectBrowser();
  const systemInfo = detectSystem();
  const compatibility = evaluateSpeechRecognitionCompatibility();

  // Verificar soporte del navegador
  const isSupported = typeof window !== 'undefined' && 
    ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);

  // Configuración específica para Linux/Edge
  const getOptimizedConfig = () => {
    const baseConfig = { ...finalConfig };
    
    // Configuraciones específicas para problemas conocidos
    if (systemInfo.isLinux && browserInfo.isEdge) {
      // Configuración más conservadora para Edge en Linux
      baseConfig.continuous = false; // Evitar modo continuo que causa más errores
      baseConfig.interimResults = false; // Reducir la carga de procesamiento
    }
    
    return baseConfig;
  };

  // Inicializar SpeechRecognition
  useEffect(() => {
    if (!isSupported) {
      const errorMsg = compatibility.hasKnownIssues 
        ? compatibility.issueDescription 
        : 'El reconocimiento de voz no está soportado en este navegador';
      setError(errorMsg);
      logSpeechRecognitionDebugInfo('not-supported');
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    const optimizedConfig = getOptimizedConfig();

    recognition.continuous = optimizedConfig.continuous;
    recognition.interimResults = optimizedConfig.interimResults;
    recognition.lang = optimizedConfig.lang;
    recognition.maxAlternatives = optimizedConfig.maxAlternatives;

    // Configurar serviceURI si es necesario (para algunos navegadores)
    if (systemInfo.isLinux && browserInfo.isEdge) {
      try {
        // Intentar configurar un serviceURI alternativo si está disponible
        if ('serviceURI' in recognition) {
          recognition.serviceURI = '';
        }
      } catch (e) {
        console.warn('No se pudo configurar serviceURI:', e);
      }
    }

    recognition.onstart = () => {
      setIsListening(true);
      setError(null);
      setRetryCount(0); // Reset retry count on successful start
      console.log('🎤 Reconocimiento de voz iniciado');
    };

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let finalTranscript = '';
      let interimTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          finalTranscript += result[0].transcript;
        } else {
          interimTranscript += result[0].transcript;
        }
      }

      setTranscript(finalTranscript || interimTranscript);
    };

    recognition.onend = () => {
      setIsListening(false);
      console.log('🎤 Reconocimiento de voz finalizado');
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      const errorType = event.error;
      console.error('🚫 Error en reconocimiento de voz:', errorType, event.message);
      
      // Log información de debugging
      logSpeechRecognitionDebugInfo(errorType);
      
      // Generar mensaje de error específico
      const errorMessage = generateSpeechRecognitionErrorMessage(errorType);
      setError(errorMessage);
      setIsListening(false);
      
      // Implementar reintentos automáticos para errores de red
      if (errorType === 'network' && retryCount < 3) {
        console.log(`🔄 Reintentando reconocimiento de voz (intento ${retryCount + 1}/3)`);
        setRetryCount(prev => prev + 1);
        
        // Reintento con delay exponencial
        const delay = Math.pow(2, retryCount) * 1000; // 1s, 2s, 4s
        retryTimeoutRef.current = setTimeout(() => {
          if (recognitionRef.current && !isListening) {
            try {
              recognitionRef.current.start();
            } catch (retryError) {
              console.error('Error en reintento:', retryError);
            }
          }
        }, delay);
      }
    };

    recognitionRef.current = recognition;

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
    };
  }, [finalConfig.continuous, finalConfig.interimResults, finalConfig.lang, finalConfig.maxAlternatives, isSupported, retryCount]);

  const startListening = useCallback(() => {
    if (!isSupported) {
      const errorMsg = compatibility.hasKnownIssues 
        ? compatibility.issueDescription 
        : 'El reconocimiento de voz no está soportado';
      setError(errorMsg);
      return;
    }

    if (recognitionRef.current && !isListening) {
      setTranscript('');
      setError(null);
      setRetryCount(0); // Reset retry count when manually starting
      
      // Limpiar timeout de reintento si existe
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
        retryTimeoutRef.current = null;
      }
      
      try {
        console.log('🎤 Iniciando reconocimiento de voz...');
        recognitionRef.current.start();
      } catch (err) {
        console.error('Error al iniciar reconocimiento:', err);
        const errorMessage = generateSpeechRecognitionErrorMessage('start-error');
        setError(errorMessage);
        logSpeechRecognitionDebugInfo('start-error');
      }
    }
  }, [isListening, isSupported, compatibility]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current && isListening) {
      console.log('🛑 Deteniendo reconocimiento de voz...');
      recognitionRef.current.stop();
    }
    
    // Limpiar timeout de reintento si existe
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
      retryTimeoutRef.current = null;
    }
  }, [isListening]);

  const resetTranscript = useCallback(() => {
    setTranscript('');
    setError(null);
    setRetryCount(0);
    
    // Limpiar timeout de reintento si existe
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
      retryTimeoutRef.current = null;
    }
  }, []);

  return {
    transcript,
    isListening,
    isSupported,
    startListening,
    stopListening,
    resetTranscript,
    error,
    hasKnownIssues: compatibility.hasKnownIssues,
    recommendedBrowser: compatibility.recommendedBrowser,
    systemInfo: {
      browser: `${browserInfo.name} ${browserInfo.version}`,
      os: systemInfo.os,
    },
  };
};