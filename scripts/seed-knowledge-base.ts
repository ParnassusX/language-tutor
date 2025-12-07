/**
 * Seed Knowledge Base Script
 * Populates the database with initial learning content and embeddings
 */

import { seedKnowledgeBase } from '../src/lib/server/rag';
import { prisma } from '../src/lib/server/db';

async function main() {
  console.log('🌱 Seeding knowledge base with German learning content...');
  
  try {
    // Check if knowledge base is already seeded
    const count = await prisma.knowledgeBase.count();
    
    if (count > 0) {
      console.log(`📚 Knowledge base already has ${count} items`);
      const proceed = process.argv.includes('--force');
      
      if (!proceed) {
        console.log('Use --force to re-seed the knowledge base');
        return;
      }
      
      console.log('🗑️  Clearing existing knowledge base...');
      await prisma.knowledgeBase.deleteMany({});
    }
    
    await seedKnowledgeBase();
    
    const newCount = await prisma.knowledgeBase.count();
    console.log(`✅ Successfully seeded ${newCount} knowledge base items!`);
  } catch (error) {
    console.error('❌ Error seeding knowledge base:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main();
