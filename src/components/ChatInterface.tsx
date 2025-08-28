import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Trash2, Settings, Mic, MicOff, Brain, BarChart3 } from 'lucide-react';
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
  const [showAIInsights, setShowAIInsights] = useState(false);
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
    error,
    aiAnalysis,
    contextSummary,
    isProcessingAI
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
          {/* Botón de insights de IA */}
          <motion.button
            onClick={() => setShowAIInsights(!showAIInsights)}
            className={`
              p-2 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-300
              ${showAIInsights 
                ? 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400' 
                : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300'
              }
            `}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            title="Insights de IA"
          >
            <Brain className="w-5 h-5" />
          </motion.button>

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

      {/* Panel de insights de IA */}
      <AnimatePresence>
        {showAIInsights && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-gray-800 dark:to-gray-700 border-b dark:border-gray-600 p-4"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Análisis de IA */}
              <div className="bg-white dark:bg-gray-800 rounded-lg p-3 shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                  <BarChart3 className="w-4 h-4 text-blue-600" />
                  <h3 className="font-semibold text-sm text-gray-800 dark:text-white">Análisis de IA</h3>
                </div>
                {aiAnalysis ? (
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-300">Sentimiento:</span>
                      <span className={`font-medium ${
                        aiAnalysis.sentiment === 'positive' ? 'text-green-600' :
                        aiAnalysis.sentiment === 'negative' ? 'text-red-600' :
                        'text-gray-600'
                      }`}>
                        {aiAnalysis.sentiment === 'positive' ? '😊 Positivo' :
                         aiAnalysis.sentiment === 'negative' ? '😔 Negativo' :
                         '😐 Neutral'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-300">Confianza:</span>
                      <span className="font-medium text-blue-600">{Math.round(aiAnalysis.confidence * 100)}%</span>
                    </div>
                    {aiAnalysis.keywords && aiAnalysis.keywords.length > 0 && (
                      <div>
                        <span className="text-gray-600 dark:text-gray-300">Temas:</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {aiAnalysis.keywords?.slice(0, 3).map((topic, index) => (
                            <span key={index} className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-full text-xs">
                              {topic}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-xs text-gray-500 dark:text-gray-400">Envía un mensaje para ver el análisis</p>
                )}
              </div>

              {/* Contexto conversacional */}
              <div className="bg-white dark:bg-gray-800 rounded-lg p-3 shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                  <Brain className="w-4 h-4 text-purple-600" />
                  <h3 className="font-semibold text-sm text-gray-800 dark:text-white">Contexto</h3>
                </div>
                {contextSummary ? (
                  <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
                    {contextSummary}
                  </p>
                ) : (
                  <p className="text-xs text-gray-500 dark:text-gray-400">Inicia una conversación para generar contexto</p>
                )}
              </div>
            </div>

            {/* Indicador de procesamiento */}
            {isProcessingAI && (
              <div className="mt-3 flex items-center gap-2 text-xs text-blue-600 dark:text-blue-400">
                <motion.div
                  className="w-3 h-3 bg-blue-600 rounded-full"
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 1, repeat: Infinity }}
                />
                <span>Procesando con IA...</span>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

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
          
          {(isTyping || isProcessingAI) && <TypingIndicator />}
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