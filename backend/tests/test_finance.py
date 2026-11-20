from datetime import date


def test_finance_accounts_and_categories(client, auth_headers):
    """Verify default seeded categories and accounts exist."""
    res_cats = client.get("/api/finance/categories", headers=auth_headers)
    assert res_cats.status_code == 200
    categories = res_cats.json()
    assert len(categories) > 0
    cat_names = [c["name"] for c in categories]
    assert "Ăn uống" in cat_names
    assert "Lương" in cat_names

    res_accs = client.get("/api/finance/accounts", headers=auth_headers)
    assert res_accs.status_code == 200
    accounts = res_accs.json()
    assert len(accounts) > 0

def test_finance_transaction_crud_and_deduplication(client, auth_headers):
    """Test transaction creation with exact integer VND units and duplicate detection."""
    acc_id = client.get("/api/finance/accounts", headers=auth_headers).json()[0]["id"]
    cat_id = client.get("/api/finance/categories", headers=auth_headers).json()[0]["id"]

    today_str = date.today().isoformat()
    payload = {
        "account_id": acc_id,
        "category_id": cat_id,
        "amount": 45000,  # 45,000 VND
        "currency": "VND",
        "transaction_type": "expense",
        "transaction_date": today_str,
        "payee": "Quán Cơm Tấm Sài Gòn",
        "notes": "Ăn trưa văn phòng"
    }

    # 1. Create transaction
    res = client.post("/api/finance/transactions", json=payload, headers=auth_headers)
    assert res.status_code == 200
    t_data = res.json()
    assert t_data["amount"] == 45000
    assert t_data["currency"] == "VND"
    t_id = t_data["id"]

    # 2. Attempt duplicate transaction (same account, date, amount, payee) -> 409 Conflict
    dup_res = client.post("/api/finance/transactions", json=payload, headers=auth_headers)
    assert dup_res.status_code == 409
    assert "trùng lặp" in dup_res.json()["detail"]

    # 3. Monthly summary
    summary_res = client.get(f"/api/finance/summary?month={date.today().month}&year={date.today().year}", headers=auth_headers)
    assert summary_res.status_code == 200
    summary = summary_res.json()
    assert summary["total_expense"] >= 45000

    # 4. Delete transaction
    del_res = client.delete(f"/api/finance/transactions/{t_id}", headers=auth_headers)
    assert del_res.status_code == 200
