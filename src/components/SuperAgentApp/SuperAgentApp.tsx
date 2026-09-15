import { useEffect, useRef, useState } from 'react'
import { SuperAgentAppProps } from './SuperAgentApp.types'
import { ChannelPreviewModal } from '../../screens/superAgent/ChannelPreviewModal'
import { type ChannelKey } from '../../screens/superAgent/ChannelGlyph'

// Embeds the self-contained Super Agent prototype (public/super-agent-prototype.html).
// Two independent mounts of this component exist side by side, for two different demo
// stories:
//   - `mode="overlay"` (default) — a full-viewport fixed layer, independent of the
//     Birdeye Dashboard's own L1/L2 nav. The iframe draws its own chrome entirely (its
//     own left nav, its own "Birdeye ⌄" switcher). Opened from the Website gate's "new
//     user" choice or the TopBar AppSwitcher — the "standalone app" story. Left via the
//     prototype's own "Back to Birdeye" action, which posts a message back here (see
//     onBackToBirdeye).
//   - `mode="embedded"` — sized to fill its container (`?stage=app` skips straight to
//     the workspace instead of the prototype's own marketing-site boot screen;
//     `?chrome=none` hides the prototype's own left nav), used by the L1 rail item,
//     which draws its own L2 SideNav and behaves like any other module — the "Super
//     agent as one more module" story. Its L2 drives the iframe via `navigate`.
//
// `enter` fires once each time the host opens/enters Super agent, and its `isNewUser`
// flag picks which of the prototype's own two entry functions to mirror:
//   - isNewUser=true  -> `{ type: 'superagent:enter-new' }`, mirroring replayOnboarding():
//     a genuine "sign up from scratch" — auth (sign-up) then the full onboarding
//     question flow, resetting any prior setup. Used by the Website gate's "new user".
//   - isNewUser=false/undefined -> `{ type: 'superagent:enter' }`, mirroring openSuper():
//     skip straight to a short onboarding the first time, or straight to the workspace
//     on every visit after (decided by the iframe's own setup.onboarded). Used by the
//     TopBar AppSwitcher and the embedded L1 module.
// `navigate` fires when the embedded module's L2 is clicked, posting
// `{ type: 'superagent:navigate', key }` to force the workspace open at that nav key.
// Both message types are queued if the iframe hasn't fired its `load` event yet (a
// message posted before the iframe's script has run and attached its listener is
// silently dropped) and flushed once it has.
//
// Kept mounted (hidden via CSS, not unmounted) once opened, because the prototype
// compiles its own JSX on load — remounting it every time someone reopens it would
// cost a 1-3s blank frame.
export function SuperAgentApp({
  active,
  title = 'Super agent',
  mode = 'overlay',
  context,
  enter,
  navigate,
  openAgentCmd,
  useLibraryCmd,
  onBackToBirdeye,
  onCloseAgent,
  onOpenAgent,
  onGoConnections,
}: SuperAgentAppProps) {
  const frameRef = useRef<HTMLIFrameElement>(null)
  const loadedRef = useRef(false)
  const pendingRef = useRef<Array<Record<string, unknown>>>([])
  // In 'embedded' mode the iframe is only sized to the L2 content pane, next to the
  // host's own L1 rail and TopBar. The prototype's modals/drawers are `position: fixed`,
  // which can only ever cover the iframe's own box — never the host chrome outside it.
  // So the prototype posts 'superagent:overlay-open'/'-close' around every one of its
  // own full-screen overlays; while any are open, promote this iframe itself to a
  // full-viewport fixed layer (mirroring 'overlay' mode) so the dialog reads as covering
  // the whole app. A count (not a flag) survives overlays opening on top of each other.
  const overlayCountRef = useRef(0)
  const [overlayOpen, setOverlayOpen] = useState(false)
  // The channel preview ("Your agents, in the apps you already use") used to be a
  // second, independently-drifting implementation baked into the prototype itself
  // (its own ChannelPreview + per-app mocks). Every trigger inside the iframe — the
  // Connections tab, the agent chat tab's channel banner, the prototype's own
  // internal Connections page — now posts this message instead of rendering its own
  // copy, so there is exactly one implementation (this one, also used directly by
  // the native SuperAgentConnectionsScreen) regardless of which surface opened it.
  const [channelPreview, setChannelPreview] = useState<ChannelKey | null>(null)

  function send(message: Record<string, unknown>) {
    if (loadedRef.current) {
      frameRef.current?.contentWindow?.postMessage(message, '*')
    } else {
      pendingRef.current.push(message)
    }
  }

  function handleLoad() {
    loadedRef.current = true
    for (const message of pendingRef.current) {
      frameRef.current?.contentWindow?.postMessage(message, '*')
    }
    pendingRef.current = []
  }

  useEffect(() => {
    if (!enter) return
    send({ type: enter.isNewUser ? 'superagent:enter-new' : 'superagent:enter' })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enter])

  useEffect(() => {
    if (!navigate) return
    send({ type: 'superagent:navigate', key: navigate.key })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigate])

  useEffect(() => {
    if (!openAgentCmd) return
    send({ type: 'superagent:open-agent', id: openAgentCmd.id })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openAgentCmd])

  useEffect(() => {
    if (!useLibraryCmd) return
    send({ type: 'superagent:use-library-agent', key: useLibraryCmd.key })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [useLibraryCmd])

  // The prototype's own "Back to Birdeye" action (overlay), the embedded
  // AgentScreen's back chevron (embedded, see app.jsx's EMBED_NO_CHROME branch), and
  // its `openAgent()` (fired whenever the iframe navigates itself into an agent view —
  // including entry points the host never itself commanded, like Create agent's own
  // "Set up") all post a message back here rather than trying to navigate/inspect the
  // host directly.
  useEffect(() => {
    const onMessage = (e: MessageEvent) => {
      if (e.data?.type === 'superagent:back-to-birdeye') onBackToBirdeye?.()
      if (e.data?.type === 'superagent:close-agent') onCloseAgent?.()
      if (e.data?.type === 'superagent:agent-opened') onOpenAgent?.()
      if (e.data?.type === 'superagent:go-connections') onGoConnections?.()
      if (e.data?.type === 'superagent:show-channel-preview' && e.data.channel) {
        setChannelPreview(e.data.channel as ChannelKey)
      }
      if (e.data?.type === 'superagent:overlay-open') {
        overlayCountRef.current += 1
        setOverlayOpen(true)
      }
      if (e.data?.type === 'superagent:overlay-close') {
        overlayCountRef.current = Math.max(0, overlayCountRef.current - 1)
        if (overlayCountRef.current === 0) setOverlayOpen(false)
      }
    }
    window.addEventListener('message', onMessage)
    return () => window.removeEventListener('message', onMessage)
  }, [onBackToBirdeye, onCloseAgent, onOpenAgent, onGoConnections])

  const containerClass = active
    ? mode === 'overlay'
      ? 'fixed inset-0 z-50 h-screen w-screen'
      : overlayOpen
        // IconRail's own expanded/flyout layer is z-[70] (see IconRail.tsx) — this
        // has to clear that (and its z-[60] dropdowns) or the L1 rail paints on top
        // of the promoted iframe instead of being covered by it.
        ? 'fixed inset-0 z-[80] h-screen w-screen'
        // 'embedded' sits below a sticky header as a flex-col sibling (see App.tsx) —
        // flex-1/min-h-0 fills the remaining space instead of `h-full`, which would
        // measure against the whole <main>, not the space left after the header.
        : 'flex-1 min-h-0 w-full bg-white'
    : 'hidden'

  return (
    <div className={containerClass}>
      <iframe
        ref={frameRef}
        onLoad={handleLoad}
        src={`${import.meta.env.BASE_URL}super-agent-prototype.html${mode === 'embedded' ? `?stage=app&chrome=none${context ? `&context=${context}` : ''}` : ''}`}
        title={title}
        className="h-full w-full border-0"
      />
      {active && channelPreview && (
        <ChannelPreviewModal channel={channelPreview} onClose={() => setChannelPreview(null)} />
      )}
    </div>
  )
}
