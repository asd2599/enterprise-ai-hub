// 기술 용어 번역기 페이지
import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import Breadcrumb from '../../../components/layout/Breadcrumb'
import {
  translateTechText,
  getGlossaryTerms,
  getGlossaryStats,
  patchTermPin,
  deleteTerm,
  getUsageStats,
} from '../../../api/dev'

// ── 상수 ─────────────────────────────────────────────────────────────────────

const AUDIENCE_OPTIONS = [
  { value: 'pm',      label: '기획자/PM',    desc: '기능 영향·일정 중심' },
  { value: 'exec',    label: '임원/경영진',   desc: '비즈니스 리스크·비용 중심' },
  { value: 'sales',   label: '영업팀',        desc: '고객 영향·서비스 가용성 중심' },
  { value: 'general', label: '일반 직원',     desc: '일상 비유로 가장 쉽게' },
]

const CATEGORY_STYLE = {
  인프라:   'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300',
  개발:     'bg-violet-100 text-violet-700 dark:bg-violet-900/50 dark:text-violet-300',
  보안:     'bg-rose-100 text-rose-700 dark:bg-rose-900/50 dark:text-rose-300',
  데이터:   'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300',
  운영:     'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300',
  네트워크: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/50 dark:text-cyan-300',
}

const EXAMPLES = [
  {
    label: '배포 장애',
    text: 'Kubernetes pod가 OOMKilled되면서 롤백을 진행했습니다. HPA 설정 이슈로 replica가 scale-out되지 않아 트래픽을 감당 못했고, 결국 CDN 캐시를 purge하고 nginx 설정을 핫픽스했습니다.',
  },
  {
    label: 'DB 이슈',
    text: '쿼리 플랜에서 full table scan이 발생하고 있으며 인덱스가 누락되어 레이턴시가 급등했습니다. 현재 read replica를 추가하고 슬로우 쿼리 로그를 분석 중입니다.',
  },
  {
    label: 'CI/CD 현황',
    text: '이번 스프린트에서 CI 파이프라인에 SAST를 붙이고, 스테이징 환경에 블루/그린 배포를 도입했습니다. PR 머지 전 E2E 테스트를 필수화하여 리그레션을 방지하겠습니다.',
  },
  {
    label: 'API 장애',
    text: 'REST API 엔드포인트에서 5xx 에러율이 15%를 넘었습니다. 서킷 브레이커가 오픈 상태로 전환되어 의존 서비스 호출을 차단 중이며, 레이트 리미팅을 강화했습니다.',
  },
]

// ── 서브컴포넌트: 번역기 탭 ──────────────────────────────────────────────────

