// 부서 및 카테고리 데이터 — 라우팅 / 사이드바 / 카드 UI 공용

export const COLOR_THEMES = {
  blue: {
    cardBg: 'bg-blue-50 dark:bg-blue-950/30',
    cardBorder: 'border-blue-200 dark:border-blue-800',
    cardHover: 'hover:border-blue-400 dark:hover:border-blue-500 hover:shadow-blue-100 dark:hover:shadow-blue-900/20',
    iconBg: 'bg-blue-600',
    badge: 'bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300',
    text: 'text-blue-600 dark:text-blue-400',
    sidebarHeader: 'text-blue-700 dark:text-blue-400',
    sidebarActive: 'bg-blue-50 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 border-l-2 border-blue-500',
    dot: 'bg-blue-500',
  },
  amber: {
    cardBg: 'bg-amber-50 dark:bg-amber-950/30',
    cardBorder: 'border-amber-200 dark:border-amber-800',
    cardHover: 'hover:border-amber-400 dark:hover:border-amber-500 hover:shadow-amber-100 dark:hover:shadow-amber-900/20',
    iconBg: 'bg-amber-500',
    badge: 'bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-300',
    text: 'text-amber-600 dark:text-amber-400',
    sidebarHeader: 'text-amber-700 dark:text-amber-400',
    sidebarActive: 'bg-amber-50 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 border-l-2 border-amber-500',
    dot: 'bg-amber-500',
  },
  emerald: {
    cardBg: 'bg-emerald-50 dark:bg-emerald-950/30',
    cardBorder: 'border-emerald-200 dark:border-emerald-800',
    cardHover: 'hover:border-emerald-400 dark:hover:border-emerald-500 hover:shadow-emerald-100 dark:hover:shadow-emerald-900/20',
    iconBg: 'bg-emerald-600',
    badge: 'bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300',
    text: 'text-emerald-600 dark:text-emerald-400',
    sidebarHeader: 'text-emerald-700 dark:text-emerald-400',
    sidebarActive: 'bg-emerald-50 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 border-l-2 border-emerald-500',
    dot: 'bg-emerald-500',
  },
}

