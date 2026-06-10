import { Request, Response, NextFunction } from 'express'
import { supabase } from '../services/supabase'

export interface AuthRequest extends Request {
  userId: string
}

export async function requireAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
  const header = req.headers.authorization
  if (!header?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Missing authorization header' })
    return
  }

  const token = header.slice(7)
  const { data, error } = await supabase.auth.getUser(token)

  if (error || !data.user) {
    res.status(401).json({ error: 'Invalid or expired token' })
    return
  }

  ;(req as AuthRequest).userId = data.user.id
  next()
}
