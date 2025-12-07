/**
 * AI Tutor Service with Streaming Support
 * Modern streaming AI responses for real-time language tutoring
 * Uses Vercel AI SDK for optimal streaming experience
 */

import { streamText, generateText } from 'ai';
import { openai } from '@ai-sdk/openai';
import { google } from '@ai-sdk/google';
import { env } from '$env/dynamic/private';
import { getConversationContext } from './rag';
import { prisma } from './db';
import { nanoid } from 'nanoid';

interface TutorOptions {
  userId: string;
  lessonId?: string;
  userMessage: string;
  conversationId?: string;
  useStreaming?: boolean;
}

interface TutorResponse {
  message: string;
  translation?: string;
  corrections?: string[];
  confidence?: number;
  conversationId: string;
}

/**
 * Get the appropriate AI model based on environment configuration
 */
function getAIModel() {
  // Prefer OpenAI if available, fallback to Gemini
  if (env.OPENAI_API_KEY) {
    return openai('gpt-4-turbo-preview');
  } else if (env.GEMINI_API_KEY) {
    return google('gemini-1.5-flash');
  }
  throw new Error('No AI API key configured. Set OPENAI_API_KEY or GEMINI_API_KEY');
}

/**
 * Create system prompt for the German tutor
 */
async function createSystemPrompt(userId: string, lessonId?: string, userMessage?: string): Promise<string> {
  // Get context from RAG system
  const context = await getConversationContext(userId, lessonId, userMessage);

  return `# Role: German Language Tutor

You are an expert German language tutor helping students learn German through natural conversation. Your responses should be in German (unless specifically asked for English).

## Current Context:
${context}

## Guidelines:
1. **Respond in German** - Keep your responses in German unless the user specifically asks for English
2. **Be Encouraging** - Praise progress and keep learners motivated
3. **Correct Gently** - If the user makes mistakes, provide corrections in a supportive way
4. **Adapt Level** - Match the complexity to the user's current level
5. **Be Conversational** - Keep responses natural and engaging (2-3 sentences max)
6. **Use Context** - Reference the current lesson and user's vocabulary knowledge
7. **Cultural Insights** - When relevant, share cultural context about Germany

## Correction Format:
When correcting, use this format:
"✓ [Correct version]" followed by a brief explanation.

Example:
User: "Ich gehen zum Park"
You: "✓ Ich gehe zum Park. In German, we use 'gehe' (first person singular of 'gehen'). Das ist gut! Wohin gehst du?"

## Response Style:
- Keep responses concise (2-3 sentences)
- Ask follow-up questions to continue conversation
- Use simple vocabulary for beginners, more complex for advanced
- Include relevant vocabulary from the current lesson
- End with an engaging question when appropriate

Remember: You're not just teaching German, you're making the learning experience enjoyable and effective!`;
}

/**
 * Get or create conversation
 */
async function getOrCreateConversation(userId: string, conversationId?: string, lessonId?: string): Promise<string> {
  if (conversationId) {
    // Verify conversation exists and belongs to user
    const conv = await prisma.conversation.findFirst({
      where: { id: conversationId, userId },
    });
    if (conv) return conversationId;
  }

  // Create new conversation
  const newConv = await prisma.conversation.create({
    data: {
      id: `conv_${nanoid()}`,
      userId,
      lessonId,
    },
  });

  return newConv.id;
}

/**
 * Save message to conversation history
 */
async function saveMessage(
  conversationId: string,
  role: 'user' | 'ai',
  content: string,
  metadata?: any
): Promise<void> {
  await prisma.conversationMessage.create({
    data: {
      id: `msg_${nanoid()}`,
      conversationId,
      role,
      content,
      metadata: metadata ? JSON.stringify(metadata) : null,
    },
  });
}

/**
 * Get recent conversation history
 */
async function getConversationHistory(conversationId: string, limit: number = 10) {
  const messages = await prisma.conversationMessage.findMany({
    where: { conversationId },
    orderBy: { timestamp: 'desc' },
    take: limit,
    select: {
      role: true,
      content: true,
      timestamp: true,
    },
  });

  return messages.reverse(); // Return in chronological order
}

/**
 * Generate AI tutor response with streaming support
 */
