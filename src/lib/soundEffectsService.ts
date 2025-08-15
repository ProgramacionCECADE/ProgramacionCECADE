import { ConfigService } from './configService';

export class SoundEffectsService {
  private static audioContext: AudioContext | null = null;
  private static isSupported = typeof window !== 'undefined' && 'AudioContext' in window;

  /**
   * Inicializa el contexto de audio
   */
  private static getAudioContext(): AudioContext {
    if (!this.audioContext && this.isSupported) {
      this.audioContext = new AudioContext();
    }
    return this.audioContext!;
  }

  /**
   * Reproduce el efecto de sonido 'ba dum tss' típico de chistes
   */
  static async playDrumRoll(): Promise<void> {
    if (!this.isSupported) {
      console.warn('Web Audio API no está soportada en este navegador');
      return;
    }

    try {
      const config = await ConfigService.getConfig();
      if (!config.behavior.soundEffects) {
        return; // Efectos de sonido deshabilitados
      }

      const audioContext = this.getAudioContext();
      const now = audioContext.currentTime;

      // Ba (bombo)
      this.createDrumHit(audioContext, now, 60, 0.3, 0.1);
      
      // Dum (bombo más grave)
      this.createDrumHit(audioContext, now + 0.15, 45, 0.35, 0.12);
      
      // Tss (platillo)
      this.createCymbalHit(audioContext, now + 0.3, 0.25, 0.8);
      
    } catch (error) {
      console.error('Error reproduciendo efecto de tambor:', error);
    }
  }

  /**
   * Crea un golpe de bombo
   */
  private static createDrumHit(
    audioContext: AudioContext,
    startTime: number,
    frequency: number,
    volume: number,
    duration: number
  ): void {
    // Oscilador para el tono del bombo
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    const filter = audioContext.createBiquadFilter();

    // Configurar oscilador
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(frequency, startTime);
    oscillator.frequency.exponentialRampToValueAtTime(frequency * 0.3, startTime + duration);

    // Configurar filtro pasa-bajos
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(200, startTime);
    filter.Q.setValueAtTime(1, startTime);

    // Configurar envolvente de volumen
    gainNode.gain.setValueAtTime(0, startTime);
    gainNode.gain.linearRampToValueAtTime(volume, startTime + 0.01);
    gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

    // Conectar nodos
    oscillator.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(audioContext.destination);

    // Reproducir
    oscillator.start(startTime);
    oscillator.stop(startTime + duration);
  }

  /**
   * Crea un golpe de platillo
   */
  private static createCymbalHit(
    audioContext: AudioContext,
    startTime: number,
    volume: number,
    duration: number
  ): void {
    // Crear ruido blanco para simular platillo
    const bufferSize = audioContext.sampleRate * duration;
    const buffer = audioContext.createBuffer(1, bufferSize, audioContext.sampleRate);
    const data = buffer.getChannelData(0);

    // Generar ruido blanco
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * volume;
    }

    // Crear fuente de buffer
    const source = audioContext.createBufferSource();
    const gainNode = audioContext.createGain();
    const filter = audioContext.createBiquadFilter();

    source.buffer = buffer;

    // Configurar filtro pasa-altos para sonido de platillo
    filter.type = 'highpass';
    filter.frequency.setValueAtTime(8000, startTime);
    filter.Q.setValueAtTime(1, startTime);

    // Configurar envolvente de volumen
    gainNode.gain.setValueAtTime(volume, startTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

    // Conectar nodos
    source.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(audioContext.destination);

    // Reproducir
    source.start(startTime);
  }

  /**
   * Reproduce un efecto de sonido personalizado
   */
  static async playCustomSound(frequency: number, duration: number, volume: number = 0.3): Promise<void> {
    if (!this.isSupported) return;

    try {
      const audioContext = this.getAudioContext();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);

      gainNode.gain.setValueAtTime(0, audioContext.currentTime);
      gainNode.gain.linearRampToValueAtTime(volume, audioContext.currentTime + 0.01);
      gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + duration);

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.start();
      oscillator.stop(audioContext.currentTime + duration);
    } catch (error) {
      console.error('Error reproduciendo sonido personalizado:', error);
    }
  }

  /**
   * Detiene todos los sonidos
   */
  static stopAllSounds(): void {
    if (this.audioContext && this.audioContext.state !== 'closed') {
      // Crear un nuevo contexto para detener todos los sonidos
      this.audioContext.close();
      this.audioContext = null;
    }
  }
}