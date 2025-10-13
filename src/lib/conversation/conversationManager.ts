import { Message, ConversationState } from '@/components/ConversationalFlow';
import { Question, QuestionGenerator } from '@/lib/ai/questionGenerator';

export interface ConversationHistory {
  sessionId: string;
  messages: Message[];
  userData: Record<string, any>;
  startTime: Date;
  lastActivity: Date;
  status: 'active' | 'paused' | 'completed' | 'abandoned';
  progress: number;
  undoStack: ConversationSnapshot[];
  redoStack: ConversationSnapshot[];
}

interface ConversationSnapshot {
  timestamp: Date;
  userData: Record<string, any>;
  messages: Message[];
  questionId: string | null;
}

export class ConversationManager {
  private conversations: Map<string, ConversationHistory> = new Map();
  private questionGenerator: QuestionGenerator;
  private autoSaveInterval: NodeJS.Timeout | null = null;
  private storageKey = 'wf_genai_conversations';

  constructor(useAI: boolean = false) {
    this.questionGenerator = new QuestionGenerator(useAI);
    this.loadFromStorage();
    this.startAutoSave();
  }

  /**
   * Create a new conversation session
   */
  createSession(sessionId?: string): string {
    const id = sessionId || this.generateSessionId();
    const now = new Date();

    const history: ConversationHistory = {
      sessionId: id,
      messages: [],
      userData: {},
      startTime: now,
      lastActivity: now,
      status: 'active',
      progress: 0,
      undoStack: [],
      redoStack: [],
    };

    this.conversations.set(id, history);
    this.saveToStorage();

    return id;
  }

  /**
   * Get conversation by session ID
   */
  getConversation(sessionId: string): ConversationHistory | undefined {
    return this.conversations.get(sessionId);
  }

  /**
   * Add message to conversation
   */
  addMessage(
    sessionId: string,
    type: Message['type'],
    content: string,
    metadata?: Message['metadata']
  ): Message {
    const conversation = this.conversations.get(sessionId);
    if (!conversation) {
      throw new Error(`Conversation ${sessionId} not found`);
    }

    const message: Message = {
      id: this.generateMessageId(),
      type,
      content,
      timestamp: new Date(),
      metadata,
    };

    conversation.messages.push(message);
    conversation.lastActivity = new Date();

    this.saveToStorage();
    return message;
  }

  /**
   * Process user response and generate next question
   */
  async processUserResponse(
    sessionId: string,
    response: string,
    currentQuestionId?: string
  ): Promise<{
    nextQuestion: Question | null;
    validation: { valid: boolean; error?: string };
    followUpPrompt?: string;
  }> {
    const conversation = this.conversations.get(sessionId);
    if (!conversation) {
      throw new Error(`Conversation ${sessionId} not found`);
    }

    // Create snapshot for undo
    this.createSnapshot(sessionId, currentQuestionId);

    // Store user response if question ID provided
    if (currentQuestionId) {
      const question = this.questionGenerator.getQuestionById(currentQuestionId);

      // Validate answer
      if (question) {
        const validation = this.questionGenerator.validateAnswer(question, response);
        if (!validation.valid) {
          return {
            nextQuestion: question,
            validation,
          };
        }

        // Check for intelligent prompting
        const followUpPrompt = this.questionGenerator.getFollowUpPrompt(question, response);
        if (followUpPrompt) {
          return {
            nextQuestion: question,
            validation: { valid: true },
            followUpPrompt,
          };
        }
      }

      conversation.userData[currentQuestionId] = response;
    }

    // Build conversation history for AI context
    const conversationHistory = conversation.messages
      .filter(msg => msg.type !== 'system')
      .map(msg => ({
        role: msg.type === 'user' ? 'user' : 'assistant',
        content: msg.content
      }));

    // Generate next question with full conversation context
    const nextQuestion = await this.questionGenerator.generateNextQuestion(
      conversation.userData,
      undefined,
      conversationHistory
    );

    // Update progress
    const progress = this.questionGenerator.calculateProgress(conversation.userData);
    conversation.progress = progress.percentage;

    // Check if conversation is complete
    if (!nextQuestion || progress.percentage === 100) {
      conversation.status = 'completed';
    }

    conversation.lastActivity = new Date();
    this.saveToStorage();

    return {
      nextQuestion,
      validation: { valid: true },
    };
  }

  /**
   * Undo last user input
   */
  undo(sessionId: string): boolean {
    const conversation = this.conversations.get(sessionId);
    if (!conversation || conversation.undoStack.length === 0) {
      return false;
    }

    // Save current state to redo stack
    const currentSnapshot: ConversationSnapshot = {
      timestamp: new Date(),
      userData: { ...conversation.userData },
      messages: [...conversation.messages],
      questionId: null,
    };
    conversation.redoStack.push(currentSnapshot);

    // Restore previous state
    const previousSnapshot = conversation.undoStack.pop()!;
    conversation.userData = previousSnapshot.userData;
    conversation.messages = previousSnapshot.messages;

    this.saveToStorage();
    return true;
  }

  /**
   * Redo previously undone input
   */
  redo(sessionId: string): boolean {
    const conversation = this.conversations.get(sessionId);
    if (!conversation || conversation.redoStack.length === 0) {
      return false;
    }

    // Save current state to undo stack
    const currentSnapshot: ConversationSnapshot = {
      timestamp: new Date(),
      userData: { ...conversation.userData },
      messages: [...conversation.messages],
      questionId: null,
    };
    conversation.undoStack.push(currentSnapshot);

    // Restore next state
    const nextSnapshot = conversation.redoStack.pop()!;
    conversation.userData = nextSnapshot.userData;
    conversation.messages = nextSnapshot.messages;

    this.saveToStorage();
    return true;
  }

