/**
 * LangGraph Agentic System for Language Tutoring
 * Uses LangGraph for stateful, multi-step agentic workflows
 * December 2025 - Latest agentic AI architecture
 */

import { StateGraph, END } from '@langchain/langgraph';
import { ChatOpenAI } from '@langchain/openai';
import { HumanMessage, AIMessage, SystemMessage } from '@langchain/core/messages';
import { searchKnowledgeBase, getConversationContext } from './rag';
import { prisma } from './db';
import { env } from '$env/dynamic/private';

// Agent State Definition
interface AgentState {
  messages: Array<HumanMessage | AIMessage | SystemMessage>;
  userId: string;
  lessonId?: string;
  conversationId?: string;
  context?: string;
  corrections?: string[];
  vocabulary?: string[];
  nextAction?: 'respond' | 'correct' | 'explain' | 'quiz' | 'end';
}

/**
 * Initialize the LLM (using free Gemini tier by default, OpenAI as fallback)
 */
function initializeLLM() {
  // Prefer free Gemini tier for cost-effectiveness
  if (env.GEMINI_API_KEY) {
    // Note: Using ChatOpenAI with base_url for Gemini compatibility
    return new ChatOpenAI({
      modelName: 'gemini-1.5-flash',
      temperature: 0.7,
      maxTokens: 200,
    });
  } else if (env.OPENAI_API_KEY) {
    return new ChatOpenAI({
      modelName: 'gpt-4-turbo-preview',
      temperature: 0.7,
      maxTokens: 200,
    });
  }
  throw new Error('No AI provider configured. Set GEMINI_API_KEY (free tier) or OPENAI_API_KEY');
}

/**
 * Node: Retrieve Context
 * Fetches relevant context from RAG system and user progress
 */
async function retrieveContext(state: AgentState): Promise<Partial<AgentState>> {
  console.log('🔍 Agent: Retrieving context...');
  
  const lastUserMessage = state.messages
    .filter(m => m instanceof HumanMessage)
    .slice(-1)[0];
  
  const userMessage = lastUserMessage?.content.toString() || '';
  
  // Get RAG context
  const context = await getConversationContext(
    state.userId,
    state.lessonId,
    userMessage
  );
  
  // Search knowledge base for relevant information
  const relevantKnowledge = await searchKnowledgeBase(userMessage, {
    limit: 3,
    threshold: 0.75,
  });
  
  const knowledgeContext = relevantKnowledge
    .map(item => `- ${item.title}: ${item.content.substring(0, 150)}...`)
    .join('\n');
  
  const fullContext = `${context}\n\nRelevant Knowledge:\n${knowledgeContext}`;
  
  return {
    context: fullContext,
    nextAction: 'respond',
  };
}

/**
 * Node: Analyze User Input
 * Determines what action the agent should take
 */
async function analyzeInput(state: AgentState): Promise<Partial<AgentState>> {
  console.log('🧠 Agent: Analyzing user input...');
  
  const lastUserMessage = state.messages
    .filter(m => m instanceof HumanMessage)
    .slice(-1)[0];
  
  const userMessage = lastUserMessage?.content.toString().toLowerCase() || '';
  
  // Determine next action based on user input
  let nextAction: AgentState['nextAction'] = 'respond';
  
  if (userMessage.includes('correct') || userMessage.includes('korrigier')) {
    nextAction = 'correct';
  } else if (userMessage.includes('explain') || userMessage.includes('erkläre')) {
    nextAction = 'explain';
  } else if (userMessage.includes('quiz') || userMessage.includes('test')) {
    nextAction = 'quiz';
  } else if (userMessage.includes('bye') || userMessage.includes('tschüss')) {
    nextAction = 'end';
  }
  
  return { nextAction };
}

/**
 * Node: Generate Response
 * Main response generation using LLM with context
 */
