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

export async function rejectEmployee(employeeId) {
  const response = await apiRequest(`${REJECT_ENDPOINT}/${employeeId}`, {
    method: 'DELETE',
  })

  return response.json().catch(() => ({}))
}

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
