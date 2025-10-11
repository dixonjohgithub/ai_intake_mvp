import React from 'react';
import styles from './HeroBanner.module.css';

const HeroBanner: React.FC = () => {
  return (
    <section className={styles.hero} role="region" aria-label="Welcome Banner">
      <div className={styles.heroBackground}>
        <div className={styles.heroOverlay}>
          <div className="container">
            <div className={styles.heroContent}>
              <h1 className={styles.heroTitle}>
                GenAI, Automation, and Data Analytics Intake Management
              </h1>
              <p className={styles.heroSubtitle}>
                Welcome, User!<br />
                How can we help you today?
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroBanner;