import { apiRequest } from './client'

const LOGIN_ENDPOINT = import.meta.env.VITE_AUTH_LOGIN_ENDPOINT || '/api/auth/login'
const REGISTER_ENDPOINT =
  import.meta.env.VITE_AUTH_REGISTER_ENDPOINT || '/api/auth/register'
const PENDING_ENDPOINT =
  import.meta.env.VITE_AUTH_PENDING_ENDPOINT || '/api/auth/pending'
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

export async function approveEmployee(payload) {
  const response = await apiRequest(APPROVE_ENDPOINT, {
    method: 'POST',
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
