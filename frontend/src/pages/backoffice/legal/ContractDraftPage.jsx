// 계약 생성 페이지 — 조건 입력 → 표준 계약서 초안 자동 작성
import { useState } from 'react'
import Breadcrumb from '../../../components/layout/Breadcrumb'

// 계약 유형 목록
const CONTRACT_TYPES = [
  { value: 'nda',         label: 'NDA (비밀유지계약)' },
  { value: 'service',     label: '용역계약서' },
  { value: 'employment',  label: '근로계약서' },
  { value: 'partnership', label: '업무협약서 (MOU)' },
  { value: 'purchase',    label: '물품 구매계약서' },
]

// 로딩 스피너
function Spinner({ size = 4 }) {
  return (
    <svg className={`w-${size} h-${size} animate-spin`} fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
    </svg>
  )
}

// 입력 필드 레이블
function FieldLabel({ children, required }) {
  return (
    <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5">
      {children}
      {required && <span className="text-red-400 ml-0.5">*</span>}
    </label>
  )
}

// 공통 인풋 스타일
const inputCls = `w-full text-sm rounded-lg border border-gray-200 dark:border-gray-600
  bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200
  px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-violet-400 min-h-[44px]`

export default function ContractDraftPage() {
  const [form, setForm] = useState({
    contract_type: '',
    party_a:       '',   // 갑 (발주자/위탁자)
    party_b:       '',   // 을 (수주자/수탁자)
    purpose:       '',   // 계약 목적 / 업무 범위
    amount:        '',   // 계약 금액
    start_date:    '',
    end_date:      '',
    extra:         '',   // 특이 사항
  })
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState(null)
  const [draft,    setDraft]    = useState('')
  const [copied,   setCopied]   = useState(false)

  const update = (field, value) => setForm(prev => ({ ...prev, [field]: value }))

  const isValid = form.contract_type && form.party_a && form.party_b && form.purpose

  // ── 계약서 생성 ───────────────────────────────────────────────
  const handleGenerate = async () => {
    if (!isValid) return
    setLoading(true)
    setError(null)
    setDraft('')
    try {
      // TODO: API 연동 — POST /api/legal/draft
      // const data = await generateContract(form)
      // setDraft(data.draft)

      // 플레이스홀더 목 데이터
      await new Promise(r => setTimeout(r, 1800))
      const typeName = CONTRACT_TYPES.find(t => t.value === form.contract_type)?.label || '계약서'
      setDraft(`${typeName}

갑: ${form.party_a}
을: ${form.party_b}

제 1조 (목적)
본 계약은 ${form.purpose}에 관하여 갑과 을 사이의 권리·의무 관계를 명확히 하는 것을 목적으로 한다.

제 2조 (계약 기간)
본 계약의 유효 기간은 ${form.start_date || 'YYYY-MM-DD'}부터 ${form.end_date || 'YYYY-MM-DD'}까지로 한다. 단, 계약 기간 만료 30일 전까지 일방 당사자로부터 서면 해지 통보가 없는 경우 동일한 조건으로 1년씩 자동 연장된다.

제 3조 (계약 금액 및 지급)
${form.amount ? `① 본 계약의 총 계약 금액은 금 ${Number(form.amount.replace(/,/g, '')).toLocaleString()}원(부가세 별도)으로 한다.` : '① 계약 금액은 별도 협의하여 결정한다.'}
② 을은 계약 이행 완료 후 세금계산서를 발행하며, 갑은 발행일로부터 30일 이내에 지급한다.

제 4조 (비밀유지)
양 당사자는 본 계약의 이행 과정에서 취득한 상대방의 영업 비밀 및 기술 정보를 본 계약 종료 후 3년간 제3자에게 공개하지 아니한다.

제 5조 (손해배상)
① 일방 당사자의 귀책사유로 상대방에게 손해가 발생한 경우 그 손해를 배상하여야 한다.
② 손해배상의 범위는 직접 손해에 한하며, 간접 손해·파생 손해·영업 손실은 포함하지 아니한다.
③ 배상 한도는 본 계약의 총 계약 금액을 초과하지 아니한다.

제 6조 (계약 해지)
① 갑 또는 을이 본 계약을 해지하고자 할 경우 최소 30일 전에 상대방에게 서면으로 통보하여야 한다.
② 다음 각 호의 경우 상대방은 즉시 본 계약을 해지할 수 있다.
   1. 파산 또는 회생 신청
   2. 중대한 계약 위반 및 시정 요청 후 14일 이내 미시정

제 7조 (준거법 및 관할)
본 계약은 대한민국 법률에 따라 해석되며, 분쟁 발생 시 서울중앙지방법원을 전속 관할 법원으로 한다.

${form.extra ? `[특이 사항]\n${form.extra}\n\n` : ''}위 계약의 성립을 증명하기 위하여 본 계약서 2부를 작성하고, 갑과 을이 각 서명·날인 후 각 1부씩 보관한다.

작성일: ${new Date().toLocaleDateString('ko-KR')}

갑: ${form.party_a}  (인)
을: ${form.party_b}  (인)`)
    } catch (e) {
      setError(e.message || '계약서 생성 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  // 클립보드 복사
  const handleCopy = () => {
    navigator.clipboard.writeText(draft).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <div>
      <Breadcrumb
        crumbs={[
          { label: '경영지원 및 관리', to: '/backoffice' },
          { label: '법무/컴플라이언스팀', to: '/backoffice/legal' },
          { label: '계약 생성' },
        ]}
      />

      {/* 헤더 */}
      <div className="mt-4 mb-6 rounded-xl border p-5 bg-violet-50 dark:bg-violet-950/30 border-violet-200 dark:border-violet-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-violet-600 text-white text-xs font-bold shrink-0">
            생성
          </div>
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-violet-600 dark:text-violet-400">
              Back-Office · 법무/컴플라이언스팀
            </span>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white leading-tight">
              계약서 초안 생성
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
              계약 조건을 입력하면 AI가 표준 계약서 초안을 자동으로 작성합니다.
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ── 입력 폼 ────────────────────────────────────────── */}
        <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-5 space-y-4">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">계약 조건 입력</h2>

          {/* 계약 유형 */}
          <div>
            <FieldLabel required>계약 유형</FieldLabel>
            <select
              value={form.contract_type}
              onChange={e => update('contract_type', e.target.value)}
              className={inputCls}
            >
              <option value="">유형 선택</option>
              {CONTRACT_TYPES.map(t => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>

          {/* 갑 / 을 */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <FieldLabel required>갑 (발주/위탁사)</FieldLabel>
              <input
                type="text"
                placeholder="회사명 또는 성명"
                value={form.party_a}
                onChange={e => update('party_a', e.target.value)}
                className={inputCls}
              />
            </div>
            <div>
              <FieldLabel required>을 (수주/수탁사)</FieldLabel>
              <input
                type="text"
                placeholder="회사명 또는 성명"
                value={form.party_b}
                onChange={e => update('party_b', e.target.value)}
                className={inputCls}
              />
            </div>
          </div>

          {/* 계약 목적 */}
          <div>
            <FieldLabel required>계약 목적 / 업무 범위</FieldLabel>
            <textarea
              rows={3}
              placeholder="예: 모바일 앱 UI/UX 디자인 및 퍼블리싱 용역"
              value={form.purpose}
              onChange={e => update('purpose', e.target.value)}
              className={`${inputCls} resize-none min-h-[80px]`}
            />
          </div>

          {/* 계약 금액 */}
          <div>
            <FieldLabel>계약 금액 (원)</FieldLabel>
            <input
              type="text"
              placeholder="예: 5,000,000"
              value={form.amount}
              onChange={e => update('amount', e.target.value)}
              className={inputCls}
            />
          </div>

          {/* 계약 기간 */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <FieldLabel>시작일</FieldLabel>
              <input
                type="date"
                value={form.start_date}
                onChange={e => update('start_date', e.target.value)}
                className={inputCls}
              />
            </div>
            <div>
              <FieldLabel>종료일</FieldLabel>
              <input
                type="date"
                value={form.end_date}
                onChange={e => update('end_date', e.target.value)}
                className={inputCls}
              />
            </div>
          </div>

          {/* 특이 사항 */}
          <div>
            <FieldLabel>특이 사항 (선택)</FieldLabel>
            <textarea
              rows={2}
              placeholder="추가 조건, 특약 사항 등 자유롭게 입력"
              value={form.extra}
              onChange={e => update('extra', e.target.value)}
              className={`${inputCls} resize-none min-h-[64px]`}
            />
          </div>

          <button
            onClick={handleGenerate}
            disabled={!isValid || loading}
            className="w-full flex items-center justify-center gap-2 py-2.5 text-sm font-medium
              bg-violet-600 text-white rounded-lg hover:bg-violet-700 disabled:opacity-50 min-h-[44px]"
          >
            {loading ? <><Spinner size={4} /> 생성 중...</> : '📄 계약서 초안 생성'}
          </button>
        </div>

        {/* ── 결과 영역 ──────────────────────────────────────── */}
        <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-5 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-gray-900 dark:text-white">생성된 계약서 초안</h2>
            {draft && (
              <button
                onClick={handleCopy}
                className="text-xs px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-600
                  text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 min-h-[32px]"
              >
                {copied ? '✓ 복사됨' : '복사'}
              </button>
            )}
          </div>

          {/* 로딩 */}
          {loading && (
            <div className="flex-1 flex items-center justify-center gap-2 text-gray-400 py-16">
              <Spinner size={5} /> <span className="text-sm">계약서를 작성하는 중...</span>
            </div>
          )}

          {/* 빈 상태 */}
          {!loading && !draft && (
            <div className="flex-1 flex flex-col items-center justify-center py-16 text-center">
              <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-3">
                <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </div>
              <p className="text-sm text-gray-400">좌측 조건을 입력하고 생성 버튼을 누르면<br />계약서 초안이 여기에 표시됩니다.</p>
            </div>
          )}

          {/* 결과 */}
          {!loading && draft && (
            <>
              <div className="flex-1 rounded-lg bg-gray-50 dark:bg-gray-800 p-4 overflow-auto max-h-[600px]">
                <pre className="text-xs text-gray-700 dark:text-gray-200 leading-relaxed whitespace-pre-wrap font-sans">
                  {draft}
                </pre>
              </div>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-3">
                ※ AI가 생성한 초안입니다. 반드시 법무 담당자의 최종 검토를 거친 후 사용하세요.
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
