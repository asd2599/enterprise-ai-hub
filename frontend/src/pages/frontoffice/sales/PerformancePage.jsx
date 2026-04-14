// 영업 실적 분석 페이지 — 모의 CRM 데이터 기반 AI 리포트
import { useState, useEffect } from 'react'
import Breadcrumb from '../../../components/layout/Breadcrumb'
import { getTeamMembers, analyzePerformance } from '../../../api/sales'

function Spinner({ className = 'w-4 h-4' }) {
  return (
    <svg className={`${className} animate-spin`} fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
    </svg>
  )
}

function ErrorBanner({ message }) {
  if (!message) return null
  return (
    <div className="rounded-xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/30 px-5 py-3 mb-5">
      <p className="text-sm text-red-700 dark:text-red-300">{message}</p>
    </div>
  )
}

const PERIOD_OPTIONS = ['이번 달', '이번 분기', '올해']

const ANOMALY_COLOR = {
  '급등':  'bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800 text-green-700 dark:text-green-300',
  '급락':  'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800 text-red-700 dark:text-red-300',
  '주의':  'bg-orange-50 dark:bg-orange-950/20 border-orange-200 dark:border-orange-800 text-orange-700 dark:text-orange-300',
}

function formatWon(amount) {
  if (amount >= 100_000_000) return `${(amount / 100_000_000).toFixed(1)}억`
  if (amount >= 10_000)      return `${(amount / 10_000).toFixed(0)}만`
  return `${amount.toLocaleString()}`
}

// 전환율 병목 임계값 (백엔드 ANOMALY_RULES.conversion_bottleneck_pct 와 동일)
const CONVERSION_BOTTLENECK_PCT = 25

