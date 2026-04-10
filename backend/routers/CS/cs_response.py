"""
CS 응답 초안 라우터 — /api/cs/response/*
"""
import csv
import io
from typing import Optional
from fastapi import APIRouter, HTTPException, Query
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

from services.CS.cs_response_service import classify_and_draft
from database import get_connection

router = APIRouter()


# ──────────────────────────────────────────────────────────────
# 요청 스키마
# ──────────────────────────────────────────────────────────────
class ResponseDraftRequest(BaseModel):
    inquiry:  str
    order_no: str = ""
    tone:     str = "formal"  # "formal" | "friendly"


class SaveInquiryRequest(BaseModel):
    inquiry_text:       str
    order_no:           str  = ""
    tone:               str  = "formal"
    main_type:          str  = "기타"
    sub_type:           str  = "기타문의"
    draft:              str  = ""
    final_response:     str  = ""
    escalation_needed:  bool = False
    escalation_reason:  str  = ""
    status:             str  = "완료"   # "완료" | "에스컬레이션"


# ──────────────────────────────────────────────────────────────
# POST /api/cs/response/draft — 문의 분류 + 초안 생성
# ──────────────────────────────────────────────────────────────
@router.post("/draft")
async def generate_draft(body: ResponseDraftRequest):
    """
    고객 문의를 분류하고 응답 초안을 생성합니다.

    Request : application/json { inquiry, order_no?, tone? }
    Response: { main_type, sub_type, draft, escalation: { needed, reason } }
    """
    if not body.inquiry.strip():
        raise HTTPException(status_code=400, detail="문의 내용이 비어 있습니다.")

    if body.tone not in ("formal", "friendly"):
        raise HTTPException(status_code=400, detail="tone은 'formal' 또는 'friendly'만 허용됩니다.")

    try:
        result = classify_and_draft(
            inquiry=body.inquiry,
            order_no=body.order_no,
            tone=body.tone,
        )
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"AI 처리 실패: {str(e)}")

    return result


# ──────────────────────────────────────────────────────────────
# POST /api/cs/response/save — 처리 완료 문의 DB 저장
# ──────────────────────────────────────────────────────────────
@router.post("/save", status_code=201)
def save_inquiry(body: SaveInquiryRequest):
    """
    담당자가 검토·발송 완료한 문의를 DB에 저장합니다.

    Request : application/json { inquiry_text, order_no?, tone?, main_type, sub_type,
                                  draft, final_response, escalation_needed, escalation_reason, status }
    Response: { id, created_at }
    """
    if body.status not in ("완료", "에스컬레이션"):
        raise HTTPException(status_code=400, detail="status는 '완료' 또는 '에스컬레이션'만 허용됩니다.")

    conn = get_connection()
    cur  = conn.cursor()
    try:
        cur.execute(
            """
            INSERT INTO cs_inquiries
                (inquiry_text, order_no, tone, main_type, sub_type,
                 draft, final_response, escalation_needed, escalation_reason, status)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            RETURNING id, created_at
            """,
            (
                body.inquiry_text, body.order_no, body.tone,
                body.main_type, body.sub_type,
                body.draft, body.final_response,
                body.escalation_needed, body.escalation_reason,
                body.status,
            ),
        )
        row = cur.fetchone()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"DB 저장 실패: {str(e)}")
    finally:
        cur.close()
        conn.close()

    return {"id": row[0], "created_at": str(row[1])}


# ──────────────────────────────────────────────────────────────
# GET /api/cs/response/export — 기간별 문의 로그 CSV 내보내기
# ──────────────────────────────────────────────────────────────
@router.get("/export")
def export_inquiries(
    date_from: Optional[str] = Query(default=None, description="시작일 YYYY-MM-DD"),
    date_to:   Optional[str] = Query(default=None, description="종료일 YYYY-MM-DD"),
):
    """
    DB에 저장된 문의 로그를 CSV로 내보냅니다.

    Query params:
      date_from (str YYYY-MM-DD, optional)
      date_to   (str YYYY-MM-DD, optional)
    Response: CSV 파일 (Content-Disposition: attachment)
    """
    where_clauses = []
    params = []

    if date_from:
        where_clauses.append("created_at >= %s")
        params.append(date_from)
    if date_to:
        where_clauses.append("created_at < (%s::date + interval '1 day')")
        params.append(date_to)

    where_sql = ("WHERE " + " AND ".join(where_clauses)) if where_clauses else ""

    conn = get_connection()
    cur  = conn.cursor()
    try:
        cur.execute(
            f"""
            SELECT created_at, main_type, sub_type, sentiment,
                   inquiry_text, order_no, draft, final_response,
                   escalation_needed, escalation_reason, status
            FROM cs_inquiries
            {where_sql}
            ORDER BY created_at ASC
            """,
            params,
        )
        rows = cur.fetchall()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"조회 실패: {str(e)}")
    finally:
        cur.close()
        conn.close()

    # CSV 생성
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow([
        "접수일시", "문의유형(대)", "문의유형(소)", "감성",
        "고객문의원문", "주문번호", "응답초안", "최종발송내용",
        "에스컬레이션여부", "에스컬레이션사유", "처리상태",
    ])
    for r in rows:
        writer.writerow([
            str(r[0])[:19],   # created_at
            r[1] or "",       # main_type
            r[2] or "",       # sub_type
            r[3] or "",       # sentiment
            r[4] or "",       # inquiry_text
            r[5] or "",       # order_no
            r[6] or "",       # draft
            r[7] or "",       # final_response
            "Y" if r[8] else "N",  # escalation_needed
            r[9]  or "",      # escalation_reason
            r[10] or "",      # status
        ])

    output.seek(0)
    # BOM 추가 (Excel 한글 깨짐 방지)
    csv_content = "\ufeff" + output.getvalue()

    return StreamingResponse(
        iter([csv_content.encode("utf-8")]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=cs_inquiries.csv"},
    )