async function generateResponse(state: AgentState): Promise<Partial<AgentState>> {
  console.log('💬 Agent: Generating response...');
  
  const llm = initializeLLM();
  
  // Build system prompt with context
  const systemPrompt = new SystemMessage(`You are a friendly German language tutor.

Context:
${state.context || 'No specific context available.'}

Guidelines:
- Respond primarily in German, unless asked for English
- Keep responses concise (2-3 sentences)
- Provide corrections gently
- Ask follow-up questions to continue conversation
- Use simple vocabulary for beginners
- Reference the user's learning progress when relevant

If the user makes mistakes, correct them using this format:
✓ [Correct version] - [Brief explanation]`);
  
  // Add system prompt to messages
  const messagesWithSystem = [systemPrompt, ...state.messages];
  
  // Generate response
  const response = await llm.invoke(messagesWithSystem);
  
  // Extract corrections if present
  const corrections: string[] = [];
  const correctionRegex = /✓\s*([^-]+)\s*-\s*([^.!?]+[.!?])/g;
  let match;
  const responseText = response.content.toString();
  
  while ((match = correctionRegex.exec(responseText)) !== null) {
    corrections.push(`${match[1].trim()}: ${match[2].trim()}`);
  }
  
  return {
    messages: [...state.messages, new AIMessage(responseText)],
    corrections: corrections.length > 0 ? corrections : undefined,
  };
}

/**
 * Node: Provide Correction
 * Specialized correction mode
 */
async function provideCorrection(state: AgentState): Promise<Partial<AgentState>> {
  console.log('✏️ Agent: Providing correction...');
  
  const llm = initializeLLM();
  
  const lastUserMessage = state.messages
    .filter(m => m instanceof HumanMessage)
    .slice(-1)[0];
  
  const correctionPrompt = new SystemMessage(`You are a German language expert. Analyze the following German text and provide:
1. Corrections for any grammar or spelling mistakes
2. Brief explanations
3. The correct version

Format:
✓ [Correct version] - [Explanation]

Be encouraging and supportive.`);
  
  const response = await llm.invoke([correctionPrompt, lastUserMessage]);
  
  return {
    messages: [...state.messages, new AIMessage(response.content.toString())],
    nextAction: 'respond',
  };
}

/**
 * Node: Explain Concept
 * Provides detailed explanations
 */
async function explainConcept(state: AgentState): Promise<Partial<AgentState>> {
  console.log('📚 Agent: Explaining concept...');
  
  const llm = initializeLLM();
  
  const lastUserMessage = state.messages
    .filter(m => m instanceof HumanMessage)
    .slice(-1)[0];
  
  const explanationPrompt = new SystemMessage(`You are a German language teacher. Provide a clear, detailed explanation in both German and English.

Context:
${state.context || ''}

Keep explanation concise but comprehensive. Use examples.`);
  
  const response = await llm.invoke([explanationPrompt, lastUserMessage]);
  
  return {
    messages: [...state.messages, new AIMessage(response.content.toString())],
    nextAction: 'respond',
  };
}

/**
 * Node: Create Quiz
 * Generates quiz questions for practice
 */
async function createQuiz(state: AgentState): Promise<Partial<AgentState>> {
  console.log('🎯 Agent: Creating quiz...');
  
  const llm = initializeLLM();
  
  const quizPrompt = new SystemMessage(`Create a short German language quiz (2-3 questions) based on:
${state.context || 'General German knowledge'}

Format each question clearly and provide the expected answer format.
Make it engaging and appropriate for the user's level.`);
  
  const response = await llm.invoke([quizPrompt, new HumanMessage('Create a quiz for me')]);
  
  return {
    messages: [...state.messages, new AIMessage(response.content.toString())],
    nextAction: 'respond',
  };
}

/**
 * Router: Determines next node based on state
 */
function routeNext(state: AgentState): string {
  const action = state.nextAction || 'respond';
  
  switch (action) {
    case 'correct':
      return 'correction';
    case 'explain':
      return 'explanation';
    case 'quiz':
      return 'quiz';
    case 'end':
      return END;
    default:
      return 'response';
  }
}

