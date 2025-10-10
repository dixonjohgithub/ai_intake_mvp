import React from 'react';

/**
 * Landing page placeholder for AI Intake Assistant
 * This will be replaced with the full implementation in Task 1.0
 */

export default function Home() {
  return (
    <div style={{
      padding: '2rem',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      maxWidth: '1200px',
      margin: '0 auto'
    }}>
      <h1 style={{ color: '#D71E2B', marginBottom: '1rem' }}>
        AI-Powered GenAI Idea Assistant
      </h1>

      <p style={{ fontSize: '1.25rem', marginBottom: '2rem' }}>
        Wells Fargo GenAI Intake System - Docker Environment Ready
      </p>

      <div style={{
        backgroundColor: '#f5f5f5',
        padding: '1rem',
        borderRadius: '8px',
        marginBottom: '2rem'
      }}>
        <h2 style={{ marginBottom: '1rem' }}>System Status</h2>
        <ul style={{ listStyle: 'none', padding: 0 }}>
          <li>✅ Docker Environment Configured</li>
          <li>✅ Next.js Application Running</li>
          <li>✅ Health Check Endpoints Available</li>
          <li>⏳ Full UI Implementation Pending (Task 1.0)</li>
        </ul>
      </div>

      <div style={{ marginBottom: '2rem' }}>
        <h2>Health Check Endpoints</h2>
        <ul>
          <li><a href="/api/health">/api/health</a> - Overall system health</li>
          <li><a href="/api/health/db">/api/health/db</a> - Database health</li>
          <li><a href="/api/health/openai">/api/health/openai</a> - OpenAI API health</li>
        </ul>
      </div>

      <div style={{
        padding: '1rem',
        backgroundColor: '#FFCD41',
        borderRadius: '8px',
        marginTop: '2rem'
      }}>
        <p style={{ margin: 0, fontWeight: 'bold' }}>
          Environment: {process.env.NODE_ENV}
        </p>
        <p style={{ margin: '0.5rem 0 0 0' }}>
          Ready for development. Run task 1.0 to implement the full Wells Fargo branded UI.
        </p>
      </div>
    </div>
  );
}