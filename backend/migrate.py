#!/usr/bin/env python
"""
Database migration runner script.

Usage:
    python migrate.py init_db           # Initialize PostgreSQL and run migrations
    python migrate.py upgrade           # Apply pending migrations
    python migrate.py downgrade         # Rollback last migration
    python migrate.py current           # Show current migration revision
    python migrate.py history           # Show migration history
"""
import sys
import os
from pathlib import Path

# Add backend directory to path
backend_dir = Path(__file__).parent
sys.path.insert(0, str(backend_dir))

from alembic.config import Config as AlembicConfig
from alembic import command
from .config import Config


def get_alembic_config():
    """Get Alembic configuration."""
    alembic_cfg = AlembicConfig(str(backend_dir / "alembic.ini"))
    alembic_cfg.set_main_option("sqlalchemy.url", Config.SQLALCHEMY_DATABASE_URI)
    alembic_cfg.set_main_option("script_location", str(backend_dir / "alembic"))
    return alembic_cfg


def init_db():
    """Initialize database and run migrations."""
    print("🔄 Setting up database...")
    print(f"Database URI: {Config.SQLALCHEMY_DATABASE_URI}")
    
    alembic_cfg = get_alembic_config()
    
    try:
        print("✅ Running migrations...")
        command.upgrade(alembic_cfg, "head")
        print("✅ Database initialized successfully!")
        
        # Seed admin user
        from database import get_db, User
        from extensions import bcrypt
        
        db = get_db()
        admin_email = 'sikiking237@gmail.com'
        if not db.query(User).filter_by(email=admin_email).first():
            hashed_password = bcrypt.generate_password_hash('admin123').decode('utf-8')
            admin_user = User(
                name='Siki King',
                email=admin_email,
                password=hashed_password,
                role='admin',
                is_active=True
            )
            db.add(admin_user)
            db.commit()
            print(f"✅ Admin user seeded: {admin_email} / admin123")
        else:
            print("ℹ️ Admin user already exists.")
    except Exception as e:
        print(f"❌ Migration failed: {e}")
        sys.exit(1)


def upgrade():
    """Apply pending migrations."""
    alembic_cfg = get_alembic_config()
    try:
        command.upgrade(alembic_cfg, "head")
        print("✅ Migrations applied successfully!")
    except Exception as e:
        print(f"❌ Upgrade failed: {e}")
        sys.exit(1)


def downgrade():
    """Rollback last migration."""
    alembic_cfg = get_alembic_config()
    try:
        command.downgrade(alembic_cfg, "-1")
        print("✅ Rollback successful!")
    except Exception as e:
        print(f"❌ Downgrade failed: {e}")
        sys.exit(1)


def current():
    """Show current migration revision."""
    alembic_cfg = get_alembic_config()
    try:
        command.current(alembic_cfg)
    except Exception as e:
        print(f"❌ Error: {e}")
        sys.exit(1)


def history():
    """Show migration history."""
    alembic_cfg = get_alembic_config()
    try:
        command.history(alembic_cfg)
    except Exception as e:
        print(f"❌ Error: {e}")
        sys.exit(1)


if __name__ == '__main__':
    if len(sys.argv) < 2:
        print(__doc__)
        sys.exit(0)
    
    command = sys.argv[1]
    
    if command == 'init_db':
        init_db()
    elif command == 'upgrade':
        upgrade()
    elif command == 'downgrade':
        downgrade()
    elif command == 'current':
        current()
    elif command == 'history':
        history()
    else:
        print(f"Unknown command: {command}")
        print(__doc__)
        sys.exit(1)
