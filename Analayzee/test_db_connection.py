#!/usr/bin/env python
"""
Database Connection Test for Analayzee
Run this script to test your PostgreSQL connection
"""

import os
import sys
import django
from pathlib import Path

# Add the project directory to Python path
BASE_DIR = Path(__file__).resolve().parent
sys.path.append(str(BASE_DIR))

# Set Django settings module
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'Analayzee.settings')

try:
    # Initialize Django
    django.setup()
    
    from django.db import connection
    from django.core.management.color import make_style
    
    style = make_style()
    
    print("🔍 Testing database connection...")
    
    # Test connection
    with connection.cursor() as cursor:
        cursor.execute("SELECT version();")
        version = cursor.fetchone()[0]
        
    print(style.SUCCESS("✅ SUCCESS: Connected to PostgreSQL!"))
    print(f"📊 Database version: {version}")
    
    # Get database info
    db_settings = connection.settings_dict
    print(f"🏛️  Database name: {db_settings['NAME']}")
    print(f"👤 User: {db_settings['USER']}")
    print(f"🌐 Host: {db_settings['HOST']}")
    print(f"🔌 Port: {db_settings['PORT']}")
    
    # Test if tables exist
    cursor.execute("""
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public'
        ORDER BY table_name;
    """)
    tables = cursor.fetchall()
    
    if tables:
        print(f"📋 Found {len(tables)} tables in database:")
        for table in tables[:5]:  # Show first 5 tables
            print(f"   • {table[0]}")
        if len(tables) > 5:
            print(f"   ... and {len(tables) - 5} more")
    else:
        print("📋 No tables found. Run 'python manage.py migrate' to create tables.")
    
    print(style.SUCCESS("\n🎉 Database connection test completed successfully!"))
    
except Exception as e:
    print(style.ERROR(f"❌ ERROR: Could not connect to database"))
    print(style.ERROR(f"Details: {str(e)}"))
    print("\n🔧 Troubleshooting tips:")
    print("1. Make sure PostgreSQL is running")
    print("2. Check your .env file DATABASE_URL")
    print("3. Verify database and user exist")
    print("4. Run setup_postgres.bat first")
    
    sys.exit(1)
