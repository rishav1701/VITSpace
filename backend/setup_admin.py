"""
VITSpace — Admin Setup Script

Run this once to create the AUTH table and seed the initial admin user.
Reads credentials from .env file.

Usage:
    python setup_admin.py
"""

import sys
import os

# Add project root to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from dotenv import load_dotenv
load_dotenv()

from app.database.connection import get_db, get_cursor, check_connection
from app.security.auth import hash_password
from app.core.config import get_settings


def create_auth_table():
    """Create the AUTH table if it doesn't exist."""
    with get_db() as conn:
        with get_cursor(conn) as cur:
            # Check if table exists
            cur.execute(
                "SELECT COUNT(*) FROM user_tables WHERE table_name = 'AUTH'"
            )
            if cur.fetchone()[0] > 0:
                print("[OK] AUTH table already exists.")
                return False

            print("[*] Creating AUTH table...")
            cur.execute("""
                CREATE TABLE AUTH (
                    UserID       NUMBER          PRIMARY KEY,
                    Username     VARCHAR2(50)    NOT NULL UNIQUE,
                    PasswordHash VARCHAR2(256)   NOT NULL,
                    Role         VARCHAR2(20)    DEFAULT 'student' NOT NULL
                                 CHECK (Role IN ('student', 'admin')),
                    RegNo        VARCHAR2(20)    REFERENCES STUDENTS(RegNo),
                    CreatedAt    TIMESTAMP       DEFAULT CURRENT_TIMESTAMP
                )
            """)
            print("[OK] AUTH table created.")

            # Create sequence
            cur.execute(
                "SELECT COUNT(*) FROM user_sequences WHERE sequence_name = 'AUTH_SEQ'"
            )
            if cur.fetchone()[0] == 0:
                cur.execute("CREATE SEQUENCE AUTH_SEQ START WITH 1 INCREMENT BY 1")
                print("[OK] AUTH_SEQ sequence created.")

            # Create trigger
            cur.execute("""
                CREATE OR REPLACE TRIGGER AUTH_BI
                BEFORE INSERT ON AUTH
                FOR EACH ROW
                WHEN (NEW.UserID IS NULL)
                BEGIN
                    SELECT AUTH_SEQ.NEXTVAL INTO :NEW.UserID FROM DUAL;
                END;
            """)
            print("[OK] AUTH_BI trigger created.")
            return True


def seed_admin():
    """Create the initial admin user from .env credentials."""
    s = get_settings()

    with get_db() as conn:
        with get_cursor(conn) as cur:
            # Check if admin already exists
            cur.execute(
                "SELECT COUNT(*) FROM AUTH WHERE Username = :1",
                [s.admin_username],
            )
            if cur.fetchone()[0] > 0:
                print(f"[OK] Admin user '{s.admin_username}' already exists.")
                return

            hashed = hash_password(s.admin_password)
            cur.execute(
                """INSERT INTO AUTH (Username, PasswordHash, Role, RegNo)
                   VALUES (:1, :2, 'admin', NULL)""",
                [s.admin_username, hashed],
            )
            print(f"[OK] Admin user '{s.admin_username}' created.")


def register_student(reg_no: str, password: str):
    """Register a student in the AUTH table (links to existing STUDENTS record)."""
    with get_db() as conn:
        with get_cursor(conn) as cur:
            # Verify student exists in STUDENTS table
            cur.execute("SELECT RegNo FROM STUDENTS WHERE RegNo = :1", [reg_no])
            if not cur.fetchone():
                print(f"[ERROR] Student {reg_no} not found in STUDENTS table.")
                return

            # Check if already registered
            cur.execute("SELECT COUNT(*) FROM AUTH WHERE Username = :1", [reg_no])
            if cur.fetchone()[0] > 0:
                print(f"[OK] Student {reg_no} already has auth credentials.")
                return

            hashed = hash_password(password)
            cur.execute(
                """INSERT INTO AUTH (Username, PasswordHash, Role, RegNo)
                   VALUES (:1, :2, 'student', :3)""",
                [reg_no, hashed, reg_no],
            )
            print(f"[OK] Student {reg_no} registered for authentication.")


def main():
    print("=" * 60)
    print("VITSpace — Auth Setup")
    print("=" * 60)

    # Check connection
    print("\n[*] Checking Oracle connection...")
    status = check_connection()
    if status["status"] != "connected":
        print(f"[ERROR] Cannot connect to Oracle: {status.get('error')}")
        print("Please check your .env file and Oracle configuration.")
        sys.exit(1)

    print(f"[OK] Connected to: {status['version']}")
    print(f"[OK] Tables found: {status['tables_found']}")
    if status["tables_missing"]:
        print(f"[WARNING] Missing tables: {status['tables_missing']}")

    # Create auth table
    print("\n[*] Setting up AUTH table...")
    create_auth_table()

    # Seed admin
    print("\n[*] Setting up admin user...")
    seed_admin()

    # Register sample students (optional)
    if len(sys.argv) > 1 and sys.argv[1] == "--register-students":
        print("\n[*] Registering students for auth...")
        with get_db() as conn:
            with get_cursor(conn) as cur:
                cur.execute("SELECT RegNo FROM STUDENTS")
                students = [r[0] for r in cur.fetchall()]

        for reg_no in students:
            # Default password: their reg_no (students should change this)
            register_student(reg_no, reg_no)

    print("\n" + "=" * 60)
    print("Setup complete!")
    print(f"Admin login: username='{get_settings().admin_username}'")
    print("Start the backend: uvicorn app.main:app --reload")
    print("=" * 60)


if __name__ == "__main__":
    main()
