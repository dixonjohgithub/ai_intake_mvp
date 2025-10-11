import React from 'react';
import styles from './Footer.module.css';

const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className={styles.footer} role="contentinfo">
      <div className="container">
        <div className={styles.footerContent}>
          <p className={styles.copyright}>
            © {currentYear} Wells Fargo & Company. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;