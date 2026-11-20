import uuid
from datetime import UTC, date, datetime

from sqlalchemy import Boolean, Column, Date, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship

from backend.app.database import Base


def utc_now():
    return datetime.now(UTC)

def today_date():
    return date.today()

def generate_uuid():
    return str(uuid.uuid4())

class FinanceAccount(Base):
    __tablename__ = "finance_accounts"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    name = Column(String(100), nullable=False)
    account_type = Column(String(30), default="bank")  # 'cash', 'bank', 'credit', 'e-wallet'
    currency = Column(String(10), default="VND")
    initial_balance = Column(Integer, default=0)  # minor units (đồng VND)
    current_balance = Column(Integer, default=0)
    is_active = Column(Boolean, default=True)
    
    transactions = relationship("FinanceTransaction", back_populates="account")

class FinanceCategory(Base):
    __tablename__ = "finance_categories"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    name = Column(String(100), nullable=False)
    category_type = Column(String(20), default="expense")  # 'income', 'expense'
    icon = Column(String(50), default="Tag")
    color = Column(String(20), default="#00f0ff")
    parent_id = Column(String(36), ForeignKey("finance_categories.id"), nullable=True)
    
    transactions = relationship("FinanceTransaction", back_populates="category")
    budgets = relationship("FinanceBudget", back_populates="category")

class FinanceTransaction(Base):
    __tablename__ = "finance_transactions"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    account_id = Column(String(36), ForeignKey("finance_accounts.id"), index=True, nullable=False)
    category_id = Column(String(36), ForeignKey("finance_categories.id"), index=True, nullable=False)
    amount = Column(Integer, nullable=False)  # minor units (đồng VND)
    currency = Column(String(10), default="VND")
    transaction_type = Column(String(20), default="expense")  # 'income', 'expense', 'transfer'
    transaction_date = Column(Date, default=today_date, index=True, nullable=False)
    payee = Column(String(255), nullable=False)  # Nơi nhận hoặc nguồn thu
    notes = Column(Text, nullable=True)
    source_email_id = Column(String(100), nullable=True, index=True)
    fingerprint = Column(String(64), nullable=True, index=True)  # SHA-256 for duplicate detection
    created_at = Column(DateTime, default=utc_now)
    
    account = relationship("FinanceAccount", back_populates="transactions")
    category = relationship("FinanceCategory", back_populates="transactions")

class FinanceBudget(Base):
    __tablename__ = "finance_budgets"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    category_id = Column(String(36), ForeignKey("finance_categories.id"), nullable=False)
    amount = Column(Integer, nullable=False)  # minor units (đồng VND)
    currency = Column(String(10), default="VND")
    month = Column(Integer, nullable=False)  # 1-12
    year = Column(Integer, nullable=False)
    alert_threshold_percentage = Column(Integer, default=80)
    
    category = relationship("FinanceCategory", back_populates="budgets")

class ImportedTransactionSource(Base):
    __tablename__ = "imported_transaction_sources"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    file_name = Column(String(255), nullable=False)
    file_hash = Column(String(64), index=True, nullable=False)
    import_date = Column(DateTime, default=utc_now)
    records_count = Column(Integer, default=0)
