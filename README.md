# Chess Tournament Platform

A comprehensive chess tournament management platform built with React, Supabase, and AWS Lambda.

## Architecture

- **Frontend**: React with Zustand state management and Vite build tool
- **Backend**: Supabase for data storage, authentication, and real-time features
- **Business Logic**: AWS Lambda functions with API Gateway
- **Deployment**: AWS Amplify for CI/CD
- **Monitoring**: Sentry for error tracking
- **Testing**: Cypress for end-to-end testing

## Features

- User authentication and profile management
- ELO rating system
- Tournament creation and management
- Real-time match updates
- Social features (following, clubs)
- Comprehensive analytics

## Getting Started

### Prerequisites

- Node.js 18+
- Supabase account
- AWS account (for Lambda functions)
- Sentry account (for error tracking)

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Copy environment variables:
   ```bash
   cp .env.example .env
   ```

4. Update the `.env` file with your configuration:
   - Supabase URL and anon key
   - AWS API Gateway URL
   - Sentry DSN

### Database Setup

1. Create a new Supabase project
2. Run the migrations in order:
   ```sql
   -- Run each file in supabase/migrations/ in order
   ```

3. Enable Row Level Security policies as defined in the migration files

### Development

Start the development server:
```bash
npm run dev
```

### Testing

Run Cypress tests:
```bash
npm run test
```

For headless testing:
```bash
npm run test:headless
```

## Project Structure

```
src/
├── components/          # React components
│   ├── auth/           # Authentication components
│   ├── tournaments/    # Tournament management
│   └── matches/        # Match components
├── stores/             # Zustand stores
├── lib/                # Utility libraries
├── types/              # TypeScript type definitions
└── hooks/              # Custom React hooks
```

## Deployment

### Phase 1: Core Infrastructure
- [x] Supabase project setup
- [x] Database schema and RLS policies
- [x] Authentication flow
- [x] Basic React application structure

### Phase 2: Feature Implementation
- [ ] Match scoring system
- [ ] Real-time updates
- [ ] ELO rating calculations
- [ ] User profile management

### Phase 3: Advanced Features
- [ ] Tournament brackets
- [ ] Social features
- [ ] Analytics dashboard
- [ ] Notification system

### Phase 4: Production Deployment
- [ ] AWS Amplify setup
- [ ] CI/CD pipeline
- [ ] Monitoring and logging
- [ ] Performance optimization

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## License

This project is licensed under the MIT License.