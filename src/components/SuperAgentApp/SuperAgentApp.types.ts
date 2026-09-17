export interface SuperAgentEnterCommand {
  /** a new value every time the host opens the Super agent overlay, so the
   *  postMessage effect fires again on a repeat visit */
  ts: number
  /** true = the Website gate's "New user" choice — a genuine "sign up from
   *  scratch" (mirrors the prototype's own replayOnboarding(): auth sign-up
   *  then the full onboarding question flow, resetting any prior setup).
   *  false/undefined = re-entry via the TopBar AppSwitcher or the embedded L1
   *  module (mirrors the prototype's own openSuper(): skip straight to a
   *  short onboarding the first time, or straight to the workspace after). */
  isNewUser?: boolean
}

export interface SuperAgentNavigateCommand {
  /** the prototype's own nav key: 'create' | 'agents' | 'market' | 'connections' */
  key: string
  /** a new value on every click, even for a repeat of the same key, so the
   *  postMessage effect fires again instead of bailing on an unchanged dep */
  ts: number
}

export interface SuperAgentOpenAgentCommand {
  /** an id already in the prototype's `app.agents` list (e.g. 'review-response') */
  id: string
  ts: number
}

export interface SuperAgentUseLibraryCommand {
  /** a key from the prototype's own LIB_AGENTS (e.g. 'front-desk') */
  key: string
  ts: number
}

export interface SuperAgentRoleCommand {
  /** the pillar the active role is scoped to, or 'all' for an Executive-tier role —
   *  see superAgentSeedData.ts's SuperAgentRole.pillars */
  pillar: 'jay' | 'myna' | 'robin' | 'all'
  /** a new value on every role switch, even a repeat, so the postMessage effect
   *  fires again instead of bailing on an unchanged dep */
  ts: number
}

export interface SuperAgentAppProps {
  /** false keeps the iframe mounted but hidden, so it only boots once */
  active: boolean
  title?: string
  /** 'overlay' (default) = full-viewport fixed layer with the prototype's own left
   *  nav visible, independent of the dashboard's L1/L2 — used by the Website gate
   *  and the TopBar AppSwitcher for the "standalone app" experience.
   *  'embedded' = sized to fill its container with the prototype's own left nav
   *  hidden (`?chrome=none`) — used by the L1 rail item, which draws its own L2
   *  SideNav and behaves like any other module. */
  mode?: 'overlay' | 'embedded'
  /** passed through as `?context=` on the iframe URL (embedded mode only) — lets the
   *  prototype tailor copy to whichever host surface it's dropped into (e.g.
   *  `'frontdesk'` for the Front Desk product's own create-agent flow, which shows
   *  Front Desk's own agent family names instead of the generic library ones). */
  context?: string
  /** bumped once every time the host opens/enters Super agent — see SuperAgentEnterCommand */
  enter?: SuperAgentEnterCommand | null
  /** set by the embedded module's L2 to force the iframe into the workspace at a
   *  given nav key, regardless of what it's currently showing */
  navigate?: SuperAgentNavigateCommand | null
  /** set by the native My agents screen's "Open agent" button — opens an already-
   *  active agent's full AgentScreen (Chat/Workflow/Approvals/... tabs) inside the
   *  iframe. Only meaningful in 'embedded' mode. */
  openAgentCmd?: SuperAgentOpenAgentCommand | null
  /** set by the native Library screen's "Use agent" button — drafts (or reopens) an
   *  agent from the prototype's own library and opens its AgentScreen. Only
   *  meaningful in 'embedded' mode. */
  useLibraryCmd?: SuperAgentUseLibraryCommand | null
  /** set whenever the host's active role changes — lets the iframe's Create agent
   *  landing bias its "Recommended for you" cards and default prompt toward that
   *  role's pillar. Only meaningful in 'embedded' mode. Shortcut, not full role
   *  parity: every other iframe surface (Library, Knowledge, Connections, channel
   *  previews) is unaffected. */
  role?: SuperAgentRoleCommand | null
  /** called when the person clicks the prototype's own "Back to Birdeye" switcher
   *  inside the iframe — the host closes the overlay to reveal its real Dashboard.
   *  Only meaningful in 'overlay' mode. */
  onBackToBirdeye?: () => void
  /** called when the person clicks the back chevron the prototype's AgentScreen
   *  shows only in embedded mode (see app.jsx's `EMBED_NO_CHROME` branch) — the host
   *  hides the iframe and reveals the native My agents/Library screen underneath.
   *  Only meaningful in 'embedded' mode. */
  onCloseAgent?: () => void
  /** called whenever the iframe navigates itself into an agent's AgentScreen while
   *  embedded — including entry points the host never itself commanded (e.g.
   *  Create agent's own "Set up"/"describe a workflow" flows), not just the
   *  `openAgentCmd`/`useLibraryCmd` the host issues. The host uses this to hide its
   *  L2 SideNav so the AgentScreen reads as a full-page experience, same as agents
   *  opened from My agents/Library. Only meaningful in 'embedded' mode. */
  onOpenAgent?: () => void
  /** called when the person clicks the prototype's own AgentScreen "Browse
   *  connections" button (Connections tab) while embedded — the host closes the
   *  iframe's agent view and switches its own L2 to the native Connections screen,
   *  instead of the iframe silently swapping to its own internal connections page
   *  underneath a host chrome that still thinks an agent is open. Only meaningful
   *  in 'embedded' mode. */
  onGoConnections?: () => void
  /** Gates which agents' messages appear in a channel preview thread opened from
   *  inside the iframe (e.g. an agent's own Chat tab "chat from another app" bottom
   *  sheet) — the same role-based filtering `SuperAgentConnectionsScreen` applies,
   *  computed by the host via `getChannelPreviewVisibleAgentIds` so both entry points
   *  stay in sync. Undefined means no filtering (Executive). */
  visibleAgentIds?: string[]
}
