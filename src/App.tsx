import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, Settings, Info, Menu, X } from 'lucide-react';
import { HomePage } from './pages/HomePage';
import { ConfigPage } from './pages/ConfigPage';
import { InfoPage } from './pages/InfoPage';
import { MiniAvatar } from './components/Avatar';
import { useAssistant } from './hooks/useAssistant';
import { useTheme } from './hooks/useTheme';
import { ConfigService } from './lib/configService';

function App() {
  const [currentPage, setCurrentPage] = useState<'home' | 'config' | 'info'>('home');
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [isHeaderHovered, setIsHeaderHovered] = useState(false);
  const { currentEmotion } = useAssistant();
  const { theme, toggleTheme } = useTheme();

  // Sincronizar tema con la configuración
  useEffect(() => {
    const syncTheme = async () => {
      try {
        const config = await ConfigService.getConfig();
        if (config.theme.mode !== theme) {
          toggleTheme();
        }
      } catch (error) {
        console.error('Error syncing theme:', error);
      }
    };
    syncTheme();
  }, []);

  const navigationItems = [
    {
      id: 'home',
      label: 'Chat',
      icon: MessageCircle,
      component: HomePage
    },
    {
      id: 'config',
      label: 'Configuración',
      icon: Settings,
      component: ConfigPage
    },
    {
      id: 'info',
      label: 'Información',
      icon: Info,
      component: InfoPage
    }
  ];

  const handlePageChange = (pageId: 'home' | 'config' | 'info') => {
    setCurrentPage(pageId);
    setShowMobileMenu(false);
  };

  const CurrentPageComponent = navigationItems.find(item => item.id === currentPage)?.component || HomePage;

  return (
    <div className="h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 overflow-hidden">
      {/* Navegación superior optimizada para móviles */}
      <div 
        className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 transition-all duration-300"
        onMouseEnter={() => setIsHeaderHovered(true)}
        onMouseLeave={() => setIsHeaderHovered(false)}
      >
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14 sm:h-16">
            {/* Logo y título */}
            <div className="flex items-center gap-3">
              <MiniAvatar emotion={currentEmotion} />
              <div className="hidden sm:block">
                <h1 className="text-xl font-bold text-gray-800 dark:text-white">CECADE Assistant</h1>
                <p className="text-sm text-gray-600 dark:text-gray-300">Especialidad en Programación</p>
              </div>
            </div>

            {/* Navegación desktop mejorada */}
            <motion.div 
              className="hidden md:flex items-center gap-2"
              initial={{ opacity: 1 }}
              animate={{ 
                opacity: isHeaderHovered ? 1 : 0,
                x: isHeaderHovered ? 0 : 20,
                pointerEvents: isHeaderHovered ? 'auto' : 'none'
              }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              style={{ 
                visibility: isHeaderHovered ? 'visible' : 'hidden'
              }}
            >
              {navigationItems.map((item) => {
                const Icon = item.icon;
                return (
                  <motion.button
                    key={item.id}
                    onClick={() => handlePageChange(item.id as any)}
                    className={`
                      flex items-center gap-2 px-4 py-2 rounded-xl transition-all font-medium
                      ${currentPage === item.id
                        ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 border-2 border-blue-200 dark:border-blue-700 shadow-sm'
                        : 'text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 border-2 border-transparent'
                      }
                    `}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="hidden lg:block">{item.label}</span>
                    {currentPage === item.id && (
                      <div className="w-2 h-2 bg-blue-500 rounded-full ml-1" />
                    )}
                  </motion.button>
                );
              })}
            </motion.div>

            {/* Botón de menú móvil mejorado */}
            <div className="md:hidden">
              <motion.button
                onClick={() => setShowMobileMenu(!showMobileMenu)}
                className="
                  p-3 rounded-xl bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 
                  hover:bg-blue-100 dark:hover:bg-blue-900/50 border-2 border-blue-200 dark:border-blue-700
                  focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm
                  min-w-[48px] min-h-[48px] flex items-center justify-center
                "
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {showMobileMenu ? (
                  <X className="w-6 h-6" />
                ) : (
                  <Menu className="w-6 h-6" />
                )}
              </motion.button>
            </div>
          </div>
        </div>

        {/* Menú móvil mejorado */}
        <AnimatePresence>
          {showMobileMenu && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 shadow-lg"
            >
              <div className="px-3 py-3 space-y-2">
                {navigationItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <motion.button
                      key={item.id}
                      onClick={() => handlePageChange(item.id as any)}
                      className={`
                        w-full flex items-center gap-4 px-4 py-4 rounded-xl transition-all text-left
                        min-h-[56px] text-base font-medium
                        ${currentPage === item.id
                          ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 border-2 border-blue-200 dark:border-blue-700 shadow-sm'
                          : 'text-gray-700 dark:text-gray-200 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 border-2 border-transparent'
                        }
                      `}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Icon className="w-6 h-6 flex-shrink-0" />
                      <span className="text-left">{item.label}</span>
                      {currentPage === item.id && (
                        <div className="ml-auto w-2 h-2 bg-blue-500 rounded-full" />
                      )}
                    </motion.button>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Contenido principal */}
      <div className="h-[calc(100vh-3.5rem)] sm:h-[calc(100vh-4rem)] md:h-[calc(100vh-4rem)] overflow-hidden pb-16 md:pb-0">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentPage}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="h-full"
          >
            {currentPage === 'home' && (
              <HomePage onOpenSettings={() => handlePageChange('config')} />
            )}
            {currentPage === 'config' && (
              <ConfigPage onBack={() => handlePageChange('home')} />
            )}
            {currentPage === 'info' && (
              <InfoPage onBack={() => handlePageChange('home')} />
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Indicador de estado flotante para móviles - reposicionado */}
      <div className="md:hidden fixed top-16 right-3 z-40">
        <motion.div
          className="
            bg-white dark:bg-gray-800 rounded-full shadow-lg px-2 py-1 flex items-center gap-1
            border border-gray-200 dark:border-gray-700
          "
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <div className={`
            w-2 h-2 rounded-full
            ${currentEmotion === 'happy' ? 'bg-green-400' :
              currentEmotion === 'excited' ? 'bg-orange-400' :
              currentEmotion === 'thinking' ? 'bg-blue-400' :
              'bg-gray-400'
            }
          `} />
          <span className="text-xs font-medium text-gray-700 dark:text-gray-300 capitalize">
            {currentEmotion === 'neutral' ? 'Activo' : currentEmotion}
          </span>
        </motion.div>
      </div>

      {/* Barra de navegación inferior para móviles */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 z-50 shadow-lg">
        <div className="flex items-center justify-around py-2">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            return (
              <motion.button
                key={item.id}
                onClick={() => handlePageChange(item.id as any)}
                className={`
                  flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-all
                  min-w-[64px] min-h-[56px]
                  ${currentPage === item.id
                    ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                  }
                `}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Icon className={`w-6 h-6 ${currentPage === item.id ? 'scale-110' : ''} transition-transform`} />
                <span className={`text-xs font-medium ${currentPage === item.id ? 'font-semibold' : ''}`}>
                  {item.label}
                </span>
                {currentPage === item.id && (
                  <motion.div
                    className="w-1 h-1 bg-blue-500 rounded-full"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.1 }}
                  />
                )}
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Overlay para menú móvil */}
      <AnimatePresence>
        {showMobileMenu && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="md:hidden fixed inset-0 bg-black/20 z-40"
            onClick={() => setShowMobileMenu(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

export default App;