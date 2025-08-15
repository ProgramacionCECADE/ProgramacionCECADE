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
      {/* Navegación superior para tablets */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo y título */}
            <div className="flex items-center gap-3">
              <MiniAvatar emotion={currentEmotion} />
              <div className="hidden sm:block">
                <h1 className="text-xl font-bold text-gray-800 dark:text-white">CECADE Assistant</h1>
                <p className="text-sm text-gray-600 dark:text-gray-300">Especialidad en Programación</p>
              </div>
            </div>

            {/* Navegación desktop */}
            <div className="hidden md:flex items-center gap-1">
              {navigationItems.map((item) => {
                const Icon = item.icon;
                return (
                  <motion.button
                    key={item.id}
                    onClick={() => handlePageChange(item.id as any)}
                    className={`
                      flex items-center gap-2 px-4 py-2 rounded-lg transition-all
                      ${currentPage === item.id
                        ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 font-medium'
                        : 'text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700'
                      }
                    `}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="hidden lg:block">{item.label}</span>
                  </motion.button>
                );
              })}
            </div>

            {/* Botón de menú móvil */}
            <div className="md:hidden">
              <motion.button
                onClick={() => setShowMobileMenu(!showMobileMenu)}
                className="
                  p-2 rounded-lg text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700
                  focus:outline-none focus:ring-2 focus:ring-blue-500
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

        {/* Menú móvil */}
        <AnimatePresence>
          {showMobileMenu && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700"
            >
              <div className="px-4 py-2 space-y-1">
                {navigationItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <motion.button
                      key={item.id}
                      onClick={() => handlePageChange(item.id as any)}
                      className={`
                        w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all text-left
                        ${currentPage === item.id
                          ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 font-medium'
                          : 'text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700'
                        }
                      `}
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                    >
                      <Icon className="w-5 h-5" />
                      {item.label}
                    </motion.button>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Contenido principal */}
      <div className="h-[calc(100vh-4rem)] overflow-hidden">
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

      {/* Indicador de estado flotante para móviles */}
      <div className="md:hidden fixed bottom-4 right-4 z-50">
        <motion.div
          className="
            bg-white dark:bg-gray-800 rounded-full shadow-lg px-3 py-2 flex items-center gap-2
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