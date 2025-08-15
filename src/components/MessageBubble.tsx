import React from 'react';
import { motion } from 'framer-motion';
import { Volume2, User, Bot } from 'lucide-react';
import { MessageBubbleProps } from '../types';

export const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  onPlayAudio
}) => {
  const isUser = message.type === 'user';
  const isAssistant = message.type === 'assistant';

  const formatTime = (date: Date) => {
    return new Intl.DateTimeFormat('es-ES', {
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const handlePlayAudio = () => {
    if (onPlayAudio && isAssistant) {
      onPlayAudio(message.content);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className={`
        flex w-full mb-4
        ${isUser ? 'justify-end' : 'justify-start'}
      `}
    >
      <div className={`
        flex max-w-[80%] md:max-w-[70%]
        ${isUser ? 'flex-row-reverse' : 'flex-row'}
        gap-3 items-end
      `}>
        {/* Avatar */}
        <div className={`
          flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center
          ${isUser 
            ? 'bg-blue-600 text-white' 
            : 'bg-gradient-to-br from-blue-500 to-purple-600 text-white'
          }
          shadow-md
        `}>
          {isUser ? (
            <User className="w-5 h-5" />
          ) : (
            <Bot className="w-5 h-5" />
          )}
        </div>

        {/* Mensaje */}
        <div className={`
          relative px-4 py-3 rounded-2xl shadow-md
          ${isUser 
            ? 'bg-blue-600 text-white rounded-br-md' 
            : 'bg-white dark:bg-gray-700 text-gray-800 dark:text-white rounded-bl-md border border-gray-200 dark:border-gray-600'
          }
          max-w-full break-words
        `}>
          {/* Contenido del mensaje */}
          <div className="text-sm md:text-base leading-relaxed">
            {message.content}
          </div>

          {/* Timestamp y controles */}
          <div className={`
            flex items-center justify-between mt-2 pt-2
            ${isUser ? 'border-t border-blue-500' : 'border-t border-gray-200 dark:border-gray-600'}
            gap-2
          `}>
            <span className={`
              text-xs
              ${isUser ? 'text-blue-100' : 'text-gray-500 dark:text-gray-400'}
            `}>
              {formatTime(message.timestamp)}
            </span>

            {/* Botón de reproducir audio para mensajes del asistente */}
            {isAssistant && onPlayAudio && (
              <motion.button
                onClick={handlePlayAudio}
                className="
                  p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors
                  focus:outline-none focus:ring-2 focus:ring-blue-300
                "
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                title="Reproducir mensaje"
              >
                <Volume2 className="w-4 h-4 text-gray-600 dark:text-gray-300" />
              </motion.button>
            )}
          </div>

          {/* Cola de la burbuja */}
          <div className={`
            absolute bottom-0 w-4 h-4
            ${isUser 
              ? 'right-0 translate-x-2 bg-blue-600' 
              : 'left-0 -translate-x-2 bg-white dark:bg-gray-700 border-l border-b border-gray-200 dark:border-gray-600'
            }
            transform rotate-45
          `} />
        </div>
      </div>
    </motion.div>
  );
};

// Componente para mostrar indicador de escritura
export const TypingIndicator: React.FC = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="flex justify-start w-full mb-4"
    >
      <div className="flex gap-3 items-end max-w-[80%] md:max-w-[70%]">
        {/* Avatar del asistente */}
        <div className="
          flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center
          bg-gradient-to-br from-blue-500 to-purple-600 text-white shadow-md
        ">
          <Bot className="w-5 h-5" />
        </div>

        {/* Indicador de escritura */}
        <div className="
          relative px-4 py-3 rounded-2xl rounded-bl-md
          bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 shadow-md
        ">
          <div className="flex items-center gap-1">
            <span className="text-sm text-gray-600 dark:text-gray-300 mr-2">Escribiendo</span>
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className="w-2 h-2 bg-gray-400 rounded-full"
                animate={{
                  y: [0, -8, 0],
                  opacity: [0.5, 1, 0.5]
                }}
                transition={{
                  duration: 1.2,
                  repeat: Infinity,
                  delay: i * 0.2,
                  ease: 'easeInOut'
                }}
              />
            ))}
          </div>

          {/* Cola de la burbuja */}
          <div className="
            absolute bottom-0 left-0 -translate-x-2 w-4 h-4
            bg-white dark:bg-gray-700 border-l border-b border-gray-200 dark:border-gray-600
            transform rotate-45
          " />
        </div>
      </div>
    </motion.div>
  );
};

// Componente para mensajes del sistema
export const SystemMessage: React.FC<{ content: string }> = ({ content }) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex justify-center w-full mb-4"
    >
      <div className="
        px-4 py-2 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300
        text-sm font-medium border border-gray-200 dark:border-gray-600
      ">
        {content}
      </div>
    </motion.div>
  );
};