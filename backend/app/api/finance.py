import csv
import hashlib
import io
from datetime import date

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy import func
from sqlalchemy.orm import Session

from backend.app.database import get_db
from backend.app.models.finance import (
    FinanceAccount,
    FinanceBudget,
    FinanceCategory,
    FinanceTransaction,
)
from backend.app.schemas import FinanceAccountCreate, FinanceCategoryCreate, FinanceTransactionCreate

router = APIRouter(prefix="/api/finance", tags=["Finance"])

def compute_transaction_fingerprint(t_date: date, amount: int, payee: str, account_id: str) -> str:
    """Compute SHA-256 fingerprint for duplicate transaction detection."""
    payload = f"{t_date.isoformat()}:{amount}:{payee.strip().lower()}:{account_id}"
    return hashlib.sha256(payload.encode("utf-8")).hexdigest()

# --- ACCOUNTS ---
@router.get("/accounts")
def list_accounts(db: Session = Depends(get_db)):
    return db.query(FinanceAccount).filter(FinanceAccount.is_active == True).all()  # noqa: E712

@router.post("/accounts")
def create_account(payload: FinanceAccountCreate, db: Session = Depends(get_db)):
    account = FinanceAccount(
        name=payload.name,
        account_type=payload.account_type,
        currency=payload.currency,
        initial_balance=payload.initial_balance,
        current_balance=payload.initial_balance,
        is_active=True
    )
    db.add(account)
    db.commit()
    db.refresh(account)
    return account

# --- CATEGORIES ---
@router.get("/categories")
def list_categories(db: Session = Depends(get_db)):
    return db.query(FinanceCategory).all()

@router.post("/categories")
def create_category(payload: FinanceCategoryCreate, db: Session = Depends(get_db)):
    category = FinanceCategory(
        name=payload.name,
        category_type=payload.category_type,
        icon=payload.icon,
        color=payload.color,
        parent_id=payload.parent_id
    )
    db.add(category)
    db.commit()
    db.refresh(category)
    return category

# --- TRANSACTIONS ---
@router.get("/transactions")
def list_transactions(
    account_id: str | None = None,
    category_id: str | None = None,
    start_date: date | None = None,
    end_date: date | None = None,
    limit: int = 100,
    offset: int = 0,
    db: Session = Depends(get_db)
):
    query = db.query(FinanceTransaction)
    if account_id:
        query = query.filter(FinanceTransaction.account_id == account_id)
    if category_id:
        query = query.filter(FinanceTransaction.category_id == category_id)
    if start_date:
        query = query.filter(FinanceTransaction.transaction_date >= start_date)
    if end_date:
        query = query.filter(FinanceTransaction.transaction_date <= end_date)
        
    total = query.count()
    items = query.order_by(FinanceTransaction.transaction_date.desc(), FinanceTransaction.created_at.desc()).offset(offset).limit(limit).all()
    
    return {
        "total": total,
        "items": [
            {
                "id": t.id,
                "account_id": t.account_id,
                "account_name": t.account.name if t.account else "N/A",
                "category_id": t.category_id,
                "category_name": t.category.name if t.category else "N/A",
                "category_color": t.category.color if t.category else "#00f0ff",
                "amount": t.amount,
                "currency": t.currency,
                "transaction_type": t.transaction_type,
                "transaction_date": t.transaction_date.isoformat(),
                "payee": t.payee,
                "notes": t.notes,
                "source_email_id": t.source_email_id,
                "fingerprint": t.fingerprint
            }
            for t in items
        ]
    }

@router.post("/transactions")
def create_transaction(payload: FinanceTransactionCreate, db: Session = Depends(get_db)):
    account = db.query(FinanceAccount).filter(FinanceAccount.id == payload.account_id).first()
    if not account:
        raise HTTPException(status_code=404, detail="Không tìm thấy tài khoản tài chính")
        
    category = db.query(FinanceCategory).filter(FinanceCategory.id == payload.category_id).first()
    if not category:
        raise HTTPException(status_code=404, detail="Không tìm thấy danh mục chi tiêu")
        
    fp = compute_transaction_fingerprint(payload.transaction_date, payload.amount, payload.payee, payload.account_id)
    
    # Check duplicate
    existing = db.query(FinanceTransaction).filter(FinanceTransaction.fingerprint == fp).first()
    if existing:
        raise HTTPException(status_code=409, detail="Phát hiện giao dịch trùng lặp (trùng ngày, số tiền và đối tác)")
        
    transaction = FinanceTransaction(
        account_id=payload.account_id,
        category_id=payload.category_id,
        amount=payload.amount,
        currency=payload.currency,
        transaction_type=payload.transaction_type,
        transaction_date=payload.transaction_date,
        payee=payload.payee,
        notes=payload.notes,
        source_email_id=payload.source_email_id,
        fingerprint=fp
    )
    db.add(transaction)
    
    # Update account balance (exact integer minor units)
    if payload.transaction_type == "income":
        account.current_balance += payload.amount
    elif payload.transaction_type == "expense":
        account.current_balance -= payload.amount
        
    db.commit()
    db.refresh(transaction)
    return transaction

