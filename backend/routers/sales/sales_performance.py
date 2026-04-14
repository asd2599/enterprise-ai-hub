"""
영업 실적 분석 라우터 — /api/sales/performance/*
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from services.sales.sales_performance_service import get_team_members, analyze_performance

router = APIRouter()


class PerformanceRequest(BaseModel):
    period:    str        # 이번 달 | 이번 분기 | 올해
    member_id: str = "all"  # all | kim | lee | park | choi


@router.get("/members")
def performance_members():
    """팀원 목록을 반환합니다."""
    return get_team_members()


@router.post("/analyze")
def performance_analyze(body: PerformanceRequest):
    """
    CRM 실적 데이터를 분석하여 리포트를 생성합니다.

    Request : { period, member_id? }
    Response: {
      metrics, pipeline, members,
      summary, achievement_comment, anomalies,
      pipeline_insight, top_performer, risk_deals, recommendations
    }
    """
    if body.period not in ("이번 달", "이번 분기", "올해"):
        raise HTTPException(status_code=400, detail="period는 '이번 달', '이번 분기', '올해' 중 하나여야 합니다.")

    try:
        result = analyze_performance(
            period=body.period,
            member_id=body.member_id,
        )
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"AI 분석 실패: {str(e)}")

    return result
