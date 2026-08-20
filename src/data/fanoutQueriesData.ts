export type FanoutQueryStatus = 'Completed' | 'Running' | 'Failed'

export interface FanoutQueryRow {
  id: string
  prompt: string
  fanoutQueries: string[]
  status: FanoutQueryStatus
  updatedBy: string
  updatedOn: string
  [key: string]: unknown
}

const UPDATED_BY_SAMPLES = ['Rupa C', 'Akhil', 'Raynil Kumar', 'Haresh', 'Sampada K']

export const FANOUT_QUERIES: FanoutQueryRow[] = [
  {
    id: 'fq-1',
    prompt: 'How much do dental implants cost in Austin?',
    fanoutQueries: [
      'dental implant financing Austin TX',
      'average cost of single tooth implant',
      'dental implants near me price comparison',
      'does insurance cover dental implants',
      'full mouth dental implants cost',
      'cheapest dental implants Austin',
      'dental implant payment plans',
      'same day dental implants cost',
    ],
    status: 'Completed',
    updatedBy: UPDATED_BY_SAMPLES[0],
    updatedOn: 'Aug 12, 2026',
  },
  {
    id: 'fq-2',
    prompt: 'What are my orthodontic treatment options?',
    fanoutQueries: [
      'Invisalign vs traditional braces cost',
      'clear aligners vs metal braces',
      'how long does Invisalign take',
      'best orthodontist for adults',
      'ceramic braces pros and cons',
      'orthodontic treatment for overbite',
    ],
    status: 'Completed',
    updatedBy: UPDATED_BY_SAMPLES[1],
    updatedOn: 'Aug 10, 2026',
  },
  {
    id: 'fq-3',
    prompt: 'Is teeth whitening safe for sensitive teeth?',
    fanoutQueries: [
      'in-office whitening vs at-home kits',
      'teeth whitening side effects',
      'best whitening toothpaste for sensitivity',
      'professional whitening cost',
    ],
    status: 'Running',
    updatedBy: UPDATED_BY_SAMPLES[2],
    updatedOn: 'Aug 8, 2026',
  },
  {
    id: 'fq-4',
    prompt: 'What should I expect during a root canal procedure?',
    fanoutQueries: [
      'root canal pain level',
      'root canal recovery time',
      'root canal vs tooth extraction',
      'root canal cost without insurance',
      'signs you need a root canal',
    ],
    status: 'Failed',
    updatedBy: UPDATED_BY_SAMPLES[3],
    updatedOn: 'Aug 5, 2026',
  },
  {
    id: 'fq-5',
    prompt: 'How do I choose the best dentist for my family?',
    fanoutQueries: Array.from({ length: 32 }, (_, i) => `family dentist evaluation criteria #${i + 1}`),
    status: 'Completed',
    updatedBy: UPDATED_BY_SAMPLES[4],
    updatedOn: 'Aug 1, 2026',
  },
]
