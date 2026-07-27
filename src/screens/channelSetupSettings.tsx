import { useEffect, useRef, useState, type MouseEvent as ReactMouseEvent, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { Icon } from '../components'
import type { TextChannelSettings, WebChatChannelSettings } from './channelSetupSettings.types'

// ─── Emoji Picker ────────────────────────────────────────────────────────────

const EMOJI_CATEGORIES: { id: string; icon: string; label: string; emojis: string[] }[] = [
  {
    id: 'recent',
    icon: '🕐',
    label: 'Frequently used',
    emojis: ['😀','😂','❤️','👍','🙏','🎉','🔥','✨','😍','🥰','😊','🤩','😎','🤔','😅','🙌','💪','👏','🫶','💯'],
  },
  {
    id: 'smileys',
    icon: '😀',
    label: 'Smileys & people',
    emojis: [
      '😀','😃','😄','😁','😆','😅','🤣','😂','🙂','🙃','😉','😊','😇','🥰','😍','🤩','😘','😗','😚','😙',
      '🥲','😋','😛','😜','🤪','😝','🤑','🤗','🤭','🫢','🫣','🤫','🤔','🫡','🤐','🤨','😐','😑','😶','🫥',
      '😶‍🌫️','😏','😒','🙄','😬','😮‍💨','🤥','🫨','😌','😔','😪','🤤','😴','😷','🤒','🤕','🤢','🤮','🤧','🥵',
    ],
  },
  {
    id: 'animals',
    icon: '🐶',
    label: 'Animals & nature',
    emojis: [
      '🐶','🐱','🐭','🐹','🐰','🦊','🐻','🐼','🐨','🐯','🦁','🐮','🐷','🐸','🐵','🙈','🙉','🙊','🐔','🐧',
      '🐦','🐤','🦆','🦅','🦉','🦇','🐺','🐗','🐴','🦄','🐝','🪱','🐛','🦋','🐌','🐞','🐜','🪲','🦟','🦗',
      '🪰','🦂','🐢','🐍','🦎','🦖','🦕','🐙','🦑','🦐','🦞','🦀','🐡','🐠','🐟','🐬','🐳','🐋','🦈','🐊',
    ],
  },
  {
    id: 'food',
    icon: '🍎',
    label: 'Food & drink',
    emojis: [
      '🍏','🍎','🍐','🍊','🍋','🍌','🍉','🍇','🍓','🫐','🍈','🍒','🍑','🥭','🍍','🥥','🥝','🍅','🍆','🥑',
      '🥦','🥬','🥒','🌶️','🫑','🧄','🧅','🥔','🍠','🫚','🥐','🥯','🍞','🥖','🥨','🧀','🥚','🍳','🧈','🥞',
      '🧇','🥓','🥩','🍗','🍖','🌭','🍔','🍟','🍕','🫓','🥪','🥙','🧆','🌮','🌯','🫔','🥗','🥘','🫕','🥫',
    ],
  },
  {
    id: 'activity',
    icon: '🏀',
    label: 'Activities',
    emojis: [
      '⚽','🏀','🏈','⚾','🥎','🎾','🏐','🏉','🥏','🎱','🪀','🏓','🏸','🏒','🥍','🏏','🪃','🥅','⛳','🪁',
      '🛝','🏹','🎣','🤿','🥊','🥋','🎽','🛹','🛼','🛷','⛸️','🥌','🎿','⛷️','🏂','🪂','🏋️','🤼','🤸','⛹️',
      '🤺','🏇','🧘','🏄','🏊','🤽','🚣','🧗','🚵','🚴','🏆','🥇','🥈','🥉','🏅','🎖️','🏵️','🎗️','🎫','🎟️',
    ],
  },
  {
    id: 'travel',
    icon: '🚗',
    label: 'Travel & places',
    emojis: [
      '🚗','🚕','🚙','🚌','🚎','🏎️','🚓','🚑','🚒','🚐','🛻','🚚','🚛','🚜','🏍️','🛵','🛺','🚲','🛴','🛹',
      '🛼','🚏','🛣️','🛤️','⛽','🛞','🚨','🚥','🚦','🛑','🚧','⚓','🛟','⛵','🛶','🚤','🛳️','⛴️','🛥️','🚢',
      '✈️','🛩️','🛫','🛬','🪂','💺','🚁','🚟','🚠','🚡','🛰️','🚀','🛸','🎆','🌈','☀️','🌤️','⛅','🌦️','🌧️',
    ],
  },
  {
    id: 'objects',
    icon: '💡',
    label: 'Objects',
    emojis: [
      '⌚','📱','💻','⌨️','🖥️','🖨️','🖱️','🕹️','📀','💽','📼','📷','📸','📹','🎥','📽️','🎞️','📞','☎️','📟',
      '📠','📺','📻','🧭','⏱️','⏲️','⏰','🕰️','⌛','📡','🔋','🪫','🔌','💡','🔦','🕯️','🪔','🧯','🛢️','💰',
      '💵','💴','💶','💷','🪙','💸','💳','🪦','💎','⚖️','🪜','🧰','🪛','🔧','🔨','⚒️','🛠️','⛏️','🪚','🔩',
    ],
  },
  {
    id: 'symbols',
    icon: '#️⃣',
    label: 'Symbols',
    emojis: [
      '❤️','🧡','💛','💚','💙','💜','🖤','🤍','🤎','💔','❤️‍🔥','❤️‍🩹','❣️','💕','💞','💓','💗','💖','💘','💝',
      '💟','☮️','✝️','☪️','🪯','🕉️','☸️','✡️','🔯','🕎','☯️','☦️','🛐','⛎','♈','♉','♊','♋','♌','♍',
      '♎','♏','♐','♑','♒','♓','🆔','⚛️','🉑','☢️','☣️','📴','📳','🈶','🈚','🈸','🈺','🈷️','✴️','🆚',
    ],
  },
  {
    id: 'flags',
    icon: '🏳️',
    label: 'Flags',
    emojis: [
      '🏳️','🏴','🚩','🏁','🏳️‍🌈','🏳️‍⚧️','🏴‍☠️','🇺🇳','🇦🇫','🇦🇽','🇦🇱','🇩🇿','🇦🇸','🇦🇩','🇦🇴','🇦🇮','🇦🇶','🇦🇬','🇦🇷','🇦🇲',
      '🇦🇼','🇦🇺','🇦🇹','🇦🇿','🇧🇸','🇧🇭','🇧🇩','🇧🇧','🇧🇾','🇧🇪','🇧🇿','🇧🇯','🇧🇲','🇧🇹','🇧🇴','🇧🇦','🇧🇼','🇧🇷','🇮🇴','🇻🇬',
      '🇧🇳','🇧🇬','🇧🇫','🇧🇮','🇨🇻','🇰🇭','🇨🇲','🇨🇦','🇮🇨','🇨🇫','🇹🇩','🇨🇱','🇨🇳','🇨🇽','🇨🇨','🇨🇴','🇰🇲','🇨🇬','🇨🇩','🇨🇰',
    ],
  },
]

const SKIN_TONES = [
  { label: 'Default', modifier: '' },
  { label: 'Light', modifier: '🏻' },
  { label: 'Medium-light', modifier: '🏼' },
  { label: 'Medium', modifier: '🏽' },
  { label: 'Medium-dark', modifier: '🏾' },
  { label: 'Dark', modifier: '🏿' },
]

function EmojiPicker({ onSelect, onClose, anchor }: { onSelect: (emoji: string) => void; onClose: () => void; anchor: { top: number; left: number } }) {
  const [activeCategory, setActiveCategory] = useState('recent')
  const [search, setSearch] = useState('')
  const [skinTone, setSkinTone] = useState(0)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose()
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [onClose])

  const currentCategory = EMOJI_CATEGORIES.find((c) => c.id === activeCategory) ?? EMOJI_CATEGORIES[0]

  const displayEmojis = search.trim()
    ? EMOJI_CATEGORIES.flatMap((c) => c.emojis).filter((e) =>
        e.includes(search.trim()),
      )
    : currentCategory.emojis

  function applyTone(emoji: string): string {
    if (skinTone === 0) return emoji
    const modifier = SKIN_TONES[skinTone].modifier
    // Only apply to base hand/person emojis (single codepoint, no existing tone)
    return emoji + modifier
  }

  return (
    <div
      ref={ref}
      className="fixed z-[200] w-[320px] overflow-hidden rounded-md border border-border bg-surface shadow-dropdown"
      style={{ top: anchor.top, left: anchor.left }}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Category tabs */}
      <div className="flex items-center gap-[2px] border-b border-border px-sm pt-sm pb-xs overflow-x-auto scrollbar-hide">
        {EMOJI_CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            type="button"
            title={cat.label}
            onClick={() => { setActiveCategory(cat.id); setSearch('') }}
            className={`flex size-7 shrink-0 items-center justify-center rounded-sm text-base transition-colors ${
              activeCategory === cat.id && !search
                ? 'bg-surface-selected'
                : 'hover:bg-surface-hover'
            }`}
          >
            {cat.icon}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="px-sm pt-sm pb-xs">
        <div className="flex h-8 items-center gap-sm rounded-sm border border-border px-sm">
          <Icon name="search" size={14} className="shrink-0 text-text-icon" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search emoji"
            className="min-w-0 flex-1 bg-transparent text-small text-text-primary outline-none placeholder:text-text-tertiary"
          />
        </div>
      </div>

      {/* Group label */}
      {!search && (
        <p className="px-md pb-xs text-small text-text-secondary">{currentCategory.label}</p>
      )}

      {/* Emoji grid */}
      <div className="grid grid-cols-8 gap-0 overflow-y-auto px-xs" style={{ maxHeight: '220px' }}>
        {displayEmojis.length > 0 ? displayEmojis.map((emoji, i) => (
          <button
            key={i}
            type="button"
            title={emoji}
            onClick={() => onSelect(applyTone(emoji))}
            className="flex size-9 items-center justify-center rounded-sm text-xl hover:bg-surface-hover"
          >
            {applyTone(emoji)}
          </button>
        )) : (
          <p className="col-span-8 py-md text-center text-small text-text-tertiary">No emoji found</p>
        )}
      </div>

      {/* Skin tones */}
      <div className="flex items-center gap-sm border-t border-border px-md py-sm">
        <span className="text-small text-text-secondary">Skin tone</span>
        <div className="flex gap-[3px]">
          {SKIN_TONES.map((tone, i) => (
            <button
              key={i}
              type="button"
              title={tone.label}
              onClick={() => setSkinTone(i)}
              className={`flex size-6 items-center justify-center rounded-sm text-sm transition-colors ${
                skinTone === i ? 'ring-2 ring-primary' : 'hover:bg-surface-hover'
              }`}
            >
              {i === 0 ? '✋' : `✋${tone.modifier}`}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

const FIELD_BORDER_CLASS =
  'rounded-sm border border-border-input transition-colors focus:border-primary focus:outline-none focus-visible:border-primary'

const INPUT_CLASS = `w-full bg-surface px-md text-body text-text-primary ${FIELD_BORDER_CLASS}`

const CHECKBOX_ROW_GAP = 'gap-sm'
const CHECKBOX_ROW_INDENT = <span className="size-4 shrink-0" aria-hidden />

function SettingsCheckboxBox({ checked }: { checked: boolean }) {
  return (
    <span
      className={`flex size-4 shrink-0 items-center justify-center rounded-[2px] border transition-colors ${
        checked ? 'border-primary bg-primary' : 'border-control-border bg-surface'
      }`}
    >
      {checked && <Icon name="check" size={11} fill weight={600} className="text-white" />}
    </span>
  )
}

function SettingSubtext({ children }: { children: ReactNode }) {
  return <p className="mt-[2px] text-small text-text-secondary">{children}</p>
}

function CheckboxRow({
  label,
  description,
  checked,
  onChange,
}: {
  label: string
  description?: string
  checked: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`flex w-full items-start rounded-sm text-left ${CHECKBOX_ROW_GAP}`}
    >
      <span className="mt-[2px] shrink-0">
        <SettingsCheckboxBox checked={checked} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-body text-text-primary">{label}</p>
        {description && <SettingSubtext>{description}</SettingSubtext>}
      </div>
    </button>
  )
}

function CheckboxLabelRow({
  label,
  checked,
  onChange,
}: {
  label: string
  checked: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`flex w-full items-start rounded-sm text-left ${CHECKBOX_ROW_GAP}`}
    >
      <span className="mt-[1px] shrink-0">
        <SettingsCheckboxBox checked={checked} />
      </span>
      <span className="text-small text-text-secondary">{label}</span>
    </button>
  )
}

function CheckboxRowField({ children }: { children: ReactNode }) {
  return (
    <div className={`flex items-start ${CHECKBOX_ROW_GAP}`}>
      {CHECKBOX_ROW_INDENT}
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  )
}

function formatFallbackChipLabel(label: string): string {
  return label
    .split(/[._\s-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join('')
}

const PERSONALIZE_TOKENS = [
  {
    group: 'Business',
    items: [
      { label: 'Location name', example: 'E.g. Grand Junction - Northeast' },
      { label: 'Address', example: 'E.g. 150, Main Street' },
      { label: 'City', example: 'E.g. Grand Junction, CO' },
      { label: 'Zip code', example: 'E.g. 81504' },
      { label: 'State', example: 'E.g. Colorado' },
      { label: 'Country', example: 'E.g. USA' },
      { label: 'Phone', example: 'E.g. (514) 555-1212' },
      { label: 'Category', example: 'E.g. Property Management, Dental' },
      { label: 'Facebook', example: 'E.g. facebook.com/xyzdental' },
      { label: 'X (Twitter)', example: 'E.g. twitter.com/xyzdental' },
    ],
  },
]

function PersonalizeDropdown({
  query,
  onSelect,
  onQueryChange,
  anchor,
}: {
  query: string
  onSelect: (label: string) => void
  onQueryChange: (q: string) => void
  anchor: { top: number; left: number; width: number }
}) {
  const filtered = PERSONALIZE_TOKENS.map((group) => ({
    ...group,
    items: group.items.filter((item) =>
      item.label.toLowerCase().includes(query.toLowerCase()),
    ),
  })).filter((group) => group.items.length > 0)

  return createPortal(
    <div
      data-personalize-dropdown
      className="fixed z-[200] w-[420px] overflow-hidden rounded-md border border-border bg-surface shadow-dropdown"
      style={{
        left: anchor.left,
        top: anchor.top,
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="px-md pt-md pb-sm">
        <div className="flex h-10 items-center gap-sm rounded-sm border border-primary px-md">
          <Icon name="search" size={18} className="shrink-0 text-text-icon" />
          <input
            autoFocus
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            placeholder="Search tokens"
            className="min-w-0 flex-1 bg-transparent text-body text-text-primary outline-none placeholder:text-text-tertiary"
          />
        </div>
      </div>
      <div className="max-h-[320px] overflow-y-auto px-md pb-md">
        {filtered.map((group) => (
          <div key={group.group}>
            <p className="mb-sm mt-sm text-body text-text-primary">
              {group.group}
            </p>
            {group.items.map((item) => (
              <button
                key={item.label}
                type="button"
                onClick={() => onSelect(item.label)}
                className="w-full rounded-sm px-sm py-sm text-left hover:bg-surface-hover"
              >
                <p className="text-body text-text-primary">{item.label}</p>
                <p className="text-small text-text-tertiary">{item.example}</p>
              </button>
            ))}
          </div>
        ))}
        {filtered.length === 0 && (
          <p className="py-sm text-body text-text-tertiary">No tokens found.</p>
        )}
      </div>
    </div>,
    document.body,
  )
}

function FallbackField({
  prefix,
  chipLabel,
}: {
  prefix: string
  chipLabel: string
}) {
  type SuffixPart = { type: 'text'; value: string } | { type: 'token'; label: string }
  const [suffixParts, setSuffixParts] = useState<SuffixPart[]>([])
  const [currentText, setCurrentText] = useState('')
  const [chipVisible, setChipVisible] = useState(true)
  const [personalizeOpen, setPersonalizeOpen] = useState(false)
  const [personalizeAnchor, setPersonalizeAnchor] = useState<{
    top: number
    left: number
    width: number
  } | null>(null)
  const [emojiOpen, setEmojiOpen] = useState(false)
  const [emojiAnchor, setEmojiAnchor] = useState<{ top: number; left: number } | null>(null)
  const [query, setQuery] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const emojiButtonRef = useRef<HTMLButtonElement>(null)
  const personalizeButtonRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      const target = e.target as Node
      const inField = containerRef.current?.contains(target)
      const inDropdown = (target as Element).closest?.('[data-personalize-dropdown]')
      if (!inField && !inDropdown) {
        setPersonalizeOpen(false)
        setPersonalizeAnchor(null)
        setEmojiOpen(false)
        setQuery('')
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  useEffect(() => {
    if (!personalizeOpen && !emojiOpen) return
    function handleScroll() {
      if (personalizeOpen && personalizeButtonRef.current) {
        const rect = personalizeButtonRef.current.getBoundingClientRect()
        setPersonalizeAnchor({ top: rect.bottom + 4, left: rect.left, width: rect.width })
      }
      if (emojiOpen && emojiButtonRef.current) {
        const rect = emojiButtonRef.current.getBoundingClientRect()
        setEmojiAnchor({ top: rect.bottom + 4, left: rect.left })
      }
    }
    window.addEventListener('scroll', handleScroll, true)
    return () => window.removeEventListener('scroll', handleScroll, true)
  }, [personalizeOpen, emojiOpen])

  function handleSelectToken(label: string) {
    setSuffixParts((prev) => [
      ...prev,
      ...(currentText ? [{ type: 'text' as const, value: currentText }] : []),
      { type: 'token' as const, label },
    ])
    setCurrentText('')
    setPersonalizeOpen(false)
    setPersonalizeAnchor(null)
    setQuery('')
    textareaRef.current?.focus()
  }

  function handleSelectEmoji(emoji: string) {
    setCurrentText((prev) => prev + emoji)
    setEmojiOpen(false)
    textareaRef.current?.focus()
  }

  function togglePersonalize(e: ReactMouseEvent<HTMLButtonElement>) {
    e.stopPropagation()
    setEmojiOpen(false)
    if (personalizeOpen) {
      setPersonalizeOpen(false)
      setPersonalizeAnchor(null)
      setQuery('')
      return
    }
    const rect = e.currentTarget.getBoundingClientRect()
    setPersonalizeAnchor({ top: rect.bottom + 4, left: rect.left, width: rect.width })
    setPersonalizeOpen(true)
    setQuery('')
  }

  return (
    <div
      ref={containerRef}
      className={`relative bg-surface ${FIELD_BORDER_CLASS} focus-within:border-primary`}
      onClick={() => textareaRef.current?.focus()}
    >
      <div className="cursor-text px-md pt-sm pb-xs text-body leading-[1.7] text-text-primary">
        <span>{prefix} </span>
        {chipVisible && (
          <span className="mx-[2px] inline-flex h-[22px] items-center rounded-sm bg-chip-neutral-bg px-sm align-middle text-small text-chip-neutral-text">
            {formatFallbackChipLabel(chipLabel)}
          </span>
        )}
        {suffixParts.map((part, i) =>
          part.type === 'token' ? (
            <span key={i} className="mx-[2px] inline-flex h-[22px] items-center rounded-sm bg-chip-neutral-bg px-sm align-middle text-small text-chip-neutral-text">
              {formatFallbackChipLabel(part.label)}
            </span>
          ) : (
            <span key={i}>{part.value}</span>
          )
        )}
        <textarea
          ref={textareaRef}
          value={currentText}
          onChange={(e) => setCurrentText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Backspace' && currentText === '') {
              e.preventDefault()
              if (suffixParts.length > 0) {
                setSuffixParts((prev) => prev.slice(0, -1))
              } else if (chipVisible) {
                setChipVisible(false)
              }
            }
          }}
          rows={1}
          className="inline-block min-w-[2px] w-32 resize-none bg-transparent align-middle text-body text-text-primary outline-none"
          onClick={(e) => e.stopPropagation()}
        />
      </div>
      <div className="flex items-center gap-[2px] bg-surface px-sm py-[6px]">
        <button
          type="button"
          title="AI personalize"
          className="flex h-7 items-center gap-[3px] rounded-sm px-[6px] text-text-icon hover:bg-surface-hover hover:text-primary focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
            <rect x="1.5" y="1.5" width="13" height="13" rx="2.5" stroke="currentColor" strokeWidth="1.25" />
            <text x="8" y="11.5" textAnchor="middle" fontSize="7.5" fill="currentColor" fontFamily="sans-serif">
              Ai
            </text>
            <path d="M12 1.5 L13 3 L14 1.5 L13 0 Z" fill="#7C3AED" />
          </svg>
          <span className="sr-only">AI</span>
        </button>
        <div className="relative">
          <button
            ref={emojiButtonRef}
            type="button"
            title="Emoji"
            onClick={(e) => {
              e.stopPropagation()
              if (emojiOpen) {
                setEmojiOpen(false)
                setEmojiAnchor(null)
              } else {
                const rect = emojiButtonRef.current!.getBoundingClientRect()
                setEmojiAnchor({ top: rect.bottom + 4, left: rect.left })
                setEmojiOpen(true)
              }
              setPersonalizeOpen(false)
              setPersonalizeAnchor(null)
            }}
            className="flex size-7 items-center justify-center rounded-sm text-text-icon hover:bg-surface-hover hover:text-primary focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary"
          >
            <Icon name="sentiment_satisfied" size={18} />
          </button>
          {emojiOpen && emojiAnchor && createPortal(
            <EmojiPicker
              anchor={emojiAnchor}
              onSelect={handleSelectEmoji}
              onClose={() => { setEmojiOpen(false); setEmojiAnchor(null) }}
            />,
            document.body,
          )}
        </div>
        <div className="relative">
          <button
            ref={personalizeButtonRef}
            type="button"
            onClick={togglePersonalize}
            className="flex items-center gap-[3px] rounded-sm px-[6px] py-[3px] text-body text-primary hover:bg-surface-hover focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary"
          >
            Personalize
            <Icon name="expand_more" size={16} className="text-primary" />
          </button>
          {personalizeOpen && personalizeAnchor && (
            <PersonalizeDropdown
              query={query}
              onSelect={handleSelectToken}
              onQueryChange={setQuery}
              anchor={personalizeAnchor}
            />
          )}
        </div>
      </div>
    </div>
  )
}

/** Static channel card — matches Agent settings tab body, without accordion toggle or chevron. */
export function ChannelSettingsPanel({
  title,
  children,
}: {
  title: string
  children: ReactNode
}) {
  return (
    <div className="overflow-hidden rounded-md border border-border bg-surface">
      <div className="flex h-14 items-center px-lg">
        <span className="text-body text-text-primary">{title}</span>
      </div>
      <div className="px-lg pb-lg pt-md">{children}</div>
    </div>
  )
}

export function WebChatSetupSettings({
  settings,
  onSettingsChange,
  chatAgentNameError = false,
}: {
  settings: WebChatChannelSettings
  onSettingsChange: (patch: Partial<WebChatChannelSettings>) => void
  chatAgentNameError?: boolean
}) {
  const {
    aiAgentName,
    escalationEnabled,
    escalationName,
    duringEnabled,
    afterEnabled,
  } = settings

  return (
    <div className="flex flex-col gap-xl">
      <div className="flex flex-col gap-sm">
        <div>
          <label className="text-body text-text-primary">AI agent name</label>
          <p className="mt-[2px] text-small text-text-secondary">
            Name shown to patients in the chat
          </p>
        </div>
        <input
          type="text"
          value={aiAgentName}
          onChange={(e) => onSettingsChange({ aiAgentName: e.target.value })}
          placeholder="e.g. Robin"
          className={`${INPUT_CLASS} h-9 placeholder:text-text-tertiary ${
            chatAgentNameError ? 'border-chip-danger-text focus:border-chip-danger-text focus-visible:border-chip-danger-text' : ''
          }`}
        />
        {chatAgentNameError && (
          <p className="text-small text-chip-danger-text">Enter an AI agent name</p>
        )}
      </div>

      <div className="flex flex-col gap-sm">
        <CheckboxRow
          label="Escalation button"
          description="A quick reply button patients can tap to reach a team member"
          checked={escalationEnabled}
          onChange={(v) => onSettingsChange({ escalationEnabled: v })}
        />
        {escalationEnabled && (
          <CheckboxRowField>
            <label className="mb-xs block text-small text-text-secondary">Button name</label>
            <input
              type="text"
              value={escalationName}
              onChange={(e) => onSettingsChange({ escalationName: e.target.value })}
              className={`${INPUT_CLASS} h-9`}
            />
          </CheckboxRowField>
        )}
      </div>

      <div className="flex flex-col gap-md">
        <p className="text-body text-text-primary">Fallback message</p>

        <div className="flex flex-col gap-sm">
          <CheckboxLabelRow
            label="During business hours"
            checked={duringEnabled}
            onChange={(v) => onSettingsChange({ duringEnabled: v })}
          />
          {duringEnabled && (
            <CheckboxRowField>
              <FallbackField
                prefix="We're not available right now. Our team will follow up during business hours. You can also reach us at"
                chipLabel="business.phone"
              />
            </CheckboxRowField>
          )}
        </div>

        <div className="flex flex-col gap-sm">
          <CheckboxLabelRow
            label="After business hours"
            checked={afterEnabled}
            onChange={(v) => onSettingsChange({ afterEnabled: v })}
          />
          {afterEnabled && (
            <CheckboxRowField>
              <FallbackField
                prefix="Our team is offline right now. Leave a message and we'll follow up during business hours. You can also call us at"
                chipLabel="business.phone"
              />
            </CheckboxRowField>
          )}
        </div>
      </div>
    </div>
  )
}

export function TextSetupSettings({
  settings,
  onSettingsChange,
}: {
  settings: TextChannelSettings
  onSettingsChange: (patch: Partial<TextChannelSettings>) => void
}) {
  const { unsubscribeEnabled, beforeEnabled, afterEnabled } = settings

  return (
    <div className="flex flex-col gap-lg">
      <CheckboxRow
        label="Unsubscribe text"
        description="Enabling this will allow customers to opt out of text communications"
        checked={unsubscribeEnabled}
        onChange={(v) => onSettingsChange({ unsubscribeEnabled: v })}
      />

      <div className="flex flex-col gap-sm">
        <p className="text-body text-text-primary">Fallback message</p>

        <div className="flex flex-col gap-sm">
          <CheckboxLabelRow
            label="Before business hours"
            checked={beforeEnabled}
            onChange={(v) => onSettingsChange({ beforeEnabled: v })}
          />
          {beforeEnabled && (
            <CheckboxRowField>
              <FallbackField
                prefix="We're not available right now. Our team will follow up during business hours. You can also reach us at"
                chipLabel="business.phone"
              />
            </CheckboxRowField>
          )}
        </div>

        <div className="flex flex-col gap-sm">
          <CheckboxLabelRow
            label="After business hours"
            checked={afterEnabled}
            onChange={(v) => onSettingsChange({ afterEnabled: v })}
          />
          {afterEnabled && (
            <CheckboxRowField>
              <FallbackField
                prefix="Our team is offline right now. Leave a message and we'll follow up during business hours."
                chipLabel="business.phone"
              />
            </CheckboxRowField>
          )}
        </div>
      </div>
    </div>
  )
}
