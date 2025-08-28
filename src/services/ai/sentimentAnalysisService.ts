import {
  SentimentAnalysis,
  EmotionalState,
  EmotionalShift,
  SentimentConfig,
  AIInput
} from '../../types/aiTypes';
import { ConversationContext } from '../../types/contextTypes';
import { GeminiAIService } from './geminiAIService';
import { AI_PROMPTS, fillPromptTemplate } from './aiPrompts';

/**
 * Servicio especializado para análisis de sentimientos en tiempo real
 * Proporciona análisis detallado de emociones y sentimientos en las conversaciones
 */
export class SentimentAnalysisService {
  private geminiService: GeminiAIService;
  private analysisCache: Map<string, SentimentAnalysis> = new Map();
  private realtimeCallbacks: Set<(analysis: SentimentAnalysis) => void> = new Set();

  constructor(geminiService: GeminiAIService) {
    this.geminiService = geminiService;
  }

  /**
   * Analiza el sentimiento de un mensaje en tiempo real
   */
  async analyzeMessageSentiment(message: string, userId?: string): Promise<SentimentAnalysis> {
    try {
      // Verificar cache primero
      const cacheKey = this.generateCacheKey(message, userId);
      const cachedAnalysis = this.analysisCache.get(cacheKey);
      
      if (cachedAnalysis && this.isCacheValid(cachedAnalysis)) {
        return cachedAnalysis;
      }

      // Realizar análisis con Gemini
      const prompt = fillPromptTemplate(
        AI_PROMPTS.SENTIMENT_ANALYSIS.template,
        { userMessage: message }
      );

      const aiInput: AIInput = {
        query: prompt,
        sessionId: 'sentiment_analysis',
        timestamp: new Date(),
        audioInput: false
      };
      
      const context: ConversationContext = {
        sessionId: 'sentiment_analysis',
        messages: [],
        userProfile: {
          detectedLevel: 'intermediate',
          interests: [],
          sentiment: 'neutral',
          preferredTopics: [],
          interactionCount: 0,
          lastInteraction: new Date()
        },
        lastInteraction: new Date(),
        activeTopics: [],
        conversationFlow: {
          currentTopic: 'general',
          topicHistory: [],
          expectedNextTopics: [],
          conversationStage: 'exploration',
          userEngagementLevel: 'medium'
        },
        metadata: {
          startTime: new Date(),
          duration: 0,
          messageCount: 0,
          topicCount: 0,
          averageResponseTime: 0,
          userSatisfactionIndicators: []
        }
      };
      
      const response = await this.geminiService.processQuery(aiInput, context);

      const analysis = this.parseSentimentResponse(response.response.content, message);
      
      // Guardar en cache
      this.analysisCache.set(cacheKey, analysis);
      
      // Notificar a callbacks en tiempo real
      this.notifyRealtimeCallbacks(analysis);
      
      return analysis;
    } catch (error) {
      console.error('Error analyzing sentiment:', error);
      return this.createFallbackAnalysis(message);
    }
  }

  /**
   * Analiza el estado emocional general de una conversación
   */
  async analyzeConversationMood(
    messages: Array<{ content: string; timestamp: Date; isUser: boolean }>
  ): Promise<EmotionalState> {
    try {
      const recentMessages = messages
        .slice(-5) // Últimos 5 mensajes
        .map(msg => `${msg.isUser ? 'Usuario' : 'Asistente'}: ${msg.content}`)
        .join('\n');

      const prompt = `Analiza el estado emocional general de esta conversación reciente:

${recentMessages}

Proporciona:
1. Estado emocional dominante
2. Nivel de satisfacción (0-1)
3. Indicadores de frustración o confusión
4. Recomendaciones para mejorar la interacción

Responde en formato JSON.`;

      const aiInput: AIInput = {
        query: prompt,
        sessionId: 'mood_analysis',
        timestamp: new Date(),
        audioInput: false
      };
      
      const context: ConversationContext = {
        sessionId: 'mood_analysis',
        messages: messages.map((m, index) => ({ 
          id: `msg_${index}_${Date.now()}`, 
          type: m.isUser ? 'user' : 'assistant', 
          content: m.content, 
          timestamp: m.timestamp, 
          isUser: m.isUser 
        })),
        userProfile: {
          detectedLevel: 'intermediate',
          interests: [],
          sentiment: 'neutral',
          preferredTopics: [],
          interactionCount: 0,
          lastInteraction: new Date()
        },
        lastInteraction: new Date(),
        activeTopics: [],
        conversationFlow: {
          currentTopic: 'general',
          topicHistory: [],
          expectedNextTopics: [],
          conversationStage: 'exploration',
          userEngagementLevel: 'medium'
        },
        metadata: {
          startTime: new Date(),
          duration: 0,
          messageCount: messages.length,
          topicCount: 0,
          averageResponseTime: 0,
          userSatisfactionIndicators: []
        }
      };
      
      const response = await this.geminiService.processQuery(aiInput, context);

      return this.parseEmotionalState(response.response.content);
    } catch (error) {
      console.error('Error analyzing conversation mood:', error);
      return this.createDefaultEmotionalState();
    }
  }

