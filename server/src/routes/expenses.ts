import { Router, Request, Response } from 'express'
import { requireAuth, AuthRequest } from '../middleware/auth'
import { supabase } from '../services/supabase'

const router = Router()

router.get('/', requireAuth, async (req: Request, res: Response): Promise<void> => {
  const userId = (req as AuthRequest).userId
  const categoryId = req.query.category_id as string | undefined

  let query = supabase
    .from('expenses')
    .select('*, benefit_categories(name, doc_type)')
    .eq('user_id', userId)
    .order('expense_date', { ascending: false })
    .order('created_at', { ascending: false })

  if (categoryId) {
    query = query.eq('category_id', categoryId)
  }

  const { data, error } = await query

  if (error) {
    res.status(500).json({ error: error.message })
    return
  }

  res.json(data)
})

router.post('/', requireAuth, async (req: Request, res: Response): Promise<void> => {
  const userId = (req as AuthRequest).userId
  const { category_id, amount, description, expense_date } = req.body

  if (!category_id || !amount || !expense_date) {
    res.status(400).json({ error: 'category_id, amount, and expense_date are required' })
    return
  }

  if (Number(amount) <= 0) {
    res.status(400).json({ error: 'amount must be greater than 0' })
    return
  }

  // Verify category belongs to this user
  const { data: cat, error: catError } = await supabase
    .from('benefit_categories')
    .select('id')
    .eq('id', category_id)
    .eq('user_id', userId)
    .single()

  if (catError || !cat) {
    res.status(403).json({ error: 'Category not found or does not belong to you' })
    return
  }

  const { data, error } = await supabase
    .from('expenses')
    .insert({
      user_id: userId,
      category_id,
      amount: Number(amount),
      description: description ?? null,
      expense_date,
    })
    .select()
    .single()

  if (error) {
    res.status(500).json({ error: error.message })
    return
  }

  res.status(201).json(data)
})

router.delete('/:id', requireAuth, async (req: Request, res: Response): Promise<void> => {
  const userId = (req as AuthRequest).userId
  const { id } = req.params

  const { error } = await supabase
    .from('expenses')
    .delete()
    .eq('id', id)
    .eq('user_id', userId)

  if (error) {
    res.status(500).json({ error: error.message })
    return
  }

  res.status(204).send()
})

export default router
