"""
재무 라우터 — /api/finance/*
"""
import json
from datetime import date
from flask import Blueprint, request, jsonify

from services.openai_service import analyze_receipt
from database import get_connection

finance_bp = Blueprint("finance", __name__)


# ──────────────────────────────────────────────────────────────
# POST /api/finance/ocr  — OCR 분석만 (DB 저장 없음)
# ──────────────────────────────────────────────────────────────
@finance_bp.post("/ocr")
def ocr():
    """
    영수증 파일을 OpenAI로 분석하고 결과를 반환합니다. DB 저장은 하지 않습니다.

    Request : multipart/form-data { file }
    Response: { receipt_date, vendor, items: [{ item, amount, tax_amount, account_code, memo, confidence }] }
    """
    if "file" not in request.files:
        return jsonify({"error": "file 필드가 없습니다."}), 400

    f = request.files["file"]
    file_bytes   = f.read()
    content_type = f.content_type or "image/jpeg"

    if not file_bytes:
        return jsonify({"error": "빈 파일입니다."}), 400

    try:
        result = analyze_receipt(file_bytes, content_type)
    except Exception as e:
        return jsonify({"error": f"AI 분석 실패: {str(e)}"}), 502

    receipt_date = result.get("receipt_date") or str(date.today())
    vendor       = result.get("vendor", "")
    items_raw    = result.get("items", [])

    if not items_raw:
        return jsonify({"error": "영수증에서 항목을 인식하지 못했습니다."}), 422

    return jsonify({
        "receipt_date": receipt_date,
        "vendor":       vendor,
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
    }), 200


# ──────────────────────────────────────────────────────────────
# POST /api/finance/transactions  — 분석 결과를 DB에 저장
# ──────────────────────────────────────────────────────────────
@finance_bp.post("/transactions")
def save_transactions():
    """
    OCR 분석 결과(사용자가 수정 가능)를 DB에 저장합니다.

    Request : application/json
    {
      "receipt_date": "YYYY-MM-DD",
      "vendor": "거래처명",
      "items": [{ item, amount, tax_amount, account_code, memo, confidence }]
    }
    Response: { saved: [{ id, item, amount, ... }] }
    """
    body = request.get_json(silent=True)
    if not body or not body.get("items"):
        return jsonify({"error": "저장할 항목이 없습니다."}), 400

    receipt_date = body.get("receipt_date") or str(date.today())
    vendor       = body.get("vendor", "")
    items        = body["items"]

    conn = get_connection()
    cur  = conn.cursor()
    saved = []

    try:
        for item in items:
            amount     = int(item.get("amount", 0))
            tax_amount = int(item.get("tax_amount", 0))

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
                    item.get("item", ""),
                    amount,
                    tax_amount,
                    item.get("account_code", "기타비용"),
                    vendor,
                    item.get("memo", ""),
                    float(item.get("confidence", 0)),
                    json.dumps(item, ensure_ascii=False),
                ),
            )
            row = cur.fetchone()
            saved.append({
                "id":           row[0],
                "receipt_date": receipt_date,
                "item":         item.get("item", ""),
                "amount":       amount,
                "tax_amount":   tax_amount,
                "total_amount": row[1],
                "account_code": item.get("account_code", "기타비용"),
                "vendor":       vendor,
                "memo":         item.get("memo", ""),
                "confidence":   float(item.get("confidence", 0)),
                "created_at":   str(row[2]),
            })

    except Exception as e:
        return jsonify({"error": f"DB 저장 실패: {str(e)}"}), 500

    finally:
        cur.close()
        conn.close()

    return jsonify({"saved": saved}), 201


# ──────────────────────────────────────────────────────────────
# GET /api/finance/transactions  — DB 전표 내역 조회
# ──────────────────────────────────────────────────────────────
@finance_bp.get("/transactions")
def list_transactions():
    """
    DB에 저장된 전표 목록을 반환합니다.

    Query params:
      limit        (int, default 50)
      offset       (int, default 0)
      account_code (str, optional) — 계정과목 필터
      date_from    (str YYYY-MM-DD, optional)
      date_to      (str YYYY-MM-DD, optional)
    Response: { total, items: [...] }
    """
    limit        = min(int(request.args.get("limit", 50)), 200)
    offset       = int(request.args.get("offset", 0))
    account_code = request.args.get("account_code")
    date_from    = request.args.get("date_from")
    date_to      = request.args.get("date_to")

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
        # 전체 건수
        cur.execute(f"SELECT COUNT(*) FROM transactions {where_sql}", params)
        total = cur.fetchone()[0]

        # 목록 조회
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
        return jsonify({"error": f"조회 실패: {str(e)}"}), 500

    finally:
        cur.close()
        conn.close()

    items = [
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
    ]

    return jsonify({"total": total, "items": items}), 200
