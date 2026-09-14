import { useEffect, useRef } from 'react'
import { SuperAgentAppProps } from './SuperAgentApp.types'

// Embeds the self-contained Super Agent prototype (public/super-agent-prototype.html)
// as a full-page layer, independent of the Birdeye Dashboard's own L1/L2 nav — the
// iframe draws its own chrome entirely (its own left nav, its own "Birdeye ⌄"
// switcher), so this is NOT one more railActive destination inside the dashboard
// shell. `active` renders it as a fixed, full-viewport overlay stacked on top of the
// mounted Dashboard; the person leaves it via the prototype's own "Back to Birdeye"
// action, which posts a message back here (see onBackToBirdeye below).
//
// `enter` fires once each time the host opens the overlay, and its `isNewUser` flag
// picks which of the prototype's own two entry functions to mirror:
//   - isNewUser=true  -> `{ type: 'superagent:enter-new' }`, mirroring replayOnboarding():
//     a genuine "sign up from scratch" — auth (sign-up) then the full onboarding
//     question flow, resetting any prior setup. Used by the Website gate's "new user".
//   - isNewUser=false/undefined -> `{ type: 'superagent:enter' }`, mirroring openSuper():
//     skip straight to a short onboarding the first time, or straight to the workspace
//     on every visit after (decided by the iframe's own setup.onboarded). Used by the
//     TopBar AppSwitcher and the L1 rail item.
// A message posted before the iframe has loaded its own script and attached its
// listener is silently dropped, so it's queued and flushed once the iframe's `load`
// event fires (by then its inline script has already run and React has mounted,
// since there are no external resources to wait on).
//
// Kept mounted (hidden via CSS, not unmounted) once opened, because the prototype
// compiles its own JSX on load — remounting it every time someone reopens it would
// cost a 1-3s blank frame.
export function SuperAgentApp({ active, title = 'Super agent', enter, onBackToBirdeye }: SuperAgentAppProps) {
  const frameRef = useRef<HTMLIFrameElement>(null)
  const loadedRef = useRef(false)
  const pendingRef = useRef<Array<Record<string, unknown>>>([])

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

  // The prototype's own "Back to Birdeye" action posts this from inside the iframe.
  useEffect(() => {
    const onMessage = (e: MessageEvent) => {
      if (e.data?.type === 'superagent:back-to-birdeye') onBackToBirdeye?.()
    }
    window.addEventListener('message', onMessage)
    return () => window.removeEventListener('message', onMessage)
  }, [onBackToBirdeye])

  return (
    <div className={active ? 'fixed inset-0 z-50 h-screen w-screen' : 'hidden'}>
      <iframe
        ref={frameRef}
        onLoad={handleLoad}
        src={`${import.meta.env.BASE_URL}super-agent-prototype.html`}
        title={title}
        className="h-full w-full border-0"
      />
    </div>
  )
}
