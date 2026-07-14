# PostgreSQL Migration Setup Guide

This document explains how to migrate from SQLite to PostgreSQL using Alembic.

## Prerequisites

1. **PostgreSQL installed** — Download from https://www.postgresql.org/download/
2. **Python dependencies installed**:
   ```bash
   cd backend
   pip install -r requirements.txt
   ```

## Step 1: Create PostgreSQL Database

### Option A: Using pgAdmin (GUI)
1. Open pgAdmin
2. Right-click "Databases" → "Create" → "Database"
3. Name: `mysterypath`
4. Click "Save"

### Option B: Using psql (Command Line)
```bash
psql -U postgres
CREATE DATABASE mysterypath;
\q
```

## Step 2: Set Environment Variables

Create or update `.env` file in the `backend/` directory:

```env
# Database
DB_TYPE=postgresql
DB_USER=postgres
DB_PASSWORD=your_postgres_password
DB_HOST=localhost
DB_PORT=5432
DB_NAME=mysterypath

# Flask
FLASK_ENV=development
SECRET_KEY=your-secret-key-here

# Other settings
CORS_ORIGINS=http://localhost:5173,http://localhost:5174,http://localhost:5175
```

## Step 3: Run Migrations

From the `backend/` directory:

```bash
# Initialize database and run all migrations
python migrate.py init_db

# Or run migrations only (if DB already initialized)
python migrate.py upgrade

# Check current migration status
python migrate.py current

# View migration history
python migrate.py history

# Rollback last migration
python migrate.py downgrade
```

## Step 4: Start the Application

```bash
# Backend
cd backend
python run.py

# Frontend (in another terminal)
cd ..
npm run dev
```

## Migrating Data from SQLite

If you have existing data in SQLite, use this approach:

1. **Export from SQLite**:
   ```bash
   python export_sqlite.py  # We'll create this script
   ```

2. **Import to PostgreSQL**:
   ```bash
   python import_postgres.py  # We'll create this script
   ```

## Migration Files

- `alembic.ini` — Alembic configuration
- `alembic/env.py` — Migration environment setup
- `alembic/versions/001_initial.py` — Initial schema migration
- `migrate.py` — Migration runner script

## Troubleshooting

### Connection Error: "could not connect to server"
- Ensure PostgreSQL is running: `sudo systemctl start postgresql` (Linux/Mac) or start from Services (Windows)
- Check credentials in `.env`
- Verify database exists: `psql -U postgres -l`

### Error: "database does not exist"
- Create it: `psql -U postgres -c "CREATE DATABASE mysterypath;"`

### Foreign Key Errors During Migration
- Drop existing tables first or use a fresh database
- Alembic handles cascade deletes automatically

### Rollback Procedure
If migrations fail:
```bash
python migrate.py downgrade  # Rollback one migration
# Fix issues
python migrate.py upgrade    # Apply again
```

## Next Steps

1. Update `database.py` to use SQLAlchemy instead of sqlite3
2. Update `app.py` to use SQLAlchemy ORM models
3. Remove raw SQL queries in favor of ORM
4. Add comprehensive error handling
5. Add migration support to CI/CD pipeline

## Production Deployment

For production, use a connection pool:

```env
DB_POOL_SIZE=10
DB_POOL_RECYCLE=3600
DB_POOL_PRE_PING=true
```

This helps manage database connections efficiently and automatically reconnects if needed.
