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
      { id: 'hr',      label: '인사(HR)팀',          description: '채용 공고 생성 · 면접 질문 자동화 · 인사 문서 작성' },
      { id: 'finance', label: '재무/회계팀',          description: '재무 보고서 분석 · 예산 계획 지원 · 결산 정리' },
      { id: 'legal',   label: '법무/컴플라이언스팀',  description: '계약서 검토 · 법률 문서 요약 · 규정 준수 체크' },
      { id: 'admin',   label: '총무/구매팀',          description: '구매 요청 처리 · 총무 문서 자동화 · 시설 관리' },
    ],
  },
  {
    id: 'frontoffice',
    label: '사업 및 영업',
    sublabel: 'Front-Office',
    color: 'amber',
    description: '전략, 영업, 마케팅, CS 등 사업 성장을 이끄는 부서를 위한 AI 도구',
    departments: [
      { id: 'strategy',  label: '전략/기획팀',    description: '사업 계획서 작성 · 시장 분석 보고서 · 경쟁사 조사' },
      { id: 'sales',     label: '영업/영업관리팀', description: '영업 제안서 · 고객사 브리핑 자동화 · 실적 분석' },
      { id: 'marketing', label: '마케팅/PR팀',    description: '카피라이팅 · 콘텐츠 생성 · SNS 포스팅 자동화' },
      { id: 'cs',        label: 'CS/고객지원팀',  description: '고객 응대 스크립트 · FAQ 자동 생성 · 응답 템플릿' },
    ],
  },
  {
    id: 'rnd',
    label: '기술 및 서비스',
    sublabel: 'R&D/Product',
    color: 'emerald',
    description: '개발, QA, 디자인 등 제품과 기술을 담당하는 부서를 위한 AI 도구',
    departments: [
      { id: 'dev',    label: '개발/IT운영팀',  description: '코드 리뷰 · 기술 문서 · 장애 원인 분석 · 릴리즈 노트' },
      { id: 'qa',     label: 'QA/품질관리팀', description: '테스트 케이스 생성 · 버그 리포트 자동화 · 품질 체크' },
      { id: 'design', label: '디자인/UX팀',   description: 'UX 문구 작성 · 사용자 조사 분석 · 디자인 명세 정리' },
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
