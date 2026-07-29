import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Icon } from '../Icon/Icon'
import type { CreateAgentModalProps } from './CreateAgentModal.types'

const TRANSITION_MS = 200

// Inline (not <img>) so it can inherit the selected/unselected text color via
// fill="currentColor" — an <img src="*.svg"> can't be recolored from the page.
function MarketingAutomationIcon({ className = '' }: { className?: string }) {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" className={className}>
      <path
        d="M15.3596 15.3693C13.6708 17.0538 11.3835 18 8.99904 18C6.61455 18 4.32732 17.0538 2.63848 15.3693C2.35001 15.0798 2.08297 14.7704 1.83816 14.4437L1.68898 15.5236C1.65766 15.7422 1.46973 15.9039 1.24886 15.9022H1.18704C1.07083 15.8857 0.966972 15.8247 0.896921 15.7315C0.826038 15.6382 0.795542 15.5203 0.812028 15.4048L1.11122 13.2245C1.14419 12.9861 1.36178 12.8187 1.6008 12.8484L3.78084 13.1256C4.02398 13.1561 4.19626 13.378 4.16575 13.6205C4.13525 13.8639 3.91436 14.0363 3.67121 14.0058L2.48434 13.8301C2.72089 14.1485 2.98052 14.4504 3.25993 14.7317C4.87787 16.351 7.10243 17.2122 9.38797 17.1026C11.6727 16.9929 13.8059 15.923 15.2605 14.1569C16.716 12.3899 17.3581 10.0908 17.0301 7.82479C17.0128 7.70848 17.0433 7.5905 17.1133 7.49729C17.1834 7.40325 17.2881 7.34138 17.4034 7.32488C17.6441 7.29106 17.8666 7.45852 17.9005 7.69939C18.3241 10.5149 17.3806 13.3648 15.3596 15.3693ZM13.8208 4.39207L13.8216 4.3929C13.8068 4.50839 13.8389 4.62554 13.9115 4.71711C13.9832 4.8095 14.0878 4.86889 14.204 4.88292L16.3841 5.16009H16.4393C16.6594 5.16257 16.8481 5.00088 16.8786 4.78227L17.1778 2.60203C17.2108 2.35868 17.041 2.13513 16.7987 2.10129C16.5555 2.0683 16.3322 2.23823 16.2984 2.48077L16.1492 3.55896C14.5782 1.48838 12.1896 0.198208 9.5983 0.0208149C7.00618 -0.15572 4.46512 0.797077 2.62711 2.63504C0.618501 4.63714 -0.320338 7.4749 0.0976508 10.2813C0.128146 10.4999 0.3169 10.6624 0.53695 10.6599H0.60124C0.716631 10.6434 0.821312 10.5816 0.891363 10.4884C0.961421 10.3943 0.991917 10.2764 0.974609 10.1609C0.649037 7.89636 1.29193 5.59975 2.74584 3.83533C4.19975 2.0708 6.32944 1.00085 8.61266 0.889554C10.8948 0.777363 13.1194 1.63446 14.7382 3.24888C15.0176 3.53017 15.2772 3.8321 15.5138 4.15052L14.3203 3.99873C14.0813 3.97151 13.8645 4.14227 13.8348 4.3815L13.8208 4.39207ZM10.9204 12.4128V11.9574C10.538 11.7751 9.74672 11.4096 8.79733 11.0599L8.47425 12.0407L8.51793 13.7566C8.53606 14.0948 8.41573 14.4264 8.18413 14.6739C7.95252 14.9214 7.63108 15.0641 7.29232 15.0682C6.95356 15.0732 6.62801 14.9387 6.38982 14.6978C6.15244 14.4569 6.02304 14.1286 6.03211 13.7904V10.3101H5.99914C5.00762 10.1789 4.26665 9.33175 4.26747 8.33028V8.24696C4.26747 7.2455 5.00762 6.39912 5.99914 6.26713C7.93109 5.98335 10.1927 4.94725 10.9205 4.60408V4.15037C10.9205 3.90785 11.1166 3.71069 11.3598 3.71069C11.6029 3.71069 11.7991 3.90785 11.7991 4.15037V5.95697C12.9217 6.16485 13.7352 7.14404 13.7352 8.28652C13.7352 9.42821 12.9217 10.4083 11.7991 10.6161V12.4218C11.7991 12.6652 11.6029 12.8615 11.3598 12.8615C11.1166 12.8615 10.9205 12.6652 10.9205 12.4218L10.9204 12.4128ZM11.7998 6.85192V9.71196C12.4328 9.52387 12.8656 8.9423 12.8656 8.28154C12.8656 7.62159 12.4328 7.04 11.7998 6.85192ZM6.12672 9.42982C6.39293 9.46941 6.66329 9.52221 6.93527 9.58408L6.88004 6.9971C6.62701 7.05402 6.3748 7.10022 6.12589 7.13817C5.57037 7.20828 5.15249 7.67767 5.14591 8.23779V8.33018C5.1525 8.8903 5.5712 9.35971 6.12672 9.42982ZM7.59464 11.9946C7.59216 11.9443 7.59958 11.8948 7.61689 11.8478L7.96635 10.7721C7.61936 10.6624 7.26494 10.5518 6.91135 10.4751V13.7904C6.91218 13.9909 7.07537 14.1534 7.27566 14.1534C7.37374 14.1534 7.46771 14.1138 7.53612 14.0437C7.60453 13.9736 7.64244 13.8795 7.64079 13.7814L7.59464 11.9946ZM10.9204 10.9915V5.5692C9.89507 6.04519 8.83761 6.44609 7.75542 6.76865L7.81888 9.80693C8.87881 10.127 9.91486 10.5205 10.9204 10.9857L10.9204 10.9915Z"
        fill="currentColor"
      />
    </svg>
  )
}

