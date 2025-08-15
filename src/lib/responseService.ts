import { AssistantResponse, ResponseDatabase } from '../types';
import responsesData from '../data/responses.json';

export class ResponseService {
  private static responses: ResponseDatabase = responsesData as ResponseDatabase;

  /**
   * Obtiene una respuesta basada en el texto de entrada del usuario
   */
  static async getResponse(userInput: string): Promise<AssistantResponse> {
    const normalizedInput = this.normalizeText(userInput);
    
    // Buscar en todas las categorías
    const allResponses = [
      ...this.responses.greetings,
      ...this.responses.programming,
      ...this.responses.jokes,
      ...this.responses.general
    ];

    // Encontrar la mejor coincidencia
    const bestMatch = this.findBestMatch(normalizedInput, allResponses);
    
    if (bestMatch) {
      return bestMatch;
    }

    // Respuesta por defecto si no se encuentra coincidencia
    return this.getDefaultResponse(normalizedInput);
  }

  /**
   * Normaliza el texto para mejorar la coincidencia
   */
  private static normalizeText(text: string): string {
    return text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remover acentos
      .replace(/[^\w\s]/g, ' ') // Remover puntuación
      .replace(/\s+/g, ' ') // Normalizar espacios
      .trim();
  }

  /**
   * Encuentra la mejor coincidencia basada en keywords
   */
  private static findBestMatch(
    input: string, 
    responses: AssistantResponse[]
  ): AssistantResponse | null {
    let bestMatch: AssistantResponse | null = null;
    let highestScore = 0;

    for (const response of responses) {
      const score = this.calculateMatchScore(input, response.keywords);
      if (score > highestScore && score > 0.3) { // Umbral mínimo de coincidencia
        highestScore = score;
        bestMatch = response;
      }
    }

    return bestMatch;
  }

  /**
   * Calcula el puntaje de coincidencia entre el input y las keywords
   */
  private static calculateMatchScore(input: string, keywords: string[]): number {
    const inputWords = input.split(' ').filter(word => word.length > 2);
    let totalScore = 0;
    let maxPossibleScore = 0;

    for (const keyword of keywords) {
      const normalizedKeyword = this.normalizeText(keyword);
      const keywordWords = normalizedKeyword.split(' ');
      maxPossibleScore += keywordWords.length;

      // Coincidencia exacta de frase
      if (input.includes(normalizedKeyword)) {
        totalScore += keywordWords.length * 2; // Bonus por coincidencia exacta
        continue;
      }

      // Coincidencia de palabras individuales
      for (const keywordWord of keywordWords) {
        if (keywordWord.length > 2) {
          for (const inputWord of inputWords) {
            if (inputWord.includes(keywordWord) || keywordWord.includes(inputWord)) {
              totalScore += 1;
            }
          }
        }
      }
    }

    return maxPossibleScore > 0 ? totalScore / maxPossibleScore : 0;
  }

  /**
   * Genera una respuesta por defecto cuando no se encuentra coincidencia
   */
  private static getDefaultResponse(input: string): AssistantResponse {
    const defaultResponses = [
      {
        id: 'default_001',
        keywords: [],
        response: 'Interesante pregunta. Te puedo contar sobre la especialidad de programación en CECADE, nuestros cursos, tecnologías que enseñamos, o puedes pedirme un chiste. ¿Qué te gustaría saber?',
        category: 'general' as const,
        emotion: 'thinking' as const
      },
      {
        id: 'default_002',
        keywords: [],
        response: 'No estoy seguro de cómo responder a eso, pero puedo ayudarte con información sobre programación, CECADE, o contarte algo divertido. ¿Qué prefieres?',
        category: 'general' as const,
        emotion: 'neutral' as const
      },
      {
        id: 'default_003',
        keywords: [],
        response: 'Hmm, esa es una pregunta interesante. ¿Te gustaría que te cuente sobre los lenguajes de programación que enseñamos en CECADE o prefieres que te haga reír con un chiste?',
        category: 'general' as const,
        emotion: 'thinking' as const
      }
    ];

    // Seleccionar respuesta aleatoria
    const randomIndex = Math.floor(Math.random() * defaultResponses.length);
    return defaultResponses[randomIndex];
  }

  /**
   * Obtiene respuestas por categoría
   */
  static getResponsesByCategory(category: keyof ResponseDatabase): AssistantResponse[] {
    return this.responses[category] || [];
  }

  /**
   * Obtiene una respuesta aleatoria de una categoría específica
   */
  static getRandomResponseFromCategory(category: keyof ResponseDatabase): AssistantResponse | null {
    const categoryResponses = this.getResponsesByCategory(category);
    if (categoryResponses.length === 0) return null;
    
    const randomIndex = Math.floor(Math.random() * categoryResponses.length);
    return categoryResponses[randomIndex];
  }

  /**
   * Busca respuestas que contengan texto específico
   */
  static searchResponses(searchTerm: string): AssistantResponse[] {
    const normalizedSearch = this.normalizeText(searchTerm);
    const allResponses = [
      ...this.responses.greetings,
      ...this.responses.programming,
      ...this.responses.jokes,
      ...this.responses.general
    ];

    return allResponses.filter(response => {
      const normalizedResponse = this.normalizeText(response.response);
      const normalizedKeywords = response.keywords.map(k => this.normalizeText(k)).join(' ');
      
      return normalizedResponse.includes(normalizedSearch) || 
             normalizedKeywords.includes(normalizedSearch);
    });
  }

  /**
   * Obtiene estadísticas de las respuestas
   */
  static getResponseStats() {
    return {
      total: Object.values(this.responses).flat().length,
      programming: this.responses.programming.length,
      greetings: this.responses.greetings.length,
      jokes: this.responses.jokes.length,
      general: this.responses.general.length
    };
  }
}