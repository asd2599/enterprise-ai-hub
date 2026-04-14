import { apiRequest } from './client'

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'
const PENDING_ENDPOINT =
  import.meta.env.VITE_AUTH_PENDING_ENDPOINT || '/api/auth/pending'
const EMPLOYEES_ENDPOINT =
  import.meta.env.VITE_AUTH_EMPLOYEES_ENDPOINT || '/api/auth/employees'
const APPROVE_ENDPOINT =
  import.meta.env.VITE_AUTH_APPROVE_ENDPOINT || '/api/auth/approve'
const REJECT_ENDPOINT =
  import.meta.env.VITE_AUTH_REJECT_ENDPOINT || '/api/auth/reject'
const ACCOUNT_DECISIONS_ENDPOINT =
  import.meta.env.VITE_AUTH_ACCOUNT_DECISIONS_ENDPOINT ||
  '/api/auth/account-decisions'

async function handleResponse(res) {
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: '알 수 없는 에러' }))
    throw new Error(err.detail || `HTTP ${res.status}`)
  }
  return res.json()
}

export async function getPendingEmployees() {
  const response = await apiRequest(PENDING_ENDPOINT)
  return response.json().catch(() => ({ total: 0, items: [] }))
}

export async function getEmployees() {
  const response = await apiRequest(EMPLOYEES_ENDPOINT)
  return response.json().catch(() => ({ total: 0, items: [] }))
}

export async function getAccountDecisions() {
  const response = await apiRequest(ACCOUNT_DECISIONS_ENDPOINT)
  return response.json().catch(() => ({ total: 0, items: [] }))
}

export async function approveEmployee(payload) {
  const response = await apiRequest(APPROVE_ENDPOINT, {
    method: 'POST',
    body: JSON.stringify(payload),
  })

  return response.json().catch(() => ({}))
}

export async function updateEmployeeDepartment(employeeId, payload) {
  const response = await apiRequest(
    `${EMPLOYEES_ENDPOINT}/${employeeId}/department`,
    {
      method: 'PUT',
      body: JSON.stringify(payload),
    },
  )

  return response.json().catch(() => ({}))
}

const DEFAULT_REJECT_REASON = '정보 불일치'

export async function rejectEmployee(employeeId, options = {}) {
  const reason = (options.reason ?? DEFAULT_REJECT_REASON).trim() || DEFAULT_REJECT_REASON
  const response = await apiRequest(REJECT_ENDPOINT, {
    method: 'POST',
    body: JSON.stringify({ employee_id: employeeId, reason }),
  })

  return response.json().catch(() => ({}))
}

export { DEFAULT_REJECT_REASON }

export async function getRegulationDocuments() {
  const res = await fetch(`${BASE_URL}/api/hr/regulations`)
  return handleResponse(res)
}

export async function getRegulationConflicts() {
  const res = await fetch(`${BASE_URL}/api/hr/regulations/conflicts`)
  return handleResponse(res)
}

export async function getRegulationStatus() {
  const res = await fetch(`${BASE_URL}/api/hr/regulations/status`)
  return handleResponse(res)
}

export async function getHrNotifications() {
  const res = await fetch(`${BASE_URL}/api/hr/notifications`)
  return handleResponse(res)
}

export async function markHrNotificationRead(notificationId) {
  const res = await fetch(
    `${BASE_URL}/api/hr/notifications/${notificationId}/read`,
    {
      method: 'POST',
    },
  )
  return handleResponse(res)
}

export async function markAllHrNotificationsRead(ids) {
  const res = await fetch(`${BASE_URL}/api/hr/notifications/read-all`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ids }),
  })
  return handleResponse(res)
}

export async function uploadRegulationFiles(files, uploader = {}) {
  const formData = new FormData()
  for (const file of files) {
    formData.append('files', file)
  }
  if (uploader.employee_id) formData.append('employee_id', uploader.employee_id)
  if (uploader.name) formData.append('uploader_name', uploader.name)
  if (uploader.department) formData.append('uploader_department', uploader.department)

  const res = await fetch(`${BASE_URL}/api/hr/regulations/upload`, {
    method: 'POST',
    body: formData,
  })
  return handleResponse(res)
}

export async function deleteRegulationDocument(documentId) {
  const res = await fetch(`${BASE_URL}/api/hr/regulations/${documentId}`, {
    method: 'DELETE',
  })
  return handleResponse(res)
}

export async function askRegulationQuestion(question) {
  const res = await fetch(`${BASE_URL}/api/hr/regulations/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ question }),
  })
  return handleResponse(res)
}

export async function getHireRequests() {
  const res = await fetch(`${BASE_URL}/api/hr/hire-requests`)
  return handleResponse(res)
}

export async function createHireRequest(payload) {
  const res = await fetch(`${BASE_URL}/api/hr/hire-requests`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  return handleResponse(res)
}

export async function generateJobPost(requestId) {
  const res = await fetch(`${BASE_URL}/api/hr/job-post/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ request_id: requestId }),
  })
  return handleResponse(res)
}

const ISSUED_EMPLOYEE_IDS_BASE = '/api/auth/issued-employee-ids'

export async function getIssueDepartmentCodes() {
  const response = await apiRequest(
    `${ISSUED_EMPLOYEE_IDS_BASE}/department-codes`,
  )
  return response.json().catch(() => ({ items: [] }))
}

/** 다음 발급에 쓰일 일련 3자리 목록 (count 1~200, 일괄 발급 총합과 동일 상한) */
export async function getUpcomingIssuedSerials(count = 1) {
  const n = Math.min(200, Math.max(1, Number(count) || 1))
  const response = await apiRequest(
    `${ISSUED_EMPLOYEE_IDS_BASE}/upcoming-serials?count=${n}`,
  )
  return response.json().catch(() => ({ count: 0, serials: [] }))
}

export async function generateIssuedEmployeeIds(count = 1, departmentCode) {
  const response = await apiRequest(`${ISSUED_EMPLOYEE_IDS_BASE}/generate`, {
    method: 'POST',
    body: JSON.stringify({
      count,
      department_code: String(departmentCode || '').trim().toUpperCase(),
    }),
  })
  return response.json().catch(() => ({ total: 0, items: [] }))
}

/** batches: [{ department_code, count }, ...] — 여러 부서·건수를 한 번에 발급 */
export async function generateIssuedEmployeeIdsBatch(batches) {
  const response = await apiRequest(
    `${ISSUED_EMPLOYEE_IDS_BASE}/generate-batch`,
    {
      method: 'POST',
      body: JSON.stringify({ batches }),
    },
  )
  return response.json().catch(() => ({ total: 0, items: [], summary: [] }))
}

export async function getIssuedEmployeeIds() {
  const response = await apiRequest(ISSUED_EMPLOYEE_IDS_BASE)
  return response.json().catch(() => ({ total: 0, items: [] }))
}

/** 미사용(가입 전) 발급 사번만 삭제 — 전역 일련 카운터는 줄지 않음 */
export async function deleteIssuedEmployeeId(employeeId) {
  const enc = encodeURIComponent(String(employeeId || '').trim())
  const response = await apiRequest(`${ISSUED_EMPLOYEE_IDS_BASE}/${enc}`, {
    method: 'DELETE',
  })
  return response.json().catch(() => ({}))
}
