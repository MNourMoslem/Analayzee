# 🐘 PostgreSQL Integration Guide for Analayzee

This guide will help you set up PostgreSQL for your Analayzee project.

## 📋 Prerequisites

- PostgreSQL installed on your system
- pgAdmin (comes with PostgreSQL installer)
- Python with psycopg2-binary installed ✅

## 🚀 Quick Setup (After PostgreSQL Installation)

### Step 1: Run the Setup Script

**Windows:**
```cmd
setup_postgres.bat
```

**Linux/Mac:**
```bash
chmod +x setup_postgres.sh
./setup_postgres.sh
```

### Step 2: Update Your .env File

Replace the database configuration in your `.env` file:

```env
# Replace this line:
# DATABASE_URL=postgresql://analayzee_user:your_password@localhost:5432/analayzee_db

# With your actual password:
DATABASE_URL=postgresql://analayzee_user:analayzee2024!@localhost:5432/analayzee_db
```

### Step 3: Run Migrations

```bash
python manage.py migrate
```

### Step 4: Create Superuser

```bash
python manage.py createsuperuser
```

## 🔧 Manual Setup (Alternative)

If the scripts don't work, follow these manual steps:

### 1. Open pgAdmin or psql

**Using pgAdmin:**
- Open pgAdmin
- Connect to PostgreSQL server
- Right-click "Databases" → "Create" → "Database"

**Using psql command line:**
```bash
psql -U postgres
```

### 2. Create Database and User

```sql
-- Create database
CREATE DATABASE analayzee_db;

-- Create user
CREATE USER analayzee_user WITH ENCRYPTED PASSWORD 'analayzee2024!';

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE analayzee_db TO analayzee_user;
ALTER USER analayzee_user CREATEDB;
```

### 3. Update Connection Settings

Update your `.env` file:
```env
DATABASE_URL=postgresql://analayzee_user:analayzee2024!@localhost:5432/analayzee_db
```

## 🔍 Testing the Connection

Test if Django can connect to PostgreSQL:

```bash
python manage.py dbshell
```

If successful, you'll see the PostgreSQL prompt:
```
analayzee_db=>
```

Type `\q` to exit.

## 📊 Database Management

### Using pgAdmin (Recommended)
- **Host:** localhost
- **Port:** 5432
- **Database:** analayzee_db
- **Username:** analayzee_user
- **Password:** analayzee2024!

### Common Commands

```bash
# Check database status
python manage.py dbshell

# Show all tables
python manage.py dbshell -c "\dt"

# Show database size
python manage.py dbshell -c "SELECT pg_size_pretty(pg_database_size('analayzee_db'));"

# Backup database
pg_dump analayzee_db > backup.sql

# Restore database
psql analayzee_db < backup.sql
```

## 🔧 Configuration Details

### Your Database Settings

```python
# In settings.py (automatically configured)
DATABASES = {
    'default': dj_database_url.parse(os.environ.get('DATABASE_URL'))
}
```

### Connection Parameters
- **Database Engine:** PostgreSQL
- **Database Name:** analayzee_db
- **Username:** analayzee_user
- **Password:** analayzee2024! (change this!)
- **Host:** localhost
- **Port:** 5432

## 🛠️ Troubleshooting

### Common Issues:

**1. "pg_config executable not found"**
- Solution: Install PostgreSQL development headers
- Windows: Included with PostgreSQL installer
- Ubuntu: `sudo apt-get install libpq-dev`

**2. "FATAL: password authentication failed"**
- Check your password in .env file
- Verify user exists: `psql -U postgres -c "\du"`

**3. "FATAL: database does not exist"**
- Create database: `createdb analayzee_db`
- Or use pgAdmin to create database

**4. "psql: command not found"**
- Add PostgreSQL bin to PATH
- Windows: Usually `C:\Program Files\PostgreSQL\15\bin`

**5. Connection refused**
- Check if PostgreSQL service is running
- Windows: Services → PostgreSQL
- Linux: `sudo systemctl status postgresql`

### Debug Commands:

```bash
# Check if PostgreSQL is running
pg_isready

# List databases
psql -U postgres -l

# Connect as postgres user
psql -U postgres

# Test Django database connection
python manage.py check --database default
```

## 📈 Performance Tips

### 1. Database Indexing
Your models already have proper indexing, but you can add more:

```python
# In models.py
class Meta:
    indexes = [
        models.Index(fields=['created_at']),
        models.Index(fields=['email']),
    ]
```

### 2. Connection Pooling (Optional)
For high-traffic sites, add connection pooling:

```bash
pip install django-db-geventpool
```

### 3. Database Monitoring
Use pgAdmin or add monitoring:

```bash
# Show active connections
SELECT * FROM pg_stat_activity;

# Show database size
SELECT pg_size_pretty(pg_database_size('analayzee_db'));
```

## 🔒 Security Considerations

1. **Change Default Password**
   - Update `analayzee2024!` to a secure password
   - Use environment variables for sensitive data

2. **Network Security**
   - PostgreSQL runs on localhost by default
   - For production, configure proper firewall rules

3. **User Privileges**
   - The setup creates a user with necessary privileges only
   - No superuser access for application user

## 🚀 Production Deployment

For production (Render.com handles this automatically):

1. **Use managed PostgreSQL service**
2. **Update DATABASE_URL with production credentials**
3. **Enable SSL connection**
4. **Set up backup strategy**

## 📝 Migration from SQLite

Your existing SQLite data can be migrated:

```bash
# Dump SQLite data
python manage.py dumpdata > data.json

# Switch to PostgreSQL and migrate
python manage.py migrate

# Load SQLite data
python manage.py loaddata data.json
```

## ✅ Verification Checklist

- [ ] PostgreSQL installed and running
- [ ] Database `analayzee_db` created
- [ ] User `analayzee_user` created with proper privileges
- [ ] `.env` file updated with correct DATABASE_URL
- [ ] Django migrations completed successfully
- [ ] Can access database via pgAdmin
- [ ] Superuser created for Django admin
- [ ] Application starts without database errors

---

**🎉 Success!** Your Analayzee project is now using PostgreSQL!

Your data will be more robust, performant, and production-ready. PostgreSQL provides better concurrent access, data integrity, and scalability compared to SQLite.
