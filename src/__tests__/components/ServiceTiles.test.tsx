import React from 'react';
import { render, screen } from '@testing-library/react';
import ServiceTiles from '@/components/ServiceTiles';

describe('ServiceTiles Component', () => {
  const expectedServices = [
    {
      title: 'Submit a Gen AI Idea',
      description: 'Propose use cases for generative AI to enhance operations & customer experience'
    },
    {
      title: 'Request Analytics Support',
      description: 'Request data and insights to manage your operations'
    },
    {
      title: 'Automation Intake',
      description: 'Submit an intake to automate your operations and processes'
    },
    {
      title: 'Request Support',
      description: 'Submit a request to our support team'
    }
  ];

  it('renders without crashing', () => {
    render(<ServiceTiles />);
  });

  it('renders all four service tiles', () => {
    render(<ServiceTiles />);
    expectedServices.forEach(service => {
      expect(screen.getByText(service.title)).toBeInTheDocument();
      expect(screen.getByText(service.description)).toBeInTheDocument();
    });
  });

  it('renders service tiles as links', () => {
    render(<ServiceTiles />);
    // Only the first tile has an href, others have empty strings
    const genAILink = screen.getByRole('link', { name: /Submit a Gen AI Idea/i });
    expect(genAILink).toBeInTheDocument();
    expect(genAILink).toHaveAttribute('href', '/submit-idea');
  });

  it('has proper ARIA attributes', () => {
    render(<ServiceTiles />);
    const section = screen.getByRole('region', { name: /Available Services/i });
    expect(section).toBeInTheDocument();

    // Check that each link has proper aria-label
    expectedServices.forEach(service => {
      const link = screen.getByLabelText(new RegExp(service.title, 'i'));
      expect(link).toBeInTheDocument();
    });
  });

  it('applies correct CSS classes', () => {
    const { container } = render(<ServiceTiles />);

    const section = container.querySelector('section');
    expect(section).toHaveClass('servicesSection');

    const grid = container.querySelector('.tilesGrid');
    expect(grid).toBeInTheDocument();

    const tiles = container.querySelectorAll('.tile');
    expect(tiles).toHaveLength(4);
  });

  it('renders icons for each tile', () => {
    const { container } = render(<ServiceTiles />);
    const icons = container.querySelectorAll('.tileIcon svg');
    expect(icons).toHaveLength(4);

    // Check that each icon has proper dimensions
    icons.forEach(icon => {
      expect(icon).toHaveAttribute('width', '40');
      expect(icon).toHaveAttribute('height', '40');
    });
  });

  it('renders tiles with correct structure', () => {
    const { container } = render(<ServiceTiles />);

    const tiles = container.querySelectorAll('.tile');
    tiles.forEach(tile => {
      // Each tile should have content and bottom border
      expect(tile.querySelector('.tileContent')).toBeInTheDocument();
      expect(tile.querySelector('.tileBottomBorder')).toBeInTheDocument();

      // Each tile content should have icon, title, and description
      const content = tile.querySelector('.tileContent');
      expect(content?.querySelector('.tileIcon')).toBeInTheDocument();
      expect(content?.querySelector('.tileTitle')).toBeInTheDocument();
      expect(content?.querySelector('.tileDescription')).toBeInTheDocument();
    });
  });
});