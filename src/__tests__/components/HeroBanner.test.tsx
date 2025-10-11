import React from 'react';
import { render, screen } from '@testing-library/react';
import HeroBanner from '@/components/HeroBanner';

describe('HeroBanner Component', () => {
  it('renders without crashing', () => {
    render(<HeroBanner />);
  });

  it('renders the main title', () => {
    render(<HeroBanner />);
    const title = screen.getByText('GenAI, Automation, and Data Analytics Intake Management');
    expect(title).toBeInTheDocument();
    expect(title.tagName).toBe('H1');
  });

  it('renders the welcome message', () => {
    render(<HeroBanner />);
    const welcomeText = screen.getByText(/Welcome, User!/);
    expect(welcomeText).toBeInTheDocument();
  });

  it('renders the help text', () => {
    render(<HeroBanner />);
    const helpText = screen.getByText(/How can we help you today?/);
    expect(helpText).toBeInTheDocument();
  });

  it('has proper ARIA attributes', () => {
    render(<HeroBanner />);
    const section = screen.getByRole('region', { name: /Welcome Banner/i });
    expect(section).toBeInTheDocument();
  });

  it('applies correct CSS classes', () => {
    const { container } = render(<HeroBanner />);
    const hero = container.querySelector('section');
    expect(hero).toHaveClass('hero');

    const heroTitle = container.querySelector('h1');
    expect(heroTitle).toHaveClass('heroTitle');
  });
});