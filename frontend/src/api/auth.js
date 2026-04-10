import { apiRequest } from './client'

const LOGIN_ENDPOINT = import.meta.env.VITE_AUTH_LOGIN_ENDPOINT || '/api/auth/login'
const REGISTER_ENDPOINT =
  import.meta.env.VITE_AUTH_REGISTER_ENDPOINT || '/api/auth/register'
const PENDING_ENDPOINT =
  import.meta.env.VITE_AUTH_PENDING_ENDPOINT || '/api/auth/pending'
const EMPLOYEES_ENDPOINT =
  import.meta.env.VITE_AUTH_EMPLOYEES_ENDPOINT || '/api/auth/employees'
const APPROVE_ENDPOINT =
  import.meta.env.VITE_AUTH_APPROVE_ENDPOINT || '/api/auth/approve'
const REJECT_ENDPOINT =
  import.meta.env.VITE_AUTH_REJECT_ENDPOINT || '/api/auth/reject'
const PROFILE_ENDPOINT =
  import.meta.env.VITE_AUTH_PROFILE_ENDPOINT || '/api/auth/profile'
const AUTH_STORAGE_KEY = 'hm-auth-session'

export async function loginEmployee(payload) {
  const response = await apiRequest(LOGIN_ENDPOINT, {
    method: 'POST',
    body: JSON.stringify(payload),
  })

  return response.json().catch(() => ({}))
}

export async function registerEmployee(payload) {
  const response = await apiRequest(REGISTER_ENDPOINT, {
    method: 'POST',
    body: JSON.stringify(payload),
  })

  return response.json().catch(() => ({}))
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
  const response = await apiRequest(`${EMPLOYEES_ENDPOINT}/${employeeId}/department`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  })

  return response.json().catch(() => ({}))
}

export async function rejectEmployee(employeeId) {
  const response = await apiRequest(`${REJECT_ENDPOINT}/${employeeId}`, {
    method: 'DELETE',
  })

  return response.json().catch(() => ({}))
}

export async function getMyProfile(employeeId) {
  const response = await apiRequest(`${PROFILE_ENDPOINT}/${employeeId}`)
  return response.json().catch(() => ({}))
}

export async function updateMyProfile(payload) {
  const response = await apiRequest(PROFILE_ENDPOINT, {
    method: 'PUT',
    body: JSON.stringify(payload),
  })

  return response.json().catch(() => ({}))
}

export function getAuthSession() {
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function saveAuthSession(data) {
  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(data))
  window.dispatchEvent(new Event('auth-session-changed'))
}

export function clearAuthSession() {
  localStorage.removeItem(AUTH_STORAGE_KEY)
  window.dispatchEvent(new Event('auth-session-changed'))
}

function getSessionSnapshot(session) {
  if (!session?.employee) return ''

  return JSON.stringify({
    approval_status: session.approval_status || '',
    employee: {
      employee_id: session.employee.employee_id || '',
      name: session.employee.name || '',
      email: session.employee.email || '',
      phone_number: session.employee.phone_number || '',
      birth_date: session.employee.birth_date || '',
      nickname: session.employee.nickname || '',
      department: session.employee.department || '',
      position: session.employee.position || '',
      is_verified: Boolean(session.employee.is_verified),
      is_active: Boolean(session.employee.is_active),
    },
  })
}

export async function refreshAuthSession() {
  const currentSession = getAuthSession()
  const employeeId = currentSession?.employee?.employee_id?.trim()

  if (!employeeId) {
    return null
  }

  const data = await getMyProfile(employeeId)
  const nextSession = {
    ...currentSession,
    employee: {
      ...currentSession.employee,
      ...data.employee,
    },
    approval_status: data.approval_status,
  }

  if (getSessionSnapshot(currentSession) !== getSessionSnapshot(nextSession)) {
    saveAuthSession(nextSession)
  }

  return nextSession
}
