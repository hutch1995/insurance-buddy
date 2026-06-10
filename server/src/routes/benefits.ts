import { Router, Request, Response } from 'express'
import { requireAuth, AuthRequest } from '../middleware/auth'
import { supabase } from '../services/supabase'

const router = Router()

router.get('/', requireAuth, async (req: Request, res: Response): Promise<void> => {
  const userId = (req as AuthRequest).userId

  const { data: categories, error: catError } = await supabase
    .from('benefit_categories')
    .select('*')
    .eq('user_id', userId)
    .order('doc_type')
    .order('name')

  if (catError) {
    res.status(500).json({ error: catError.message })
    return
  }

  if (!categories || categories.length === 0) {
    res.json([])
    return
  }

  const categoryIds = categories.map((c) => c.id)

  const { data: expenses, error: expError } = await supabase
    .from('expenses')
    .select('category_id, amount')
    .in('category_id', categoryIds)

  if (expError) {
    res.status(500).json({ error: expError.message })
    return
  }

  const spentByCategory: Record<string, number> = {}
  for (const exp of expenses ?? []) {
    spentByCategory[exp.category_id] = (spentByCategory[exp.category_id] ?? 0) + Number(exp.amount)
  }

  // Build a map of category_group → total spent across all items in that group
  // Key is `${doc_type}:${category_group}` to keep groups scoped per document type
  const idToGroup: Record<string, string> = {}
  for (const cat of categories) {
    if (cat.category_group) {
      idToGroup[cat.id] = `${cat.doc_type}:${cat.category_group}`
    }
  }

  const spentByGroup: Record<string, number> = {}
  for (const [catId, amount] of Object.entries(spentByCategory)) {
    const groupKey = idToGroup[catId]
    if (groupKey) {
      spentByGroup[groupKey] = (spentByGroup[groupKey] ?? 0) + amount
    }
  }

  const result = categories.map((cat) => {
    const groupKey = cat.category_group ? `${cat.doc_type}:${cat.category_group}` : null
    const groupSpent = groupKey ? (spentByGroup[groupKey] ?? 0) : null
    const individualSpent = spentByCategory[cat.id] ?? 0

    // If part of a group, use group-level totals for spent/remaining
    const effectiveTotal = groupKey ? (cat.category_group_total ?? null) : cat.total_amount
    const effectiveSpent = groupKey ? (groupSpent ?? 0) : individualSpent
    const effectiveRemaining = effectiveTotal != null ? effectiveTotal - effectiveSpent : null

    return {
      ...cat,
      spent: effectiveSpent,
      individual_spent: individualSpent,
      remaining: effectiveRemaining,
    }
  })

  res.json(result)
})

export default router