// 파이프라인 바 차트 + 인접 단계 전환율 라벨
function PipelineBar({ stages, conversionRates = [] }) {
  const maxAmount = Math.max(...stages.map(s => s.amount))
  return (
    <div className="flex flex-col">
      {stages.map((s, i) => {
        const cr = conversionRates[i] // stage[i] → stage[i+1] 전환율
        const isBottleneck = cr && cr.rate < CONVERSION_BOTTLENECK_PCT
        return (
          <div key={i}>
            <div className="flex items-center gap-3 py-1">
              <span className="w-20 shrink-0 text-xs text-gray-500 dark:text-gray-400 text-right">{s.stage}</span>
              <div className="flex-1 bg-gray-100 dark:bg-gray-700 rounded-full h-2">
                <div
                  className="h-2 rounded-full bg-amber-400"
                  style={{ width: `${(s.amount / maxAmount) * 100}%` }}
                />
              </div>
              <span className="w-14 shrink-0 text-xs text-gray-600 dark:text-gray-400 text-right">{formatWon(s.amount)}</span>
              <span className="w-10 shrink-0 text-xs text-gray-400 text-right">{s.count}건</span>
            </div>
            {cr && (
              <div className="flex items-center gap-3 py-0.5">
                <span className="w-20 shrink-0" />
                <div className="flex-1 flex items-center gap-1.5 pl-1">
                  <svg className={`w-3 h-3 ${isBottleneck ? 'text-red-500' : 'text-gray-300 dark:text-gray-600'}`}
                    fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                  </svg>
                  <span className={`text-[11px] font-medium ${
                    isBottleneck
                      ? 'text-red-600 dark:text-red-400'
                      : 'text-gray-400 dark:text-gray-500'
                  }`}>
                    전환율 {cr.rate}%
                    {isBottleneck && <span className="ml-1">· 병목</span>}
                  </span>
                </div>
                <span className="w-14 shrink-0" />
                <span className="w-10 shrink-0" />
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

export default function PerformancePage() {
  const [period,    setPeriod]    = useState('이번 달')
  const [memberId,  setMemberId]  = useState('all')
  const [members,   setMembers]   = useState([])

  const [loading,   setLoading]   = useState(false)
  const [error,     setError]     = useState(null)
  const [result,    setResult]    = useState(null)

  // 팀원 목록 로드
  useEffect(() => {
    getTeamMembers().then(setMembers).catch(() => {})
  }, [])

  async function handleAnalyze() {
    setLoading(true)
    setError(null)
    setResult(null)
    try {
      const data = await analyzePerformance({ period, member_id: memberId })
      setResult(data)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  const achievementColor = result
    ? result.metrics.achievement_rate >= 100
      ? 'text-green-600 dark:text-green-400'
      : result.metrics.achievement_rate >= 70
        ? 'text-amber-600 dark:text-amber-400'
        : 'text-red-600 dark:text-red-400'
    : ''

  return (
    <div>
      <Breadcrumb
        crumbs={[
          { label: '사업 및 영업', to: '/frontoffice' },
          { label: '영업/영업관리팀', to: '/frontoffice/sales' },
          { label: '영업 실적 분석' },
        ]}
      />

      {/* 헤더 */}
      <div className="mt-4 mb-6 rounded-xl border p-5 bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-amber-500 text-white shrink-0">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-400">
              Front-Office · 영업/영업관리팀
            </span>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white leading-tight">
              영업 실적 분석
            </h1>
          </div>
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
          CRM 데이터를 자동 분석하여 실적 리포트·파이프라인 인사이트·이상 감지·팀장 보고 요약을 생성합니다.
        </p>
      </div>

      {/* 분석 옵션 */}
      <div className="rounded-xl border border-gray-200 dark:border-gray-700 p-5 mb-5">
        <h3 className="text-sm font-semibold text-gray-800 dark:text-white mb-4">분석 조건 설정</h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* 기간 선택 */}
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">분석 기간</label>
            <div className="flex gap-2">
              {PERIOD_OPTIONS.map(p => (
                <button
                  key={p}
                  onClick={() => setPeriod(p)}
                  className={`flex-1 min-h-[44px] text-sm font-medium rounded-xl border transition-colors ${
                    period === p
                      ? 'border-amber-400 bg-amber-500 text-white'
                      : 'border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:border-amber-300'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          {/* 팀원 선택 */}
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">팀원</label>
            <select
              value={memberId}
              onChange={e => setMemberId(e.target.value)}
              className="w-full text-sm rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white px-4 py-2.5 min-h-[44px] focus:outline-none focus:ring-2 focus:ring-amber-400"
            >
              {members.map(m => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* 분석 버튼 */}
      <button
        onClick={handleAnalyze}
        disabled={loading}
        className="w-full min-h-[44px] rounded-xl bg-amber-500 hover:bg-amber-600
          disabled:bg-gray-300 dark:disabled:bg-gray-700
          text-white text-sm font-semibold transition-colors mb-6
          flex items-center justify-center gap-2"
      >
        {loading ? <><Spinner />분석 중...</> : '실적 분석 리포트 생성'}
      </button>

      <ErrorBanner message={error} />

      {/* 빈 상태 */}
      {!result && !loading && !error && (
        <div className="rounded-xl border border-dashed border-gray-200 dark:border-gray-700 p-12 text-center">
          <svg className="w-10 h-10 mx-auto mb-3 text-gray-300 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          <p className="text-sm text-gray-400">분석 조건을 설정하고 버튼을 누르면<br />실적 리포트가 여기에 표시됩니다.</p>
        </div>
      )}

      {/* 로딩 */}
      {loading && (
        <div className="rounded-xl border border-gray-200 dark:border-gray-700 p-12 flex flex-col items-center gap-3">
          <Spinner className="w-6 h-6 text-amber-500" />
          <p className="text-sm text-gray-400">CRM 데이터를 분석하여 리포트를 작성하는 중...</p>
        </div>
      )}

      {/* 결과 */}
      {result && (
        <div className="flex flex-col gap-5">
          {/* 핵심 지표 카드 */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: '실제 매출',     value: formatWon(result.metrics.actual_revenue),  sub: `목표 ${formatWon(result.metrics.target_revenue)}` },
              { label: '목표 달성률',   value: `${result.metrics.achievement_rate}%`,      sub: result.metrics.growth_rate >= 0 ? `전기 대비 +${result.metrics.growth_rate}%` : `전기 대비 ${result.metrics.growth_rate}%` },
              { label: '수주 건수',     value: `${result.metrics.win_count}건`,            sub: `진행 중 ${result.metrics.deal_count}건` },
              { label: '수주율',        value: `${result.metrics.win_rate}%`,              sub: '수주/전체 딜' },
            ].map((card, i) => (
              <div key={i} className="rounded-xl border border-gray-200 dark:border-gray-700 p-4">
                <p className="text-xs text-gray-400 dark:text-gray-500 mb-1">{card.label}</p>
                <p className={`text-xl font-bold ${i === 1 ? achievementColor : 'text-gray-900 dark:text-white'}`}>{card.value}</p>
                <p className="text-xs text-gray-400 mt-0.5">{card.sub}</p>
              </div>
            ))}
          </div>

          {/* 팀장 보고 3줄 요약 */}
          <div className="rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/20 p-5">
            <p className="text-xs font-semibold text-amber-600 dark:text-amber-400 mb-2">팀장 보고 요약</p>
            <pre className="text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap leading-relaxed">{result.summary}</pre>
          </div>

          {/* 이상 감지 (규칙 기반 선감지 + LLM 원인 추정) */}
          {result.anomalies?.length > 0 && (
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">이상 감지</p>
                <span className="text-[10px] text-gray-400">규칙 기반 감지 · AI 원인 추정</span>
              </div>
              {result.anomalies.map((a, i) => (
                <div key={i} className={`rounded-xl border px-4 py-3 ${ANOMALY_COLOR[a.type] ?? ANOMALY_COLOR['주의']}`}>
                  <div className="flex items-start gap-3">
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-white/60 dark:bg-black/30 shrink-0">{a.type}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-semibold">{a.item}</p>
                        {a.severity && (
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                            a.severity === '높음'
                              ? 'bg-red-600 text-white'
                              : 'bg-gray-500/70 text-white'
                          }`}>
                            {a.severity}
                          </span>
                        )}
                      </div>
                      <p className="text-xs mt-0.5 opacity-80">{a.detail}</p>
                      {a.cause && (
                        <p className="text-xs mt-2 pt-2 border-t border-current/20 opacity-90">
                          <span className="font-semibold">원인 추정 · </span>{a.cause}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* 파이프라인 */}
          <div className="rounded-xl border border-gray-200 dark:border-gray-700 p-5">
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4">파이프라인 현황</p>
            <PipelineBar stages={result.pipeline} conversionRates={result.conversion_rates} />
            <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
              {result.pipeline_insight}
            </p>
          </div>

          {/* 팀원별 실적 */}
          {result.members?.length > 0 && (
            <div className="rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
              <div className="px-5 py-3 bg-gray-50 dark:bg-gray-800/50 border-b border-gray-100 dark:border-gray-700">
                <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">팀원별 실적</p>
              </div>
              <div className="divide-y divide-gray-100 dark:divide-gray-700">
                {result.members.map((m, i) => (
                  <div key={i} className="flex items-center justify-between px-5 py-3">
                    <span className="text-sm font-medium text-gray-800 dark:text-white w-32">{m.name}</span>
                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        <p className="text-xs text-gray-400">매출</p>
                        <p className="text-sm font-semibold text-gray-800 dark:text-white">{formatWon(m.revenue)}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-400">수주</p>
                        <p className="text-sm font-semibold text-gray-800 dark:text-white">{m.wins}건</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-400">진행</p>
                        <p className="text-sm font-semibold text-gray-800 dark:text-white">{m.deals}건</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* AI 인사이트 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* 최고 실적 */}
            <div className="rounded-xl border border-gray-200 dark:border-gray-700 p-4">
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">최고 실적</p>
              <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{result.top_performer}</p>
            </div>

            {/* 리스크 딜 */}
            <div className="rounded-xl border border-gray-200 dark:border-gray-700 p-4">
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">리스크 딜 분석</p>
              <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{result.risk_deals}</p>
            </div>
          </div>

          {/* 액션 추천 */}
          {result.recommendations?.length > 0 && (
            <div className="rounded-xl border border-gray-200 dark:border-gray-700 p-5">
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">AI 액션 추천</p>
              <ul className="flex flex-col gap-2">
                {result.recommendations.map((r, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-sm text-gray-700 dark:text-gray-300">
                    <span className="w-5 h-5 rounded-full bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">{i + 1}</span>
                    {r}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
