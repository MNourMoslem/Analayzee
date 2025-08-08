@echo off
REM Analayzee Deployment Script for Windows
REM This script helps deploy the application to production

echo 🚀 Starting Analayzee deployment...

REM Check if virtual environment exists
if not exist "venv" (
    echo 📦 Creating virtual environment...
    python -m venv venv
)

REM Activate virtual environment
echo 🔄 Activating virtual environment...
call venv\Scripts\activate.bat

REM Install dependencies
echo 📚 Installing dependencies...
pip install -r requirements-prod.txt

REM Check environment file
if not exist ".env" (
    echo ⚠️  Warning: .env file not found. Copying from .env.example
    copy .env.example .env
    echo ⚠️  Please edit .env file with your production settings!
    pause
    exit /b 1
)

REM Create logs directory
echo 📁 Creating logs directory...
if not exist "logs" mkdir logs

REM Create media directory
echo 📁 Creating media directory...
if not exist "media" mkdir media

REM Run database migrations
echo 🗄️  Running database migrations...
python manage.py makemigrations
python manage.py migrate

REM Collect static files
echo 📦 Collecting static files...
python manage.py collectstatic --noinput

REM Run system check
echo 🔍 Running system check...
python manage.py check --deploy

echo ✅ Deployment completed successfully!
echo.
echo 🌟 Next steps:
echo 1. Configure your web server (IIS, nginx, Apache)
echo 2. Set up SSL certificate
echo 3. Configure your domain in ALLOWED_HOSTS
echo 4. Set DEBUG=False in production
echo 5. Start your WSGI server (gunicorn, waitress)
echo.
echo 🚀 To start with Gunicorn:
echo gunicorn Analayzee.wsgi:application --bind 0.0.0.0:8000

pause
