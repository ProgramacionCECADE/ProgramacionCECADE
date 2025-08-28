import { GoogleGenerativeAI } from '@google/generative-ai';
import {
  GeminiConfig,
  AIAnalysis,
  AIResponse,
   UserProfile,
   AIInput,
   AIProcessingResult,
  AIBehaviorConfig,
  PromptTemplate,
  AIMetrics,
  AIServiceStatus
} from '../../types/aiTypes';
import { ConversationContext } from '../../types/contextTypes';

/**
 * Servicio principal para la integración con Gemini AI
 * Maneja el procesamiento de lenguaje natural, análisis de sentimientos
 * y generación de respuestas inteligentes
 */
export class GeminiAIService {
  private genAI: GoogleGenerativeAI;
  private model: any;
  private config: GeminiConfig;
  private behaviorConfig: AIBehaviorConfig;
  private promptTemplates: Map<string, PromptTemplate> = new Map();
  private startTime: number;
  private metrics: AIMetrics;

  constructor(config: GeminiConfig, behaviorConfig: AIBehaviorConfig) {
    this.config = config;
    this.behaviorConfig = behaviorConfig;
    this.genAI = new GoogleGenerativeAI(config.apiKey);
    this.model = this.genAI.getGenerativeModel({ model: config.model });
    this.startTime = Date.now();
    this.metrics = {
      totalQueries: 0,
      totalRequests: 0,
      successfulRequests: 0,
      averageResponseTime: 0,
      accuracyScore: 0,
      userSatisfactionScore: 0,
      contextRetentionRate: 0,
      lastUpdated: new Date()
    };
    this.initializePromptTemplates();
  }

  /**
   * Inicializa las plantillas de prompts para diferentes tipos de consultas
   */
  private initializePromptTemplates(): void {
    const templates: PromptTemplate[] = [
      {
        id: 'general_analysis',
        name: 'Análisis General',
        category: 'analysis',
        template: `Analiza la siguiente consulta del usuario sobre programación en CECADE:

Consulta: "{query}"
Contexto previo: {context}
Perfil del usuario: {userProfile}

Proporciona un análisis que incluya:
1. Intención principal del usuario
2. Sentimiento (positivo/neutral/negativo)
3. Nivel técnico detectado (principiante/intermedio/avanzado)
4. Palabras clave relevantes
5. Categoría de la consulta
6. Nivel de confianza del análisis (0-1)

Responde en formato JSON.`,
        variables: ['query', 'context', 'userProfile'],
        description: 'Template para análisis general de consultas'
      },
      {
        id: 'response_generation',
        name: 'Generación de Respuesta',
        category: 'response',
        template: `Eres un asistente virtual especializado en CECADE (Centro de Emprendimiento, Capacitación y Desarrollo Empresarial).

INFORMACIÓN INSTITUCIONAL DE CECADE:
- CECADE es el Centro de Emprendimiento, Capacitación y Desarrollo Empresarial
- Es un instituto orientado a ayudar a jóvenes, madres solteras y pequeñas empresas
- Ofrece formación técnica, mentalidad emprendedora, mentoría, desarrollo de prototipos y modelos de negocio
- También conocido como Colegio FLC / CECADE - una institución que transforma vidas a través del amor de Cristo
- Su propósito es la pre-incubación, incubación y aceleración de ideas de negocio

ESPECIALIDADES DISPONIBLES:
- Desde Sexto Primaria hasta Segundo Básico: Panadería, Productos Agroindustriales, Inglés
- Desde Tercero Básico hasta Quinto Bachillerato: Programación, Call Center, Medicina, Diseño Gráfico

INSTRUCCIONES ESPECÍFICAS:

1. ANÁLISIS DE TIPO DE PREGUNTA:
   - Para preguntas institucionales ("¿Qué es CECADE?", "¿Qué especialidades tienen?", "¿Quiénes son?"): usa la información institucional arriba
   - Para preguntas sobre programación específicamente: menciona Java como el lenguaje principal
   - Para saludos: responde como asistente virtual de CECADE enfocado en programación
   - Para solicitudes de chistes o humor: usa los chistes específicos disponibles

2. PARA PREGUNTAS SOBRE PROGRAMACIÓN:
   - En CECADE utilizamos Java para trabajar con sistemas de enfoque empresarial
   - Java es un lenguaje de programación de alto nivel orientado a objetos
   - Los estudiantes desarrollan proyectos reales: sistemas de gestión, calculadoras, interfaces gráficas
   - Python NO forma parte del pensum actual de CECADE
   - Puedes mencionar JSON y YAML como formatos de datos cuando sea relevante
   - Si preguntan sobre otros lenguajes, redirige hacia Java

3. EJEMPLOS DE RESPUESTAS:
   - Saludo: "¡Hola! Soy el asistente virtual de CECADE. Estoy aquí para contarte todo sobre nuestra especialidad en programación."
   - Sobre CECADE: "Centro de Emprendimiento, Capacitación y Desarrollo Empresarial (CECADE). Es un instituto orientado a ayudar a jóvenes, madres solteras y pequeñas empresas con formación técnica."
   - Sobre programación: "En CECADE utilizamos Java para trabajar con sistemas de enfoque empresarial. ¡Tecnologías que demanda la industria!"
   - Chistes: Usa uno de estos chistes disponibles cuando se solicite humor

4. CHISTES DISPONIBLES (usar cuando se pida humor o chistes):
   - "¿Por qué los programadores prefieren el modo oscuro? ¡Porque la luz atrae bugs! 🐛😄"
   - "¿Cuál es la bebida favorita de los programadores? ¡Java! ☕😂"
   - "¿Por qué los programadores odian la naturaleza? ¡Porque tiene demasiados bugs! 🌿🐛😆"
   - "¿Por qué los administradores siempre tienen una calculadora a mano? ¡Porque no pueden contar con sus empleados! 😄📱"

5. RESTRICCIONES:
   - Mantén las respuestas entre 30-100 palabras
   - Sé natural y conversacional con emoción apropiada (happy, excited, neutral)
   - Para más información, dirige a contactar la administración de Maná de Vida o visitar el Facebook de CECADE

Genera una respuesta apropiada basada en la consulta del usuario usando esta información específica.

Consulta: "{query}"
Análisis: {analysis}
Contexto: {context}
Perfil del usuario: {userProfile}
Nivel del usuario: {userLevel}
Estilo de respuesta: {responseStyle}`,
        variables: ['query', 'analysis', 'context', 'userProfile', 'userLevel', 'responseStyle'],
        description: 'Template para generar respuestas del asistente'
      },
      {
        id: 'sentiment_analysis',
        name: 'Análisis de Sentimientos',
        category: 'sentiment',
        template: `Analiza el sentimiento de esta consulta:

"{query}"

Contexto de la conversación: {context}

Determina:
1. Sentimiento principal (positivo/neutral/negativo)
2. Emociones específicas detectadas
3. Nivel de urgencia o importancia
4. Indicadores de frustración o satisfacción
5. Confianza del análisis (0-1)

Responde en formato JSON.`,
        variables: ['query', 'context'],
        description: 'Template para análisis detallado de sentimientos'
      }
    ];

    templates.forEach(template => {
      this.promptTemplates.set(template.id, template);
    });
  }