  /**
   * Detecta cambios emocionales significativos
   */
  async detectEmotionalShifts(
    previousAnalysis: SentimentAnalysis,
    currentAnalysis: SentimentAnalysis
  ): Promise<{
    hasShift: boolean;
    shiftType: 'positive' | 'negative' | 'neutral';
    intensity: number;
    recommendations: string[];
  }> {
    const sentimentDiff = currentAnalysis.sentiment.confidence - previousAnalysis.sentiment.confidence;
    const confidenceDiff = currentAnalysis.sentiment.confidence - previousAnalysis.sentiment.confidence;
    
    const hasSignificantShift = Math.abs(sentimentDiff) > 0.3;
    
    if (!hasSignificantShift) {
      return {
        hasShift: false,
        shiftType: 'neutral',
        intensity: 0,
        recommendations: []
      };
    }

    const shiftType = sentimentDiff > 0 ? 'positive' : 'negative';
    const intensity = Math.abs(sentimentDiff);
    
    const recommendations = this.generateShiftRecommendations(shiftType, intensity, currentAnalysis);

    return {
      hasShift: true,
      shiftType,
      intensity,
      recommendations
    };
  }

  /**
   * Registra callback para análisis en tiempo real
   */
  onRealtimeAnalysis(callback: (analysis: SentimentAnalysis) => void): () => void {
    this.realtimeCallbacks.add(callback);
    
    // Retorna función para desregistrar
    return () => {
      this.realtimeCallbacks.delete(callback);
    };
  }

  /**
   * Obtiene métricas de sentimientos de una sesión
   */
  getSessionSentimentMetrics(analyses: SentimentAnalysis[]): {
    averageSentiment: number;
    sentimentTrend: 'improving' | 'declining' | 'stable';
    emotionalVolatility: number;
    dominantEmotions: string[];
  } {
    if (analyses.length === 0) {
      return {
        averageSentiment: 0,
        sentimentTrend: 'stable',
        emotionalVolatility: 0,
        dominantEmotions: []
      };
    }

    const scores = analyses.map(a => a.sentiment.confidence);
    const averageSentiment = scores.reduce((sum, score) => sum + score, 0) / scores.length;
    
    // Calcular tendencia
    const firstHalf = scores.slice(0, Math.floor(scores.length / 2));
    const secondHalf = scores.slice(Math.floor(scores.length / 2));
    
    const firstAvg = firstHalf.reduce((sum, score) => sum + score, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((sum, score) => sum + score, 0) / secondHalf.length;
    
    let sentimentTrend: 'improving' | 'declining' | 'stable';
    const trendDiff = secondAvg - firstAvg;
    
    if (trendDiff > 0.1) sentimentTrend = 'improving';
    else if (trendDiff < -0.1) sentimentTrend = 'declining';
    else sentimentTrend = 'stable';
    
    // Calcular volatilidad emocional
    const variance = scores.reduce((sum, score) => sum + Math.pow(score - averageSentiment, 2), 0) / scores.length;
    const emotionalVolatility = Math.sqrt(variance);
    
    // Emociones dominantes
    const emotionCounts = new Map<string, number>();
    analyses.forEach(analysis => {
      analysis.emotions.forEach(emotion => {
        emotionCounts.set(emotion, (emotionCounts.get(emotion) || 0) + 1);
      });
    });
    
    const dominantEmotions = Array.from(emotionCounts.entries())
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([emotion]) => emotion);

    return {
      averageSentiment,
      sentimentTrend,
      emotionalVolatility,
      dominantEmotions
    };
  }

  /**
   * Limpia el cache de análisis
   */
  clearCache(): void {
    this.analysisCache.clear();
  }

  // Métodos privados
  private generateCacheKey(message: string, userId?: string): string {
    const baseKey = message.toLowerCase().trim();
    return userId ? `${userId}:${baseKey}` : baseKey;
  }

  private isCacheValid(analysis: SentimentAnalysis): boolean {
    const cacheAge = Date.now() - analysis.timestamp.getTime();
    return cacheAge < 300000; // 5 minutos
  }

