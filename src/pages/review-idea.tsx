import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Layout from '@/components/Layout';
import styles from '@/styles/ReviewIdea.module.css';
import { PDFExporter, mapConversationToIntakeForm } from '@/lib/export/pdfExporter';
import LoadingOverlay from '@/components/LoadingOverlay';

const ReviewIdeaPage: React.FC = () => {
  const router = useRouter();
  const [ideaData, setIdeaData] = useState<Record<string, any> | null>(null);
  const [analysis, setAnalysis] = useState<any | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Loading overlay state
  const [showLoadingOverlay, setShowLoadingOverlay] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState('Preparing submission...');
  const [loadingProgress, setLoadingProgress] = useState(0);

  useEffect(() => {
    // Retrieve data from sessionStorage
    const storedData = sessionStorage.getItem('ideaData');
    const storedAnalysis = sessionStorage.getItem('ideaAnalysis');

    if (storedData) {
      setIdeaData(JSON.parse(storedData));
    }

    if (storedAnalysis) {
      setAnalysis(JSON.parse(storedAnalysis));
    }
  }, []);

  const handleSubmit = async () => {
    if (!ideaData) {
      alert('No idea data to submit');
      return;
    }

    try {
      setIsSubmitting(true);
      setShowLoadingOverlay(true);

      // Step 1: Prepare data (10%)
      setLoadingStatus('Preparing submission data...');
      setLoadingProgress(10);
      await new Promise(resolve => setTimeout(resolve, 500));

      // Get conversation history from sessionStorage
      const conversationHistory = JSON.parse(
        sessionStorage.getItem('conversationHistory') || '[]'
      );

      // Step 2: Analyzing conversation (30%)
      setLoadingStatus('Analyzing conversation with AI...');
      setLoadingProgress(30);

      // Call CSV submission endpoint
      const response = await fetch('/api/data/submit-idea', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userData: ideaData,
          analysis: analysis,
          conversationHistory: conversationHistory,
          similarityScores: {}
        })
      });

      // Step 3: Mapping fields (60%)
      setLoadingStatus('Mapping data to CSV fields...');
      setLoadingProgress(60);

      const result = await response.json();

      // Step 4: Generating recommendations (80%)
      setLoadingStatus('Generating AI recommendations...');
      setLoadingProgress(80);
      await new Promise(resolve => setTimeout(resolve, 500));

      // Step 5: Saving to database (95%)
      setLoadingStatus('Saving to system...');
      setLoadingProgress(95);
      await new Promise(resolve => setTimeout(resolve, 500));

      // Step 6: Complete (100%)
      setLoadingStatus('Complete!');
      setLoadingProgress(100);
      await new Promise(resolve => setTimeout(resolve, 500));

      if (result.success) {
        setShowLoadingOverlay(false);
        alert(`Idea submitted successfully!\n\nOpportunity ID: ${result.opportunityId}\nOpportunity Name: ${result.opportunityName}\n\nYour idea has been saved to the system.`);

        // Clear session storage
        sessionStorage.removeItem('ideaData');
        sessionStorage.removeItem('ideaAnalysis');
        sessionStorage.removeItem('conversationHistory');

        router.push('/');
      } else {
        setShowLoadingOverlay(false);
        alert(`Failed to submit idea: ${result.message}\n\nMissing fields: ${result.missingFields?.join(', ') || 'Unknown'}`);
      }
    } catch (error: any) {
      console.error('Error submitting idea:', error);
      setShowLoadingOverlay(false);
      alert(`Error submitting idea: ${error?.message || 'Unknown error occurred'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = () => {
    router.back();
  };

  const handleDownloadPDF = () => {
    if (!ideaData) return;

    try {
      // Map conversation data to intake form structure
      const formData = mapConversationToIntakeForm(ideaData, analysis);

      // Generate PDF
      const exporter = new PDFExporter();
      exporter.generateIntakeForm(formData);

      // Download the PDF
      const fileName = `${formData.opportunityName.replace(/[^a-z0-9]/gi, '_')}_Intake_Form.pdf`;
      exporter.save(fileName);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Failed to generate PDF. Please try again.');
    }
  };

  if (!ideaData) {
    return (
      <Layout title="Review Your Idea | AI Intake Assistant">
        <div className={styles.container}>
          <div className={styles.emptyState}>
            <h2>No idea data found</h2>
            <p>Please complete the idea submission form first.</p>
            <button onClick={() => router.push('/submit-idea')}>Start New Idea</button>
          </div>
        </div>
      </Layout>
    );
  }

  // Format field names for display
  const formatFieldName = (key: string): string => {
    return key
      .replace(/_/g, ' ')
      .replace(/-/g, ' ')
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  return (
    <Layout title="Review Your GenAI Idea | AI Intake Assistant">
      <LoadingOverlay
        show={showLoadingOverlay}
        status={loadingStatus}
        progress={loadingProgress}
        estimatedTime={20}
      />
      <div className={styles.container}>
        <div className={styles.header}>
          <h1>Review Your GenAI Idea</h1>
          <p>Please review your submission before finalizing</p>
        </div>

        <div className={styles.content}>
          <div className={styles.section}>
            <h2>Idea Details</h2>
            {Object.entries(ideaData)
              .filter(([key]) => !['completedQuestions', 'finalProgress', 'mode'].includes(key))
              .map(([key, value]) => (
                <div key={key} className={styles.field}>
                  <label>{formatFieldName(key)}:</label>
                  <p>{String(value)}</p>
                </div>
              ))}
          </div>

          {analysis && (
            <div className={styles.section}>
              <h2>AI Analysis</h2>

              {analysis.summary && (
                <div className={styles.analysisItem}>
                  <h3>Summary</h3>
                  <p>{analysis.summary}</p>
                </div>
              )}

              {analysis.classification && (
                <div className={styles.analysisItem}>
                  <h3>Classification</h3>
                  <p>{analysis.classification}</p>
                </div>
              )}

              {analysis.readiness !== undefined && (
                <div className={styles.analysisItem}>
                  <h3>Readiness Score</h3>
                  <p>{analysis.readiness}%</p>
                </div>
              )}

              {analysis.gaps && analysis.gaps.length > 0 && (
                <div className={styles.analysisItem}>
                  <h3>Identified Gaps</h3>
                  <ul>
                    {analysis.gaps.map((gap: string, index: number) => (
                      <li key={index}>{gap}</li>
                    ))}
                  </ul>
                </div>
              )}

              {analysis.recommendations && analysis.recommendations.length > 0 && (
                <div className={styles.analysisItem}>
                  <h3>Recommendations</h3>
                  <ul>
                    {analysis.recommendations.map((rec: string, index: number) => (
                      <li key={index}>{rec}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>

        <div className={styles.actions}>
          <button
            onClick={handleEdit}
            className={styles.secondaryButton}
            disabled={isSubmitting}
          >
            Go Back & Edit
          </button>
          <button
            onClick={handleDownloadPDF}
            className={styles.secondaryButton}
            disabled={isSubmitting}
          >
            Download PDF
          </button>
          <button
            onClick={handleSubmit}
            className={styles.primaryButton}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Submitting...' : 'Submit Idea'}
          </button>
        </div>
      </div>
    </Layout>
  );
};

export default ReviewIdeaPage;