  /**
   * Procesa una consulta completa del usuario
   */
  async processQuery(
    input: AIInput,
    context: ConversationContext
  ): Promise<AIProcessingResult> {
    const startTime = Date.now();

    try {
      // 1. Analizar la consulta
      const analysis = await this.analyzeQuery(input.query, context);

      // 2. Generar respuesta basada en el análisis
      const response = await this.generateResponse(input.query, analysis, context);

      // 3. Actualizar perfil del usuario
      const updatedProfile = this.updateUserProfile(context.userProfile, analysis, input);

      // 4. Generar actualizaciones de contexto
      const contextUpdates = this.generateContextUpdates(input.query, analysis, response);

      const processingTime = Date.now() - startTime;

      return {
        analysis,
        response,
        updatedProfile,
        contextUpdates,
        processingTime
      };
    } catch (error) {
      console.error('Error processing query:', error);
      throw new Error(`Failed to process query: ${error}`);
    }
  }

  /**
   * Analiza una consulta del usuario para extraer intención, sentimiento y contexto
   */
  async analyzeQuery(
    query: string,
    context: ConversationContext
  ): Promise<AIAnalysis> {
    const template = this.promptTemplates.get('general_analysis')!;
    const prompt = this.buildPrompt(template, {
      query,
      context: this.formatContext(context),
      userProfile: JSON.stringify(context.userProfile)
    });

    try {
      const result = await this.model.generateContent(prompt);
      const response = result.response.text();
      
      // Parsear la respuesta JSON
      const analysisData = this.parseAIResponse(response);
      
      return {
        intent: analysisData.intent || 'general_inquiry',
        sentiment: analysisData.sentiment || 'neutral',
        confidence: analysisData.confidence || 0.7,
        suggestedResponse: analysisData.suggestedResponse || '',
        context: analysisData.context || [],
        userLevel: analysisData.userLevel || 'intermediate',
        urgency: analysisData.urgency || 'medium',
        keywords: analysisData.keywords || [],
        category: analysisData.category || 'general'
      };
    } catch (error) {
      console.error('Error analyzing query:', error);
      // Fallback analysis
      return this.createFallbackAnalysis(query);
    }
  }

