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

# Run database migrations
echo "🗄️ Running database migrations..."
python manage.py migrate

echo "✅ Build completed successfully!"
