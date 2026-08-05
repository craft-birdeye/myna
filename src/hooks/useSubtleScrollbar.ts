import { useEffect, type RefObject } from 'react'

/** Shows `.scrollbar-subtle` thumb only while the element is being scrolled. */
export function useSubtleScrollbar(
  ref: RefObject<HTMLElement | null>,
  active = true,
  fadeMs = 700,
) {
  useEffect(() => {
    if (!active) return
    const el = ref.current
    if (!el) return

    let timer: number | undefined
    const onScroll = () => {
      el.classList.add('is-scrolling')
      window.clearTimeout(timer)
      timer = window.setTimeout(() => {
        el.classList.remove('is-scrolling')
      }, fadeMs)
    }

    el.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      el.removeEventListener('scroll', onScroll)
      window.clearTimeout(timer)
      el.classList.remove('is-scrolling')
    }
  }, [ref, active, fadeMs])
}
