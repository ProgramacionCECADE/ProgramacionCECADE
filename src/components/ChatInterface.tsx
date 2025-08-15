import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Trash2, Settings, Mic, MicOff } from 'lucide-react';
import { MessageBubble, TypingIndicator, SystemMessage } from './MessageBubble';
import { VoiceControls, VoiceStatus } from './VoiceControls';
import { useAssistant } from '../hooks/useAssistant';
import { ChatMessage } from '../types';

interface ChatInterfaceProps {
  onOpenSettings?: () => void;
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({ onOpenSettings }) => {
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  
  const {
    messages,
    isListening,
    isSpeaking,
    sendMessage,
    startListening,
    stopListening,
    clearMessages,
    error
  } = useAssistant();

  // Auto-scroll al final cuando hay nuevos mensajes
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Simular indicador de escritura
  useEffect(() => {
    if (messages.length > 0 && messages[messages.length - 1].type === 'user') {
      setIsTyping(true);
      const timer = setTimeout(() => setIsTyping(false), 1500);
      return () => clearTimeout(timer);
    }
  }, [messages]);

  const handleSendMessage = () => {
    if (inputText.trim()) {
      sendMessage(inputText.trim());
      setInputText('');
      inputRef.current?.focus();
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handlePlayAudio = (text: string) => {
    // Esta función será manejada por el hook useAssistant
    // que ya tiene la lógica de síntesis de voz
    console.log('Playing audio for:', text);
  };

  return (
    <div className="flex flex-col h-full bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 shadow-sm border-b dark:border-gray-700">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: `linear-gradient(to bottom right, var(--primary-600), var(--primary-700))` }}>
            <span className="text-white font-bold text-lg">C</span>
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-800 dark:text-white">Asistente CECADE</h1>
            <p className="text-sm text-gray-600 dark:text-gray-300">Especialidad en Programación</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {onOpenSettings && (
            <motion.button
              onClick={onOpenSettings}
              className="
                p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors
                focus:outline-none focus:ring-2 focus:ring-blue-300
              "
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              title="Configuración"
            >
              <Settings className="w-5 h-5 text-gray-600 dark:text-gray-300" />
            </motion.button>
          )}
          
          <motion.button
            onClick={clearMessages}
            className="
              p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors
              focus:outline-none focus:ring-2 focus:ring-blue-300
            "
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            title="Limpiar chat"
          >
            <Trash2 className="w-5 h-5 text-gray-600 dark:text-gray-300" />
          </motion.button>
        </div>
      </div>

      {/* Estado de voz */}
      <VoiceStatus 
        isListening={isListening} 
        isSpeaking={isSpeaking} 
        error={error}
      />

      {/* Área de mensajes */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="w-20 h-20 rounded-full flex items-center justify-center mb-4" style={{ background: `linear-gradient(to bottom right, var(--primary-500), var(--primary-600))` }}>
              <span className="text-white font-bold text-2xl">C</span>
            </div>
            <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-2">
              ¡Hola! Soy el asistente de CECADE
            </h2>
            <p className="text-gray-600 dark:text-gray-300 mb-4 max-w-md">
              Estoy aquí para contarte sobre nuestra especialidad en programación. 
              Puedes escribir o usar el micrófono para hablar conmigo.
            </p>
            <div className="flex flex-wrap gap-2 justify-center">
              {[
                '¿Qué es programación?',
                'Cuéntame sobre CECADE',
                'Dime un chiste',
                '¿Qué tecnologías enseñan?'
              ].map((suggestion, index) => (
                <motion.button
                  key={index}
                  onClick={() => setInputText(suggestion)}
                  className="
                    px-3 py-2 bg-white dark:bg-gray-700 rounded-full text-sm text-gray-700 dark:text-gray-200
                    border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors
                    focus:outline-none focus:ring-2 focus:ring-blue-300
                  "
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {suggestion}
                </motion.button>
              ))}
            </div>
          </div>
        )}

        <AnimatePresence>
          {messages.map((message) => (
            <MessageBubble
              key={message.id}
              message={message}
              onPlayAudio={handlePlayAudio}
            />
          ))}
          
          {isTyping && <TypingIndicator />}
        </AnimatePresence>
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input de texto y controles de voz integrados */}
      <div className="p-4 bg-white dark:bg-gray-800 border-t dark:border-gray-700">
        {/* Controles de voz prominentes */}
        <div className="flex justify-center mb-4">
          <motion.button
            onClick={() => {
              if (isListening) {
                stopListening();
              } else {
                startListening();
              }
            }}
            disabled={false}
            className={`
              relative w-16 h-16 rounded-full flex items-center justify-center
              transition-all duration-300 shadow-lg
              ${isListening 
                ? 'bg-red-500 hover:bg-red-600 text-white' 
                : 'bg-blue-600 hover:bg-blue-700 text-white'
              }
              focus:outline-none focus:ring-4 focus:ring-blue-300
            `}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
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
              <MicOff className="w-7 h-7" />
            ) : (
              <Mic className="w-7 h-7" />
            )}
            
            {/* Indicador de grabación */}
            {isListening && (
              <motion.div
                className="absolute -top-1 -right-1 w-4 h-4 bg-red-400 rounded-full"
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
        </div>

        {/* Input de texto */}
        <div className="flex gap-3 items-end">
          <div className="flex-1">
            <input
              ref={inputRef}
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Escribe tu mensaje o usa el micrófono..."
              className="
                w-full px-4 py-3 rounded-2xl border border-gray-300 dark:border-gray-600
                focus:outline-none focus:ring-2 focus:border-transparent
                text-gray-800 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 bg-gray-50 dark:bg-gray-700
                transition-all duration-200
              "
              style={{ '--tw-ring-color': 'var(--primary-500)' } as React.CSSProperties}
              disabled={isListening}
            />
          </div>
          
          <motion.button
            onClick={handleSendMessage}
            disabled={!inputText.trim() || isListening}
            className={`
              p-3 rounded-2xl transition-all duration-200
              focus:outline-none focus:ring-2
              ${inputText.trim() && !isListening
                ? 'text-white shadow-md'
                : 'bg-gray-200 dark:bg-gray-600 text-gray-400 dark:text-gray-500 cursor-not-allowed'
              }
            `}
            style={inputText.trim() && !isListening ? {
              background: `linear-gradient(to bottom right, var(--primary-600), var(--primary-700))`,
              '--tw-ring-color': 'var(--primary-300)'
            } as React.CSSProperties : {
              '--tw-ring-color': 'var(--primary-300)'
            } as React.CSSProperties}
            whileHover={inputText.trim() && !isListening ? { scale: 1.05 } : {}}
            whileTap={inputText.trim() && !isListening ? { scale: 0.95 } : {}}
          >
            <Send className="w-5 h-5" />
          </motion.button>
        </div>
      </div>
    </div>
  );
};