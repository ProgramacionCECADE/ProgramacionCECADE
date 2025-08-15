import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  GraduationCap, MapPin, Phone, Mail, 
  Globe, Facebook, Instagram, Linkedin
} from 'lucide-react';
import { ConfigService } from '../lib/configService';
import { SchoolInfo } from '../types';

interface InfoPageProps {
  onBack?: () => void;
}

export const InfoPage: React.FC<InfoPageProps> = ({ onBack }) => {
  const [schoolInfo, setSchoolInfo] = useState<SchoolInfo | null>(null);

  useEffect(() => {
    const info = ConfigService.getSchoolInfo();
    setSchoolInfo(info);
  }, []);

  if (!schoolInfo) {
    return (
      <div className="h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-300">Cargando información...</p>
        </div>
      </div>
    );
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <div className="h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 overflow-y-auto">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b dark:border-gray-700">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
                <GraduationCap className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Contacto - {schoolInfo.name}</h1>
                <p className="text-gray-600 dark:text-gray-300">{schoolInfo.specialty}</p>
              </div>
            </div>
            
            {onBack && (
              <motion.button
                onClick={onBack}
                className="
                  px-6 py-2 text-gray-600 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg
                  hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors
                  focus:outline-none focus:ring-2 focus:ring-blue-300
                "
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                Volver al Chat
              </motion.button>
            )}
          </div>
        </div>
      </div>

      {/* Contenido de Contacto */}
      <div className="max-w-4xl mx-auto p-6">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="space-y-8"
        >
          <motion.div variants={itemVariants} className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-800 dark:text-white mb-4">Contacto</h2>
            <p className="text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              ¿Interesado en formar parte de FLC/CECADE? Contáctanos para más información 
              sobre nuestros programas y proceso de admisión.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Información de contacto */}
            <motion.div
              variants={itemVariants}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6"
            >
              <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-6">Información de Contacto</h3>
              
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <MapPin className="w-5 h-5 text-blue-600" />
                  <span className="text-gray-600 dark:text-gray-300">{schoolInfo.contact.address}</span>
                </div>
                
                <div className="flex items-center gap-3">
                  <Phone className="w-5 h-5 text-blue-600" />
                  <span className="text-gray-600 dark:text-gray-300">{schoolInfo.contact.phone}</span>
                </div>
                
                <div className="flex items-center gap-3">
                  <Mail className="w-5 h-5 text-blue-600" />
                  <span className="text-gray-600 dark:text-gray-300">{schoolInfo.contact.email}</span>
                </div>
                

              </div>
            </motion.div>

            {/* Redes sociales */}
            <motion.div
              variants={itemVariants}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6"
            >
              <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-6">Síguenos</h3>
              
              <div className="space-y-4">
                <motion.div
                  className="flex items-center gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg cursor-pointer"
                  whileHover={{ scale: 1.02 }}
                >
                  <Facebook className="w-6 h-6 text-blue-600" />
                  <span className="text-gray-700 dark:text-gray-300">{schoolInfo.contact.socialMedia.facebook}</span>
                </motion.div>
                
                <motion.div
                  className="flex items-center gap-3 p-3 bg-pink-50 dark:bg-pink-900/20 rounded-lg cursor-pointer"
                  whileHover={{ scale: 1.02 }}
                >
                  <Instagram className="w-6 h-6 text-pink-600" />
                  <span className="text-gray-700 dark:text-gray-300">{schoolInfo.contact.socialMedia.instagram}</span>
                </motion.div>
                

              </div>
            </motion.div>
          </div>


        </motion.div>
      </div>
    </div>
  );
};