/**
 * AI Health Guardian v2 — API Client
 * Connects to FastAPI backend with full personalization support
 */
import axios from 'axios'

const BASE = import.meta.env.VITE_API_URL || '/api'

const api = axios.create({
  baseURL: BASE,
  timeout: 20000,
  headers: { 'Content-Type': 'application/json' },
})

// ── Request interceptor: add session ID ───────
api.interceptors.request.use((config) => {
  const sessionId = localStorage.getItem('ahg_session_id') || crypto.randomUUID()
  localStorage.setItem('ahg_session_id', sessionId)
  config.headers['X-Session-ID'] = sessionId
  return config
})

// ── Response interceptor: handle errors ───────
api.interceptors.response.use(
  (res) => res,
  (err) => {
    const msg = err.response?.data?.detail || err.message || 'Network error'
    console.error('API error:', msg)
    return Promise.reject(new Error(msg))
  }
)

// ── Symptoms ──────────────────────────────────
export const analyzeSymptoms = (data) =>
  api.post('/symptoms/analyze', data).then((r) => r.data)

export const listSymptoms = () =>
  api.get('/symptoms/list').then((r) => r.data)

// ── Medicines ─────────────────────────────────
export const getMedicineInfo = (name, params = {}) =>
  api.get(`/medicines/info/${encodeURIComponent(name)}`, { params }).then((r) => r.data)

export const searchMedicines = (q) =>
  api.get('/medicines/search', { params: { q } }).then((r) => r.data)

// ── Interactions ──────────────────────────────
export const checkInteractions = (data) =>
  api.post('/interactions/check', data).then((r) => r.data)

// ── Alternatives ──────────────────────────────
export const findAlternatives = (medicine_name, budget = null) =>
  api.post('/alternatives/find', { medicine_name, budget }).then((r) => r.data)

// ── Remedies ──────────────────────────────────
export const getRemedies = (symptoms, prefer_ayurvedic = false) =>
  api.post('/remedies/suggest', { symptoms, prefer_ayurvedic }).then((r) => r.data)

// ── Prices ────────────────────────────────────
export const comparePrices = (name) =>
  api.get(`/prices/compare/${encodeURIComponent(name)}`).then((r) => r.data)

// ── Scanner ───────────────────────────────────
export const scanMedicineImage = (file, userProfile = null) => {
  const form = new FormData()
  form.append('file', file)
  if (userProfile) form.append('user_profile', JSON.stringify(userProfile))
  return api.post('/scanner/image', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }).then((r) => r.data)
}

export const scanByName = (medicine_name, userProfile = null) => {
  const form = new FormData()
  form.append('medicine_name', medicine_name)
  if (userProfile) form.append('user_profile', JSON.stringify(userProfile))
  return api.post('/scanner/name', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }).then((r) => r.data)
}

export const scanBarcode = (barcode) =>
  api.get(`/scanner/barcode/${barcode}`).then((r) => r.data)

// ── Chat ──────────────────────────────────────
export const sendChatMessage = (messages, userProfile = null, maxTokens = 1000) =>
  api.post('/chat/message', {
    messages,
    user_profile: userProfile,
    max_tokens: maxTokens,
  }).then((r) => r.data)

export const getChatStatus = () =>
  api.get('/chat/status').then((r) => r.data)

// ── Profile ───────────────────────────────────
export const saveProfile = (profileData) =>
  api.post('/profile/save', profileData).then((r) => r.data)

export const getProfile = (sessionId) =>
  api.get(`/profile/${sessionId}`).then((r) => r.data)

// ── Stores ────────────────────────────────────
export const searchStores = (params) =>
  api.get('/stores/search', { params }).then((r) => r.data)

export const getEmergencyContacts = () =>
  api.get('/stores/emergency').then((r) => r.data)

export const getJanAushadhiInfo = () =>
  api.get('/stores/jan-aushadhi/products').then((r) => r.data)

// ── Health check ──────────────────────────────
export const healthCheck = () =>
  api.get('/health').then((r) => r.data)

export default api
