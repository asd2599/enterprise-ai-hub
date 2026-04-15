// 장애 로그 분석 페이지
import { useState } from 'react'
import { Link } from 'react-router-dom'
import Breadcrumb from '../../../components/layout/Breadcrumb'
import { analyzeLog } from '../../../api/dev'

const SEVERITY_STYLE = {
  critical: 'bg-rose-100 text-rose-800 dark:bg-rose-900/60 dark:text-rose-200',
  high: 'bg-orange-100 text-orange-800 dark:bg-orange-900/60 dark:text-orange-200',
  medium: 'bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-200',
  low: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-200',
}
const SEVERITY_LABEL = { critical: 'Critical', high: 'High', medium: 'Medium', low: 'Low' }

const LOG_EXAMPLES = [
  'java.lang.NullPointerException',
  'FATAL: connection to server failed',
  'OOMKilled: Container exceeded memory limit',
]

export default function LogAnalysis() {
  const [logText, setLogText] = useState('')
  const [context, setContext] = useState('')
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    if (!logText.trim()) return

    setLoading(true)
    setError('')
    setResult(null)

    try {
      const data = await analyzeLog({ logText, context })
      setResult(data)
    } catch (err) {
      setError(err.message || '분석에 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  function handleReset() {
    setLogText('')
    setContext('')
    setResult(null)
    setError('')
  }

  const severity = result?.severity || 'medium'

  return (
    <div>
      <Breadcrumb
        crumbs={[
          { label: '기술 및 서비스', to: '/rnd' },
          { label: '개발/IT운영팀', to: '/rnd/dev' },
          { label: '장애 로그 분석' },
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
            Incident Log Analysis
          </span>
          <h1 className="mt-1 text-xl font-bold text-gray-900 dark:text-white">
            장애 로그 분석
          </h1>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
            에러 로그·스택트레이스를 붙여넣으면 근본 원인과 조치 방안을 분석합니다.
          </p>
        </div>

        {/* 입력 폼 */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="rounded-xl border border-emerald-200 bg-white p-6 dark:border-emerald-800 dark:bg-gray-900">
            <label className="mb-2 block text-sm font-semibold text-gray-800 dark:text-gray-100">
              에러 로그 / 스택트레이스
            </label>
            <div className="mb-3 flex flex-wrap gap-2">
              {LOG_EXAMPLES.map((ex) => (
                <button
                  key={ex}
                  type="button"
                  onClick={() => setLogText((prev) => (prev ? prev + '\n' + ex : ex))}
                  className="rounded-full border border-emerald-200 px-3 py-1 text-xs text-emerald-700 transition hover:bg-emerald-50 dark:border-emerald-700 dark:text-emerald-300 dark:hover:bg-emerald-950/40"
                >
                  {ex}
                </button>
              ))}
            </div>
            <textarea
              rows={10}
              value={logText}
              onChange={(e) => setLogText(e.target.value)}
              placeholder={'[2026-04-15 10:23:11] ERROR - java.lang.NullPointerException\n  at com.example.UserService.getUser(UserService.java:42)\n  at com.example.UserController.handleRequest(UserController.java:87)\n...'}
              className="w-full rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 font-mono text-xs text-gray-800 outline-none transition focus:border-emerald-500 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-200"
            />

            <label className="mb-1 mt-4 block text-sm font-semibold text-gray-800 dark:text-gray-100">
              추가 컨텍스트{' '}
              <span className="font-normal text-gray-400">(선택 — 서비스명, 환경, 최근 배포 내역 등)</span>
            </label>
            <input
              type="text"
              value={context}
              onChange={(e) => setContext(e.target.value)}
              placeholder="예: 결제 서비스 / 프로덕션 / 오늘 오전 배포 이후 발생"
              className="w-full rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 text-sm text-gray-800 outline-none transition focus:border-emerald-500 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-200"
            />

            <div className="mt-4 flex flex-wrap gap-3">
              <button
                type="submit"
                disabled={loading || !logText.trim()}
                className="inline-flex h-11 items-center gap-2 rounded-lg bg-emerald-600 px-6 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-60"
              >
                {loading ? '분석 중 ...' : '분석하기'}
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

        {/* 에러 */}
        {error && (
          <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-900 dark:bg-rose-950/30 dark:text-rose-300">
            {error}
          </div>
        )}

        {/* 결과 */}
        {result && (
          <div className="space-y-4">
            {/* 요약 + 심각도 */}
            <div className="rounded-xl border border-emerald-200 bg-white p-6 dark:border-emerald-800 dark:bg-gray-900">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-base font-semibold text-gray-900 dark:text-white">
                  분석 결과
                </h2>
                <span className={`rounded-full px-3 py-1 text-xs font-semibold ${SEVERITY_STYLE[severity]}`}>
                  {SEVERITY_LABEL[severity]} 심각도
                </span>
              </div>
              <p className="mt-3 text-sm font-medium text-gray-800 dark:text-gray-100">
                {result.summary}
              </p>
            </div>

            {/* 근본 원인 */}
            <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
              <h3 className="mb-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
                근본 원인
              </h3>
              <p className="text-sm leading-relaxed text-gray-700 dark:text-gray-300">
                {result.root_cause}
              </p>
              {result.related_components?.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {result.related_components.map((comp) => (
                    <span
                      key={comp}
                      className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs text-gray-600 dark:bg-gray-800 dark:text-gray-400"
                    >
                      {comp}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* 조치 방안 */}
            {result.actions?.length > 0 && (
              <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
                <h3 className="mb-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
                  조치 방안
                </h3>
                <ol className="space-y-4">
                  {result.actions.map((action) => (
                    <li key={action.step} className="flex gap-4">
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-xs font-bold text-emerald-700 dark:bg-emerald-900/60 dark:text-emerald-300">
                        {action.step}
                      </span>
                      <div>
                        <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">
                          {action.title}
                        </p>
                        <p className="mt-0.5 text-sm text-gray-600 dark:text-gray-400">
                          {action.description}
                        </p>
                      </div>
                    </li>
                  ))}
                </ol>
              </div>
            )}

            {/* 재발 방지 */}
            {result.prevention && (
              <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
                <h3 className="mb-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
                  재발 방지 방안
                </h3>
                <p className="text-sm leading-relaxed text-gray-700 dark:text-gray-300">
                  {result.prevention}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
