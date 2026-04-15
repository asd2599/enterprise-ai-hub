// 개발/IT 인프라 문서 챗봇 페이지
import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { FaChevronDown, FaChevronUp, FaTrashAlt } from 'react-icons/fa'
import Breadcrumb from '../../../components/layout/Breadcrumb'
import { getAuthSession } from '../../../api/auth'
import {
  askDevQuestion,
  deleteDevDocument,
  getDevDocuments,
  uploadDevDocuments,
} from '../../../api/dev'

const SUGGESTIONS = [
  '배포 절차는 어떻게 되나요?',
  'DB 접속 정보는 어디서 확인하나요?',
  '장애 발생 시 에스컬레이션 프로세스는?',
]

function TypingDots() {
  return (
    <span className="inline-flex items-center gap-1">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="h-1.5 w-1.5 rounded-full bg-gray-400 animate-bounce"
          style={{ animationDelay: `${i * 0.15}s` }}
        />
      ))}
    </span>
  )
}

export default function DevDocs() {
  const [documents, setDocuments] = useState([])
  const [documentsLoading, setDocumentsLoading] = useState(true)
  const [documentsError, setDocumentsError] = useState('')
  const [documentsExpanded, setDocumentsExpanded] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState('')
  const [messages, setMessages] = useState([])
  const [question, setQuestion] = useState('')
  const [chatLoading, setChatLoading] = useState(false)
  const [chatError, setChatError] = useState('')
  const [session, setSession] = useState(() => getAuthSession())
  const fileInputRef = useRef(null)
  const bottomRef = useRef(null)

  useEffect(() => {
    function syncSession() { setSession(getAuthSession()) }
    window.addEventListener('auth-session-changed', syncSession)
    return () => window.removeEventListener('auth-session-changed', syncSession)
  }, [])

  const isLoggedIn = Boolean(session?.employee?.employee_id)

  useEffect(() => {
    async function fetchDocs() {
      setDocumentsLoading(true)
      try {
        const data = await getDevDocuments()
        setDocuments(data.items || [])
      } catch (err) {
        setDocumentsError(err.message || '문서 목록을 불러오지 못했습니다.')
      } finally {
        setDocumentsLoading(false)
      }
    }
    fetchDocs()
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, chatLoading])

  const sortedDocuments = useMemo(
    () => [...documents].sort((a, b) => String(b.uploaded_at || '').localeCompare(String(a.uploaded_at || ''))),
    [documents],
  )

  async function handleUpload(files) {
    if (!isLoggedIn) { setUploadError('로그인이 필요합니다.'); return }
    setUploading(true)
    setUploadError('')
    try {
      await uploadDevDocuments(files, {
        employee_id: session?.employee?.employee_id || '',
        name: session?.employee?.name || '',
        department: session?.employee?.department || '',
      })
      const data = await getDevDocuments()
      setDocuments(data.items || [])
    } catch (err) {
      setUploadError(err.message || '업로드에 실패했습니다.')
    } finally {
      setUploading(false)
    }
  }

  async function handleDelete(documentId) {
    if (!window.confirm('문서를 삭제하시겠습니까?')) return
    try {
      const result = await deleteDevDocument(documentId)
      setDocuments(result.items || [])
    } catch (err) {
      setDocumentsError(err.message || '삭제에 실패했습니다.')
    }
  }

  async function handleSend(text) {
    const q = (text ?? question).trim()
    if (!q) return
    setQuestion('')
    setChatError('')
    setMessages((prev) => [...prev, { role: 'user', content: q }])
    setChatLoading(true)
    try {
      const data = await askDevQuestion(q)
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: data.answer,
          evidence: data.evidence || [],
          sources: data.sources || [],
        },
      ])
    } catch (err) {
      setChatError(err.message || '답변 생성에 실패했습니다.')
    } finally {
      setChatLoading(false)
    }
  }

  return (
    <div>
      <Breadcrumb
        crumbs={[
          { label: '기술 및 서비스', to: '/rnd' },
          { label: '개발/IT운영팀', to: '/rnd/dev' },
          { label: '인프라 문서 챗봇' },
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
            Dev Docs Chatbot
          </span>
          <h1 className="mt-1 text-xl font-bold text-gray-900 dark:text-white">
            인프라 문서 챗봇
          </h1>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
            운영 매뉴얼·아키텍처 문서를 업로드하면 질의응답으로 빠르게 정보를 찾을 수 있습니다.
          </p>
        </div>

        {/* 문서 업로드 영역 */}
        <div className="rounded-xl border border-emerald-200 bg-white p-6 dark:border-emerald-800 dark:bg-gray-900">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold text-gray-900 dark:text-white">
                기술 문서
              </h2>
              <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">
                {documentsLoading ? '로딩 중 ...' : `${documents.length}개 문서 업로드됨`}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading || !isLoggedIn}
                className="inline-flex h-10 w-24 items-center justify-center rounded-lg bg-emerald-600 text-sm font-medium text-white transition hover:bg-emerald-700 disabled:opacity-60"
              >
                {uploading ? '업로드 중' : '파일 선택'}
              </button>
              {documents.length > 0 && (
                <button
                  type="button"
                  onClick={() => setDocumentsExpanded((p) => !p)}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-gray-200 text-gray-500 transition hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800"
                >
                  {documentsExpanded ? <FaChevronUp className="h-3.5 w-3.5" /> : <FaChevronDown className="h-3.5 w-3.5" />}
                </button>
              )}
            </div>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".hwp,.docx,.pdf"
            className="hidden"
            onChange={async (e) => {
              const files = Array.from(e.target.files || [])
              if (!files.length) return
              await handleUpload(files)
              e.target.value = ''
            }}
          />

          {uploadError && (
            <p className="mt-3 text-sm text-rose-600 dark:text-rose-400">{uploadError}</p>
          )}
          {documentsError && (
            <p className="mt-3 text-sm text-rose-600 dark:text-rose-400">{documentsError}</p>
          )}

          {documentsExpanded && documents.length > 0 && (
            <div className="mt-4 space-y-2">
              {sortedDocuments.map((doc) => (
                <div
                  key={doc.document_id}
                  className="flex items-center justify-between gap-3 rounded-lg bg-gray-50 px-4 py-2.5 text-sm dark:bg-gray-800/60"
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium text-gray-800 dark:text-gray-100">{doc.file_name}</p>
                    <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                      {doc.uploaded_at?.slice(0, 19).replace('T', ' ') || '-'} · {doc.text_length?.toLocaleString?.()}자
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDelete(doc.document_id)}
                    aria-label="문서 삭제"
                    className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-gray-400 transition hover:bg-white hover:text-rose-600 dark:hover:bg-gray-900"
                  >
                    <FaTrashAlt className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 채팅 */}
        <div className="rounded-xl border border-emerald-200 bg-white dark:border-emerald-800 dark:bg-gray-900">
          {/* 메시지 목록 */}
          <div className="min-h-64 space-y-4 p-6">
            {messages.length === 0 && !chatLoading && (
              <div className="flex flex-col items-center gap-4 py-8">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  문서를 업로드한 뒤 질문하세요.
                </p>
                <div className="flex flex-wrap justify-center gap-2">
                  {SUGGESTIONS.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => handleSend(s)}
                      className="rounded-full border border-emerald-200 px-4 py-1.5 text-xs text-emerald-700 transition hover:bg-emerald-50 dark:border-emerald-700 dark:text-emerald-300 dark:hover:bg-emerald-950/40"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] rounded-xl px-4 py-3 text-sm ${
                  msg.role === 'user'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100'
                }`}>
                  <p className="leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                  {msg.role === 'assistant' && msg.sources?.length > 0 && (
                    <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                      출처: {msg.sources.join(', ')}
                    </p>
                  )}
                </div>
              </div>
            ))}

            {chatLoading && (
              <div className="flex justify-start">
                <div className="rounded-xl bg-gray-100 px-4 py-3 dark:bg-gray-800">
                  <TypingDots />
                </div>
              </div>
            )}

            {chatError && (
              <p className="text-center text-sm text-rose-600 dark:text-rose-400">{chatError}</p>
            )}
            <div ref={bottomRef} />
          </div>

          {/* 입력창 */}
          <div className="border-t border-gray-200 p-4 dark:border-gray-700">
            <form
              onSubmit={(e) => { e.preventDefault(); handleSend() }}
              className="flex gap-2"
            >
              <input
                type="text"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="문서 내용에 대해 질문하세요 ..."
                disabled={chatLoading}
                className="flex-1 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm outline-none transition focus:border-emerald-500 disabled:opacity-60 dark:border-gray-600 dark:bg-gray-950 dark:text-white"
              />
              <button
                type="submit"
                disabled={chatLoading || !question.trim()}
                className="inline-flex h-11 items-center rounded-lg bg-emerald-600 px-5 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-60"
              >
                전송
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
