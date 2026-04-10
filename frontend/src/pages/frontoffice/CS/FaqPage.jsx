// FAQ 자동 생성·관리 페이지
import { useState } from 'react'
import Breadcrumb from '../../../components/layout/Breadcrumb'

const TABS = [
  { id: 'generate', label: 'FAQ 자동 생성' },
  { id: 'manage',   label: 'FAQ 관리' },
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

// ── 탭 1: FAQ 자동 생성 ──────────────────────────────────────

function GenerateTab() {
  const [file,      setFile]      = useState(null)
  const [topN,      setTopN]      = useState(10)
  const [loading,   setLoading]   = useState(false)
  const [error,     setError]     = useState(null)
  const [faqs,      setFaqs]      = useState([])
  // faqs = [{ category, question, answer }]

  async function handleGenerate() {
    if (!file) return
    setLoading(true)
    setError(null)
    setFaqs([])
    try {
      // TODO: API 연동 — POST /api/cs/faq/generate (FormData: file, top_n)
      throw new Error('백엔드 API가 아직 연결되지 않았습니다.')
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-5">
      {/* 파일 업로드 */}
      <div className="rounded-xl border border-gray-200 dark:border-gray-700 p-5">
        <h3 className="text-sm font-semibold text-gray-800 dark:text-white mb-3">문의 로그 업로드</h3>
        <div className="flex flex-col sm:flex-row gap-3 items-start">
          <label className="flex-1">
            <div className="flex items-center gap-3 min-h-[44px] px-4 py-2.5 rounded-xl border border-dashed border-gray-300 dark:border-gray-600 cursor-pointer hover:border-amber-400 transition-colors">
              <svg className="w-4 h-4 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {file ? file.name : 'CSV 파일 선택 (문의 로그)'}
              </span>
            </div>
            <input
              type="file"
              accept=".csv"
              className="hidden"
              onChange={e => setFile(e.target.files?.[0] ?? null)}
            />
          </label>
          <div className="flex items-center gap-2 shrink-0">
            <label className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">상위</label>
            <input
              type="number"
              value={topN}
              onChange={e => setTopN(Number(e.target.value))}
              min={1} max={50}
              className="w-16 text-sm rounded-xl border border-gray-200 dark:border-gray-600
                bg-white dark:bg-gray-800 text-gray-900 dark:text-white
                px-3 py-2 min-h-[44px] text-center focus:outline-none focus:ring-2 focus:ring-amber-400"
            />
            <label className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">개 생성</label>
          </div>
        </div>
      </div>

      <button
        onClick={handleGenerate}
        disabled={!file || loading}
        className="min-h-[44px] rounded-xl bg-amber-500 hover:bg-amber-600
          disabled:bg-gray-300 dark:disabled:bg-gray-700
          text-white text-sm font-semibold transition-colors
          flex items-center justify-center gap-2"
      >
        {loading ? <><Spinner />클러스터링 분석 중...</> : 'FAQ 자동 생성'}
      </button>

      <ErrorBanner message={error} />

      {/* 빈 상태 */}
      {!loading && !error && faqs.length === 0 && (
        <div className="rounded-xl border border-dashed border-gray-200 dark:border-gray-700 p-12 text-center">
          <p className="text-sm text-gray-400">문의 로그 CSV를 업로드하고 생성 버튼을 누르면<br />FAQ 초안이 여기에 표시됩니다.</p>
        </div>
      )}

      {/* FAQ 결과 */}
      {faqs.length > 0 && (
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-gray-800 dark:text-white">
              생성된 FAQ ({faqs.length}개)
            </span>
            <button className="text-xs text-amber-600 dark:text-amber-400 hover:underline min-h-[32px] px-2">
              전체 저장
            </button>
          </div>
          {faqs.map((faq, i) => (
            <div key={i} className="rounded-xl border border-gray-200 dark:border-gray-700 p-4">
              <div className="flex items-start gap-3 mb-2">
                <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 font-medium shrink-0 mt-0.5">
                  {faq.category}
                </span>
                <p className="text-sm font-semibold text-gray-900 dark:text-white">Q. {faq.question}</p>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed pl-1">A. {faq.answer}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── 탭 2: FAQ 관리 ───────────────────────────────────────────

function ManageTab() {
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState(null)
  const [faqs,    setFaqs]    = useState([])

  // TODO: useEffect — GET /api/cs/faq 로 기존 FAQ 로드

  return (
    <div>
      <ErrorBanner message={error} />

      {/* 빈 상태 */}
      {!loading && !error && faqs.length === 0 && (
        <div className="rounded-xl border border-dashed border-gray-200 dark:border-gray-700 p-12 text-center">
          <p className="text-sm text-gray-400">저장된 FAQ가 없습니다.</p>
          <p className="text-xs text-gray-400 mt-1">FAQ 자동 생성 탭에서 FAQ를 생성하고 저장하세요.</p>
        </div>
      )}

      {/* 로딩 */}
      {loading && (
        <div className="flex justify-center py-16">
          <Spinner />
        </div>
      )}

      {/* FAQ 목록 */}
      {!loading && faqs.length > 0 && (
        <div className="flex flex-col gap-3">
          {faqs.map(faq => (
            <div key={faq.id} className="rounded-xl border border-gray-200 dark:border-gray-700 p-4 flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 font-medium">
                    {faq.category}
                  </span>
                  {faq.flagged && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300 font-medium">
                      업데이트 필요
                    </span>
                  )}
                </div>
                <p className="text-sm font-semibold text-gray-900 dark:text-white mb-1">Q. {faq.question}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400 truncate">A. {faq.answer}</p>
              </div>
              <button className="shrink-0 text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 min-h-[32px] px-2">
                수정
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── 메인 페이지 ──────────────────────────────────────────────

export default function FaqPage() {
  const [activeTab, setActiveTab] = useState('generate')

  return (
    <div>
      <Breadcrumb
        crumbs={[
          { label: '사업 및 영업', to: '/frontoffice' },
          { label: 'CS/고객지원팀', to: '/frontoffice/cs' },
          { label: 'FAQ 자동 생성·관리' },
        ]}
      />

      {/* 헤더 */}
      <div className="mt-4 mb-6 rounded-xl border p-5 bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-amber-500 text-white shrink-0">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
          </div>
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-400">
              Front-Office · CS/고객지원팀
            </span>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white leading-tight">
              FAQ 자동 생성·관리
            </h1>
          </div>
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
          문의 로그를 클러스터링하여 FAQ 초안을 생성하고, 정책 변경 시 자동으로 업데이트합니다.
        </p>
      </div>

      {/* 탭 네비게이션 */}
      <div className="flex gap-1 mb-6 border-b border-gray-200 dark:border-gray-700">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={[
              'px-5 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors',
              activeTab === tab.id
                ? 'border-amber-500 text-amber-600 dark:text-amber-400'
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200',
            ].join(' ')}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'generate' && <GenerateTab />}
      {activeTab === 'manage'   && <ManageTab />}
    </div>
  )
}
