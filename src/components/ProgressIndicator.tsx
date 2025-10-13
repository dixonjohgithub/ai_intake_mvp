import React from 'react';
import styles from './ProgressIndicator.module.css';

export interface ProgressStep {
  id: string;
  label: string;
  status: 'pending' | 'active' | 'completed';
  description?: string;
}

interface ProgressIndicatorProps {
  steps: ProgressStep[];
  currentStep?: number;
  variant?: 'horizontal' | 'vertical';
  showLabels?: boolean;
  compact?: boolean;
}

const ProgressIndicator: React.FC<ProgressIndicatorProps> = ({
  steps,
  currentStep = 0,
  variant = 'horizontal',
  showLabels = true,
  compact = false,
}) => {
  return (
    <div className={`${styles.progressIndicator} ${styles[variant]} ${compact ? styles.compact : ''}`}>
      <div className={styles.stepsContainer}>
        {steps.map((step, index) => {
          const isActive = index === currentStep;
          const isCompleted = index < currentStep;
          const isPending = index > currentStep;

          return (
            <div
              key={step.id}
              className={`${styles.step} ${
                isActive ? styles.active : isCompleted ? styles.completed : styles.pending
              }`}
            >
              <div className={styles.stepIndicator}>
                <div className={styles.stepNumber}>
                  {isCompleted ? (
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <path
                        d="M13.5 4.5L6 12L2.5 8.5"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  ) : (
                    index + 1
                  )}
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={`${styles.connector} ${
                      isCompleted ? styles.connectorCompleted : ''
                    }`}
                  />
                )}
              </div>

              {showLabels && (
                <div className={styles.stepContent}>
                  <div className={styles.stepLabel}>{step.label}</div>
                  {step.description && !compact && (
                    <div className={styles.stepDescription}>{step.description}</div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export const WizardProgress: React.FC<{
  totalSteps: number;
  currentStep: number;
  stepLabels?: string[];
}> = ({ totalSteps, currentStep, stepLabels = [] }) => {
  const percentage = (currentStep / totalSteps) * 100;

  return (
    <div className={styles.wizardProgress}>
      <div className={styles.wizardHeader}>
        <span className={styles.wizardStep}>
          Step {currentStep} of {totalSteps}
        </span>
        {stepLabels[currentStep - 1] && (
          <span className={styles.wizardLabel}>{stepLabels[currentStep - 1]}</span>
        )}
      </div>
      <div className={styles.wizardBar}>
        <div
          className={styles.wizardBarFill}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};

export const CircularProgress: React.FC<{
  percentage: number;
  size?: number;
  strokeWidth?: number;
  label?: string;
}> = ({ percentage, size = 100, strokeWidth = 8, label }) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <div className={styles.circularProgress} style={{ width: size, height: size }}>
      <svg width={size} height={size}>
        <circle
          className={styles.circularBackground}
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
        />
        <circle
          className={styles.circularFill}
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </svg>
      {label && (
        <div className={styles.circularLabel}>
          <span className={styles.circularPercentage}>{Math.round(percentage)}%</span>
          <span className={styles.circularText}>{label}</span>
        </div>
      )}
    </div>
  );
};

export const LoadingDots: React.FC<{ text?: string }> = ({ text = 'Processing' }) => {
  return (
    <div className={styles.loadingDots}>
      <span className={styles.loadingText}>{text}</span>
      <div className={styles.dots}>
        <span></span>
        <span></span>
        <span></span>
      </div>
    </div>
  );
};

export const SkeletonLoader: React.FC<{
  lines?: number;
  showAvatar?: boolean;
}> = ({ lines = 3, showAvatar = false }) => {
  return (
    <div className={styles.skeletonLoader}>
      {showAvatar && <div className={styles.skeletonAvatar} />}
      <div className={styles.skeletonContent}>
        {Array.from({ length: lines }).map((_, i) => (
          <div
            key={i}
            className={styles.skeletonLine}
            style={{ width: `${100 - i * 15}%` }}
          />
        ))}
      </div>
    </div>
  );
};

export default ProgressIndicator;