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

  // A group is a shared pool only when ALL items in the group have the same
  // category_group_total and no individual total_amount — meaning the cap is
  // truly combined (e.g. Mental Health $2,000 shared between psychotherapy +
  // clinical counselling). If items have individual caps of the same value
  // (e.g. each paramedical service has its own $500), treat them independently.
  const groupItemCounts: Record<string, number> = {}
  const groupHasIndividualAmounts: Record<string, boolean> = {}
  for (const cat of categories) {
    if (cat.category_group) {
      const key = `${cat.doc_type}:${cat.category_group}`
      groupItemCounts[key] = (groupItemCounts[key] ?? 0) + 1
      if (cat.total_amount != null) groupHasIndividualAmounts[key] = true
    }
  }

  // Only pool groups that have >1 item and no individual amounts set
  const isSharedGroup = (key: string) =>
    (groupItemCounts[key] ?? 0) > 1 && !groupHasIndividualAmounts[key]

  const idToGroup: Record<string, string> = {}
  for (const cat of categories) {
    if (cat.category_group) {
      const key = `${cat.doc_type}:${cat.category_group}`
      if (isSharedGroup(key)) idToGroup[cat.id] = key
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
    const groupKey = idToGroup[cat.id] ?? null
    const individualSpent = spentByCategory[cat.id] ?? 0

    const effectiveTotal = groupKey
      ? (cat.category_group_total ?? null)
      : (cat.total_amount ?? (cat.category_group_total ?? null))
    const effectiveSpent = groupKey ? (spentByGroup[groupKey] ?? 0) : individualSpent
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
