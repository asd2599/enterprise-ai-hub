# Enterprise AI Hub

## 1. Project Overview

대기업 내부용 통합 업무 자동화 포털.
HR / 마케팅 / IT 부서별 AI 자동화 도구를 제공하는 웹 서비스.
Claude API를 활용한 실제 동작하는 포트폴리오 프로젝트.

## 2. Tech Stack

- Frontend: Vite + React + TailwindCSS
- Backend: FastAPI (Python)
- AI: Claude API (claude-sonnet-4-20250514)
- Package: npm (frontend) / pip (backend)

## 3. Language & Communication

- 모든 답변과 문서는 반드시 한국어로 작성한다. (기술 용어 제외)
- 중복 설명 엄격 금지: 이미 설명된 개념은 반복하지 않고 즉시 본론으로 진입한다.
- 불필요한 인사말/맺음말 생략한다.

## 4. Coding Rules

- 컴포넌트는 함수형으로 작성
- 모든 주석은 한국어로 작성
- 에러 처리 및 로딩 상태 필수 포함
- 환경변수는 .env로 관리 (절대 하드코딩 금지)
- API 호출은 반드시 frontend/src/api/ 에서만 관리
- 들여쓰기(Indentation)를 정확히 유지하여 가독성을 해치지 않는다.

## 5. Claude API Rules

- 모델명: claude-sonnet-4-20250514
- 응답 방식: 스트리밍 사용
- 시스템 프롬프트: backend/services/ 에서 파일로 관리
- API Key: 환경변수 ANTHROPIC_API_KEY 사용

## 6. UI Rules

- 기업용 깔끔한 디자인
- 반응형 레이아웃 필수
- 로딩 / 에러 / 빈 상태 UI 항상 구현
- 다크모드 고려
- 모바일 환경 고려 (모바일 퍼스트 기준으로 레이아웃 설계)
- 터치 인터랙션 고려 (버튼 최소 크기 44px 이상 유지)

## 7. Task 문서 자동화

- 작업 시작 시 Task.md 초안을 자동 작성한다.
- 완료 항목 [x] / 진행 중 [ ] 로 체크리스트를 즉시 갱신한다.
- 코드 수정, 로직 변경, 새 요구사항 발생 시 Task.md를 자동 업단트한다.
- 모든 답변 끝에 현재 진행 상황 리비전 로그를 출력한다.

## 8. Rollback Protocol

- 에러 발생 시 즉시 "복구 모드(Rollback Mode)로 전환합니다." 선언한다.
- 현재 파일 상태를 다시 읽어 컨텍스트를 동기화한 후 Task.md에 복구 단계를 우선 반영한다.
