# Legislative News API

Backend service for managing and serving legislative news articles, built with Node.js, TypeScript, PostgreSQL, and Redis.

## Tech Stack

- Node.js & TypeScript
- PostgreSQL for data persistence
- Redis for caching
- Docker for containerization
- Express.js for routing
- Winston for logging

## Features

- RESTful API endpoints
- Database migrations and seeding
- Redis caching layer
- Error handling middleware
- Request filtering and pagination
- Full-text search capabilities

## Getting Started

### Prerequisites

- Node.js 18+
- Docker and Docker Compose
- PostgreSQL 14+
- Redis 6+

### Environment Setup

Create a `.env` file:

```env
# Server
PORT=8080

# PostgreSQL
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_DB=legislative_news
POSTGRES_HOST=localhost
POSTGRES_PORT=5432

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=your_redis_password
```

### Docker Setup

```bash
# Build and start containers
docker-compose up -d

# Stop containers
docker-compose down
```

### Database Setup

```bash
# Run migrations
npm run migrate

# Seed database
npm run seed
```

## API Endpoints

### News Routes
- `GET /api/news` - Get paginated news with filters
- `GET /api/news/:id` - Get article by ID
- `GET /api/news/metadata/states` - Get available states
- `GET /api/news/metadata/topics` - Get available topics
- `PUT /api/news/:id` - Update Article

### Admin Routes
- `POST /api/admin/states` - Creates a new unique state
- `POST /api/admin/topics` - Creates a new unique topic



## Caching Strategy

The service implements a two-layer caching strategy:

1. Redis Cache:
```typescript
private readonly CACHE_TTL = 300; // 5 minutes

async getNews(filters: NewsFilters, pagination: PaginationOptions) {
  const cacheKey = this.generateCacheKey(filters, pagination);
  const cachedResult = await this.cache.get(cacheKey);
  
  if (cachedResult) {
    return JSON.parse(cachedResult);
  }
  // ... fetch and cache data
}
```

2. Database Indices:
```sql
CREATE INDEX idx_articles_state ON articles(state);
CREATE INDEX idx_articles_topic ON articles(topic);
CREATE INDEX idx_articles_published_date ON articles(published_date);
CREATE INDEX idx_articles_title_text ON articles USING GIN (to_tsvector('english', title));
```

## Error Handling

Centralized error handling through middleware:

```typescript
export class AppError extends Error {
  constructor(public statusCode: number, message: string) {
    super(message);
  }
}
```

## Logging

Winston logger configuration for development and production:

```typescript
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'error.log', level: 'error' })
  ]
});
```

## Development

```bash
# Install dependencies
npm install

# Run in development
npm run dev

# Build
npm run build

# Run tests
npm run test

# Lint
npm run lint
```

## Makefile Commands

```bash
# Start docker compose 
make up

# Stop docker compose
make down

# Start dev application => npm run dev
make run
```

## Production Deployment

```bash
# Build the application
npm run build

# Start production server
npm start
```
