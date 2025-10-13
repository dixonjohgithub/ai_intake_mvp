# AI-Powered GenAI Idea Assistant

A Wells Fargo-branded web application that guides users through GenAI idea submission using conversational AI, duplicate detection, and automated form generation.

## 🛠️ Tech Stack

### Core Technologies

| Technology | Purpose | Rationale |
|------------|---------|-----------|
| **Next.js 14** | Full-stack React framework | Provides built-in routing, API routes, SSR/SSG, and excellent developer experience. Ideal for MVP with minimal configuration. |
| **React 18** | UI library | Industry standard for building interactive UIs with large ecosystem and Wells Fargo familiarity. |
| **TypeScript** | Type-safe JavaScript | Reduces runtime errors, improves code maintainability, and provides better IDE support for team collaboration. |
| **Node.js 18+** | JavaScript runtime | Unified language across frontend/backend, excellent NPM ecosystem, and fast development for MVP. |
| **Docker** | Containerization | Ensures consistent environments across development/production, simplifies deployment, and isolates dependencies. |

### AI & Machine Learning

| Technology | Purpose | Rationale |
|------------|---------|-----------|
| **OpenAI GPT-5** | Conversational AI & reasoning | Latest and most capable model for natural language understanding, question generation, and intelligent reasoning. |
| **OpenAI Embeddings** | Semantic similarity | Industry-leading embeddings for accurate duplicate detection with >90% accuracy requirement. |
| **text-embedding-3-large** | Vector embeddings | High-dimensional embeddings (3072) for nuanced semantic matching of ideas and concepts. |

### Data Storage

| Technology | Purpose | Rationale |
|------------|---------|-----------|
| **PostgreSQL** | Primary database (optional) | Production-grade relational database with JSON support for complex data structures. Optional for MVP. |
| **CSV Files** | Default data storage | Simple, portable, and easily editable for MVP. No database setup required for quick prototyping. |
| **JSON** | Structured data | Native JavaScript format for storing conversation history, decision logs, and complex nested data. |

### Export & Documentation

| Technology | Purpose | Rationale |
|------------|---------|-----------|
| **PDFKit** | PDF generation | Programmatic PDF creation with precise formatting control for Wells Fargo intake forms. |
| **Docx** | Word document generation | Native .docx file creation for editable forms that maintain formatting. |
| **React PDF** | PDF preview | In-browser PDF preview without server-side generation for better UX. |

### Development Tools

| Technology | Purpose | Rationale |
|------------|---------|-----------|
| **Jest** | Unit testing | Fast, zero-config testing framework with excellent React/TypeScript support. |
| **Cypress** | E2E testing | Comprehensive end-to-end testing with visual debugging for complex user flows. |
| **ESLint** | Code linting | Enforces code quality standards and catches potential issues early. |
| **Prettier** | Code formatting | Consistent code formatting across the team, reduces style debates. |

### Infrastructure

| Technology | Purpose | Rationale |
|------------|---------|-----------|
| **Nginx** | Reverse proxy | Handles routing, SSL termination, and load balancing in production. |
| **Docker Compose** | Multi-container orchestration | Simplifies local development with all services in one command. |
| **GitHub Actions** | CI/CD (future) | Automated testing and deployment pipeline when ready for production. |

### Design & UI

| Technology | Purpose | Rationale |
|------------|---------|-----------|
| **Tailwind CSS** | Utility-first CSS | Rapid UI development with consistent spacing/colors, perfect for MVP iteration. |
| **Radix UI** | Accessible components | Pre-built accessible components that meet WCAG 2.1 AA standards. |
| **Framer Motion** | Animations | Smooth, performant animations for loading states and transitions. |
| **Chart.js** | Data visualization | Simple, responsive charts for analytics dashboard with minimal setup. |

### Why This Stack?

1. **MVP-Optimized**: Every technology chosen prioritizes rapid development and iteration without sacrificing quality.

2. **Wells Fargo Alignment**: Technologies align with enterprise standards while remaining modern and maintainable.

3. **Developer Experience**: Excellent tooling, documentation, and community support for all chosen technologies.

4. **Scalability Path**: While optimized for MVP, the stack can scale to production with minimal changes.

5. **Cost-Effective**: Open-source technologies (except OpenAI API) minimize licensing costs for prototype.

