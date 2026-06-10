import { useState, useEffect, useRef, FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { uploadDocument, getProfile, updateProfile } from '../lib/api'
import { api } from '../lib/api'
import { matchesInterest } from '../lib/interests'
import InterestSelector from '../components/InterestSelector'
import type { DocType, Document, HiddenBenefit } from '../types'

const DOC_SLOTS: { type: DocType; label: string; description: string }[] = [
  {
    type: 'insurance',
    label: 'Health Insurance',
    description: 'Your employer health/dental/vision benefit booklet',
  },
  {
    type: 'wellness',
    label: 'Wellness Benefits',
    description: 'Wellness spending account or fitness reimbursement document',
  },
  {
    type: 'learning',
    label: 'Learning & Development',
    description: 'L&D budget policy or professional development guidelines',
  },
]

type UploadStatus = 'idle' | 'uploading' | 'analyzing' | 'done' | 'error'

interface SlotState {
  status: UploadStatus
  errorMsg?: string
  document?: Document
}

export default function Profile() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [pwError, setPwError] = useState<string | null>(null)
  const [pwSuccess, setPwSuccess] = useState(false)
  const [pwLoading, setPwLoading] = useState(false)

  const [selectedInterests, setSelectedInterests] = useState<string[]>([])
  const [hasDependents, setHasDependents] = useState(false)
  const [prefsSaved, setPrefsSaved] = useState(false)
  const [prefsSaving, setPrefsSaving] = useState(false)

  const [slots, setSlots] = useState<Record<DocType, SlotState>>({
    insurance: { status: 'idle' },
    wellness: { status: 'idle' },
    learning: { status: 'idle' },
  })

  const fileRefs = {
    insurance: useRef<HTMLInputElement>(null),
    wellness: useRef<HTMLInputElement>(null),
    learning: useRef<HTMLInputElement>(null),
  }

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setEmail(data.user?.email ?? '')
    })
    getProfile().then((p) => {
      if (p) {
        setSelectedInterests(p.interests)
        setHasDependents(p.has_dependents)
      }
    })

    api.getDocuments().then((docs) => {
      const update: Partial<Record<DocType, SlotState>> = {}
      for (const doc of docs) {
        update[doc.doc_type as DocType] = {
          status: doc.analyzed_at ? 'done' : 'idle',
          document: doc,
        }
      }
      setSlots((prev) => ({ ...prev, ...update }))
    })
  }, [])

  function setSlot(docType: DocType, patch: Partial<SlotState>) {
    setSlots((prev) => ({ ...prev, [docType]: { ...prev[docType], ...patch } }))
  }

  async function handleFileChange(docType: DocType, file: File | undefined) {
    if (!file) return
    setSlot(docType, { status: 'uploading', errorMsg: undefined })
    try {
      setSlot(docType, { status: 'analyzing' })
      const result = await uploadDocument(file, docType)
      setSlot(docType, { status: 'done', document: result.document })

      // Auto-hide categories that don't match user's interests
      if (selectedInterests.length > 0 && result.categories.length > 0) {
        const profile = await getProfile()
        const existingHidden: HiddenBenefit[] = profile?.hidden_benefits ?? []
        // Remove old hidden entries for this doc type, then re-apply interests filter
        const otherHidden = existingHidden.filter((h) => h.doc_type !== docType)
        const newHidden: HiddenBenefit[] = result.categories
          .filter((c) => !matchesInterest(c.name, selectedInterests))
          .map((c) => ({ doc_type: docType, name: c.name }))
        await updateProfile({ hidden_benefits: [...otherHidden, ...newHidden] })
      }
    } catch (err) {
      setSlot(docType, {
        status: 'error',
        errorMsg: err instanceof Error ? err.message : 'Upload failed',
      })
    }
  }

  async function handlePasswordChange(e: FormEvent) {
    e.preventDefault()
    setPwError(null)
    setPwSuccess(false)

    if (newPassword !== confirmPassword) {
      setPwError('Passwords do not match')
      return
    }
    if (newPassword.length < 8) {
      setPwError('Password must be at least 8 characters')
      return
    }

    setPwLoading(true)
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    setPwLoading(false)

    if (error) {
      setPwError(error.message)
    } else {
      setPwSuccess(true)
      setNewPassword('')
      setConfirmPassword('')
    }
  }

  async function handleLogout() {
    await supabase.auth.signOut()
    navigate('/login')
  }

  async function handleSavePreferences() {
    setPrefsSaving(true)
    setPrefsSaved(false)
    await updateProfile({ interests: selectedInterests, has_dependents: hasDependents })
    setPrefsSaving(false)
    setPrefsSaved(true)
    setTimeout(() => setPrefsSaved(false), 3000)
  }

  function statusBadge(state: SlotState, docName: string | null | undefined) {
    if (state.status === 'uploading') return <span className="text-xs text-blue-600 font-medium">Uploading…</span>
    if (state.status === 'analyzing') return <span className="text-xs text-amber-600 font-medium">Analyzing…</span>
    if (state.status === 'done') return (
      <span className="text-xs text-green-700 font-medium bg-green-50 px-2 py-0.5 rounded-full">
        Analyzed ✓{docName ? ` — ${docName}` : ''}
      </span>
    )
    if (state.status === 'error') return <span className="text-xs text-red-600">{state.errorMsg}</span>
    if (state.document && !state.document.analyzed_at) {
      return <span className="text-xs text-gray-500 font-medium">{state.document.original_name ?? 'Uploaded'}</span>
    }
    return <span className="text-xs text-gray-400">Not uploaded</span>
  }

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Profile</h1>
        <p className="text-sm text-gray-500 mt-1">{email}</p>
      </div>

      {/* Preferences */}
      <section className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 mb-6">
        <h2 className="text-base font-semibold text-gray-900 mb-1">Benefit Preferences</h2>
        <p className="text-sm text-gray-500 mb-4">
          Select which benefit types you want to track. Your dashboard will only show matching categories.
        </p>
        <div className="mb-4">
          <InterestSelector selected={selectedInterests} onChange={setSelectedInterests} />
        </div>
        <div className="mb-4">
          <p className="text-sm font-medium text-gray-700 mb-2">Do you have dependents under 18?</p>
          <div className="flex gap-3">
            {[{ value: true, label: 'Yes' }, { value: false, label: 'No' }].map(({ value, label }) => (
              <button
                key={label}
                type="button"
                onClick={() => setHasDependents(value)}
                className={`px-6 py-2 rounded-lg border text-sm font-medium transition-colors ${
                  hasDependents === value
                    ? 'bg-indigo-50 border-indigo-400 text-indigo-800'
                    : 'border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
        <button
          onClick={handleSavePreferences}
          disabled={prefsSaving}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors"
        >
          {prefsSaving ? 'Saving…' : 'Save preferences'}
        </button>
        {prefsSaved && <span className="ml-3 text-sm text-green-600">Saved!</span>}
      </section>

      {/* Document Uploads */}
      <section className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 mb-6">
        <h2 className="text-base font-semibold text-gray-900 mb-1">Benefit Documents</h2>
        <p className="text-sm text-gray-500 mb-4">
          Upload your benefit booklets. Each document is automatically analyzed to extract your benefit categories and limits.
        </p>
        <div className="space-y-4">
          {DOC_SLOTS.map(({ type, label, description }) => {
            const state = slots[type]
            const isProcessing = state.status === 'uploading' || state.status === 'analyzing'
            return (
              <div key={type} className="flex items-center justify-between gap-4 p-4 rounded-lg border border-gray-100 bg-gray-50">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800">{label}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{description}</p>
                  <div className="mt-1">
                    {statusBadge(state, state.document?.original_name)}
                  </div>
                </div>
                <div>
                  <input
                    ref={fileRefs[type]}
                    type="file"
                    accept=".pdf,image/*"
                    className="hidden"
                    onChange={(e) => handleFileChange(type, e.target.files?.[0])}
                  />
                  <button
                    onClick={() => fileRefs[type].current?.click()}
                    disabled={isProcessing}
                    className="px-3 py-1.5 text-xs font-medium bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-lg transition-colors whitespace-nowrap"
                  >
                    {state.document ? 'Re-upload' : 'Upload'}
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      </section>

      {/* Change Password */}
      <section className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 mb-6">
        <h2 className="text-base font-semibold text-gray-900 mb-4">Change Password</h2>
        <form onSubmit={handlePasswordChange} className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">New password</label>
            <input
              type="password"
              required
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Min 8 characters"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Confirm new password</label>
            <input
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="••••••••"
            />
          </div>
          {pwError && <p className="text-red-600 text-sm">{pwError}</p>}
          {pwSuccess && <p className="text-green-600 text-sm">Password updated successfully.</p>}
          <button
            type="submit"
            disabled={pwLoading}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors"
          >
            {pwLoading ? 'Updating…' : 'Update password'}
          </button>
        </form>
      </section>

      {/* Logout */}
      <section className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <h2 className="text-base font-semibold text-gray-900 mb-1">Sign out</h2>
        <p className="text-sm text-gray-500 mb-4">Sign out of your Insurance Buddy account.</p>
        <button
          onClick={handleLogout}
          className="px-4 py-2 bg-red-50 hover:bg-red-100 text-red-700 text-sm font-medium rounded-lg transition-colors"
        >
          Sign out
        </button>
      </section>
    </div>
  )
}
