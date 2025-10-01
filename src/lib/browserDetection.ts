/**
 * Utilidades para detectar el sistema operativo y navegador
 * Específicamente útil para manejar problemas de compatibilidad con SpeechRecognition
 */

export interface BrowserInfo {
  name: string;
  version: string;
  isChrome: boolean;
  isEdge: boolean;
  isFirefox: boolean;
  isSafari: boolean;
}

export interface SystemInfo {
  os: string;
  isLinux: boolean;
  isWindows: boolean;
  isMac: boolean;
  isAndroid: boolean;
  isIOS: boolean;
}

export interface CompatibilityInfo {
  speechRecognitionSupported: boolean;
  hasKnownIssues: boolean;
  recommendedBrowser: string;
  issueDescription: string;
}

/**
 * Detecta información del navegador
 */
export const detectBrowser = (): BrowserInfo => {
  const userAgent = navigator.userAgent;
  
  let name = 'Unknown';
  let version = 'Unknown';
  let isChrome = false;
  let isEdge = false;
  let isFirefox = false;
  let isSafari = false;

  // Detectar Edge
  if (userAgent.includes('Edg/')) {
    name = 'Microsoft Edge';
    isEdge = true;
    const match = userAgent.match(/Edg\/([0-9.]+)/);
    if (match) version = match[1];
  }
  // Detectar Chrome (debe ir después de Edge porque Edge incluye "Chrome" en su userAgent)
  else if (userAgent.includes('Chrome/') && !userAgent.includes('Edg/')) {
    name = 'Google Chrome';
    isChrome = true;
    const match = userAgent.match(/Chrome\/([0-9.]+)/);
    if (match) version = match[1];
  }
  // Detectar Firefox
  else if (userAgent.includes('Firefox/')) {
    name = 'Mozilla Firefox';
    isFirefox = true;
    const match = userAgent.match(/Firefox\/([0-9.]+)/);
    if (match) version = match[1];
  }
  // Detectar Safari
  else if (userAgent.includes('Safari/') && !userAgent.includes('Chrome/')) {
    name = 'Safari';
    isSafari = true;
    const match = userAgent.match(/Version\/([0-9.]+)/);
    if (match) version = match[1];
  }

  return {
    name,
    version,
    isChrome,
    isEdge,
    isFirefox,
    isSafari
  };
};

/**
 * Detecta información del sistema operativo
 */
export const detectSystem = (): SystemInfo => {
  const userAgent = navigator.userAgent;
  const platform = navigator.platform;
  
  let os = 'Unknown';
  let isLinux = false;
  let isWindows = false;
  let isMac = false;
  let isAndroid = false;
  let isIOS = false;

  // Detectar sistema operativo
  if (userAgent.includes('Linux') || platform.includes('Linux')) {
    os = 'Linux';
    isLinux = true;
  } else if (userAgent.includes('Windows') || platform.includes('Win')) {
    os = 'Windows';
    isWindows = true;
  } else if (userAgent.includes('Mac') || platform.includes('Mac')) {
    os = 'macOS';
    isMac = true;
  } else if (userAgent.includes('Android')) {
    os = 'Android';
    isAndroid = true;
  } else if (userAgent.includes('iPhone') || userAgent.includes('iPad')) {
    os = 'iOS';
    isIOS = true;
  }

  return {
    os,
    isLinux,
    isWindows,
    isMac,
    isAndroid,
    isIOS
  };
};

/**
 * Evalúa la compatibilidad del reconocimiento de voz
 */
