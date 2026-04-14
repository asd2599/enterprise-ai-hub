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
 * @returns {Array<{ id: string, name: string }>}
 */
export async function getTeamMembers() {
  const res = await fetch(`${BASE_URL}/api/sales/performance/members`)
  return handleResponse(res)
}

/**
 * 영업 실적 분석 리포트 생성
 * @param {{
 *   period: '이번 달'|'이번 분기'|'올해',
 *   member_id?: string
 * }} params
 * @returns {{
 *   metrics, pipeline, members,
 *   summary, achievement_comment, anomalies,
 *   pipeline_insight, top_performer, risk_deals, recommendations
 * }}
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