  private parseSentimentResponse(response: string, originalMessage: string): SentimentAnalysis {
    try {
      // Intentar parsear como JSON
      const parsed = JSON.parse(response);
      
      return {
        sentiment: {
          label: parsed.sentiment || 'neutral',
          confidence: parsed.confidence || 0.5
        },
        emotions: parsed.emotions || ['neutral'],
        intensity: parsed.intensity || 0.5,
        context: parsed.context || '',
        timestamp: new Date(),
        messageId: this.generateMessageId(originalMessage)
      };
    } catch (error) {
      // Fallback a análisis básico
      return this.createBasicSentimentAnalysis(response, originalMessage);
    }
  }

  private parseEmotionalState(response: string): EmotionalState {
    try {
      const parsed = JSON.parse(response);
      
      return {
        dominantEmotion: parsed.primary || 'neutral',
        emotionScores: parsed.emotionScores || { neutral: 1.0 },
        overallMood: parsed.overallMood || 'neutral',
        moodIntensity: parsed.intensity || 0.5,
        lastUpdated: new Date()
      };
    } catch (error) {
      return this.createDefaultEmotionalState();
    }
  }

  private createFallbackAnalysis(message: string): SentimentAnalysis {
    return {
      sentiment: {
        label: 'neutral',
        confidence: 0.3
      },
      emotions: ['neutral'],
      intensity: 0.5,
      context: 'Análisis no disponible',
      timestamp: new Date(),
      messageId: this.generateMessageId(message)
    };
  }

  private createBasicSentimentAnalysis(response: string, message: string): SentimentAnalysis {
    // Análisis básico basado en palabras clave
    const positiveWords = ['bien', 'bueno', 'excelente', 'perfecto', 'gracias', 'genial'];
    const negativeWords = ['mal', 'error', 'problema', 'difícil', 'confuso', 'frustrado'];
    
    const lowerMessage = message.toLowerCase();
    const positiveCount = positiveWords.filter(word => lowerMessage.includes(word)).length;
    const negativeCount = negativeWords.filter(word => lowerMessage.includes(word)).length;
    
    let sentiment: 'positive' | 'negative' | 'neutral' = 'neutral';
    let score = 0;
    
    if (positiveCount > negativeCount) {
      sentiment = 'positive';
      score = Math.min(positiveCount * 0.3, 1);
    } else if (negativeCount > positiveCount) {
      sentiment = 'negative';
      score = Math.max(negativeCount * -0.3, -1);
    }
    
    return {
      sentiment: {
        label: sentiment,
        confidence: 0.6
      },
      emotions: [sentiment],
      intensity: Math.abs(score),
      context: 'Análisis básico',
      timestamp: new Date(),
      messageId: this.generateMessageId(message)
    };
  }

  private createDefaultEmotionalState(): EmotionalState {
    return {
      dominantEmotion: 'neutral',
      emotionScores: { neutral: 1.0 },
      overallMood: 'neutral',
      moodIntensity: 0.5,
      lastUpdated: new Date()
    };
  }

  private normalizeSentimentScore(score: number): number {
    return Math.max(-1, Math.min(1, score));
  }

  private generateMessageId(message: string): string {
    return `msg_${Date.now()}_${message.slice(0, 10).replace(/\s/g, '')}`;
  }

  private generateShiftRecommendations(
    shiftType: 'positive' | 'negative',
    intensity: number,
    currentAnalysis: SentimentAnalysis
  ): string[] {
    const recommendations: string[] = [];
    
    if (shiftType === 'negative' && intensity > 0.5) {
      recommendations.push('Considerar un tono más empático en las respuestas');
      recommendations.push('Ofrecer ayuda adicional o clarificaciones');
      recommendations.push('Verificar si el usuario necesita un enfoque diferente');
    } else if (shiftType === 'positive' && intensity > 0.3) {
      recommendations.push('Mantener el tono positivo actual');
      recommendations.push('Aprovechar el momento para profundizar en el tema');
    }
    
    if (currentAnalysis.emotions.includes('confused')) {
      recommendations.push('Proporcionar explicaciones más claras y estructuradas');
    }
    
    if (currentAnalysis.emotions.includes('frustrated')) {
      recommendations.push('Ofrecer alternativas o enfoques más simples');
    }
    
    return recommendations;
  }

  private notifyRealtimeCallbacks(analysis: SentimentAnalysis): void {
    this.realtimeCallbacks.forEach(callback => {
      try {
        callback(analysis);
      } catch (error) {
        console.error('Error in realtime sentiment callback:', error);
      }
    });
  }
}