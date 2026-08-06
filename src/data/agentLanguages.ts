export interface AgentLanguage {
  id: string
  label: string
  /** ISO 3166-1 alpha-2 country code for flagcdn */
  countryCode: string
}

/** Languages shown in the agent setup language picker (alphabetical). */
export const AGENT_LANGUAGES: AgentLanguage[] = [
  { id: 'af', label: 'Afrikaans', countryCode: 'za' },
  { id: 'ar', label: 'Arabic', countryCode: 'ae' },
  { id: 'as', label: 'Assamese', countryCode: 'in' },
  { id: 'be', label: 'Belarusian', countryCode: 'by' },
  { id: 'arz', label: 'Egyptian', countryCode: 'eg' },
  { id: 'en', label: 'English', countryCode: 'us' },
  { id: 'fr', label: 'French', countryCode: 'fr' },
  { id: 'de', label: 'German', countryCode: 'de' },
  { id: 'hi', label: 'Hindi', countryCode: 'in' },
  { id: 'it', label: 'Italian', countryCode: 'it' },
  { id: 'ja', label: 'Japanese', countryCode: 'jp' },
  { id: 'ko', label: 'Korean', countryCode: 'kr' },
  { id: 'zh', label: 'Mandarin', countryCode: 'cn' },
  { id: 'pt', label: 'Portuguese', countryCode: 'br' },
  { id: 'ru', label: 'Russian', countryCode: 'ru' },
  { id: 'es', label: 'Spanish', countryCode: 'es' },
  { id: 'sw', label: 'Swahili', countryCode: 'ke' },
  { id: 'ta', label: 'Tamil', countryCode: 'in' },
  { id: 'tr', label: 'Turkish', countryCode: 'tr' },
  { id: 'uk', label: 'Ukrainian', countryCode: 'ua' },
  { id: 'vi', label: 'Vietnamese', countryCode: 'vn' },
]

export type AgentLanguageId = (typeof AGENT_LANGUAGES)[number]['id']

export function getAgentLanguage(id: string): AgentLanguage {
  return AGENT_LANGUAGES.find((l) => l.id === id) ?? AGENT_LANGUAGES.find((l) => l.id === 'en')!
}

export function languageFlagSrc(countryCode: string): string {
  return `https://flagcdn.com/w40/${countryCode}.png`
}
