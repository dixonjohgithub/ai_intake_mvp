import React from 'react';
import Link from 'next/link';
import styles from './ServiceTiles.module.css';

interface ServiceTile {
  id: string;
  title: string;
  description: string;
  href: string;
  icon: React.ReactNode;
}

const services: ServiceTile[] = [
  {
    id: 'genai',
    title: 'Submit a Gen AI Idea',
    description: 'Propose use cases for generative AI to enhance operations & customer experience',
    href: '/submit-idea',
    icon: (
      <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M20 5L22.5 12.5L30 15L22.5 17.5L20 25L17.5 17.5L10 15L17.5 12.5L20 5Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M8 8L9 11L12 12L9 13L8 16L7 13L4 12L7 11L8 8Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M32 24L33 27L36 28L33 29L32 32L31 29L28 28L31 27L32 24Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    )
  },
  {
    id: 'analytics',
    title: 'Request Analytics Support',
    description: 'Request data and insights to manage your operations',
    href: '',
    icon: (
      <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M8 32V20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M16 32V12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M24 32V24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M32 32V16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M4 8L12 16L20 8L36 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    )
  },
  {
    id: 'automation',
    title: 'Automation Intake',
    description: 'Submit an intake to automate your operations and processes',
    href: '',
    icon: (
      <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M20 8C20 8 16 12 12 12C8 12 4 8 4 8V24C4 24 8 28 12 28C16 28 20 24 20 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M20 16C20 16 24 20 28 20C32 20 36 16 36 16V32C36 32 32 36 28 36C24 36 20 32 20 32" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M20 4V36" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    )
  },
  {
    id: 'support',
    title: 'Request Support',
    description: 'Submit a request to our support team',
    href: '',
    icon: (
      <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M28 20V14C28 9.58172 24.4183 6 20 6C15.5817 6 12 9.58172 12 14V20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M8 18H10C11.1046 18 12 18.8954 12 20V26C12 27.1046 11.1046 28 10 28H8C6.89543 28 6 27.1046 6 26V20C6 18.8954 6.89543 18 8 18Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M30 18H32C33.1046 18 34 18.8954 34 20V26C34 27.1046 33.1046 28 32 28H30C28.8954 28 28 27.1046 28 26V20C28 18.8954 28.8954 18 30 18Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M28 28V30C28 32.2091 26.2091 34 24 34H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    )
  }
];

const ServiceTiles: React.FC = () => {
  return (
    <section className={styles.servicesSection} role="region" aria-label="Available Services">
      <div className="container">
        <div className={styles.tilesGrid}>
          {services.map((service) => (
            <Link
              key={service.id}
              href={service.href}
              className={styles.tile}
              aria-label={`${service.title}: ${service.description}`}
            >
              <div className={styles.tileContent}>
                <div className={styles.tileIcon}>
                  {service.icon}
                </div>
                <h2 className={styles.tileTitle}>{service.title}</h2>
                <p className={styles.tileDescription}>{service.description}</p>
              </div>
              <div className={styles.tileBottomBorder}></div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ServiceTiles;