import React from 'react';
import { Mic, MicOff, Volume2, VolumeX, AlertTriangle, Info } from 'lucide-react';
import { motion } from 'framer-motion';
import { VoiceControlsProps } from '../types';

interface ExtendedVoiceControlsProps extends VoiceControlsProps {
  isSpeaking?: boolean;
  onStopSpeaking?: () => void;
  speechRecognitionCompatibility?: {
    hasKnownIssues: boolean;
    recommendedBrowser: string;
    systemInfo: {
      browser: string;
      os: string;
    };
  };
}

export const VoiceControls: React.FC<ExtendedVoiceControlsProps> = ({
  isListening,
  onStartListening,
  onStopListening,
  disabled = false,
  isSpeaking = false,
  onStopSpeaking,
  speechRecognitionCompatibility
}) => {
  const handleMicClick = () => {
    if (disabled) return;
    
    if (isListening) {
      onStopListening();
    } else {
      onStartListening();
    }
  };

  const handleSpeakerClick = () => {
    if (onStopSpeaking && isSpeaking) {
      onStopSpeaking();
    }
  };

  return (
    <div className="flex flex-col items-center justify-center gap-4 p-6">
      {/* Alerta de compatibilidad */}
      {speechRecognitionCompatibility?.hasKnownIssues && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 max-w-md"
        >
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="text-yellow-800 font-medium mb-1">
                Problema de compatibilidad detectado
              </p>
              <p className="text-yellow-700 mb-2">
                Sistema: {speechRecognitionCompatibility.systemInfo.os} - {speechRecognitionCompatibility.systemInfo.browser}
              </p>
              <p className="text-yellow-700">
                Navegador recomendado: <span className="font-medium">{speechRecognitionCompatibility.recommendedBrowser}</span>
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Controles de voz */}
      <div className="flex items-center justify-center gap-6">
        {/* Botón de Micrófono */}
        <motion.button
          onClick={handleMicClick}
          disabled={disabled}
          className={`
            relative w-20 h-20 rounded-full flex items-center justify-center
            transition-all duration-300 shadow-lg
            ${isListening 
              ? 'bg-red-500 hover:bg-red-600 text-white' 
              : 'bg-blue-600 hover:bg-blue-700 text-white'
            }
            ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
            focus:outline-none focus:ring-4 focus:ring-blue-300
          `}
          whileHover={!disabled ? { scale: 1.05 } : {}}
          whileTap={!disabled ? { scale: 0.95 } : {}}
          animate={isListening ? {
            boxShadow: [
              '0 0 0 0 rgba(239, 68, 68, 0.7)',
              '0 0 0 20px rgba(239, 68, 68, 0)',
              '0 0 0 0 rgba(239, 68, 68, 0.7)'
            ]
          } : {}}
          transition={{
            boxShadow: {
              duration: 1.5,
              repeat: isListening ? Infinity : 0,
              ease: 'easeInOut'
            }
          }}
        >
          {isListening ? (
            <MicOff className="w-8 h-8" />
          ) : (
            <Mic className="w-8 h-8" />
          )}
          
          {/* Indicador de grabación */}
          {isListening && (
            <motion.div
              className="absolute -top-2 -right-2 w-4 h-4 bg-red-400 rounded-full"
              animate={{
                scale: [1, 1.2, 1],
                opacity: [1, 0.7, 1]
              }}
              transition={{
                duration: 1,
                repeat: Infinity,
                ease: 'easeInOut'
              }}
            />
          )}
        </motion.button>

        {/* Botón de Altavoz (solo visible cuando está hablando) */}
        {isSpeaking && onStopSpeaking && (
          <motion.button
            onClick={handleSpeakerClick}
            className="
              w-16 h-16 rounded-full flex items-center justify-center
              bg-orange-500 hover:bg-orange-600 text-white
              transition-all duration-300 shadow-lg
              cursor-pointer focus:outline-none focus:ring-4 focus:ring-orange-300
            "
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <VolumeX className="w-6 h-6" />
          </motion.button>
        )}

        {/* Indicador de estado de voz */}
        {isSpeaking && (
          <motion.div
            className="flex items-center gap-1"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <Volume2 className="w-5 h-5 text-orange-500" />
            <div className="flex gap-1">
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  className="w-1 h-6 bg-orange-500 rounded-full"
                  animate={{
                    scaleY: [0.3, 1, 0.3],
                    opacity: [0.5, 1, 0.5]
                  }}
                  transition={{
                    duration: 0.8,
                    repeat: Infinity,
                    delay: i * 0.2,
                    ease: 'easeInOut'
                  }}
                />
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

// Componente de estado de voz simplificado
export const VoiceStatus: React.FC<{
  isListening: boolean;
  isSpeaking: boolean;
  error?: string | null;
  speechRecognitionCompatibility?: {
    hasKnownIssues: boolean;
    recommendedBrowser: string;
    systemInfo: {
      browser: string;
      os: string;
    };
  };
}> = ({ isListening, isSpeaking, error, speechRecognitionCompatibility }) => {
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center p-2 gap-2">
        <div className="text-red-500 text-sm font-medium bg-red-50 px-3 py-1 rounded-full">
          {error}
        </div>
        {speechRecognitionCompatibility?.hasKnownIssues && (
          <div className="text-xs text-yellow-600 bg-yellow-50 px-2 py-1 rounded-full flex items-center gap-1">
            <Info className="w-3 h-3" />
            Prueba con {speechRecognitionCompatibility.recommendedBrowser}
          </div>
        )}
      </div>
    );
  }

  if (isListening) {
    return (
      <div className="flex items-center justify-center p-2">
        <div className="text-red-600 text-sm font-medium bg-red-50 px-3 py-1 rounded-full flex items-center gap-2">
          <motion.div
            className="w-2 h-2 bg-red-500 rounded-full"
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 1, repeat: Infinity }}
          />
          Escuchando...
        </div>
      </div>
    );
  }

  if (isSpeaking) {
    return (
      <div className="flex items-center justify-center p-2">
        <div className="text-orange-600 text-sm font-medium bg-orange-50 px-3 py-1 rounded-full flex items-center gap-2">
          <Volume2 className="w-3 h-3" />
          Hablando...
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center p-2 gap-2">
      <div className="text-gray-500 text-sm font-medium bg-gray-50 px-3 py-1 rounded-full">
        Toca el micrófono para hablar
      </div>
      {speechRecognitionCompatibility?.hasKnownIssues && (
        <div className="text-xs text-yellow-600 bg-yellow-50 px-2 py-1 rounded-full flex items-center gap-1">
          <AlertTriangle className="w-3 h-3" />
          Compatibilidad limitada en {speechRecognitionCompatibility.systemInfo.os}
        </div>
      )}
    </div>
  );
};