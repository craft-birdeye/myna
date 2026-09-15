// Real brand marks for the 4 "reach your agents from another app" channels —
// ported verbatim from the standalone Super Agent prototype's own `ChannelGlyph`
// (public/super-agent-prototype.html), which draws each brand mark as an inline SVG
// (WhatsApp's rounded speech bubble, Telegram's paper plane disc, iMessage's green
// gradient bubble, Slack's 4-color hashtag) instead of a generic Material icon.
// Kept as its own file (not the Icon component) since these are fixed brand marks,
// not part of the Material Symbols set.
export type ChannelKey = 'whatsapp' | 'slack' | 'imessage' | 'telegram'

export function ChannelGlyph({ kind, size = 16 }: { kind: ChannelKey; size?: number }) {
  const box = { width: size, height: size, display: 'block' } as const

  if (kind === 'whatsapp') {
    return (
      <svg style={box} viewBox="0 0 24 24" aria-hidden="true">
        <path fill="#25D366" d="M12 0a12 12 0 0 0-10.3 18.1L0 24l6.1-1.6A12 12 0 1 0 12 0z" />
        <path
          fill="#fff"
          d="M8.9 6.6c-.2-.5-.4-.5-.6-.5h-.5c-.2 0-.5.1-.8.4-.3.3-1 1-1 2.4s1 2.8 1.2 3c.1.2 2 3.1 4.9 4.2 2.4 1 2.9.8 3.4.7.5 0 1.6-.6 1.9-1.3.2-.7.2-1.2.2-1.4-.1-.1-.3-.2-.6-.3l-2-1c-.3-.1-.5-.2-.7.1l-.7 1c-.2.2-.3.2-.6.1-.3-.2-1.3-.5-2.5-1.6-.9-.8-1.5-1.8-1.7-2.1-.2-.3 0-.5.1-.6l.5-.6c.1-.2.2-.3.3-.5 0-.2 0-.4-.1-.5l-.7-1.5z"
        />
      </svg>
    )
  }

  if (kind === 'telegram') {
    return (
      <svg style={box} viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="12" cy="12" r="12" fill="#2AABEE" />
        <path
          fill="#fff"
          d="M5.5 11.8 17 7.3c.5-.2 1 .1.9.7l-2 9.3c-.1.5-.5.7-1 .4l-2.7-2-1.3 1.3c-.2.2-.4.2-.6.2l.2-2.8 5.1-4.6c.2-.2 0-.3-.3-.1l-6.3 4-2.7-.9c-.6-.2-.6-.6.2-1z"
        />
      </svg>
    )
  }

  if (kind === 'imessage') {
    return (
      <svg style={box} viewBox="0 0 24 24" aria-hidden="true">
        <defs>
          <linearGradient id="imsg-g" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#5BF675" />
            <stop offset="1" stopColor="#0FBB2A" />
          </linearGradient>
        </defs>
        <rect width="24" height="24" rx="5.4" fill="url(#imsg-g)" />
        <path
          fill="#fff"
          d="M12 5.2c-3.8 0-6.8 2.4-6.8 5.4 0 1.8 1 3.3 2.7 4.3-.2.9-.7 1.9-1.4 2.7 1.4-.2 2.7-.8 3.6-1.5.6.1 1.2.2 1.9.2 3.8 0 6.8-2.4 6.8-5.7S15.8 5.2 12 5.2z"
        />
      </svg>
    )
  }

  // slack
  return (
    <svg style={box} viewBox="0 0 24 24" aria-hidden="true">
      <path fill="#E01E5A" d="M5.1 15.1a2 2 0 1 1-2-2h2zm1 0a2 2 0 0 1 4 0v5a2 2 0 0 1-4 0z" />
      <path fill="#36C5F0" d="M8.9 5.1a2 2 0 1 1 2-2v2zm0 1a2 2 0 0 1 0 4h-5a2 2 0 0 1 0-4z" />
      <path fill="#2EB67D" d="M18.9 8.9a2 2 0 1 1 2 2h-2zm-1 0a2 2 0 0 1-4 0v-5a2 2 0 0 1 4 0z" />
      <path fill="#ECB22E" d="M15.1 18.9a2 2 0 1 1-2 2v-2zm0-1a2 2 0 0 1 0-4h5a2 2 0 0 1 0 4z" />
    </svg>
  )
}