/**
 * Build the LangGraph Agent
 */
export function buildLanguageTutorAgent() {
  const workflow = new StateGraph<AgentState>({
    channels: {
      messages: {
        value: (x: AgentState['messages'], y: AgentState['messages']) => x.concat(y),
        default: () => [],
      },
      userId: {
        value: (x?: string, y?: string) => y ?? x ?? '',
        default: () => '',
      },
      lessonId: {
        value: (x?: string, y?: string) => y ?? x,
        default: () => undefined,
      },
      conversationId: {
        value: (x?: string, y?: string) => y ?? x,
        default: () => undefined,
      },
      context: {
        value: (x?: string, y?: string) => y ?? x,
        default: () => undefined,
      },
      corrections: {
        value: (x?: string[], y?: string[]) => y ?? x,
        default: () => undefined,
      },
      vocabulary: {
        value: (x?: string[], y?: string[]) => y ?? x,
        default: () => undefined,
      },
      nextAction: {
        value: (x?: AgentState['nextAction'], y?: AgentState['nextAction']) => y ?? x,
        default: () => 'respond',
      },
    },
  });
  
  // Add nodes
  workflow.addNode('context', retrieveContext);
  workflow.addNode('analyze', analyzeInput);
  workflow.addNode('response', generateResponse);
  workflow.addNode('correction', provideCorrection);
  workflow.addNode('explanation', explainConcept);
  workflow.addNode('quiz', createQuiz);
  
  // Add edges
  workflow.addEdge('__start__', 'context');
  workflow.addEdge('context', 'analyze');
  workflow.addConditionalEdges('analyze', routeNext, {
    response: 'response',
    correction: 'correction',
    explanation: 'explanation',
    quiz: 'quiz',
    [END]: END,
  });
  workflow.addEdge('response', END);
  workflow.addEdge('correction', END);
  workflow.addEdge('explanation', END);
  workflow.addEdge('quiz', END);
  
  return workflow.compile();
}

/**
 * Execute the agent for a user message
 */
export async function executeLanguageTutorAgent(
  userId: string,
  userMessage: string,
  lessonId?: string,
  conversationId?: string
): Promise<{
  response: string;
  corrections?: string[];
  conversationId: string;
}> {
  console.log('🤖 Starting LangGraph Agent...');
  
  const agent = buildLanguageTutorAgent();
  
  // Initialize state
  const initialState: AgentState = {
    messages: [new HumanMessage(userMessage)],
    userId,
    lessonId,
    conversationId,
  };
  
  // Execute agent
  const result = await agent.invoke(initialState);
  
  // Extract AI response
  const aiMessages = result.messages.filter(m => m instanceof AIMessage);
  const lastAIMessage = aiMessages[aiMessages.length - 1];
  const response = lastAIMessage?.content.toString() || 'Entschuldigung, ich konnte nicht antworten.';
  
  // Save to conversation history
  const convId = conversationId || `conv_${Date.now()}`;
  
  // Save messages to database
  try {
    // Create conversation if needed
    if (!conversationId) {
      await prisma.conversation.create({
        data: {
          id: convId,
          userId,
          lessonId,
        },
      });
    }
    
    // Save user message
    await prisma.conversationMessage.create({
      data: {
        id: `msg_${Date.now()}_1`,
        conversationId: convId,
        role: 'user',
        content: userMessage,
      },
    });
    
    // Save AI response
    await prisma.conversationMessage.create({
      data: {
        id: `msg_${Date.now()}_2`,
        conversationId: convId,
        role: 'ai',
        content: response,
        metadata: result.corrections ? JSON.stringify({ corrections: result.corrections }) : null,
      },
    });
  } catch (error) {
    console.error('Error saving conversation:', error);
  }
  
  return {
    response,
    corrections: result.corrections,
    conversationId: convId,
  };
}
