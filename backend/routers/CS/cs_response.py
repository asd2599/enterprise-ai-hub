"""
CS 응답 초안 라우터 — /api/cs/response/*
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from services.CS.cs_response_service import classify_and_draft

router = APIRouter()


# ──────────────────────────────────────────────────────────────
# 요청 스키마
# ──────────────────────────────────────────────────────────────
class ResponseDraftRequest(BaseModel):
    inquiry:  str
    order_no: str = ""
    tone:     str = "formal"  # "formal" | "friendly"


# ──────────────────────────────────────────────────────────────
# POST /api/cs/response/draft
# ──────────────────────────────────────────────────────────────
@router.post("/draft")
async def generate_draft(body: ResponseDraftRequest):
    """
    고객 문의를 분류하고 응답 초안을 생성합니다.

    Request : application/json { inquiry, order_no?, tone? }
    Response: { type, draft, escalation: { needed, reason } }
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