interface ProductOption {
  id: string
  label: string
  /** Material Symbol name — omit when using svgIcon instead. */
  icon?: string
  /** Inline SVG renderer (colorable via currentColor) for non-Material-Symbol icons. */
  svgIcon?: (props: { className?: string }) => JSX.Element
}

interface ProductGroup {
  id: string
  label: string
  items: ProductOption[]
}

// Mirrors the real product groupings in the L1 icon rail (App.tsx RAIL_GROUPS
// marketing/operations/cx sections — the main/footer groups aren't product surfaces).
const PRODUCT_GROUPS: ProductGroup[] = [
  {
    id: 'marketing',
    label: 'Marketing',
    items: [
      { id: 'search', label: 'Search AI', icon: 'lightbulb' },
      { id: 'listings', label: 'Listings AI', icon: 'place' },
      { id: 'reviews', label: 'Reviews AI', icon: 'star' },
      { id: 'social', label: 'Social AI', icon: 'workspaces' },
      { id: 'referral', label: 'Referral', icon: 'featured_seasonal_and_gifts' },
      { id: 'marketing-automation', label: 'Marketing Automation AI', svgIcon: MarketingAutomationIcon },
    ],
  },
  {
    id: 'operations',
    label: 'Operations',
    items: [
      { id: 'inbox', label: 'Inbox', icon: 'sms' },
      { id: 'frontdesk', label: 'Front desk', icon: 'desktop_windows' },
    ],
  },
  {
    id: 'cx',
    label: 'Customer experience',
    items: [
      { id: 'surveys', label: 'Surveys AI', icon: 'assignment_turned_in' },
      { id: 'ticketing', label: 'Ticketing', icon: 'shapes' },
      { id: 'insights', label: 'Insights AI', icon: 'emoji_objects' },
    ],
  },
]

