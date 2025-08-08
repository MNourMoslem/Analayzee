@echo off
REM PostgreSQL Setup Script for Analayzee (Windows)

echo 🐘 Setting up PostgreSQL for Analayzee...

REM Database configuration
set DB_NAME=analayzee_db
set DB_USER=analayzee_user
set DB_PASSWORD=analayzee2024!

echo Creating PostgreSQL database and user...

REM Check if PostgreSQL is accessible
pg_isready >nul 2>&1
if errorlevel 1 (
    echo ERROR: PostgreSQL is not running or not in PATH.
    echo Please make sure PostgreSQL is installed and running.
    echo Add PostgreSQL bin directory to your PATH.
    pause
    exit /b 1
)

REM Create database
echo Creating database: %DB_NAME%
createdb %DB_NAME% 2>nul
if errorlevel 1 (
    echo WARNING: Database might already exist or creation failed.
) else (
    echo SUCCESS: Database '%DB_NAME%' created.
)

REM Create user and grant privileges
echo Creating user and setting privileges...
psql -c "CREATE USER %DB_USER% WITH ENCRYPTED PASSWORD '%DB_PASSWORD%';" 2>nul
psql -c "GRANT ALL PRIVILEGES ON DATABASE %DB_NAME% TO %DB_USER%;"
psql -c "ALTER USER %DB_USER% CREATEDB;"

echo.
echo ✅ PostgreSQL setup completed!
echo.
echo Database Details:
echo   Database: %DB_NAME%
echo   Username: %DB_USER%
echo   Password: %DB_PASSWORD%
echo   Host: localhost
echo   Port: 5432
echo.
echo Update your .env file with:
echo DATABASE_URL=postgresql://%DB_USER%:%DB_PASSWORD%@localhost:5432/%DB_NAME%
echo.
echo Next steps:
echo 1. Update your .env file with the database URL above
echo 2. Run: python manage.py migrate
echo 3. Run: python manage.py createsuperuser
echo.
pause
