import { useState, useEffect, FormEvent, useCallback } from 'react'
import { api } from '../lib/api'
import { useBenefits } from '../hooks/useBenefits'
import type { Expense, DocType } from '../types'

const DOC_TYPE_LABELS: Record<DocType, string> = {
  insurance: 'Health Insurance',
  wellness: 'Wellness',
  learning: 'Learning & Development',
}

export default function Expenses() {
  const { benefits } = useBenefits()
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [loadingExp, setLoadingExp] = useState(true)
  const [expError, setExpError] = useState<string | null>(null)

  const [categoryId, setCategoryId] = useState('')
  const [amount, setAmount] = useState('')
  const [description, setDescription] = useState('')
  const [expenseDate, setExpenseDate] = useState(new Date().toISOString().slice(0, 10))
  const [formError, setFormError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const loadExpenses = useCallback(async () => {
    setLoadingExp(true)
    setExpError(null)
    try {
      const data = await api.getExpenses()
      setExpenses(data)
    } catch (err) {
      setExpError(err instanceof Error ? err.message : 'Failed to load expenses')
    } finally {
      setLoadingExp(false)
    }
  }, [])

  useEffect(() => { loadExpenses() }, [loadExpenses])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setFormError(null)

    if (!categoryId) { setFormError('Please select a benefit category'); return }
    const amt = parseFloat(amount)
    if (isNaN(amt) || amt <= 0) { setFormError('Enter a valid amount greater than 0'); return }

    setSubmitting(true)
    try {
      await api.createExpense({
        category_id: categoryId,
        amount: amt,
        description: description || undefined,
        expense_date: expenseDate,
      })
      setAmount('')
      setDescription('')
      setCategoryId('')
      await loadExpenses()
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to save expense')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDelete(id: string) {
    await api.deleteExpense(id)
    setExpenses((prev) => prev.filter((e) => e.id !== id))
  }

  const totalByCategory: Record<string, number> = {}
  for (const exp of expenses) {
    totalByCategory[exp.category_id] = (totalByCategory[exp.category_id] ?? 0) + Number(exp.amount)
  }

  return (
    <div className="max-w-3xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Expenses</h1>
        <p className="text-sm text-gray-500 mt-1">Track spending against your benefit categories</p>
      </div>

      {/* Add Expense Form */}
      <section className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 mb-6">
        <h2 className="text-base font-semibold text-gray-900 mb-4">Add Expense</h2>
        {benefits.length === 0 ? (
          <p className="text-sm text-gray-400">
            Upload benefit documents on your{' '}
            <a href="/profile" className="text-indigo-600 hover:underline">Profile</a> page first.
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Benefit category</label>
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                >
                  <option value="">Select a category…</option>
                  {(['insurance', 'wellness', 'learning'] as DocType[]).map((dt) => {
                    const group = benefits.filter((b) => b.doc_type === dt)
                    if (!group.length) return null
                    return (
                      <optgroup key={dt} label={DOC_TYPE_LABELS[dt]}>
                        {group.map((b) => (
                          <option key={b.id} value={b.id}>
                            {b.name}
                            {b.remaining != null ? ` ($${b.remaining.toFixed(2)} left)` : ''}
                          </option>
                        ))}
                      </optgroup>
                    )
                  })}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Amount ($)</label>
                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  required
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="0.00"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                <input
                  type="date"
                  required
                  value={expenseDate}
                  onChange={(e) => setExpenseDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Description (optional)</label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="e.g. Massage therapy session"
                />
              </div>
            </div>
            {formError && <p className="text-red-600 text-sm">{formError}</p>}
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors"
            >
              {submitting ? 'Saving…' : 'Add expense'}
            </button>
          </form>
        )}
      </section>

      {/* Expense History */}
      <section className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <h2 className="text-base font-semibold text-gray-900 mb-4">Expense History</h2>
        {loadingExp && <p className="text-sm text-gray-400">Loading…</p>}
        {expError && <p className="text-sm text-red-600">{expError}</p>}
        {!loadingExp && expenses.length === 0 && (
          <p className="text-sm text-gray-400">No expenses recorded yet.</p>
        )}
        {expenses.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-left text-xs text-gray-500 uppercase tracking-wide">
                  <th className="pb-2 pr-4">Date</th>
                  <th className="pb-2 pr-4">Category</th>
                  <th className="pb-2 pr-4">Description</th>
                  <th className="pb-2 pr-4 text-right">Amount</th>
                  <th className="pb-2" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {expenses.map((exp) => (
                  <tr key={exp.id} className="hover:bg-gray-50">
                    <td className="py-2 pr-4 text-gray-600 whitespace-nowrap">
                      {new Date(exp.expense_date + 'T00:00:00').toLocaleDateString()}
                    </td>
                    <td className="py-2 pr-4 text-gray-800">
                      {exp.benefit_categories?.name ?? '—'}
                      {exp.benefit_categories && (
                        <span className="ml-1 text-xs text-gray-400">
                          ({DOC_TYPE_LABELS[exp.benefit_categories.doc_type]})
                        </span>
                      )}
                    </td>
                    <td className="py-2 pr-4 text-gray-600">{exp.description ?? '—'}</td>
                    <td className="py-2 pr-4 text-right font-medium text-gray-900">
                      ${Number(exp.amount).toFixed(2)}
                    </td>
                    <td className="py-2">
                      <button
                        onClick={() => handleDelete(exp.id)}
                        className="text-xs text-red-400 hover:text-red-600 transition-colors"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}
