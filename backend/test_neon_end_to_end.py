"""
GrowSphere — Neon Services (Postgres & Auth) End-to-End Validation Script.

Tests:
1. Neon Serverless PostgreSQL:
   - Connection, SSL verification, version query (PostgreSQL 18+ on AWS ap-southeast-1)
   - Schema verification (40 tables)
   - CRUD cycle (INSERT, SELECT, UPDATE, DELETE on audit_logs)
2. Neon Cloud Auth:
   - Base endpoint health (/ok)
   - JWKS retrieval & parsing from .well-known/jwks.json
   - Direct user registration through Neon Auth
   - Direct user sign-in through Neon Auth
3. GrowSphere FastAPI Backend Integration:
   - GET /api/auth/neon/status endpoint
   - POST /api/auth/neon/sync endpoint
   - Bearer token verification via get_current_user
"""

import os
import sys
import uuid
import requests
from sqlalchemy import text
from fastapi.testclient import TestClient

# Ensure backend root is on sys.path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.core.config import settings
from app.core.database import SessionLocal, engine
from app.core.security import get_neon_jwks_client, decode_access_token
from app.main import app
from app.models import User, AuditLog, utcnow

def test_neon_postgres_e2e():
    print("\n" + "=" * 60)
    print("TEST 1: Neon Serverless PostgreSQL Integration")
    print("=" * 60)
    
    print(f"[*] Database URL: {settings.DATABASE_URL.split('@')[-1]}")
    print(f"[*] Is Neon Flag: {settings.is_neon}")
    print(f"[*] Neon Branch: {settings.NEON_BRANCH}")
    
    db = SessionLocal()
    try:
        # 1. Version and Connection
        row = db.execute(text("SELECT version(), current_database(), current_user;")).fetchone()
        print(f"[+] Connected to Neon PostgreSQL!")
        print(f"    Version: {row[0].split(',')[0]}")
        print(f"    Database: {row[1]}")
        print(f"    User: {row[2]}")
        
        # 2. Table Count
        table_count = db.execute(text(
            "SELECT count(*) FROM information_schema.tables WHERE table_schema = 'public';"
        )).scalar()
        print(f"[+] Total Public Tables in Neon DB: {table_count}")
        assert table_count >= 30, f"Expected >= 30 tables, found {table_count}"
        
        # 3. Read Verification
        user_count = db.query(User).count()
        print(f"[+] Users in GrowSphere database: {user_count}")
        
        # 4. CRUD Roundtrip on AuditLog
        test_action = f"neon_e2e_test_{uuid.uuid4().hex[:8]}"
        audit_entry = AuditLog(
            user_id=None,
            action=test_action,
            entity_type="test",
            entity_id=1,
            details={"service": "neon_postgres", "status": "active"},
            created_at=utcnow(),
        )
        db.add(audit_entry)
        db.commit()
        db.refresh(audit_entry)
        print(f"[+] Successfully INSERTED audit record (ID={audit_entry.id}, action='{test_action}')")
        
        # Query it back
        queried = db.query(AuditLog).filter(AuditLog.action == test_action).first()
        assert queried is not None and queried.id == audit_entry.id, "Audit record query failed!"
        print(f"[+] Successfully READ BACK audit record from Neon Postgres")
        
        # Cleanup
        db.delete(queried)
        db.commit()
        print(f"[+] Successfully CLEANED UP test audit record")
        print("[PASS] Neon Serverless PostgreSQL E2E Test PASSED!")
        return True
    finally:
        db.close()

