import { useState, useEffect } from 'react';

type Theme = 'light' | 'dark';

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(() => {
    const savedTheme = localStorage.getItem('theme') as Theme;
    if (savedTheme) {
      return savedTheme;
    }
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  const [primaryColor, setPrimaryColor] = useState<string>(() => {
    const savedColor = localStorage.getItem('primaryColor');
    return savedColor || '#1E3A8A';
  });

  useEffect(() => {
    document.documentElement.classList.remove('light', 'dark');
    document.documentElement.classList.add(theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  useEffect(() => {
    // Aplicar color primario como CSS variables
    const root = document.documentElement;
    root.style.setProperty('--primary-color', primaryColor);
    
    // Generar variaciones del color primario
    const hexToRgb = (hex: string) => {
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
      return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
      } : null;
    };
    
    const rgb = hexToRgb(primaryColor);
    if (rgb) {
      root.style.setProperty('--primary-rgb', `${rgb.r}, ${rgb.g}, ${rgb.b}`);
      
      // Crear variaciones más claras y oscuras
      const lighten = (factor: number) => {
        const r = Math.min(255, Math.floor(rgb.r + (255 - rgb.r) * factor));
        const g = Math.min(255, Math.floor(rgb.g + (255 - rgb.g) * factor));
        const b = Math.min(255, Math.floor(rgb.b + (255 - rgb.b) * factor));
        return `rgb(${r}, ${g}, ${b})`;
      };
      
      const darken = (factor: number) => {
        const r = Math.floor(rgb.r * (1 - factor));
        const g = Math.floor(rgb.g * (1 - factor));
        const b = Math.floor(rgb.b * (1 - factor));
        return `rgb(${r}, ${g}, ${b})`;
      };
      
      root.style.setProperty('--primary-50', lighten(0.95));
      root.style.setProperty('--primary-100', lighten(0.9));
      root.style.setProperty('--primary-200', lighten(0.8));
      root.style.setProperty('--primary-300', lighten(0.6));
      root.style.setProperty('--primary-400', lighten(0.4));
      root.style.setProperty('--primary-500', primaryColor);
      root.style.setProperty('--primary-600', darken(0.1));
      root.style.setProperty('--primary-700', darken(0.2));
      root.style.setProperty('--primary-800', darken(0.3));
      root.style.setProperty('--primary-900', darken(0.4));
    }
    
    localStorage.setItem('primaryColor', primaryColor);
  }, [primaryColor]);

  const toggleTheme = () => {
    setTheme(prevTheme => prevTheme === 'light' ? 'dark' : 'light');
  };

  const updatePrimaryColor = (color: string) => {
    setPrimaryColor(color);
  };

  return {
    theme,
    primaryColor,
    toggleTheme,
    updatePrimaryColor,
    isDark: theme === 'dark'
  };
}