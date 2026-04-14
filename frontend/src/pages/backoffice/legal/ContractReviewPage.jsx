// 계약 검토 페이지 — 계약서 PDF/텍스트 업로드 → AI 리스크 조항 탐지 및 요약
import { useState, useRef, useCallback } from 'react'
import Breadcrumb from '../../../components/layout/Breadcrumb'

// ── 위험도 설정 ───────────────────────────────────────────────
const RISK = {
  danger: {
    label:    'Danger',
    badge:    'bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300',
    border:   'border-red-200 dark:border-red-800',
    dot:      'bg-red-500',
    bg:       'bg-red-50 dark:bg-red-900/20',
    text:     'text-red-700 dark:text-red-300',
  },
  warning: {
    label:    'Warning',
    badge:    'bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300',
    border:   'border-amber-200 dark:border-amber-800',
    dot:      'bg-amber-400',
    bg:       'bg-amber-50 dark:bg-amber-900/20',
    text:     'text-amber-700 dark:text-amber-300',
  },
  safe: {
    label:    'Safe',
    badge:    'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300',
    border:   'border-gray-200 dark:border-gray-700',
    dot:      'bg-emerald-500',
    bg:       'bg-emerald-50 dark:bg-emerald-900/20',
    text:     'text-emerald-700 dark:text-emerald-300',
  },
}

const ALLOWED_TYPES = ['application/pdf', 'text/plain']
const ALLOWED_EXT   = ['.pdf', '.txt']

// 로딩 스피너
function Spinner({ size = 4 }) {
  return (
    <svg className={`w-${size} h-${size} animate-spin`} fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
    </svg>
  )
}

