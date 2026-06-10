export interface SubInterest {
  id: string
  label: string
  keywords: string[]
}

export interface InterestCategory {
  id: string
  label: string
  children: SubInterest[]
}

export const INTEREST_CATEGORIES: InterestCategory[] = [
  {
    id: 'dentistry',
    label: 'Dentistry + Ortho',
    children: [
      { id: 'dental_checkup', label: 'Checkup & Cleaning', keywords: ['cleaning', 'checkup', 'recall', 'preventive dental', 'scaling', 'polishing'] },
      { id: 'dental_work', label: 'Dental Work', keywords: ['filling', 'crown', 'root canal', 'extraction', 'restoration', 'bridge', 'denture', 'implant', 'inlay', 'onlay'] },
      { id: 'orthodontics', label: 'Orthodontics', keywords: ['orthodontic', 'braces', 'aligner', 'invisalign', 'retainer'] },
    ],
  },
  {
    id: 'paramedical',
    label: 'Paramedical',
    children: [
      { id: 'massage', label: 'Massage Therapy', keywords: ['massage'] },
      { id: 'physiotherapy', label: 'Physiotherapy', keywords: ['physio'] },
      { id: 'chiropractic', label: 'Chiropractic', keywords: ['chiro'] },
      { id: 'mental_health', label: 'Mental Health', keywords: ['mental health', 'psychology', 'psychotherapy', 'counselling', 'counseling', 'therapist', 'psychiatry', 'social work'] },
      { id: 'acupuncture', label: 'Acupuncture', keywords: ['acupuncture'] },
      { id: 'naturopathy', label: 'Naturopathy', keywords: ['natur'] },
      { id: 'podiatry', label: 'Podiatry', keywords: ['podiat', 'orthotic'] },
      { id: 'speech_therapy', label: 'Speech Therapy', keywords: ['speech'] },
      { id: 'occupational_therapy', label: 'Occupational Therapy', keywords: ['occupational'] },
      { id: 'dietitian', label: 'Dietitian / Nutrition', keywords: ['dietitian', 'nutritionist', 'nutrition'] },
    ],
  },
  {
    id: 'vision',
    label: 'Vision',
    children: [
      { id: 'glasses', label: 'Glasses & Frames', keywords: ['glasses', 'frames', 'eyewear', 'optical', 'spectacle'] },
      { id: 'contacts', label: 'Contact Lenses', keywords: ['contact lens'] },
      { id: 'eye_exam', label: 'Eye Exam', keywords: ['eye exam', 'optometrist', 'vision exam'] },
      { id: 'laser_surgery', label: 'Laser Eye Surgery', keywords: ['laser', 'lasik'] },
    ],
  },
  {
    id: 'insurance',
    label: 'Insurance',
    children: [
      { id: 'prescription', label: 'Prescription Drugs', keywords: ['prescription', 'drug', 'medication', 'pharmacy'] },
      { id: 'hospital', label: 'Hospital & Extended Care', keywords: ['hospital', 'extended care', 'nursing'] },
      { id: 'travel_insurance', label: 'Travel Insurance', keywords: ['travel insurance', 'out of province'] },
    ],
  },
  {
    id: 'primary_care',
    label: 'Primary Care',
    children: [
      { id: 'gp_visits', label: 'GP / Doctor Visits', keywords: ['general practitioner', 'physician', 'family doctor', 'gp '] },
      { id: 'telehealth', label: 'Telehealth', keywords: ['telehealth', 'virtual care', 'telemedicine'] },
    ],
  },
  {
    id: 'courses',
    label: 'Courses',
    children: [
      { id: 'online_courses', label: 'Online Courses', keywords: ['online course', 'e-learning', 'udemy', 'coursera', 'linkedin learning'] },
      { id: 'in_person_courses', label: 'In-person Courses', keywords: ['course', 'class', 'workshop', 'training'] },
    ],
  },
  {
    id: 'professional_fees',
    label: 'Professional Fees + Certifications',
    children: [
      { id: 'professional_dues', label: 'Professional Dues', keywords: ['professional dues', 'membership fee', 'association fee', 'annual dues'] },
      { id: 'licenses', label: 'Licenses', keywords: ['licens'] },
      { id: 'certifications', label: 'Certifications', keywords: ['certification', 'certificate'] },
    ],
  },
  {
    id: 'conferences',
    label: 'Conferences',
    children: [
      { id: 'conference_reg', label: 'Conference Registration', keywords: ['conference', 'summit', 'symposium', 'congress'] },
      { id: 'conference_travel', label: 'Travel & Accommodation', keywords: ['travel', 'accommodation', 'hotel', 'airfare'] },
    ],
  },
  {
    id: 'books_resources',
    label: 'Books + Resources',
    children: [
      { id: 'books', label: 'Books', keywords: ['book', 'textbook', 'publication'] },
      { id: 'subscriptions', label: 'Online Subscriptions & Tools', keywords: ['subscription', 'software', 'saas', 'tool'] },
      { id: 'journals', label: 'Journals & Periodicals', keywords: ['journal', 'periodical', 'magazine'] },
    ],
  },
]

// Flat list of all sub-interests for keyword matching
export const ALL_SUB_INTERESTS = INTEREST_CATEGORIES.flatMap((cat) => cat.children)

export const EXCLUDED_KEYWORDS = [
  'life insurance',
  'accidental death',
  'dismemberment',
  'ad&d',
  'long-term disability',
  'short-term disability',
]

export function matchesInterest(categoryName: string, selectedIds: string[]): boolean {
  if (selectedIds.length === 0) return true
  const lower = categoryName.toLowerCase()
  return selectedIds.some((id) => {
    const sub = ALL_SUB_INTERESTS.find((s) => s.id === id)
    return sub?.keywords.some((kw) => lower.includes(kw))
  })
}

export function getChildIds(categoryId: string): string[] {
  return INTEREST_CATEGORIES.find((c) => c.id === categoryId)?.children.map((s) => s.id) ?? []
}

export function getCategoryForChild(childId: string): InterestCategory | undefined {
  return INTEREST_CATEGORIES.find((cat) => cat.children.some((s) => s.id === childId))
}