export const CATEGORIES = [
  {
    id: 'backoffice',
    label: '경영지원 및 관리',
    sublabel: 'Back-Office',
    color: 'blue',
    description: '인사, 재무, 법무, 총무 등 기업 운영의 핵심 지원 부서를 위한 AI 도구',
    departments: [
      {
        id: 'hr',
        label: '인사(HR)팀',
        description: '채용 · 평가 · 규정 · 급여 등 인사 실무를 위한 AI 도구',
        tools: [
          { id: 'hr-humanresources', label: '인사팀 알림사항', description: '인사팀 공지, 마감 일정, 운영 메모를 한 화면에서 확인합니다.', icon: 'users', path: '/backoffice/hr/humanresources' },
          { id: 'hr-hire-create',   label: '채용 공고 생성기',       description: '직무 요건을 입력하면 최적화된 채용 공고를 자동 생성합니다.',            icon: 'document', path: '/backoffice/hr/hire-create' },
          { id: 'hr-hire-request',  label: '채용 요청서 작성',       description: '채용 필요 인원과 요청 사유를 정리해 채용 요청서를 작성합니다.',          icon: 'edit',     path: '/backoffice/hr/hire-request' },
          /*
          { id: 'hr-interview',     label: '면접 질문 자동 생성',    description: '직무 유형에 맞는 역량 기반 면접 질문 세트를 만들어 드립니다.',         icon: 'chat',     path: '/backoffice/hr/q-generate' },
          { id: 'hr-pay',           label: '급여 관리',             description: '급여 정산과 지급 관련 업무를 정리하고 필요한 문서를 준비합니다.',          icon: 'chart',    path: '/backoffice/hr/pay' },
          { id: 'hr-match',         label: '인재 매칭',             description: '후보자 정보와 직무 요건을 비교해 적합한 인재를 빠르게 매칭합니다.',       icon: 'compare',  path: '/backoffice/hr/match' },
          { id: 'hr-onboarding',    label: '온보딩 자료 자동화',     description: '신입사원 온보딩 가이드와 교육 자료를 빠르게 생성합니다.',                icon: 'users',    path: '/backoffice/hr/auto-manual' },
          숨김 — HRPage·App.jsx·여기 4줄 동시에 주석 해제하면 다시 노출
          */
          { id: 'hr-regulation',    label: '인사 규정 챗봇',         description: '사내 인사 규정과 제도를 빠르게 조회하고 질의응답할 수 있습니다.',       icon: 'chat',     path: '/backoffice/hr/regulation-chat' },
          { id: 'hr-departments', label: 'Departments',   description: '전체 임직원의 소속 부서를 선택한 조직으로 일괄 변경할 수 있습니다.',      icon: 'users',    path: '/backoffice/hr/departments' },
          { id: 'hr-eval-report',   label: '인사 평가 보고서 작성',   description: '평가 항목과 점수를 바탕으로 객관적인 평가 보고서를 작성합니다.',        icon: 'check',    path: '/backoffice/hr/evaluate' },
        ],
      },
      {
        id: 'finance',
        label: '재무/회계팀',
        description: '재무 보고서 분석 · 예산 계획 지원 · 결산 정리',
        tools: [
          { id: 'fin-report',    label: '재무 보고서 분석',    description: '재무제표 데이터를 분석하고 핵심 인사이트를 요약합니다.',          icon: 'chart' },
          { id: 'fin-budget',    label: '예산 계획 지원',      description: '전년도 실적 기반으로 부서별 예산 계획안 초안을 작성합니다.',    icon: 'document' },
          { id: 'fin-expense',   label: '지출 분류 자동화',    description: '지출 내역을 자동으로 계정 과목별로 분류하고 정리합니다.',        icon: 'list' },
          { id: 'fin-closing',   label: '결산 요약 생성',      description: '월·분기·연간 결산 데이터를 임원 보고용으로 요약합니다.',        icon: 'document' },
        ],
      },
      {
        id: 'legal',
        label: '법무/컴플라이언스팀',
        description: '계약서 검토 · 법률 문서 요약 · 규정 준수 체크',
        tools: [
          { id: 'legal-contract',    label: '계약서 검토 및 요약',    description: '계약서의 핵심 조항과 리스크 사항을 빠르게 파악합니다.',          icon: 'document' },
          { id: 'legal-draft',       label: '법률 문서 작성 지원',    description: '표준 계약서 및 법률 문서 초안을 자동으로 생성합니다.',           icon: 'edit' },
          { id: 'legal-compliance',  label: '규정 준수 체크리스트',   description: '업무 프로세스의 법률·내부 규정 준수 여부를 점검합니다.',         icon: 'check' },
          { id: 'legal-compare',     label: '계약 조항 비교 분석',    description: '두 계약서의 조항 차이를 자동으로 비교하고 분석합니다.',          icon: 'compare' },
        ],
      },
      {
        id: 'admin',
        label: '총무/구매팀',
        description: '구매 요청 처리 · 총무 문서 자동화 · 시설 관리',
        tools: [
          { id: 'admin-agent', label: '구매 AI 에이전트',    description: '자연어 구매 요청 → 예산·공급업체·주문서까지 AI가 자동 처리합니다.', icon: 'chat',     path: '/backoffice/admin/agent' },
          { id: 'admin-quote', label: '견적서 비교 분석',    description: '견적서 이미지 여러 장을 업로드하면 AI가 조건을 비교표로 정리합니다.', icon: 'compare',  path: '/backoffice/admin/quote' },
          { id: 'admin-chat',  label: '구매 정책 챗봇',      description: '사내 구매 규정 기반 Q&A — 품의 기준·한도·승인 절차를 조회합니다.',   icon: 'document', path: '/backoffice/admin/chat'  },
          { id: 'admin-asset', label: '자산 실사 보고서',    description: '자산 현황을 분석하고 교체 우선순위와 실사 보고서를 자동 생성합니다.', icon: 'chart',    path: '/backoffice/admin/asset' },
        ],
      },
    ],
  },
  {
    id: 'frontoffice',
    label: '사업 및 영업',
    sublabel: 'Front-Office',
    color: 'amber',
    description: '전략, 영업, 마케팅, CS 등 사업 성장을 이끄는 부서를 위한 AI 도구',
    departments: [
      {
        id: 'strategy',
        label: '전략/기획팀',
        description: '사업 계획서 작성 · 시장 분석 보고서 · 경쟁사 조사',
        tools: [
          { id: 'str-bizplan',    label: '사업 계획서 작성',     description: '사업 목표와 현황을 바탕으로 구조화된 사업 계획서를 생성합니다.',  icon: 'document' },
          { id: 'str-market',     label: '시장 분석 보고서',     description: '산업 트렌드와 시장 규모를 분석한 보고서를 자동 작성합니다.',      icon: 'chart' },
          { id: 'str-competitor', label: '경쟁사 조사 요약',     description: '경쟁사 정보를 입력하면 비교 분석 요약본을 생성합니다.',           icon: 'compare' },
          { id: 'str-exec',       label: '임원 보고 자료 생성',  description: '복잡한 데이터를 경영진용 한 페이지 보고서로 정리합니다.',          icon: 'users' },
        ],
      },
      {
        id: 'sales',
        label: '영업/영업관리팀',
        description: '영업 제안서 · 고객사 브리핑 자동화 · 실적 분석',
        tools: [
          { id: 'sales-proposal',  label: '영업 제안서 생성',      description: '고객사 정보를 입력하면 맞춤형 영업 제안서를 자동 생성합니다.',  icon: 'document' },
          { id: 'sales-briefing',  label: '고객사 브리핑 자동화',  description: '미팅 전 고객사 현황 및 니즈를 요약한 브리핑 자료를 만듭니다.', icon: 'users' },
          { id: 'sales-perf',      label: '영업 실적 분석',        description: '월별 영업 데이터를 분석하고 목표 달성률을 시각화합니다.',       icon: 'chart' },
          { id: 'sales-meeting',   label: '고객 미팅 요약',        description: '미팅 내용을 입력하면 액션 아이템 중심의 요약본을 생성합니다.',   icon: 'chat' },
        ],
      },
      {
        id: 'marketing',
        label: '마케팅/PR팀',
        description: '카피라이팅 · 콘텐츠 생성 · SNS 포스팅 자동화',
        tools: [
          { id: 'mkt-copy',     label: '카피라이팅 생성',       description: '브랜드 톤앤매너에 맞는 광고 카피와 슬로건을 생성합니다.',          icon: 'edit' },
          { id: 'mkt-sns',      label: 'SNS 콘텐츠 자동화',     description: '채널별(인스타그램·링크드인·블로그) 맞춤 포스팅을 작성합니다.',  icon: 'chat' },
          { id: 'mkt-press',    label: '보도자료 작성',         description: '신제품·이벤트·실적 등 보도자료 초안을 즉시 생성합니다.',           icon: 'document' },
          { id: 'mkt-ad',       label: '광고 문구 A/B 생성',    description: '같은 메시지를 다양한 스타일로 변형하여 A/B 테스트용 문구를 만듭니다.', icon: 'compare' },
        ],
      },
      {
        id: 'cs',
        label: 'CS/고객지원팀',
        description: '고객 응대 스크립트 · FAQ 자동 생성 · 응답 템플릿',
        tools: [
          { id: 'cs-script',    label: '고객 응대 스크립트',    description: '상황별 최적화된 고객 응대 스크립트를 자동으로 생성합니다.',       icon: 'chat' },
          { id: 'cs-faq',       label: 'FAQ 자동 생성',         description: '자주 묻는 질문 목록을 분석하여 체계적인 FAQ를 만듭니다.',          icon: 'list' },
          { id: 'cs-complaint',  label: '불만 처리 가이드',      description: '고객 불만 유형별 처리 절차와 응대 가이드를 생성합니다.',          icon: 'check' },
          { id: 'cs-template',  label: '이메일 응답 템플릿',    description: '상황별 고객 이메일 응답 템플릿을 일관된 톤으로 생성합니다.',       icon: 'document' },
        ],
      },
    ],
  },
  {
    id: 'rnd',
    label: '기술 및 서비스',
    sublabel: 'R&D/Product',
    color: 'emerald',
    description: '개발, QA, 디자인 등 제품과 기술을 담당하는 부서를 위한 AI 도구',
    departments: [
      {
        id: 'dev',
        label: '개발/IT운영팀',
        description: '코드 리뷰 · 기술 문서 · 장애 원인 분석 · 릴리즈 노트',
        tools: [
          { id: 'dev-review',   label: '코드 리뷰 지원',       description: '코드를 붙여넣으면 품질·보안·성능 관점에서 리뷰 코멘트를 생성합니다.', icon: 'check' },
          { id: 'dev-docs',     label: '기술 문서 자동화',     description: 'API 스펙, 아키텍처 설명 등 기술 문서 초안을 빠르게 작성합니다.',    icon: 'document' },
          { id: 'dev-incident', label: '장애 원인 분석',       description: '에러 로그와 증상을 입력하면 원인과 해결 방향을 분석합니다.',          icon: 'chart' },
          { id: 'dev-release',  label: '릴리즈 노트 생성',     description: '커밋 내역이나 변경 사항을 사용자 친화적인 릴리즈 노트로 변환합니다.', icon: 'edit' },
        ],
      },
      {
        id: 'qa',
        label: 'QA/품질관리팀',
        description: '테스트 케이스 생성 · 버그 리포트 자동화 · 품질 체크',
        tools: [
          { id: 'qa-testcase',  label: '테스트 케이스 생성',    description: '요구사항을 분석하여 체계적인 테스트 케이스 목록을 자동 생성합니다.', icon: 'list' },
          { id: 'qa-bugreport', label: '버그 리포트 자동화',    description: '버그 현상을 입력하면 표준화된 버그 리포트 형식으로 정리합니다.',    icon: 'document' },
          { id: 'qa-checklist', label: '품질 체크리스트',       description: '릴리즈 전 QA 체크리스트를 기능 유형에 맞게 생성합니다.',             icon: 'check' },
          { id: 'qa-regression', label: '회귀 테스트 계획',     description: '코드 변경 범위를 분석하여 회귀 테스트 우선순위와 범위를 제안합니다.', icon: 'chart' },
        ],
      },
      {
        id: 'design',
        label: '디자인/UX팀',
        description: 'UX 문구 작성 · 사용자 조사 분석 · 디자인 명세 정리',
        tools: [
          { id: 'ux-copy',      label: 'UX 문구 작성 지원',    description: '버튼·레이블·안내 문구 등 UI 텍스트를 사용자 친화적으로 작성합니다.',  icon: 'edit' },
          { id: 'ux-research',  label: '사용자 조사 분석',     description: '인터뷰·설문 결과를 분석하여 주요 인사이트와 패턴을 도출합니다.',     icon: 'users' },
          { id: 'ux-spec',      label: '디자인 명세 정리',     description: '디자인 의도와 인터랙션 규칙을 개발자용 명세서로 자동 정리합니다.',    icon: 'document' },
          { id: 'ux-a11y',      label: '접근성 검토 지원',     description: 'WCAG 기준에 따라 화면 설계의 접근성 이슈를 점검하고 개선안을 제안합니다.', icon: 'check' },
        ],
      },
    ],
  },
]

