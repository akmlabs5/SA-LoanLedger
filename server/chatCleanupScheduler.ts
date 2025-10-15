import type { IStorage } from "./storage";

export class ChatCleanupScheduler {
  private storage: IStorage;
  private intervalId: NodeJS.Timeout | null = null;
  private isRunning: boolean = false;

  constructor(storage: IStorage) {
    this.storage = storage;
  }

  /**
   * Start the chat cleanup scheduler
   * Checks for old conversations to delete every 24 hours
   */
  start(): void {
    if (this.isRunning) {
      console.log('🧹 Chat cleanup scheduler is already running');
      return;
    }

    console.log('🧹 Starting chat cleanup scheduler - checking every 24 hours');
    this.isRunning = true;

    // Run immediately on start
    this.cleanupOldConversations();

    // Then run every 24 hours
    this.intervalId = setInterval(() => {
      this.cleanupOldConversations();
    }, 24 * 60 * 60 * 1000); // 24 hours
  }

  /**
   * Stop the chat cleanup scheduler
   */
  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      this.isRunning = false;
      console.log('🧹 Chat cleanup scheduler stopped');
    }
  }

  /**
   * Delete conversations older than 30 days
   */
  private async cleanupOldConversations(): Promise<void> {
    try {
      const now = new Date();
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      console.log(`🧹 Checking for chat conversations older than ${thirtyDaysAgo.toISOString()}`);

      // Query database directly for old conversations
      const { chatConversations } = await import('@shared/schema');
      const { db } = await import('./db');
      const { lte } = await import('drizzle-orm');

      const oldConversations = await db
        .select()
        .from(chatConversations)
        .where(
          lte(chatConversations.createdAt, thirtyDaysAgo)
        );

      if (oldConversations.length === 0) {
        console.log('✅ No old conversations to clean up');
        return;
      }

      console.log(`🗑️  Found ${oldConversations.length} conversation(s) to delete`);

      // Delete each old conversation
      const { eq } = await import('drizzle-orm');
      for (const conversation of oldConversations) {
        try {
          await db
            .delete(chatConversations)
            .where(eq(chatConversations.id, conversation.id));
          
          console.log(`✅ Deleted conversation: ${conversation.title} (${conversation.id})`);
        } catch (error) {
          console.error(`❌ Error deleting conversation ${conversation.id}:`, error);
          // Continue processing other conversations even if one fails
        }
      }

      console.log(`✅ Finished cleaning up old conversations`);
    } catch (error) {
      console.error('❌ Error in chat cleanup scheduler:', error);
    }
  }
}
