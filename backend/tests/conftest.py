import os
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

# Configure test environment
os.environ["HADES_SESSION_TOKEN"] = "test-capability-token-1234567890abcdef"
test_dir = Path("./test_data")
test_dir.mkdir(parents=True, exist_ok=True)
os.environ["APPDATA"] = str(test_dir.resolve())

from backend.app.config import settings
from backend.app.database import init_db
from backend.app.main import app


@pytest.fixture(scope="session", autouse=True)
def setup_test_db():
    init_db()
    yield
    # Cleanup test db
    test_db_file = test_dir / "HadesOS" / "hades.db"
    if test_db_file.exists():
        try:
            os.remove(test_db_file)
        except Exception:
            pass

@pytest.fixture
def client():
    return TestClient(app)

@pytest.fixture
def auth_headers():
    return {
        "Authorization": f"Bearer {settings.SESSION_TOKEN}",
        "Host": f"127.0.0.1:{settings.PORT}"
    }