// O(1) 조회용 맵
export const CATEGORY_MAP = Object.fromEntries(CATEGORIES.map(c => [c.id, c]))

export const DEPT_MAP = {}
CATEGORIES.forEach(cat => {
  cat.departments.forEach(dept => {
    DEPT_MAP[dept.id] = { ...dept, categoryId: cat.id, categoryLabel: cat.label, color: cat.color }
  })
})

/** 사번 발급 입사 부서 코드 — DEPT_MAP id ↔ 코드 (메인 대시보드 부서 순서 유지) */
export const DEPT_ID_TO_ISSUE_CODE = {
  hr: 'BHR',
  finance: 'BFI',
  legal: 'BLG',
  admin: 'BGA',
  strategy: 'FST',
  sales: 'FSL',
  marketing: 'FMK',
  cs: 'FCS',
  dev: 'RDE',
  qa: 'RQA',
  design: 'RDS',
}

/** 메인 대시보드(CATEGORIES)와 동일한 부서 코드 정렬 순서 (마지막: 기타) */
export const DASHBOARD_ISSUE_CODE_ORDER = [
  ...CATEGORIES.flatMap((cat) =>
    cat.departments.map((d) => DEPT_ID_TO_ISSUE_CODE[d.id]),
  ),
  'XYZ',
]

/** 입사 부서 코드 → 대시보드 부서 카드와 동일한 팀명 (각 부서 `label`) */
export const ISSUE_CODE_TO_LABEL = {
  ...Object.fromEntries(
    CATEGORIES.flatMap((cat) =>
      cat.departments.map((d) => [DEPT_ID_TO_ISSUE_CODE[d.id], d.label]),
    ),
  ),
  XYZ: '기타(관리자)',
}

/** 계정 승인 / 부서 변경에서 선택 가능한 부서명 목록 (대시보드 순서 + 기타(관리자) 마지막) */
export const DEPT_LABEL_OPTIONS = [
  ...CATEGORIES.flatMap((cat) => cat.departments.map((d) => d.label)),
  ISSUE_CODE_TO_LABEL.XYZ,
]