  /**
   * Genera una respuesta inteligente basada en el análisis
   */
  async generateResponse(
    query: string,
    analysis: AIAnalysis,
    context: ConversationContext
  ): Promise<AIResponse> {
    const template = this.promptTemplates.get('response_generation')!;
    const prompt = this.buildPrompt(template, {
      query,
      analysis: JSON.stringify(analysis),
      context: this.formatContext(context),
      userProfile: JSON.stringify(context.userProfile),
      userLevel: analysis.userLevel,
      responseStyle: this.behaviorConfig.responseStyle
    });

    try {
      const result = await this.model.generateContent(prompt);
      const responseText = result.response.text();
      
      return {
        content: responseText.trim(),
        confidence: analysis.confidence,
        reasoning: `Generated based on ${analysis.intent} intent with ${analysis.sentiment} sentiment`,
        emotion: this.determineEmotion(analysis),
        adaptedLevel: analysis.userLevel
      };
    } catch (error) {
      console.error('Error generating response:', error);
      return this.createFallbackResponse(query, analysis);
    }
  }

  /**
   * Realiza análisis de sentimientos detallado
   */
  async analyzeSentiment(query: string, context: ConversationContext): Promise<{
    sentiment: 'positive' | 'neutral' | 'negative';
    confidence: number;
    emotions: string[];
    urgency: 'low' | 'medium' | 'high';
  }> {
    const template = this.promptTemplates.get('sentiment_analysis')!;
    const prompt = this.buildPrompt(template, {
      query,
      context: this.formatContext(context)
    });

    try {
      const result = await this.model.generateContent(prompt);
      const response = result.response.text();
      const sentimentData = this.parseAIResponse(response);
      
      return {
        sentiment: sentimentData.sentiment || 'neutral',
        confidence: sentimentData.confidence || 0.7,
        emotions: sentimentData.emotions || [],
        urgency: sentimentData.urgency || 'medium'
      };
    } catch (error) {
      console.error('Error analyzing sentiment:', error);
      return {
        sentiment: 'neutral',
        confidence: 0.5,
        emotions: [],
        urgency: 'medium'
      };
    }
  }

  /**
   * Construye un prompt usando una plantilla y variables
   */
  private buildPrompt(template: PromptTemplate, variables: Record<string, string>): string {
    let prompt = template.template;
    
    template.variables.forEach(variable => {
      const value = variables[variable] || '';
      prompt = prompt.replace(new RegExp(`{${variable}}`, 'g'), value);
    });
    
    return prompt;
  }

  /**
   * Formatea el contexto para incluir en prompts
   */
  private formatContext(context: ConversationContext): string {
    const recentMessages = context.messages.slice(-5);
    const contextStr = recentMessages
      .map(msg => `${msg.type}: ${msg.content}`)
      .join('\n');
    
    return `Mensajes recientes:\n${contextStr}\nTemas activos: ${context.activeTopics.join(', ')}`;
  }

  /**
   * Parsea respuestas JSON de la IA con manejo de errores
   */
  private parseAIResponse(response: string): any {
    try {
      // Limpiar la respuesta para extraer solo el JSON
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      return {};
    } catch (error) {
      console.warn('Failed to parse AI response as JSON:', response);
      return {};
    }
  }

  /**
   * Actualiza el perfil del usuario basado en la interacción
   */
  private updateUserProfile(
    currentProfile: UserProfile,
    analysis: AIAnalysis,
    input: AIInput
  ): UserProfile {
    return {
      ...currentProfile,
      detectedLevel: analysis.userLevel,
      sentiment: analysis.sentiment,
      interests: this.updateInterests(currentProfile.interests, analysis.keywords),
      preferredTopics: this.updatePreferredTopics(currentProfile.preferredTopics, analysis.category),
      interactionCount: currentProfile.interactionCount + 1,
      lastInteraction: input.timestamp
    };
  }