@router.delete("/transactions/{transaction_id}")
def delete_transaction(transaction_id: str, db: Session = Depends(get_db)):
    t = db.query(FinanceTransaction).filter(FinanceTransaction.id == transaction_id).first()
    if not t:
        raise HTTPException(status_code=404, detail="Giao dịch không tồn tại")
        
    # Revert account balance
    account = db.query(FinanceAccount).filter(FinanceAccount.id == t.account_id).first()
    if account:
        if t.transaction_type == "income":
            account.current_balance -= t.amount
        elif t.transaction_type == "expense":
            account.current_balance += t.amount
            
    db.delete(t)
    db.commit()
    return {"message": "Đã xóa giao dịch thành công", "deleted_id": transaction_id}

# --- SUMMARY & ANALYTICS ---
@router.get("/summary")
def get_finance_summary(month: int, year: int, db: Session = Depends(get_db)):
    """Calculate exact monthly income, expenses, net savings, and category distribution."""
    transactions = (
        db.query(FinanceTransaction)
        .filter(
            func.strftime("%m", FinanceTransaction.transaction_date) == f"{month:02d}",
            func.strftime("%Y", FinanceTransaction.transaction_date) == str(year)
        )
        .all()
    )
    
    total_income = 0
    total_expense = 0
    category_expenses: dict[str, dict] = {}
    
    for t in transactions:
        if t.transaction_type == "income":
            total_income += t.amount
        elif t.transaction_type == "expense":
            total_expense += t.amount
            cat_name = t.category.name if t.category else "Chưa phân loại"
            cat_color = t.category.color if t.category else "#00f0ff"
            if cat_name not in category_expenses:
                category_expenses[cat_name] = {"name": cat_name, "color": cat_color, "amount": 0}
            category_expenses[cat_name]["amount"] += t.amount
            
    # Check budgets for this month
    budgets = db.query(FinanceBudget).filter(FinanceBudget.month == month, FinanceBudget.year == year).all()
    budget_status = []
    for b in budgets:
        cat_name = b.category.name if b.category else "Chưa phân loại"
        spent = category_expenses.get(cat_name, {}).get("amount", 0)
        percent = round((spent / b.amount * 100), 1) if b.amount > 0 else 0
        budget_status.append({
            "category_name": cat_name,
            "budget_amount": b.amount,
            "spent_amount": spent,
            "percentage": percent,
            "is_exceeded": spent > b.amount,
            "is_warning": percent >= b.alert_threshold_percentage
        })
        
    return {
        "month": month,
        "year": year,
        "currency": "VND",
        "total_income": total_income,
        "total_expense": total_expense,
        "net_savings": total_income - total_expense,
        "category_distribution": list(category_expenses.values()),
        "budget_status": budget_status
    }

# --- CSV EXPORT & IMPORT ---
@router.get("/export-csv")
def export_transactions_csv(db: Session = Depends(get_db)):
    """Export transactions to standard CSV format."""
    transactions = db.query(FinanceTransaction).order_by(FinanceTransaction.transaction_date.desc()).all()
    
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["ID", "Ngay", "TaiKhoan", "DanhMuc", "Loai", "SoTien_VND", "DoiTac", "GhiChu", "MaVanTay"])
    
    for t in transactions:
        writer.writerow([
            t.id,
            t.transaction_date.isoformat(),
            t.account.name if t.account else "",
            t.category.name if t.category else "",
            t.transaction_type,
            t.amount,
            t.payee,
            t.notes or "",
            t.fingerprint or ""
        ])
        
    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=hades_finance_transactions.csv"}
    )
