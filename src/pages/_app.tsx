import type { AppProps } from 'next/app';
import '@/styles/globals.css';

/**
 * Next.js App Component
 * Wraps all pages with common layout and providers
 */

export default function App({ Component, pageProps }: AppProps) {
  return <Component {...pageProps} />;
}