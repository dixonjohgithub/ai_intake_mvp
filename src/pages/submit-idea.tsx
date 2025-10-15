import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Layout from '@/components/Layout';
import ConversationalFlowDual from '@/components/ConversationalFlowDual';
import ProgressIndicator, { WizardProgress, CircularProgress } from '@/components/ProgressIndicator';
import StepIndicator from '@/components/StepIndicator';
import { ConversationManager } from '@/lib/conversation/conversationManager';
import { ReasoningEngine } from '@/lib/ai/reasoningEngine';
import styles from '@/styles/SubmitIdea.module.css';

const SubmitIdeaPage: React.FC = () => {
  const router = useRouter();
  const [sessionId, setSessionId] = useState<string>('');
  const [conversationManager, setConversationManager] = useState<ConversationManager | null>(null);
  const [reasoningEngine, setReasoningEngine] = useState<ReasoningEngine | null>(null);
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [useAI, setUseAI] = useState(false);

  const steps = [
    { id: 'intro', label: 'Introduction', status: 'active' as const },
    { id: 'business', label: 'Business Case', status: 'pending' as const },
    { id: 'technical', label: 'Technical Details', status: 'pending' as const },
    { id: 'feasibility', label: 'Feasibility', status: 'pending' as const },
    { id: 'risk', label: 'Risk Assessment', status: 'pending' as const },
  ];

  useEffect(() => {
    // Force scroll to absolute top after a brief delay to ensure DOM is ready
    window.scrollTo(0, 0);
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;

    // Also scroll after a slight delay to override any auto-focus behavior
    setTimeout(() => {
      window.scrollTo(0, 0);
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    }, 100);

    // Initialize managers - check environment variable for AI mode
    const aiMode = process.env.NEXT_PUBLIC_AI_MODE || 'static';
    const aiEnabled = aiMode !== 'static';
    setUseAI(aiEnabled);

    const convManager = new ConversationManager(aiEnabled);
    const reasonEngine = new ReasoningEngine();

    // Create or restore session
    const existingSessions = convManager.getActiveSessions();
    let session: string;

    // For now, always create a fresh session to avoid duplication issues
    // We can re-enable session restoration later once we fix the sync
    session = convManager.createSession();

    // Clear any stale sessions to avoid confusion
    if (existingSessions.length > 0) {
      // Optional: could restore progress from the latest session
      // but skip restoring messages to avoid duplication
      const latestSession = existingSessions[0];
      if (latestSession && latestSession.progress) {
        setProgress(latestSession.progress);
      }
    }

    setSessionId(session);
    setConversationManager(convManager);
    setReasoningEngine(reasonEngine);
    setIsLoading(false);

    return () => {
      convManager.stopAutoSave();
    };
  }, []);

  const handleComplete = async (userData: Record<string, any>) => {
    if (!conversationManager || !reasoningEngine) return;

    // Analyze conversation
    const conversation = conversationManager.getConversation(sessionId);
    if (!conversation) return;

    // Build conversation history for API
    const conversationHistory = conversation.messages
      .filter(m => m.type === 'user' || m.type === 'assistant')
      .map(m => ({
        role: m.type === 'user' ? 'user' : 'assistant',
        content: m.content
      }));

    const context = {
      userData,
      conversationHistory: conversation.messages
        .filter(m => m.type === 'user' || m.type === 'assistant')
        .reduce((acc: any[], msg, i, arr) => {
          if (msg.type === 'assistant' && i < arr.length - 1) {
            acc.push({
              question: msg.content,
              answer: arr[i + 1].content,
            });
          }
          return acc;
        }, []),
    };

    const analysis = await reasoningEngine.analyzeConversation(context);

    // Store analysis, userData, and conversationHistory for submission
    if (analysis) {
      sessionStorage.setItem('ideaAnalysis', JSON.stringify(analysis));
      sessionStorage.setItem('ideaData', JSON.stringify(userData));
      sessionStorage.setItem('conversationHistory', JSON.stringify(conversationHistory));
      router.push('/review-idea');
    }
  };

  const handleSave = (state: any) => {
    // State is automatically saved by ConversationManager
    console.log('Conversation state saved');
  };

  const updateProgress = () => {
    // This will be called from ConversationalFlow component through a callback
    // For now, keep it simple with placeholder logic
    // The actual progress tracking will come from the ConversationalFlow component
  };

  useEffect(() => {
    const interval = setInterval(updateProgress, 5000);
    return () => clearInterval(interval);
  }, [conversationManager, reasoningEngine, sessionId]);

  if (isLoading) {
    return (
      <Layout title="Submit GenAI Idea | AI Intake Assistant">
        <div className={styles.loadingContainer}>
          <CircularProgress percentage={0} label="Loading..." />
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Submit GenAI Idea | AI Intake Assistant">
      <div className={styles.container}>
        <div className={styles.header}>
          <h1 className={styles.title}>Submit Your GenAI Idea</h1>
          <p className={styles.subtitle}>
            Let's work together to develop your generative AI use case
            {process.env.NEXT_PUBLIC_AI_MODE === 'openai' && <span style={{color: '#4CAF50', marginLeft: '10px'}}>• OpenAI GPT-5</span>}
            {process.env.NEXT_PUBLIC_AI_MODE === 'ollama' && <span style={{color: '#00BCD4', marginLeft: '10px'}}>• Local Ollama GPT-OSS</span>}
            {process.env.NEXT_PUBLIC_AI_MODE === 'static' && <span style={{color: '#FF9800', marginLeft: '10px'}}>• Static Mode</span>}
          </p>
        </div>

        <div className={styles.progressSection}>
          <StepIndicator
            steps={steps}
            currentStep={currentStep}
          />
          <WizardProgress
            totalSteps={5}
            currentStep={currentStep}
            stepLabels={steps.map(s => s.label)}
          />
          <div className={styles.stepGuide}>
            <div className={styles.stepGuideHeader}>
              <h3>Step {currentStep} of 5: {steps[currentStep - 1].label}</h3>
            </div>
            <div className={styles.stepDescription}>
              {currentStep === 1 && "We'll start with a brief introduction and understand the basics of your GenAI idea."}
              {currentStep === 2 && "Define the business problem, target users, and expected benefits of your solution."}
              {currentStep === 3 && "Specify technical requirements, data sources, and integration needs."}
              {currentStep === 4 && "Assess implementation complexity, data availability, and timeline."}
              {currentStep === 5 && "Identify potential risks and challenges for your project."}
            </div>
          </div>
        </div>

        <div className={styles.mainContent}>
          <div className={styles.conversationSection}>
            <ConversationalFlowDual
              onComplete={handleComplete}
              onSave={handleSave}
              onProgressUpdate={(step, overallProgress) => {
                setCurrentStep(step);
                setProgress(overallProgress);
              }}
              initialState={{
                sessionId,
                messages: conversationManager?.getConversation(sessionId)?.messages || [],
                userData: conversationManager?.getConversation(sessionId)?.userData || {},
              }}
              useAI={useAI}
              conversationManager={conversationManager}
            />
          </div>

          <div className={styles.sidebar}>
            <div className={styles.progressCard}>
              <h3>Overall Progress</h3>
              <CircularProgress
                percentage={progress}
                size={120}
                label="Complete"
              />
            </div>

            <div className={styles.helpCard}>
              <h3>Need Help?</h3>
              <p>Our AI assistant is here to guide you through each step.</p>
              <ul>
                <li>Answer questions at your own pace</li>
                <li>Your progress is automatically saved</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default SubmitIdeaPage;