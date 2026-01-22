#!/bin/bash

# Setup script for Miketea Machine Integration Module

echo "🚀 Setting up Miketea Machine Integration Module..."

# Check Node.js
if ! command -v node &> /dev/null
then
    echo "❌ Node.js is not installed. Please install Node.js 16 or higher."
    exit 1
fi

echo "✅ Node.js version: $(node --version)"

# Check PostgreSQL
if ! command -v psql &> /dev/null
then
    echo "⚠️  PostgreSQL is not installed. You'll need PostgreSQL 12+ to run this project."
    echo "    Install it manually or use Docker: docker run -d -p 5432:5432 -e POSTGRES_PASSWORD=postgres postgres"
fi

# Setup backend
echo ""
echo "📦 Setting up backend..."
cd backend

# Check if .env exists
if [ ! -f .env ]; then
    echo "📝 Creating .env file from template..."
    cp .env.example .env
    echo "⚠️  Please edit backend/.env with your database credentials"
fi

npm install

echo ""
echo "🗄️  Running database migrations..."
npm run db:migrate

echo ""
echo "🌱 Seeding sample data..."
npm run db:seed

cd ..

# Setup frontend
echo ""
echo "📦 Setting up frontend..."
cd frontend

npm install

cd ..

echo ""
echo "✅ Setup complete!"
echo ""
echo "📚 Next steps:"
echo "  1. Edit backend/.env with your database credentials"
echo "  2. Start backend: cd backend && npm run dev"
echo "  3. Start frontend: cd frontend && npm run dev"
echo "  4. Open browser: http://localhost:3001"
echo ""
echo "📖 For more information, see README.md and QUICKSTART.md"
