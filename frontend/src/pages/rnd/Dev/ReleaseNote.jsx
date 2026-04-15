// 릴리즈 노트 생성 페이지
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { FaTrashCan } from 'react-icons/fa6'
import Breadcrumb from '../../../components/layout/Breadcrumb'
import { generateReleaseNote } from '../../../api/dev'

const AUDIENCE_OPTIONS = [
  { value: 'general', label: '일반 사용자' },
  { value: 'developer', label: '개발자' },
  { value: 'manager', label: '관리자/임원' },
]

const COMMIT_PLACEHOLDER = `feat: 사용자 프로필 사진 업로드 기능 추가
fix: 로그인 시 세션 만료 오류 수정
fix: 모바일에서 버튼 터치 영역 너무 작은 문제 수정
perf: 이미지 로딩 속도 40% 개선
refactor: 결제 모듈 코드 구조 개선
docs: API 문서 업데이트
chore: 의존성 패키지 보안 업데이트`

export default function ReleaseNote() {
  const [commits, setCommits] = useState('')
  const [version, setVersion] = useState('')
  const [productName, setProductName] = useState('')
  const [audience, setAudience] = useState('general')
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    if (!commits.trim()) return

    setLoading(true)
    setError('')
    setResult(null)

    try {
      const data = await generateReleaseNote({ commits, version, productName, audience })
      setResult(data)
    } catch (err) {
      setError(err.message || '생성에 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  function buildMarkdown() {
    if (!result) return ''
    const lines = []
    const title = result.version ? `${result.title} (${result.version})` : result.title
    lines.push(`# ${title}`, '')
    if (result.summary) lines.push(result.summary, '')
    for (const section of result.sections || []) {
      lines.push(`## ${section.category}`, '')
      for (const item of section.items || []) lines.push(`- ${item}`)
      lines.push('')
    }
    if (result.breaking_changes?.length) {
      lines.push('## ⚠️ 주의사항 (Breaking Changes)', '')
      for (const bc of result.breaking_changes) lines.push(`- ${bc}`)
      lines.push('')
    }
    if (result.notes) lines.push('## 기타', '', result.notes)
    return lines.join('\n').trim()
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(buildMarkdown())
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {}
  }

  return (
    <div>
      <Breadcrumb
        crumbs={[
          { label: '기술 및 서비스', to: '/rnd' },
          { label: '개발/IT운영팀', to: '/rnd/dev' },
          { label: '릴리즈 노트 생성' },
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
            Release Note Generator
          </span>
          <h1 className="mt-1 text-xl font-bold text-gray-900 dark:text-white">
            릴리즈 노트 생성
          </h1>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
            커밋 메시지를 붙여넣으면 대상 독자에 맞는 릴리즈 노트를 자동 생성합니다.
          </p>
        </div>

        {/* 입력 폼 */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="rounded-xl border border-emerald-200 bg-white p-6 dark:border-emerald-800 dark:bg-gray-900">
            {/* 메타 정보 */}
            <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  제품/서비스명 <span className="text-gray-400">(선택)</span>
                </label>
                <input
                  type="text"
                  value={productName}
                  onChange={(e) => setProductName(e.target.value)}
                  placeholder="예: Enterprise AI Hub"
                  className="w-full rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 text-sm outline-none transition focus:border-emerald-500 dark:border-gray-700 dark:bg-gray-950 dark:text-white"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  버전 <span className="text-gray-400">(선택)</span>
                </label>
                <input
                  type="text"
                  value={version}
                  onChange={(e) => setVersion(e.target.value)}
                  placeholder="예: v1.2.0"
                  className="w-full rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 text-sm outline-none transition focus:border-emerald-500 dark:border-gray-700 dark:bg-gray-950 dark:text-white"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  대상 독자
                </label>
                <select
                  value={audience}
                  onChange={(e) => setAudience(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 text-sm outline-none transition focus:border-emerald-500 dark:border-gray-700 dark:bg-gray-950 dark:text-white"
                >
                  {AUDIENCE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* 커밋 메시지 */}
            <label className="mb-2 block text-sm font-semibold text-gray-800 dark:text-gray-100">
              커밋 메시지
            </label>
            <button
              type="button"
              onClick={() => setCommits(COMMIT_PLACEHOLDER)}
              className="mb-2 rounded-full border border-emerald-200 px-3 py-1 text-xs text-emerald-700 transition hover:bg-emerald-50 dark:border-emerald-700 dark:text-emerald-300 dark:hover:bg-emerald-950/40"
            >
              예시 불러오기
            </button>
            <textarea
              rows={10}
              value={commits}
              onChange={(e) => setCommits(e.target.value)}
              placeholder={COMMIT_PLACEHOLDER}
              className="w-full rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 font-mono text-xs text-gray-800 outline-none transition focus:border-emerald-500 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-200"
            />

            <div className="mt-4 flex flex-wrap gap-3">
              <button
                type="submit"
                disabled={loading || !commits.trim()}
                className="inline-flex h-11 items-center rounded-lg bg-emerald-600 px-6 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-60"
              >
                {loading ? '생성 중 ...' : '릴리즈 노트 생성'}
              </button>
              {result && (
                <button
                  type="button"
                  onClick={() => { setResult(null); setCommits('') }}
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
          <div className="rounded-xl border border-emerald-200 bg-white p-6 dark:border-emerald-800 dark:bg-gray-900">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-semibold text-gray-900 dark:text-white">
                  {result.version ? `${result.title} (${result.version})` : result.title}
                </h2>
                {result.product_name && (
                  <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">{result.product_name}</p>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCopy}
                  className="inline-flex h-9 items-center rounded-lg border border-gray-300 px-4 text-xs font-medium text-gray-700 transition hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
                >
                  {copied ? '복사됨!' : 'Markdown 복사'}
                </button>
                <button
                  type="button"
                  onClick={() => setResult(null)}
                  aria-label="릴리즈 노트 삭제"
                  className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-gray-300 text-gray-400 transition hover:border-rose-300 hover:bg-rose-50 hover:text-rose-600 dark:border-gray-600 dark:hover:border-rose-700 dark:hover:bg-rose-950/30 dark:hover:text-rose-400"
                >
                  <FaTrashCan className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            {/* 요약 */}
            {result.summary && (
              <p className="mt-4 rounded-lg bg-emerald-50 px-4 py-3 text-sm leading-relaxed text-gray-700 dark:bg-emerald-950/30 dark:text-gray-300">
                {result.summary}
              </p>
            )}

            {/* 섹션별 내용 */}
            <div className="mt-5 space-y-5">
              {result.sections?.map((section) => (
                <div key={section.category}>
                  <h3 className="mb-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
                    {section.category}
                  </h3>
                  <ul className="space-y-1.5">
                    {section.items?.map((item, i) => (
                      <li key={i} className="flex gap-2 text-sm text-gray-700 dark:text-gray-300">
                        <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            {/* Breaking Changes */}
            {result.breaking_changes?.length > 0 && (
              <div className="mt-5 rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-950/30">
                <h3 className="mb-2 text-sm font-semibold text-amber-800 dark:text-amber-300">
                  ⚠️ 주의사항 (Breaking Changes)
                </h3>
                <ul className="space-y-1">
                  {result.breaking_changes.map((bc, i) => (
                    <li key={i} className="text-sm text-amber-700 dark:text-amber-400">{bc}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* 기타 안내 */}
            {result.notes && (
              <div className="mt-4">
                <h3 className="mb-1 text-sm font-semibold text-gray-700 dark:text-gray-300">기타</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">{result.notes}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
