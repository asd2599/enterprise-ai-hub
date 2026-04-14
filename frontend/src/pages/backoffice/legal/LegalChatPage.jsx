// 법무 챗봇 페이지 — 사규·법률 문서 기반 Q&A 챗봇 (RAG)
import { useState, useRef, useEffect } from 'react'
import Breadcrumb from '../../../components/layout/Breadcrumb'

// 플레이스홀더 추천 질문
const SUGGESTIONS = [
  '연차휴가는 몇 일이나 사용할 수 있나요?',
  '퇴직금 지급 기준이 어떻게 되나요?',
  '외부 겸업이 허용되는지 확인해 주세요.',
  '접대비 사용 한도가 얼마인가요?',
  '개인정보 처리 방침에서 제3자 제공 기준은?',
]

// 로딩 스피너 (점 3개)
function TypingDots() {
  return (
    <span className="inline-flex items-center gap-1">
      {[0, 1, 2].map(i => (
        <span
          key={i}
          className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce"
          style={{ animationDelay: `${i * 0.15}s` }}
        />
      ))}
    </span>
  )
}

// 메시지 버블
function MessageBubble({ msg }) {
  const isUser = msg.role === 'user'
  return (
    <div className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}>
      {!isUser && (
        <div className="w-8 h-8 rounded-full bg-violet-600 flex items-center justify-center shrink-0 mt-0.5">
          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
      )}
      <div
        className={[
          'max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed',
          isUser
            ? 'bg-violet-600 text-white rounded-tr-sm'
            : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-100 rounded-tl-sm',
        ].join(' ')}
      >
        {msg.typing ? <TypingDots /> : (
          <>
            <p className="whitespace-pre-wrap">{msg.content}</p>
            {msg.sources && msg.sources.length > 0 && (
              <div className="mt-2 pt-2 border-t border-gray-100 dark:border-gray-700">
                <p className="text-xs text-gray-400 mb-1">참조 문서</p>
                <div className="flex flex-wrap gap-1">
                  {msg.sources.map((s, i) => (
                    <span key={i} className="text-[10px] px-2 py-0.5 rounded-full bg-violet-50 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400 font-medium">
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
      {isUser && (
        <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center shrink-0 mt-0.5 text-xs font-bold text-gray-600 dark:text-gray-300">
          나
        </div>
      )}
    </div>
  )
}

export default function LegalChatPage() {
  const [messages,  setMessages]  = useState([
    {
      id:      0,
      role:    'assistant',
      content: '안녕하세요! 법무 챗봇입니다.\n사규, 취업규칙, 계약 관련 법률 등 궁금한 내용을 질문해 주세요. 관련 문서를 검색하여 답변드립니다.',
      sources: [],
    },
  ])
  const [input,    setInput]    = useState('')
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState(null)
  const bottomRef  = useRef(null)
  const inputRef   = useRef(null)

  // 새 메시지 추가 시 스크롤 이동
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // ── 메시지 전송 ───────────────────────────────────────────────
  const handleSend = async (text = input.trim()) => {
    if (!text || loading) return
    setInput('')
    setError(null)

    const userMsg = { id: Date.now(), role: 'user', content: text }
    const typingMsg = { id: Date.now() + 1, role: 'assistant', typing: true, content: '' }

    setMessages(prev => [...prev, userMsg, typingMsg])
    setLoading(true)

    try {
      // TODO: API 연동 — POST /api/legal/chat
      // const data = await legalChat({ question: text, history: messages })
      // setMessages(prev => prev.filter(m => !m.typing).concat({ ...data, id: Date.now() + 2, role: 'assistant' }))

      // 플레이스홀더 목 응답
      await new Promise(r => setTimeout(r, 1200))
      const mockReply = getMockReply(text)
      setMessages(prev => [
        ...prev.filter(m => !m.typing),
        { id: Date.now() + 2, role: 'assistant', content: mockReply.content, sources: mockReply.sources },
      ])
    } catch (e) {
      setError(e.message || '응답 생성 중 오류가 발생했습니다.')
      setMessages(prev => prev.filter(m => !m.typing))
    } finally {
      setLoading(false)
      inputRef.current?.focus()
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] min-h-[500px]">
      <Breadcrumb
        crumbs={[
          { label: '경영지원 및 관리', to: '/backoffice' },
          { label: '법무/컴플라이언스팀', to: '/backoffice/legal' },
          { label: '법무 챗봇' },
        ]}
      />

      {/* 헤더 */}
      <div className="mt-4 mb-4 rounded-xl border p-4 bg-violet-50 dark:bg-violet-950/30 border-violet-200 dark:border-violet-800">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-violet-600 text-white text-xs font-bold shrink-0">
            RAG
          </div>
          <div>
            <h1 className="text-base font-bold text-gray-900 dark:text-white leading-tight">
              법무 챗봇
            </h1>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              사규·취업규칙·법률 문서 기반 Q&A · RAG (Retrieval-Augmented Generation)
            </p>
          </div>
          <span className="ml-auto text-xs px-2.5 py-1 rounded-full bg-violet-100 dark:bg-violet-900/50 text-violet-700 dark:text-violet-300 font-medium shrink-0">
            법무/컴플라이언스팀 전용
          </span>
        </div>
      </div>

      {/* 에러 */}
      {error && (
        <div className="mb-3 rounded-xl border border-red-200 bg-red-50 dark:bg-red-900/20 px-4 py-2.5">
          <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
        </div>
      )}

      {/* 채팅 영역 */}
      <div className="flex-1 overflow-y-auto rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 p-4 space-y-4 mb-3">
        {messages.map(msg => (
          <MessageBubble key={msg.id} msg={msg} />
        ))}
        <div ref={bottomRef} />
      </div>

      {/* 추천 질문 (첫 화면에서만) */}
      {messages.length === 1 && (
        <div className="flex flex-wrap gap-2 mb-3">
          {SUGGESTIONS.map(s => (
            <button
              key={s}
              onClick={() => handleSend(s)}
              disabled={loading}
              className="text-xs px-3 py-1.5 rounded-full border border-violet-200 dark:border-violet-800
                text-violet-700 dark:text-violet-300 hover:bg-violet-50 dark:hover:bg-violet-900/30
                transition-colors min-h-[32px] disabled:opacity-50"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {/* 입력창 */}
      <div className="flex items-end gap-2">
        <textarea
          ref={inputRef}
          rows={1}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="사규, 법률, 계약 관련 질문을 입력하세요... (Enter 전송 / Shift+Enter 줄바꿈)"
          className="flex-1 resize-none text-sm rounded-xl border border-gray-200 dark:border-gray-600
            bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200
            px-4 py-3 focus:outline-none focus:ring-1 focus:ring-violet-400
            min-h-[44px] max-h-[120px] overflow-y-auto"
          style={{ height: 'auto' }}
          onInput={e => {
            e.target.style.height = 'auto'
            e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px'
          }}
          disabled={loading}
        />
        <button
          onClick={() => handleSend()}
          disabled={!input.trim() || loading}
          className="flex items-center justify-center w-11 h-11 rounded-xl bg-violet-600 text-white
            hover:bg-violet-700 disabled:opacity-50 shrink-0"
        >
          {loading ? (
            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
          ) : (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          )}
        </button>
      </div>
    </div>
  )
}

// 플레이스홀더 목 응답 생성
function getMockReply(question) {
  const q = question.toLowerCase()
  if (q.includes('연차') || q.includes('휴가')) {
    return {
      content: '취업규칙 제24조에 따르면, 1년 이상 근무한 직원은 연간 15일의 연차휴가가 부여됩니다.\n\n• 1년 미만: 매월 1일 (최대 11일)\n• 1년 이상 3년 미만: 15일\n• 3년 이상: 2년마다 1일 추가 (최대 25일)\n\n연차는 근로기준법 제60조에 따라 보장되며, 미사용 연차는 수당으로 보전됩니다.',
      sources: ['취업규칙 제24조', '근로기준법 제60조'],
    }
  }
  if (q.includes('퇴직금')) {
    return {
      content: '퇴직금 지급 기준은 근로자퇴직급여보장법에 의거합니다.\n\n• 지급 요건: 1년 이상 계속 근무\n• 산정 기준: 계속근무연수 1년에 대해 30일분 평균임금\n• 지급 시기: 퇴직일로부터 14일 이내\n\n자세한 사항은 인사팀 또는 취업규칙 제45조를 참조하세요.',
      sources: ['취업규칙 제45조', '근로자퇴직급여보장법 제9조'],
    }
  }
  if (q.includes('접대비') || q.includes('한도')) {
    return {
      content: '사규 경비처리 기준 제8조에 따른 접대비 지출 한도는 다음과 같습니다.\n\n• 1회 한도: 50만원 (부가세 포함)\n• 월 한도: 100만원\n• 연 한도: 500만원\n\n한도 초과 시 팀장 및 경영지원팀 사전 승인이 필요하며, 영수증 및 지출결의서 제출이 의무입니다.',
      sources: ['경비처리 기준 제8조', '내부감사 규정 §3-2'],
    }
  }
  return {
    content: `"${question}"에 대한 답변입니다.\n\n현재 플레이스홀더 모드로 동작 중입니다. 실제 서비스에서는 사규·법률 문서 데이터베이스를 RAG로 검색하여 정확한 답변을 제공합니다.\n\n법무팀에 직접 문의하거나, 사내 포털의 사규 검색 시스템을 이용해 주세요.`,
    sources: ['플레이스홀더'],
  }
}