function ProductPill({
  item,
  selected,
  onSelect,
}: {
  item: ProductOption
  selected: boolean
  onSelect: () => void
}) {
  const iconClassName = selected ? 'text-primary' : 'text-text-icon'
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`flex items-center gap-sm rounded-sm border px-lg py-sm text-body transition-colors ${
        selected ? 'border-primary bg-primary/5 text-primary' : 'border-border-selected text-text-primary hover:bg-surface-hover'
      }`}
    >
      <span className="flex size-5 shrink-0 items-center justify-center">
        {item.svgIcon ? <item.svgIcon className={iconClassName} /> : <Icon name={item.icon!} size={20} className={iconClassName} />}
      </span>
      {item.label}
    </button>
  )
}

export function CreateAgentModal({ open, onClose, onProceed }: CreateAgentModalProps) {
  const [selected, setSelected] = useState<string | null>(null)
  // `mounted` keeps the modal in the DOM through the slide-out; `entered` toggles
  // the transform/opacity classes that drive the slide-down-in / slide-up-out.
  const [mounted, setMounted] = useState(open)
  const [entered, setEntered] = useState(false)
  const unmountTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const rafRef = useRef<number | null>(null)

  useEffect(() => {
    if (open) {
      if (unmountTimerRef.current) {
        clearTimeout(unmountTimerRef.current)
        unmountTimerRef.current = null
      }
      setMounted(true)
      // Double rAF guarantees a paint of the "hidden" state before flipping to
      // "entered" — a single rAF can land in the same frame and skip the transition.
      rafRef.current = requestAnimationFrame(() => {
        rafRef.current = requestAnimationFrame(() => setEntered(true))
      })
    } else {
      setEntered(false)
      unmountTimerRef.current = setTimeout(() => setMounted(false), TRANSITION_MS)
    }
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [open])

  useEffect(() => {
    return () => {
      if (unmountTimerRef.current) clearTimeout(unmountTimerRef.current)
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [])

  if (!mounted) return null

  function handleClose() {
    setSelected(null)
    onClose()
  }

  return createPortal(
    <div
      className={`fixed inset-0 z-[200] flex items-start justify-center bg-black/40 pt-16 transition-opacity duration-200 ease-out ${
        entered ? 'opacity-100' : 'opacity-0'
      }`}
      onClick={(e) => { if (e.target === e.currentTarget) handleClose() }}
    >
      <div
        className={`relative flex max-h-[80vh] w-[560px] flex-col rounded-lg bg-surface shadow-modal transition-all duration-200 ease-out ${
          entered ? 'translate-y-0 opacity-100' : '-translate-y-8 opacity-0'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex shrink-0 items-center justify-between px-xl py-lg">
          <span className="text-h3 text-text-primary">Create agent</span>
          <button
            type="button"
            onClick={handleClose}
            className="flex size-7 items-center justify-center rounded-sm text-text-icon hover:bg-surface-hover"
          >
            <Icon name="close" size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-xl py-lg">
          <p className="mb-lg text-body text-text-secondary">Select a product to create a new agent for.</p>
          <div className="flex flex-col gap-lg">
            {PRODUCT_GROUPS.map((group) => (
              <div key={group.id} className="flex flex-col gap-sm">
                <span className="text-small text-text-tertiary">{group.label}</span>
                <div className="flex flex-wrap gap-sm">
                  {group.items.map((item) => (
                    <ProductPill
                      key={item.id}
                      item={item}
                      selected={selected === item.id}
                      onSelect={() => setSelected(item.id)}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex shrink-0 items-center justify-end gap-sm px-xl py-lg">
          <button
            type="button"
            onClick={handleClose}
            className="rounded-sm px-md py-xs text-body text-text-action hover:bg-surface-hover"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={!selected}
            onClick={() => {
              if (!selected) return
              const label = PRODUCT_GROUPS.flatMap((g) => g.items).find((i) => i.id === selected)?.label ?? selected
              onProceed(selected, label)
            }}
            className={`flex h-9 items-center rounded-sm px-lg text-body transition-colors ${
              selected ? 'bg-primary text-white hover:bg-primary-hover' : 'cursor-not-allowed bg-surface-selected text-text-tertiary'
            }`}
          >
            Proceed
          </button>
        </div>
      </div>
    </div>,
    document.body,
  )
}
