/**
 * RAG (Retrieval-Augmented Generation) Service
 * Smart knowledge retrieval for the language tutor
 * Uses embeddings for semantic search across lessons, grammar, and vocabulary
 */

import { openai } from '@ai-sdk/openai';
import { embed, embedMany } from 'ai';
import { prisma } from './db';

const EMBEDDING_MODEL = 'text-embedding-3-small';
const EMBEDDING_DIMENSIONS = 1536;

interface RetrievalResult {
  id: string;
  content: string;
  category: string;
  title: string;
  score: number;
  metadata?: any;
}

/**
 * Generate embedding for a text query
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  try {
    const { embedding } = await embed({
      model: openai.embedding(EMBEDDING_MODEL),
      value: text,
    });
    return embedding;
  } catch (error) {
    console.error('Error generating embedding:', error);
    throw error;
  }
}

/**
 * Generate embeddings for multiple texts
 */
export async function generateEmbeddings(texts: string[]): Promise<number[][]> {
  try {
    const { embeddings } = await embedMany({
      model: openai.embedding(EMBEDDING_MODEL),
      values: texts,
    });
    return embeddings;
  } catch (error) {
    console.error('Error generating embeddings:', error);
    throw error;
  }
}

/**
 * Calculate cosine similarity between two vectors
 */
function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) return 0;
  
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  
  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

/**
 * Search knowledge base using semantic similarity
 */
export async function searchKnowledgeBase(
  query: string,
  options: {
    category?: string;
    level?: string;
    limit?: number;
    threshold?: number;
  } = {}
): Promise<RetrievalResult[]> {
  const {
    category,
    level,
    limit = 5,
    threshold = 0.7,
  } = options;

  try {
    // Generate embedding for the query
    const queryEmbedding = await generateEmbedding(query);

    // Fetch relevant knowledge base items
    const where: any = {};
    if (category) where.category = category;
    if (level) where.level = level;

    const items = await prisma.knowledgeBase.findMany({
      where,
      select: {
        id: true,
        title: true,
        content: true,
        category: true,
        level: true,
        tags: true,
        embedding: true,
      },
    });

    // Calculate similarity scores
    const results: RetrievalResult[] = items
      .map((item) => {
        if (!item.embedding) return null;
        
        const itemEmbedding = JSON.parse(item.embedding);
        const score = cosineSimilarity(queryEmbedding, itemEmbedding);
        
        if (score < threshold) return null;
        
        return {
          id: item.id,
          content: item.content,
          category: item.category,
          title: item.title,
          score,
          metadata: {
            level: item.level,
            tags: JSON.parse(item.tags || '[]'),
          },
        };
      })
      .filter((item): item is RetrievalResult => item !== null)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);

    return results;
  } catch (error) {
    console.error('Error searching knowledge base:', error);
    return [];
  }
}

/**
 * Get relevant context for AI conversation
 * Combines lesson content, vocabulary, and grammar rules
 */
export async function getConversationContext(
  userId: string,
  lessonId?: string,
  userMessage?: string
): Promise<string> {
  const contextParts: string[] = [];

  // Get current lesson context
  if (lessonId) {
    const lesson = await prisma.lesson.findUnique({
      where: { id: lessonId },
      select: {
        title: true,
        topic: true,
        level: true,
        vocabulary: true,
        phrases: true,
        grammar: true,
      },
    });

    if (lesson) {
      contextParts.push(`Current Lesson: ${lesson.title} (${lesson.level})`);
      contextParts.push(`Topic: ${lesson.topic}`);
      
      const vocabulary = JSON.parse(lesson.vocabulary || '[]');
      if (vocabulary.length > 0) {
        contextParts.push(`Key Vocabulary: ${vocabulary.join(', ')}`);
      }
      
      const phrases = JSON.parse(lesson.phrases || '[]');
      if (phrases.length > 0) {
        contextParts.push(`Practice Phrases: ${phrases.join(', ')}`);
      }
    }
  }

  // Get user's vocabulary progress
  const userVocab = await prisma.vocabularyItem.findMany({
    where: { userId },
    orderBy: { mastery: 'desc' },
    take: 10,
    select: {
      word: true,
      mastery: true,
    },
  });

  if (userVocab.length > 0) {
    const masteredWords = userVocab.filter(v => v.mastery > 70).map(v => v.word);
    const learningWords = userVocab.filter(v => v.mastery <= 70).map(v => v.word);
    
    if (masteredWords.length > 0) {
      contextParts.push(`User has mastered: ${masteredWords.join(', ')}`);
    }
    if (learningWords.length > 0) {
      contextParts.push(`User is learning: ${learningWords.join(', ')}`);
    }
  }

  // If there's a user message, search for relevant knowledge
  if (userMessage) {
    const relevantKnowledge = await searchKnowledgeBase(userMessage, {
      level: lessonId ? undefined : 'A1', // Default to beginner if no lesson
      limit: 3,
      threshold: 0.75,
    });

    if (relevantKnowledge.length > 0) {
      contextParts.push('\nRelevant Knowledge:');
      relevantKnowledge.forEach((item) => {
        contextParts.push(`- ${item.title}: ${item.content.substring(0, 200)}...`);
      });
    }
  }

  return contextParts.join('\n');
}

