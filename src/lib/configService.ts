import { AssistantConfig, AppConfig, SchoolInfo } from '../types';
import configData from '../data/config.json';

const STORAGE_KEY = 'cecade_assistant_config';

export class ConfigService {
  private static defaultConfig = configData as any;

  /**
   * Obtiene la configuración actual (localStorage + defaults)
   */
  static async getConfig(): Promise<AssistantConfig> {
    try {
      const savedConfig = localStorage.getItem(STORAGE_KEY);
      if (savedConfig) {
        const parsed = JSON.parse(savedConfig) as Partial<AssistantConfig>;
        // Combinar con configuración por defecto para asegurar todas las propiedades
        return this.mergeWithDefaults(parsed);
      }
    } catch (error) {
      console.warn('Error loading saved config, using defaults:', error);
    }
    
    return this.defaultConfig.defaultConfig;
  }

  /**
   * Guarda la configuración en localStorage
   */
  static async saveConfig(config: AssistantConfig): Promise<void> {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
    } catch (error) {
      console.error('Error saving config:', error);
      throw new Error('No se pudo guardar la configuración');
    }
  }

  /**
   * Restaura la configuración por defecto
   */
  static async resetConfig(): Promise<AssistantConfig> {
    try {
      localStorage.removeItem(STORAGE_KEY);
      return this.defaultConfig.defaultConfig;
    } catch (error) {
      console.error('Error resetting config:', error);
      throw new Error('No se pudo restaurar la configuración');
    }
  }

  /**
   * Actualiza una parte específica de la configuración
   */
  static async updateConfig(updates: Partial<AssistantConfig>): Promise<AssistantConfig> {
    const currentConfig = await this.getConfig();
    const newConfig = {
      ...currentConfig,
      ...updates,
      voice: { ...currentConfig.voice, ...updates.voice },
      theme: { ...currentConfig.theme, ...updates.theme },
      behavior: { ...currentConfig.behavior, ...updates.behavior }
    };
    
    await this.saveConfig(newConfig);
    return newConfig;
  }

  /**
   * Obtiene la información del colegio
   */
  static getSchoolInfo(): SchoolInfo {
    const contactInfo = (this.defaultConfig as any).contact;
    return {
      name: "CECADE",
      specialty: "Centro de Emprendimiento Capacitación y Desarrollo Empresarial",
      description: "Institución educativa especializada en emprendimiento y desarrollo empresarial",
      technologies: ["JavaScript", "React", "Node.js", "Python", "Java"],
      contact: {
        address: contactInfo.address,
        phone: contactInfo.phone,
        email: contactInfo.email,
        website: "www.cecade.edu.gt",
        socialMedia: {
          facebook: contactInfo.socialMedia.facebook,
          instagram: contactInfo.socialMedia.instagram,
          linkedin: "linkedin.com/school/cecade"
        }
      }
    };
  }

  /**
   * Obtiene la configuración de voz
   */
  static async getVoiceConfig() {
    const config = await this.getConfig();
    return config.voice;
  }

  /**
   * Actualiza solo la configuración de voz
   */
  static async updateVoiceConfig(voiceConfig: Partial<AssistantConfig['voice']>): Promise<AssistantConfig> {
    return this.updateConfig({ voice: voiceConfig as AssistantConfig['voice'] });
  }

  /**
   * Obtiene la configuración del tema
   */
  static async getThemeConfig() {
    const config = await this.getConfig();
    return config.theme;
  }

  /**
   * Actualiza solo la configuración del tema
   */
  static async updateThemeConfig(themeConfig: Partial<AssistantConfig['theme']>): Promise<AssistantConfig> {
    return this.updateConfig({ theme: themeConfig as AssistantConfig['theme'] });
  }

  /**
   * Obtiene la configuración de comportamiento
   */
  static async getBehaviorConfig() {
    const config = await this.getConfig();
    return config.behavior;
  }

  /**
   * Actualiza solo la configuración de comportamiento
   */
  static async updateBehaviorConfig(behaviorConfig: Partial<AssistantConfig['behavior']>): Promise<AssistantConfig> {
    return this.updateConfig({ behavior: behaviorConfig as AssistantConfig['behavior'] });
  }

  /**
   * Valida que la configuración tenga todos los campos requeridos
   */
  private static mergeWithDefaults(config: Partial<AssistantConfig>): AssistantConfig {
    const defaults = this.defaultConfig.defaultConfig;
    
    return {
      voice: {
        rate: config.voice?.rate ?? defaults.voice.rate,
        pitch: config.voice?.pitch ?? defaults.voice.pitch,
        volume: config.voice?.volume ?? defaults.voice.volume,
        voiceIndex: config.voice?.voiceIndex ?? defaults.voice.voiceIndex
      },
      theme: {
        mode: config.theme?.mode ?? defaults.theme.mode,
        primaryColor: config.theme?.primaryColor ?? defaults.theme.primaryColor,
        avatarStyle: config.theme?.avatarStyle ?? defaults.theme.avatarStyle
      },
      behavior: {
        autoSpeak: config.behavior?.autoSpeak ?? defaults.behavior.autoSpeak,
        micSensitivity: config.behavior?.micSensitivity ?? defaults.behavior.micSensitivity,
        responseDelay: config.behavior?.responseDelay ?? defaults.behavior.responseDelay,
        soundEffects: config.behavior?.soundEffects ?? defaults.behavior.soundEffects
      }
    };
  }

  /**
   * Exporta la configuración actual como JSON
   */
  static async exportConfig(): Promise<string> {
    const config = await this.getConfig();
    return JSON.stringify(config, null, 2);
  }

  /**
   * Importa configuración desde JSON
   */
  static async importConfig(configJson: string): Promise<AssistantConfig> {
    try {
      const config = JSON.parse(configJson) as Partial<AssistantConfig>;
      const validatedConfig = this.mergeWithDefaults(config);
      await this.saveConfig(validatedConfig);
      return validatedConfig;
    } catch (error) {
      console.error('Error importing config:', error);
      throw new Error('Formato de configuración inválido');
    }
  }

  /**
   * Verifica si hay configuración guardada
   */
  static hasStoredConfig(): boolean {
    return localStorage.getItem(STORAGE_KEY) !== null;
  }

  /**
   * Obtiene información sobre el almacenamiento
   */
  static getStorageInfo() {
    const hasStored = this.hasStoredConfig();
    let size = 0;
    
    if (hasStored) {
      const config = localStorage.getItem(STORAGE_KEY);
      size = config ? new Blob([config]).size : 0;
    }
    
    return {
      hasStoredConfig: hasStored,
      storageSize: size,
      storageKey: STORAGE_KEY
    };
  }
}