import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import styles from './Header.module.css';

const Header: React.FC = () => {
  return (
    <header className={styles.header} role="banner">
      <div className={styles.topBar}>
        <div className="container">
          <div className={styles.topBarContent}>
            <Link href="/" className={styles.logoLink}>
              <Image
                src="/images/wf_logo_220x23.webp"
                alt="Wells Fargo"
                width={220}
                height={23}
                priority
                className={styles.logo}
              />
            </Link>
            <span className={styles.separator}>|</span>
            <span className={styles.headerTitle}>Welcome to the CL SST AI Intake Assistant</span>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;