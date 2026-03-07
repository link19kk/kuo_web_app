import { useState, useRef, useEffect, useCallback, KeyboardEvent } from 'react'
import './App.css'
import ChatMessage, { Message } from './components/ChatMessage'
import TypingIndicator from './components/TypingIndicator'

let idCounter = 0
const uid = () => `msg-${++idCounter}`

const BOOT_LINES = [
  'GEMINI_TERMINAL v1.0.0 — initializing...',
  'Establishing secure connection to Google Gemini API...',
  'Session authenticated. Ready for input.',
]

export default function App() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput]       = useState('')
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState<string | null>(null)
  const [bootDone, setBootDone] = useState(false)
  const [visibleBoot, setVisibleBoot] = useState<string[]>([])

  const bottomRef  = useRef<HTMLDivElement>(null)
  const inputRef   = useRef<HTMLInputElement>(null)

  // Staggered boot sequence
  useEffect(() => {
    const timeoutIds: number[] = []

    // Reset boot state for hot-reload/remount scenarios in development.
    setVisibleBoot([])
    setBootDone(false)

    BOOT_LINES.forEach((line, i) => {
      const lineTimer = window.setTimeout(() => {
        setVisibleBoot(prev => [...prev, line])
        if (i === BOOT_LINES.length - 1) {
          const doneTimer = window.setTimeout(() => setBootDone(true), 300)
          timeoutIds.push(doneTimer)
        }
      }, i * 600)

      timeoutIds.push(lineTimer)
    })

    return () => {
      timeoutIds.forEach(id => window.clearTimeout(id))
    }
  }, [])

  // Auto-scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  // Focus input after boot
  useEffect(() => {
    if (bootDone) inputRef.current?.focus()
  }, [bootDone])

  const sendMessage = useCallback(async () => {
    const text = input.trim()
    if (!text || loading) return

    setInput('')
    setError(null)

    const userMsg: Message = {
      id:        uid(),
      role:      'user',
      content:   text,
      timestamp: new Date(),
    }

    setMessages(prev => [...prev, userMsg])
    setLoading(true)

    try {
      const allMessages = [...messages, userMsg]
      const res = await fetch('/api/chat', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: allMessages.map(m => ({ role: m.role, content: m.content })),
        }),
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err?.detail ?? `HTTP ${res.status}`)
      }

      const data = await res.json()
      setMessages(prev => [
        ...prev,
        { id: uid(), role: 'assistant', content: data.content, timestamp: new Date() },
      ])
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Unknown error'
      setError(msg)
      setMessages(prev => [
        ...prev,
        {
          id:        uid(),
          role:      'assistant',
          content:   `ERROR: ${msg}`,
          timestamp: new Date(),
        },
      ])
    } finally {
      setLoading(false)
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [input, loading, messages])

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const handleClear = () => {
    setMessages([])
    setError(null)
    inputRef.current?.focus()
  }

  return (
    <div className="terminal">
      {/* Scanlines overlay */}
      <div className="terminal__scanlines" aria-hidden />

      {/* Header */}
      <header className="terminal__header">
        <div className="terminal__title">
          <span className="terminal__title-bracket">┌</span>
          <span className="terminal__title-text">GEMINI_TERMINAL</span>
          <span className="terminal__title-version">v1.0.0</span>
        </div>
        <div className="terminal__controls">
          <button className="ctrl ctrl--red"    title="Close"    aria-label="Close" />
          <button className="ctrl ctrl--yellow" title="Minimize" aria-label="Minimize" />
          <button className="ctrl ctrl--green"  title="Expand"   aria-label="Expand" />
        </div>
      </header>

      {/* Status bar */}
      <div className="terminal__statusbar">
        <span className="status-dot" />
        <span className="status-text">GEMINI-2.5-FLASH</span>
        <span className="status-sep">│</span>
        <span className="status-text">{messages.length} MSG{messages.length !== 1 ? 'S' : ''}</span>
        {error && (
          <>
            <span className="status-sep">│</span>
            <span className="status-text status-text--error">ERR</span>
          </>
        )}
        <div className="status-spacer" />
        <button className="status-btn" onClick={handleClear}>CLR</button>
      </div>

      {/* Body */}
      <main className="terminal__body">
        {/* Boot sequence */}
        <div className="boot">
          {visibleBoot.map((line, i) => (
            <p key={i} className="boot__line" style={{ animationDelay: `${i * 0.05}s` }}>
              <span className="boot__prompt">&gt;&nbsp;</span>
              {line}
            </p>
          ))}
          {bootDone && <div className="boot__divider" />}
        </div>

        {/* Messages */}
        {messages.map(msg => (
          <ChatMessage key={msg.id} message={msg} />
        ))}

        {loading && <TypingIndicator />}

        <div ref={bottomRef} />
      </main>

      {/* Input */}
      <footer className="terminal__footer">
        <span className="terminal__prompt">
          <span className="prompt-arrow">&gt;</span>
        </span>
        <input
          ref={inputRef}
          type="text"
          className="terminal__input"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={bootDone ? 'Enter your message...' : 'Initializing...'}
          disabled={!bootDone || loading}
          autoComplete="off"
          spellCheck={false}
        />
        <button
          className={`terminal__send ${loading ? 'terminal__send--busy' : ''}`}
          onClick={sendMessage}
          disabled={!bootDone || loading || !input.trim()}
          aria-label="Send"
        >
          {loading ? '■ WAIT' : '▶ SEND'}
        </button>
      </footer>
    </div>
  )
}
