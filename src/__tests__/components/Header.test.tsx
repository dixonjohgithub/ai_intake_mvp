import React from 'react';
import { render, screen } from '@testing-library/react';
import Header from '@/components/Header';

describe('Header Component', () => {
  it('renders without crashing', () => {
    render(<Header />);
  });

  it('renders the Wells Fargo logo', () => {
    render(<Header />);
    const logo = screen.getByAltText('Wells Fargo');
    expect(logo).toBeInTheDocument();
    // Next.js Image component transforms the src, so we check it contains the image path
    expect(logo.getAttribute('src')).toContain('wf_logo_220x23.webp');
  });

  it('renders the welcome message', () => {
    render(<Header />);
    const welcomeText = screen.getByText('Welcome to the CL SST AI Intake Assistant');
    expect(welcomeText).toBeInTheDocument();
  });

  it('has proper ARIA attributes', () => {
    render(<Header />);
    const banner = screen.getByRole('banner');
    expect(banner).toBeInTheDocument();
  });

  it('applies correct CSS classes', () => {
    const { container } = render(<Header />);
    const header = container.querySelector('header');
    expect(header).toHaveClass('header');
  });
});