// 위험도 배지
function RiskBadge({ level }) {
  const r = RISK[level] || RISK.safe
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-semibold ${r.badge}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${r.dot}`} />
      {r.label}
    </span>
  )
}

// 조항 분석 카드
function ClauseCard({ clause, expanded, onToggle }) {
  const r = RISK[clause.risk_level] || RISK.safe
  return (
    <div className={`rounded-xl border transition-all ${r.border} bg-white dark:bg-gray-900 overflow-hidden`}>
      <button
        className="w-full text-left px-5 py-4 flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors min-h-[56px]"
        onClick={onToggle}
      >
        <RiskBadge level={clause.risk_level} />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{clause.title}</p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{clause.article || ''}</p>
        </div>
        <svg
          className={`w-4 h-4 text-gray-400 shrink-0 transition-transform duration-200 ${expanded ? 'rotate-90' : ''}`}
          fill="none" stroke="currentColor" viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </button>

      {expanded && (
        <div className="px-5 pb-5 border-t border-gray-100 dark:border-gray-800">
          {/* 원문 */}
          <div className="mt-4 rounded-lg bg-gray-50 dark:bg-gray-800 p-4">
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5">원문</p>
            <p className="text-sm text-gray-700 dark:text-gray-200 leading-relaxed whitespace-pre-wrap">
              {clause.original_text}
            </p>
          </div>
          {/* AI 분석 */}
          <div className={`mt-3 rounded-lg p-4 ${r.bg}`}>
            <p className={`text-xs font-semibold mb-1.5 ${r.text}`}>AI 분석</p>
            <p className="text-sm text-gray-800 dark:text-gray-100 leading-relaxed">{clause.ai_comment}</p>
          </div>
          {/* 수정 제안 */}
          {clause.suggestion && (
            <div className="mt-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 p-4">
              <p className="text-xs font-semibold text-blue-600 dark:text-blue-400 mb-1.5">수정 제안</p>
              <p className="text-sm text-gray-800 dark:text-gray-100 leading-relaxed">{clause.suggestion}</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default function ContractReviewPage() {
  const [file,       setFile]       = useState(null)
  const [dragging,   setDragging]   = useState(false)
  const [loading,    setLoading]    = useState(false)
  const [error,      setError]      = useState(null)
  const [result,     setResult]     = useState(null)   // { summary, overall_risk, clauses[] }
  const [expandedId, setExpandedId] = useState(null)
  const inputRef = useRef(null)

  // ── 파일 선택/드롭 처리 ──────────────────────────────────────
  const handleFile = useCallback((f) => {
    if (!f) return
    if (!ALLOWED_TYPES.includes(f.type) && !ALLOWED_EXT.some(ext => f.name.endsWith(ext))) {
      setError('PDF 또는 텍스트(.txt) 파일만 업로드 가능합니다.')
      return
    }
    setFile(f)
    setError(null)
    setResult(null)
  }, [])

  const handleDrop = useCallback((e) => {
    e.preventDefault()
    setDragging(false)
    handleFile(e.dataTransfer.files[0])
  }, [handleFile])

  const handleDragOver = (e) => { e.preventDefault(); setDragging(true) }
  const handleDragLeave = () => setDragging(false)

  // ── AI 검토 실행 ──────────────────────────────────────────────
  const handleReview = async () => {
    if (!file) return
    setLoading(true)
    setError(null)
    setResult(null)
    try {
      // TODO: API 연동 — POST /api/legal/review (FormData)
      // const formData = new FormData()
      // formData.append('file', file)
      // const data = await reviewContract(formData)
      // setResult(data)

      // 플레이스홀더: 실제 API 연동 전 구조 확인용 목 데이터
      await new Promise(r => setTimeout(r, 1500))
      setResult({
        overall_risk: 'warning',
        summary: '계약서 전반적으로 2건의 Warning 조항이 발견되었습니다. 손해배상 한도 조항과 계약 해지 조항에서 을(乙) 측에 불리한 내용이 포함되어 있어 검토가 필요합니다.',
        clauses: [
          {
            id: 1,
            risk_level: 'danger',
            title: '손해배상 한도 무제한',
            article: '제 8조 제 2항',
            original_text: '을은 본 계약과 관련하여 발생한 모든 손해에 대해 무한 책임을 진다.',
            ai_comment: '손해배상 한도를 무제한으로 설정하는 조항은 을에게 과도한 위험을 부담시킵니다. 일반적인 계약 관행에서는 손해배상액을 계약 금액의 일정 배수로 제한합니다.',
            suggestion: '"을의 손해배상 책임은 본 계약에서 수령한 총 계약 금액을 초과하지 아니한다."로 수정을 권장합니다.',
          },
          {
            id: 2,
            risk_level: 'warning',
            title: '일방적 계약 해지권',
            article: '제 12조 제 1항',
            original_text: '갑은 사전 통보 없이 본 계약을 즉시 해지할 수 있다.',
            ai_comment: '사전 통보 없는 일방적 해지권은 을에게 불리합니다. 최소 30일 이상의 사전 통지 의무를 규정하는 것이 일반적입니다.',
            suggestion: '"갑이 계약을 해지하고자 할 경우 최소 30일 전에 서면으로 통보하여야 한다."로 수정을 권장합니다.',
          },
          {
            id: 3,
            risk_level: 'safe',
            title: '비밀유지 조항',
            article: '제 5조',
            original_text: '양 당사자는 본 계약 기간 및 종료 후 3년간 상대방의 영업 비밀을 제3자에게 공개하지 않는다.',
            ai_comment: '비밀유지 의무 기간(3년) 및 범위가 적절합니다. 양 당사자에게 균등하게 적용되는 표준적인 NDA 조항입니다.',
            suggestion: null,
          },
        ],
      })
    } catch (e) {
      setError(e.message || 'AI 검토 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const overallR = result ? (RISK[result.overall_risk] || RISK.safe) : null

  return (
    <div>
      <Breadcrumb
        crumbs={[
          { label: '경영지원 및 관리', to: '/backoffice' },
          { label: '법무/컴플라이언스팀', to: '/backoffice/legal' },
          { label: '계약 검토' },
        ]}
      />

      {/* 헤더 */}
      <div className="mt-4 mb-6 rounded-xl border p-5 bg-violet-50 dark:bg-violet-950/30 border-violet-200 dark:border-violet-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-violet-600 text-white text-xs font-bold shrink-0">
            검토
          </div>
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-violet-600 dark:text-violet-400">
              Back-Office · 법무/컴플라이언스팀
            </span>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white leading-tight">
              계약서 AI 검토
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
              PDF 또는 텍스트 파일을 업로드하면 AI가 리스크 조항을 자동으로 탐지하고 수정안을 제안합니다.
            </p>
          </div>
        </div>
      </div>

      {/* 에러 배너 */}
      {error && (
        <div className="mb-5 rounded-xl border border-red-200 bg-red-50 dark:bg-red-900/20 px-5 py-3">
          <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
        </div>
      )}

      {/* 파일 업로드 영역 */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => inputRef.current?.click()}
        className={[
          'mb-5 rounded-xl border-2 border-dashed transition-colors cursor-pointer',
          'flex flex-col items-center justify-center gap-3 py-12 px-6 text-center',
          dragging
            ? 'border-violet-400 bg-violet-50 dark:bg-violet-900/20'
            : 'border-gray-200 dark:border-gray-700 hover:border-violet-300 dark:hover:border-violet-700 bg-white dark:bg-gray-900',
        ].join(' ')}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,.txt"
          className="hidden"
          onChange={e => handleFile(e.target.files[0])}
        />
        <div className="w-12 h-12 rounded-full bg-violet-100 dark:bg-violet-900/40 flex items-center justify-center">
          <svg className="w-6 h-6 text-violet-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
        </div>
        {file ? (
          <div>
            <p className="text-sm font-medium text-violet-700 dark:text-violet-300">{file.name}</p>
            <p className="text-xs text-gray-400 mt-0.5">{(file.size / 1024).toFixed(1)} KB · 클릭하여 파일 변경</p>
          </div>
        ) : (
          <div>
            <p className="text-sm font-medium text-gray-700 dark:text-gray-200">
              계약서 파일을 드래그하거나 클릭하여 업로드
            </p>
            <p className="text-xs text-gray-400 mt-1">PDF, TXT 지원 · 최대 10MB</p>
          </div>
        )}
      </div>

      {/* AI 검토 버튼 */}
      <div className="flex justify-end mb-6">
        <button
          onClick={handleReview}
          disabled={!file || loading}
          className="flex items-center gap-2 px-6 py-2.5 text-sm font-medium bg-violet-600 text-white
            rounded-lg hover:bg-violet-700 disabled:opacity-50 min-h-[44px]"
        >
          {loading ? <><Spinner size={4} /> 분석 중...</> : '⚡ AI 검토 시작'}
        </button>
      </div>

      {/* 로딩 상태 */}
      {loading && (
        <div className="flex items-center justify-center py-16 gap-2 text-gray-400">
          <Spinner size={5} /> <span className="text-sm">계약서를 분석하는 중입니다...</span>
        </div>
      )}

      {/* 빈 상태 */}
      {!loading && !result && (
        <div className="rounded-xl border border-dashed border-gray-200 dark:border-gray-700 p-12 text-center">
          <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mx-auto mb-3">
            <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <p className="text-sm text-gray-400">계약서 파일을 업로드한 후 AI 검토 버튼을 눌러주세요.</p>
        </div>
      )}

      {/* 결과 영역 */}
      {!loading && result && (
        <div className="space-y-5">
          {/* 전체 리스크 요약 */}
          <div className={`rounded-xl border p-5 ${overallR.border}`}>
            <div className="flex items-center gap-3 mb-3">
              <RiskBadge level={result.overall_risk} />
              <h2 className="text-sm font-semibold text-gray-900 dark:text-white">전체 리스크 요약</h2>
            </div>
            <p className="text-sm text-gray-700 dark:text-gray-200 leading-relaxed">{result.summary}</p>

            {/* 조항 집계 배지 */}
            <div className="flex items-center gap-2 mt-4 flex-wrap">
              {['danger', 'warning', 'safe'].map(level => {
                const count = result.clauses.filter(c => c.risk_level === level).length
                if (count === 0) return null
                const r = RISK[level]
                return (
                  <span key={level} className={`text-xs px-2.5 py-1 rounded-full font-medium ${r.badge}`}>
                    {r.label} {count}건
                  </span>
                )
              })}
              <span className="text-xs text-gray-400 ml-1">총 {result.clauses.length}개 조항 분석</span>
            </div>
          </div>

          {/* 조항별 분석 테이블 */}
          <div>
            <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">조항별 분석</h2>
            <div className="space-y-3">
              {result.clauses
                .sort((a, b) => {
                  const order = { danger: 1, warning: 2, safe: 3 }
                  return order[a.risk_level] - order[b.risk_level]
                })
                .map(clause => (
                  <ClauseCard
                    key={clause.id}
                    clause={clause}
                    expanded={expandedId === clause.id}
                    onToggle={() => setExpandedId(expandedId === clause.id ? null : clause.id)}
                  />
                ))
              }
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
