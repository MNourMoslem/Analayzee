#!/bin/bash

# Analayzee Deployment Script
# This script helps deploy the application to production

set -e  # Exit on any error

echo "🚀 Starting Analayzee deployment..."

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo "📦 Creating virtual environment..."
    python -m venv venv
fi

# Activate virtual environment
echo "🔄 Activating virtual environment..."
source venv/bin/activate

# Install dependencies
echo "📚 Installing dependencies..."
pip install -r requirements-prod.txt

# Check environment file
if [ ! -f ".env" ]; then
    echo "⚠️  Warning: .env file not found. Copying from .env.example"
    cp .env.example .env
    echo "⚠️  Please edit .env file with your production settings!"
    exit 1
fi

# Generate secret key if not set
if grep -q "your-secret-key-here" .env; then
    echo "🔑 Generating new secret key..."
    NEW_SECRET_KEY=$(python -c 'from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())')
    sed -i "s/your-secret-key-here/$NEW_SECRET_KEY/" .env
fi

# Create logs directory
echo "📁 Creating logs directory..."
mkdir -p logs

# Create media directory
echo "📁 Creating media directory..."
mkdir -p media

# Run database migrations
echo "🗄️  Running database migrations..."
python manage.py makemigrations
python manage.py migrate

# Create superuser if it doesn't exist
echo "👤 Checking for superuser..."
python manage.py shell -c "
from django.contrib.auth import get_user_model;
User = get_user_model();
if not User.objects.filter(is_superuser=True).exists():
    print('No superuser found. Please create one:');
    exit()
else:
    print('Superuser already exists.')
"

# Collect static files
echo "📦 Collecting static files..."
python manage.py collectstatic --noinput

# Run system check
echo "🔍 Running system check..."
python manage.py check --deploy

echo "✅ Deployment completed successfully!"
echo ""
echo "🌟 Next steps:"
echo "1. Configure your web server (nginx, Apache)"
echo "2. Set up SSL certificate"
echo "3. Configure your domain in ALLOWED_HOSTS"
echo "4. Set DEBUG=False in production"
echo "5. Start your WSGI server (gunicorn, uwsgi)"
echo ""
echo "🚀 To start with Gunicorn:"
echo "gunicorn Analayzee.wsgi:application --bind 0.0.0.0:8000"
