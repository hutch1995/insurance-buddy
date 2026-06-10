import { useState, useEffect, useCallback } from 'react'
import { useBenefits } from '../hooks/useBenefits'
import { getProfile, updateProfile } from '../lib/api'
import AddCardModal from '../components/AddCardModal'
import type { BenefitCategory, DocType, HiddenBenefit } from '../types'

const DOC_TYPE_LABELS: Record<DocType, string> = {
  insurance: 'Health Insurance',
  wellness: 'Wellness Benefits',
  learning: 'Learning & Development',
}

const DOC_TYPE_COLORS: Record<DocType, { bg: string; text: string; bar: string }> = {
  insurance: { bg: 'bg-blue-50', text: 'text-blue-700', bar: 'bg-blue-500' },
  wellness: { bg: 'bg-green-50', text: 'text-green-700', bar: 'bg-green-500' },
  learning: { bg: 'bg-purple-50', text: 'text-purple-700', bar: 'bg-purple-500' },
}

function HideIcon() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88L6.59 6.59m7.532 7.532l3.293 3.293M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
    </svg>
  )
}

interface BenefitCardProps {
  benefit: BenefitCategory
  onHide: (benefit: BenefitCategory) => void
}

function BenefitCard({ benefit, onHide }: BenefitCardProps) {
  const colors = DOC_TYPE_COLORS[benefit.doc_type as DocType]
  const isGrouped = !!benefit.category_group
  const effectiveTotal = isGrouped ? benefit.category_group_total : benefit.total_amount
  const effectiveSpent = benefit.spent
  const pct = effectiveTotal && effectiveTotal > 0
    ? Math.min(100, (effectiveSpent / effectiveTotal) * 100)
    : 0

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm relative group">
      <button
        onClick={() => onHide(benefit)}
        title="Hide this card"
        className="absolute top-3 right-3 text-gray-300 hover:text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <HideIcon />
      </button>

      <div className="flex items-start justify-between gap-2 mb-3 pr-5">
        <div>
          <span className={`inline-block text-xs font-medium px-2 py-0.5 rounded-full mb-1 ${colors.bg} ${colors.text}`}>
            {DOC_TYPE_LABELS[benefit.doc_type as DocType]}
          </span>
          <h3 className="text-sm font-semibold text-gray-900">{benefit.name}</h3>
          {isGrouped && (
            <p className="text-xs text-gray-400 mt-0.5">Part of {benefit.category_group}</p>
          )}
        </div>
        {effectiveTotal != null && (
          <span className="text-sm font-bold text-gray-900 whitespace-nowrap">
            ${Math.max(0, effectiveTotal - effectiveSpent).toFixed(2)}{' '}
            <span className="font-normal text-gray-400">left</span>
          </span>
        )}
      </div>

      {effectiveTotal != null ? (
        <>
          <div className="w-full bg-gray-100 rounded-full h-2 mb-2">
            <div
              className={`h-2 rounded-full transition-all ${colors.bar}`}
              style={{ width: `${pct}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-gray-500">
            <span>
              ${effectiveSpent.toFixed(2)} spent
              {isGrouped && benefit.individual_spent > 0 && (
                <span className="text-gray-400"> (${benefit.individual_spent.toFixed(2)} here)</span>
              )}
            </span>
            <span>${effectiveTotal.toFixed(2)} {isGrouped ? 'shared total' : 'total'}</span>
          </div>
        </>
      ) : (
        <p className="text-xs text-gray-400">No dollar limit specified</p>
      )}

      {benefit.notes && (
        <p className="mt-2 text-xs text-gray-500 border-t border-gray-100 pt-2">{benefit.notes}</p>
      )}
    </div>
  )
}

export default function Dashboard() {
  const { benefits, loading, error } = useBenefits()
  const [hiddenBenefits, setHiddenBenefits] = useState<HiddenBenefit[]>([])
  const [showAddModal, setShowAddModal] = useState(false)
  const [profileLoaded, setProfileLoaded] = useState(false)

  useEffect(() => {
    getProfile().then((p) => {
      if (p) setHiddenBenefits(p.hidden_benefits ?? [])
      setProfileLoaded(true)
    })
  }, [])

  function isHidden(b: BenefitCategory) {
    return hiddenBenefits.some((h) => h.doc_type === b.doc_type && h.name === b.name)
  }

  const visibleBenefits = benefits.filter((b) => !isHidden(b))
  const hiddenCards = benefits.filter((b) => isHidden(b))

  const hideCard = useCallback(async (benefit: BenefitCategory) => {
    const updated = [...hiddenBenefits, { doc_type: benefit.doc_type, name: benefit.name }]
    setHiddenBenefits(updated)
    await updateProfile({ hidden_benefits: updated })
  }, [hiddenBenefits])

  const showCard = useCallback(async (benefit: BenefitCategory) => {
    const updated = hiddenBenefits.filter(
      (h) => !(h.doc_type === benefit.doc_type && h.name === benefit.name),
    )
    setHiddenBenefits(updated)
    await updateProfile({ hidden_benefits: updated })
    if (hiddenCards.length === 1) setShowAddModal(false)
  }, [hiddenBenefits, hiddenCards.length])

  const grouped = visibleBenefits.reduce<Record<DocType, BenefitCategory[]>>(
    (acc, b) => {
      const t = b.doc_type as DocType
      if (!acc[t]) acc[t] = []
      acc[t].push(b)
      return acc
    },
    {} as Record<DocType, BenefitCategory[]>,
  )

  const docTypes = (['insurance', 'wellness', 'learning'] as DocType[]).filter(
    (t) => grouped[t]?.length,
  )

  const ready = !loading && profileLoaded

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Benefits Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">
            Overview of your available benefits and remaining balances
          </p>
        </div>
        {ready && benefits.length > 0 && (
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Add card
          </button>
        )}
      </div>

      {loading && (
        <div className="text-center py-20 text-gray-400">Loading your benefits…</div>
      )}

      {error && (
        <div className="bg-red-50 text-red-700 rounded-lg p-4 text-sm">{error}</div>
      )}

      {ready && benefits.length === 0 && (
        <div className="text-center py-20">
          <p className="text-gray-500 mb-2">No benefits found yet.</p>
          <p className="text-sm text-gray-400">
            Go to <a href="/profile" className="text-indigo-600 hover:underline">Profile</a> to upload your benefit documents.
          </p>
        </div>
      )}

      {ready && benefits.length > 0 && visibleBenefits.length === 0 && (
        <div className="text-center py-20">
          <p className="text-gray-500 mb-2">All cards are hidden.</p>
          <button
            onClick={() => setShowAddModal(true)}
            className="text-sm text-indigo-600 hover:underline"
          >
            Add cards back
          </button>
        </div>
      )}

      {docTypes.map((docType) => (
        <div key={docType} className="mb-8">
          <h2 className="text-base font-semibold text-gray-700 mb-3">
            {DOC_TYPE_LABELS[docType]}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {grouped[docType].map((b) => (
              <BenefitCard key={b.id} benefit={b} onHide={hideCard} />
            ))}
          </div>
        </div>
      ))}

      {showAddModal && (
        <AddCardModal
          hiddenBenefits={hiddenCards}
          onShow={showCard}
          onClose={() => setShowAddModal(false)}
        />
      )}
    </div>
  )
}
