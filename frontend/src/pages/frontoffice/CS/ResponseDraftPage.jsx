// 응답 초안 자동 생성 페이지
import { useState } from 'react'
import Breadcrumb from '../../../components/layout/Breadcrumb'

const INQUIRY_TYPES = ['배송', '환불', '기술', '기타']
const TONE_OPTIONS  = [
  { value: 'formal',   label: '공식체' },
  { value: 'friendly', label: '친근체' },
]

// ── 공통 컴포넌트 ────────────────────────────────────────────

function Spinner() {
  return (
    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
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

function TypeBadge({ type }) {
  const colorMap = {
    배송: 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300',
    환불: 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300',
    기술: 'bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300',
    기타: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
  }
  return (
    <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${colorMap[type] ?? colorMap['기타']}`}>
      {type}
    </span>
  )
}

// ── 메인 페이지 ──────────────────────────────────────────────

export default function ResponseDraftPage() {
  const [inquiry,    setInquiry]    = useState('')
  const [orderNo,    setOrderNo]    = useState('')
  const [tone,       setTone]       = useState('formal')
  const [loading,    setLoading]    = useState(false)
  const [error,      setError]      = useState(null)
  const [result,     setResult]     = useState(null)
  // result = { type, draft, escalation: { needed, reason } }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!inquiry.trim()) return
    setLoading(true)
    setError(null)
    setResult(null)
    try {
      // TODO: API 연동 — POST /api/cs/response/draft
      // const data = await generateResponseDraft({ inquiry, order_no: orderNo, tone })
      // setResult(data)
      throw new Error('백엔드 API가 아직 연결되지 않았습니다.')
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  function handleCopy() {
    if (result?.draft) navigator.clipboard.writeText(result.draft)
  }

  return (
    <div>
      <Breadcrumb
        crumbs={[
          { label: '사업 및 영업', to: '/frontoffice' },
          { label: 'CS/고객지원팀', to: '/frontoffice/cs' },
          { label: '응답 초안 자동 생성' },
        ]}
      />

      {/* 헤더 */}
      <div className="mt-4 mb-6 rounded-xl border p-5 bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-amber-500 text-white shrink-0">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>
          </div>
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-400">
              Front-Office · CS/고객지원팀
            </span>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white leading-tight">
              응답 초안 자동 생성
            </h1>
          </div>
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
          고객 문의를 입력하면 유형을 자동 분류하고 정책 기반 응답 초안을 생성합니다.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 입력 폼 */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">
              고객 문의 원문 <span className="text-red-500">*</span>
            </label>
            <textarea
              value={inquiry}
              onChange={e => setInquiry(e.target.value)}
              rows={6}
              placeholder="고객 문의 내용을 붙여넣으세요. (이메일, 채팅, 전화 메모 등)"
              className="w-full rounded-xl border border-gray-200 dark:border-gray-600
                bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm
                px-4 py-3 resize-none focus:outline-none focus:ring-2 focus:ring-amber-400
                placeholder:text-gray-400"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">
                주문번호 (선택)
              </label>
              <input
                type="text"
                value={orderNo}
                onChange={e => setOrderNo(e.target.value)}
                placeholder="예: ORD-20260410-001"
                className="w-full rounded-xl border border-gray-200 dark:border-gray-600
                  bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm
                  px-4 py-2.5 min-h-[44px] focus:outline-none focus:ring-2 focus:ring-amber-400
                  placeholder:text-gray-400"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">
                어조 설정
              </label>
              <div className="flex gap-2">
                {TONE_OPTIONS.map(opt => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setTone(opt.value)}
                    className={[
                      'flex-1 min-h-[44px] rounded-xl border text-sm font-medium transition-colors',
                      tone === opt.value
                        ? 'bg-amber-500 border-amber-500 text-white'
                        : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:border-amber-300',
                    ].join(' ')}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={!inquiry.trim() || loading}
            className="min-h-[44px] rounded-xl bg-amber-500 hover:bg-amber-600
              disabled:bg-gray-300 dark:disabled:bg-gray-700
              text-white text-sm font-semibold transition-colors
              flex items-center justify-center gap-2"
          >
            {loading ? <><Spinner />초안 생성 중...</> : '응답 초안 생성'}
          </button>
        </form>

        {/* 결과 영역 */}
        <div className="flex flex-col gap-4">
          <ErrorBanner message={error} />

          {/* 빈 상태 */}
          {!result && !loading && !error && (
            <div className="rounded-xl border border-dashed border-gray-200 dark:border-gray-700 p-10 text-center h-full flex flex-col items-center justify-center gap-2">
              <svg className="w-10 h-10 text-gray-300 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
              <p className="text-sm text-gray-400">고객 문의를 입력하고 생성 버튼을 누르면<br />응답 초안이 여기에 표시됩니다.</p>
            </div>
          )}

          {/* 로딩 */}
          {loading && (
            <div className="rounded-xl border border-gray-200 dark:border-gray-700 p-10 flex flex-col items-center justify-center gap-3 h-full">
              <Spinner />
              <p className="text-sm text-gray-400">문의를 분석하고 초안을 생성하는 중...</p>
            </div>
          )}

          {/* 결과 */}
          {result && (
            <div className="flex flex-col gap-3">
              {/* 유형 태그 + 에스컬레이션 */}
              <div className="flex items-center gap-2 flex-wrap">
                <TypeBadge type={result.type} />
                {result.escalation?.needed && (
                  <span className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-semibold bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    에스컬레이션 필요
                  </span>
                )}
              </div>

              {/* 에스컬레이션 사유 */}
              {result.escalation?.needed && result.escalation?.reason && (
                <div className="rounded-xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/30 px-4 py-3">
                  <p className="text-xs text-red-700 dark:text-red-300">
                    <span className="font-semibold">에스컬레이션 사유: </span>
                    {result.escalation.reason}
                  </p>
                </div>
              )}

              {/* 초안 */}
              <div className="rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                  <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">응답 초안</span>
                  <button
                    onClick={handleCopy}
                    className="flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400 hover:underline min-h-[32px] px-2"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    복사
                  </button>
                </div>
                <textarea
                  value={result.draft}
                  onChange={e => setResult(prev => ({ ...prev, draft: e.target.value }))}
                  rows={8}
                  className="w-full px-4 py-3 text-sm text-gray-900 dark:text-white
                    bg-white dark:bg-gray-900 resize-none focus:outline-none"
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
