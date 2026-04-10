// 재무 관련 API 호출 — 모든 finance 요청은 이 파일에서 관리
const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

async function handleResponse(res) {
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: '알 수 없는 에러' }))
    throw new Error(err.detail || err.error || `HTTP ${res.status}`)
  }
  return res.json()
}

/**
 * 영수증 OCR 분석 — 이미지 저장 + 분석 + 중복 탐지
 * @param {File} file
 * @returns {{ receipt_date, vendor, image_path, items, has_duplicates }}
 */
export async function analyzeReceipt(file) {
  const formData = new FormData()
  formData.append('file', file)
  const res = await fetch(`${BASE_URL}/api/finance/ocr`, { method: 'POST', body: formData })
  return handleResponse(res)
}

/**
 * 분석 결과를 DB에 저장
 * @param {{ receipt_date, vendor, image_path, items }} data
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
 * @param {{ limit?, offset?, account_code?, status?, date_from?, date_to? }} params
 * @returns {{ total: number, items: Array }}
 */
export async function getTransactions(params = {}) {
  const qs = new URLSearchParams(
    Object.fromEntries(Object.entries(params).filter(([, v]) => v != null && v !== ''))
  ).toString()
  const res = await fetch(`${BASE_URL}/api/finance/transactions${qs ? '?' + qs : ''}`)
  return handleResponse(res)
}

/**
 * 전표 수정 (계정과목, 금액, 부가세, 적요)
 * @param {number} id
 * @param {{ account_code?, amount?, tax_amount?, memo? }} data
 */
export async function updateTransaction(id, data) {
  const res = await fetch(`${BASE_URL}/api/finance/transactions/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  return handleResponse(res)
}

/**
 * 전표 최종 확정 (status → confirmed)
 * @param {number} id
 */
export async function confirmTransaction(id) {
  const res = await fetch(`${BASE_URL}/api/finance/transactions/${id}/confirm`, {
    method: 'POST',
  })
  return handleResponse(res)
}

/**
 * 확정 전표 엑셀 다운로드
 */
export async function exportConfirmedExcel() {
  const res = await fetch(`${BASE_URL}/api/finance/transactions/export`)
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: '다운로드 실패' }))
    throw new Error(err.detail || `HTTP ${res.status}`)
  }
  const blob = await res.blob()
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.href     = url
  a.download = '확정전표.xlsx'
  a.click()
  URL.revokeObjectURL(url)
}

/**
 * AI 계정과목 추천
 * @param {string} vendor  가맹점명
 * @param {string} notes   지출내역/비고
 * @returns {{ account_code: string }}
 */
export async function suggestAccountCode(vendor, notes) {
  const res = await fetch(`${BASE_URL}/api/finance/suggest-account`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ vendor, notes }),
  })
  return handleResponse(res)
}

/**
 * 업로드 이미지 URL 반환
 * @param {string|null} imagePath  — DB에 저장된 경로 (예: "uploads/2024-01-01_abc12345.jpg")
 */
export function getImageUrl(imagePath) {
  if (!imagePath) return null
  return `${BASE_URL}/${imagePath}`
}
