// 재무/자금 페이지 — 자금 분석 · 예산 소진율 · 월별 지출 추이 대시보드
import { useState } from 'react'
import Breadcrumb from '../../../components/layout/Breadcrumb'

// 목 데이터 — AI/API 연동 전 UI 확인용
const MOCK_SUMMARY = {
  totalBudget:  1_200_000_000,
  totalSpent:     741_500_000,
  lastMonthSpent: 98_300_000,
  forecastEnd:    '2025-11',  // 예산 소진 예측 시점
}

const MOCK_DEPARTMENTS = [
  { name: '개발팀',     budget: 320_000_000, spent: 228_000_000 },
  { name: '마케팅팀',   budget: 180_000_000, spent: 162_000_000 },
  { name: '영업팀',     budget: 250_000_000, spent: 145_000_000 },
  { name: '운영팀',     budget: 200_000_000, spent: 118_000_000 },
  { name: '인사팀',     budget: 150_000_000, spent:  56_000_000 },
  { name: '총무팀',     budget: 100_000_000, spent:  32_500_000 },
]

// 월별 지출 목 데이터 (Recharts 연동 시 그대로 사용)
const MOCK_MONTHLY = [
  { month: '1월',  spent: 72_000_000 },
  { month: '2월',  spent: 65_000_000 },
  { month: '3월',  spent: 88_000_000 },
  { month: '4월',  spent: 95_000_000 },
  { month: '5월',  spent: 81_000_000 },
  { month: '6월',  spent: 103_000_000 },
  { month: '7월',  spent: 98_000_000 },
  { month: '8월',  spent: 112_000_000 },
  { month: '9월',  spent: 91_000_000 },
  { month: '10월', spent: 98_300_000 },
]

const CURRENT_YEAR = 2025

function formatWon(n) {
  if (n >= 1_0000_0000) return `${(n / 1_0000_0000).toFixed(1)}억`
  if (n >= 1_000_000)   return `${(n / 1_000_000).toFixed(0)}백만`
  return `${n.toLocaleString()}원`
}

function BurnBar({ spent, budget }) {
  const pct = Math.min(Math.round((spent / budget) * 100), 100)
  const color = pct >= 90 ? 'bg-red-500' : pct >= 70 ? 'bg-amber-400' : 'bg-blue-500'
  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 h-2 rounded-full bg-gray-100 dark:bg-gray-700 overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-500 ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs tabular-nums text-gray-500 dark:text-gray-400 w-8 text-right">{pct}%</span>
    </div>
  )
}

// 월별 지출 차트 — Recharts 미설치 시 순수 CSS 막대 차트로 대체
// TODO: npm install recharts 후 아래 주석 해제하여 교체
// import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
function MonthlyChart({ data }) {
  const maxVal = Math.max(...data.map(d => d.spent))
  return (
    <div className="flex items-end gap-2 h-40 px-1">
      {data.map(d => {
        const heightPct = Math.round((d.spent / maxVal) * 100)
        return (
          <div key={d.month} className="flex-1 flex flex-col items-center gap-1 group">
            {/* 툴팁 */}
            <div className="opacity-0 group-hover:opacity-100 transition-opacity text-xs bg-gray-800 text-white
              rounded px-1.5 py-0.5 whitespace-nowrap pointer-events-none">
              {formatWon(d.spent)}
            </div>
            <div
              className="w-full rounded-t bg-blue-400 dark:bg-blue-500 group-hover:bg-blue-600 transition-colors"
              style={{ height: `${heightPct}%` }}
            />
            <span className="text-[10px] text-gray-400 dark:text-gray-500">{d.month}</span>
          </div>
        )
      })}
    </div>
  )
  /* Recharts 교체 코드:
  return (
    <ResponsiveContainer width="100%" height={160}>
      <BarChart data={data} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
        <XAxis dataKey="month" tick={{ fontSize: 11 }} />
        <YAxis tickFormatter={v => formatWon(v)} tick={{ fontSize: 10 }} width={60} />
        <Tooltip formatter={v => [formatWon(v), '지출']} />
        <Bar dataKey="spent" fill="#3b82f6" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
  */
}