/**
 * Add new knowledge to the knowledge base with embedding
 */
export async function addKnowledgeBase(
  data: {
    category: string;
    title: string;
    content: string;
    level: string;
    tags: string[];
  }
): Promise<void> {
  const { category, title, content, level, tags } = data;

  try {
    // Generate embedding for the content
    const embedding = await generateEmbedding(`${title}\n${content}`);

    // Store in database
    await prisma.knowledgeBase.create({
      data: {
        id: `kb_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        category,
        title,
        content,
        level,
        tags: JSON.stringify(tags),
        embedding: JSON.stringify(embedding),
      },
    });

    console.log(`Added knowledge base item: ${title}`);
  } catch (error) {
    console.error('Error adding to knowledge base:', error);
    throw error;
  }
}

/**
 * Seed initial knowledge base with German language learning content
 */
export async function seedKnowledgeBase(): Promise<void> {
  const knowledgeItems = [
    {
      category: 'grammar',
      title: 'German Word Order - Basic Sentence Structure',
      content: 'In German, the basic word order is Subject-Verb-Object (SVO), similar to English. However, the verb must always be in the second position. Example: "Ich trinke Wasser" (I drink water). When you start with something other than the subject, the verb still comes second: "Heute trinke ich Wasser" (Today drink I water = Today I drink water).',
      level: 'A1',
      tags: ['grammar', 'word-order', 'syntax', 'basics'],
    },
    {
      category: 'grammar',
      title: 'German Articles - Der, Die, Das',
      content: 'German nouns have three genders: masculine (der), feminine (die), and neuter (das). The gender affects the article and adjective endings. Common patterns: -ung, -heit, -keit endings are usually feminine. -chen, -lein endings are neuter. Days, months, and seasons are masculine.',
      level: 'A1',
      tags: ['grammar', 'articles', 'gender', 'nouns'],
    },
    {
      category: 'pronunciation',
      title: 'German Umlauts - ä, ö, ü',
      content: 'Umlauts modify vowel sounds. ä sounds like "e" in "bet". ö is pronounced with rounded lips while saying "e". ü is pronounced with rounded lips while saying "ee". Practice: Bär (bear), schön (beautiful), über (over).',
      level: 'A1',
      tags: ['pronunciation', 'umlauts', 'vowels'],
    },
    {
      category: 'vocabulary',
      title: 'Common German Greetings',
      content: 'Essential greetings: "Guten Morgen" (good morning, until ~10am), "Guten Tag" (good day, 10am-6pm), "Guten Abend" (good evening, after 6pm), "Hallo" (hello, informal), "Tschüss" (bye, informal), "Auf Wiedersehen" (goodbye, formal).',
      level: 'A1',
      tags: ['vocabulary', 'greetings', 'daily', 'basics'],
    },
    {
      category: 'culture',
      title: 'German Formal vs Informal Address',
      content: 'Germans distinguish between formal "Sie" and informal "du" for "you". Use "Sie" with strangers, in professional settings, and with people older than you. Use "du" with friends, family, children, and when invited. When in doubt, use "Sie" until the other person suggests "du".',
      level: 'A1',
      tags: ['culture', 'etiquette', 'social', 'formal'],
    },
  ];

  console.log('Seeding knowledge base...');
  
  for (const item of knowledgeItems) {
    try {
      await addKnowledgeBase(item);
    } catch (error) {
      console.error(`Failed to add item: ${item.title}`, error);
    }
  }
  
  console.log('Knowledge base seeding complete!');
}
