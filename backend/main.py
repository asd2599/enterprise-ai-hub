"""
Enterprise AI Hub — FastAPI 앱 진입점
실행: uvicorn main:app --reload
"""
import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from config import settings
from routers.finance import router as finance_router
from routers.auth import router as auth_router
from routers.hr import router as hr_router
from routers.CS.cs_response import router as cs_response_router
from routers.CS.cs_faq import router as cs_faq_router
from routers.CS.cs_voc import router as cs_voc_router
from routers.CS.cs_policy import router as cs_policy_router
from routers.marketing.mkt_copy import router as mkt_copy_router
from routers.marketing.mkt_sns import router as mkt_sns_router
from routers.marketing.mkt_press import router as mkt_press_router
from routers.sales.sales_proposal import router as sales_proposal_router
from routers.sales.sales_performance import router as sales_performance_router
from routers.sales.sales_meeting import router as sales_meeting_router

# 업로드 폴더 보장
os.makedirs("uploads", exist_ok=True)

app = FastAPI(title="Enterprise AI Hub API")

# CORS — Frontend 도메인만 허용
app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.frontend_url],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 라우터 등록
app.include_router(auth_router,        prefix="/api/auth",         tags=["auth"])
app.include_router(finance_router,     prefix="/api/finance")
app.include_router(hr_router,          prefix="/api/hr",           tags=["hr"])
app.include_router(cs_response_router, prefix="/api/cs/response",  tags=["cs"])
app.include_router(cs_faq_router,      prefix="/api/cs/faq",       tags=["cs"])
app.include_router(cs_voc_router,      prefix="/api/cs/voc",       tags=["cs"])
app.include_router(cs_policy_router,   prefix="/api/cs/policy",    tags=["cs"])
app.include_router(mkt_copy_router,    prefix="/api/marketing/copy", tags=["marketing"])
app.include_router(mkt_sns_router,     prefix="/api/marketing/sns",  tags=["marketing"])
app.include_router(mkt_press_router,       prefix="/api/marketing/press",       tags=["marketing"])
app.include_router(sales_proposal_router,   prefix="/api/sales/proposal",         tags=["sales"])
app.include_router(sales_performance_router, prefix="/api/sales/performance",     tags=["sales"])
app.include_router(sales_meeting_router,    prefix="/api/sales/meeting",          tags=["sales"])


# 업로드 이미지 정적 서빙
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")


@app.get("/")
def root():
    return {"status": "ok", "message": "Enterprise AI Hub API가 실행 중입니다."}


@app.get("/health")
def health():
    return {"status": "healthy"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=settings.port, reload=True)
