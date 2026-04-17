# Enterprise AI Hub

대기업 사내 업무 자동화를 위한 AI 기반 포털 시스템입니다.  
재무·HR·CS·법무·영업·구매·전략·R&D 각 부서의 반복 업무를 OpenAI API와 연동해 자동화합니다.

> FDE(AI Frontend Developer Engineer) 취업 포트폴리오 — 기획·지시·구현·회고의 전 과정을 기록한 과정형 포트폴리오입니다.

---

## Tech Stack

| 구분 | 기술 |
|---|---|
| Frontend | Vite, React 19 (Functional), TailwindCSS v4, Recharts |
| Backend | FastAPI (Python), pg8000 (PostgreSQL) |
| AI | OpenAI gpt-4o-mini, text-embedding-3-small, GPT Vision, Whisper STT |
| 인증 | localStorage 세션 기반 (사번 + 부서 + 직급) |

---

## 주요 기능

### Back-Office

| 부서 | 기능 |
|---|---|
| **재무/회계** | 영수증 OCR 자동 전표 처리 · AI 계정과목 추천 · CFO 재무 리포트 · 예산 대비 집행률 대시보드 |
| **HR** | 채용 공고 JD 자동 생성 · 면접 질문 생성 · 인사 규정 RAG 챗봇 · 직원 성과 평가 · 사번 자동 발급 · 계정 승인 |
| **법무** | 벡터 RAG 법무 챗봇 · 계약서 리스크 AI 검토 (Vision) · 계약서 초안 DOCX 생성 |
| **총무/구매** | GPT Tool Use 기반 구매 AI 에이전트 · 견적 비교·추천·DOCX/PDF 보고서 |

### Front-Office

| 부서 | 기능 |
|---|---|
| **영업** | 고객 맞춤 제안서 AI 생성 · 미팅 녹취 STT + 액션 아이템 추출 · 영업 실적 AI 분석 대시보드 |
| **마케팅** | 카피라이팅 자동화 · SNS 콘텐츠 생성 · 보도자료 초안 작성 |
| **CS** | 고객 응대 초안 생성 · FAQ 자동 정리 · VOC 감성 분석 리포트 · 음성 메모 STT |
| **전략/기획** | 경쟁사 동향 리서치 (SSE 스트리밍) · AI 경쟁사 자동 추천 · PPTX 자동 생성 |
| **R&D** | 개발 문서 RAG 챗봇 · 장애 로그 AI 분석 · 릴리즈 노트 자동 생성 · 기술 용어 한↔영 번역 |

---

## 프로젝트 구조

```
enterprise-ai-hub/
├── frontend/
│   └── src/
│       ├── api/                  # API 호출 중앙화 (auth, finance, hr, cs, legal, sales, ...)
│       ├── pages/
│       │   ├── backoffice/       # 재무 · HR · 법무 · 총무
│       │   ├── frontoffice/      # 영업 · 마케팅 · CS · 전략
│       │   └── rnd/              # R&D (개발/IT)
│       └── components/layout/    # AppLayout, Breadcrumb
└── backend/
    ├── main.py
    ├── routers/                  # 부서별 API 라우터
    ├── services/
    │   ├── common/               # document_parser, rag_utils, stt_service
    │   ├── finance/ hr/ CS/ legal/ sales/ procurement/ strategy/ dev/
    └── tables/                   # DDL 및 시드 데이터
```

---

## 시작하기

### 요구 사항

- Python 3.11+
- Node.js 20+
- PostgreSQL

### Backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate
pip install -r requirements.txt

# .env 파일 생성
cp .env.example .env
# OPENAI_API_KEY, DB_HOST, DB_NAME, DB_USER, DB_PASSWORD, FRONTEND_URL 설정

uvicorn main:app --reload
```

### Frontend

```bash
cd frontend
npm install

# .env 파일 생성
echo "VITE_API_BASE_URL=http://localhost:8000" > .env

npm run dev
```

### 환경 변수

**backend/.env**

```env
OPENAI_API_KEY=sk-...
DB_HOST=localhost
DB_PORT=5432
DB_NAME=enterprise_ai_hub
DB_USER=postgres
DB_PASSWORD=yourpassword
FRONTEND_URL=http://localhost:5173
PORT=8000
```

**frontend/.env**

```env
VITE_API_BASE_URL=http://localhost:8000
```

---

## API 문서

백엔드 실행 후 `http://localhost:8000/docs` 에서 Swagger UI로 확인할 수 있습니다.

---

## 설계 원칙

1. **API 중앙화** — 모든 fetch 호출은 `src/api/*.js` 에서만 수행
2. **Loading / Error / Empty 상태** — 모든 비동기 UI에 3가지 상태 필수 구현
3. **Human-in-the-Loop** — AI 분석 결과를 사람이 검토·확정하는 단계 포함
4. **벡터 RAG** — pgvector 없이 PostgreSQL `REAL[]` + numpy 코사인 유사도로 구현
5. **SSE 스트리밍** — 장시간 AI 작업은 Server-Sent Events로 실시간 진행 상황 표시
6. **공통 모듈** — `document_parser`, `rag_utils`, `stt_service` 재사용 구조
7. **이중 보안** — 클라이언트 라우터 가드 + 서버 사이드 권한 검증 병행
8. **Mobile-First** — 버튼 최소 44px, 반응형 그리드
