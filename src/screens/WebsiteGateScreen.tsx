import { useState } from 'react'
import { Icon } from '../components'

// Front gate shown before Overview, using the actual Birdeye website design
// (public/website-gate.svg — a Figma export, so every glyph is a path; there's no
// live text to hook a click on) as a literal, unmodified background. Clicking the
// "Dashboard" pill opens the same "Continue as" menu the Super agent prototype
// itself uses. This screen doesn't redraw or reinterpret the site — it only adds
// one invisible hotspot button on top, positioned by percentage so it tracks the
// image regardless of viewport size.
export interface WebsiteGateScreenProps {
  onCurrentUser: () => void
  onNewUser: () => void
}

// Measured directly off the SVG's own 1920x1067 viewBox.
const DASHBOARD_HOTSPOT = { left: 74.22, top: 2.53, width: 8.96, height: 7.5 }

export function WebsiteGateScreen({ onCurrentUser, onNewUser }: WebsiteGateScreenProps) {
  const [continueOpen, setContinueOpen] = useState(false)

  return (
    <div className="flex h-screen w-screen items-center justify-center overflow-hidden bg-[#0b0b0b]">
      <div
        className="relative"
        style={{
          aspectRatio: '1920 / 1067',
          width: '100%',
          height: '100%',
          maxWidth: 'calc(100vh * 1920 / 1067)',
          maxHeight: 'calc(100vw * 1067 / 1920)',
        }}
      >
        <img
          src={`${import.meta.env.BASE_URL}website-gate.svg`}
          alt="Birdeye"
          className="absolute inset-0 h-full w-full select-none"
          draggable={false}
        />

        {/* Hotspot over the SVG's own "Dashboard" pill — same pattern the Super
            agent prototype uses for its own screenshot-based screens. */}
        <button
          type="button"
          aria-label="Dashboard"
          aria-expanded={continueOpen}
          onClick={() => setContinueOpen((v) => !v)}
          className="absolute cursor-pointer"
          style={{
            left: `${DASHBOARD_HOTSPOT.left}%`,
            top: `${DASHBOARD_HOTSPOT.top}%`,
            width: `${DASHBOARD_HOTSPOT.width}%`,
            height: `${DASHBOARD_HOTSPOT.height}%`,
          }}
        />

        {continueOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setContinueOpen(false)} />
            <div
              className="absolute z-50 w-[340px] rounded-sm border border-border bg-surface py-md shadow-dropdown"
              style={{
                left: `${DASHBOARD_HOTSPOT.left}%`,
                top: `${DASHBOARD_HOTSPOT.top + DASHBOARD_HOTSPOT.height + 1}%`,
              }}
            >
              <div className="px-lg pb-sm text-small text-text-tertiary">Continue as</div>

              <button
                type="button"
                onClick={onCurrentUser}
                className="flex w-full items-start gap-md px-lg py-sm text-left hover:bg-surface-hover"
              >
                <span className="flex size-9 shrink-0 items-center justify-center rounded-sm bg-surface-l2 text-text-icon">
                  <Icon name="home" size={20} />
                </span>
                <span className="flex-1">
                  <span className="block text-body text-text-primary">Current user</span>
                  <span className="block text-small text-text-secondary">
                    Open a Birdeye account that is already set up and has history in it
                  </span>
                </span>
                <Icon name="chevron_right" size={18} className="mt-xs shrink-0 text-text-icon" />
              </button>

              <button
                type="button"
                onClick={onNewUser}
                className="flex w-full items-start gap-md px-lg py-sm text-left hover:bg-surface-hover"
              >
                <span className="flex size-9 shrink-0 items-center justify-center rounded-sm bg-surface-l2 text-text-icon">
                  <Icon name="add" size={20} />
                </span>
                <span className="flex-1">
                  <span className="block text-body text-text-primary">New user</span>
                  <span className="block text-small text-text-secondary">
                    Sign up and set the workspace up from scratch
                  </span>
                </span>
                <Icon name="chevron_right" size={18} className="mt-xs shrink-0 text-text-icon" />
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
