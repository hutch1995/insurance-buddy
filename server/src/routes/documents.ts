import { Router, Request, Response } from 'express'
import multer from 'multer'
import { requireAuth, AuthRequest } from '../middleware/auth'
import { supabase } from '../services/supabase'
import { analyzeDocument } from '../services/anthropic'

const router = Router()
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
  fileFilter: (_req, file, cb) => {
    const allowed = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp']
    cb(null, allowed.includes(file.mimetype))
  },
})

const DOC_TYPES = ['insurance', 'wellness', 'learning'] as const
type DocType = (typeof DOC_TYPES)[number]

router.post(
  '/upload',
  requireAuth,
  upload.single('file'),
  async (req: Request, res: Response): Promise<void> => {
    const userId = (req as AuthRequest).userId
    const docType = req.body.doc_type as DocType

    if (!DOC_TYPES.includes(docType)) {
      res.status(400).json({ error: 'doc_type must be insurance, wellness, or learning' })
      return
    }

    if (!req.file) {
      res.status(400).json({ error: 'No file uploaded' })
      return
    }

    const { buffer, mimetype, originalname } = req.file
    const ext = originalname.split('.').pop() ?? 'bin'
    const storagePath = `${userId}/${docType}/document.${ext}`

    // Upload to Supabase Storage (upsert)
    const { error: storageError } = await supabase.storage
      .from('Documents')
      .upload(storagePath, buffer, { contentType: mimetype, upsert: true })

    if (storageError) {
      res.status(500).json({ error: `Storage upload failed: ${storageError.message}` })
      return
    }

    // Upsert document row
    const { data: doc, error: docError } = await supabase
      .from('documents')
      .upsert(
        {
          user_id: userId,
          doc_type: docType,
          file_path: storagePath,
          original_name: originalname,
          analyzed_at: null,
        },
        { onConflict: 'user_id,doc_type' },
      )
      .select()
      .single()

    if (docError || !doc) {
      res.status(500).json({ error: `Failed to save document record: ${docError?.message}` })
      return
    }

    // Delete stale benefit categories for this doc type
    await supabase
      .from('benefit_categories')
      .delete()
      .eq('user_id', userId)
      .eq('doc_type', docType)

    const EXCLUDED_KEYWORDS = [
      'life insurance',
      'accidental death',
      'dismemberment',
      'ad&d',
      'long-term disability',
      'short-term disability',
      'ltd',
      'std',
    ]

    function isExcluded(name: string) {
      const lower = name.toLowerCase()
      return EXCLUDED_KEYWORDS.some((kw) => lower.includes(kw))
    }

    // Analyze with Anthropic
    let categories: { name: string; total_amount: number | null; category_group: string | null; category_group_total: number | null; notes: string | null }[] = []
    try {
      const extracted = await analyzeDocument(buffer, mimetype)
      const filtered = extracted.filter((c) => !isExcluded(c.name))
      categories = filtered

      const rows = filtered.map((c) => ({
        user_id: userId,
        document_id: doc.id,
        doc_type: docType,
        name: c.name,
        total_amount: c.total_amount,
        category_group: c.category_group,
        category_group_total: c.category_group_total,
        notes: c.notes,
      }))

      if (rows.length > 0) {
        await supabase.from('benefit_categories').insert(rows)
      }

      // Mark document as analyzed
      await supabase
        .from('documents')
        .update({ analyzed_at: new Date().toISOString() })
        .eq('id', doc.id)
    } catch (err) {
      // Analysis failed — document is still saved, just not analyzed
      console.error('Anthropic analysis failed:', err)
      res.status(207).json({
        document: doc,
        categories: [],
        warning: 'Document saved but analysis failed. You can re-upload to retry.',
      })
      return
    }

    res.json({ document: doc, categories })
  },
)

router.get('/', requireAuth, async (req: Request, res: Response): Promise<void> => {
  const userId = (req as AuthRequest).userId
  const { data, error } = await supabase
    .from('documents')
    .select('*')
    .eq('user_id', userId)
    .order('doc_type')

  if (error) {
    res.status(500).json({ error: error.message })
    return
  }

  res.json(data)
})

export default router
