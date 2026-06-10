import { useState, FormEvent } from 'react'
import { updateProfile } from '../lib/api'
import InterestSelector from './InterestSelector'

interface Props {
  onComplete: () => void
}

export default function OnboardingModal({ onComplete }: Props) {
  const [selectedInterests, setSelectedInterests] = useState<string[]>([])
  const [hasDependents, setHasDependents] = useState<boolean | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (hasDependents === null) {
      setError('Please answer the dependents question')
      return
    }
    setSaving(true)
    try {
      await updateProfile({
        interests: selectedInterests,
        has_dependents: hasDependents,
        onboarding_completed: true,
      })
      onComplete()
    } catch {
      setError('Failed to save preferences. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  async function handleSkip() {
    await updateProfile({ onboarding_completed: true })
    onComplete()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-xl bg-white rounded-2xl shadow-xl p-8 max-h-[90vh] overflow-y-auto">
        <div className="mb-6">
          <h2 className="text-xl font-bold text-gray-900">Welcome to Insurance Buddy!</h2>
          <p className="mt-1 text-sm text-gray-500">
            Select the benefits you want to track. Expand a category to choose specific items.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <p className="text-sm font-semibold text-gray-800 mb-3">
              Which benefits are you interested in?
              <span className="ml-1 text-xs font-normal text-gray-400">(select all that apply)</span>
            </p>
            <InterestSelector selected={selectedInterests} onChange={setSelectedInterests} />
          </div>

          <div>
            <p className="text-sm font-semibold text-gray-800 mb-3">
              Do you have dependents under 18?
            </p>
            <div className="flex gap-3">
              {[{ value: true, label: 'Yes' }, { value: false, label: 'No' }].map(({ value, label }) => (
                <button
                  key={label}
                  type="button"
                  onClick={() => setHasDependents(value)}
                  className={`flex-1 py-2 rounded-lg border text-sm font-medium transition-colors ${
                    hasDependents === value
                      ? 'bg-indigo-50 border-indigo-400 text-indigo-800'
                      : 'border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
            {hasDependents && (
              <p className="mt-2 text-xs text-gray-500">
                Dental and vision coverage for dependents under 18 will be shown if your insurance document includes it.
              </p>
            )}
          </div>

          {error && <p className="text-red-600 text-sm">{error}</p>}

          <div className="flex flex-col gap-2">
            <button
              type="submit"
              disabled={saving}
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors"
            >
              {saving ? 'Saving…' : 'Save and go to dashboard'}
            </button>
            <button
              type="button"
              onClick={handleSkip}
              className="w-full text-center text-sm text-gray-400 hover:text-gray-600 py-1"
            >
              Skip for now
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
