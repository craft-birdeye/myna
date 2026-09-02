export const DEFAULT_BIRDEYE_GREETING =
  "Thanks for calling {Business Name}. We can't connect you to our team through the assistant right now. Please stay on the line to reach us, or leave your name and number and we'll call you back shortly."

export const DEFAULT_CUSTOM_GREETING =
  "Thanks for calling {Business Name}. We can't connect you to our team through the assistant right now. Please stay on the line to reach us, or leave your name and number and we'll call you back shortly."

export const DEFAULT_BIRDEYE_SMS_LEFT =
  "We got your message and will text you back as soon as we can. In the meantime, you can reply to this number anytime. Thank you - {Business Name}"

export const DEFAULT_CUSTOM_SMS_LEFT =
  "We got your message and will text you back as soon as we can. In the meantime, you can reply to this number anytime. Thank you - {Business Name}"

export const DEFAULT_BIRDEYE_SMS_NO_MESSAGE =
  "This is {Business Name}. Sorry we missed you. Reply to this text or call us back on {Business Phone} and we'll be glad to help. Thank you."

export const DEFAULT_CUSTOM_SMS_NO_MESSAGE =
  "This is {Business Name}. Sorry we missed you. Reply to this text or call us back on {Business Phone} and we'll be glad to help. Thank you."

export const DEFAULT_BIRDEYE_LINE_BUSY =
  "All of our lines are busy right now. Please leave your name and number and we'll call you right back."

export const DEFAULT_CUSTOM_LINE_BUSY = DEFAULT_BIRDEYE_LINE_BUSY

export const DEFAULT_BIRDEYE_AFTER_HOURS =
  "Thanks for calling {Business Name}. Our office is closed right now. If this is a medical emergency, please hang up and call 911. Otherwise, leave your name and number and we'll call you back when we reopen."

export const DEFAULT_CUSTOM_AFTER_HOURS =
  "Thanks for calling {Business Name}. Our office is closed right now. If this is a medical emergency, please hang up and call 911. Otherwise, leave your name and number and we'll call you back when we reopen."

export const GREETING_MAX_CHARS = 500
export const SMS_MAX_CHARS = 800
export const LINE_BUSY_MAX_CHARS = 300
export const AFTER_HOURS_MAX_CHARS = 500

export const RING_FOR_OPTIONS = ['10 seconds', '15 seconds', '20 seconds', '30 seconds', '45 seconds']

export const DEFAULT_FORWARD_PHONE = '+1 (555) 000-0000'
export const DEFAULT_RING_FOR = '20 seconds'

export interface FallbackFailoverConfig {
  customizeGreeting: boolean
  greeting: string
  customizeSms: boolean
  smsLeftMessage: string
  smsNoMessage: string
  forwardEnabled: boolean
  forwardPhone: string
  ringFor: string
  lineBusyMode: 'callback' | 'queue'
  customizeLineBusy: boolean
  lineBusyGreeting: string
  useBusinessHours: boolean
  customizeAfterHours: boolean
  afterHoursGreeting: string
}

export const INITIAL_FALLBACK_FAILOVER: FallbackFailoverConfig = {
  customizeGreeting: false,
  greeting: DEFAULT_CUSTOM_GREETING,
  customizeSms: false,
  smsLeftMessage: DEFAULT_CUSTOM_SMS_LEFT,
  smsNoMessage: DEFAULT_CUSTOM_SMS_NO_MESSAGE,
  forwardEnabled: false,
  forwardPhone: DEFAULT_FORWARD_PHONE,
  ringFor: DEFAULT_RING_FOR,
  lineBusyMode: 'callback',
  customizeLineBusy: false,
  lineBusyGreeting: DEFAULT_CUSTOM_LINE_BUSY,
  useBusinessHours: true,
  customizeAfterHours: false,
  afterHoursGreeting: DEFAULT_CUSTOM_AFTER_HOURS,
}

/** Replace curly-brace tokens with sample values for preview copy. */
export function resolvePreviewTokens(text: string): string {
  return text
    .replace(/\{Business Name\}/g, 'Rock Dental Brands')
    .replace(/\{Business Phone\}/g, '(415) 555-0100')
    .replace(/\[Business Name\]/g, 'Rock Dental Brands')
    .replace(/\[Business Phone\]/g, '(415) 555-0100')
    .replace(/\{\{Business\.name\}\}/g, 'Rock Dental Brands')
    .replace(/\{\{Business\.phone\}\}/g, '(415) 555-0100')
}
