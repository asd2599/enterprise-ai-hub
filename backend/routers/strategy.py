"""
전략/기획팀 라우터
POST /api/strategy/competitor/stream   — SSE 스트리밍
POST /api/strategy/competitor/download — PPTX 반환
POST /api/strategy/ticker/search       — 종목 코드 탐색
POST /api/strategy/financial           — 재무 지표 조회
"""
from typing import List
from urllib.parse import quote

from fastapi import APIRouter, HTTPException
from fastapi.responses import Response, StreamingResponse
from pydantic import BaseModel

from services.strategy.competitor_research_service import (
    ALL_CATEGORIES,
    stream_competitor_research,
)
from services.strategy.strategy_pptx_service import generate_research_pptx

router = APIRouter()


class CompanyItem(BaseModel):
    name:     str
    articles: list = []
    analysis: dict = {}


class ResearchStreamRequest(BaseModel):
    companies:  List[str]         # 경쟁사 이름 목록 (1~3개)
    categories: List[str] = []    # 빈 리스트면 전체 카테고리 사용


class ResearchDownloadRequest(BaseModel):
    companies:      List[CompanyItem]
    summary:        str  = ""
    categories:     List[str] = []
    financial_data: dict = {}   # { ticker: { metric: value } }
    ticker_map:     dict = {}   # { company_name: { ticker, exchange, found } }


class TickerSearchRequest(BaseModel):
    company_name: str


class FinancialDataRequest(BaseModel):
    tickers: List[str]


@router.post("/competitor/stream")
def competitor_stream(body: ResearchStreamRequest):
    """경쟁사 동향 리서치 SSE 스트리밍"""
    companies = [c.strip() for c in body.companies if c.strip()]
    if not companies:
        raise HTTPException(status_code=400, detail="경쟁사 이름을 1개 이상 입력해 주세요.")
    if len(companies) > 3:
        raise HTTPException(status_code=400, detail="경쟁사는 최대 3개까지 입력할 수 있습니다.")

    categories = [c for c in body.categories if c in ALL_CATEGORIES] or ALL_CATEGORIES

    def generate():
        yield from stream_competitor_research(companies, categories)

    return StreamingResponse(
        generate(),
        media_type="text/event-stream",
        headers={
            "Cache-Control":     "no-cache",
            "X-Accel-Buffering": "no",
        },
    )


@router.post("/competitor/download")
def competitor_download(body: ResearchDownloadRequest):
    """경쟁사 리서치 결과 PPTX 다운로드"""
    if not body.companies:
        raise HTTPException(status_code=400, detail="리서치 결과가 없습니다.")

    categories = body.categories or ALL_CATEGORIES
    company_names = "_".join(c.name for c in body.companies[:3])

    try:
        pptx_bytes = generate_research_pptx({
            "companies":      [c.model_dump() for c in body.companies],
            "summary":        body.summary,
            "categories":     categories,
            "financial_data": body.financial_data,
            "ticker_map":     body.ticker_map,
        })
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"PPTX 생성 실패: {str(exc)}") from exc

    filename     = f"경쟁사_동향_리서치_{company_names}.pptx"
    encoded_name = quote(filename)
    return Response(
        content=pptx_bytes,
        media_type="application/vnd.openxmlformats-officedocument.presentationml.presentation",
        headers={"Content-Disposition": f"attachment; filename*=UTF-8''{encoded_name}"},
    )


@router.post("/ticker/search")
def ticker_search(body: TickerSearchRequest):
    """회사명으로 주식 종목 코드 자동 탐색"""
    from services.strategy.ticker_search_service import search_ticker
    company = body.company_name.strip()
    if not company:
        raise HTTPException(status_code=400, detail="회사명을 입력해 주세요.")
    return search_ticker(company)


@router.post("/financial")
def financial_data(body: FinancialDataRequest):
    """종목 코드 목록으로 재무 지표 조회"""
    from services.strategy.financial_data_service import get_financial_data
    tickers = [t.strip() for t in body.tickers if t.strip()]
    if not tickers:
        return {}
    return get_financial_data(tickers)
