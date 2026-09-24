import { useEffect, useRef, useState } from 'react'

/** Types a string out character-by-character; fires `onDone` once complete. Shared by the
 *  create-flow chats in `AgentDetailScreen` and the Jay & Robin create flow. */
export function useTypewriter(
  text: string,
  { charsPerTick = 4, intervalMs = 16, startDelayMs = 0, onDone }: {
    charsPerTick?: number
    intervalMs?: number
    startDelayMs?: number
    onDone?: () => void
  } = {},
) {
  const [typed, setTyped] = useState('')
  const onDoneRef = useRef(onDone)
  onDoneRef.current = onDone

  useEffect(() => {
    setTyped('')
    let i = 0
    let interval: number | undefined
    const start = window.setTimeout(() => {
      interval = window.setInterval(() => {
        i += charsPerTick
        setTyped(text.slice(0, i))
        if (i >= text.length) {
          window.clearInterval(interval)
          onDoneRef.current?.()
        }
      }, intervalMs)
    }, startDelayMs)
    return () => {
      window.clearTimeout(start)
      if (interval) window.clearInterval(interval)
    }
  }, [text, charsPerTick, intervalMs, startDelayMs])

  return { typed, done: typed.length >= text.length }
}
