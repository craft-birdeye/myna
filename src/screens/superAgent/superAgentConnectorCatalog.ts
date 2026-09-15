import type { ChannelKey } from './ChannelGlyph'

// Categorized connector catalog for the Connections screen's connector browser —
// replaces the old flat "Data sources" list with a grouped grid (category rail +
// search), matching the structure of a categorized connector picker while keeping
// every entry an honest, real brand: each item resolves to either a bundled brand
// asset (superAgentConnectionLogos.ts) or one of ChannelGlyph's accurate inline brand
// marks — never a generic Material icon standing in for a third-party logo. Items
// that are Birdeye's own capabilities rather than a third-party brand (appointment
// calendar, phone number, website chat) keep a plain Material icon, since there is no
// outside logo to be accurate to.
export type SuperAgentConnectorCategoryKey = 'communication' | 'reviews-listings' | 'social' | 'other'

export const SUPER_AGENT_CONNECTOR_CATEGORIES: { key: SuperAgentConnectorCategoryKey; label: string }[] = [
  { key: 'communication', label: 'Communication' },
  { key: 'reviews-listings', label: 'Reviews & listings' },
  { key: 'social', label: 'Social' },
  { key: 'other', label: 'Other' },
]

export interface SuperAgentConnector {
  id: string
  name: string
  category: SuperAgentConnectorCategoryKey
  detail: string
  state: 'connected' | 'reconnect' | 'connect'
  /** real bundled brand asset key (superAgentConnectionLogos.ts) */
  logoSrc?: string
  /** real inline brand mark from ChannelGlyph, for the 4 messaging brands */
  channel?: ChannelKey
  /** Material icon fallback — only for Birdeye's own capabilities, never a 3rd-party brand */
  icon?: string
}

export const SUPER_AGENT_CONNECTORS: SuperAgentConnector[] = [
  // Communication
  { id: 'whatsapp-ds', name: 'WhatsApp', category: 'communication', detail: 'Message threads', state: 'connect', channel: 'whatsapp' },
  { id: 'slack-ds', name: 'Slack', category: 'communication', detail: 'Team channel', state: 'connect', channel: 'slack' },
  { id: 'imessage-ds', name: 'iMessage', category: 'communication', detail: 'Text thread', state: 'connect', channel: 'imessage' },
  { id: 'telegram-ds', name: 'Telegram', category: 'communication', detail: 'Bot channel', state: 'connect', channel: 'telegram' },
  { id: 'teams', name: 'Microsoft Teams', category: 'communication', detail: 'Team channel', state: 'connect', logoSrc: 'teams' },
  { id: 'outlook', name: 'Outlook', category: 'communication', detail: 'Email inbox', state: 'connect', logoSrc: 'outlook' },
  { id: 'phone-number', name: 'Phone number', category: 'communication', detail: '(555) 0100', state: 'connected', icon: 'call' },
  { id: 'website-chat', name: 'Website chat', category: 'communication', detail: 'Installed', state: 'connected', icon: 'chat' },

  // Reviews & listings
  { id: 'gbp', name: 'Google Business Profile', category: 'reviews-listings', detail: '4 locations', state: 'connected', logoSrc: 'google' },
  { id: 'facebook', name: 'Facebook Pages', category: 'reviews-listings', detail: '4 pages', state: 'connected', logoSrc: 'facebook' },
  { id: 'yelp', name: 'Yelp', category: 'reviews-listings', detail: 'Not connected', state: 'connect', logoSrc: 'yelp' },
  { id: 'surveys', name: 'Birdeye surveys', category: 'reviews-listings', detail: 'Connected', state: 'connected', logoSrc: 'birdeye' },
  { id: 'appointment-calendar', name: 'Appointment calendar', category: 'reviews-listings', detail: 'Lakeside disconnected', state: 'reconnect', icon: 'calendar_today' },

  // Social
  { id: 'instagram', name: 'Instagram', category: 'social', detail: 'Not connected', state: 'connect', logoSrc: 'instagram' },
  { id: 'linkedin', name: 'LinkedIn', category: 'social', detail: 'Not connected', state: 'connect', logoSrc: 'linkedin' },
  { id: 'twitter', name: 'X (Twitter)', category: 'social', detail: 'Not connected', state: 'connect', logoSrc: 'twitter' },
  { id: 'youtube', name: 'YouTube', category: 'social', detail: 'Not connected', state: 'connect', logoSrc: 'youtube' },

  // Other — Birdeye's own capabilities, not third-party brands
  { id: 'birdeye-inbox', name: 'Birdeye inbox', category: 'other', detail: 'Connected', state: 'connected', logoSrc: 'birdeye' },
]