6. **Single Language**: JavaScript/TypeScript across the entire stack reduces context switching and improves velocity.

## 📈 Current Status

### ✅ Completed Features (as of October 2024)
- **Wells Fargo branded UI** with proper color scheme (#D71E2B red, #FFCD41 yellow)
- **Landing page** with service tiles and forest imagery background
- **Component architecture** with Header, HeroBanner, ServiceTiles, Footer
- **Responsive design** for desktop and mobile
- **WCAG 2.1 AA accessibility compliance**
- **Unit testing** (Jest) - 22 tests passing, 100% component coverage
- **Accessibility testing** (axe-core) - 11 tests passing
- **Visual regression testing** (Playwright) - 8 tests with baseline snapshots
- **Docker environment** with PostgreSQL
- **OpenAI integration** configured and validated

### 🚧 In Progress
- Conversational flow system (Task 2.0)
- Question generation with OpenAI (Task 2.0)

### 📅 Upcoming
- Duplicate detection system (Task 3.0)
- Form generation and export (Task 4.0)
- Data storage and analytics (Task 5.0)

## 🚀 Quick Start

### Prerequisites

- Docker & Docker Compose (v2.0+)
- Node.js (v18+) for local development
- OpenAI API Key
- 8GB RAM minimum
- Port 3073 available (or configure in .env)

### 1. Clone and Setup

```bash
# Clone the repository
git clone <repository-url>
cd AI_Intake

# Copy environment configuration
cp .env.example .env

# Edit .env and add your OpenAI API key and other settings
nano .env
```

### 2. Running with Docker (Recommended)

```bash
# Build and start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

The application will be available at:
- **Main App**: http://localhost:3073 (or configured port in .env)
- **API**: http://localhost:3001
- **Admin Panel**: http://localhost:3002

### 3. Running Locally (Development)

```bash
# Install dependencies
npm install

# Set up database
npm run db:setup

# Run migrations
npm run db:migrate

# Seed sample data (optional)
npm run db:seed

# Start development server
npm run dev
```

## 📋 Features

- **Conversational AI Interface**: Guided question flow using OpenAI GPT-5
- **Duplicate Detection**: Semantic similarity using embeddings (>90% accuracy)
- **Form Generation**: Auto-generates 2-page Wells Fargo intake form
- **Decision Logging**: Complete audit trail of all AI decisions
- **Multiple Export Formats**: PDF, Word, CSV
- **Analytics Dashboard**: Visualize submission trends and metrics
- **Docker Deployment**: Containerized for easy deployment

## 🏗️ Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Next.js App   │────▶│   API Server    │────▶│   PostgreSQL    │
│   (Port 3000)   │     │   (Port 3001)   │     │   (Port 5432)   │
└─────────────────┘     └─────────────────┘     └─────────────────┘
                               │                          │
                               ▼                          ▼
                        ┌─────────────────┐     ┌─────────────────┐
                        │   OpenAI API    │     │     Redis       │
                        │   (External)    │     │   (Port 6379)   │
                        └─────────────────┘     └─────────────────┘
```

## 🔧 Configuration

### Environment Variables

Key environment variables in `.env`:

```bash
# Application Ports
APP_PORT=3000          # Main web application
API_PORT=3001          # Backend API
ADMIN_PORT=3002        # Admin dashboard

# OpenAI Configuration
OPENAI_API_KEY=sk-...  # Your OpenAI API key
OPENAI_MODEL=gpt-5
OPENAI_REASONING_MODEL=o1-preview

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=ai_intake_db
```

### Port Configuration

To avoid conflicts with other Node.js applications:

1. Check which ports are in use:
```bash
lsof -i :3000-3010
```

2. Update ports in `.env`:
```bash
APP_PORT=3005    # Change to available port
API_PORT=3006    # Change to available port
```

3. Restart services:
```bash
docker-compose restart
```

## 🧪 Testing

### Run All Tests
```bash
npm test
```

### Specific Test Suites
```bash
# Unit tests with coverage
npm test -- --coverage

# Accessibility tests
npm test src/__tests__/accessibility

# Visual regression tests
npm run test:visual

# Update visual snapshots
npm run test:visual:update

# Watch mode for development
npm run test:watch
```

### Test a Complete Flow
```bash
# Start the application
docker-compose up -d

# Run E2E test for complete submission flow
npm run cypress:open
```

## 📊 Data Management

### CSV Data Location
- Main data: `data/ai_intake_ideas.csv`
- Decision logs: `data/decision_logs.csv`

### Database Operations
```bash
# Backup database
npm run db:backup

# Restore database
npm run db:restore

# View database logs
docker-compose logs postgres
```

### Sample Data
```bash
# Generate sample data
npm run generate:sample-data

# Import CSV to database
npm run import:csv
```

## 🔍 Monitoring & Debugging

### View Logs
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f app
docker-compose logs -f api
docker-compose logs -f postgres
```

### Debug Panel
Access the debug panel at: http://localhost:3002/debug

Features:
- View all AI decisions
- Inspect prompts and responses
- Track token usage
- Review confidence scores

### Health Checks
```bash
# Check service health
curl http://localhost:3001/health

# Check database connection
curl http://localhost:3001/health/db

# Check OpenAI connection
curl http://localhost:3001/health/openai
```

## 🚢 Production Deployment

### Build Production Images
```bash
# Build optimized production image
docker build -t ai-intake:prod -f Dockerfile.prod .

# Run production stack
docker-compose -f docker-compose.prod.yml up -d
```

### Environment-Specific Configs
```bash
# Development
docker-compose -f docker-compose.yml up

# Staging
docker-compose -f docker-compose.staging.yml up

# Production
docker-compose -f docker-compose.prod.yml up
```

### SSL/TLS Setup
```bash
# Generate certificates
./scripts/generate-certs.sh

# Update nginx configuration
cp nginx/nginx-ssl.conf nginx/nginx.conf

# Restart nginx
docker-compose restart nginx
```

## 📝 API Documentation

### Key Endpoints

#### Start Conversation
```http
POST /api/conversation/start
Content-Type: application/json

{
  "service": "genai_idea"
}
```

#### Submit Answer
```http
POST /api/conversation/answer
Content-Type: application/json

{
  "sessionId": "...",
  "questionId": "...",
  "answer": "..."
}
```

#### Check Duplicates
```http
POST /api/duplicates/check
Content-Type: application/json

{
  "title": "...",
  "description": "..."
}
```

#### Generate Form
```http
POST /api/form/generate
Content-Type: application/json

{
  "sessionId": "...",
  "format": "pdf" // or "word", "preview"
}
```

## 🐛 Troubleshooting

### Common Issues

#### Port Already in Use
```bash
# Find process using port
lsof -i :3000

# Kill process
kill -9 <PID>

# Or change port in .env
APP_PORT=3005
```

#### OpenAI API Errors
- Check API key in `.env`
- Verify API quota/limits
- Check network connectivity
- Review logs: `docker-compose logs api`

#### Database Connection Issues
```bash
# Check PostgreSQL status
docker-compose ps postgres

# Reset database
docker-compose down -v
docker-compose up -d
npm run db:setup
```

#### Memory Issues
```bash
# Increase Docker memory allocation
# Docker Desktop > Preferences > Resources > Memory: 4GB+

# Or use swap
sudo swapon -s
```

## 📚 Documentation

- [API Documentation](./docs/API.md)
- [Testing Guide](./docs/TESTING.md)
- [Deployment Guide](./docs/DEPLOYMENT.md)
- [Data Dictionary](./data/data_dictionary.md)
- [Decision Log Schema](./data/decision_log_schema.md)

## 🤝 Development Workflow

1. Create feature branch
2. Make changes
3. Run tests: `npm test`
4. Build Docker image: `docker build -t ai-intake:dev .`
5. Test in Docker: `docker-compose up`
6. Submit PR

## 📞 Support

For issues or questions:
- Check logs: `docker-compose logs`
- Review documentation in `/docs`
- Check task list: `/tasks/tasks-prd-genai-idea-assistant.md`

## 📄 License

Property of Wells Fargo - Internal Use Only

---

## Quick Commands Reference

```bash
# Start everything
docker-compose up -d

# Stop everything
docker-compose down

# View logs
docker-compose logs -f

# Run tests
npm test

# Access application
open http://localhost:3000

# Access admin panel
open http://localhost:3002

# Check health
curl http://localhost:3001/health
```