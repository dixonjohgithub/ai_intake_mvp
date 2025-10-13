import React from 'react';
import styles from './StepIndicator.module.css';

interface Step {
  id: string;
  label: string;
  status: 'completed' | 'active' | 'pending';
}

interface StepIndicatorProps {
  steps: Step[];
  currentStep: number;
}

const StepIndicator: React.FC<StepIndicatorProps> = ({ steps, currentStep }) => {
  return (
    <div className={styles.stepIndicator}>
      {steps.map((step, index) => {
        const stepNumber = index + 1;
        const isCompleted = stepNumber < currentStep;
        const isActive = stepNumber === currentStep;
        const isPending = stepNumber > currentStep;

        return (
          <div
            key={step.id}
            className={`${styles.step} ${
              isCompleted ? styles.completed : isActive ? styles.active : styles.pending
            }`}
          >
            <div className={styles.stepConnector}>
              {index > 0 && (
                <div
                  className={`${styles.connectorLine} ${
                    isCompleted || (index < currentStep - 1) ? styles.connectorCompleted : ''
                  }`}
                />
              )}
            </div>
            <div className={styles.stepContent}>
              <div className={styles.stepCircle}>
                {isCompleted ? (
                  <svg
                    className={styles.checkIcon}
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                ) : (
                  <span className={styles.stepNumber}>{stepNumber}</span>
                )}
              </div>
              <div className={styles.stepLabel}>{step.label}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default StepIndicator;