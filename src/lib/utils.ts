import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Limpia el texto removiendo emojis y caracteres especiales para mejorar la síntesis de voz
 * @param text - Texto a limpiar
 * @returns Texto limpio sin emojis ni caracteres especiales
 */
export const cleanTextForSpeech = (text: string): string => {
  return text
    // Remover emojis usando regex Unicode
    .replace(/[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu, '')
    // Remover otros símbolos y caracteres especiales comunes
    .replace(/[🐛😄☕😂🌿😆👋]/g, '')
    // Remover caracteres de control y espacios extra
    .replace(/[\u0000-\u001F\u007F-\u009F]/g, '')
    // Normalizar espacios múltiples
    .replace(/\s+/g, ' ')
    // Limpiar espacios al inicio y final
    .trim();
};

/**
 * Formatea el texto para mostrar en la interfaz manteniendo emojis
 * @param text - Texto original
 * @returns Texto formateado para UI
 */
export const formatTextForDisplay = (text: string): string => {
  return text.trim();
};
