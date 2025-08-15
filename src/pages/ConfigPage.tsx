import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Volume2, Mic, Palette, Settings, Save, RotateCcw, 
  Moon, Sun, Sliders, TestTube 
} from 'lucide-react';
import { ConfigService } from '../lib/configService';
import { AssistantConfig } from '../types';
import { useSpeechSynthesis } from '../hooks/useSpeechSynthesis';
import { useTheme } from '../hooks/useTheme';

interface ConfigPageProps {
  onBack?: () => void;
}

export const ConfigPage: React.FC<ConfigPageProps> = ({ onBack }) => {
  const [config, setConfig] = useState<AssistantConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testMessage, setTestMessage] = useState('');
  
  const { speak, selectedVoice } = useSpeechSynthesis();
  const { theme, primaryColor, toggleTheme, updatePrimaryColor } = useTheme();

  // Cargar configuración inicial
  useEffect(() => {
    const loadConfig = async () => {
      try {
        const currentConfig = await ConfigService.getConfig();
        setConfig(currentConfig);
      } catch (error) {
        console.error('Error loading config:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadConfig();
  }, []);

  const handleConfigChange = (section: keyof AssistantConfig, key: string, value: any) => {
    if (!config) return;
    
    setConfig({
      ...config,
      [section]: {
        ...config[section],
        [key]: value
      }
    });
    
    // Si se cambia el modo del tema, actualizar el hook useTheme
    if (section === 'theme' && key === 'mode' && value !== theme) {
      toggleTheme();
    }
    
    // Si se cambia el color primario, actualizar el hook useTheme
    if (section === 'theme' && key === 'primaryColor') {
      updatePrimaryColor(value);
    }
  };

  const handleSaveConfig = async () => {
    if (!config) return;
    
    setSaving(true);
    try {
      await ConfigService.saveConfig(config);
      // Mostrar notificación de éxito
    } catch (error) {
      console.error('Error saving config:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleResetConfig = async () => {
    try {
      const defaultConfig = await ConfigService.resetConfig();
      setConfig(defaultConfig);
    } catch (error) {
      console.error('Error resetting config:', error);
    }
  };

  const handleTestVoice = () => {
    const message = testMessage || 'Hola, soy el asistente virtual de CECADE. Esta es una prueba de voz.';
    if (config) {
      speak(message, {
        volume: config.voice.volume,
        rate: config.voice.rate,
        pitch: config.voice.pitch
      });
    }
  };



  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Cargando configuración...</p>
        </div>
      </div>
    );
  }

  if (!config) {
    return (
      <div className="h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <p className="text-red-600">Error al cargar la configuración</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b dark:border-gray-700">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Settings className="w-6 h-6 text-blue-600" />
              <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Configuración</h1>
            </div>
            
            <div className="flex items-center gap-3">
              <motion.button
                onClick={handleResetConfig}
                className="
                  px-4 py-2 text-gray-600 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg
                  hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center gap-2
                  focus:outline-none focus:ring-2 focus:ring-blue-300
                "
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <RotateCcw className="w-4 h-4" />
                Restaurar
              </motion.button>
              
              <motion.button
                onClick={handleSaveConfig}
                disabled={saving}
                className="
                  px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg
                  transition-colors flex items-center gap-2
                  disabled:opacity-50 disabled:cursor-not-allowed
                  focus:outline-none focus:ring-2 focus:ring-blue-300
                "
                whileHover={!saving ? { scale: 1.02 } : {}}
                whileTap={!saving ? { scale: 0.98 } : {}}
              >
                <Save className="w-4 h-4" />
                {saving ? 'Guardando...' : 'Guardar'}
              </motion.button>
              
              {onBack && (
                <motion.button
                  onClick={onBack}
                  className="
                    px-4 py-2 text-gray-600 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg
                    hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors
                    focus:outline-none focus:ring-2 focus:ring-blue-300
                  "
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Volver
                </motion.button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Contenido */}
      <div className="max-w-4xl mx-auto p-4 sm:p-6 pb-20 sm:pb-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          {/* Configuración de Voz */}
          <motion.div
            className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4 sm:p-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <div className="flex items-center gap-3 mb-6">
              <Volume2 className="w-6 h-6 text-blue-600" />
              <h2 className="text-xl font-bold text-gray-800 dark:text-white">Configuración de Voz</h2>
            </div>
            
            <div className="space-y-6">
              {/* Información de la voz configurada */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Voz del asistente
                </label>
                
                {/* Información sobre la voz configurada */}
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center gap-2 mb-3">
                    <Volume2 className="w-5 h-5 text-blue-600" />
                    <span className="text-base font-medium text-blue-800">Voz Configurada</span>
                  </div>
                  <p className="text-sm text-blue-700 mb-2">
                    <strong>Microsoft Andres Online (Natural) - Spanish (Guatemala) (es-GT)</strong>
                  </p>
                  <p className="text-xs text-blue-600 mb-3">
                    Voz masculina natural de Guatemala - Optimizada para CECADE
                  </p>
                  {selectedVoice && (
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${
                        selectedVoice.name.includes('Microsoft Andres Online (Natural)') && selectedVoice.lang === 'es-GT' 
                          ? 'bg-green-500' 
                          : 'bg-orange-500'
                      }`} />
                      <p className="text-xs text-gray-700">
                        <strong>Estado:</strong> {selectedVoice.name} ({selectedVoice.lang})
                        {selectedVoice.name.includes('Microsoft Andres Online (Natural)') && selectedVoice.lang === 'es-GT' ? (
                          <span className="ml-2 text-green-600 font-medium">✓ Configurada correctamente</span>
                        ) : (
                          <span className="ml-2 text-orange-600 font-medium">⚠️ Usando voz alternativa</span>
                        )}
                      </p>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Volumen */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Volumen: {Math.round(config.voice.volume * 100)}%
                </label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={config.voice.volume}
                  onChange={(e) => handleConfigChange('voice', 'volume', parseFloat(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                />
              </div>
              
              {/* Velocidad */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Velocidad: {config.voice.rate}x
                </label>
                <input
                  type="range"
                  min="0.5"
                  max="2"
                  step="0.1"
                  value={config.voice.rate}
                  onChange={(e) => handleConfigChange('voice', 'rate', parseFloat(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                />
              </div>
              
              {/* Tono */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Tono: {config.voice.pitch}
                </label>
                <input
                  type="range"
                  min="0"
                  max="2"
                  step="0.1"
                  value={config.voice.pitch}
                  onChange={(e) => handleConfigChange('voice', 'pitch', parseFloat(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                />
              </div>
              
              {/* Prueba de voz */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Probar voz
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={testMessage}
                    onChange={(e) => setTestMessage(e.target.value)}
                    placeholder="Mensaje de prueba..."
                    className="
                      flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
                      bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                      focus:outline-none focus:ring-2 focus:ring-blue-500
                    "
                  />
                  <motion.button
                    onClick={handleTestVoice}
                    className="
                      px-4 py-2 bg-blue-600 text-white rounded-lg
                      hover:bg-blue-700 transition-colors flex items-center gap-2
                      focus:outline-none focus:ring-2 focus:ring-blue-300
                    "
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <TestTube className="w-4 h-4" />
                    Probar
                  </motion.button>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Configuración de Tema */}
          <motion.div
            className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4 sm:p-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className="flex items-center gap-3 mb-6">
              <Palette className="w-6 h-6 text-blue-600" />
              <h2 className="text-xl font-bold text-gray-800 dark:text-white">Configuración de Tema</h2>
            </div>
            
            <div className="space-y-6">
              {/* Modo oscuro/claro */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Modo de visualización
                </label>
                <div className="flex gap-3">
                  <motion.button
                    onClick={() => handleConfigChange('theme', 'mode', 'light')}
                    className={`
                      flex-1 p-3 rounded-lg border-2 transition-all
                      flex items-center justify-center gap-2
                      ${config.theme.mode === 'light'
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500 text-gray-700 dark:text-gray-300'
                      }
                    `}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Sun className="w-5 h-5" />
                    Claro
                  </motion.button>
                  
                  <motion.button
                    onClick={() => handleConfigChange('theme', 'mode', 'dark')}
                    className={`
                      flex-1 p-3 rounded-lg border-2 transition-all
                      flex items-center justify-center gap-2
                      ${config.theme.mode === 'dark'
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                        : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500 text-gray-700 dark:text-gray-300'
                      }
                    `}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Moon className="w-5 h-5" />
                    Oscuro
                  </motion.button>
                </div>
              </div>
              
              {/* Color primario */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Color principal
                </label>
                <div className="grid grid-cols-4 gap-3">
                  {[
                    { name: 'CECADE Azul', color: '#1E3A8A' },
                    { name: 'Verde', color: '#10B981' },
                    { name: 'Púrpura', color: '#8B5CF6' },
                    { name: 'Naranja', color: '#F59E0B' }
                  ].map((colorOption) => (
                    <motion.button
                      key={colorOption.color}
                      onClick={() => handleConfigChange('theme', 'primaryColor', colorOption.color)}
                      className={`
                        w-full h-12 rounded-lg border-2 transition-all
                        ${config.theme.primaryColor === colorOption.color
                          ? 'border-gray-800 scale-110'
                          : 'border-gray-300 hover:border-gray-400'
                        }
                      `}
                      style={{ backgroundColor: colorOption.color }}
                      whileHover={{ scale: config.theme.primaryColor === colorOption.color ? 1.1 : 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      title={colorOption.name}
                    />
                  ))}
                </div>
              </div>
              
              {/* Estilo del avatar */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Estilo del avatar
                </label>
                <select
                  value={config.theme.avatarStyle}
                  onChange={(e) => handleConfigChange('theme', 'avatarStyle', e.target.value)}
                  className="
                    w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
                    bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                    focus:outline-none focus:ring-2 focus:ring-blue-500
                  "
                >
                  <option value="friendly">Amigable</option>
                  <option value="professional">Profesional</option>
                  <option value="playful">Divertido</option>
                </select>
              </div>
            </div>
          </motion.div>

          {/* Configuración de Comportamiento */}
          <motion.div
            className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4 sm:p-6 lg:col-span-2"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <div className="flex items-center gap-3 mb-6">
              <Sliders className="w-6 h-6 text-blue-600" />
              <h2 className="text-xl font-bold text-gray-800 dark:text-white">Configuración de Comportamiento</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Reproducción automática */}
              <div>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.behavior.autoSpeak}
                    onChange={(e) => handleConfigChange('behavior', 'autoSpeak', e.target.checked)}
                    className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                  />
                  <div>
                    <div className="font-medium text-gray-700 dark:text-gray-300">Reproducción automática</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">Reproducir respuestas automáticamente</div>
                  </div>
                </label>
              </div>
              
              {/* Efectos de sonido */}
              <div>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.behavior.soundEffects}
                    onChange={(e) => handleConfigChange('behavior', 'soundEffects', e.target.checked)}
                    className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                  />
                  <div>
                    <div className="font-medium text-gray-700 dark:text-gray-300">Efectos de sonido</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">Reproducir efectos en chistes</div>
                  </div>
                </label>
              </div>
              
              {/* Sensibilidad del micrófono */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Sensibilidad del micrófono: {Math.round(config.behavior.micSensitivity * 100)}%
                </label>
                <input
                  type="range"
                  min="0.1"
                  max="1"
                  step="0.1"
                  value={config.behavior.micSensitivity}
                  onChange={(e) => handleConfigChange('behavior', 'micSensitivity', parseFloat(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                />
              </div>
              
              {/* Retraso de respuesta */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Retraso de respuesta: {config.behavior.responseDelay}ms
                </label>
                <input
                  type="range"
                  min="0"
                  max="2000"
                  step="100"
                  value={config.behavior.responseDelay}
                  onChange={(e) => handleConfigChange('behavior', 'responseDelay', parseInt(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                />
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};