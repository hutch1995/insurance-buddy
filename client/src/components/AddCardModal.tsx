import type { BenefitCategory, DocType } from '../types'

const DOC_TYPE_LABELS: Record<DocType, string> = {
  insurance: 'Health Insurance',
  wellness: 'Wellness Benefits',
  learning: 'Learning & Development',
}

const DOC_TYPE_COLORS: Record<DocType, { bg: string; text: string }> = {
  insurance: { bg: 'bg-blue-50', text: 'text-blue-700' },
  wellness: { bg: 'bg-green-50', text: 'text-green-700' },
  learning: { bg: 'bg-purple-50', text: 'text-purple-700' },
}

interface Props {
  hiddenBenefits: BenefitCategory[]
  onShow: (benefit: BenefitCategory) => void
  onClose: () => void
}

export default function AddCardModal({ hiddenBenefits, onShow, onClose }: Props) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-6 max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Add benefit card</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Close"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {hiddenBenefits.length === 0 ? (
          <p className="text-sm text-gray-400 py-8 text-center">
            All benefit cards are already visible on your dashboard.
          </p>
        ) : (
          <>
            <p className="text-sm text-gray-500 mb-3">
              Click a benefit to add it back to your dashboard.
            </p>
            <div className="overflow-y-auto flex-1 space-y-2">
              {hiddenBenefits.map((b) => {
                const colors = DOC_TYPE_COLORS[b.doc_type as DocType]
                return (
                  <button
                    key={b.id}
                    onClick={() => onShow(b)}
                    className="w-full text-left px-4 py-3 rounded-lg border border-gray-200 hover:border-indigo-300 hover:bg-indigo-50 transition-colors group"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <span className={`inline-block text-xs font-medium px-2 py-0.5 rounded-full mb-1 ${colors.bg} ${colors.text}`}>
                          {DOC_TYPE_LABELS[b.doc_type as DocType]}
                        </span>
                        <p className="text-sm font-medium text-gray-800">{b.name}</p>
                        {b.category_group && (
                          <p className="text-xs text-gray-400">Part of {b.category_group}</p>
                        )}
                      </div>
                      <svg className="w-4 h-4 text-gray-400 group-hover:text-indigo-600 transition-colors flex-shrink-0 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                      </svg>
                    </div>
                  </button>
                )
              })}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
