import React, { useEffect, useState } from 'react';
import styles from './LoadingOverlay.module.css';

interface LoadingOverlayProps {
  show: boolean;
  status?: string;
  progress?: number; // 0-100
  estimatedTime?: number; // in seconds
}

const LoadingOverlay: React.FC<LoadingOverlayProps> = ({
  show,
  status = 'Processing your response...',
  progress = 0,
  estimatedTime = 10
}) => {
  const [currentProgress, setCurrentProgress] = useState(0);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [currentStatus, setCurrentStatus] = useState(status);

  // Simulate progress if not provided
  useEffect(() => {
    if (!show) {
      setCurrentProgress(0);
      setElapsedTime(0);
      return;
    }

    const interval = setInterval(() => {
      setElapsedTime(prev => prev + 0.1);

      // Simulate progress curve (fast start, slow end)
      setCurrentProgress(prev => {
        if (prev < 90) {
          return Math.min(prev + (90 - prev) * 0.1, 90);
        }
        return prev;
      });
    }, 100);

    return () => clearInterval(interval);
  }, [show]);

  // Update status based on elapsed time (only if status prop not provided)
  useEffect(() => {
    if (!show || status) return; // If status is provided as prop, don't override

    if (elapsedTime < 2) {
      setCurrentStatus('Analyzing your response...');
    } else if (elapsedTime < 5) {
      setCurrentStatus('Validating against criteria...');
    } else if (elapsedTime < 8) {
      setCurrentStatus('Generating next question...');
    } else {
      setCurrentStatus('Almost ready...');
    }
  }, [elapsedTime, show, status]);

  useEffect(() => {
    if (progress > 0) {
      setCurrentProgress(progress);
    }
  }, [progress]);

  useEffect(() => {
    if (status) {
      setCurrentStatus(status);
    }
  }, [status]);

  if (!show) return null;

  const displayProgress = Math.round(currentProgress);

  return (
    <div className={styles.overlay}>
      <div className={styles.content}>
        <div className={styles.spinner}>
          <svg className={styles.spinnerSvg} viewBox="0 0 100 100">
            <circle
              className={styles.spinnerCircleBg}
              cx="50"
              cy="50"
              r="45"
              fill="none"
              strokeWidth="8"
            />
            <circle
              className={styles.spinnerCircle}
              cx="50"
              cy="50"
              r="45"
              fill="none"
              strokeWidth="8"
              strokeDasharray={`${2 * Math.PI * 45}`}
              strokeDashoffset={`${2 * Math.PI * 45 * (1 - displayProgress / 100)}`}
            />
          </svg>
          <div className={styles.progressText}>
            <span className={styles.progressNumber}>{displayProgress}%</span>
          </div>
        </div>

        <h2 className={styles.title}>{currentStatus}</h2>

        <div className={styles.statusDetails}>
          <div className={styles.statusItem}>
            <div className={styles.statusIcon}>
              {elapsedTime < 2 ? '⏳' : elapsedTime < 5 ? '✓' : elapsedTime < 8 ? '✓' : '✓'}
            </div>
            <div className={styles.statusLabel}>
              Analyzing response
            </div>
          </div>

          <div className={styles.statusItem}>
            <div className={styles.statusIcon}>
              {elapsedTime < 5 ? '⏳' : elapsedTime < 8 ? '✓' : '✓'}
            </div>
            <div className={styles.statusLabel}>
              Validating criteria
            </div>
          </div>

          <div className={styles.statusItem}>
            <div className={styles.statusIcon}>
              {elapsedTime < 8 ? '⏳' : '✓'}
            </div>
            <div className={styles.statusLabel}>
              Preparing next question
            </div>
          </div>
        </div>

        <div className={styles.timeEstimate}>
          Estimated time: {Math.max(0, Math.round(estimatedTime - elapsedTime))}s remaining
        </div>

      </div>
    </div>
  );
};

export default LoadingOverlay;
