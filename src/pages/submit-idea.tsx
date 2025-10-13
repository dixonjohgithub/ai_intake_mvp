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
  const [showAutoSave, setShowAutoSave] = useState(false);
  const [useAI, setUseAI] = useState(false);

  const steps = [
    { id: 'intro', label: 'Introduction', status: 'active' as const },
    { id: 'business', label: 'Business Case', status: 'pending' as const },
    { id: 'technical', label: 'Technical Details', status: 'pending' as const },
    { id: 'feasibility', label: 'Feasibility', status: 'pending' as const },
    { id: 'risk', label: 'Risk Assessment', status: 'pending' as const },
    { id: 'review', label: 'Review & Submit', status: 'pending' as const },
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
    const aiEnabled = process.env.NEXT_PUBLIC_USE_OPENAI === 'true';
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

    // Auto-save indicator
    const autoSaveInterval = setInterval(() => {
      setShowAutoSave(true);
      setTimeout(() => setShowAutoSave(false), 2000);
    }, 30000);

    return () => {
      clearInterval(autoSaveInterval);
      convManager.stopAutoSave();
    };
  }, []);

  const handleComplete = async (userData: Record<string, any>) => {
    if (!conversationManager || !reasoningEngine) return;

    // Analyze conversation
    const conversation = conversationManager.getConversation(sessionId);
    if (!conversation) return;

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

    // Store analysis and navigate to review
    if (analysis) {
      sessionStorage.setItem('ideaAnalysis', JSON.stringify(analysis));
      sessionStorage.setItem('ideaData', JSON.stringify(userData));
      router.push('/review-idea');
    }
  };

  const handleSave = (state: any) => {
    // State is automatically saved by ConversationManager
    console.log('Conversation state saved');
  };

  const handleUndo = () => {
    if (conversationManager) {
      conversationManager.undo(sessionId);
      updateProgress();
    }
  };

  const handleRedo = () => {
    if (conversationManager) {
      conversationManager.redo(sessionId);
      updateProgress();
    }
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
            {useAI && <span style={{color: '#4CAF50', marginLeft: '10px'}}>• AI-Powered Mode</span>}
            {!useAI && <span style={{color: '#FF9800', marginLeft: '10px'}}>• Static Mode</span>}
          </p>
        </div>

        <div className={styles.progressSection}>
          <StepIndicator
            steps={steps}
            currentStep={currentStep}
          />
          <WizardProgress
            totalSteps={6}
            currentStep={currentStep}
            stepLabels={steps.map(s => s.label)}
          />
          <div className={styles.stepGuide}>
            <div className={styles.stepGuideHeader}>
              <h3>Step {currentStep} of 6: {steps[currentStep - 1].label}</h3>
            </div>
            <div className={styles.stepDescription}>
              {currentStep === 1 && "We'll start with a brief introduction and understand the basics of your GenAI idea."}
              {currentStep === 2 && "Define the business problem, target users, and expected benefits of your solution."}
              {currentStep === 3 && "Specify technical requirements, data sources, and integration needs."}
              {currentStep === 4 && "Assess implementation complexity, data availability, and timeline."}
              {currentStep === 5 && "Identify potential risks, compliance considerations, and mitigation strategies."}
              {currentStep === 6 && "Review all information and submit your completed GenAI proposal."}
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

            <div className={styles.actions}>
              <button
                className={styles.undoButton}
                onClick={handleUndo}
                aria-label="Undo last response"
              >
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <path d="M4 10L2 8L4 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M2 8H14C16.2091 8 18 9.79086 18 12C18 14.2091 16.2091 16 14 16H10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Undo
              </button>

              <button
                className={styles.redoButton}
                onClick={handleRedo}
                aria-label="Redo response"
              >
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <path d="M16 10L18 8L16 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M18 8H6C3.79086 8 2 9.79086 2 12C2 14.2091 3.79086 16 6 16H10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Redo
              </button>

              <button
                className={styles.saveButton}
                onClick={() => router.push('/')}
              >
                Save & Exit
              </button>
            </div>
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
                <li>Use undo/redo if you change your mind</li>
                <li>Your progress is automatically saved</li>
              </ul>
            </div>
          </div>
        </div>

        {showAutoSave && (
          <div className={styles.autoSaveIndicator}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M13.5 5.5L6 13L2.5 9.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Auto-saved
          </div>
        )}
      </div>
    </Layout>
  );
};

export default SubmitIdeaPage;