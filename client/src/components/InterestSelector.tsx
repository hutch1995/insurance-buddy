import { useState } from 'react'
import { INTEREST_CATEGORIES, getChildIds } from '../lib/interests'

interface Props {
  selected: string[]
  onChange: (selected: string[]) => void
}

export default function InterestSelector({ selected, onChange }: Props) {
  const [expanded, setExpanded] = useState<string[]>([])

  function toggleExpand(categoryId: string) {
    setExpanded((prev) =>
      prev.includes(categoryId) ? prev.filter((id) => id !== categoryId) : [...prev, categoryId],
    )
  }

  function toggleChild(childId: string) {
    onChange(
      selected.includes(childId)
        ? selected.filter((id) => id !== childId)
        : [...selected, childId],
    )
  }

  function toggleAllChildren(categoryId: string) {
    const childIds = getChildIds(categoryId)
    const allSelected = childIds.every((id) => selected.includes(id))
    if (allSelected) {
      onChange(selected.filter((id) => !childIds.includes(id)))
    } else {
      const toAdd = childIds.filter((id) => !selected.includes(id))
      onChange([...selected, ...toAdd])
    }
  }

  return (
    <div className="space-y-2">
      {INTEREST_CATEGORIES.map((category) => {
        const childIds = getChildIds(category.id)
        const selectedCount = childIds.filter((id) => selected.includes(id)).length
        const allSelected = selectedCount === childIds.length
        const someSelected = selectedCount > 0 && !allSelected
        const isExpanded = expanded.includes(category.id)

        return (
          <div key={category.id} className="border border-gray-200 rounded-lg overflow-hidden">
            {/* Parent row */}
            <div className="flex items-center bg-gray-50 px-3 py-2.5">
              {/* Expand toggle */}
              <button
                type="button"
                onClick={() => toggleExpand(category.id)}
                className="mr-2 text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0"
                aria-label={isExpanded ? 'Collapse' : 'Expand'}
              >
                <svg
                  className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </button>

              {/* Select-all checkbox */}
              <button
                type="button"
                onClick={() => {
                  toggleAllChildren(category.id)
                  if (!isExpanded) toggleExpand(category.id)
                }}
                className={`w-4 h-4 rounded border flex-shrink-0 flex items-center justify-center transition-colors mr-3 ${
                  allSelected
                    ? 'bg-indigo-600 border-indigo-600'
                    : someSelected
                    ? 'bg-indigo-200 border-indigo-400'
                    : 'border-gray-300 bg-white hover:border-indigo-400'
                }`}
                aria-label={`Select all ${category.label}`}
              >
                {allSelected && (
                  <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                )}
                {someSelected && (
                  <span className="w-2 h-0.5 bg-indigo-600 block" />
                )}
              </button>

              <button
                type="button"
                onClick={() => toggleExpand(category.id)}
                className="flex-1 text-left flex items-center justify-between"
              >
                <span className="text-sm font-medium text-gray-800">{category.label}</span>
                {selectedCount > 0 && (
                  <span className="text-xs text-indigo-600 font-medium ml-2">
                    {selectedCount}/{childIds.length}
                  </span>
                )}
              </button>
            </div>

            {/* Children */}
            {isExpanded && (
              <div className="px-3 py-2 bg-white border-t border-gray-100 grid grid-cols-2 gap-1">
                {category.children.map((child) => {
                  const isSelected = selected.includes(child.id)
                  return (
                    <button
                      key={child.id}
                      type="button"
                      onClick={() => toggleChild(child.id)}
                      className={`text-left flex items-center gap-2 px-2 py-1.5 rounded-md text-sm transition-colors ${
                        isSelected
                          ? 'text-indigo-800 bg-indigo-50'
                          : 'text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      <span
                        className={`w-3.5 h-3.5 rounded border flex-shrink-0 flex items-center justify-center ${
                          isSelected ? 'bg-indigo-600 border-indigo-600' : 'border-gray-300'
                        }`}
                      >
                        {isSelected && (
                          <svg className="w-2 h-2 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </span>
                      {child.label}
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
