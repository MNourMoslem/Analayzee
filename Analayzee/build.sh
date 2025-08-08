#!/usr/bin/env bash
# Render.com build script for Analayzee

set -o errexit  # exit on error

echo "🚀 Starting Render.com build for Analayzee..."

# Install dependencies
echo "📦 Installing Python dependencies..."
pip install --upgrade pip
pip install -r requirements.txt

# Create necessary directories
echo "📁 Creating required directories..."
mkdir -p staticfiles
mkdir -p logs
mkdir -p media

# Collect static files
echo "📦 Collecting static files..."
python manage.py collectstatic --noinput

# Run database migrations in proper order
echo "🗄️ Running database migrations..."
# First, run basic Django migrations to create core tables
python manage.py migrate contenttypes
python manage.py migrate auth
python manage.py migrate sessions
python manage.py migrate admin
# Then run all remaining migrations including accounts
python manage.py migrate

echo "✅ Build completed successfully!"