function TranslatorTab() {
  const [text, setText] = useState('')
  const [audience, setAudience] = useState('general')
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [expanded, setExpanded] = useState(null)

  async function handleSubmit(e) {
    e.preventDefault()
    if (!text.trim()) return
    setLoading(true)
    setError('')
    setResult(null)
    setExpanded(null)
    try {
      const data = await translateTechText({ text, audience })
      setResult(data)
    } catch (err) {
      setError(err.message || '번역에 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  function handleReset() {
    setText('')
    setResult(null)
    setError('')
    setExpanded(null)
  }

  return (
    <div className="space-y-4">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="rounded-xl border border-emerald-200 bg-white p-6 dark:border-emerald-800 dark:bg-gray-900">
          {/* 예시 버튼 */}
          <label className="mb-2 block text-sm font-semibold text-gray-800 dark:text-gray-100">
            기술 텍스트
          </label>
          <div className="mb-3 flex flex-wrap gap-2">
            {EXAMPLES.map((ex) => (
              <button
                key={ex.label}
                type="button"
                onClick={() => setText(ex.text)}
                className="rounded-full border border-emerald-200 px-3 py-1 text-xs text-emerald-700 transition hover:bg-emerald-50 dark:border-emerald-700 dark:text-emerald-300 dark:hover:bg-emerald-950/40"
              >
                {ex.label}
              </button>
            ))}
          </div>

          <textarea
            rows={6}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={'번역할 기술적 내용을 입력하세요.\n예) Kubernetes pod가 OOMKilled되어 롤백했습니다. HPA 설정 이슈로 scale-out이 안 됐습니다.'}
            className="w-full rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 text-sm text-gray-800 outline-none transition focus:border-emerald-500 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-200"
          />

          {/* 독자 선택 */}
          <label className="mb-2 mt-5 block text-sm font-semibold text-gray-800 dark:text-gray-100">
            번역 대상 독자
          </label>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {AUDIENCE_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setAudience(opt.value)}
                className={`rounded-lg border px-3 py-2.5 text-left transition ${
                  audience === opt.value
                    ? 'border-emerald-500 bg-emerald-50 dark:border-emerald-500 dark:bg-emerald-950/40'
                    : 'border-gray-200 hover:border-emerald-300 dark:border-gray-700 dark:hover:border-emerald-700'
                }`}
              >
                <p className={`text-sm font-semibold ${audience === opt.value ? 'text-emerald-700 dark:text-emerald-300' : 'text-gray-800 dark:text-gray-100'}`}>
                  {opt.label}
                </p>
                <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">{opt.desc}</p>
              </button>
            ))}
          </div>

          <div className="mt-5 flex flex-wrap gap-3">
            <button
              type="submit"
              disabled={loading || !text.trim()}
              className="inline-flex h-11 items-center gap-2 rounded-lg bg-emerald-600 px-6 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-60"
            >
              {loading ? '번역 중 ...' : '번역하기'}
            </button>
            {result && (
              <button
                type="button"
                onClick={handleReset}
                className="inline-flex h-11 items-center rounded-lg border border-gray-300 px-5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
              >
                초기화
              </button>
            )}
          </div>
        </div>
      </form>

      {error && (
        <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-900 dark:bg-rose-950/30 dark:text-rose-300">
          {error}
        </div>
      )}

      {result && (
        <div className="space-y-4">
          {/* 번역 결과 */}
          <div className="rounded-xl border border-emerald-200 bg-white p-6 dark:border-emerald-800 dark:bg-gray-900">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-base font-semibold text-gray-900 dark:text-white">번역 결과</h2>
              <div className="flex items-center gap-2">
                {result.pinned_applied > 0 && (
                  <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">
                    고정 용어 {result.pinned_applied}개 적용
                  </span>
                )}
                <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-0.5 text-xs font-medium text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300">
                  {AUDIENCE_OPTIONS.find((o) => o.value === result.audience)?.label}
                </span>
              </div>
            </div>
            <p className="text-sm leading-relaxed text-gray-800 dark:text-gray-100">
              {result.translated}
            </p>
          </div>

          {/* 용어 사전 */}
          {result.terms?.length > 0 && (
            <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
              <h2 className="mb-4 text-base font-semibold text-gray-900 dark:text-white">
                감지된 용어
                <span className="ml-2 text-xs font-normal text-gray-400">({result.terms.length}개)</span>
              </h2>
              <div className="space-y-2">
                {result.terms.map((term, idx) => (
                  <div key={idx} className="overflow-hidden rounded-lg border border-gray-100 dark:border-gray-800">
                    <button
                      type="button"
                      onClick={() => setExpanded(expanded === idx ? null : idx)}
                      className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition hover:bg-gray-50 dark:hover:bg-gray-800"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold ${CATEGORY_STYLE[term.category] || CATEGORY_STYLE['개발']}`}>
                          {term.category}
                        </span>
                        <span className="truncate text-sm font-semibold text-gray-800 dark:text-gray-100">
                          {term.term}
                        </span>
                      </div>
                      <svg
                        className={`h-4 w-4 shrink-0 text-gray-400 transition-transform ${expanded === idx ? 'rotate-180' : ''}`}
                        fill="none" stroke="currentColor" viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    {expanded === idx && (
                      <div className="border-t border-gray-100 bg-gray-50 px-4 py-3 dark:border-gray-800 dark:bg-gray-950/40">
                        <p className="text-sm text-gray-700 dark:text-gray-300">{term.explanation}</p>
                        {term.analogy && (
                          <div className="mt-2 flex items-start gap-2">
                            <span className="mt-0.5 shrink-0 text-base">💡</span>
                            <p className="text-xs italic text-gray-500 dark:text-gray-400">{term.analogy}</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ── 서브컴포넌트: 사용 통계 탭 ───────────────────────────────────────────────

const AUDIENCE_COLORS = {
  general: 'bg-violet-500',
  pm:      'bg-blue-500',
  exec:    'bg-amber-500',
  sales:   'bg-emerald-500',
}

function StatsTab() {
  const [stats, setStats]   = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]   = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      setStats(await getUsageStats())
    } catch (err) {
      setError(err.message || '데이터를 불러오지 못했습니다.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  if (loading) return (
    <div className="flex items-center justify-center py-20 text-sm text-gray-400">불러오는 중 ...</div>
  )
  if (error) return (
    <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-900 dark:bg-rose-950/30 dark:text-rose-300">{error}</div>
  )
  if (!stats) return null

  const dailyMax = Math.max(...stats.daily.map((d) => d.count), 1)
  const categoryTotal = stats.categories.reduce((s, c) => s + c.count, 0) || 1

  return (
    <div className="space-y-5">

      {/* 요약 카드 */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: '전체 번역 횟수',   value: stats.total_count,            sub: '누적',     color: 'text-gray-900 dark:text-white' },
          { label: '오늘 번역 횟수',   value: stats.today_count,            sub: '오늘',     color: 'text-blue-600 dark:text-blue-400' },
          { label: '평균 감지 용어',   value: `${stats.avg_terms}개`,       sub: '번역당',   color: 'text-violet-600 dark:text-violet-400' },
          { label: '자동 고정 기준',   value: `${stats.pin_threshold}회`,   sub: '이상 시',  color: 'text-amber-600 dark:text-amber-400' },
        ].map((c) => (
          <div key={c.label} className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900">
            <p className="text-xs text-gray-500 dark:text-gray-400">{c.label}</p>
            <p className={`mt-1 text-2xl font-bold ${c.color}`}>{c.value}</p>
            <p className="mt-0.5 text-xs text-gray-400">{c.sub}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-5 lg:grid-cols-2">

        {/* 독자별 사용 현황 */}
        <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-900">
          <h3 className="mb-4 text-sm font-semibold text-gray-900 dark:text-white">독자별 사용 현황</h3>
          {stats.total_count === 0 ? (
            <p className="text-sm text-gray-400">번역 데이터가 없습니다.</p>
          ) : (
            <div className="space-y-3">
              {stats.audience.map((a) => (
                <div key={a.audience}>
                  <div className="mb-1 flex items-center justify-between text-xs">
                    <span className="font-medium text-gray-700 dark:text-gray-300">{a.label}</span>
                    <span className="text-gray-500">{a.count}회 ({a.pct}%)</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
                    <div
                      className={`h-2 rounded-full transition-all ${AUDIENCE_COLORS[a.audience] || 'bg-gray-400'}`}
                      style={{ width: `${a.pct}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 카테고리별 용어 분포 */}
        <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-900">
          <h3 className="mb-4 text-sm font-semibold text-gray-900 dark:text-white">카테고리별 용어 분포</h3>
          {stats.categories.length === 0 ? (
            <p className="text-sm text-gray-400">용어 데이터가 없습니다.</p>
          ) : (
            <div className="space-y-3">
              {stats.categories.map((c) => {
                const pct = Math.round(c.count / categoryTotal * 100)
                const barColor = CATEGORY_STYLE[c.category]?.split(' ')[0] || 'bg-gray-300'
                return (
                  <div key={c.category}>
                    <div className="mb-1 flex items-center justify-between text-xs">
                      <span className={`font-medium ${CATEGORY_STYLE[c.category]?.split(' ').filter(s => s.startsWith('text-')).join(' ') || 'text-gray-700 dark:text-gray-300'}`}>
                        {c.category}
                      </span>
                      <span className="text-gray-500">{c.count}개 ({pct}%)</span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
                      <div
                        className={`h-2 rounded-full transition-all ${barColor}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* 14일 일별 추이 */}
      <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-900">
        <h3 className="mb-4 text-sm font-semibold text-gray-900 dark:text-white">최근 14일 번역 추이</h3>
        {stats.total_count === 0 ? (
          <p className="text-sm text-gray-400">번역 데이터가 없습니다.</p>
        ) : (
          <div className="flex items-end gap-1 overflow-x-auto pb-1" style={{ minHeight: '80px' }}>
            {stats.daily.map((d) => {
              const heightPct = dailyMax > 0 ? Math.max(Math.round(d.count / dailyMax * 100), d.count > 0 ? 8 : 0) : 0
              const isToday = d.label === stats.daily[stats.daily.length - 1].label
              return (
                <div key={d.label} className="group relative flex flex-1 flex-col items-center gap-1">
                  {/* 막대 */}
                  <div className="flex w-full flex-col items-center justify-end" style={{ height: '64px' }}>
                    <div
                      className={`w-full max-w-[28px] rounded-t transition-all ${
                        isToday ? 'bg-emerald-500' : 'bg-emerald-200 dark:bg-emerald-900'
                      }`}
                      style={{ height: `${heightPct}%`, minHeight: d.count > 0 ? '4px' : '0' }}
                    />
                  </div>
                  {/* 날짜 레이블 */}
                  <span className="text-[10px] text-gray-400 dark:text-gray-500">{d.label}</span>
                  {/* 툴팁 */}
                  {d.count > 0 && (
                    <div className="pointer-events-none absolute -top-7 left-1/2 -translate-x-1/2 rounded bg-gray-900 px-1.5 py-0.5 text-[10px] font-medium text-white opacity-0 transition group-hover:opacity-100 dark:bg-gray-700">
                      {d.count}회
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* 상위 용어 Top 10 */}
      <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-900">
        <h3 className="mb-4 text-sm font-semibold text-gray-900 dark:text-white">
          인기 용어 Top 10
        </h3>
        {stats.top_terms.length === 0 ? (
          <p className="text-sm text-gray-400">용어 데이터가 없습니다.</p>
        ) : (
          <div className="space-y-2">
            {stats.top_terms.map((t, i) => {
              const barPct = Math.round(t.search_count / stats.top_terms[0].search_count * 100)
              const isPinned = t.is_pinned || t.auto_pinned
              return (
                <div key={t.term} className="flex items-center gap-3">
                  <span className="w-5 shrink-0 text-right text-xs font-bold text-gray-400">
                    {i + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="mb-1 flex items-center gap-2">
                      <span className="truncate text-sm font-medium text-gray-800 dark:text-gray-100">
                        {t.term}
                      </span>
                      <span className={`shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${CATEGORY_STYLE[t.category] || CATEGORY_STYLE['개발']}`}>
                        {t.category}
                      </span>
                      {isPinned && (
                        <span className="shrink-0 rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-medium text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">
                          고정
                        </span>
                      )}
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
                      <div
                        className="h-1.5 rounded-full bg-emerald-400 transition-all dark:bg-emerald-600"
                        style={{ width: `${barPct}%` }}
                      />
                    </div>
                  </div>
                  <span className="shrink-0 text-xs font-semibold text-gray-600 dark:text-gray-400">
                    {t.search_count}회
                  </span>
                </div>
              )
            })}
          </div>
        )}
      </div>

      <div className="flex justify-end">
        <button
          onClick={load}
          className="flex items-center gap-1.5 rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-600 transition hover:bg-gray-50 dark:border-gray-600 dark:text-gray-400 dark:hover:bg-gray-800"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          새로고침
        </button>
      </div>
    </div>
  )
}

// ── 서브컴포넌트: 용어집 관리 탭 ─────────────────────────────────────────────

function GlossaryTab() {
  const [terms, setTerms] = useState([])
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [pinnedOnly, setPinnedOnly] = useState(false)
  const [deleting, setDeleting] = useState(null)
  const [togglingPin, setTogglingPin] = useState(null)

  const loadData = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const [termsData, statsData] = await Promise.all([
        getGlossaryTerms(pinnedOnly),
        getGlossaryStats(),
      ])
      setTerms(termsData)
      setStats(statsData)
    } catch (err) {
      setError(err.message || '데이터를 불러오지 못했습니다.')
    } finally {
      setLoading(false)
    }
  }, [pinnedOnly])

  useEffect(() => { loadData() }, [loadData])

  async function handleTogglePin(term) {
    setTogglingPin(term.id)
    try {
      const updated = await patchTermPin(term.id, !term.is_pinned)
      setTerms((prev) =>
        prev.map((t) => (t.id === term.id ? { ...t, is_pinned: updated.is_pinned } : t)),
      )
      // 통계 갱신
      const statsData = await getGlossaryStats()
      setStats(statsData)
    } catch (err) {
      setError(err.message || '핀 변경에 실패했습니다.')
    } finally {
      setTogglingPin(null)
    }
  }

  async function handleDelete(termId) {
    setDeleting(termId)
    try {
      await deleteTerm(termId)
      setTerms((prev) => prev.filter((t) => t.id !== termId))
      const statsData = await getGlossaryStats()
      setStats(statsData)
    } catch (err) {
      setError(err.message || '삭제에 실패했습니다.')
    } finally {
      setDeleting(null)
    }
  }

  return (
    <div className="space-y-4">
      {/* 통계 카드 */}
      {stats && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: '전체 용어', value: stats.total, color: 'text-gray-800 dark:text-white' },
            { label: '고정 용어집', value: stats.pinned_total, color: 'text-amber-600 dark:text-amber-400' },
            { label: '자동 고정', value: stats.auto_pinned, color: 'text-emerald-600 dark:text-emerald-400' },
            { label: '자동 고정 기준', value: `${stats.pin_threshold}회 이상`, color: 'text-violet-600 dark:text-violet-400' },
          ].map((stat) => (
            <div key={stat.label} className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900">
              <p className="text-xs text-gray-500 dark:text-gray-400">{stat.label}</p>
              <p className={`mt-1 text-xl font-bold ${stat.color}`}>{stat.value}</p>
            </div>
          ))}
        </div>
      )}

      {/* 필터 + 새로고침 */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-2">
          <button
            onClick={() => setPinnedOnly(false)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
              !pinnedOnly
                ? 'bg-emerald-600 text-white'
                : 'border border-gray-300 text-gray-600 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800'
            }`}
          >
            전체
          </button>
          <button
            onClick={() => setPinnedOnly(true)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
              pinnedOnly
                ? 'bg-emerald-600 text-white'
                : 'border border-gray-300 text-gray-600 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800'
            }`}
          >
            고정 용어집만
          </button>
        </div>
        <button
          onClick={loadData}
          className="flex items-center gap-1.5 rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-600 transition hover:bg-gray-50 dark:border-gray-600 dark:text-gray-400 dark:hover:bg-gray-800"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          새로고침
        </button>
      </div>

      {error && (
        <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-900 dark:bg-rose-950/30 dark:text-rose-300">
          {error}
        </div>
      )}

      {/* 로딩 */}
      {loading && (
        <div className="flex items-center justify-center py-16 text-sm text-gray-400">
          불러오는 중 ...
        </div>
      )}

      {/* 빈 상태 */}
      {!loading && terms.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-200 py-16 dark:border-gray-700">
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
            {pinnedOnly ? '고정된 용어가 없습니다.' : '번역기를 사용하면 용어가 자동으로 쌓입니다.'}
          </p>
          {pinnedOnly && (
            <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
              검색 횟수가 {stats?.pin_threshold ?? 3}회 이상이면 자동 고정됩니다.
            </p>
          )}
        </div>
      )}

      {/* 용어 목록 */}
      {!loading && terms.length > 0 && (
        <div className="overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50 text-left text-xs font-semibold text-gray-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400">
                <th className="px-4 py-3">용어</th>
                <th className="px-4 py-3">카테고리</th>
                <th className="hidden px-4 py-3 sm:table-cell">설명</th>
                <th className="px-4 py-3 text-center">검색 횟수</th>
                <th className="px-4 py-3 text-center">상태</th>
                <th className="px-4 py-3 text-center">관리</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {terms.map((term) => {
                const isPinned = term.is_pinned || term.auto_pinned
                return (
                  <tr
                    key={term.id}
                    className={`transition hover:bg-gray-50 dark:hover:bg-gray-800/50 ${
                      isPinned ? 'bg-amber-50/30 dark:bg-amber-950/10' : ''
                    }`}
                  >
                    <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">
                      {term.term}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${CATEGORY_STYLE[term.category] || CATEGORY_STYLE['개발']}`}>
                        {term.category}
                      </span>
                    </td>
                    <td className="hidden max-w-xs truncate px-4 py-3 text-xs text-gray-500 dark:text-gray-400 sm:table-cell">
                      {term.explanation}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`text-sm font-bold ${
                        term.search_count >= (stats?.pin_threshold ?? 3)
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : 'text-gray-700 dark:text-gray-300'
                      }`}>
                        {term.search_count}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        {term.auto_pinned && (
                          <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
                            자동
                          </span>
                        )}
                        {term.is_pinned && (
                          <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">
                            수동
                          </span>
                        )}
                        {!term.auto_pinned && !term.is_pinned && (
                          <span className="text-xs text-gray-400">—</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-2">
                        {/* 핀 토글 */}
                        <button
                          onClick={() => handleTogglePin(term)}
                          disabled={togglingPin === term.id}
                          title={term.is_pinned ? '수동 고정 해제' : '수동 고정'}
                          className={`rounded p-1.5 transition ${
                            term.is_pinned
                              ? 'text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-950/30'
                              : 'text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                          } disabled:opacity-40`}
                        >
                          <svg className="h-4 w-4" fill={term.is_pinned ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                          </svg>
                        </button>
                        {/* 삭제 */}
                        <button
                          onClick={() => handleDelete(term.id)}
                          disabled={deleting === term.id}
                          title="삭제"
                          className="rounded p-1.5 text-gray-400 transition hover:bg-rose-50 hover:text-rose-500 disabled:opacity-40 dark:hover:bg-rose-950/30 dark:hover:text-rose-400"
                        >
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* 범례 */}
      {!loading && terms.length > 0 && (
        <p className="text-xs text-gray-400 dark:text-gray-500">
          검색 횟수가 <span className="font-semibold text-emerald-600 dark:text-emerald-400">{stats?.pin_threshold ?? 3}회</span> 이상이면 자동 고정됩니다.
          수동 고정은 북마크 아이콘으로 직접 지정할 수 있습니다.
          고정된 용어는 다음 번역 시 프롬프트에 자동으로 주입됩니다.
        </p>
      )}
    </div>
  )
}

// ── 메인 페이지 ───────────────────────────────────────────────────────────────

export default function TechTranslate() {
  const [tab, setTab] = useState('translator')

  return (
    <div>
      <Breadcrumb
        crumbs={[
          { label: '기술 및 서비스', to: '/rnd' },
          { label: '개발/IT운영팀', to: '/rnd/dev' },
          { label: '기술 용어 번역기' },
        ]}
      />

      <div className="mt-4 space-y-6">
        <Link
          to="/rnd/dev"
          className="inline-flex items-center gap-1.5 text-sm text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          개발/IT운영팀
        </Link>

        {/* 헤더 */}
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-6 dark:border-emerald-800 dark:bg-emerald-950/30">
          <span className="text-xs font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
            Tech Term Translator
          </span>
          <h1 className="mt-1 text-xl font-bold text-gray-900 dark:text-white">
            기술 용어 번역기
          </h1>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
            개발자 언어를 기획자·임원·영업팀이 이해할 수 있는 비즈니스 언어로 번역합니다.
            자주 검색된 용어는 자동으로 용어집에 등록되어 번역 품질을 높입니다.
          </p>
        </div>

        {/* 탭 */}
        <div className="flex gap-1 rounded-lg border border-gray-200 bg-gray-50 p-1 dark:border-gray-700 dark:bg-gray-800">
          {[
            { key: 'translator', label: '번역기' },
            { key: 'glossary',   label: '용어집 관리' },
            { key: 'stats',      label: '사용 통계' },
          ].map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex-1 rounded-md py-2 text-sm font-medium transition ${
                tab === t.key
                  ? 'bg-white text-gray-900 shadow-sm dark:bg-gray-900 dark:text-white'
                  : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* 탭 컨텐츠 */}
        {tab === 'translator' && <TranslatorTab />}
        {tab === 'glossary'   && <GlossaryTab />}
        {tab === 'stats'      && <StatsTab />}
      </div>
    </div>
  )
}