export const evaluateSpeechRecognitionCompatibility = (): CompatibilityInfo => {
  const browser = detectBrowser();
  const system = detectSystem();
  
  const speechRecognitionSupported = typeof window !== 'undefined' && 
    ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);

  let hasKnownIssues = false;
  let recommendedBrowser = 'Google Chrome';
  let issueDescription = '';

  // Problemas conocidos específicos
  if (system.isLinux && browser.isEdge) {
    hasKnownIssues = true;
    recommendedBrowser = 'Google Chrome';
    issueDescription = 'Microsoft Edge en Linux tiene problemas conocidos con el reconocimiento de voz que causan errores de red. Se recomienda usar Google Chrome para una mejor experiencia.';
  } else if (system.isLinux && browser.isFirefox) {
    hasKnownIssues = true;
    recommendedBrowser = 'Google Chrome';
    issueDescription = 'Firefox en Linux no soporta completamente la API de reconocimiento de voz. Se recomienda usar Google Chrome.';
  } else if (browser.isSafari) {
    hasKnownIssues = true;
    recommendedBrowser = 'Google Chrome';
    issueDescription = 'Safari tiene soporte limitado para el reconocimiento de voz. Se recomienda usar Google Chrome o Microsoft Edge.';
  } else if (!speechRecognitionSupported) {
    hasKnownIssues = true;
    recommendedBrowser = 'Google Chrome';
    issueDescription = 'Este navegador no soporta la API de reconocimiento de voz. Se recomienda usar un navegador moderno como Google Chrome.';
  }

  return {
    speechRecognitionSupported,
    hasKnownIssues,
    recommendedBrowser,
    issueDescription
  };
};

/**
 * Genera un mensaje de error específico para problemas de reconocimiento de voz
 */
export const generateSpeechRecognitionErrorMessage = (error: string): string => {
  const browser = detectBrowser();
  const system = detectSystem();
  const compatibility = evaluateSpeechRecognitionCompatibility();

  let message = `Error de reconocimiento de voz: ${error}`;

  // Mensajes específicos para errores conocidos
  if (error === 'network') {
    if (system.isLinux && browser.isEdge) {
      message = `🚫 Error de red en reconocimiento de voz

Este es un problema conocido de Microsoft Edge en Linux. El servicio de reconocimiento de voz no puede conectarse correctamente.

💡 Soluciones recomendadas:
• Usa Google Chrome para una mejor experiencia
• Verifica tu conexión a internet
• Intenta recargar la página

🔧 Información técnica:
• Sistema: ${system.os}
• Navegador: ${browser.name} ${browser.version}
• Error: Fallo de conexión de red del servicio de reconocimiento`;
    } else {
      message = `🌐 Error de conexión de red

El servicio de reconocimiento de voz no puede conectarse. Esto puede deberse a:
• Problemas de conectividad a internet
• Restricciones del navegador
• Problemas temporales del servicio

💡 Intenta:
• Verificar tu conexión a internet
• Recargar la página
• Usar un navegador compatible como Google Chrome`;
    }
  } else if (error === 'not-allowed') {
    message = `🎤 Permisos de micrófono requeridos

Para usar el reconocimiento de voz necesitas:
• Permitir el acceso al micrófono
• Usar una conexión HTTPS segura
• Verificar la configuración de privacidad del navegador`;
  } else if (error === 'language-not-supported') {
    message = `🌍 Idioma no soportado

El idioma configurado no está disponible en este navegador.
• Verifica la configuración de idioma
• Intenta con español (es-ES) o inglés (en-US)
• ${compatibility.hasKnownIssues ? compatibility.issueDescription : ''}`;
  }

  return message;
};

/**
 * Registra información de debugging para problemas de reconocimiento de voz
 */
export const logSpeechRecognitionDebugInfo = (error?: string): void => {
  const browser = detectBrowser();
  const system = detectSystem();
  const compatibility = evaluateSpeechRecognitionCompatibility();

  console.group('🎤 Speech Recognition Debug Info');
  console.log('Sistema:', system);
  console.log('Navegador:', browser);
  console.log('Compatibilidad:', compatibility);
  
  if (error) {
    console.error('Error:', error);
  }
  
  console.log('SpeechRecognition disponible:', 'SpeechRecognition' in window);
  console.log('webkitSpeechRecognition disponible:', 'webkitSpeechRecognition' in window);
  console.log('Protocolo:', window.location.protocol);
  console.log('UserAgent:', navigator.userAgent);
  console.groupEnd();
};