"""
Migration script: Add personalized roadmap fields to roadmaps table in Neon Postgres and SQLite.
"""
import sqlite3
from app.core.database import engine
from sqlalchemy import text

def run_migration():
    print("[*] Running migration on primary database...")
    with engine.begin() as pg:
        try:
            pg.execute(text("ALTER TABLE roadmaps ALTER COLUMN career_role_id DROP NOT NULL;"))
            print("[+] PostgreSQL: career_role_id is now nullable")
        except Exception as e:
            print("[-] PostgreSQL notice on career_role_id:", e)

        cols = [
            ("skill_name", "VARCHAR(255)"),
            ("current_level", "VARCHAR(50) DEFAULT 'Beginner'"),
            ("target_level", "VARCHAR(50) DEFAULT 'Job-Ready / Advanced'"),
            ("desired_deadline", "VARCHAR(100)"),
            ("estimated_duration", "VARCHAR(100)"),
            ("hours_per_week", "INTEGER DEFAULT 10"),
            ("status", "VARCHAR(50) DEFAULT 'In Progress'"),
            ("is_accelerated", "BOOLEAN DEFAULT FALSE"),
            ("deadline_validation", "JSON"),
            ("learning_plan", "JSON"),
            ("completed_tasks", "JSON DEFAULT '[]'::json"),
        ]
        for name, col_type in cols:
            try:
                pg.execute(text(f"ALTER TABLE roadmaps ADD COLUMN IF NOT EXISTS {name} {col_type};"))
                print(f"[+] PostgreSQL: added {name}")
            except Exception as e:
                print(f"[-] PostgreSQL notice on {name}:", e)

    print("[*] Running migration on SQLite backup database...")
    try:
        conn = sqlite3.connect(r"d:\GrowSphere\backend\growsphere_dev.db")
        cur = conn.cursor()
        cur.execute("PRAGMA table_info(roadmaps)")
        existing = [r[1] for r in cur.fetchall()]
        sqlite_cols = [
            ("skill_name", "VARCHAR(255)"),
            ("current_level", "VARCHAR(50) DEFAULT 'Beginner'"),
            ("target_level", "VARCHAR(50) DEFAULT 'Job-Ready / Advanced'"),
            ("desired_deadline", "VARCHAR(100)"),
            ("estimated_duration", "VARCHAR(100)"),
            ("hours_per_week", "INTEGER DEFAULT 10"),
            ("status", "VARCHAR(50) DEFAULT 'In Progress'"),
            ("is_accelerated", "BOOLEAN DEFAULT 0"),
            ("deadline_validation", "JSON"),
            ("learning_plan", "JSON"),
            ("completed_tasks", "JSON DEFAULT '[]'"),
        ]
        for name, col_type in sqlite_cols:
            if name not in existing:
                cur.execute(f"ALTER TABLE roadmaps ADD COLUMN {name} {col_type};")
                print(f"[+] SQLite: added {name}")
        conn.commit()
        conn.close()
    except Exception as e:
        print("[-] SQLite notice:", e)

    print("[DONE] Migration finished successfully.")

if __name__ == "__main__":
    run_migration()
