"""
재무 라우터 — /api/finance/*
"""
import json
from datetime import date
from typing import Optional

from fastapi import APIRouter, HTTPException, UploadFile, File, Query
from pydantic import BaseModel

from services.finance.finance_ocr_service import analyze_receipt
from database import get_connection

router = APIRouter()


# ──────────────────────────────────────────────────────────────
# 요청 스키마
# ──────────────────────────────────────────────────────────────
class TransactionItem(BaseModel):
    item: str
    amount: int
    tax_amount: int
    account_code: str = "기타비용"
    memo: str = ""
    confidence: float = 0.0


class SaveTransactionsRequest(BaseModel):
    receipt_date: Optional[str] = None
    vendor: str = ""
    items: list[TransactionItem]


# ──────────────────────────────────────────────────────────────
# POST /api/finance/ocr  — OCR 분석만 (DB 저장 없음)
# ──────────────────────────────────────────────────────────────
@router.post("/ocr")
async def ocr(file: UploadFile = File(...)):
    """
    영수증 파일을 AI로 분석하고 결과를 반환합니다. DB 저장은 하지 않습니다.

    Request : multipart/form-data { file }
    Response: { receipt_date, vendor, items: [{ item, amount, tax_amount, account_code, memo, confidence }] }
    """
    file_bytes = await file.read()
    content_type = file.content_type or "image/jpeg"

    if not file_bytes:
        raise HTTPException(status_code=400, detail="빈 파일입니다.")

    try:
        result = analyze_receipt(file_bytes, content_type)
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"AI 분석 실패: {str(e)}")

    receipt_date = result.get("receipt_date") or str(date.today())
    vendor       = result.get("vendor", "")
    items_raw    = result.get("items", [])

    if not items_raw:
        raise HTTPException(status_code=422, detail="영수증에서 항목을 인식하지 못했습니다.")

    return {
        "receipt_date": receipt_date,
        "vendor": vendor,
        "items": [
            {
                "item":         item.get("item", ""),
                "amount":       int(item.get("amount", 0)),
                "tax_amount":   int(item.get("tax_amount", 0)),
                "total_amount": int(item.get("amount", 0)) + int(item.get("tax_amount", 0)),
                "account_code": item.get("account_code", "기타비용"),
                "vendor":       vendor,
                "memo":         item.get("memo", ""),
                "confidence":   float(item.get("confidence", 0)),
            }
            for item in items_raw
        ],
    }


# ──────────────────────────────────────────────────────────────
# POST /api/finance/transactions  — 분석 결과를 DB에 저장
# ──────────────────────────────────────────────────────────────
@router.post("/transactions", status_code=201)
def save_transactions(body: SaveTransactionsRequest):
    """
    OCR 분석 결과(사용자가 수정 가능)를 DB에 저장합니다.

    Request : application/json { receipt_date, vendor, items: [...] }
    Response: { saved: [{ id, item, amount, ... }] }
    """
    if not body.items:
        raise HTTPException(status_code=400, detail="저장할 항목이 없습니다.")

    receipt_date = body.receipt_date or str(date.today())
    vendor       = body.vendor
    saved        = []

    conn = get_connection()
    cur  = conn.cursor()

    try:
        for item in body.items:
            cur.execute(
                """
                INSERT INTO transactions
                    (receipt_date, item, amount, tax_amount,
                     account_code, vendor, memo, ai_confidence, raw_json)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
                RETURNING id, total_amount, created_at
                """,
                (
                    receipt_date,
                    item.item,
                    item.amount,
                    item.tax_amount,
                    item.account_code,
                    vendor,
                    item.memo,
                    item.confidence,
                    json.dumps(item.model_dump(), ensure_ascii=False),
                ),
            )
            row = cur.fetchone()
            saved.append({
                "id":           row[0],
                "receipt_date": receipt_date,
                "item":         item.item,
                "amount":       item.amount,
                "tax_amount":   item.tax_amount,
                "total_amount": row[1],
                "account_code": item.account_code,
                "vendor":       vendor,
                "memo":         item.memo,
                "confidence":   item.confidence,
                "created_at":   str(row[2]),
            })

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"DB 저장 실패: {str(e)}")

    finally:
        cur.close()
        conn.close()

    return {"saved": saved}


# ──────────────────────────────────────────────────────────────
# GET /api/finance/transactions  — DB 전표 내역 조회
# ──────────────────────────────────────────────────────────────
@router.get("/transactions")
def list_transactions(
    limit:        int            = Query(default=50, le=200),
    offset:       int            = Query(default=0, ge=0),
    account_code: Optional[str]  = Query(default=None),
    date_from:    Optional[str]  = Query(default=None),
    date_to:      Optional[str]  = Query(default=None),
):
    """
    DB에 저장된 전표 목록을 반환합니다.

    Query params:
      limit        (int, default 50, max 200)
      offset       (int, default 0)
      account_code (str, optional) — 계정과목 필터
      date_from    (str YYYY-MM-DD, optional)
      date_to      (str YYYY-MM-DD, optional)
    Response: { total, items: [...] }
    """
    where_clauses = []
    params = []

    if account_code:
        where_clauses.append("account_code = %s")
        params.append(account_code)
    if date_from:
        where_clauses.append("receipt_date >= %s")
        params.append(date_from)
    if date_to:
        where_clauses.append("receipt_date <= %s")
        params.append(date_to)

    where_sql = ("WHERE " + " AND ".join(where_clauses)) if where_clauses else ""

    conn = get_connection()
    cur  = conn.cursor()

    try:
        cur.execute(f"SELECT COUNT(*) FROM transactions {where_sql}", params)
        total = cur.fetchone()[0]

        cur.execute(
            f"""
            SELECT id, receipt_date, item, amount, tax_amount, total_amount,
                   account_code, vendor, memo, ai_confidence, created_at
            FROM transactions
            {where_sql}
            ORDER BY created_at DESC
            LIMIT %s OFFSET %s
            """,
            params + [limit, offset],
        )
        rows = cur.fetchall()

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"조회 실패: {str(e)}")

    finally:
        cur.close()
        conn.close()

    return {
        "total": total,
        "items": [
            {
                "id":           r[0],
                "receipt_date": str(r[1]),
                "item":         r[2],
                "amount":       r[3],
                "tax_amount":   r[4],
                "total_amount": r[5],
                "account_code": r[6],
                "vendor":       r[7],
                "memo":         r[8],
                "confidence":   float(r[9]) if r[9] else None,
                "created_at":   str(r[10]),
            }
            for r in rows
        ],
    }
