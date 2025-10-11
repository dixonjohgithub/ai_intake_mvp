import React from 'react';
import { render } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import Header from '@/components/Header';
import HeroBanner from '@/components/HeroBanner';
import ServiceTiles from '@/components/ServiceTiles';
import Home from '@/pages/index';

// Extend Jest matchers
expect.extend(toHaveNoViolations);

describe('Accessibility Tests', () => {
  describe('Header Component', () => {
    it('should not have any accessibility violations', async () => {
      const { container } = render(<Header />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  describe('HeroBanner Component', () => {
    it('should not have any accessibility violations', async () => {
      const { container } = render(<HeroBanner />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  describe('ServiceTiles Component', () => {
    it('should not have any accessibility violations', async () => {
      const { container } = render(<ServiceTiles />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  describe('Home Page', () => {
    it('should not have any accessibility violations', async () => {
      const { container } = render(<Home />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  describe('WCAG 2.1 AA Compliance', () => {
    it('should have proper heading hierarchy', () => {
      const { container } = render(<Home />);
      const headings = container.querySelectorAll('h1, h2, h3, h4, h5, h6');

      // Check that we have headings
      expect(headings.length).toBeGreaterThan(0);

      // Check that the first heading is h1
      expect(headings[0].tagName).toBe('H1');
    });

    it('should have proper color contrast', async () => {
      const { container } = render(<Home />);
      const results = await axe(container, {
        rules: {
          'color-contrast': { enabled: true }
        }
      });
      expect(results).toHaveNoViolations();
    });

    it('should have proper focus indicators', () => {
      const { container } = render(<ServiceTiles />);
      const links = container.querySelectorAll('a');

      links.forEach(link => {
        // Check that focusable elements are reachable
        const tabIndex = link.getAttribute('tabindex');
        expect(tabIndex).not.toBe('-1');
      });
    });

    it('should have alt text for images', () => {
      const { container } = render(<Header />);
      const images = container.querySelectorAll('img');

      images.forEach(img => {
        const alt = img.getAttribute('alt');
        expect(alt).toBeTruthy();
        expect(alt?.length).toBeGreaterThan(0);
      });
    });

    it('should have proper ARIA labels', () => {
      const { container } = render(<ServiceTiles />);

      // Check that interactive elements have labels
      const links = container.querySelectorAll('a');
      links.forEach(link => {
        const ariaLabel = link.getAttribute('aria-label');
        const text = link.textContent;
        expect(ariaLabel || text).toBeTruthy();
      });
    });

    it('should have proper landmark regions', () => {
      const { container } = render(<Home />);

      // Check for main landmark
      const main = container.querySelector('main');
      expect(main).toBeInTheDocument();

      // Check for header/banner landmark
      const header = container.querySelector('header[role="banner"], header');
      expect(header).toBeInTheDocument();
    });

    it('should support keyboard navigation', () => {
      const { container } = render(<ServiceTiles />);
      const links = container.querySelectorAll('a');

      // All links should be keyboard accessible
      links.forEach(link => {
        expect(link).toHaveAttribute('href');
      });
    });
  });
});