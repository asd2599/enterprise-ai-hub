"""
영업 제안서 라우터 — /api/sales/proposal/*
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from services.sales.sales_proposal_service import generate_proposal

router = APIRouter()


class ProposalRequest(BaseModel):
    company_name: str
    industry:     str        # 제조업 | 유통·서비스 | IT
    company_size: str = ""   # 규모 (임직원 수, 매출 등)
    key_needs:    str        # 핵심 니즈


@router.post("/generate")
def proposal_generate(body: ProposalRequest):
    """
    고객사 맞춤형 영업 제안서 초안을 생성합니다.

    Request : { company_name, industry, company_size?, key_needs }
    Response: {
      executive_summary, situation_analysis, pain_points,
      solution, expected_benefits, success_case,
      implementation_schedule, investment, email_draft
    }
    """
    if body.industry not in ("제조업", "유통·서비스", "IT"):
        raise HTTPException(status_code=400, detail="industry는 '제조업', '유통·서비스', 'IT' 중 하나여야 합니다.")
    if not body.company_name.strip():
        raise HTTPException(status_code=400, detail="고객사명을 입력해 주세요.")
    if not body.key_needs.strip():
        raise HTTPException(status_code=400, detail="핵심 니즈를 입력해 주세요.")

    try:
        result = generate_proposal(
            company_name=body.company_name,
            industry=body.industry,
            company_size=body.company_size,
            key_needs=body.key_needs,
        )
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"AI 생성 실패: {str(e)}")

    return result
