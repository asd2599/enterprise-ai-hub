"""
고객 미팅 요약 라우터 — /api/sales/meeting/*
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from services.sales.sales_meeting_service import summarize_meeting

router = APIRouter()


class MeetingRequest(BaseModel):
    company_name:  str
    meeting_date:  str        # YYYY-MM-DD
    meeting_notes: str        # 미팅 내용/메모 (자유 형식)


@router.post("/summarize")
def meeting_summarize(body: MeetingRequest):
    """
    미팅 메모/녹취 텍스트를 구조화하여 요약합니다.

    Request : { company_name, meeting_date, meeting_notes }
    Response: {
      meeting_title, key_discussions, customer_needs,
      concerns, action_items, next_agenda, crm_draft
    }
    """
    if not body.company_name.strip():
        raise HTTPException(status_code=400, detail="고객사명을 입력해 주세요.")
    if not body.meeting_notes.strip():
        raise HTTPException(status_code=400, detail="미팅 내용을 입력해 주세요.")

    try:
        result = summarize_meeting(
            company_name=body.company_name,
            meeting_date=body.meeting_date,
            meeting_notes=body.meeting_notes,
        )
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"AI 요약 실패: {str(e)}")

    return result
