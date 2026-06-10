export type DocType = 'insurance' | 'wellness' | 'learning'

export interface HiddenBenefit {
  doc_type: DocType
  name: string
}

export interface UserProfile {
  id: string
  display_name: string | null
  interests: string[]
  has_dependents: boolean
  onboarding_completed: boolean
  hidden_benefits: HiddenBenefit[]
  created_at: string
}

export interface Document {
  id: string
  user_id: string
  doc_type: DocType
  file_path: string
  original_name: string | null
  analyzed_at: string | null
  created_at: string
}

export interface BenefitCategory {
  id: string
  user_id: string
  document_id: string
  name: string
  doc_type: DocType
  total_amount: number | null
  category_group: string | null
  category_group_total: number | null
  notes: string | null
  created_at: string
  spent: number
  individual_spent: number
  remaining: number | null
}

export interface Expense {
  id: string
  user_id: string
  category_id: string
  amount: number
  description: string | null
  expense_date: string
  created_at: string
  benefit_categories?: {
    name: string
    doc_type: DocType
  }
}
