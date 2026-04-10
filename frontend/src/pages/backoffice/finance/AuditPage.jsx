// 내부감사 페이지 — 규정 위반 · 이상 지출 탐지(FDS) 자동화
import { useState } from 'react'
import Breadcrumb from '../../../components/layout/Breadcrumb'

// 리스크 등급 정의
const RISK_LEVELS = {
  safe:    { label: 'Safe',    bg: 'bg-emerald-100 dark:bg-emerald-900/50', text: 'text-emerald-700 dark:text-emerald-300', dot: 'bg-emerald-500' },
  warning: { label: 'Warning', bg: 'bg-amber-100 dark:bg-amber-900/50',     text: 'text-amber-700 dark:text-amber-300',     dot: 'bg-amber-400'  },
  danger:  { label: 'Danger',  bg: 'bg-red-100 dark:bg-red-900/50',         text: 'text-red-700 dark:text-red-300',         dot: 'bg-red-500'    },
}

// 목 탐지 데이터 — AI 연동 전 UI 확인용
const MOCK_FLAGS = [
  {
    id: 1,
    risk: 'danger',
    date: '2025-10-21',
    dept: '영업팀',
    item: '고객사 접대비',
    amount: 890_000,
    reason: '단일 영수증 한도(50만원)를 초과하였으며, 결재선이 누락되어 있습니다. 동일 가맹점에서 30일 내 3회 이상 청구 패턴이 감지됩니다.',
    rule: '접대비 한도 규정 §3-2',
  },
  {
    id: 2,
    risk: 'warning',
    date: '2025-10-19',
    dept: '마케팅팀',
    item: '광고 대행사 선급금',
    amount: 3_200_000,
    reason: '선급금 지급 비율이 계약 조건(30%)을 초과했습니다(실제 50%). 계약서 원본 첨부가 확인되지 않습니다.',
    rule: '선급금 지급 기준 §7-1',
  },
  {
    id: 3,
    risk: 'danger',
    date: '2025-10-15',
    dept: '개발팀',
    item: '소프트웨어 라이선스 구매',
    amount: 12_500_000,
    reason: '구매 단가가 최근 6개월 시장가 대비 38% 높습니다. 비교 견적서 3건 미제출 상태이며 수의계약 사유 미기재.',
    rule: '구매 조달 내규 §5-4',
  },
  {
    id: 4,
    risk: 'warning',
    date: '2025-10-12',
    dept: '운영팀',
    item: '야근 택시비 일괄 청구',
    amount: 430_000,
    reason: '동일 부서 내 3인이 동일 날짜, 유사 경로의 택시 영수증을 동시 제출했습니다. 실제 야근 기록과 교차 검증 필요.',
    rule: '교통비 지원 기준 §4-1',
  },
  {
    id: 5,
    risk: 'safe',
    date: '2025-10-10',
    dept: '인사팀',
    item: '교육 훈련비',
    amount: 550_000,
    reason: '모든 규정을 준수하였습니다. 결재 완료, 영수증 첨부, 한도 내 지출이 확인됩니다.',
    rule: '—',
  },
  {
    id: 6,
    risk: 'safe',
    date: '2025-10-08',
    dept: '총무팀',
    item: '사무용품 구매',
    amount: 87_000,
    reason: '소모품 한도 내 정상 구매입니다. 구매 요청서와 수령 확인서가 일치합니다.',
    rule: '—',
  },
]

const FILTERS = [
  { key: 'all',     label: '전체',   count: MOCK_FLAGS.length },
  { key: 'danger',  label: 'Danger', count: MOCK_FLAGS.filter(f => f.risk === 'danger').length },
  { key: 'warning', label: 'Warning',count: MOCK_FLAGS.filter(f => f.risk === 'warning').length },
  { key: 'safe',    label: 'Safe',   count: MOCK_FLAGS.filter(f => f.risk === 'safe').length },
]

