import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ChatInterface } from '../components/ChatInterface';
import { Avatar } from '../components/Avatar';
import { useAssistant } from '../hooks/useAssistant';

interface HomePageProps {
  onOpenSettings?: () => void;
}

export const HomePage: React.FC<HomePageProps> = ({ onOpenSettings }) => {
  const [showAvatar, setShowAvatar] = useState(true);
  const { currentEmotion, isListening, isSpeaking, messages } = useAssistant();

  // Ocultar avatar cuando hay muchos mensajes para dar más espacio al chat
  const shouldShowAvatar = showAvatar && messages.length < 6;

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      {/* Layout principal optimizado para tablets */}
      <div className="flex-1 flex">
        {/* Panel del Avatar (lado izquierdo en tablets) */}
        {shouldShowAvatar && (
          <motion.div
            className="w-80 bg-white dark:bg-gray-800 shadow-lg border-r border-gray-200 dark:border-gray-700 flex flex-col"
            initial={{ x: -100, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -100, opacity: 0 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          >
            {/* Header del avatar */}
            <div className="p-6 border-b border-gray-200 dark:border-gray-700 text-center">
              <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-2">
                Asistente CECADE
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Tu guía en programación
              </p>
            </div>

            {/* Avatar principal */}
            <div className="flex-1 flex items-center justify-center">
              <Avatar
                emotion={currentEmotion}
                isListening={isListening}
                isSpeaking={isSpeaking}
              />
            </div>

            {/* Información del estado */}
            <div className="p-4 border-t border-gray-200 dark:border-gray-700">
              <div className="text-center">
                <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Estado actual</div>
                <div className="flex items-center justify-center gap-2">
                  <div className={`
                    w-3 h-3 rounded-full
                    ${isListening ? 'bg-red-500 animate-pulse' : 
                      isSpeaking ? 'bg-orange-500 animate-pulse' : 
                      'bg-green-500'}
                  `} />
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {isListening ? 'Escuchando...' : 
                     isSpeaking ? 'Hablando...' : 
                     'Listo para ayudar'}
                  </span>
                </div>
              </div>
            </div>

            {/* Botón para ocultar avatar */}
            <div className="p-4 border-t border-gray-200 dark:border-gray-700">
              <motion.button
                onClick={() => setShowAvatar(false)}
                className="
                  w-full py-2 px-4 text-sm text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white
                  border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700
                  transition-colors focus:outline-none focus:ring-2 focus:ring-blue-300
                "
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                Ocultar avatar
              </motion.button>
            </div>
          </motion.div>
        )}

        {/* Panel del Chat (lado derecho o pantalla completa) */}
        <div className="flex-1 flex flex-col">
          <ChatInterface onOpenSettings={onOpenSettings} />
        </div>
      </div>

      {/* Botón flotante para mostrar avatar cuando está oculto */}
      {!shouldShowAvatar && (
        <motion.button
          onClick={() => setShowAvatar(true)}
          className="
            fixed bottom-6 left-6 w-14 h-14 bg-blue-600 hover:bg-blue-700
            text-white rounded-full shadow-lg flex items-center justify-center
            focus:outline-none focus:ring-4 focus:ring-blue-300
            z-50
          "
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          title="Mostrar avatar"
        >
          <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center">
            <span className="text-blue-600 font-bold text-sm">C</span>
          </div>
        </motion.button>
      )}

      {/* Indicadores de estado en la parte inferior */}
      <div className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 px-4 py-2">
        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
          <div className="flex items-center gap-4">
            <span>CECADE - Especialidad en Programación</span>
            <span>•</span>
            <span>{messages.length} mensajes</span>
          </div>
          
          <div className="flex items-center gap-2">
            <div className={`
              w-2 h-2 rounded-full
              ${isListening ? 'bg-red-400' : 
                isSpeaking ? 'bg-orange-400' : 
                'bg-green-400'}
            `} />
            <span className="capitalize">
              {isListening ? 'Escuchando' : 
               isSpeaking ? 'Hablando' : 
               currentEmotion === 'neutral' ? 'Activo' : currentEmotion}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};