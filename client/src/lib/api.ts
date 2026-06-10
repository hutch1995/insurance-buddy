import { supabase } from './supabase'
import type { BenefitCategory, Expense, Document, UserProfile } from '../types'

const BASE_URL = import.meta.env.VITE_API_URL as string

async function authHeaders(): Promise<HeadersInit> {
  const { data } = await supabase.auth.getSession()
  const token = data.session?.access_token
  return token ? { Authorization: `Bearer ${token}` } : {}
}

async function get<T>(path: string): Promise<T> {
  const headers = await authHeaders()
  const res = await fetch(`${BASE_URL}${path}`, { headers })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.error ?? `Request failed: ${res.status}`)
  }
  return res.json()
}

async function post<T>(path: string, body: unknown): Promise<T> {
  const headers = await authHeaders()
  const res = await fetch(`${BASE_URL}${path}`, {
    method: 'POST',
    headers: { ...headers, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    const b = await res.json().catch(() => ({}))
    throw new Error(b.error ?? `Request failed: ${res.status}`)
  }
  return res.json()
}

async function del(path: string): Promise<void> {
  const headers = await authHeaders()
  const res = await fetch(`${BASE_URL}${path}`, { method: 'DELETE', headers })
  if (!res.ok && res.status !== 204) {
    const b = await res.json().catch(() => ({}))
    throw new Error(b.error ?? `Request failed: ${res.status}`)
  }
}

export async function uploadDocument(
  file: File,
  docType: 'insurance' | 'wellness' | 'learning',
): Promise<{ document: Document; categories: BenefitCategory[]; warning?: string }> {
  const headers = await authHeaders()
  const formData = new FormData()
  formData.append('file', file)
  formData.append('doc_type', docType)
  const res = await fetch(`${BASE_URL}/documents/upload`, {
    method: 'POST',
    headers,
    body: formData,
  })
  if (!res.ok && res.status !== 207) {
    const b = await res.json().catch(() => ({}))
    throw new Error(b.error ?? `Upload failed: ${res.status}`)
  }
  return res.json()
}

export async function getProfile(): Promise<UserProfile | null> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single()
  return data
}

export async function updateProfile(updates: Partial<Pick<UserProfile, 'interests' | 'has_dependents' | 'onboarding_completed' | 'hidden_benefits'>>): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return
  await supabase.from('profiles').update(updates).eq('id', user.id)
}

export const api = {
  getDocuments: () => get<Document[]>('/documents'),
  getBenefits: () => get<BenefitCategory[]>('/benefits'),
  getExpenses: (categoryId?: string) =>
    get<Expense[]>(`/expenses${categoryId ? `?category_id=${categoryId}` : ''}`),
  createExpense: (data: {
    category_id: string
    amount: number
    description?: string
    expense_date: string
  }) => post<Expense>('/expenses', data),
  deleteExpense: (id: string) => del(`/expenses/${id}`),
}
