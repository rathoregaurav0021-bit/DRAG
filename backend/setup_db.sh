#!/bin/bash
# setup_db.sh
# Automates the creation of the FloodShield database, user, and PostGIS extension for Linux/macOS.

set -e # Exit on error

DB_NAME="floodshield_db"
DB_USER="floodshield_user"
DB_PASS="floodshield_pass"

echo -e "\e[36m=========================================\e[0m"
echo -e "\e[36m   FloodShield Database Initialization   \e[0m"
echo -e "\e[36m=========================================\e[0m"
echo ""

# Check if psql is available
if ! command -v psql &> /dev/null; then
    echo -e "\e[31mERROR: 'psql' command not found.\e[0m"
    echo "Please ensure PostgreSQL is installed on your system."
    echo "Ubuntu/Debian: sudo apt install postgresql postgis"
    echo "macOS: brew install postgresql postgis"
    exit 1
fi

echo -e "\e[33mPlease enter the password for your 'postgres' superuser account when prompted.\e[0m"
echo ""

# 1. Create the user
echo " -> Creating user '$DB_USER'..."
sudo -u postgres psql -c "CREATE USER $DB_USER WITH PASSWORD '$DB_PASS';" || true

# 2. Create the database
echo " -> Creating database '$DB_NAME'..."
sudo -u postgres psql -c "CREATE DATABASE $DB_NAME OWNER $DB_USER;" || true

# 3. Enable PostGIS extension
echo " -> Enabling PostGIS extension inside '$DB_NAME'..."
sudo -u postgres psql -d $DB_NAME -c "CREATE EXTENSION IF NOT EXISTS postgis;"

echo ""
echo -e "\e[32m✅ Database Setup Complete!\e[0m"
echo "The PostGIS spatial database is now ready for the FloodShield pipeline."
