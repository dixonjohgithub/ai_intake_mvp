import React from 'react';
import { render, screen } from '@testing-library/react';
import Home from '@/pages/index';

// Mock the components
jest.mock('@/components/Header', () => {
  return function Header() {
    return <div data-testid="header">Header Component</div>;
  };
});

jest.mock('@/components/HeroBanner', () => {
  return function HeroBanner() {
    return <div data-testid="hero-banner">HeroBanner Component</div>;
  };
});

jest.mock('@/components/ServiceTiles', () => {
  return function ServiceTiles() {
    return <div data-testid="service-tiles">ServiceTiles Component</div>;
  };
});

describe('Home Page', () => {
  it('renders without crashing', () => {
    render(<Home />);
  });

  it('renders all main components', () => {
    render(<Home />);

    expect(screen.getByTestId('header')).toBeInTheDocument();
    expect(screen.getByTestId('hero-banner')).toBeInTheDocument();
    expect(screen.getByTestId('service-tiles')).toBeInTheDocument();
  });

  it('has the correct page structure', () => {
    const { container } = render(<Home />);

    const main = container.querySelector('main');
    expect(main).toBeInTheDocument();
    expect(main).toHaveClass('flex-grow');
  });

  it('renders components in the correct order', () => {
    const { container } = render(<Home />);

    const elements = container.querySelectorAll('[data-testid]');
    expect(elements[0]).toHaveAttribute('data-testid', 'header');
    expect(elements[1]).toHaveAttribute('data-testid', 'hero-banner');
    expect(elements[2]).toHaveAttribute('data-testid', 'service-tiles');
  });
});