export default function TreasuryPage() {
  const [period, setPeriod] = useState(CURRENT_YEAR)

  const burnRate = Math.round((MOCK_SUMMARY.totalSpent / MOCK_SUMMARY.totalBudget) * 100)
  const remaining = MOCK_SUMMARY.totalBudget - MOCK_SUMMARY.totalSpent

  return (
    <div>
      <Breadcrumb
        crumbs={[
          { label: '경영지원 및 관리', to: '/backoffice' },
          { label: '재무/회계팀', to: '/backoffice/finance' },
          { label: '재무/자금' },
        ]}
      />

      {/* 헤더 */}
      <div className="mt-4 mb-6 rounded-xl border p-5 bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-blue-600 text-white text-xs font-bold shrink-0">
              자금
            </div>
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                Back-Office · 재무/회계팀
              </span>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white leading-tight">
                자금 분석 대시보드
              </h1>
            </div>
          </div>
          {/* 기간 선택 */}
          <select
            value={period}
            onChange={e => setPeriod(Number(e.target.value))}
            className="text-xs rounded-lg border border-blue-200 dark:border-blue-700 bg-white dark:bg-gray-900
              text-gray-700 dark:text-gray-300 px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-400 min-h-[36px]"
          >
            {[2025, 2024, 2023].map(y => (
              <option key={y} value={y}>{y}년</option>
            ))}
          </select>
        </div>
      </div>

      {/* 요약 지표 카드 4개 */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {[
          { label: '연간 총 예산',    value: formatWon(MOCK_SUMMARY.totalBudget), sub: `${period}년 전체` },
          { label: '누적 집행액',     value: formatWon(MOCK_SUMMARY.totalSpent),  sub: `소진율 ${burnRate}%` },
          { label: '잔여 예산',       value: formatWon(remaining),                sub: `${100 - burnRate}% 남음` },
          { label: '전월 지출',       value: formatWon(MOCK_SUMMARY.lastMonthSpent), sub: '전월 대비 +6.7%' },
        ].map(card => (
          <div key={card.label}
            className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-4">
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{card.label}</p>
            <p className="text-lg font-bold text-gray-900 dark:text-white tabular-nums">{card.value}</p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{card.sub}</p>
          </div>
        ))}
      </div>

      {/* 월별 지출 추이 */}
      <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-5 mb-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-white">월별 지출 추이</h2>
          <span className="text-xs text-gray-400">{period}년 1~10월</span>
        </div>
        <MonthlyChart data={MOCK_MONTHLY} />
      </div>

      {/* 부서별 예산 소진율 */}
      <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-5">
        <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">부서별 예산 소진율</h2>
        <div className="space-y-3">
          {MOCK_DEPARTMENTS.map(dept => {
            const pct = Math.round((dept.spent / dept.budget) * 100)
            return (
              <div key={dept.name}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium text-gray-700 dark:text-gray-300">{dept.name}</span>
                  <span className="text-xs tabular-nums text-gray-500 dark:text-gray-400">
                    {formatWon(dept.spent)} / {formatWon(dept.budget)}
                  </span>
                </div>
                <BurnBar spent={dept.spent} budget={dept.budget} />
              </div>
            )
          })}
        </div>
        <div className="flex items-center gap-4 mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
          {[
            { color: 'bg-blue-500',  label: '정상 (70% 미만)' },
            { color: 'bg-amber-400', label: '주의 (70~89%)' },
            { color: 'bg-red-500',   label: '위험 (90% 이상)' },
          ].map(l => (
            <div key={l.label} className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
              <div className={`w-2.5 h-2.5 rounded-full ${l.color}`} />
              {l.label}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