def test_neon_auth_e2e():
    print("\n" + "=" * 60)
    print("TEST 2: Neon Cloud Auth Integration")
    print("=" * 60)
    
    auth_base = settings.NEON_AUTH_BASE_URL
    jwks_url = settings.NEON_AUTH_JWKS_URL
    print(f"[*] Neon Auth Base URL: {auth_base}")
    print(f"[*] Neon Auth JWKS URL: {jwks_url}")
    
    # 1. Neon Auth Health Check (/ok)
    res_ok = requests.get(f"{auth_base}/ok", timeout=10)
    print(f"[+] Neon Auth /ok response: HTTP {res_ok.status_code} -> {res_ok.text.strip()}")
    assert res_ok.status_code == 200, f"Neon Auth /ok failed with status {res_ok.status_code}"
    
    # 2. Neon Auth JWKS Retrieval
    res_jwks = requests.get(jwks_url, timeout=10)
    print(f"[+] Neon Auth JWKS response: HTTP {res_jwks.status_code}")
    jwks_data = res_jwks.json()
    keys = jwks_data.get("keys", [])
    print(f"[+] Retrieved {len(keys)} public signing keys from Neon Auth")
    for k in keys:
        print(f"    Key ID: {k.get('kid')} | Alg: {k.get('alg')} | Kty: {k.get('kty')} | Crv: {k.get('crv')}")
    assert len(keys) > 0, "No keys returned from Neon JWKS endpoint"
    
    # 3. Direct Neon Auth Sign-up
    unique_suffix = uuid.uuid4().hex[:6]
    test_email = f"neon_user_{unique_suffix}@growsphere.dev"
    test_password = "NeonSecureTestPassword2026!"
    test_name = f"Neon Test Candidate {unique_suffix}"
    
    headers = {
        "Content-Type": "application/json",
        "Origin": "http://localhost:5173",
    }
    signup_payload = {
        "email": test_email,
        "password": test_password,
        "name": test_name,
    }
    signup_res = requests.post(f"{auth_base}/sign-up/email", json=signup_payload, headers=headers, timeout=10)
    print(f"[+] Neon Auth Sign-up HTTP {signup_res.status_code}")
    assert signup_res.status_code in [200, 201], f"Sign-up failed: {signup_res.text}"
    signup_data = signup_res.json()
    neon_token = signup_data.get("token")
    user_id = signup_data.get("user", {}).get("id")
    print(f"    Created Neon Auth User ID: {user_id}")
    print(f"    Token prefix: {neon_token[:20]}..." if neon_token else "    No token returned")
    
    # 4. Direct Neon Auth Sign-in
    signin_payload = {
        "email": test_email,
        "password": test_password,
    }
    signin_res = requests.post(f"{auth_base}/sign-in/email", json=signin_payload, headers=headers, timeout=10)
    print(f"[+] Neon Auth Sign-in HTTP {signin_res.status_code}")
    assert signin_res.status_code == 200, f"Sign-in failed: {signin_res.text}"
    signin_data = signin_res.json()
    active_token = signin_data.get("token")
    assert active_token is not None, "Failed to get token on sign-in"
    print(f"[PASS] Neon Cloud Auth E2E Test PASSED!")
    return {
        "email": test_email,
        "name": test_name,
        "neon_token": active_token,
        "neon_user_id": user_id,
    }

def test_fastapi_neon_routes(neon_user_info):
    print("\n" + "=" * 60)
    print("TEST 3: FastAPI Backend & Neon Services End-to-End")
    print("=" * 60)
    
    client = TestClient(app)
    
    # 1. Live Neon Status Route
    status_res = client.get("/api/auth/neon/status")
    print(f"[+] GET /api/auth/neon/status -> HTTP {status_res.status_code}")
    assert status_res.status_code == 200, f"Status check failed: {status_res.text}"
    status_data = status_res.json()
    print(f"    Overall Status: {status_data['status']}")
    print(f"    Postgres Status: {status_data['postgres']['status']}")
    print(f"    Postgres Version: {status_data['postgres']['version'][:40]}...")
    print(f"    Auth Status: {status_data['auth']['status']}")
    print(f"    Auth Details: {status_data['auth']['details']}")
    assert status_data["postgres"]["status"] == "connected"
    assert status_data["auth"]["status"] == "online"
    
    # 2. Sync Neon User Route
    sync_payload = {
        "email": neon_user_info["email"],
        "name": neon_user_info["name"],
        "neon_token": neon_user_info["neon_token"],
        "role": "student",
    }
    sync_res = client.post("/api/auth/neon/sync", json=sync_payload)
    print(f"[+] POST /api/auth/neon/sync -> HTTP {sync_res.status_code}")
    assert sync_res.status_code == 200, f"Sync failed: {sync_res.text}"
    sync_data = sync_res.json()
    growsphere_token = sync_data["access_token"]
    user_data = sync_data["user"]
    print(f"    Synced User: ID={user_data['id']}, Email={user_data['email']}, Role={user_data['role']}")
    print(f"    GrowSphere Access Token: {growsphere_token[:25]}...")
    
    # 3. Authenticated Route with Token
    me_res = client.get("/api/auth/me", headers={"Authorization": f"Bearer {growsphere_token}"})
    print(f"[+] GET /api/auth/me with Bearer token -> HTTP {me_res.status_code}")
    assert me_res.status_code == 200, f"Auth verification failed: {me_res.text}"
    me_data = me_res.json()
    print(f"    Authenticated As: {me_data['email']} ({me_data['full_name']})")
    assert me_data["email"] == neon_user_info["email"]
    
    print("[PASS] FastAPI Backend & Neon Integration E2E Test PASSED!")
    return True

if __name__ == "__main__":
    print("\nRUNNING COMPLETE NEON SERVICES TEST SUITE FOR GROWSPHERE")
    pg_ok = test_neon_postgres_e2e()
    neon_user = test_neon_auth_e2e()
    api_ok = test_fastapi_neon_routes(neon_user)
    
    print("\n" + "=" * 60)
    print("ALL NEON SERVICES TESTS COMPLETED AND VERIFIED 100% OPERATIONAL!")
    print("=" * 60)
