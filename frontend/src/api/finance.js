// 재무 관련 API 호출 — 모든 finance 요청은 이 파일에서 관리
const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

async function handleResponse(res) {
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: '알 수 없는 에러' }))
    throw new Error(err.error || `HTTP ${res.status}`)
  }
  return res.json()
}

/**
 * 영수증 OCR 분석 (DB 저장 없음)
 * @param {File} file
 * @returns {{ receipt_date, vendor, items: Array }}
 */
export async function analyzeReceipt(file) {
  const formData = new FormData()
  formData.append('file', file)
  const res = await fetch(`${BASE_URL}/api/finance/ocr`, { method: 'POST', body: formData })
  return handleResponse(res)
}

/**
 * 분석 결과를 DB에 저장
 * @param {{ receipt_date, vendor, items: Array }} data
 * @returns {{ saved: Array }}
 */
export async function saveTransactions(data) {
  const res = await fetch(`${BASE_URL}/api/finance/transactions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  return handleResponse(res)
}

/**
 * DB 전표 내역 조회
 * @param {{ limit?, offset?, account_code?, date_from?, date_to? }} params
 * @returns {{ total: number, items: Array }}
 */
export async function getTransactions(params = {}) {
  const qs = new URLSearchParams(
    Object.fromEntries(Object.entries(params).filter(([, v]) => v != null && v !== ''))
  ).toString()
  const res = await fetch(`${BASE_URL}/api/finance/transactions${qs ? '?' + qs : ''}`)
  return handleResponse(res)
}
