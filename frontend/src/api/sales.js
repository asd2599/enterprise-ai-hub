// 영업/영업관리 관련 API 호출 — 모든 sales 요청은 이 파일에서 관리
const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

async function handleResponse(res) {
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: '알 수 없는 에러' }))
    throw new Error(err.detail || `HTTP ${res.status}`)
  }
  return res.json()
}

/**
 * 고객사 맞춤형 영업 제안서 초안 생성
 * @param {{
 *   company_name: string,
 *   industry: '제조업'|'유통·서비스'|'IT',
 *   company_size?: string,
 *   key_needs: string
 * }} params
 * @returns {{
 *   executive_summary, situation_analysis, pain_points,
 *   solution, expected_benefits, success_case,
 *   implementation_schedule, investment, email_draft
 * }}
 */
export async function generateProposal(params) {
  const res = await fetch(`${BASE_URL}/api/sales/proposal/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  })
  return handleResponse(res)
}

/**
 * 팀원 목록 조회
 * @param {string} [periodKey] — 특정 기간에 등록된 팀원만 반환
 * @returns {Array<{ id: string, name: string }>}
 */
export async function getTeamMembers(periodKey = '') {
  const qs = periodKey ? `?period_key=${encodeURIComponent(periodKey)}` : ''
  const res = await fetch(`${BASE_URL}/api/sales/performance/members${qs}`)
  return handleResponse(res)
}

/**
 * 분석 가능 기간 목록 (DB에 등록된 period 최신순)
 * @param {'' | 'month' | 'quarter' | 'year'} [periodType]
 * @returns {Array<{ period_key, period_label, period_type, start_date, end_date }>}
 */
export async function listPerformancePeriods(periodType = '') {
  const qs = periodType ? `?period_type=${encodeURIComponent(periodType)}` : ''
  const res = await fetch(`${BASE_URL}/api/sales/performance/periods${qs}`)
  return handleResponse(res)
}

/**
 * 영업 실적 분석 리포트 생성
 * @param {{ period_key: string, member_id?: string }} params
 */
export async function analyzePerformance(params) {
  const res = await fetch(`${BASE_URL}/api/sales/performance/analyze`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  })
  return handleResponse(res)
}

/**
 * 영업 실적 등록 (같은 period_key면 덮어쓰기)
 * @param {{
 *   period_type: 'month'|'quarter'|'year',
 *   year: number,
 *   value?: number,
 *   target_revenue: number,
 *   actual_revenue: number,
 *   prev_revenue?: number,
 *   deal_count?: number,
 *   win_count?: number,
 *   note?: string,
 *   pipeline: Array<{stage_order,stage_name,stage_count,stage_amount}>,
 *   members:  Array<{member_name,revenue,deals,wins}>,
 *   created_by?: string,
 *   created_by_name?: string,
 * }} params
 */
export async function savePerformanceEntry(params) {
  const res = await fetch(`${BASE_URL}/api/sales/performance/entry`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  })
  return handleResponse(res)
}

/**
 * 등록된 실적 원본 조회 (수정 화면 프리필)
 * @param {string} periodKey
 */
export async function getPerformanceEntry(periodKey) {
  const res = await fetch(`${BASE_URL}/api/sales/performance/entry/${encodeURIComponent(periodKey)}`)
  return handleResponse(res)
}

/**
 * 등록된 실적 삭제
 * @param {string} periodKey
 */
export async function deletePerformanceEntry(periodKey) {
  const res = await fetch(`${BASE_URL}/api/sales/performance/entry/${encodeURIComponent(periodKey)}`, {
    method: 'DELETE',
  })
  return handleResponse(res)
}

/**
 * 고객 미팅 요약 생성
 * @param {{
 *   company_name: string,
 *   meeting_date: string,
 *   meeting_notes: string
 * }} params
 * @returns {{
 *   meeting_title, key_discussions, customer_needs,
 *   concerns, action_items, next_agenda, crm_draft
 * }}
 */
export async function summarizeMeeting(params) {
  const res = await fetch(`${BASE_URL}/api/sales/meeting/summarize`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  })
  return handleResponse(res)
}

/**
 * 미팅 녹취 오디오 파일을 텍스트로 변환 (Whisper STT)
 * @param {File} file - 오디오 파일 (mp3, m4a, wav, webm, ogg, mp4 등)
 * @returns {{ text: string }}
 */
export async function transcribeMeetingAudio(file) {
  const formData = new FormData()
  formData.append('file', file)
  const res = await fetch(`${BASE_URL}/api/sales/meeting/transcribe`, {
    method: 'POST',
    body: formData,
  })
  return handleResponse(res)
}

/**
 * CRM 초안을 mock CRM 저장소에 저장 (원클릭 반영)
 * @param {{
 *   company_name: string,
 *   meeting_date?: string,
 *   opportunity_name: string,
 *   stage: string,
 *   next_step?: string,
 *   contact_role?: string,
 *   description?: string,
 *   owner_id?: string,
 *   owner_name?: string
 * }} params
 * @returns {{ id, created_at, owner_id, owner_name, ...params }}
 */
export async function saveCrmOpportunity(params) {
  const res = await fetch(`${BASE_URL}/api/sales/meeting/crm-save`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  })
  return handleResponse(res)
}

/**
 * 영업 기회 목록 조회 (필터 지원)
 * @param {{
 *   ownerId?: string,     // 특정 사원만 (빈 문자열이면 전원)
 *   companyName?: string, // 고객사명 부분 일치
 *   search?: string,      // 자유 검색
 *   offset?: number,
 *   limit?: number
 * }} [params]
 * @returns {{ items: Array, total: number, offset: number, limit: number }}
 */
export async function listCrmOpportunities({
  ownerId     = '',
  companyName = '',
  search      = '',
  offset      = 0,
  limit       = 10,
} = {}) {
  const qs = new URLSearchParams()
  if (ownerId)     qs.set('owner_id',     ownerId)
  if (companyName) qs.set('company_name', companyName)
  if (search)      qs.set('search',       search)
  qs.set('offset', String(offset))
  qs.set('limit',  String(limit))
  const res = await fetch(`${BASE_URL}/api/sales/meeting/crm-list?${qs.toString()}`)
  return handleResponse(res)
}
