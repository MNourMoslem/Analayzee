-- PostgreSQL Database Setup Script for Analayzee
-- Run these commands in pgAdmin or psql command line

-- 1. Connect as postgres superuser and create database
CREATE DATABASE analayzee_db;

-- 2. Create a dedicated user for the application
CREATE USER analayzee_user WITH ENCRYPTED PASSWORD 'your_secure_password_here';

-- 3. Grant all privileges on the database to the user
GRANT ALL PRIVILEGES ON DATABASE analayzee_db TO analayzee_user;

-- 4. Connect to the analayzee_db database and grant schema privileges
\c analayzee_db;
GRANT ALL ON SCHEMA public TO analayzee_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO analayzee_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO analayzee_user;

-- 5. Ensure the user can create tables (needed for Django migrations)
ALTER USER analayzee_user CREATEDB;

-- Optional: Check the setup
\du -- List users
\l  -- List databases

-- Your connection details will be:
-- Database: analayzee_db
-- Username: analayzee_user  
-- Password: your_secure_password_here
-- Host: localhost
-- Port: 5432