function RiskBadge({ level }) {
  const r = RISK_LEVELS[level]
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-semibold ${r.bg} ${r.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${r.dot}`} />
      {r.label}
    </span>
  )
}

function FlagCard({ item, expanded, onToggle }) {
  const r = RISK_LEVELS[item.risk]
  return (
    <div className={`rounded-xl border transition-all ${
      item.risk === 'danger'  ? 'border-red-200 dark:border-red-800' :
      item.risk === 'warning' ? 'border-amber-200 dark:border-amber-800' :
                                'border-gray-200 dark:border-gray-700'
    } bg-white dark:bg-gray-900 overflow-hidden`}>
      {/* 헤더 행 */}
      <button
        className="w-full text-left px-5 py-4 flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors min-h-[56px]"
        onClick={onToggle}
      >
        <RiskBadge level={item.risk} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{item.item}</p>
            <span className="text-sm font-semibold tabular-nums text-gray-700 dark:text-gray-300 shrink-0">
              {item.amount.toLocaleString()}원
            </span>
          </div>
          <p className="text-xs text-gray-400 mt-0.5">{item.dept} · {item.date}</p>
        </div>
        <svg
          className={`w-4 h-4 text-gray-400 shrink-0 transition-transform ${expanded ? 'rotate-90' : ''}`}
          fill="none" stroke="currentColor" viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </button>

      {/* 확장: AI 사유 요약 */}
      {expanded && (
        <div className={`px-5 pb-4 border-t ${
          item.risk === 'danger'  ? 'border-red-100 dark:border-red-900/50' :
          item.risk === 'warning' ? 'border-amber-100 dark:border-amber-900/50' :
                                    'border-gray-100 dark:border-gray-700'
        }`}>
          <div className={`mt-3 rounded-lg p-3.5 ${r.bg}`}>
            <p className={`text-xs font-semibold mb-1 ${r.text}`}>AI 판단 사유</p>
            <p className="text-xs text-gray-700 dark:text-gray-200 leading-relaxed">{item.reason}</p>
          </div>
          {item.rule !== '—' && (
            <div className="flex items-center gap-2 mt-2.5">
              <svg className="w-3.5 h-3.5 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span className="text-xs text-gray-500 dark:text-gray-400">위반 근거: <span className="font-medium text-gray-700 dark:text-gray-300">{item.rule}</span></span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default function AuditPage() {
  const [activeFilter, setActiveFilter] = useState('all')
  const [expandedId, setExpandedId] = useState(null)

  const filtered = activeFilter === 'all'
    ? MOCK_FLAGS
    : MOCK_FLAGS.filter(f => f.risk === activeFilter)

  const dangerCount  = MOCK_FLAGS.filter(f => f.risk === 'danger').length
  const warningCount = MOCK_FLAGS.filter(f => f.risk === 'warning').length

  return (
    <div>
      <Breadcrumb
        crumbs={[
          { label: '경영지원 및 관리', to: '/backoffice' },
          { label: '재무/회계팀', to: '/backoffice/finance' },
          { label: '내부감사' },
        ]}
      />

      {/* 헤더 */}
      <div className="mt-4 mb-6 rounded-xl border p-5 bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-blue-600 text-white text-xs font-bold shrink-0">
            감사
          </div>
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400">
              Back-Office · 재무/회계팀
            </span>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white leading-tight">
              이상 지출 탐지 (FDS)
            </h1>
          </div>
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          AI가 규정 위반 및 이상 지출 패턴을 자동 탐지하고 위험도를 판단합니다.
        </p>

        {/* 요약 배지 */}
        <div className="flex items-center gap-2 mt-3 flex-wrap">
          <span className="text-xs px-2.5 py-1 rounded-full font-medium bg-red-100 dark:bg-red-900/60 text-red-700 dark:text-red-300">
            Danger {dangerCount}건
          </span>
          <span className="text-xs px-2.5 py-1 rounded-full font-medium bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-300">
            Warning {warningCount}건
          </span>
          <span className="text-xs text-gray-400">최근 30일 기준</span>
        </div>
      </div>

      {/* 리스크 등급 필터 탭 */}
      <div className="flex gap-2 mb-5 flex-wrap">
        {FILTERS.map(f => (
          <button
            key={f.key}
            onClick={() => { setActiveFilter(f.key); setExpandedId(null) }}
            className={[
              'min-h-[36px] px-4 py-1.5 rounded-lg text-sm font-medium transition-colors',
              activeFilter === f.key
                ? 'bg-blue-600 text-white'
                : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-blue-300',
            ].join(' ')}
          >
            {f.label}
            <span className={`ml-1.5 text-xs ${activeFilter === f.key ? 'opacity-75' : 'text-gray-400'}`}>
              {f.count}
            </span>
          </button>
        ))}
      </div>

      {/* 탐지 결과 목록 */}
      {filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-200 dark:border-gray-700 p-10 text-center">
          <p className="text-sm text-gray-400">해당 등급의 탐지 항목이 없습니다.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(item => (
            <FlagCard
              key={item.id}
              item={item}
              expanded={expandedId === item.id}
              onToggle={() => setExpandedId(expandedId === item.id ? null : item.id)}
            />
          ))}
        </div>
      )}
    </div>
  )
}
