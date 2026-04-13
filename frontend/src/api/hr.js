const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

async function handleResponse(res) {
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: '알 수 없는 에러' }))
    throw new Error(err.detail || `HTTP ${res.status}`)
  }
  return res.json()
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
  const res = await fetch(`${BASE_URL}/api/hr/notifications/${notificationId}/read`, {
    method: 'POST',
  })
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
