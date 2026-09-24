export type PersonalityGender = 'Male' | 'Female' | 'Neutral'
export type PersonalityKind = 'fork' | 'custom'

/** One caller personality shown on the Front desk (Sep 23) Test tab. */
export interface TestPersonality {
  id: string
  name: string
  /** Short line under the title. Empty when the card only repeats the name. */
  description: string
  /** Longer instructions edited in the create/edit panel. */
  prompt: string
  voiceModel: string
  voiceId: string
  /** Off, Low, Normal, High, or N/A for templates that don't set one. */
  interruption: string
  /** Null when the template doesn't specify a rate (card shows N/A). */
  speed: number | null
  volume: number
  /** "None" reads as disabled on the card; any other value reads as enabled. */
  backgroundNoise: string
  language: string
  accent: string
  gender: PersonalityGender
  kind: PersonalityKind
  featured: boolean
  enabled: boolean
}

export interface TestPersonalitySectionProps {
  personalities: TestPersonality[]
  onChange: (next: TestPersonality[]) => void
}
