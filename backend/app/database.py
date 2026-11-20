from sqlalchemy import create_engine, event
from sqlalchemy.orm import Session, declarative_base, sessionmaker

from backend.app.config import settings

DATABASE_URL = f"sqlite:///{settings.DATABASE_PATH}"

# Connect with check_same_thread=False for SQLite in multi-threaded FastAPI
engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False}
)

# Enable WAL mode and foreign key constraints on SQLite connections
@event.listens_for(engine, "connect")
def set_sqlite_pragma(dbapi_connection, connection_record):
    cursor = dbapi_connection.cursor()
    cursor.execute("PRAGMA journal_mode=WAL")
    cursor.execute("PRAGMA foreign_keys=ON")
    cursor.execute("PRAGMA synchronous=NORMAL")
    cursor.close()

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    """FastAPI dependency to yield database session with automatic cleanup."""
    db: Session = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def init_db():
    """Create all tables and seed default settings if empty."""
    from backend.app import models  # noqa: F401
    Base.metadata.create_all(bind=engine)
    
    # Run seed data in a session
    db = SessionLocal()
    try:
        from backend.app.models.finance import FinanceAccount, FinanceCategory
        # Check if default categories exist
        if db.query(FinanceCategory).count() == 0:
            default_categories = [
                # Expense categories
                FinanceCategory(name="Ăn uống", category_type="expense", icon="Utensils", color="#00f0ff"),
                FinanceCategory(name="Tiền nhà & Tiện ích", category_type="expense", icon="Home", color="#3b82f6"),
                FinanceCategory(name="Di chuyển", category_type="expense", icon="Car", color="#6366f1"),
                FinanceCategory(name="Học tập & Sách vở", category_type="expense", icon="BookOpen", color="#8b5cf6"),
                FinanceCategory(name="Mua sắm & Thiết bị", category_type="expense", icon="ShoppingBag", color="#ec4899"),
                FinanceCategory(name="Giải trí", category_type="expense", icon="Gamepad2", color="#10b981"),
                FinanceCategory(name="Y tế & Sức khỏe", category_type="expense", icon="HeartPulse", color="#ef4444"),
                # Income categories
                FinanceCategory(name="Lương", category_type="income", icon="Briefcase", color="#10b981"),
                FinanceCategory(name="Thưởng & Dự án ngoài", category_type="income", icon="Award", color="#22c55e"),
                FinanceCategory(name="Đầu tư", category_type="income", icon="TrendingUp", color="#14b8a6"),
            ]
            for cat in default_categories:
                db.add(cat)
            
        # Check if default account exists
        if db.query(FinanceAccount).count() == 0:
            default_accounts = [
                FinanceAccount(
                    name="Tiền mặt",
                    account_type="cash",
                    currency="VND",
                    initial_balance=0,
                    current_balance=0,
                    is_active=True
                ),
                FinanceAccount(
                    name="Tài khoản Ngân hàng chính",
                    account_type="bank",
                    currency="VND",
                    initial_balance=0,
                    current_balance=0,
                    is_active=True
                )
            ]
            for acc in default_accounts:
                db.add(acc)
                
        db.commit()
    except Exception as e:
        db.rollback()
        print(f"Error seeding database: {e}")
    finally:
        db.close()
