// 고객 미팅 요약 페이지 — 메모/녹취 텍스트 → 구조화 요약 + CRM 초안
import { useState } from 'react'
import Breadcrumb from '../../../components/layout/Breadcrumb'
import { summarizeMeeting } from '../../../api/sales'

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

function CopyBtn({ text, label = '복사', className = '' }) {
  const [copied, setCopied] = useState(false)
  function handle() {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }
  return (
    <button onClick={handle} className={`text-xs min-h-[28px] px-2 rounded transition-colors ${className}`}>
      {copied ? '복사됨' : label}
    </button>
  )
}

const STAGE_COLOR = {
  '리드 발굴':   'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300',
  '니즈 분석':   'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300',
  '제안서 발송': 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300',
  '협상 중':     'bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-300',
  '계약 완료':   'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300',
}

const RESULT_TABS = [
  { id: 'summary', label: '미팅 요약' },
  { id: 'actions', label: '액션아이템' },
  { id: 'crm',     label: 'CRM 초안' },
]

export default function MeetingPage() {
  const [companyName,   setCompanyName]   = useState('')
  const [meetingDate,   setMeetingDate]   = useState('')
  const [meetingNotes,  setMeetingNotes]  = useState('')

  const [loading,   setLoading]   = useState(false)
  const [error,     setError]     = useState(null)
  const [result,    setResult]    = useState(null)
  const [activeTab, setActiveTab] = useState('summary')

  async function handleSummarize() {
    if (!companyName.trim() || !meetingNotes.trim()) return
    setLoading(true)
    setError(null)
    setResult(null)
    try {
      const data = await summarizeMeeting({
        company_name:  companyName,
        meeting_date:  meetingDate,
        meeting_notes: meetingNotes,
      })
      setResult(data)
      setActiveTab('summary')
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <Breadcrumb
        crumbs={[
          { label: '사업 및 영업', to: '/frontoffice' },
          { label: '영업/영업관리팀', to: '/frontoffice/sales' },
          { label: '고객 미팅 요약' },
        ]}
      />

      {/* 헤더 */}
      <div className="mt-4 mb-6 rounded-xl border p-5 bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-amber-500 text-white shrink-0">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-400">
              Front-Office · 영업/영업관리팀
            </span>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white leading-tight">
              고객 미팅 요약
            </h1>
          </div>
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
          미팅 내용이나 메모를 붙여 넣으면 핵심 논의·액션아이템·CRM 입력 초안을 자동 생성합니다. 정리 시간을 1시간에서 5분으로 단축합니다.
        </p>
      </div>

      {/* 입력 폼 */}
      <div className="rounded-xl border border-gray-200 dark:border-gray-700 p-5 mb-5">
        <h3 className="text-sm font-semibold text-gray-800 dark:text-white mb-4">미팅 정보 입력</h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          {/* 고객사명 */}
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">
              고객사명 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={companyName}
              onChange={e => setCompanyName(e.target.value)}
              placeholder="예) (주)한국전자"
              className="w-full text-sm rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white px-4 py-2.5 min-h-[44px] focus:outline-none focus:ring-2 focus:ring-amber-400"
            />
          </div>

          {/* 미팅 날짜 */}
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">
              미팅 날짜
            </label>
            <input
              type="date"
              value={meetingDate}
              onChange={e => setMeetingDate(e.target.value)}
              className="w-full text-sm rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white px-4 py-2.5 min-h-[44px] focus:outline-none focus:ring-2 focus:ring-amber-400"
            />
          </div>
        </div>

        {/* 미팅 내용 */}
        <div>
          <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">
            미팅 내용 / 메모 <span className="text-red-500">*</span>
          </label>
          <textarea
            value={meetingNotes}
            onChange={e => setMeetingNotes(e.target.value)}
            rows={8}
            placeholder={`예) 오늘 한국전자 구매팀장 박부장과 미팅을 진행했습니다.

주요 내용:
- 현재 생산라인 QC 검사 인력 20명 운영 중, 비용 부담 큼
- 불량률 2.8%로 업계 평균 1.5% 대비 높은 수준
- AI 비전 검사 도입에 관심 있으나 ROI 검증 필요
- 6월 이사회에서 IT 투자 예산 심의 예정, 5월까지 제안서 필요

고객 우려사항:
- 기존 설비와의 호환성 문제
- 도입 기간 중 생산 라인 중단 최소화 요청

다음 스텝:
- 당사: 유사 제조사 레퍼런스 자료 1주일 내 발송
- 박부장: 공장 방문 일정 조율 (4/21 예정)`}
            className="w-full text-sm rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white px-4 py-2.5 resize-none focus:outline-none focus:ring-2 focus:ring-amber-400"
          />
        </div>
      </div>

      {/* 생성 버튼 */}
      <button
        onClick={handleSummarize}
        disabled={!companyName.trim() || !meetingNotes.trim() || loading}
        className="w-full min-h-[44px] rounded-xl bg-amber-500 hover:bg-amber-600
          disabled:bg-gray-300 dark:disabled:bg-gray-700
          text-white text-sm font-semibold transition-colors mb-6
          flex items-center justify-center gap-2"
      >
        {loading ? <><Spinner />요약 생성 중...</> : '미팅 요약 자동 생성'}
      </button>

      <ErrorBanner message={error} />

      {/* 빈 상태 */}
      {!result && !loading && !error && (
        <div className="rounded-xl border border-dashed border-gray-200 dark:border-gray-700 p-12 text-center">
          <svg className="w-10 h-10 mx-auto mb-3 text-gray-300 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          <p className="text-sm text-gray-400">미팅 내용을 입력하면<br />구조화된 요약본이 여기에 표시됩니다.</p>
        </div>
      )}

      {/* 로딩 */}
      {loading && (
        <div className="rounded-xl border border-gray-200 dark:border-gray-700 p-12 flex flex-col items-center gap-3">
          <Spinner />
          <p className="text-sm text-gray-400">미팅 내용을 분석하여 구조화하는 중...</p>
        </div>
      )}

      {/* 결과 */}
      {result && (
        <div className="flex flex-col gap-5">
          {/* 미팅 제목 + 단계 */}
          <div className="rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/20 p-5">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div>
                <p className="text-xs font-semibold text-amber-600 dark:text-amber-400 mb-1">미팅 제목</p>
                <p className="text-lg font-bold text-gray-900 dark:text-white">{result.meeting_title}</p>
              </div>
              {result.crm_draft?.stage && (
                <span className={`text-xs font-semibold px-3 py-1.5 rounded-full ${STAGE_COLOR[result.crm_draft.stage] ?? 'bg-gray-100 text-gray-600'}`}>
                  {result.crm_draft.stage}
                </span>
              )}
            </div>
          </div>

          {/* 탭 */}
          <div className="rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="flex border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
              {RESULT_TABS.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 py-3 text-sm font-medium transition-colors border-b-2 ${
                    activeTab === tab.id
                      ? 'border-amber-500 text-amber-600 dark:text-amber-400 bg-white dark:bg-gray-900'
                      : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="p-5">
              {/* 미팅 요약 */}
              {activeTab === 'summary' && (
                <div className="flex flex-col gap-5">
                  {/* 핵심 논의 */}
                  <div>
                    <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">핵심 논의사항</p>
                    <ul className="flex flex-col gap-2">
                      {result.key_discussions?.map((d, i) => (
                        <li key={i} className="flex items-start gap-2.5 text-sm text-gray-700 dark:text-gray-300">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-2 shrink-0" />
                          {d}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* 고객 니즈 */}
                  <div>
                    <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">고객 니즈</p>
                    <ul className="flex flex-col gap-2">
                      {result.customer_needs?.map((n, i) => (
                        <li key={i} className="flex items-start gap-2.5 text-sm text-gray-700 dark:text-gray-300 bg-blue-50 dark:bg-blue-950/20 rounded-lg px-3 py-2">
                          <svg className="w-4 h-4 text-blue-400 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          {n}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* 우려사항 */}
                  {result.concerns?.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">우려사항</p>
                      <ul className="flex flex-col gap-2">
                        {result.concerns.map((c, i) => (
                          <li key={i} className="flex items-start gap-2.5 text-sm text-gray-700 dark:text-gray-300 bg-orange-50 dark:bg-orange-950/20 rounded-lg px-3 py-2">
                            <svg className="w-4 h-4 text-orange-400 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                            {c}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* 다음 의제 */}
                  {result.next_agenda?.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">다음 미팅 의제</p>
                      <ul className="flex flex-col gap-2">
                        {result.next_agenda.map((a, i) => (
                          <li key={i} className="flex items-start gap-2.5 text-sm text-gray-700 dark:text-gray-300">
                            <span className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 px-2 py-0.5 rounded shrink-0">{i + 1}</span>
                            {a}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {/* 액션아이템 */}
              {activeTab === 'actions' && (
                <div className="flex flex-col gap-3">
                  {result.action_items?.length === 0 ? (
                    <p className="text-sm text-gray-400 text-center py-4">추출된 액션아이템이 없습니다.</p>
                  ) : (
                    result.action_items?.map((item, i) => (
                      <div key={i} className="flex items-start gap-4 p-4 rounded-xl border border-gray-100 dark:border-gray-700">
                        <div className="w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400 text-xs font-bold flex items-center justify-center shrink-0">
                          {i + 1}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <span className="text-sm font-semibold text-gray-800 dark:text-white">{item.action}</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-xs text-gray-500 dark:text-gray-400">담당: <span className="font-medium text-gray-700 dark:text-gray-300">{item.owner}</span></span>
                            {item.due && (
                              <span className="text-xs text-gray-500 dark:text-gray-400">기한: <span className="font-medium text-amber-600 dark:text-amber-400">{item.due}</span></span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* CRM 초안 */}
              {activeTab === 'crm' && result.crm_draft && (
                <div className="flex flex-col gap-4">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">CRM 입력 초안</span>
                    <CopyBtn
                      text={`영업 기회명: ${result.crm_draft.opportunity_name}\n단계: ${result.crm_draft.stage}\n다음 단계: ${result.crm_draft.next_step}\n담당자 역할: ${result.crm_draft.contact_role}\n\n${result.crm_draft.description}`}
                      label="전체 복사"
                      className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                    />
                  </div>

                  <div className="rounded-xl border border-gray-100 dark:border-gray-700 overflow-hidden">
                    {[
                      { label: '영업 기회명', value: result.crm_draft.opportunity_name },
                      { label: '현재 단계',   value: result.crm_draft.stage },
                      { label: '다음 단계',   value: result.crm_draft.next_step },
                      { label: '담당자 역할', value: result.crm_draft.contact_role || '—' },
                    ].map((row, i) => (
                      <div key={i} className="flex border-b border-gray-100 dark:border-gray-700 last:border-0">
                        <div className="w-28 shrink-0 bg-gray-50 dark:bg-gray-800/50 px-4 py-3">
                          <p className="text-xs font-medium text-gray-500 dark:text-gray-400">{row.label}</p>
                        </div>
                        <div className="flex-1 px-4 py-3">
                          <p className="text-sm text-gray-800 dark:text-gray-200">{row.value}</p>
                        </div>
                      </div>
                    ))}
                    <div className="border-t border-gray-100 dark:border-gray-700">
                      <div className="px-4 py-3 bg-gray-50 dark:bg-gray-800/50">
                        <p className="text-xs font-medium text-gray-500 dark:text-gray-400">미팅 요약 (설명란)</p>
                      </div>
                      <div className="px-4 py-3">
                        <p className="text-sm text-gray-800 dark:text-gray-200 leading-relaxed">{result.crm_draft.description}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
