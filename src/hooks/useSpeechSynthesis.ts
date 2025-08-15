import { useState, useEffect, useRef, useCallback } from 'react';
import { SpeechSynthesisConfig } from '../types';
import { cleanTextForSpeech } from '../lib/utils';

interface UseSpeechSynthesisReturn {
  speak: (text: string, config?: Partial<SpeechSynthesisConfig>) => void;
  stop: () => void;
  pause: () => void;
  resume: () => void;
  isSpeaking: boolean;
  isPaused: boolean;
  isSupported: boolean;
  voices: SpeechSynthesisVoice[];
  selectedVoice: SpeechSynthesisVoice | null;
  setSelectedVoice: (voice: SpeechSynthesisVoice) => void;
  error: string | null;
}

const defaultConfig = {
  volume: 0.8,
  rate: 1.0,
  pitch: 1.0,
};

export const useSpeechSynthesis = (): UseSpeechSynthesisReturn => {
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<SpeechSynthesisVoice | null>(null);
  const [error, setError] = useState<string | null>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Verificar soporte del navegador
  const isSupported = typeof window !== 'undefined' && 'speechSynthesis' in window;

  // Cargar voces disponibles
  useEffect(() => {
    if (!isSupported) {
      setError('La síntesis de voz no está soportada en este navegador');
      return;
    }

    const loadVoices = () => {
      const availableVoices = speechSynthesis.getVoices();
      setVoices(availableVoices);
      
      // Buscar específicamente la voz de Microsoft Andres Online (Natural)
      const andresVoice = availableVoices.find(voice => 
        voice.name.includes('Microsoft Andres Online (Natural)') && 
        voice.lang === 'es-GT'
      );
      
      // Fallback a cualquier voz de Andres en español
      const anyAndresVoice = availableVoices.find(voice => 
        voice.name.toLowerCase().includes('andres') && 
        voice.lang.startsWith('es')
      );
      
      // Fallback a voces de Guatemala
      const guatemalanVoice = availableVoices.find(voice => 
        voice.lang === 'es-GT'
      );
      
      // Fallback a cualquier voz en español
      const spanishVoice = availableVoices.find(voice => 
        voice.lang.startsWith('es') || voice.lang.includes('ES')
      );
      
      if (andresVoice) {
        setSelectedVoice(andresVoice);
        console.log('✓ Voz de Microsoft Andres Online (Natural) configurada correctamente');
      } else if (anyAndresVoice) {
        setSelectedVoice(anyAndresVoice);
        console.log('⚠️ Usando voz de Andres alternativa:', anyAndresVoice.name);
      } else if (guatemalanVoice) {
        setSelectedVoice(guatemalanVoice);
        console.log('⚠️ Usando voz de Guatemala alternativa:', guatemalanVoice.name);
      } else if (spanishVoice) {
        setSelectedVoice(spanishVoice);
        console.log('⚠️ Usando voz en español alternativa:', spanishVoice.name);
      } else if (availableVoices.length > 0) {
        setSelectedVoice(availableVoices[0]);
        console.log('⚠️ Usando voz por defecto del sistema:', availableVoices[0].name);
      }
    };

    // Cargar voces inmediatamente si están disponibles
    loadVoices();

    // Escuchar el evento de voces cargadas (algunos navegadores lo necesitan)
    speechSynthesis.addEventListener('voiceschanged', loadVoices);

    return () => {
      speechSynthesis.removeEventListener('voiceschanged', loadVoices);
    };
  }, [isSupported]);

  // Monitorear el estado de la síntesis
  useEffect(() => {
    if (!isSupported) return;

    const checkSpeakingStatus = () => {
      setIsSpeaking(speechSynthesis.speaking);
      setIsPaused(speechSynthesis.paused);
    };

    const interval = setInterval(checkSpeakingStatus, 100);

    return () => {
      clearInterval(interval);
    };
  }, [isSupported]);

  const speak = useCallback((text: string, config: Partial<SpeechSynthesisConfig> = {}) => {
    if (!isSupported) {
      setError('La síntesis de voz no está soportada');
      return;
    }

    if (!text.trim()) {
      setError('No hay texto para reproducir');
      return;
    }

    // Limpiar el texto removiendo emojis y caracteres especiales
    const cleanedText = cleanTextForSpeech(text);
    
    if (!cleanedText.trim()) {
      setError('El texto no contiene contenido reproducible');
      return;
    }

    // Detener cualquier síntesis en curso
    speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(cleanedText);
    const finalConfig = { ...defaultConfig, ...config };

    utterance.volume = finalConfig.volume;
    utterance.rate = finalConfig.rate;
    utterance.pitch = finalConfig.pitch;

    if (selectedVoice) {
      utterance.voice = selectedVoice;
    }

    utterance.onstart = () => {
      setIsSpeaking(true);
      setIsPaused(false);
      setError(null);
    };

    utterance.onend = () => {
      setIsSpeaking(false);
      setIsPaused(false);
    };

    utterance.onerror = (event) => {
      setError(`Error en la síntesis de voz: ${event.error}`);
      setIsSpeaking(false);
      setIsPaused(false);
    };

    utterance.onpause = () => {
      setIsPaused(true);
    };

    utterance.onresume = () => {
      setIsPaused(false);
    };

    utteranceRef.current = utterance;
    speechSynthesis.speak(utterance);
  }, [isSupported, selectedVoice]);

  const stop = useCallback(() => {
    if (isSupported) {
      speechSynthesis.cancel();
      setIsSpeaking(false);
      setIsPaused(false);
    }
  }, [isSupported]);

  const pause = useCallback(() => {
    if (isSupported && isSpeaking && !isPaused) {
      speechSynthesis.pause();
      setIsPaused(true);
    }
  }, [isSupported, isSpeaking, isPaused]);

  const resume = useCallback(() => {
    if (isSupported && isSpeaking && isPaused) {
      speechSynthesis.resume();
      setIsPaused(false);
    }
  }, [isSupported, isSpeaking, isPaused]);

  return {
    speak,
    stop,
    pause,
    resume,
    isSpeaking,
    isPaused,
    isSupported,
    voices,
    selectedVoice,
    setSelectedVoice,
    error,
  };
};