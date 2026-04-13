// 마케팅 관련 API 호출 — 모든 marketing 요청은 이 파일에서 관리
const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

async function handleResponse(res) {
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: '알 수 없는 에러' }))
    throw new Error(err.detail || `HTTP ${res.status}`)
  }
  return res.json()
}

/**
 * 광고 카피 A/B/C 3종 + 슬로건 + 배너 문구 생성
 * @param {{
 *   product_name: string,
 *   features: string,
 *   goal: '인지'|'전환'|'리텐션',
 *   persona?: string,
 *   channel?: string,
 *   tone?: '공식체'|'친근체'|'MZ감성'
 * }} params
 * @returns {{
 *   versions: Array<{ label: string, style: string, headline: string, subcopy: string, cta: string }>,
 *   slogans: string[],
 *   banner: string
 * }}
 */
export async function generateCopy(params) {
  const res = await fetch(`${BASE_URL}/api/marketing/copy/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  })
  return handleResponse(res)
}
