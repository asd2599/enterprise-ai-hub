# Enterprise AI Hub - Task 관리 문서

## 프로젝트 개요
대기업 내부용 통합 업무 자동화 포털. HR/마케팅/IT 부서별 AI 자동화 도구 제공.

---

## 현재 스프린트: 초기 세팅

### [x] 1. Frontend 세팅 (Vite + React + TailwindCSS)
- [x] Vite + React 프로젝트 생성 (`npm create vite@latest`)
- [x] TailwindCSS v4 설치 및 Vite 플러그인 설정
- [x] `src/api/client.js` 생성 (API 클라이언트 + 스트리밍 유틸)
- [x] `.env.example` 생성 (`VITE_API_BASE_URL`)
- [x] 기본 App.jsx - 기업용 홈화면 UI 구성

### [x] 2. Backend 세팅 (FastAPI)
- [x] 디렉토리 구조 생성 (`routers/`, `services/`, `models/`)
- [x] `main.py` - FastAPI 앱 + CORS 미들웨어 설정
- [x] `config.py` - pydantic-settings 환경변수 관리
- [x] `requirements.txt` 작성
- [x] `.env.example` 생성 (`ANTHROPIC_API_KEY`, `FRONTEND_URL`)

### [x] 3. CORS 연결 설정
- [x] Backend CORS 미들웨어 설정 (`settings.frontend_url` 기반)
- [x] Frontend `VITE_API_BASE_URL` 환경변수 연동

### [x] 4. CLAUDE.md 복사
- [x] `enterprise-ai-hub/CLAUDE.md` 생성

---

## 현재 스프린트: 라우팅 & 대시보드

### [x] 5. 메인 대시보드 & 부서별 라우팅 구조
- [x] `react-router-dom` 설치
- [x] `src/data/departments.js` — 카테고리/부서 데이터 + 컬러 테마
- [x] `App.jsx` 라우팅 구조 재작성 (BrowserRouter + Routes)
- [x] 공통 레이아웃 (`AppLayout`, `Header`, `Sidebar`, `Breadcrumb`)
- [x] `DashboardPage.jsx` — 카테고리 카드 3개 + 통계 요약
- [x] `CategoryPage.jsx` — 부서 카드 목록
- [x] `DepartmentPage.jsx` — 빈 페이지 (Coming Soon)

**라우팅 구조**
| URL | 페이지 |
|-----|--------|
| `/` | DashboardPage |
| `/:categoryId` | CategoryPage |
| `/:categoryId/:deptId` | DepartmentPage |

---

## 다음 스프린트: 기능 구현 (미정)

### [ ] 6. HR 모듈
- [ ] 채용 공고 생성 API (`POST /api/hr/job-post`)
- [ ] 면접 질문 생성 API (`POST /api/hr/interview-questions`)
- [ ] HR 페이지 UI 컴포넌트

### [ ] 7. 마케팅 모듈
- [ ] 카피라이팅 API (`POST /api/marketing/copy`)
- [ ] 콘텐츠 생성 API (`POST /api/marketing/content`)

### [ ] 8. IT 모듈
- [ ] 코드 리뷰 API (`POST /api/it/code-review`)
- [ ] 기술 문서 작성 API (`POST /api/it/doc-generate`)

---

## 리비전 로그

| # | 날짜 | 변경 내용 |
|---|------|-----------|
| 001 | 2026-04-08 | Task.md 초안 작성, 디렉토리 구조 생성 |
| 002 | 2026-04-08 | Frontend Vite+React+TailwindCSS v4 세팅 완료 |
| 003 | 2026-04-08 | Backend FastAPI 기본 구조 + CORS 설정 완료 |
| 004 | 2026-04-08 | .env.example 양쪽 생성, CLAUDE.md 복사 완료 |
| 005 | 2026-04-08 | 메인 대시보드 + 3카테고리/11부서 라우팅 구조 완성 |
