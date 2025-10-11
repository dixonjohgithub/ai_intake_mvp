import React from 'react';
import Head from 'next/head';
import Header from './Header';
import Footer from './Footer';

interface LayoutProps {
  children: React.ReactNode;
  title?: string;
  description?: string;
}

const Layout: React.FC<LayoutProps> = ({
  children,
  title = 'AI Intake Assistant | Wells Fargo',
  description = 'AI-Powered GenAI Idea Assistant for Wells Fargo - Submit and manage your GenAI ideas efficiently'
}) => {
  return (
    <>
      <Head>
        <title>{title}</title>
        <meta name="description" content={description} />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className="min-h-screen flex flex-col">
        <Header />

        <main className="flex-grow" role="main">
          {children}
        </main>

        <Footer />
      </div>
    </>
  );
};

export default Layout;