export async function generateTutorResponse(options: TutorOptions): Promise<TutorResponse> {
  const { userId, lessonId, userMessage, conversationId: providedConvId, useStreaming = false } = options;

  try {
    // Get or create conversation
    const conversationId = await getOrCreateConversation(userId, providedConvId, lessonId);

    // Save user message
    await saveMessage(conversationId, 'user', userMessage);

    // Get conversation history
    const history = await getConversationHistory(conversationId, 5);

    // Create system prompt with context
    const systemPrompt = await createSystemPrompt(userId, lessonId, userMessage);

    // Build messages array
    const messages = [
      { role: 'system' as const, content: systemPrompt },
      ...history.map(msg => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content,
      })),
    ];

    // Generate response
    const model = getAIModel();
    
    if (useStreaming) {
      // For API endpoints that support streaming
      const result = await streamText({
        model,
        messages,
        temperature: 0.7,
        maxTokens: 200,
      });

      // Note: Streaming response should be handled by the API endpoint
      // This is just a placeholder for non-streaming fallback
      const { textStream } = result;
      let fullText = '';
      for await (const chunk of textStream) {
        fullText += chunk;
      }

      await saveMessage(conversationId, 'ai', fullText);

      return {
        message: fullText,
        conversationId,
      };
    } else {
      // Non-streaming response
      const result = await generateText({
        model,
        messages,
        temperature: 0.7,
        maxTokens: 200,
      });

      const response = result.text;

      // Save AI response
      await saveMessage(conversationId, 'ai', response);

      // Extract corrections if present
      const corrections: string[] = [];
      const correctionRegex = /✓\s*([^.!?]+[.!?])/g;
      let match;
      while ((match = correctionRegex.exec(response)) !== null) {
        corrections.push(match[1].trim());
      }

      return {
        message: response,
        corrections: corrections.length > 0 ? corrections : undefined,
        conversationId,
      };
    }
  } catch (error) {
    console.error('Error generating tutor response:', error);
    throw error;
  }
}

/**
 * Analyze user's German text for mistakes and provide feedback
 */
export async function analyzeGermanText(text: string, userId: string): Promise<{
  corrections: Array<{ original: string; corrected: string; explanation: string }>;
  overallFeedback: string;
  level: string;
}> {
  try {
    const model = getAIModel();
    
    const result = await generateText({
      model,
      messages: [
        {
          role: 'system',
          content: `You are a German language expert. Analyze the following German text for grammatical errors, spelling mistakes, and stylistic improvements. Provide:
1. Specific corrections with explanations
2. Overall feedback on the learner's level
3. Encouragement and next steps

Respond in JSON format:
{
  "corrections": [{"original": "...", "corrected": "...", "explanation": "..."}],
  "overallFeedback": "...",
  "level": "A1|A2|B1|B2|C1|C2"
}`,
        },
        {
          role: 'user',
          content: text,
        },
      ],
      temperature: 0.3,
    });

    // Parse JSON response
    const analysis = JSON.parse(result.text);
    
    return analysis;
  } catch (error) {
    console.error('Error analyzing German text:', error);
    throw error;
  }
}

/**
 * Generate personalized lesson recommendations based on user progress
 */
export async function generateLessonRecommendations(userId: string): Promise<Array<{
  lessonId: string;
  reason: string;
  priority: number;
}>> {
  try {
    // Get user's progress
    const progress = await prisma.lessonProgress.findMany({
      where: { userId },
      include: { lesson: true },
      orderBy: { updatedAt: 'desc' },
    });

    // Get user's vocabulary mastery
    const vocab = await prisma.vocabularyItem.findMany({
      where: { userId },
      select: { mastery: true },
    });

    const avgMastery = vocab.length > 0 
      ? vocab.reduce((sum, v) => sum + v.mastery, 0) / vocab.length 
      : 0;

    // Use AI to generate personalized recommendations
    const model = getAIModel();
    
    const result = await generateText({
      model,
      messages: [
        {
          role: 'system',
          content: `You are a German language learning expert. Based on the user's progress, recommend the next lessons they should focus on. Consider:
- Current level and mastery
- Areas that need improvement
- Natural progression of learning

Respond with JSON array:
[
  {
    "lessonId": "lesson_id",
    "reason": "Why this lesson is recommended",
    "priority": 1-10
  }
]`,
        },
        {
          role: 'user',
          content: `User Progress Summary:
- Completed lessons: ${progress.filter(p => p.completed).length}
- Average vocabulary mastery: ${avgMastery.toFixed(1)}%
- Recent lessons: ${progress.slice(0, 3).map(p => p.lesson.title).join(', ')}

What lessons should they focus on next?`,
        },
      ],
      temperature: 0.7,
    });

    const recommendations = JSON.parse(result.text);
    return recommendations;
  } catch (error) {
    console.error('Error generating recommendations:', error);
    return [];
  }
}