  /**
   * Actualiza los intereses del usuario
   */
  private updateInterests(currentInterests: string[], newKeywords: string[]): string[] {
    const updatedInterests = [...currentInterests];
    
    newKeywords.forEach(keyword => {
      if (!updatedInterests.includes(keyword)) {
        updatedInterests.push(keyword);
      }
    });
    
    // Mantener solo los últimos 10 intereses
    return updatedInterests.slice(-10);
  }

  /**
   * Actualiza los temas preferidos del usuario
   */
  private updatePreferredTopics(currentTopics: string[], newCategory: string): string[] {
    const updatedTopics = [...currentTopics];
    
    if (!updatedTopics.includes(newCategory)) {
      updatedTopics.push(newCategory);
    }
    
    return updatedTopics.slice(-5);
  }

  /**
   * Genera actualizaciones de contexto
   */
  private generateContextUpdates(
    query: string,
    analysis: AIAnalysis,
    response: AIResponse
  ): string[] {
    return [
      `User asked about: ${analysis.intent}`,
      `Detected sentiment: ${analysis.sentiment}`,
      `Response category: ${analysis.category}`,
      `Keywords: ${analysis.keywords.join(', ')}`
    ];
  }

  /**
   * Determina la emoción apropiada para la respuesta
   */
  private determineEmotion(analysis: AIAnalysis): 'happy' | 'neutral' | 'excited' | 'thinking' | 'empathetic' {
    if (analysis.sentiment === 'positive') {
      return analysis.category === 'joke' ? 'happy' : 'excited';
    }
    if (analysis.sentiment === 'negative') {
      return 'empathetic';
    }
    if (analysis.category === 'programming') {
      return 'thinking';
    }
    return 'neutral';
  }

  /**
   * Crea un análisis de fallback en caso de error
   */
  private createFallbackAnalysis(query: string): AIAnalysis {
    return {
      intent: 'general_inquiry',
      sentiment: 'neutral',
      confidence: 0.5,
      suggestedResponse: 'I understand you have a question. Let me help you with that.',
      context: [],
      userLevel: 'intermediate',
      urgency: 'medium',
      keywords: query.split(' ').slice(0, 3),
      category: 'general'
    };
  }

  /**
   * Crea una respuesta de fallback en caso de error
   */
  private createFallbackResponse(query: string, analysis: AIAnalysis): AIResponse {
    return {
      content: 'Disculpa, estoy teniendo dificultades para procesar tu consulta en este momento. ¿Podrías reformular tu pregunta sobre programación o CECADE?',
      confidence: 0.3,
      reasoning: 'Fallback response due to processing error',
      emotion: 'neutral',
      adaptedLevel: analysis.userLevel
    };
  }

  /**
   * Actualiza la configuración del servicio
   */
  updateConfig(newConfig: Partial<GeminiConfig>): void {
    this.config = { ...this.config, ...newConfig };
    if (newConfig.apiKey || newConfig.model) {
      this.genAI = new GoogleGenerativeAI(this.config.apiKey);
      this.model = this.genAI.getGenerativeModel({ model: this.config.model });
    }
  }

  /**
   * Actualiza la configuración de comportamiento
   */
  updateBehaviorConfig(newBehaviorConfig: Partial<AIBehaviorConfig>): void {
    this.behaviorConfig = { ...this.behaviorConfig, ...newBehaviorConfig };
  }

  /**
   * Obtiene las métricas del servicio
   */
  getMetrics(): AIMetrics {
    return { ...this.metrics };
  }

  /**
   * Obtiene el estado actual del servicio
   */
  getServiceStatus(): AIServiceStatus {
    return {
      isConnected: !!this.genAI,
      isProcessing: false, // TODO: Implementar seguimiento de estado de procesamiento
      modelVersion: this.config.model,
      uptime: Date.now() - this.startTime,
      behaviorConfig: this.behaviorConfig,
      promptTemplatesCount: this.promptTemplates.size,
      responseTime: this.metrics.averageResponseTime
    };
  }
}

// Instancia singleton del servicio
let geminiServiceInstance: GeminiAIService | null = null;

/**
 * Factory function para crear o obtener la instancia del servicio
 */
export function createGeminiAIService(
  config: GeminiConfig,
  behaviorConfig: AIBehaviorConfig
): GeminiAIService {
  if (!geminiServiceInstance) {
    geminiServiceInstance = new GeminiAIService(config, behaviorConfig);
  }
  return geminiServiceInstance;
}

/**
 * Obtiene la instancia actual del servicio
 */
export function getGeminiAIService(): GeminiAIService | null {
  return geminiServiceInstance;
}