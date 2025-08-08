#!/bin/bash
# PostgreSQL Setup Script for Analayzee

echo "🐘 Setting up PostgreSQL for Analayzee..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Database configuration
DB_NAME="analayzee_db"
DB_USER="analayzee_user"
DB_PASSWORD="analayzee2024!"

echo -e "${YELLOW}Creating PostgreSQL database and user...${NC}"

# Check if PostgreSQL is running
if ! pg_isready -q; then
    echo -e "${RED}PostgreSQL is not running. Please start PostgreSQL service.${NC}"
    exit 1
fi

# Create database and user
createdb "$DB_NAME" 2>/dev/null
if [ $? -eq 0 ]; then
    echo -e "${GREEN}Database '$DB_NAME' created successfully.${NC}"
else
    echo -e "${YELLOW}Database '$DB_NAME' might already exist.${NC}"
fi

# Create user and grant privileges
psql -c "CREATE USER $DB_USER WITH ENCRYPTED PASSWORD '$DB_PASSWORD';" 2>/dev/null
psql -c "GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;"
psql -c "ALTER USER $DB_USER CREATEDB;"

echo -e "${GREEN}PostgreSQL setup completed!${NC}"
echo -e "${YELLOW}Database Details:${NC}"
echo "  Database: $DB_NAME"
echo "  Username: $DB_USER"
echo "  Password: $DB_PASSWORD"
echo "  Host: localhost"
echo "  Port: 5432"

echo -e "\n${YELLOW}Update your .env file with:${NC}"
echo "DATABASE_URL=postgresql://$DB_USER:$DB_PASSWORD@localhost:5432/$DB_NAME"

echo -e "\n${GREEN}Next steps:${NC}"
echo "1. Update your .env file with the database URL above"
echo "2. Run: python manage.py migrate"
echo "3. Run: python manage.py createsuperuser"
