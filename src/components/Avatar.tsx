import React from 'react';
import { motion } from 'framer-motion';
import { AvatarProps } from '../types';

export const Avatar: React.FC<AvatarProps> = ({
  emotion,
  isListening,
  isSpeaking
}) => {
  // Configuraciones de animación basadas en la emoción
  const getEmotionConfig = () => {
    switch (emotion) {
      case 'happy':
        return {
          eyeScale: 0.9,
          mouthCurve: 20,
          color: '#10B981', // Verde
          bounce: true
        };
      case 'excited':
        return {
          eyeScale: 1.1,
          mouthCurve: 25,
          color: '#F59E0B', // Naranja
          bounce: true
        };
      case 'thinking':
        return {
          eyeScale: 0.8,
          mouthCurve: -5,
          color: '#6366F1', // Índigo
          bounce: false
        };
      case 'neutral':
      default:
        return {
          eyeScale: 1,
          mouthCurve: 0,
          color: '#1E3A8A', // Azul CECADE
          bounce: false
        };
    }
  };

  const config = getEmotionConfig();

  // Animaciones para diferentes estados
  const getStateAnimation = () => {
    if (isListening) {
      return {
        scale: [1, 1.05, 1],
        rotate: [0, 2, -2, 0],
        transition: {
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut" as const
        }
      };
    }
    
    if (isSpeaking) {
      return {
        scale: [1, 1.02, 1],
        y: [0, -2, 0],
        transition: {
          duration: 0.8,
          repeat: Infinity,
          ease: "easeInOut" as const
        }
      };
    }
    
    if (config.bounce) {
      return {
        y: [0, -5, 0],
        transition: {
          duration: 1.5,
          repeat: Infinity,
          ease: "easeInOut" as const
        }
      };
    }
    
    return {};
  };

  return (
    <div className="flex items-center justify-center p-8">
      <motion.div
        className="relative"
        animate={getStateAnimation()}
      >
        {/* Círculo de fondo con gradiente */}
        <motion.div
          className="w-32 h-32 rounded-full relative overflow-hidden shadow-2xl"
          style={{
            background: `linear-gradient(135deg, ${config.color}, ${config.color}dd)`
          }}
          animate={{
            boxShadow: isListening 
              ? [`0 0 0 0 ${config.color}40`, `0 0 0 20px ${config.color}00`]
              : `0 10px 30px ${config.color}30`
          }}
          transition={{
            boxShadow: {
              duration: 1.5,
              repeat: isListening ? Infinity : 0
            }
          }}
        >
          {/* Cara del avatar */}
          <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
            {/* Ojos */}
            <div className="flex gap-4 mb-2">
              <motion.div
                className="w-3 h-3 bg-white rounded-full"
                animate={{
                  scaleY: config.eyeScale,
                  scaleX: isListening ? [1, 0.8, 1] : 1
                }}
                transition={{
                  scaleX: {
                    duration: 0.3,
                    repeat: isListening ? Infinity : 0
                  }
                }}
              />
              <motion.div
                className="w-3 h-3 bg-white rounded-full"
                animate={{
                  scaleY: config.eyeScale,
                  scaleX: isListening ? [1, 0.8, 1] : 1
                }}
                transition={{
                  scaleX: {
                    duration: 0.3,
                    repeat: isListening ? Infinity : 0,
                    delay: 0.1
                  }
                }}
              />
            </div>
            
            {/* Boca */}
            <motion.div
              className="relative"
              animate={{
                scale: isSpeaking ? [1, 1.2, 1] : 1
              }}
              transition={{
                duration: 0.5,
                repeat: isSpeaking ? Infinity : 0
              }}
            >
              <svg width="20" height="12" viewBox="0 0 20 12">
                <motion.path
                  d={`M 2 6 Q 10 ${6 + config.mouthCurve} 18 6`}
                  stroke="white"
                  strokeWidth="2"
                  fill="none"
                  strokeLinecap="round"
                  animate={{
                    d: isSpeaking 
                      ? [
                          `M 2 6 Q 10 ${6 + config.mouthCurve} 18 6`,
                          `M 2 6 Q 10 ${6 + config.mouthCurve + 5} 18 6`,
                          `M 2 6 Q 10 ${6 + config.mouthCurve} 18 6`
                        ]
                      : `M 2 6 Q 10 ${6 + config.mouthCurve} 18 6`
                  }}
                  transition={{
                    duration: 0.5,
                    repeat: isSpeaking ? Infinity : 0
                  }}
                />
              </svg>
            </motion.div>
          </div>

          {/* Efectos de partículas para estados especiales */}
          {(emotion === 'excited' || emotion === 'happy') && (
            <div className="absolute inset-0">
              {[...Array(6)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute w-1 h-1 bg-white rounded-full opacity-70"
                  style={{
                    left: `${20 + i * 10}%`,
                    top: `${30 + (i % 2) * 20}%`
                  }}
                  animate={{
                    scale: [0, 1, 0],
                    opacity: [0, 1, 0],
                    y: [0, -10, -20]
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    delay: i * 0.3,
                    ease: "easeOut" as const
                  }}
                />
              ))}
            </div>
          )}
        </motion.div>

        {/* Indicador de estado */}
        <motion.div
          className="absolute -bottom-2 left-1/2 transform -translate-x-1/2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          {isListening && (
            <div className="flex items-center gap-1 bg-red-500 text-white px-2 py-1 rounded-full text-xs font-medium">
              <motion.div
                className="w-2 h-2 bg-white rounded-full"
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 1, repeat: Infinity }}
              />
              Escuchando
            </div>
          )}
          
          {isSpeaking && (
            <div className="flex items-center gap-1 bg-orange-500 text-white px-2 py-1 rounded-full text-xs font-medium">
              <div className="flex gap-0.5">
                {[0, 1, 2].map((i) => (
                  <motion.div
                    key={i}
                    className="w-0.5 h-3 bg-white rounded-full"
                    animate={{
                      scaleY: [0.3, 1, 0.3]
                    }}
                    transition={{
                      duration: 0.8,
                      repeat: Infinity,
                      delay: i * 0.1
                    }}
                  />
                ))}
              </div>
              Hablando
            </div>
          )}
          

        </motion.div>
      </motion.div>
    </div>
  );
};

// Componente simplificado para usar en espacios pequeños
export const MiniAvatar: React.FC<Pick<AvatarProps, 'emotion'>> = ({ emotion }) => {
  const config = {
    happy: '#10B981',
    excited: '#F59E0B',
    thinking: '#6366F1',
    neutral: '#1E3A8A'
  };

  return (
    <motion.div
      className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold"
      style={{ backgroundColor: config[emotion] }}
      animate={{
        scale: [1, 1.1, 1]
      }}
      transition={{
        duration: 2,
        repeat: Infinity,
        ease: "easeInOut" as const
      }}
    >
      C
    </motion.div>
  );
};