  /**
   * Create snapshot for undo functionality
   */
  private createSnapshot(sessionId: string, questionId: string | null): void {
    const conversation = this.conversations.get(sessionId);
    if (!conversation) return;

    const snapshot: ConversationSnapshot = {
      timestamp: new Date(),
      userData: { ...conversation.userData },
      messages: [...conversation.messages],
      questionId,
    };

    conversation.undoStack.push(snapshot);

    // Limit undo stack size
    if (conversation.undoStack.length > 10) {
      conversation.undoStack.shift();
    }

    // Clear redo stack on new action
    conversation.redoStack = [];
  }

  /**
   * Pause conversation
   */
  pauseConversation(sessionId: string): void {
    const conversation = this.conversations.get(sessionId);
    if (conversation) {
      conversation.status = 'paused';
      this.saveToStorage();
    }
  }

  /**
   * Resume conversation
   */
  resumeConversation(sessionId: string): void {
    const conversation = this.conversations.get(sessionId);
    if (conversation && conversation.status === 'paused') {
      conversation.status = 'active';
      conversation.lastActivity = new Date();
      this.saveToStorage();
    }
  }

  /**
   * Get conversation progress
   */
  getProgress(sessionId: string): {
    percentage: number;
    completedCategories: string[];
    remainingCategories: string[];
  } | null {
    const conversation = this.conversations.get(sessionId);
    if (!conversation) return null;

    return this.questionGenerator.calculateProgress(conversation.userData);
  }

  /**
   * Classify AI task
   */
  classifyTask(sessionId: string): string | null {
    const conversation = this.conversations.get(sessionId);
    if (!conversation) return null;

    return this.questionGenerator.classifyAITask(conversation.userData);
  }

  /**
   * Save conversations to local storage
   */
  private saveToStorage(): void {
    if (typeof window === 'undefined') return;

    const data = Array.from(this.conversations.entries()).map(([id, conv]) => ({
      id,
      ...conv,
    }));

    try {
      localStorage.setItem(this.storageKey, JSON.stringify(data));
    } catch (error) {
      console.error('Failed to save conversations:', error);
    }
  }

  /**
   * Load conversations from local storage
   */
  private loadFromStorage(): void {
    if (typeof window === 'undefined') return;

    try {
      const data = localStorage.getItem(this.storageKey);
      if (data) {
        const conversations = JSON.parse(data);
        conversations.forEach((conv: any) => {
          // Convert date strings back to Date objects
          conv.startTime = new Date(conv.startTime);
          conv.lastActivity = new Date(conv.lastActivity);
          conv.messages = conv.messages.map((msg: any) => ({
            ...msg,
            timestamp: new Date(msg.timestamp),
          }));

          this.conversations.set(conv.id, conv);
        });
      }
    } catch (error) {
      console.error('Failed to load conversations:', error);
    }
  }

  /**
   * Start auto-save timer
   */
  private startAutoSave(): void {
    if (typeof window === 'undefined') return;

    this.autoSaveInterval = setInterval(() => {
      this.saveToStorage();
    }, 30000); // Auto-save every 30 seconds
  }

  /**
   * Stop auto-save timer
   */
  stopAutoSave(): void {
    if (this.autoSaveInterval) {
      clearInterval(this.autoSaveInterval);
      this.autoSaveInterval = null;
    }
  }

  /**
   * Get active conversations
   */
  getActiveSessions(): ConversationHistory[] {
    return Array.from(this.conversations.values()).filter(
      conv => conv.status === 'active'
    );
  }

  /**
   * Get paused conversations
   */
  getPausedSessions(): ConversationHistory[] {
    return Array.from(this.conversations.values()).filter(
      conv => conv.status === 'paused'
    );
  }

  /**
   * Clean up abandoned sessions
   */
  cleanupAbandonedSessions(maxInactivityMinutes: number = 60): void {
    const now = new Date();
    const maxInactivity = maxInactivityMinutes * 60 * 1000;

    Array.from(this.conversations.entries()).forEach(([id, conv]) => {
      const inactivityTime = now.getTime() - conv.lastActivity.getTime();
      if (conv.status === 'active' && inactivityTime > maxInactivity) {
        conv.status = 'abandoned';
      }
    });

    this.saveToStorage();
  }

  /**
   * Export conversation data
   */
  exportConversation(sessionId: string): string | null {
    const conversation = this.conversations.get(sessionId);
    if (!conversation) return null;

    return JSON.stringify(conversation, null, 2);
  }

  /**
   * Generate unique session ID
   */
  private generateSessionId(): string {
    return `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Generate unique message ID
   */
  private generateMessageId(): string {
    return `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Clear all conversations
   */
  clearAll(): void {
    this.conversations.clear();
    if (typeof window !== 'undefined') {
      localStorage.removeItem(this.storageKey);
    }
  }

  /**
   * Get conversation statistics
   */
  getStatistics(): {
    total: number;
    active: number;
    completed: number;
    abandoned: number;
    averageProgress: number;
  } {
    const sessions = Array.from(this.conversations.values());

    return {
      total: sessions.length,
      active: sessions.filter(s => s.status === 'active').length,
      completed: sessions.filter(s => s.status === 'completed').length,
      abandoned: sessions.filter(s => s.status === 'abandoned').length,
      averageProgress: sessions.reduce((acc, s) => acc + s.progress, 0) / sessions.length || 0,
    };
  }
}

export default ConversationManager;