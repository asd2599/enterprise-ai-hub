from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from config import settings

# FastAPI 앱 초기화
app = FastAPI(
    title="Enterprise AI Hub API",
    description="HR/마케팅/IT 부서별 AI 자동화 API",
    version="0.1.0",
)

# CORS 설정 - Frontend 도메인 허용
app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.frontend_url],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 라우터 등록 (추후 각 도메인 라우터 추가)
# from routers import hr, marketing, it
# app.include_router(hr.router, prefix="/api/hr", tags=["HR"])
# app.include_router(marketing.router, prefix="/api/marketing", tags=["Marketing"])
# app.include_router(it.router, prefix="/api/it", tags=["IT"])


@app.get("/")
def root():
    return {"status": "ok", "message": "Enterprise AI Hub API가 실행 중입니다."}


@app.get("/health")
def health_check():
    return {"status": "healthy"}
