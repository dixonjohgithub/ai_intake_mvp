import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import styles from './ConversationalFlow.module.css';
import {
  QUESTION_FLOW,
  getNextQuestion,
  getCurrentStep,
  validateResponse,
  calculateOverallProgress,
  getQuestionById,
} from '@/lib/conversation/questionConfig';
import { ConversationManager } from '@/lib/conversation/conversationManager';
import LoadingOverlay from './LoadingOverlay';

export interface Message {
  id: string;
  type: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  metadata?: {
    questionId?: string;
    category?: string;
    confidence?: number;
  };
}

export interface ConversationState {
  messages: Message[];
  currentQuestionId: string | null;
  userData: Record<string, any>;
  sessionId: string;
  startTime: Date;
  lastActivity: Date;
}

interface ConversationalFlowDualProps {
  onComplete?: (data: Record<string, any>) => void;
  onSave?: (state: ConversationState) => void;
  onProgressUpdate?: (step: number, overallProgress: number) => void;
  initialState?: Partial<ConversationState>;
  useAI?: boolean; // Control whether to use LLM or static questions
  conversationManager?: ConversationManager; // Pass in the conversation manager
}

const generateSessionId = () => {
  return `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

const ConversationalFlowDual: React.FC<ConversationalFlowDualProps> = ({
  onComplete,
  onSave,
  onProgressUpdate,
  initialState,
  useAI = false,
  conversationManager,
}) => {
  const [messages, setMessages] = useState<Message[]>(initialState?.messages || []);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [currentQuestionId, setCurrentQuestionId] = useState<string | null>(null);
  const [userData, setUserData] = useState<Record<string, any>>(initialState?.userData || {});
  const [completedQuestions, setCompletedQuestions] = useState<string[]>([]);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [sessionId] = useState(initialState?.sessionId || generateSessionId());
  const [isProcessing, setIsProcessing] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const hasInitializedRef = useRef(false);
  const messagesRef = useRef<Message[]>([]);

  // Track current question index for static mode
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

  // V2 API State - Track question number and follow-ups
  const [currentQuestionNumber, setCurrentQuestionNumber] = useState(1);
  const [followUpCount, setFollowUpCount] = useState(0);
  const [isFollowUp, setIsFollowUp] = useState(false);
  const [missingCriteria, setMissingCriteria] = useState<string[]>([]);

  // Loading overlay state
  const [showLoadingOverlay, setShowLoadingOverlay] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState('Processing your response...');
  const [loadingProgress, setLoadingProgress] = useState(0);

  // Auto-scroll to bottom when new messages arrive (but not on initial mount)
  useEffect(() => {
    // Skip scrolling on initial mount to preserve page position
    if (messages.length > 1) {
      scrollToBottom();
    }
  }, [messages]);

  // Focus input on mount with preventScroll to avoid jumping
  useEffect(() => {
    // Add a slight delay to ensure page has scrolled to top first
    setTimeout(() => {
      inputRef.current?.focus({ preventScroll: true });
    }, 200);
  }, []);

  const scrollToBottom = () => {
    if (messagesEndRef.current && messagesEndRef.current.scrollIntoView) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const addMessage = (type: Message['type'], content: string, metadata?: Message['metadata']) => {
    const newMessage: Message = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type,
      content,
      timestamp: new Date(),
      metadata,
    };

    setMessages(prev => {
      const updated = [...prev, newMessage];
      messagesRef.current = updated; // Keep ref in sync with state
      return updated;
    });

    // Don't duplicate messages in conversation manager - it handles its own storage
    // The conversation manager's messages are passed in through initialState

    return newMessage;
  };

  const generateDataSourceSuggestions = (problemDescription: string, businessProblem: string): string => {
    const suggestions: string[] = [];
    const lowerDesc = (problemDescription + ' ' + businessProblem).toLowerCase();

    // Analyze the problem to suggest appropriate data sources
    if (lowerDesc.includes('customer') || lowerDesc.includes('user') || lowerDesc.includes('client')) {
      suggestions.push('Customer relationship management (CRM) systems');
      suggestions.push('Customer interaction logs and support tickets');
    }

    if (lowerDesc.includes('transaction') || lowerDesc.includes('payment') || lowerDesc.includes('financial')) {
      suggestions.push('Transaction databases');
      suggestions.push('Financial systems and ledgers');
    }

    if (lowerDesc.includes('document') || lowerDesc.includes('text') || lowerDesc.includes('report')) {
      suggestions.push('Document management systems');
      suggestions.push('Unstructured text repositories');
    }

    if (lowerDesc.includes('product') || lowerDesc.includes('inventory') || lowerDesc.includes('catalog')) {
      suggestions.push('Product catalogs and inventory systems');
    }

    if (lowerDesc.includes('email') || lowerDesc.includes('communication') || lowerDesc.includes('message')) {
      suggestions.push('Email servers and communication platforms');
    }

    if (lowerDesc.includes('web') || lowerDesc.includes('online') || lowerDesc.includes('digital')) {
      suggestions.push('Web analytics and clickstream data');
      suggestions.push('Digital interaction logs');
    }

    // Default suggestions if no specific matches
    if (suggestions.length === 0) {
      suggestions.push('Structured databases (SQL/NoSQL)');
      suggestions.push('API endpoints for real-time data');
      suggestions.push('Historical data archives');
    }

    return `Based on your use case, I suggest the following data sources:\n\n${suggestions.map((s, i) => `${i + 1}. ${s}`).join('\n')}\n\nPlease respond with:\n- "Use suggestions" to accept these\n- Your modified list\n- Your own data sources`;
  };

  const generateIntegrationSuggestions = (problemDescription: string, targetUsers: string): string => {
    const suggestions: string[] = [];
    const lowerDesc = (problemDescription + ' ' + targetUsers).toLowerCase();

    // Common enterprise integrations
    suggestions.push('Authentication systems (SSO/Active Directory)');

    if (lowerDesc.includes('customer') || lowerDesc.includes('service') || lowerDesc.includes('support')) {
      suggestions.push('Customer service platforms (ServiceNow, Salesforce)');
    }

    if (lowerDesc.includes('data') || lowerDesc.includes('analytics') || lowerDesc.includes('report')) {
      suggestions.push('Data warehouses and BI tools');
      suggestions.push('Reporting dashboards');
    }

    if (lowerDesc.includes('workflow') || lowerDesc.includes('process') || lowerDesc.includes('automate')) {
      suggestions.push('Workflow management systems');
      suggestions.push('Business process management tools');
    }

    if (lowerDesc.includes('communicate') || lowerDesc.includes('collaborate') || lowerDesc.includes('team')) {
      suggestions.push('Collaboration tools (Teams, Slack)');
    }

    // Always include API gateway
    suggestions.push('API Gateway for secure access');
    suggestions.push('Monitoring and logging systems');

    return `Common integration points for your solution:\n\n${suggestions.map((s, i) => `${i + 1}. ${s}`).join('\n')}\n\nPlease respond with:\n- "Use suggestions" to accept these\n- Your modified list\n- Your specific integration requirements`;
  };

  const generateAISuggestions = (problemDescription: string, businessProblem: string): string => {
    // Generate AI/ML suggestions based on the user's problem description
    const suggestions: string[] = [];

    const lowerDesc = (problemDescription + ' ' + businessProblem).toLowerCase();

    // Analyze the problem to suggest appropriate AI capabilities
    if (lowerDesc.includes('text') || lowerDesc.includes('document') || lowerDesc.includes('chat') ||
        lowerDesc.includes('email') || lowerDesc.includes('message') || lowerDesc.includes('language')) {
      suggestions.push('Natural Language Processing (NLP) for text understanding and generation');
    }

    if (lowerDesc.includes('image') || lowerDesc.includes('photo') || lowerDesc.includes('visual') ||
        lowerDesc.includes('video') || lowerDesc.includes('scan')) {
      suggestions.push('Computer Vision for image/video analysis');
    }

    if (lowerDesc.includes('predict') || lowerDesc.includes('forecast') || lowerDesc.includes('estimate') ||
        lowerDesc.includes('future') || lowerDesc.includes('trend')) {
      suggestions.push('Predictive Analytics and Forecasting models');
    }

    if (lowerDesc.includes('classify') || lowerDesc.includes('categorize') || lowerDesc.includes('detect') ||
        lowerDesc.includes('identify') || lowerDesc.includes('recognize')) {
      suggestions.push('Classification and Pattern Recognition algorithms');
    }

    if (lowerDesc.includes('recommend') || lowerDesc.includes('suggest') || lowerDesc.includes('personalize')) {
      suggestions.push('Recommendation Systems for personalized suggestions');
    }

    if (lowerDesc.includes('automate') || lowerDesc.includes('process') || lowerDesc.includes('workflow')) {
      suggestions.push('Process Automation and Intelligent Workflow Management');
    }

    if (lowerDesc.includes('anomaly') || lowerDesc.includes('fraud') || lowerDesc.includes('unusual') ||
        lowerDesc.includes('outlier')) {
      suggestions.push('Anomaly Detection for identifying unusual patterns');
    }

    if (lowerDesc.includes('sentiment') || lowerDesc.includes('emotion') || lowerDesc.includes('feedback') ||
        lowerDesc.includes('opinion')) {
      suggestions.push('Sentiment Analysis for understanding opinions and emotions');
    }

    // If no specific matches, provide general suggestions
    if (suggestions.length === 0) {
      suggestions.push('Natural Language Processing (NLP)');
      suggestions.push('Machine Learning Classification/Regression');
      suggestions.push('Predictive Analytics');
    }

    return `Based on your problem description, I suggest the following AI/ML capabilities:\n\n${suggestions.map((s, i) => `${i + 1}. ${s}`).join('\n')}\n\nWould you like to use these suggestions, modify them, or provide your own? Please respond with either:\n- "Use suggestions" to accept these recommendations\n- Your modified version of the capabilities\n- Your own list of required AI/ML capabilities`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!inputValue.trim() || isProcessing) return;

    const userMessage = inputValue.trim();

    // Clear any previous validation errors
    setValidationError(null);

    // Check if user is asking for suggestions (works in both modes)
    if (userMessage.toLowerCase() === 'suggest') {
      setInputValue('');
      addMessage('user', userMessage);

      // Show typing indicator
      setIsTyping(true);

      setTimeout(() => {
        let suggestions = '';

        if (currentQuestionId === 'ai_capabilities') {
          // Generate AI/ML capability suggestions
          const problemDesc = userData['idea_description'] || '';
          const businessProb = userData['business_problem'] || '';
          suggestions = generateAISuggestions(problemDesc, businessProb);
        } else if (currentQuestionId === 'data_sources') {
          // Generate data source suggestions
          const problemDesc = userData['idea_description'] || '';
          const businessProb = userData['business_problem'] || '';
          suggestions = generateDataSourceSuggestions(problemDesc, businessProb);
        } else if (currentQuestionId === 'integration_requirements') {
          // Generate integration suggestions
          const problemDesc = userData['idea_description'] || '';
          const targetUsers = userData['target_users'] || '';
          suggestions = generateIntegrationSuggestions(problemDesc, targetUsers);
        }

        if (suggestions) {
          addMessage('assistant', suggestions);
        } else {
          addMessage('assistant', 'Please provide your response for this question.');
        }

        setIsTyping(false);
        // Keep the same question ID active so user can respond with their choice
      }, 1500);

      return;
    }

    // Handle user accepting suggestions (works for all suggestion types)
    if ((currentQuestionId === 'ai_capabilities' || currentQuestionId === 'data_sources' ||
         currentQuestionId === 'integration_requirements') && userMessage.toLowerCase().includes('use suggestion')) {
      // Extract the suggestions from the previous assistant message
      const lastAssistantMsg = messages.filter(m => m.type === 'assistant').pop();
      if (lastAssistantMsg && (lastAssistantMsg.content.includes('Based on your') ||
          lastAssistantMsg.content.includes('Common integration points'))) {
        const suggestionsMatch = lastAssistantMsg.content.match(/\d+\.\s+([^\n]+)/g);
        if (suggestionsMatch) {
          const cleanedSuggestions = suggestionsMatch.map(s => s.replace(/^\d+\.\s+/, '')).join('; ');
          setInputValue('');
          addMessage('user', userMessage);

          // Store the accepted suggestions
          setUserData(prev => ({
            ...prev,
            [currentQuestionId]: cleanedSuggestions,
          }));

          const updatedCompletedQuestions = [...completedQuestions, currentQuestionId];
          setCompletedQuestions(updatedCompletedQuestions);

          // ⚠️ DO NOT update progress here in AI mode - wait for LLM response to confirm the step
          // This prevents the progress bar from "jumping" when user submits a response
          // Progress will be updated in processUserResponse() when LLM confirms the step
          if (!useAI) {
            // For static mode only, update progress immediately since we know the flow
            const currentStep = getCurrentStep(updatedCompletedQuestions);
            const overallProgress = calculateOverallProgress(updatedCompletedQuestions);
            if (onProgressUpdate) {
              onProgressUpdate(currentStep, overallProgress);
            }
          }

          // Show typing indicator and move to next question
          setIsTyping(true);
          setIsProcessing(true);
          setTimeout(async () => {
            await processUserResponse();
            setIsTyping(false);
            setIsProcessing(false);
          }, 1000);

          return;
        }
      }
    }

    // Validate the response only in static mode or for known question IDs
    if (currentQuestionId && !useAI) {
      // Only validate in static mode
      const validation = validateResponse(currentQuestionId, userMessage);
      if (!validation.valid) {
        setValidationError(validation.error || 'Invalid response');
        return;
      }
    } else if (useAI && currentQuestionId === 'idea_description') {
      // For AI mode, only validate the initial question
      if (userMessage.length < 20) {
        setValidationError('Please provide at least 20 characters to describe your idea');
        return;
      }
    }
    // For other AI-generated questions, accept any non-empty response

    setInputValue('');

    // Add user message
    addMessage('user', userMessage);

    // Store user response and mark question as completed
    if (currentQuestionId) {
      // For the initial question, make sure we store it with the right key
      let questionKey = currentQuestionId === 'idea_description' ? 'idea_description' : currentQuestionId;

      // Map AI-generated questions to semantic keys based on content patterns
      if (useAI) {
        const lastAssistantMsg = messages.filter(m => m.type === 'assistant').pop();
        if (lastAssistantMsg) {
          const msgContent = lastAssistantMsg.content.toLowerCase();

          // Detect question type and assign semantic key
          if (msgContent.includes('business problem') || msgContent.includes('problem does') ||
              msgContent.includes('pain point') || msgContent.includes('challenge')) {
            questionKey = 'business_problem';
          } else if (msgContent.includes('target user') || msgContent.includes('intended user') ||
                     msgContent.includes('who will use') || msgContent.includes('who are the')) {
            questionKey = 'target_users';
          } else if (msgContent.includes('expected benefit') || msgContent.includes('value') ||
                     msgContent.includes('outcome') || msgContent.includes('achieve')) {
            questionKey = 'expected_benefits';
          }
        }
      }

      setUserData(prev => ({
        ...prev,
        [questionKey]: userMessage,
        // Also store as alternate keys to prevent duplicates
        ...(questionKey === 'idea_description' ? {
          'idea': userMessage,
          'core_idea': userMessage
        } : {}),
        ...(questionKey === 'business_problem' ? {
          'problem': userMessage
        } : {})
      }));

      const updatedCompletedQuestions = [...completedQuestions, currentQuestionId];
      setCompletedQuestions(updatedCompletedQuestions);

      // ⚠️ DO NOT update progress here in AI mode - wait for LLM response to confirm the step
      // This prevents the progress bar from "jumping" when user submits a response
      // Progress will be updated in processUserResponse() when LLM confirms the step
      if (!useAI) {
        // For static mode only, update progress immediately since we know the flow
        const currentStep = getCurrentStep(updatedCompletedQuestions);
        const overallProgress = calculateOverallProgress(updatedCompletedQuestions);
        if (onProgressUpdate) {
          onProgressUpdate(currentStep, overallProgress);
        }
      }
    }

    // Show typing indicator and loading overlay
    setIsTyping(true);
    setIsProcessing(true);

    // Show full-screen loading overlay for AI mode
    if (useAI) {
      setShowLoadingOverlay(true);
      setLoadingStatus('Analyzing your response...');
      setLoadingProgress(10);

      // Simulate progress stages
      setTimeout(() => {
        setLoadingStatus('Validating against criteria...');
        setLoadingProgress(40);
      }, 500);

      setTimeout(() => {
        setLoadingStatus('Generating next question...');
        setLoadingProgress(70);
      }, 1500);
    }

    // Process the response and get next question
    setTimeout(async () => {
      await processUserResponse();

      // Final progress update before hiding
      if (useAI) {
        setLoadingStatus('Complete!');
        setLoadingProgress(100);
        await new Promise(resolve => setTimeout(resolve, 300));
      }

      setIsTyping(false);
      setIsProcessing(false);
      setShowLoadingOverlay(false);
    }, 1000);
  };

  const processUserResponse = async () => {
    try {
      if (useAI && conversationManager) {
        // LLM Mode: Build conversation history directly from React messages state (using ref)
        console.log('🔍 Building conversation history from messagesRef:', {
          totalMessages: messagesRef.current.length,
          messageTypes: messagesRef.current.map(m => m.type),
          messagesPreview: messagesRef.current.map(m => ({
            type: m.type,
            contentPreview: m.content.substring(0, 100) + '...'
          }))
        });

        const conversationHistory = messagesRef.current
          .filter(msg => msg.type !== 'system')
          .map(msg => ({
            role: msg.type === 'user' ? 'user' : 'assistant',
            content: msg.content
          }));

        console.log('📋 Conversation history built:', {
          historyLength: conversationHistory.length,
          history: conversationHistory
        });

        // Use V2 API for 60-70% performance improvement
        const { generateQuestionV2 } = await import('@/lib/ai/apiClient');
        const response = await generateQuestionV2(
          userData,
          conversationHistory,
          currentQuestionNumber,
          followUpCount
        );

        // V2 API Response Handling

        // ⚠️ CRITICAL: Sync userData with the API response to ensure proper field mapping
        if (response?.userData) {
          setUserData(response.userData);
          console.log('💾 Updated userData from API:', response.userData);
        }

        // Handle completion (all 11 questions answered)
        if (response?.complete) {
          console.log('✅ Conversation complete - 11 questions answered');
          addMessage('assistant', response.message || 'Great work! You\'ve provided all the information we need. Please review and submit your proposal.');
          handleCompletion();
          return;
        }

        // Handle "I don't know" - AI assistance
        if (response?.needsAIAssistance) {
          console.log('🆘 User needs AI assistance');
          const suggestionMsg = `I understand you're not sure. Based on your idea, here's a suggestion:\n\n${response.suggestion}\n\nYou can:\n• Use this suggestion as-is\n• Modify it to fit your needs\n• Provide your own answer`;
          addMessage('assistant', suggestionMsg);
          // Don't move forward - wait for user to respond
          return;
        }

        // Handle follow-up question (criteria not met)
        if (response?.isFollowUp) {
          console.log('🔄 Follow-up question needed', {
            followUpCount: response.followUpCount,
            missingCriteria: response.missingCriteria
          });

          setFollowUpCount(response.followUpCount);
          setIsFollowUp(true);
          setMissingCriteria(response.missingCriteria || []);

          // Format follow-up message with missing criteria
          let followUpMsg = response.question.text;
          if (response.missingCriteria && response.missingCriteria.length > 0) {
            followUpMsg += `\n\n💡 **What I still need:**\n${response.missingCriteria.map((c: string) => `• ${c}`).join('\n')}`;
          }

          addMessage('assistant', followUpMsg);
          setCurrentQuestionId(response.question.id);
          return;
        }

        // Move to next question (criteria met OR max follow-ups reached)
        if (response?.question) {
          // Update V2 state
          setCurrentQuestionNumber(response.currentQuestionNumber);
          setFollowUpCount(0);
          setIsFollowUp(false);
          setMissingCriteria([]);

          // Calculate step number (1-5) based on question number (1-11)
          const nextStepNum = response.currentQuestionNumber <= 2 ? 1 :
                              response.currentQuestionNumber <= 4 ? 2 :
                              response.currentQuestionNumber <= 6 ? 3 :
                              response.currentQuestionNumber <= 8 ? 4 : 5;

          // Calculate progress (0-100%)
          const overallProgress = Math.round((response.currentQuestionNumber / 11) * 100);

          // Update progress
          if (onProgressUpdate) {
            onProgressUpdate(nextStepNum, overallProgress);
            console.log(`📊 Progress updated: Step ${nextStepNum}/5, ${overallProgress}%`);
          }

          // Format question with criteria
          let questionText = `[${response.question.stepInfo}]\n\n${response.question.text}`;

          // Add criteria checklist if available
          if (response.question.criteria && response.question.criteria.length > 0) {
            questionText += `\n\n📋 **Please include:**\n${response.question.criteria.map((c: string, i: number) => `${i + 1}. ${c}`).join('\n')}`;
          }

          // Add example response
          if (response.question.exampleResponse) {
            questionText += `\n\n💡 **Example Response:**\n"${response.question.exampleResponse}"`;
          }

          // Add help text
          if (response.question.helpText) {
            questionText += `\n\n❓ **Tip:** ${response.question.helpText}`;
          }

          // Show max follow-ups reached message if applicable
          if (response.maxFollowUpsReached) {
            addMessage('system', 'Moving forward with your current answer. We can refine details later.');
          }

          addMessage('assistant', questionText);
          setCurrentQuestionId(response.question.id);
        } else {
          // All questions completed
          handleCompletion();
        }
      } else {
        // Static Mode: Use predefined questions
        const nextQuestion = getNextQuestion(currentQuestionId);

        if (nextQuestion) {
          // Check if we're moving to a new step
          const currentStep = currentQuestionId ? getQuestionById(currentQuestionId)?.step || 1 : 1;
          const nextStep = nextQuestion.step;

          // Add transition message if moving to new step
          if (nextStep > currentStep) {
            addMessage(
              'system',
              `Great! You've completed Step ${currentStep}. Moving on to Step ${nextStep}: ${nextQuestion.stepName}`
            );
          }

          // Ask the next question
          addMessage('assistant', nextQuestion.question);
          setCurrentQuestionId(nextQuestion.id);
          setCurrentQuestionIndex(prev => prev + 1);
        } else {
          // All questions completed
          handleCompletion();
        }
      }
    } catch (error) {
      console.error('Error processing response:', error);
      addMessage(
        'system',
        'I encountered an issue processing your response. Let me try again with a different approach.'
      );

      // Fallback to static mode if LLM fails
      if (useAI) {
        const nextQuestion = getNextQuestion(currentQuestionId);
        if (nextQuestion) {
          addMessage('assistant', nextQuestion.question);
          setCurrentQuestionId(nextQuestion.id);
        } else {
          handleCompletion();
        }
      }
    }
  };

  const handleCompletion = () => {
    addMessage(
      'assistant',
      'Excellent! You\'ve provided all the necessary information. I\'m now preparing your comprehensive GenAI intake form. One moment please...'
    );
    setCurrentQuestionId('complete');

    // Calculate final progress
    const finalProgress = calculateOverallProgress(completedQuestions);

    // Trigger completion
    if (onComplete) {
      setTimeout(() => {
        onComplete({
          ...userData,
          completedQuestions,
          finalProgress,
          mode: useAI ? 'AI-powered' : 'Static'
        });
      }, 2000);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as any);
    }
  };

  // Initialize conversation
  useEffect(() => {
    // Only add welcome message if there are no messages at all and we haven't already initialized
    if (messages.length === 0 && !hasInitializedRef.current) {
      hasInitializedRef.current = true;

      if (useAI && conversationManager) {
        // LLM Mode: Session is already created in submit-idea.tsx, don't recreate
        // Just add the welcome message

        // Determine the specific mode
        const modeString = process.env.NEXT_PUBLIC_AI_MODE === 'ollama'
          ? 'Local Ollama GPT-OSS'
          : process.env.NEXT_PUBLIC_AI_MODE === 'openai'
          ? 'OpenAI GPT-5'
          : 'AI-Powered';

        // Start with a welcome message
        const welcomeMsg = `Welcome to the GenAI Idea Assistant! (${modeString} Mode - V2 🚀)

I'll guide you through 11 focused questions to capture your generative AI idea. Let's get started!

[Question 1 of 11]

What GenAI solution do you want to build? (Describe your idea in 2-3 sentences)`;

        addMessage('assistant', welcomeMsg, { category: 'greeting', questionId: 'idea_description' });
        setCurrentQuestionId('idea_description');
      } else {
        // Static Mode: Use first question from the flow
        const firstQuestion = QUESTION_FLOW[0];
        if (firstQuestion) {
          addMessage(
            'assistant',
            firstQuestion.question + '\n\n(Note: Running in Static Mode - questions are predefined)',
            { category: 'greeting', questionId: firstQuestion.id }
          );
          setCurrentQuestionId(firstQuestion.id);
        }
      }
    }
  }, []); // Only run once on mount

  return (
    <>
      <LoadingOverlay
        show={showLoadingOverlay}
        status={loadingStatus}
        progress={loadingProgress}
        estimatedTime={10}
      />
      <div className={styles.conversationalFlow} style={{ flex: '1 1 auto', minHeight: 0 }}>
        <div className={styles.messagesContainer}>
        <div className={styles.messagesList}>
          {messages.map((message) => (
            <div
              key={message.id}
              className={`${styles.message} ${styles[`message-${message.type}`]}`}
            >
              <div className={styles.messageHeader}>
                <span className={styles.messageAuthor}>
                  {message.type === 'user' ? 'You' : message.type === 'assistant' ? 'AI Assistant' : 'System'}
                </span>
                <span className={styles.messageTime}>
                  {new Date(message.timestamp).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </span>
              </div>
              <div className={styles.messageContent}>
                {message.type === 'assistant' ? (
                  <ReactMarkdown>{message.content}</ReactMarkdown>
                ) : (
                  message.content
                )}
              </div>
            </div>
          ))}

          {isTyping && (
            <div className={`${styles.message} ${styles['message-assistant']}`}>
              <div className={styles.typingIndicator}>
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      <form className={styles.inputForm} onSubmit={handleSubmit}>
        {validationError && (
          <div className={styles.validationError}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <path d="M8 1a7 7 0 100 14A7 7 0 008 1zM7 5a1 1 0 012 0v3a1 1 0 01-2 0V5zm1 5a1 1 0 110 2 1 1 0 010-2z"/>
            </svg>
            {validationError}
          </div>
        )}
        <div className={styles.inputWrapper}>
          <textarea
            ref={inputRef}
            value={inputValue}
            onChange={(e) => {
              setInputValue(e.target.value);
              // Clear validation error when user starts typing
              if (validationError) setValidationError(null);
            }}
            onKeyDown={handleKeyDown}
            placeholder={isProcessing ? "Processing..." : "Type your response here..."}
            className={styles.input}
            disabled={currentQuestionId === 'complete' || isProcessing}
            aria-label="Chat input"
            rows={2}
          />
          <button
            type="submit"
            className={styles.submitButton}
            disabled={!inputValue.trim() || currentQuestionId === 'complete' || isProcessing}
            aria-label="Send message"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M2 10L17 2L13 18L11 11L2 10Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>
        <div className={styles.inputHint}>
          Press Enter to send, Shift+Enter for new line • Mode: {
            process.env.NEXT_PUBLIC_AI_MODE === 'ollama' ? 'Local Ollama' :
            process.env.NEXT_PUBLIC_AI_MODE === 'openai' ? 'OpenAI GPT-5' :
            process.env.NEXT_PUBLIC_AI_MODE === 'static' ? 'Static' :
            'Unknown'
          }
        </div>
      </form>
      </div>
    </>
  );
};

export default ConversationalFlowDual;